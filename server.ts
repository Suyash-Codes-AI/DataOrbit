import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './server/routes/api.js';
import { getDb } from './server/db/postgres.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Router
app.use('/api', apiRouter);

// Serve static frontend in production
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

// Warm up DB and start server
getDb()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[AI Data Intelligence Platform] Production server running on http://0.0.0.0:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[AI Data Intelligence Platform] Failed to initialize database:', err);
    process.exit(1);
  });
