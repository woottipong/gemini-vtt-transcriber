import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup needed for ES Modules to get __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Use PORT from environment for deployment compatibility
const PORT = process.env.PORT || 3001;
const KEEP_TEMP_FILES = process.env.KEEP_TEMP_FILES === 'true' || process.env.KEEP_TEMP_FILES === '1';

// Increase limit for potential large payloads
app.use(express.json({ limit: '50mb' }));
app.use(cors());

// Ensure temp directory exists
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

app.post('/api/process-youtube', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  console.log(`Received request for: ${url}`);

  const timestamp = Date.now();
  const outputBase = path.join(tempDir, `audio_${timestamp}`);

  // yt-dlp command: extract audio, convert to mp3, lowest quality (64k) for speech to save size
  const command = `yt-dlp --no-playlist -x --audio-format mp3 --audio-quality 64K -o "${outputBase}.%(ext)s" "${url}"`;

  // Increase maxBuffer to 10MB to prevent crash from verbose stdout
  exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Exec error: ${error.message}`);
      console.error(`Stderr: ${stderr}`);
      return res.status(500).json({ error: 'Download failed', details: stderr || error.message });
    }

    const expectedFilePath = `${outputBase}.mp3`;

    try {
      let filePath = expectedFilePath;

      if (!fs.existsSync(filePath)) {
        const candidates = fs
          .readdirSync(tempDir)
          .filter((name) => name.startsWith(`audio_${timestamp}.`))
          .map((name) => path.join(tempDir, name));

        const mp3Candidate = candidates.find((name) => name.endsWith('.mp3'));
        filePath = mp3Candidate || candidates[0];
      }

      if (!filePath || !fs.existsSync(filePath)) {
        const errorDetails = stderr?.trim() || 'No output file was produced.';
        throw new Error(`Output file was not created. Details: ${errorDetails}`);
      }

      console.log(`Processing file: ${filePath}`);
      const fileBuffer = fs.readFileSync(filePath);
      const base64 = fileBuffer.toString('base64');
      const stats = fs.statSync(filePath);

      // Clean up file immediately after reading unless explicitly kept
      if (!KEEP_TEMP_FILES) {
        fs.unlinkSync(filePath);
      }

      res.json({
        success: true,
        data: {
          name: `youtube_${timestamp}.mp3`,
          type: 'audio/mp3',
          size: stats.size,
          base64: base64
        }
      });

    } catch (readError) {
      console.error("File processing error:", readError);
      if (!KEEP_TEMP_FILES && fs.existsSync(filePath)) fs.unlinkSync(filePath);
      res.status(500).json({ error: 'Failed to process audio file' });
    }
  });
});

// SERVE STATIC FILES (Production)
if (process.env.NODE_ENV === 'production' || fs.existsSync(path.join(__dirname, 'dist'))) {
  app.use(express.static(path.join(__dirname, 'dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
});
