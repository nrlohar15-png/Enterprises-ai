import 'dotenv/config';
import express from 'express';
import path from 'path';
import app, { ensureDatabaseReady } from './app.js';

const PORT = process.env.PORT || 5000;

// Production Client Static Serving
const clientDistPath = path.resolve(process.cwd(), 'dist/client');
app.use(express.static(clientDistPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(clientDistPath, 'index.html');
  res.sendFile(indexPath, err => {
    if (err) {
      res.status(404).send('Enterprise AI platform client is being built or running in Vite dev mode.');
    }
  });
});

async function startServer() {
  try {
    await ensureDatabaseReady();

    app.listen(PORT, () => {
      console.log(`\n======================================================`);
      console.log(`🚀 ENTERPRISE AI PLATFORM API ENGINE ONLINE`);
      console.log(`📡 URL: http://localhost:${PORT}`);
      console.log(`🛡️  Mode: ${process.env.NODE_ENV || 'development'}`);
      console.log(`⚡ Supabase: ${process.env.SUPABASE_URL || 'Disconnected'}`);
      console.log(`🤖 Gemini AI Engine: Ready`);
      console.log(`======================================================\n`);
    });
  } catch (error: any) {
    console.error('Fatal error starting server:', error);
    process.exit(1);
  }
}

startServer();
