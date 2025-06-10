import { createClient } from '@/config/database';
import { User, UserProfile } from '@/types';
import { AppError } from '@/utils/logger';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export class UserModel {
  /**
   * Create a new user
   */
  static async createUser(userData: {
    email: string;
    password: string;
    name: string;
    phone?: string;
  }): Promise<{ user: User; profile: UserProfile }> {
    const supabase = createClient();
    
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', userData.email)
      .single();

    if (existingUser) {
      throw new AppError('User already exists with this email', 409);
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(userData.password, saltRounds);

    const userId = uuidv4();

    // Create user
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: userData.email,
        password_hash: passwordHash,
        email_verified: false,
        phone: userData.phone || null,
        phone_verified: false
      })
      .select()
      .single();

    if (userError) {
      throw new AppError('Failed to create user', 500);
    }

    // Create user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        name: userData.name,
        saved_recipes_count: 0,
        posts_count: 0,
        is_notifications_enabled: true,
        language: 'id',
        is_dark_mode_enabled: false
      })
      .select()
      .single();

    if (profileError) {
      // Cleanup: delete user if profile creation fails
      await supabase.from('users').delete().eq('id', userId);
      throw new AppError('Failed to create user profile', 500);
    }

    return { user, profile };
  }

  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<User | null> {
    const supabase = createClient();
    
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      return null;
    }

    return user;
  }

  /**
   * Find user by ID
   */
  static async findById(id: string): Promise<User | null> {
    const supabase = createClient();
    
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return null;
    }

    return user;
  }

  /**
   * Find user with profile by ID
   */
  static async findWithProfile(id: string): Promise<{ user: User; profile: UserProfile } | null> {
    const supabase = createClient();
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (userError || !user) {
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (profileError || !profile) {
      return null;
    }

    return { user, profile };
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId: string, profileData: Partial<UserProfile>): Promise<UserProfile> {
    const supabase = createClient();
    
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .update({
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new AppError('Failed to update profile', 500);
    }

    return profile;
  }

  /**
   * Update user password
   */
  static async updatePassword(userId: string, newPassword: string): Promise<void> {
    const supabase = createClient();
    
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    const { error } = await supabase
      .from('users')
      .update({
        password_hash: passwordHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      throw new AppError('Failed to update password', 500);
    }
  }

  /**
   * Verify password
   */
  static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Update last sign in time
   */
  static async updateLastSignIn(userId: string): Promise<void> {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('users')
      .update({
        last_sign_in_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Failed to update last sign in time:', error);
    }
  }

  /**
   * Verify user email
   */
  static async verifyEmail(userId: string): Promise<void> {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('users')
      .update({
        email_verified: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      throw new AppError('Failed to verify email', 500);
    }
  }

  /**
   * Delete user account
   */
  static async deleteUser(userId: string): Promise<void> {
    const supabase = createClient();
    
    // Delete profile first (foreign key constraint)
    const { error: profileError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      throw new AppError('Failed to delete user profile', 500);
    }

    // Delete user
    const { error: userError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (userError) {
      throw new AppError('Failed to delete user', 500);
    }
  }

  /**
   * Search users by name or email
   */
  static async searchUsers(query: string, limit: number = 20): Promise<{ user: User; profile: UserProfile }[]> {
    const supabase = createClient();
    
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select(`
        *,
        users!inner(*)
      `)
      .or(`name.ilike.%${query}%,users.email.ilike.%${query}%`)
      .limit(limit);

    if (error) {
      throw new AppError('Failed to search users', 500);
    }

    return profiles?.map(profile => ({
      user: (profile as any).users,
      profile: {
        id: profile.id,
        name: profile.name,
        image_url: profile.image_url,
        saved_recipes_count: profile.saved_recipes_count,
        posts_count: profile.posts_count,
        is_notifications_enabled: profile.is_notifications_enabled,
        language: profile.language,
        is_dark_mode_enabled: profile.is_dark_mode_enabled,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      }
    })) || [];
  }
}
