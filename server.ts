import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { apiApp } from './src/server/api';
import { createRateLimiter, securityHeaders } from './src/server/security';
import { printEnvReport } from './src/server/env';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import http from 'http';

function resolvePortAndHost() {
  const args = process.argv.slice(2);
  let cliPort: number | undefined;
  let cliHost: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--port' && args[i + 1]) {
      const p = parseInt(args[i + 1], 10);
      if (!Number.isNaN(p) && p > 0) cliPort = p;
      i++;
    } else if (args[i].startsWith('--port=')) {
      const p = parseInt(args[i].split('=')[1], 10);
      if (!Number.isNaN(p) && p > 0) cliPort = p;
    } else if (args[i] === '--host' && args[i + 1]) {
      cliHost = args[i + 1];
      i++;
    } else if (args[i].startsWith('--host=')) {
      cliHost = args[i].split('=')[1];
    }
  }

  const isDev = process.env.NODE_ENV !== 'production';
  // In development within AI Studio, port 3000 is required
  const port = cliPort ?? (isDev ? 3000 : (process.env.PORT ? parseInt(process.env.PORT, 10) : 3000));
  const host = cliHost || process.env.HOST || '0.0.0.0';

  return { port, host };
}

async function startServer() {
  printEnvReport();
  const app = express();
  app.disable('x-powered-by');
  if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);
  app.use(securityHeaders);

  const { port: PORT, host: HOST } = resolvePortAndHost();

  // Limit expensive AI calls before parsing request bodies.
  const configuredLimit = Number(process.env.AI_RATE_LIMIT_PER_MINUTE);
  const maxRequests = Number.isInteger(configuredLimit) && configuredLimit > 0 ? configuredLimit : 20;
  app.use('/api/gemini', createRateLimiter({ windowMs: 60_000, max: maxRequests }));

  // Mount backend API router
  app.use(apiApp);

  const httpServer = http.createServer(app);

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
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(PORT, HOST, () => {
    console.log(`Server running at http://${HOST}:${PORT}`);
  });
}

process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

startServer().catch((err) => {
  console.error('[startServer error]', err);
  process.exit(1);
});
