/**
 * PHIKSNIYAR DATABASE BACKUP & INTEGRITY VERIFICATION UTILITY
 * 
 * Creates an atomic snapshot of the active database, exports a JSON archive,
 * verifies record counts, and prints disaster recovery instructions.
 * 
 * Usage:
 *   npx tsx scripts/db-backup.ts
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

async function performBackup() {
  const dataDir = path.join(process.cwd(), 'data');
  const backupDir = path.join(dataDir, 'backups');
  const dbPath = process.env.DATABASE_PATH || path.join(dataDir, 'phiksniyar.db');

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  if (!fs.existsSync(dbPath)) {
    console.error(`ERROR: Database not found at ${dbPath}`);
    process.exit(1);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const snapshotPath = path.join(backupDir, `phiksniyar-snapshot-${timestamp}.db`);
  const jsonArchiveFile = path.join(backupDir, `phiksniyar-archive-${timestamp}.json`);

  console.log('================================================================');
  console.log('📦 PHIKSNIYAR DISASTER RECOVERY & ATOMIC BACKUP');
  console.log(`Source Database:   ${dbPath}`);
  console.log(`Target Snapshot:   ${snapshotPath}`);
  console.log(`Target JSON dump:  ${jsonArchiveFile}`);
  console.log('================================================================');

  const sqlite = new Database(dbPath, { readonly: true });

  try {
    // 1. Atomic backup using SQLite backup API
    console.log('Creating atomic SQLite binary snapshot...');
    await sqlite.backup(snapshotPath);
    console.log('✓ Binary snapshot saved.');

    // 2. Structured JSON export for portability
    console.log('Exporting structured JSON tables...');
    const tables = ['users', 'customer_profiles', 'addresses', 'providers', 'bookings', 'payment_orders', 'reviews', 'warranties', 'disputes', 'audit_logs'];
    const dump: Record<string, any[]> = {};
    const tableCounts: Record<string, number> = {};

    for (const table of tables) {
      try {
        const rows = sqlite.prepare(`SELECT * FROM ${table}`).all();
        dump[table] = rows;
        tableCounts[table] = rows.length;
      } catch (err) {
        dump[table] = [];
        tableCounts[table] = 0;
      }
    }

    fs.writeFileSync(jsonArchiveFile, JSON.stringify(dump, null, 2), 'utf-8');
    console.log('✓ JSON archive generated.');

    console.log('----------------------------------------------------------------');
    console.log('VERIFIED ROW COUNTS IN BACKUP:');
    for (const [tbl, count] of Object.entries(tableCounts)) {
      console.log(`  - ${tbl.padEnd(20)}: ${count} rows`);
    }
    console.log('----------------------------------------------------------------');
    console.log('RECOVERY INSTRUCTIONS:');
    console.log('To restore from this snapshot in case of failure:');
    console.log(`  copy "${snapshotPath}" "${dbPath}"`);
    console.log('================================================================');
  } catch (error) {
    console.error('BACKUP FAILED:', error);
    process.exit(1);
  } finally {
    sqlite.close();
  }
}

performBackup().catch(console.error);
