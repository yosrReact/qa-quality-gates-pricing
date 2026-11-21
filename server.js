// Petit serveur statique sans dépendance : sert public/ et src/.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const PORT = process.env.PORT || 3000;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };

http.createServer(async (req, res) => {
  const url = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  const fichier = url.startsWith('/src/')
    ? normalize(join('.', url))
    : normalize(join('public', url));
  if (fichier.startsWith('..')) { res.writeHead(403).end(); return; }
  try {
    const contenu = await readFile(fichier);
    res.writeHead(200, { 'Content-Type': types[extname(fichier)] || 'text/plain' }).end(contenu);
  } catch {
    res.writeHead(404).end('Introuvable');
  }
}).listen(PORT, () => console.log(`http://localhost:${PORT}`));
