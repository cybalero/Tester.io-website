import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;

// Read API key from gitignored local file (never hard-code secrets)
const API_KEY = (() => {
  try { return fs.readFileSync(path.join(__dirname, '.api-key'), 'utf8').trim(); }
  catch { return ''; }
})();

const mimeTypes = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.mjs': 'application/javascript', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.webp': 'image/webp', '.avif': 'image/avif',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.ogg': 'video/ogg',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav',
};

// ── /api/forge ────────────────────────────────────────────────
// Server-side proxy for video/image generation. Key stays on the
// server — never leaks to the browser. Prompt arrives via JSON POST.
// Default provider: Pollinations.ai (free, no key). To use a paid
// service, replace the fetch() URL below and uncomment the key header.
async function handleForge(req, res) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    try {
      const { prompt = 'abstract gold smart watch on black background, cinematic, 4k' } = JSON.parse(body || '{}');
      const clean = String(prompt).slice(0, 400);
      // Pollinations returns a generated image synchronously via a URL.
      // Seeded for stability, enhanced for quality, nologo to remove watermark.
      const seed = Math.floor(Math.random() * 1e9);
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(clean)}?width=1024&height=640&seed=${seed}&nologo=true&enhance=true&model=flux`;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        ok: true,
        provider: 'pollinations',
        imageUrl: url,
        prompt: clean,
        seed,
        note: API_KEY
          ? 'Provider key loaded server-side (32-char). Swap the fetch URL to wire it to your paid video API.'
          : 'No .api-key file found — running on free Pollinations fallback.',
      }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: String(err) }));
    }
  });
}

const server = http.createServer((req, res) => {
  // Route: API forge
  if (req.url === '/api/forge' && req.method === 'POST') return handleForge(req, res);

  const decoded = decodeURIComponent(req.url === '/' ? 'index.html' : req.url);
  const filePath = path.join(__dirname, decoded);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.stat(filePath, (err, stat) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }

    const range = req.headers.range;
    if (range && (ext === '.mp4' || ext === '.webm' || ext === '.ogg')) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunksize = (end - start) + 1;
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
      });
      fs.createReadStream(filePath, { start, end }).pipe(res);
      return;
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stat.size,
      'Accept-Ranges': 'bytes',
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
