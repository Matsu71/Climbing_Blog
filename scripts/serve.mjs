// Local preview of the built site at http://127.0.0.1:4173/Climbing_Blog/
//   npm run serve        (PORT=xxxx to change the port)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE } from '../src/site.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const port = Number(process.env.PORT ?? 4173);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.csv': 'text/csv; charset=utf-8', '.svg': 'image/svg+xml', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.png': 'image/png' };

createServer(async (req, res) => {
  const send = async (code, file) => {
    res.writeHead(code, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(req.method === 'HEAD' ? undefined : await readFile(file));
  };
  try {
    const { pathname } = new URL(req.url, 'http://localhost');
    if (pathname === '/' && SITE.base !== '/') {
      res.writeHead(302, { Location: SITE.base });
      return res.end();
    }
    if (!pathname.startsWith(SITE.base)) return send(404, resolve(root, '404.html'));
    let file = resolve(root, decodeURIComponent(pathname.slice(SITE.base.length)));
    if (file !== root && !file.startsWith(root + sep)) return send(404, resolve(root, '404.html'));
    if ((await stat(file)).isDirectory()) {
      if (!pathname.endsWith('/')) {
        res.writeHead(301, { Location: pathname + '/' });
        return res.end();
      }
      file = resolve(file, 'index.html');
    }
    return send(200, file);
  } catch {
    return send(404, resolve(root, '404.html'));
  }
}).listen(port, '127.0.0.1', () => console.log(`CRUX preview: http://127.0.0.1:${port}${SITE.base}`));
