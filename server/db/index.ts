import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface QueryResult<T = any> {
  rows: T[];
  rowCount?: number;
}

class DatabaseService {
  private pgPool: pg.Pool | null = null;
  private pglite: any = null;
  private isInitialized = false;

  async init(): Promise<void> {
    if (this.isInitialized) return;

    const dbUrl = process.env.DATABASE_URL?.trim();

    if (dbUrl) {
      try {
        console.log('Attempting connection to external PostgreSQL database...');
        const isRemote = dbUrl.includes('supabase') || dbUrl.includes('amazonaws') || dbUrl.includes('render') || dbUrl.includes('neon.tech');
        const pool = new pg.Pool({
          connectionString: dbUrl,
          connectionTimeoutMillis: 5000,
          max: 5, // Keep connection count minimal to respect free tier RAM limits
          idleTimeoutMillis: 10000,
          ssl: isRemote ? { rejectUnauthorized: false } : undefined,
        });

        // Test connection
        await pool.query('SELECT 1');
        this.pgPool = pool;
        console.log('Connected successfully to PostgreSQL database.');
      } catch (err: any) {
        console.warn(`PostgreSQL connection failed (${err.message}). Falling back to embedded PostgreSQL (PGlite)...`);
        this.pgPool = null;
      }
    }

    if (!this.pgPool) {
      console.log('Initializing embedded PostgreSQL (PGlite engine)...');
      const { PGlite } = await import('@electric-sql/pglite');
      this.pglite = new PGlite();
      console.log('Embedded PostgreSQL engine ready.');
    }

    this.isInitialized = true;

    // Run migrations
    await this.runMigrations();
  }

  private async runMigrations(): Promise<void> {
    try {
      if (this.pgPool) {
        try {
          const check = await this.pgPool.query(
            "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations' LIMIT 1"
          );
          if (check.rows && check.rows.length > 0) {
            console.log('Cloud database schema already provisioned. Skipping migrations.');
            return;
          }
        } catch {
          // ignore check error and proceed
        }
      }

      const migrationPath = path.resolve(process.cwd(), 'migrations/001_initial_schema.sql');
      if (fs.existsSync(migrationPath)) {
        const sql = fs.readFileSync(migrationPath, 'utf-8');
        console.log('Applying database schema migrations...');
        if (this.pgPool) {
          await this.pgPool.query(sql);
        } else if (this.pglite) {
          await this.pglite.exec(sql);
        }
        console.log('Database schema migrations applied successfully.');
      }
    } catch (err: any) {
      console.warn('Migration note (continuing startup):', err.message);
    }
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
    if (!this.isInitialized) {
      await this.init();
    }

    try {
      if (this.pgPool) {
        const res = await this.pgPool.query(sql, params);
        return { rows: res.rows as T[], rowCount: res.rowCount ?? 0 };
      } else if (this.pglite) {
        const res = await this.pglite.query(sql, params);
        return { rows: (res.rows || []) as T[], rowCount: res.rows?.length ?? 0 };
      }
      throw new Error('Database driver not initialized');
    } catch (error: any) {
      console.error(`Database query error: ${error.message} \nSQL: ${sql.slice(0, 150)}...`);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.pgPool) {
      await this.pgPool.end();
    }
    if (this.pglite) {
      await this.pglite.close();
    }
    this.isInitialized = false;
  }
}

export const db = new DatabaseService();
