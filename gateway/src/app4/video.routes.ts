import { Router, Request, Response } from 'express';
import { createReadStream } from 'fs';
import { getVideoInfo, downloadToFile, getYtDlpBin, formatBytes } from './video.service';
import { logger } from '../utils/logger';

export const videoRouter = Router();

const activeDownloads = new Map<string, number>();

function userKey(req: Request): string {
  return req.ip || 'anonymous';
}

// ── GET /api/video/health ──────────────────────────────────
videoRouter.get('/health', (_req: Request, res: Response) => {
  try {
    const { execSync } = require('child_process');
    const bin = getYtDlpBin();
    const version = execSync(`${bin} --version`, { stdio: 'pipe' }).toString().trim();
    let ffmpeg = false;
    try { execSync('ffmpeg -version', { stdio: 'pipe' }); ffmpeg = true; } catch { /* no ffmpeg */ }
    return res.json({ available: true, binary: bin, version, ffmpeg });
  } catch (err) {
    return res.status(503).json({ available: false, error: (err as Error).message });
  }
});

// ── GET /api/video/info?url=... ────────────────────────────
videoRouter.get('/info', async (req: Request, res: Response) => {
  const { url } = req.query as { url: string };
  if (!url) return res.status(400).json({ error: 'Parâmetro url é obrigatório' });
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

// ── GET /api/video/download?url=...&format=...&audio=true ──
videoRouter.get('/download', async (req: Request, res: Response) => {
  const { url, format = 'best', audio = 'false' } = req.query as Record<string, string>;
  if (!url) return res.status(400).json({ error: 'Parâmetro url é obrigatório' });
  try { new URL(url); } catch { return res.status(400).json({ error: 'URL inválida' }); }

  const key = userKey(req);
  if ((activeDownloads.get(key) || 0) >= 2) {
    return res.status(429).json({ error: 'Máximo de 2 downloads simultâneos.' });
  }
  activeDownloads.set(key, (activeDownloads.get(key) || 0) + 1);

  const isAudio = audio === 'true';

  try {
    logger.info(`Download started: ${url} format=${format} audio=${isAudio}`);

    const { filePath, filename, mimeType, cleanup } = await downloadToFile({
      url,
      formatId: format,
      isAudio,
    });

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);

    const stream = createReadStream(filePath);
    stream.pipe(res);
    stream.on('end', () => {
      cleanup();
      const count = activeDownloads.get(key) || 1;
      activeDownloads.set(key, Math.max(0, count - 1));
    });
    stream.on('error', (err) => {
      cleanup();
      const count = activeDownloads.get(key) || 1;
      activeDownloads.set(key, Math.max(0, count - 1));
      if (!res.headersSent) res.status(500).json({ error: err.message });
    });

    req.on('close', () => { stream.destroy(); cleanup(); });

  } catch (err) {
    const count = activeDownloads.get(key) || 1;
    activeDownloads.set(key, Math.max(0, count - 1));
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
    data: [
      { name: 'YouTube',    domain: 'youtube.com',    engine: 'ytdl-core', note: 'funciona bem' },
      { name: 'Instagram',  domain: 'instagram.com',  engine: 'yt-dlp',    note: 'funciona bem' },
      { name: 'TikTok',     domain: 'tiktok.com',     engine: 'yt-dlp',    note: 'funciona bem' },
      { name: 'Twitter/X',  domain: 'twitter.com',    engine: 'yt-dlp',    note: 'funciona bem' },
      { name: 'Vimeo',      domain: 'vimeo.com',      engine: 'yt-dlp',    note: 'funciona bem' },
      { name: 'Facebook',   domain: 'facebook.com',   engine: 'yt-dlp',    note: 'funciona bem' },
      { name: 'Reddit',     domain: 'reddit.com',     engine: 'yt-dlp',    note: 'funciona bem' },
      { name: 'Twitch',     domain: 'twitch.tv',      engine: 'yt-dlp',    note: 'clips e VODs' },
      { name: 'Dailymotion',domain: 'dailymotion.com',engine: 'yt-dlp',    note: 'funciona bem' },
    ],
  });
});

function buildLabel(f: { resolution: string; ext: string; vcodec: string; format_note: string; filesize?: number; is_audio_only: boolean }): string {
  if (f.is_audio_only) return `Somente áudio • ${f.ext.toUpperCase()}`;
  const note = f.format_note && f.format_note !== f.resolution ? ` (${f.format_note})` : '';
  const size = f.filesize ? ` • ${formatBytes(f.filesize)}` : '';
  return `${f.resolution}${note} • ${f.ext.toUpperCase()}${size}`;
}
