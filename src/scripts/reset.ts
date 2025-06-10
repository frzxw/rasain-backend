import { logger } from '../utils/logger';
import { runMigrations, createAdminUser } from './migrate';
import { seedDatabase, clearData } from './seed';

async function resetDatabase(): Promise<void> {
  try {
    logger.info('🔄 Starting database reset...');
    logger.info('This will clear all data and recreate the database with fresh sample data.');

    // Step 1: Clear existing data
    logger.info('📝 Step 1: Clearing existing data...');
    await clearData();

    // Step 2: Run migrations (this should be idempotent)
    logger.info('📝 Step 2: Running migrations...');
    await runMigrations();

    // Step 3: Create admin user
    logger.info('📝 Step 3: Creating admin user...');
    await createAdminUser();

    // Step 4: Seed database with sample data
    logger.info('📝 Step 4: Seeding database with sample data...');
    await seedDatabase();

    logger.info('✅ Database reset completed successfully!');
    logger.info('');
    logger.info('🎉 Your Rasain database is now ready with:');
    logger.info('   - Fresh schema and tables');
    logger.info('   - Admin user (admin@rasain.com / admin123!)');
    logger.info('   - Sample users and recipes');
    logger.info('   - Sample pantry items');
    logger.info('   - Sample community posts');
    logger.info('   - Welcome notifications');
    logger.info('');
    logger.info('🚀 You can now start the development server with: npm run dev');

  } catch (error) {
    logger.error('❌ Database reset failed:', error);
    throw error;
  }
}

async function quickReset(): Promise<void> {
  try {
    logger.info('⚡ Starting quick database reset (data only)...');
    
    // Only clear data and reseed, don't run migrations
    await clearData();
    await seedDatabase();

    logger.info('✅ Quick database reset completed successfully!');

  } catch (error) {
    logger.error('❌ Quick database reset failed:', error);
    throw error;
  }
}

// Main execution
if (require.main === module) {
  const command = process.argv[2];

  if (command === 'quick') {
    quickReset()
      .then(() => {
        logger.info('🎉 Quick reset completed successfully!');
        process.exit(0);
      })
      .catch((error) => {
        logger.error('💥 Quick reset failed:', error);
        process.exit(1);
      });
  } else {
    resetDatabase()
      .then(() => {
        logger.info('🎉 Database reset completed successfully!');
        process.exit(0);
      })
      .catch((error) => {
        logger.error('💥 Database reset failed:', error);
        process.exit(1);
      });
  }
}

export { resetDatabase, quickReset };
