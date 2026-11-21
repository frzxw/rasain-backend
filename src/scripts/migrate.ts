import { createClient } from '../config/database';
import { logger } from '../utils/logger';
import { ensureAccount } from './demoAccounts';
import fs from 'fs/promises';
import path from 'path';
import { Client } from 'pg';

function adminCredentials(): { email: string; password: string; name: string } {
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || 'Admin';

  if (!email || !password) {
    throw new Error(
      'Set ADMIN_EMAIL and ADMIN_PASSWORD in your environment before creating the admin user. See .env.example.'
    );
  }

  if (password.length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters.');
  }

  return { email, password, name };
}

async function runMigrations(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      'Set DATABASE_URL before migrating. Use the direct Postgres connection string from your Supabase project. See .env.example.'
    );
  }

  const client = new Client({ connectionString: databaseUrl });

  try {
    logger.info('🚀 Starting database migrations...');
    await client.connect();

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf-8');

    const existing = await client.query(`SELECT to_regclass('public.users') AS name`);
    if (existing.rows[0]?.name) {
      logger.info('Schema already present. Skipping schema.sql.');
    } else {
      await client.query(schema);
      logger.info('✅ Schema applied from src/scripts/schema.sql');
    }

    await applyCompatibilityPatches(client);
    logger.info('✅ Database migrations completed successfully!');
    await verifyTables();
  } catch (error) {
    logger.error('❌ Database migration failed:', error);
    process.exit(1);
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function applyCompatibilityPatches(client: Client): Promise<void> {
  const notifications = await client.query(`SELECT to_regclass('public.notifications') AS name`);
  if (!notifications.rows[0]?.name) {
    return;
  }

  await client.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS data JSONB`);
  await client.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false`);
  await client.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP`);

  await client.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'notification_type'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'type'
      ) THEN
        ALTER TABLE notifications RENAME COLUMN notification_type TO type;
      END IF;
    END $$;
  `);

  const extraTypes = ['recipe_like', 'recipe_comment', 'recipe_share', 'follow', 'reminder'];
  for (const value of extraTypes) {
    await client.query(`ALTER TYPE notification_type ADD VALUE IF NOT EXISTS '${value}'`);
  }
}

async function verifyTables(): Promise<void> {
  try {
    logger.info('🔍 Verifying database tables...');

    const supabase = createClient();

    const requiredTables = [
      'users',
      'user_profiles', 
      'recipes',
      'recipe_ingredients',
      'recipe_instructions',
      'pantry_items',
      'community_posts',
      'post_comments',
      'post_likes',
      'notifications',
      'uploads'
    ];

    for (const table of requiredTables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          logger.error(`❌ Table '${table}' verification failed:`, error);
          throw error;
        } else {
          logger.info(`✅ Table '${table}' exists (${count || 0} rows)`);
        }
      } catch (tableError) {
        logger.error(`❌ Error verifying table '${table}':`, tableError);
        throw tableError;
      }
    }

    logger.info('✅ All required tables verified successfully!');

  } catch (error) {
    logger.error('❌ Table verification failed:', error);
    throw error;
  }
}

async function createAdminUser(): Promise<void> {
  try {
    logger.info('👤 Creating admin user...');

    const { email, password, name } = adminCredentials();
    const account = await ensureAccount({
      email,
      password,
      name,
      role: 'admin'
    });

    if (!account.created) {
      logger.info('⚠️  Admin user already exists');
      return;
    }

    logger.info('✅ Admin user created successfully');
    logger.info('📧 Email comes from ADMIN_EMAIL. The password is not logged.');

  } catch (error) {
    logger.error('❌ Failed to create admin user:', error);
    throw error;
  }
}

// Main execution
if (require.main === module) {
  runMigrations()
    .then(() => createAdminUser())
    .then(() => {
      logger.info('🎉 Migration process completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('💥 Migration process failed:', error);
      process.exit(1);
    });
}

export { runMigrations, verifyTables, createAdminUser };
