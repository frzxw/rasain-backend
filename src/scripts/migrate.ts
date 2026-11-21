import { createClient } from '../config/database';
import { logger } from '../utils/logger';
import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import path from 'path';

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
  try {
    logger.info('🚀 Starting database migrations...');

    const supabase = createClient();

    // Read the schema.sql file
    const schemaPath = path.join(process.cwd(), 'schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf-8');

    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0 && !statement.startsWith('--'));

    logger.info(`📄 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        logger.info(`⚡ Executing statement ${i + 1}/${statements.length}`);
        
        // Use raw SQL execution for schema creation
        const { error } = await supabase.rpc('exec_sql', { sql_statement: statement });
        
        if (error) {
          logger.error(`❌ Error executing statement ${i + 1}:`, error);
          logger.error(`Statement: ${statement}`);
          
          // Continue with next statement for non-critical errors
          if (!error.message.includes('already exists')) {
            throw error;
          } else {
            logger.warn(`⚠️  Skipping statement ${i + 1} (already exists)`);
          }
        } else {
          logger.info(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (statementError) {
        logger.error(`❌ Failed to execute statement ${i + 1}:`, statementError);
        logger.error(`Statement: ${statement}`);
        throw statementError;
      }
    }

    logger.info('✅ Database migrations completed successfully!');

    // Verify key tables exist
    await verifyTables();

  } catch (error) {
    logger.error('❌ Database migration failed:', error);
    process.exit(1);
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
      'ingredients',
      'recipe_steps',
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

    const supabase = createClient();

    const { email, password, name } = adminCredentials();

    // Check if admin user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      logger.info('⚠️  Admin user already exists');
      return;
    }

    // Create admin user. The password stays in the environment and is never logged.
    const adminUserId = '00000000-0000-0000-0000-000000000001';
    const passwordHash = await bcrypt.hash(password, 12);

    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: adminUserId,
        email,
        password_hash: passwordHash,
        email_verified: true,
        phone_verified: false
      });

    if (userError) {
      throw userError;
    }

    // Create admin profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: adminUserId,
        name,
        saved_recipes_count: 0,
        posts_count: 0,
        is_notifications_enabled: true,
        language: 'en',
        is_dark_mode_enabled: false
      });

    if (profileError) {
      throw profileError;
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
