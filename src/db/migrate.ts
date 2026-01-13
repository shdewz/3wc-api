import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { pool, closePool } from '@db/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.resolve(__dirname, './migrations');

const run = async () => {
  const client = await pool.connect();

  try {
    await client.query('SELECT pg_advisory_lock($1)', [1234567890]);

    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    const { rows: applied } = await client.query('SELECT id FROM migrations');
    const appliedSet = new Set(applied.map((r) => r.id));

    for (const file of files) {
      if (appliedSet.has(file)) continue;

      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');

      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO migrations (id) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`Applied: ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`Failed: ${file}`, err);
        throw err;
      }
    }

    console.log('Migrations complete.');
  } finally {
    try {
      await client.query('SELECT pg_advisory_unlock($1)', [1234567890]);
    } catch (e) {
      console.error(e);
    }
    client.release();
    await closePool();
  }
};

run().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
