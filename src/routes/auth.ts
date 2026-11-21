import express, { Request, Response } from 'express';
import { supabase } from '@/config/database';
import { asyncHandler, AppError } from '@/middleware/errorMiddleware';
import { validate } from '@/middleware/validation';
import { registerSchema, loginSchema, updateProfileSchema, forgotPasswordSchema, resetPasswordSchema } from '@/middleware/validation';
import { protect } from '@/middleware/auth';
import { ApiResponse, UserProfile } from '@/types';
import logger from '@/utils/logger';

const router = express.Router();

// @desc    Register new user
// @route   POST /api/v1/auth/register
// @access  Public
router.post('/register', validate(registerSchema), asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, phone } = req.body;

  // Create user in Supabase Auth. A duplicate email comes back as an error,
  // which avoids listing every auth user on each registration.
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    user_metadata: {
      name,
      phone
    },
    email_confirm: false
  });

  if (authError || !authData.user) {
    const authMessage = authError?.message?.toLowerCase() ?? '';
    if (authMessage.includes('already') || authMessage.includes('registered')) {
      throw new AppError('User already exists with this email', 400);
    }
    logger.error('Auth registration error:', authError);
    throw new AppError('Failed to create user account', 500);
  }

  const userId = authData.user.id;

  // user_profiles.id references public.users, so the row has to exist first.
  const { error: userError } = await supabase.from('users').insert({
    id: userId,
    email,
    phone: phone ?? null,
    email_verified: false,
    phone_verified: false
  });

  if (userError) {
    logger.error('User row creation error:', userError);
    await supabase.auth.admin.deleteUser(userId);
    throw new AppError('Failed to create user account', 500);
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      id: userId,
      name,
      saved_recipes_count: 0,
      posts_count: 0,
      is_notifications_enabled: true,
      language: 'id',
      is_dark_mode_enabled: false
    })
    .select()
    .single();

  if (profileError) {
    logger.error('Profile creation error:', profileError);
    await supabase.from('users').delete().eq('id', userId);
    await supabase.auth.admin.deleteUser(userId);
    throw new AppError('Failed to create user profile', 500);
  }

  logger.logAuth('user_registered', userId, { email });

  const response: ApiResponse = {
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: authData.user.id,
        email: authData.user.email,
        profile
      }
    }
  };

  res.status(201).json(response);
}));

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
router.post('/login', validate(loginSchema), asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Sign in with Supabase
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authError || !authData.user) {
    logger.logAuth('login_failed', null, { email, error: authError?.message });
    throw new AppError('Invalid email or password', 401);
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (profileError) {
    logger.error('Profile fetch error:', profileError);
    throw new AppError('Failed to fetch user profile', 500);
  }

  // Update last sign in
  await supabase.auth.admin.updateUserById(authData.user.id, {
    user_metadata: {
      ...authData.user.user_metadata,
      last_sign_in: new Date().toISOString()
    }
  });

  logger.logAuth('user_logged_in', authData.user.id, { email });

  const response: ApiResponse = {
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: authData.user.id,
        email: authData.user.email,
        profile
      },
      session: authData.session
    }
  };

  res.json(response);
}));

// @desc    Get current user
// @route   GET /api/v1/auth/me
// @access  Private
router.get('/me', protect, asyncHandler(async (req: Request, res: Response) => {
  // Get user profile
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', req.user!.id)
    .single();

  if (error) {
    logger.error('Profile fetch error:', error);
    throw new AppError('Failed to fetch user profile', 500);
  }

  const response: ApiResponse = {
    success: true,
    data: {
      user: {
        id: req.user!.id,
        email: req.user!.email,
        profile
      }
    }
  };

  res.json(response);
}));

// @desc    Update user profile
// @route   PUT /api/v1/auth/profile
// @access  Private
router.put('/profile', protect, validate(updateProfileSchema), asyncHandler(async (req: Request, res: Response) => {
  const { phone, ...profileUpdates } = req.body;
  const allowedProfileFields = [
    'name',
    'image_url',
    'is_notifications_enabled',
    'language',
    'is_dark_mode_enabled'
  ] as const;
  const updates: Record<string, unknown> = {};
  for (const field of allowedProfileFields) {
    if (profileUpdates[field] !== undefined) {
      updates[field] = profileUpdates[field];
    }
  }

  if (phone !== undefined) {
    const { error: phoneError } = await supabase
      .from('users')
      .update({ phone, updated_at: new Date().toISOString() })
      .eq('id', req.user!.id);

    if (phoneError) {
      logger.error('Phone update error:', phoneError);
      throw new AppError('Failed to update profile', 500);
    }
  }

  // Update user profile. Only columns that exist on user_profiles are written.
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', req.user!.id)
    .select()
    .single();

  if (error) {
    logger.error('Profile update error:', error);
    throw new AppError('Failed to update profile', 500);
  }

  logger.logAuth('profile_updated', req.user!.id);

  const response: ApiResponse<{ profile: UserProfile }> = {
    success: true,
    message: 'Profile updated successfully',
    data: { profile }
  };

  res.json(response);
}));

// @desc    Logout user (invalidate session)
// @route   POST /api/v1/auth/logout
// @access  Private
router.post('/logout', protect, asyncHandler(async (req: Request, res: Response) => {
  // Supabase handles session invalidation on client side
  logger.logAuth('user_logged_out', req.user!.id);

  const response: ApiResponse = {
    success: true,
    message: 'Logged out successfully'
  };

  res.json(response);
}));

// @desc    Request password reset
// @route   POST /api/v1/auth/forgot-password
// @access  Public
router.post('/forgot-password', validate(forgotPasswordSchema), asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.FRONTEND_URL}/reset-password`
  });

  if (error) {
    logger.error('Password reset error:', error);
    throw new AppError('Failed to send reset email', 500);
  }

  logger.logAuth('password_reset_requested', null, { email });

  const response: ApiResponse = {
    success: true,
    message: 'Password reset email sent'
  };

  res.json(response);
}));

// @desc    Reset password
// @route   POST /api/v1/auth/reset-password
// @access  Public
router.post('/reset-password', validate(resetPasswordSchema), asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body;

  // The service-role client has no user session, so updateUser() never
  // applied the new password. The recovery token identifies the account.
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: token,
    type: 'recovery'
  });

  if (error || !data.user) {
    logger.error('Password reset error:', error);
    throw new AppError('Failed to reset password', 400);
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(data.user.id, {
    password
  });

  if (updateError) {
    logger.error('Password reset error:', updateError);
    throw new AppError('Failed to reset password', 400);
  }

  logger.logAuth('password_reset_completed', data.user?.id);

  const response: ApiResponse = {
    success: true,
    message: 'Password reset successfully'
  };

  res.json(response);
}));

// @desc    Delete user account
// @route   DELETE /api/v1/auth/account
// @access  Private
router.delete('/account', protect, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  // Delete user profile first (due to foreign key constraints)
  await supabase
    .from('user_profiles')
    .delete()
    .eq('id', userId);

  // Delete auth user
  const { error } = await supabase.auth.admin.deleteUser(userId);

  if (error) {
    logger.error('Account deletion error:', error);
    throw new AppError('Failed to delete account', 500);
  }

  logger.logAuth('account_deleted', userId);

  const response: ApiResponse = {
    success: true,
    message: 'Account deleted successfully'
  };

  res.json(response);
}));

export default router;
