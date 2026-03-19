const youtubedl = require('youtube-dl-exec');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ffmpeg = require('@ffmpeg-installer/ffmpeg');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const downloads = new Map();

async function analyzeMedia(url) {
  try {
    const info = await youtubedl(`"${url}"`, {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true
    });

    let qualities = [];
    if (info.formats) {
      qualities = [...new Set(
        info.formats
          .filter(f => f.resolution && f.resolution !== 'audio only')
          .map(f => f.resolution || f.format_note)
          .filter(Boolean)
      )];
    }

    return {
      source: info.extractor || 'youtube',
      title: info.title || 'Unknown Title',
      thumbnail: info.thumbnail || null,
      duration: info.duration || 0,
      availableQualities: qualities,
    };
  } catch (error) {
    throw new Error(error.message || 'Unknown yt-dlp error');
  }
}

async function startDownload({ url, format, quality, io }) {
  const id = crypto.randomUUID();
  const titleSlug = `media_${id}`;
  const filename = `${titleSlug}.${format}`;
  const outputPath = path.join(UPLOADS_DIR, filename);

  downloads.set(id, { id, status: 'processing', progress: 0, path: outputPath, filename });

  const flags = {
    noCheckCertificates: true,
    noWarnings: true,
    ffmpegLocation: `"${ffmpeg.path}"`
  };

  if (format === 'mp3' || format === 'wav') {
    flags.extractAudio = true;
    flags.audioFormat = format;
    flags.audioQuality = 0; // best
    flags.output = `"${path.join(UPLOADS_DIR, `${titleSlug}.%(ext)s`)}"`; 
  } else {
    flags.format = `bestvideo[ext=${format}]+bestaudio[ext=m4a]/best[ext=${format}]/best`;
    flags.mergeOutputFormat = format;
    flags.output = `"${outputPath}"`;
  }

  const subprocess = youtubedl.exec(`"${url}"`, flags);

  subprocess.stdout.on('data', (data) => {
    const output = data.toString();
    const progressMatch = output.match(/\[download\]\s+([\d.]+)%/);
    if (progressMatch) {
      const percentage = parseFloat(progressMatch[1]);
      io.emit(`progress:${id}`, { status: 'downloading', progress: percentage });
      const currentData = downloads.get(id);
      if (currentData) {
        currentData.progress = percentage;
        downloads.set(id, currentData);
      }
    }
    if (output.includes('[ExtractAudio]')) {
       io.emit(`progress:${id}`, { status: 'converting', message: 'Converting audio format...' });
    }
  });

  subprocess.stderr.on('data', (data) => {
    // Only log if it's a real error, yt-dlp writes some info to stderr too
    if (data.toString().toLowerCase().includes('error')) {
      console.error(`yt-dlp error: ${data}`);
    }
  });

  subprocess.on('close', (code) => {
    if (code === 0) {
      downloads.set(id, { ...downloads.get(id), status: 'completed', progress: 100 });
      io.emit(`progress:${id}`, { status: 'completed', progress: 100, downloadUrl: `/api/media/download/${id}` });
    } else {
      downloads.set(id, { ...downloads.get(id), status: 'error', error: `Process exited with code ${code}` });
      io.emit(`progress:${id}`, { status: 'error', message: `Download failed across all mirrors` });
    }
  });

  return id;
}

async function getFile(id) {
  const download = downloads.get(id);
  if (download && download.status === 'completed') {
    return download;
  }
  return null;
}

module.exports = {
  analyzeMedia,
  startDownload,
  getFile
};
