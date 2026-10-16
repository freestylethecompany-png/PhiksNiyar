/**
 * PHIKSNIYAR POSTGRESQL PRODUCTION MIGRATION TOOL
 * 
 * Safely migrates all local SQLite records (users, providers, bookings, payments, audit logs)
 * to a managed persistent PostgreSQL database (e.g. AWS RDS, Supabase, Neon, GCP Cloud SQL).
 * 
 * Usage:
 *   DATABASE_URL="postgres://user:password@host:5432/phiksniyar" npx tsx scripts/migrate-to-postgres.ts
 */

import { Client } from 'pg';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

async function runMigration() {
  const postgresUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (!postgresUrl) {
    console.error('================================================================');
    console.error('ERROR: DATABASE_URL or POSTGRES_URL environment variable is missing.');
    console.error('To migrate to persistent PostgreSQL, specify:');
    console.error('  DATABASE_URL="postgresql://user:pass@host:5432/phiksniyar" npx tsx scripts/migrate-to-postgres.ts');
    console.error('================================================================');
    process.exit(1);
  }

  const sqlitePath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'phiksniyar.db');
  if (!fs.existsSync(sqlitePath)) {
    console.error(`ERROR: SQLite database file not found at: ${sqlitePath}`);
    process.exit(1);
  }

  console.log('----------------------------------------------------------------');
  console.log('🔄 PHIKSNIYAR SQLITE -> POSTGRESQL MIGRATION PIPELINE');
  console.log(`Source SQLite:      ${sqlitePath}`);
  console.log(`Target PostgreSQL:  ${postgresUrl.replace(/:[^:@]+@/, ':****@')}`);
  console.log('----------------------------------------------------------------');

  const sqlite = new Database(sqlitePath, { readonly: true });
  const pgClient = new Client({
    connectionString: postgresUrl,
    ssl: postgresUrl.includes('localhost') ? false : { rejectUnauthorized: false },
  });

  try {
    await pgClient.connect();
    console.log('✓ Successfully connected to PostgreSQL instance.');

    // 1. Read schema DDL
    const schemaPath = path.join(process.cwd(), 'scripts', 'postgres-schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

    console.log('Executing PostgreSQL DDL initialization...');
    await pgClient.query(schemaSql);
    console.log('✓ PostgreSQL tables, foreign keys, and indexes initialized.');

    // 2. Begin Transaction
    await pgClient.query('BEGIN');

    // 3. Migrate Users
    const users = sqlite.prepare('SELECT * FROM users').all() as any[];
    console.log(`Migrating ${users.length} user records...`);
    for (const u of users) {
      await pgClient.query(`
        INSERT INTO users (id, phone, name, email, role, avatar_url, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          phone = EXCLUDED.phone,
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          role = EXCLUDED.role,
          avatar_url = EXCLUDED.avatar_url,
          updated_at = EXCLUDED.updated_at
      `, [u.id, u.phone, u.name, u.email || null, u.role, u.avatarUrl || null, u.createdAt, u.updatedAt]);
    }

    // 4. Migrate Providers
    const providers = sqlite.prepare('SELECT * FROM providers').all() as any[];
    console.log(`Migrating ${providers.length} provider profiles...`);
    for (const p of providers) {
      await pgClient.query(`
        INSERT INTO providers (
          id, user_id, business_name, bio, primary_category, categories, subcategories,
          experience_years, service_radius_km, location_area, latitude, longitude,
          verification_status, verification_documents, working_hours, visiting_charge,
          hourly_rate, fixed_rates, rating, total_reviews, completed_jobs,
          cancellation_rate, response_rate, avg_response_minutes, portfolio_images,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27
        ) ON CONFLICT (id) DO UPDATE SET
          business_name = EXCLUDED.business_name,
          verification_status = EXCLUDED.verification_status,
          rating = EXCLUDED.rating,
          completed_jobs = EXCLUDED.completed_jobs,
          updated_at = EXCLUDED.updated_at
      `, [
        p.id, p.userId, p.businessName, p.bio || null, p.primaryCategory,
        p.categories || '[]', p.subcategories || '[]',
        p.experienceYears || 1, p.serviceRadiusKm || 10.0, p.locationArea,
        p.latitude, p.longitude, p.verificationStatus,
        p.verificationDocuments || '{}', p.workingHours || '{}',
        p.visitingCharge || 199.0, p.hourlyRate || null, p.fixedRates || '{}',
        p.rating || 5.0, p.totalReviews || 0, p.completedJobs || 0,
        p.cancellationRate || 0.0, p.responseRate || 100.0, p.avgResponseMinutes || 15,
        p.portfolioImages || '[]', p.createdAt, p.updatedAt,
      ]);
    }

    // 5. Migrate Bookings
    const bookings = sqlite.prepare('SELECT * FROM bookings').all() as any[];
    console.log(`Migrating ${bookings.length} booking records...`);
    for (const b of bookings) {
      await pgClient.query(`
        INSERT INTO bookings (
          id, service_request_id, customer_id, customer_name, customer_phone,
          customer_address, provider_id, provider_name, provider_phone,
          category, subcategory, description, scheduled_date, scheduled_time,
          status, status_history, pricing, payment, dispute, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
        ) ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          status_history = EXCLUDED.status_history,
          payment = EXCLUDED.payment,
          updated_at = EXCLUDED.updated_at
      `, [
        b.id, b.serviceRequestId || null, b.customerId, b.customerName, b.customerPhone,
        b.customerAddress, b.providerId, b.providerName, b.providerPhone,
        b.category, b.subcategory, b.description, b.scheduledDate, b.scheduledTime,
        b.status, b.statusHistory || '[]', b.pricing, b.payment || null, b.dispute || null,
        b.createdAt, b.updatedAt,
      ]);
    }

    // 6. Migrate Payment Orders
    const orders = sqlite.prepare('SELECT * FROM payment_orders').all() as any[];
    console.log(`Migrating ${orders.length} payment order records...`);
    for (const o of orders) {
      await pgClient.query(`
        INSERT INTO payment_orders (order_id, booking_id, amount, currency, method, status, payment_id, signature, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (order_id) DO UPDATE SET
          status = EXCLUDED.status,
          payment_id = EXCLUDED.payment_id,
          signature = EXCLUDED.signature,
          updated_at = EXCLUDED.updated_at
      `, [
        o.orderId, o.bookingId, o.amount, o.currency || 'INR', o.method || 'RAZORPAY',
        o.status || 'CREATED', o.paymentId || null, o.signature || null,
        o.createdAt, o.updatedAt,
      ]);
    }

    // 7. Commit Transaction
    await pgClient.query('COMMIT');
    console.log('----------------------------------------------------------------');
    console.log('✅ PostgreSQL MIGRATION COMPLETED SUCCESSFULLY!');
    console.log(`   Users Migrated:     ${users.length}`);
    console.log(`   Providers Migrated: ${providers.length}`);
    console.log(`   Bookings Migrated:  ${bookings.length}`);
    console.log(`   Orders Migrated:    ${orders.length}`);
    console.log('----------------------------------------------------------------');
  } catch (err) {
    await pgClient.query('ROLLBACK');
    console.error('MIGRATION FAILED. Rolled back PostgreSQL transaction:', err);
    process.exit(1);
  } finally {
    sqlite.close();
    await pgClient.end();
  }
}

runMigration().catch(console.error);
