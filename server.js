const express = require('express');
const path = require('path');
const fs = require('fs');
const { spawn, exec } = require('child_process');

const app = express();
const PORT = 3001;

// Configured paths for Mac
const YT_DLP_PATH = '/Users/user/.local/bin/yt-dlp';
const FFMPEG_PATH = '/opt/homebrew/bin/ffmpeg';
const DOWNLOADS_DIR = path.join(__dirname, 'downloads');

// Ensure downloads directory exists
if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

app.use(express.json());
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});
app.use(express.static(path.join(__dirname, 'public')));

// Helper to check if file exists
function getFileStats(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return {
      name: path.basename(filePath),
      size: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
      createdAt: stats.mtime,
    };
  } catch (e) {
    return null;
  }
}

// 1. Get List of Downloads
app.get('/api/downloads', (req, res) => {
  try {
    const files = fs.readdirSync(DOWNLOADS_DIR)
      .filter(file => file.endsWith('.mp3'))
      .map(file => getFileStats(path.join(DOWNLOADS_DIR, file)))
      .filter(Boolean)
      .sort((a, b) => b.createdAt - a.createdAt);

    res.json({ success: true, downloads: files });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Stream Download Progress (SSE)
app.get('/api/download-stream', (req, res) => {
  const url = req.query.url;
  if (!url) {
    res.writeHead(400, { 'Content-Type': 'text/event-stream' });
    res.write('data: ' + JSON.stringify({ type: 'error', message: 'URL is required' }) + '\n\n');
    res.end();
    return;
  }

  // Set SSE Headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  // Keep-alive ping every 15s
  const keepAlive = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 15000);

  const args = [
    '-x',
    '--audio-format', 'mp3',
    '--audio-quality', '0',
    '--ffmpeg-location', FFMPEG_PATH,
    '-o', path.join(DOWNLOADS_DIR, '%(title)s.%(ext)s'),
    '--no-playlist',
    '--progress',
    '--newline',
    url
  ];

  const child = spawn(YT_DLP_PATH, args);

  let currentTitle = 'Downloading audio...';
  let ffmpegStarted = false;

  child.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;

      // Extract title if available
      if (line.includes('[download] Destination:')) {
        const fullPath = line.substring(line.indexOf('Destination:') + 12).trim();
        currentTitle = path.basename(fullPath, path.extname(fullPath));
        res.write(`data: ${JSON.stringify({ type: 'title', title: currentTitle })}\n\n`);
      }

      // Check download progress
      const progressMatch = line.match(/\[download\]\s+(\d+\.?\d*)%\s+of/);
      if (progressMatch) {
        const percent = parseFloat(progressMatch[1]);
        res.write(`data: ${JSON.stringify({ type: 'progress', percent, status: 'Downloading' })}\n\n`);
      }

      // Check for ffmpeg conversion / audio extraction starting
      if (line.includes('[ExtractAudio]') || line.includes('[ffmpeg]')) {
        ffmpegStarted = true;
        res.write(`data: ${JSON.stringify({ type: 'status', status: 'Converting to MP3 (Optimizing for Earphones)...' })}\n\n`);
      }
    }
  });

  child.stderr.on('data', (data) => {
    const errorMsg = data.toString();
    console.error('yt-dlp stderr:', errorMsg);
    // Some warnings are written to stderr, only pass actual errors or log them
    if (errorMsg.includes('ERROR:')) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: errorMsg.replace('ERROR:', '').trim() })}\n\n`);
    }
  });

  child.on('close', (code) => {
    clearInterval(keepAlive);
    if (code === 0) {
      // Find the file we just created to send its info
      const files = fs.readdirSync(DOWNLOADS_DIR)
        .map(file => ({ name: file, stats: fs.statSync(path.join(DOWNLOADS_DIR, file)) }))
        .sort((a, b) => b.stats.mtime - a.stats.mtime);

      const latestFile = files.length > 0 ? {
        name: files[0].name,
        size: (files[0].stats.size / (1024 * 1024)).toFixed(2) + ' MB'
      } : null;

      res.write(`data: ${JSON.stringify({ type: 'complete', file: latestFile })}\n\n`);
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', message: `Download failed with exit code ${code}` })}\n\n`);
    }
    res.end();
  });

  req.on('close', () => {
    clearInterval(keepAlive);
    child.kill('SIGINT');
  });
});

// 3. Open Downloads Folder in macOS Finder
app.post('/api/open-folder', (req, res) => {
  exec(`open "${DOWNLOADS_DIR}"`, (error) => {
    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    res.json({ success: true, message: 'Folder opened in Finder' });
  });
});

// 4. Download file from browser (endpoint if they want to save directly via browser)
app.get('/api/download-file/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(DOWNLOADS_DIR, filename);

  if (fs.existsSync(filePath)) {
    res.download(filePath, filename);
  } else {
    res.status(404).json({ success: false, error: 'File not found' });
  }
});

// 5. Delete a download
app.delete('/api/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(DOWNLOADS_DIR, filename);

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true, message: 'File deleted' });
    } else {
      res.status(404).json({ success: false, error: 'File not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
