// Database Initializer for SIPEKAL RSPB v1.0
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbUrl = "postgresql://neondb_owner:npg_0ofkN2UVOEWC@ep-green-mode-atuc9qui-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function main() {
    console.log("Initializing database connection...");
    const client = new pg.Client({
        connectionString: dbUrl,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log("Connected to Neon PostgreSQL database successfully!");

        const schemaPath = path.join(__dirname, 'schema.sql');
        console.log(`Reading SQL schema from: ${schemaPath}`);
        const sql = fs.readFileSync(schemaPath, 'utf8');

        console.log("Executing SQL schema...");
        await client.query(sql);
        console.log("Database initialized successfully with tables and seed data!");
    } catch (err) {
        console.error("Database initialization failed:", err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

main();
