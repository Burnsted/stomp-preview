import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');
const PORT = Number(process.argv[2] || process.env.HG_PORT || 8799);
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.md': 'text/markdown'
};

const server = http.createServer((req, res) => {
  let u = decodeURIComponent((req.url || '/').split('?')[0]);
  if (u.endsWith('/')) u += 'index.html';
  const fp = path.join(ROOT, u.replace(/^\//, ''));
  if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
    res.writeHead(404); res.end('missing'); return;
  }
  res.writeHead(200, {
    'Content-Type': mime[path.extname(fp)] || 'application/octet-stream',
    'Cache-Control': 'no-store'
  });
  fs.createReadStream(fp).pipe(res);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('static ' + ROOT + ' :' + PORT);
});
