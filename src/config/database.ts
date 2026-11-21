import './loadEnv';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Request } from 'express';
import { AuthenticatedUser } from '@/types';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Export createClient function for consistency with imports
export const createClient = () => supabase;

// Database helper functions
export const dbHelpers = {
  // Generate a slug from a string
  generateSlug: (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  },

  // Format timestamp
  formatTimestamp: (date: Date = new Date()): string => {
    return date.toISOString();
  },

  // Check if UUID is valid
  isValidUUID: (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  },

  // Sanitize data for database insertion
  sanitizeData: (data: Record<string, any>): Record<string, any> => {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null) {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  },

  // Build pagination object
  buildPagination: (page: number, limit: number, total: number) => {
    return {
      page,
      limit,
      total,
      hasNext: page * limit < total,
      hasPrev: page > 1,
      totalPages: Math.ceil(total / limit)
    };
  }
};

// Get authenticated user from request
export const getAuthenticatedUser = async (req: Request): Promise<AuthenticatedUser | null> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    
    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return {
      id: user.id,
      email: user.email!,
      user_metadata: user.user_metadata,
      profile: profile || undefined
    };
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
};

// Initialize database connection and run migrations if needed
export const initializeDatabase = async (): Promise<void> => {
  try {    // Test database connection
    const { error } = await supabase
      .from('user_profiles')
      .select('count(*)')
      .limit(1);

    if (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }

    console.log('✅ Database connection established');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

// Close database connections (for graceful shutdown)
export const closeDatabase = async (): Promise<void> => {
  // Supabase doesn't require explicit connection closing
  console.log('📦 Database connections closed');
};

export default supabase;
