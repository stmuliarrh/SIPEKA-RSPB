import pg from 'pg';

const dbUrl = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_0ofkN2UVOEWC@ep-green-mode-atuc9qui-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

let pool;

export function getPool() {
  if (!pool) {
    pool = new pg.Pool({
      connectionString: dbUrl,
      ssl: {
        rejectUnauthorized: false
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  return pool;
}
