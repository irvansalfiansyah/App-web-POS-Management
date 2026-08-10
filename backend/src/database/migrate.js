const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function runMigrations() {
  const client = await db.connect();
  try {
    console.log('Running migrations...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        run_on TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    const migrationsDir = path.join(__dirname, 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('Migrations directory not found, skipping.');
      return;
    }
    
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    const { rows: completedMigrations } = await client.query('SELECT name FROM migrations');
    const completedSet = new Set(completedMigrations.map(m => m.name));

    for (const file of files) {
      if (completedSet.has(file)) {
        console.log(`Migration ${file} already applied, skipping.`);
        continue;
      }
      
      console.log(`Applying migration: ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`✅ Migration ${file} applied successfully.`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`❌ Migration ${file} failed:`);
        throw err;
      }
    }
    
    console.log('All migrations applied successfully.');
  } catch (err) {
    console.error('Migration runner failed:', err);
    process.exit(1);
  } finally {
    client.release();
    db.end();
  }
}

runMigrations();
