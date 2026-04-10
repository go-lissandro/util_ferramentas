import { Router, Request, Response } from 'express';
import { createReadStream, statSync } from 'fs';
import multer from 'multer';
import {
  getVideoInfo, downloadToFile, getYtDlpBin, formatBytes,
  hasCookies, saveCookies,
} from './video.service';
import { logger } from '../utils/logger';

export const videoRouter = Router();
const activeDownloads = new Map<string, number>();
const cookiesUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// ── GET /api/video/health ──────────────────────────────────
videoRouter.get('/health', (_req: Request, res: Response) => {
  try {
    const { execSync } = require('child_process');
    const bin = getYtDlpBin();
    const version = execSync(`${bin} --version`, { stdio: 'pipe' }).toString().trim();
    let ffmpeg = false;
    try { execSync('ffmpeg -version', { stdio: 'pipe' }); ffmpeg = true; } catch { /* none */ }
    return res.json({ available: true, version, ffmpeg, cookies: hasCookies() });
  } catch (err) {
    return res.status(503).json({ available: false, error: (err as Error).message });
  }
});

// ── POST /api/video/cookies ────────────────────────────────
videoRouter.post('/cookies', cookiesUpload.single('cookies'), (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  const content = req.file.buffer.toString('utf8');
  if (!content.includes('.youtube.com') && !content.includes('.google.com') && !content.includes('Netscape')) {
    return res.status(400).json({ error: 'Arquivo inválido. Use a extensão "Get cookies.txt LOCALLY".' });
  }
  saveCookies(content);
  return res.json({ success: true, message: 'Cookies salvos! YouTube desbloqueado.' });
});

// ── GET /api/video/cookies/status ─────────────────────────
videoRouter.get('/cookies/status', (_req: Request, res: Response) => {
  return res.json({ configured: hasCookies() });
});

// ── GET /api/video/info?url=... ────────────────────────────
videoRouter.get('/info', async (req: Request, res: Response) => {
  const { url } = req.query as { url: string };
  if (!url) return res.status(400).json({ error: 'url é obrigatório' });
  try { new URL(url); } catch { return res.status(400).json({ error: 'URL inválida' }); }

  try {
    const info = await getVideoInfo(url);
    return res.json({
      success: true,
      data: {
        ...info,
        formats: info.formats.map(f => ({
          id:           f.format_id,
          label:        buildLabel(f),
          ext:          f.ext,
          resolution:   f.resolution,
          filesize_fmt: formatBytes(f.filesize),
          is_audio_only: f.is_audio_only,
        })),
      },
    });
  } catch (err) {
    return res.status(422).json({ error: (err as Error).message });
  }
});

// ── GET /api/video/download ────────────────────────────────
// Downloads to temp file FIRST, then streams with Content-Length
videoRouter.get('/download', async (req: Request, res: Response) => {
  const { url, format = 'best', audio = 'false' } = req.query as Record<string, string>;
  if (!url) return res.status(400).json({ error: 'url é obrigatório' });
  try { new URL(url); } catch { return res.status(400).json({ error: 'URL inválida' }); }

  const key = req.ip || 'anon';
  if ((activeDownloads.get(key) || 0) >= 2) {
    return res.status(429).json({ error: 'Máximo 2 downloads simultâneos.' });
  }
  activeDownloads.set(key, (activeDownloads.get(key) || 0) + 1);

  const decrement = () => activeDownloads.set(key, Math.max(0, (activeDownloads.get(key) || 1) - 1));
  const isAudio = audio === 'true';

  try {
    logger.info(`Download: ${url} format=${format} audio=${isAudio}`);

    // Download to temp file first — required for ffmpeg merging and audio extraction
    const { filePath, filename, mimeType, cleanup } = await downloadToFile({ url, formatId: format, isAudio });

    // Get file size for Content-Length (critical for browser to show progress)
    const { size } = statSync(filePath);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', size);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.setHeader('Accept-Ranges', 'bytes');

    const stream = createReadStream(filePath);
    stream.pipe(res);

    stream.on('end', () => { cleanup(); decrement(); });
    stream.on('error', (err) => {
      cleanup(); decrement();
      if (!res.headersSent) res.status(500).json({ error: err.message });
    });
    req.on('close', () => { stream.destroy(); cleanup(); decrement(); });

  } catch (err) {
    decrement();
    logger.error('Download error: ' + (err as Error).message);
    if (!res.headersSent) {
      res.status(422).json({ error: (err as Error).message });
    }
  }
});

// ── GET /api/video/supported ───────────────────────────────
videoRouter.get('/supported', (_req: Request, res: Response) => {
  return res.json({
    success: true,
    cookiesConfigured: hasCookies(),
    sites: [
      { name: 'YouTube',    icon: '▶', note: hasCookies() ? 'funciona' : 'precisa cookies' },
      { name: 'Vimeo',      icon: '🎬', note: 'funciona — teste: vimeo.com/148751763' },
      { name: 'Instagram',  icon: '📷', note: 'funciona' },
      { name: 'TikTok',     icon: '♪',  note: 'funciona' },
      { name: 'Twitter/X',  icon: '𝕏',  note: 'funciona' },
      { name: 'Facebook',   icon: 'f',  note: 'funciona' },
      { name: 'Reddit',     icon: 'r/', note: 'funciona' },
      { name: 'Twitch',     icon: '🟣', note: 'clips e VODs' },
    ],
  });
});

function buildLabel(f: { resolution: string; ext: string; format_note: string; filesize?: number; is_audio_only: boolean }): string {
  if (f.is_audio_only) return `Somente áudio — MP3${f.filesize ? ' • ' + formatBytes(f.filesize) : ''}`;
  const note = f.format_note && f.format_note !== f.resolution ? ` — ${f.format_note}` : '';
  const size = f.filesize ? ` • ${formatBytes(f.filesize)}` : '';
  return `${f.resolution}${note} • ${f.ext.toUpperCase()}${size}`;
}
