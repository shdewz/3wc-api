import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { pool, closePool } from '@db/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SEEDS_DIR = path.resolve(__dirname, './seeds');

const run = async () => {
  const client = await pool.connect();

  try {
    await client.query('SELECT pg_advisory_lock($1)', [9876543210]);

    await client.query(`
      CREATE TABLE IF NOT EXISTS seeds (
        id TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const files = fs
      .readdirSync(SEEDS_DIR)
      .filter((f) => f.endsWith('.ts') || f.endsWith('.js'))
      .sort();

    const { rows: applied } = await client.query('SELECT id FROM seeds');
    const appliedSet = new Set(applied.map((r) => r.id));

    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`Skipped: ${file} (already applied)`);
        continue;
      }

      try {
        const seedModule = await import(`./${path.join('seeds', file)}`);
        const seed = seedModule.default || seedModule;

        if (typeof seed !== 'function') {
          console.log(`Skipped: ${file} (no default export function)`);
          continue;
        }

        await seed();
        await client.query('INSERT INTO seeds (id) VALUES ($1)', [file]);
        console.log(`Applied: ${file}`);
      } catch (err) {
        console.error(`Failed: ${file}`, err);
        throw err;
      }
    }
  } finally {
    client.release();
    await closePool();
  }
};

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
