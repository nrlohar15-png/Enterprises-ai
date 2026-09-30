import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { db } from './db/index.js';
import { seedDatabase } from './db/seed.js';

import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import tasksRoutes from './routes/tasks.js';
import projectsRoutes from './routes/projects.js';
import departmentsRoutes from './routes/departments.js';
import documentsRoutes from './routes/documents.js';
import meetingsRoutes from './routes/meetings.js';
import searchRoutes from './routes/search.js';
import aiRoutes from './routes/ai.js';
import insightsRoutes from './routes/insights.js';
import reportsRoutes from './routes/reports.js';
import activityRoutes from './routes/activity.js';
import commentsRoutes from './routes/comments.js';
import settingsRoutes from './routes/settings.js';
import { supabaseService } from './db/supabase.js';

const app = express();

// Security & Parsing Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Lazy DB initialization for serverless / container execution
let isDbReady = false;
let dbInitPromise: Promise<void> | null = null;

export async function ensureDatabaseReady() {
  if (isDbReady) return;
  if (!dbInitPromise) {
    dbInitPromise = (async () => {
      console.log('Initializing Enterprise Database...');
      await db.init();
      await seedDatabase();
      isDbReady = true;
      console.log('Enterprise Database initialized and ready.');
    })();
  }
  return dbInitPromise;
}

// Middleware to ensure DB is initialized before processing API requests
app.use('/api', async (req, res, next) => {
  try {
    await ensureDatabaseReady();
    next();
  } catch (err) {
    console.error('Database initialization failure:', err);
    res.status(500).json({ error: 'Database service initialization failed' });
  }
});

// Health check with Supabase Integration Status
app.get('/api/health', async (req, res) => {
  const supabaseStatus = await supabaseService.checkConnection();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Enterprise AI Operations Platform',
    version: '1.0.0',
    supabase: {
      connected: supabaseStatus.connected,
      message: supabaseStatus.message,
      url: process.env.SUPABASE_URL || null,
      jwks_url: process.env.SUPABASE_JWKS_URL || null,
    },
  });
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/departments', departmentsRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/meetings', meetingsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/settings', settingsRoutes);

// Global Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal enterprise server error' });
});

export default app;
