const youtubedl = require('youtube-dl-exec');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ffmpeg = require('@ffmpeg-installer/ffmpeg');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const COOKIES_PATH = path.join(UPLOADS_DIR, 'youtube-cookies.txt');
if (process.env.YOUTUBE_COOKIES) {
  // If cookies are provided via env var (for Prod/Render), write them to a file
  fs.writeFileSync(COOKIES_PATH, process.env.YOUTUBE_COOKIES.replace(/\\n/g, '\n'), 'utf8');
}

function getAuthFlags() {
  const isWin = process.platform === 'win32';
  const flags = {
    extractorArgs: 'youtube:player-client=android'
  };
  
  if (process.env.YOUTUBE_COOKIES) {
    flags.cookies = isWin ? `"${COOKIES_PATH}"` : COOKIES_PATH;
  } else if (process.env.BROWSER_COOKIES || isWin) {
    // Fallback to local browser cookies for testing on Windows
    flags.cookiesFromBrowser = process.env.BROWSER_COOKIES || 'chrome';
  }
  return flags;
}

const downloads = new Map();

async function analyzeMedia(url) {
  try {
    const isWin = process.platform === 'win32';
    const info = await youtubedl(isWin ? `"${url}"` : url, {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      ...getAuthFlags()
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

  const isWin = process.platform === 'win32';
  const flags = {
    noCheckCertificates: true,
    noWarnings: true,
    ffmpegLocation: isWin ? `"${ffmpeg.path}"` : ffmpeg.path,
    ...getAuthFlags()
  };

  if (format === 'mp3' || format === 'wav') {
    flags.extractAudio = true;
    flags.audioFormat = format;
    flags.audioQuality = 0; // best
    const audioOut = path.join(UPLOADS_DIR, `${titleSlug}.%(ext)s`);
    flags.output = isWin ? `"${audioOut}"` : audioOut; 
  } else {
    // Rely on formatSort for max resolution to avoid "Requested format is not available"
    flags.format = 'bestvideo+bestaudio/best';
    
    let formatSort = [];
    if (quality && quality !== 'best') {
      const heightMatch = quality.match(/(\d+)/);
      if (heightMatch) {
         formatSort.push(`res:${heightMatch[1]}`);
      }
    }
    
    // Prefer the requested extension format natively if possible
    formatSort.push(`ext:${format}:m4a`);
    flags.formatSort = formatSort.join(',');
    
    flags.mergeOutputFormat = format;
    flags.output = isWin ? `"${outputPath}"` : outputPath;
  }

  const subprocess = youtubedl.exec(isWin ? `"${url}"` : url, flags);

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
