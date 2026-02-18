const http = require('http');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const { URL } = require('url');

const rootDir = __dirname;
const port = Number(process.env.PORT || 8080);

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
};

function safeResolve(requestPathname) {
  const decoded = decodeURIComponent(requestPathname);
  const cleaned = decoded.replace(/\0/g, '');
  const rel = cleaned.replace(/^\/+/, '');
  const abs = path.resolve(rootDir, rel);
  if (!abs.startsWith(rootDir)) return null;
  return abs;
}

async function fileExists(filePath) {
  try {
    const st = await fsp.stat(filePath);
    return st.isFile();
  } catch {
    return false;
  }
}

function send(res, statusCode, headers, body) {
  res.writeHead(statusCode, headers);
  res.end(body);
}

function sendFileStream(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const ct = mimeTypes[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': ct, 'Cache-Control': 'no-store' });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, `http://${req.headers.host}`);
    const pathname = u.pathname || '/';

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      send(res, 405, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Method Not Allowed');
      return;
    }

    let targetPath = pathname;
    if (targetPath === '/') targetPath = '/index.html';

    let abs = safeResolve(targetPath);
    if (abs && (await fileExists(abs))) {
      sendFileStream(res, abs);
      return;
    }

    // SPA fallback ONLY for routes without an extension (e.g. /admin-login, /admin)
    if (!path.posix.basename(pathname).includes('.')) {
      const indexAbs = path.resolve(rootDir, 'index.html');
      sendFileStream(res, indexAbs);
      return;
    }

    send(res, 404, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Not Found');
  } catch (e) {
    send(res, 500, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Server Error');
  }
});

server.listen(port, () => {
  console.log(`Local server running: http://localhost:${port}`);
  console.log(`Root: ${rootDir}`);
});
