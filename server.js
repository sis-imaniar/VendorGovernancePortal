import express from 'express';
import path from 'path';
import { apiMiddleware } from './server/api.js';

const app = express();
const PORT = process.env.PORT || 8080;

// 1. Integrasikan API middleware ke express untuk rute /api
app.use('/api', (req, res, next) => {
  // apiMiddleware menggunakan format connect/express, jadi bisa langsung dipanggil
  apiMiddleware(req, res, next).catch(next);
});

// 2. Sajikan file statis dari build React (folder dist)
const distPath = path.resolve(process.cwd(), 'dist');
app.use(express.static(distPath));

// 3. Fallback router untuk SPA (Single Page Application) React
app.get('{*path}', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});
 
// Start Server
app.listen(PORT, () => {
  console.log(`[Production Server] Running on port ${PORT}`);
  console.log(`[Production Server] Serving static files from ${distPath}`);
});
