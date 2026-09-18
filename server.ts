import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Vite middleware in dev; static files & SPA fallback in prod
  const distPath = path.resolve(process.cwd(), 'dist');
  const distIndexPath = path.join(distPath, 'index.html');
  const hasDist = fs.existsSync(distIndexPath);

  const isProduction = process.env.NODE_ENV === 'production' || hasDist;

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Explicit fallback for client-side navigation in development
    app.use('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api/')) {
        return res.status(404).json({ error: 'API route not found' });
      }
      try {
        const rootIndexPath = path.resolve(process.cwd(), 'index.html');
        let template = fs.readFileSync(rootIndexPath, 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    // Serve static compiled assets
    app.use(express.static(distPath));

    // Explicit portal routes to ensure shared client/editor links serve index.html with 200 OK
    const portalRoutes = [
      '/portal',
      '/portal/*',
      '/client-portal',
      '/client-portal/*',
      '/editor-portal',
      '/editor-portal/*',
      '/share',
      '/share/*',
    ];

    app.get(portalRoutes, (_req, res) => {
      res.sendFile(distIndexPath);
    });

    // Catch-all for SPA routes (excludes /api/ which was registered before)
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API route not found' });
      }
      res.sendFile(distIndexPath);
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Vidzyra CRM server running on port ${PORT}`);
  });
}

startServer();
