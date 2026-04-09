import { spawn, execSync } from 'child_process';
import { existsSync, unlinkSync, createReadStream } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

// ── Detect binaries ────────────────────────────────────────
export function getYtDlpBin(): string {
  const candidates = ['yt-dlp', '/usr/local/bin/yt-dlp', '/usr/bin/yt-dlp'];
  for (const bin of candidates) {
    try { execSync(`${bin} --version`, { stdio: 'pipe' }); return bin; } catch { /* try next */ }
  }
  throw new Error('yt-dlp not found. Install: pip install yt-dlp');
}

function hasFfmpeg(): boolean {
  try { execSync('ffmpeg -version', { stdio: 'pipe' }); return true; } catch { return false; }
}

function isYouTube(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be');
}

export interface VideoFormat {
  format_id: string;
  ext: string;
  resolution: string;
  filesize?: number;
  vcodec: string;
  acodec: string;
  format_note: string;
  quality: number;
  is_audio_only: boolean;
}

export interface VideoInfo {
  title: string;
  thumbnail: string;
  duration: number;
  duration_fmt: string;
  uploader: string;
  extractor: string;
  description?: string;
  formats: VideoFormat[];
  source: 'ytdl' | 'ytdlp';
}

export function formatDuration(seconds: number): string {
  if (!seconds) return 'desconhecido';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatBytes(bytes?: number): string {
  if (!bytes) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let val = bytes; let i = 0;
  while (val >= 1024 && i < units.length - 1) { val /= 1024; i++; }
  return `~${val.toFixed(0)} ${units[i]}`;
}

// ── Translate yt-dlp errors ────────────────────────────────
function translateError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('sign in') || m.includes('bot') || m.includes('cookie'))
    return 'Este vídeo requer autenticação. Tente outro link.';
  if (m.includes('private'))           return 'Vídeo privado.';
  if (m.includes('not available'))     return 'Vídeo não disponível nesta região.';
  if (m.includes('unsupported'))       return 'URL não suportada. Verifique o link.';
  if (m.includes('403'))               return 'Acesso negado. Tente outro link.';
  if (m.includes('age') || m.includes('confirm')) return 'Vídeo com restrição de idade.';
  return msg.slice(0, 200);
}

// ── Run yt-dlp and return stdout ───────────────────────────
function runYtDlp(bin: string, args: string[], timeoutMs = 30000): Promise<string> {
  return new Promise((resolve, reject) => {
    let out = ''; let err = '';
    const proc = spawn(bin, args, { timeout: timeoutMs });
    proc.stdout.on('data', (c) => { out += c.toString(); });
    proc.stderr.on('data', (c) => { err += c.toString(); });
    proc.on('close', (code) => {
      if (code !== 0) return reject(new Error(err || `exit ${code}`));
      resolve(out);
    });
    proc.on('error', (e) => reject(new Error('yt-dlp: ' + e.message)));
  });
}

// ── YouTube via @distube/ytdl-core ─────────────────────────
async function getYouTubeInfo(url: string): Promise<VideoInfo> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ytdl = require('@distube/ytdl-core');
  const info = await ytdl.getInfo(url, {
    requestOptions: { headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15' } },
  });
  const d = info.videoDetails;
  const seen = new Set<string>();
  const formats: VideoFormat[] = [];

  // Add combined formats (video+audio) first
  for (const f of info.formats) {
    if (!f.qualityLabel) continue;
    const key = f.qualityLabel + f.container;
    if (seen.has(key)) continue;
    seen.add(key);
    formats.push({
      format_id:    f.itag.toString(),
      ext:          f.container || 'mp4',
      resolution:   f.qualityLabel,
      filesize:     f.contentLength ? parseInt(f.contentLength) : undefined,
      vcodec:       f.videoCodec || 'avc1',
      acodec:       f.audioCodec || 'none',
      format_note:  f.qualityLabel,
      quality:      f.height || 0,
      is_audio_only: false,
    });
  }

  // Add audio-only
  formats.push({
    format_id: 'audio_only', ext: 'mp3', resolution: 'audio only',
    vcodec: 'none', acodec: 'mp4a', format_note: 'MP3 audio',
    quality: 0, is_audio_only: true,
  });

  formats.sort((a, b) => b.quality - a.quality);

  return {
    title:       d.title || 'YouTube Video',
    thumbnail:   d.thumbnails?.slice(-1)[0]?.url || '',
    duration:    parseInt(d.lengthSeconds) || 0,
    duration_fmt: formatDuration(parseInt(d.lengthSeconds) || 0),
    uploader:    d.author?.name || 'YouTube',
    extractor:   'YouTube',
    description: d.description?.slice(0, 300),
    formats:     formats.slice(0, 12),
    source:      'ytdl',
  };
}

