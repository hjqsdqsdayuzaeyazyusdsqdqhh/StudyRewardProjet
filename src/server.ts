import { createServer, IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';
import * as fs from 'fs';
import * as path from 'path';

const PORT = parseInt(process.env.PORT || '3000', 10);
const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
};

function getMimeType(ext: string): string {
  return MIME_TYPES[ext] || 'application/octet-stream';
}

async function serveStatic(req: IncomingMessage, res: ServerResponse, filePath: string): Promise<boolean> {
  const fullPath = path.join(process.cwd(), filePath);
  try {
    const stat = await fs.promises.stat(fullPath);
    if (stat.isFile()) {
      const ext = path.extname(fullPath).toLowerCase();
      const content = await fs.promises.readFile(fullPath);
      res.writeHead(200, { 'Content-Type': getMimeType(ext) });
      res.end(content);
      return true;
    }
  } catch {
    // file not found
  }
  return false;
}

const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  const pathname = url.pathname;

  try {
    // API routes
    if (pathname === '/api/studies' && req.method === 'GET') {
      const { getStudies } = await import('./services/study.service');
      const q = url.searchParams.get('q') || undefined;
      const category = url.searchParams.get('category') || undefined;
      const state = url.searchParams.get('state') || undefined;
      const city = url.searchParams.get('city') || undefined;
      const studyType = url.searchParams.get('studyType') || undefined;
      const status = url.searchParams.get('status') || undefined;
      const page = parseInt(url.searchParams.get('page') || '1', 10);
      const perPage = parseInt(url.searchParams.get('perPage') || '20', 10);
      const sort = url.searchParams.get('sort') || undefined;

      const result = await getStudies({ q, category, state, city, studyType, status, page, perPage, sort });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      return;
    }

    if (pathname.startsWith('/api/studies/') && req.method === 'GET') {
      const { getStudyByNctId } = await import('./services/study.service');
      const nctId = pathname.split('/api/studies/')[1];
      if (!nctId || !nctId.startsWith('NCT')) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid NCT ID' }));
        return;
      }
      const study = await getStudyByNctId(nctId);
      if (!study) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Study not found' }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(study));
      return;
    }

    if (pathname === '/api/categories' && req.method === 'GET') {
      const { getAllCategories } = await import('./services/study.service');
      const categories = await getAllCategories();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(categories));
      return;
    }

    if (pathname === '/api/states' && req.method === 'GET') {
      const { getAllStates } = await import('./services/study.service');
      const states = await getAllStates();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(states));
      return;
    }

    if (pathname === '/api/cities' && req.method === 'GET') {
      const { getAllCities } = await import('./services/study.service');
      const cities = await getAllCities();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(cities));
      return;
    }

    if (pathname === '/api/import' && req.method === 'POST') {
      const { importStudies } = await import('./services/import.service');
      const result = await importStudies({ maxPages: 5, pageSize: 100 });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      return;
    }

    // Serve JSON data files
    if (pathname.startsWith('/data/')) {
      const served = await serveStatic(req, res, pathname.replace(/^\//, ''));
      if (served) return;
    }

    // Serve static files (HTML, CSS, JS, assets)
    let filePath = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
    const served = await serveStatic(req, res, filePath);
    if (served) return;

    // Fallback: try index.html for clean URLs
    if (!pathname.includes('.')) {
      const htmlPath = filePath.endsWith('.html') ? filePath : filePath + '.html';
      const servedHtml = await serveStatic(req, res, htmlPath);
      if (servedHtml) return;
    }

    // 404
    const served404 = await serveStatic(req, res, '404.html');
    if (!served404) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  } catch (err) {
    console.error('Server error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal server error' }));
  }
});

server.listen(PORT, () => {
  console.log(`StudyReward server running at http://localhost:${PORT}`);
});
