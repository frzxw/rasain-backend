import { supabase, createClient } from '../../src/config/database';
import { logger } from '../../src/utils/logger';

describe('Database Connection Tests', () => {
  let client: ReturnType<typeof createClient>;

  beforeAll(() => {
    client = createClient();
  });

  describe('Supabase Connection', () => {
    test('should connect to Supabase successfully', async () => {
      try {
        // Test basic connection by checking if we can query a simple table
        const { error } = await client
          .from('user_profiles')
          .select('count(*)')
          .limit(1);

        if (error) {
          logger.error('Database connection error:', error);
          throw error;
        }
        
        logger.info('✅ Database connection test passed');
      } catch (error) {
        logger.error('❌ Database connection test failed:', error);
        throw error;
      }
    });

    test('should be able to check table existence', async () => {
      // Test if main tables exist
      const tables = ['user_profiles', 'recipes', 'pantry_items', 'notifications'];
      
      for (const table of tables) {
        const { error } = await client
          .from(table)
          .select('count(*)')
          .limit(1);
        
        expect(error).toBeNull();
      }
    });

    test('should handle authentication operations', async () => {
      try {
        // Test if auth operations work
        const { data, error } = await client.auth.getSession();
        
        // No active session is expected in tests, but no error should occur
        expect(error).toBeNull();
        expect(data.session).toBeNull();
      } catch (error) {
        logger.error('Auth operation test failed:', error);
        throw error;
      }
    });
  });

  describe('Environment Configuration', () => {
    test('should have required environment variables', () => {
      expect(process.env.SUPABASE_URL).toBeDefined();
      expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBeDefined();
      
      // Check if URL is properly formatted
      const url = process.env.SUPABASE_URL;
      expect(url).toMatch(/^https:\/\/.*\.supabase\.co$/);
      
      // Check if service role key is properly formatted (JWT)
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      expect(key).toMatch(/^eyJ/); // JWT tokens start with 'eyJ'
    });

    test('should have JWT secret configured', () => {
      expect(process.env.JWT_SECRET).toBeDefined();
      expect(process.env.JWT_SECRET!.length).toBeGreaterThan(10);
    });

    test('should have proper NODE_ENV set', () => {
      expect(['development', 'test', 'production']).toContain(process.env.NODE_ENV);
    });
  });

  describe('Database Helper Functions', () => {
    test('should have createClient function working', () => {
      const newClient = createClient();
      expect(newClient).toBeDefined();
      expect(typeof newClient.from).toBe('function');
      expect(newClient.auth).toBeDefined();
    });

    test('should export supabase instance', () => {
      expect(supabase).toBeDefined();
      expect(typeof supabase.from).toBe('function');
      expect(supabase.auth).toBeDefined();
    });
  });
});