// ── Get video info ─────────────────────────────────────────
export async function getVideoInfo(url: string): Promise<VideoInfo> {
  if (isYouTube(url)) {
    try { return await getYouTubeInfo(url); }
    catch (err) {
      const msg = (err as Error).message.toLowerCase();
      throw new Error(
        msg.includes('age') ? 'Vídeo com restrição de idade.' :
        msg.includes('private') ? 'Vídeo privado.' :
        msg.includes('unavailable') ? 'Vídeo não disponível.' :
        'Não foi possível carregar este vídeo do YouTube.'
      );
    }
  }

  const bin = getYtDlpBin();
  try {
    const out = await runYtDlp(bin, ['--dump-json', '--no-warnings', '--no-playlist', url]);
    const data = JSON.parse(out);

    const seen = new Map<string, VideoFormat>();
    for (const f of (data.formats || []) as VideoFormat[]) {
      if (f.vcodec === 'none' && f.acodec === 'none') continue;
      const key = f.resolution || (f.vcodec === 'none' ? 'audio_' + f.acodec : f.resolution);
      if (!seen.has(key) || f.quality > (seen.get(key)?.quality || 0)) {
        seen.set(key, {
          format_id:    f.format_id,
          ext:          f.ext,
          resolution:   f.resolution || (f.vcodec === 'none' ? 'audio only' : 'unknown'),
          filesize:     f.filesize,
          vcodec:       f.vcodec,
          acodec:       f.acodec,
          format_note:  f.format_note || '',
          quality:      f.quality || 0,
          is_audio_only: f.vcodec === 'none',
        });
      }
    }

    const formats = Array.from(seen.values())
      .sort((a, b) => (a.is_audio_only ? 1 : 0) - (b.is_audio_only ? 1 : 0) || b.quality - a.quality)
      .slice(0, 12);

    return {
      title:       data.title || 'Vídeo',
      thumbnail:   data.thumbnail || '',
      duration:    data.duration || 0,
      duration_fmt: formatDuration(data.duration || 0),
      uploader:    data.uploader || data.channel || 'Desconhecido',
      extractor:   data.extractor_key || 'unknown',
      description: data.description?.slice(0, 300),
      formats,
      source:      'ytdlp',
    };
  } catch (err) {
    throw new Error(translateError((err as Error).message));
  }
}

// ── Download to temp file then stream ─────────────────────
// This avoids the pipe corruption issue when ffmpeg merges streams
export async function downloadToFile(params: {
  url: string;
  formatId: string;
  isAudio: boolean;
  onProgress?: (msg: string) => void;
}): Promise<{ filePath: string; filename: string; mimeType: string; cleanup: () => void }> {
  const { url, formatId, isAudio } = params;
  const tmpId = uuidv4().slice(0, 8);
  const ext = isAudio ? 'mp3' : 'mp4';
  const tmpFile = path.join(tmpdir(), `video-${tmpId}.${ext}`);

  if (isYouTube(url)) {
    await downloadYouTubeToFile(url, formatId, isAudio, tmpFile);
  } else {
    await downloadYtDlpToFile(url, formatId, isAudio, tmpFile);
  }

  // Get a clean filename from the video title
  let filename = `video.${ext}`;
  try {
    const infoOut = await runYtDlp(getYtDlpBin(), ['--print', 'title', '--no-warnings', url], 15000)
      .catch(() => '');
    if (infoOut.trim()) {
      filename = infoOut.trim()
        .replace(/[^\w\s\-]/g, '')
        .replace(/\s+/g, '_')
        .slice(0, 80) + `.${ext}`;
    }
  } catch { /* use default */ }

  return {
    filePath: tmpFile,
    filename,
    mimeType: isAudio ? 'audio/mpeg' : 'video/mp4',
    cleanup: () => {
      try { if (existsSync(tmpFile)) unlinkSync(tmpFile); } catch { /* ignore */ }
    },
  };
}

async function downloadYouTubeToFile(url: string, formatId: string, isAudio: boolean, outFile: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ytdl = require('@distube/ytdl-core');
  const { createWriteStream } = await import('fs');
  const { pipeline } = await import('stream/promises');

  const opts = isAudio
    ? { quality: 'highestaudio', filter: 'audioonly' as const }
    : { quality: formatId === 'best' ? 'highestvideo' : formatId,
        filter: 'audioandvideo' as const };

  const stream = ytdl(url, {
    ...opts,
    requestOptions: { headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15' } },
  });

  const writer = createWriteStream(outFile);
  await pipeline(stream, writer);
}

async function downloadYtDlpToFile(url: string, formatId: string, isAudio: boolean, outFile: string): Promise<void> {
  const bin = getYtDlpBin();
  const ffmpeg = hasFfmpeg();

  let args: string[];
  if (isAudio) {
    args = [
      '--no-warnings', '--no-playlist',
      '-x',                             // extract audio
      '--audio-format', 'mp3',
      '--audio-quality', '0',
      ...(ffmpeg ? [] : ['--no-post-overwrites']),
      '-o', outFile,
      url,
    ];
  } else {
    // Without ffmpeg: download best single-file format (video+audio already merged)
    // With ffmpeg: merge best video + best audio
    const fmt = ffmpeg
      ? (formatId === 'best' ? 'bestvideo+bestaudio' : `${formatId}+bestaudio/${formatId}`)
      : (formatId === 'best' ? 'best[ext=mp4]/best' : formatId);

    args = [
      '--no-warnings', '--no-playlist',
      '--format', fmt,
      ...(ffmpeg ? ['--merge-output-format', 'mp4'] : []),
      '-o', outFile,
      url,
    ];
  }

  await new Promise<void>((resolve, reject) => {
    const proc = spawn(bin, args, { timeout: 300000 });
    let errOut = '';
    proc.stderr.on('data', (c) => {
      const msg: string = c.toString();
      errOut += msg;
      logger.info('yt-dlp: ' + msg.trim().slice(0, 100));
    });
    proc.on('close', (code) => {
      if (code !== 0) return reject(new Error(errOut.slice(-300)));
      // yt-dlp may add extension — find the actual file
      resolve();
    });
    proc.on('error', (e) => reject(new Error('yt-dlp: ' + e.message)));
  });

  // yt-dlp sometimes changes extension — find it
  if (!existsSync(outFile)) {
    const base = outFile.replace(/\.[^.]+$/, '');
    for (const ext of ['mp4', 'webm', 'mkv', 'mp3', 'm4a', 'ogg']) {
      if (existsSync(`${base}.${ext}`)) {
        // rename to expected
        const { renameSync } = await import('fs');
        renameSync(`${base}.${ext}`, outFile);
        break;
      }
    }
  }
}
