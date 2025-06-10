import { createClient } from '../../src/config/database';
import { v4 as uuidv4 } from 'uuid';

export class TestHelpers {
  private static supabase = createClient();

  /**
   * Create a test user in the database
   */
  static async createTestUser(userData?: {
    email?: string;
    name?: string;
    phone?: string;
  }) {
    const defaultData = {
      email: `test-${uuidv4()}@example.com`,
      name: 'Test User',
      phone: '+1234567890',
      ...userData
    };

    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
        email: defaultData.email,
        password: 'testpassword123',
        user_metadata: {
          name: defaultData.name,
          phone: defaultData.phone
        },
        email_confirm: true
      });

      if (authError) {
        throw authError;
      }

      // Create user profile
      const { data: profile, error: profileError } = await this.supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          name: defaultData.name,
          phone: defaultData.phone,
          saved_recipes_count: 0,
          posts_count: 0,
          is_notifications_enabled: true,
          language: 'id',
          is_dark_mode_enabled: false
        })
        .select()
        .single();

      if (profileError) {
        // Clean up auth user if profile creation fails
        await this.supabase.auth.admin.deleteUser(authData.user.id);
        throw profileError;
      }

      return {
        user: authData.user,
        profile
      };
    } catch (error) {
      console.error('Failed to create test user:', error);
      throw error;
    }
  }

  /**
   * Delete a test user
   */
  static async deleteTestUser(userId: string) {
    try {
      // Delete from auth (this should cascade to profile due to RLS)
      await this.supabase.auth.admin.deleteUser(userId);
    } catch (error) {
      console.error('Failed to delete test user:', error);
      throw error;
    }
  }

  /**
   * Clean up all test data
   */
  static async cleanupTestData() {
    try {
      // Delete test users (those with emails containing 'test-')
      const { data: users } = await this.supabase.auth.admin.listUsers();
      
      if (users?.users) {
        const testUsers = users.users.filter(user => 
          user.email?.includes('test-') || user.email?.includes('@example.com')
        );

        for (const user of testUsers) {
          await this.deleteTestUser(user.id);
        }
      }

      console.log(`Cleaned up ${users?.users?.length || 0} test users`);
    } catch (error) {
      console.error('Failed to cleanup test data:', error);
    }
  }

  /**
   * Generate a JWT token for testing
   */
  static async getAuthToken(userId: string): Promise<string> {
    try {
      // In Supabase, we need to create a session for the user
      const { data, error } = await this.supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: `test-${userId}@example.com`
      });

      if (error) {
        throw error;
      }

      // Extract token from the magic link
      const url = new URL(data.properties?.action_link || '');
      const token = url.searchParams.get('access_token');
      
      if (!token) {
        throw new Error('Failed to generate auth token');
      }

      return token;
    } catch (error) {
      console.error('Failed to generate auth token:', error);
      throw error;
    }
  }

  /**
   * Create test recipe
   */
  static async createTestRecipe(userId: string, recipeData?: any) {
    const defaultRecipe = {
      name: `Test Recipe ${uuidv4()}`,
      description: 'A test recipe',
      cook_time: '30 minutes',
      prep_time: '15 minutes',
      servings: 4,
      difficulty_level: 'medium',
      is_published: true,
      rating: 0,
      review_count: 0,
      created_by: userId,
      ...recipeData
    };

    const { data, error } = await this.supabase
      .from('recipes')
      .insert(defaultRecipe)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Wait for a condition to be true
   */
  static async waitFor(
    condition: () => Promise<boolean>,
    timeout: number = 5000,
    interval: number = 100
  ): Promise<void> {
    const start = Date.now();
    
    while (Date.now() - start < timeout) {
      if (await condition()) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error(`Condition not met within ${timeout}ms`);
  }
}

export default TestHelpers;
