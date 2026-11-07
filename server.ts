import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { apiApp } from './src/server/api';
import { securityHeaders } from './src/server/security';
import { printEnvReport } from './src/server/env';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  printEnvReport();
  const app = express();
  app.disable('x-powered-by');
  if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);
  app.use(securityHeaders);
  const PORT = process.env.PORT || 3000;

  // Mount backend API router
  app.use(apiApp);

  if (process.env.NODE_ENV === 'production') {
    // Serve static assets from dist
    app.use(express.static(path.join(__dirname, 'dist'), { dotfiles: 'ignore', index: false, maxAge: '1h' }));

    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    // Development mode: mount Vite middleware for instant reload / SPA support
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: Number(PORT),
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
