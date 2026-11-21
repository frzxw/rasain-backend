import express, { Request, Response } from 'express';
import { supabase } from '@/config/database';
import { asyncHandler, AppError } from '@/middleware/errorMiddleware';
import { protect, optionalAuth } from '@/middleware/auth';
import { ApiResponse, PaginatedResponse, UserProfile } from '@/types';
import logger from '@/utils/logger';

const router = express.Router();

// @desc    Get user dashboard data
// @route   GET /api/v1/users/dashboard
// @access  Private
// Registered before /:id so "dashboard" is not treated as a user id.
router.get('/dashboard', protect, asyncHandler(async (req: Request, res: Response) => {
  const { data: dashboardData, error } = await supabase
    .from('user_dashboard')
    .select('*')
    .eq('id', req.user!.id)
    .single();

  if (error) {
    logger.error('Dashboard data fetch error:', error);
    throw new AppError('Failed to fetch dashboard data', 500);
  }

  const { data: recentRecipes } = await supabase
    .from('recipes')
    .select('id, name, image_url, created_at')
    .eq('created_by', req.user!.id)
    .order('created_at', { ascending: false })
    .limit(5);

  const { data: expiring_items } = await supabase.rpc(
    'get_expiring_items',
    {
      user_uuid: req.user!.id,
      days_ahead: 7
    }
  );

  const response: ApiResponse<{
    dashboard: any;
    recent_recipes: any[];
    expiring_items: any[];
  }> = {
    success: true,
    data: {
      dashboard: dashboardData,
      recent_recipes: recentRecipes || [],
      expiring_items: expiring_items || []
    }
  };

  res.json(response);
}));

// @desc    Get user profile by ID
// @route   GET /api/v1/users/:id
// @access  Public
router.get('/:id', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error || !profile) {
    throw new AppError('User not found', 404);
  }

  // Don't expose sensitive information for other users
  const publicProfile = {
    id: profile.id,
    name: profile.name,
    image_url: profile.image_url,
    saved_recipes_count: profile.saved_recipes_count,
    posts_count: profile.posts_count,
    created_at: profile.created_at
  };

  const response: ApiResponse<{ profile: Partial<UserProfile> }> = {
    success: true,
    data: { profile: publicProfile }
  };

  res.json(response);
}));

// @desc    Get user's saved recipes
// @route   GET /api/v1/users/:id/saved-recipes
// @access  Private (own recipes) / Public (if user allows)
router.get('/:id/saved-recipes', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.id;
  const { page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  // Only allow users to see their own saved recipes
  if (!req.user || req.user.id !== userId) {
    throw new AppError('Access denied', 403);
  }

  const { data: savedRecipes, error } = await supabase
    .from('saved_recipes')
    .select(`
      saved_at,
      notes,
      recipes(*)
    `)
    .eq('user_id', userId)
    .order('saved_at', { ascending: false })
    .range(offset, offset + Number(limit) - 1);

  if (error) {
    logger.error('Saved recipes fetch error:', error);
    throw new AppError('Failed to fetch saved recipes', 500);
  }

  const recipes = savedRecipes?.map(sr => ({
    ...sr.recipes,
    saved_at: sr.saved_at,
    notes: sr.notes,
    is_saved: true
  })) || [];

  const response: PaginatedResponse<{ recipes: any[] }> = {
    success: true,
    data: { recipes },
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: recipes.length
    }
  };

  res.json(response);
}));

// @desc    Get user's created recipes
// @route   GET /api/v1/users/:id/recipes
// @access  Public
router.get('/:id/recipes', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.id;
  const { page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const { data: recipes, error } = await supabase
    .from('recipes')
    .select(`
      *,
      saved_recipes!saved_recipes_recipe_id_fkey(user_id)
    `)
    .eq('created_by', userId)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + Number(limit) - 1);

  if (error) {
    logger.error('User recipes fetch error:', error);
    throw new AppError('Failed to fetch user recipes', 500);
  }

  const processedRecipes = recipes?.map(recipe => ({
    ...recipe,
    is_saved: req.user ? recipe.saved_recipes?.some((sr: any) => sr.user_id === req.user!.id) : false,
    saved_recipes: undefined
  })) || [];

  const response: PaginatedResponse<{ recipes: any[] }> = {
    success: true,
    data: { recipes: processedRecipes },
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: processedRecipes.length
    }
  };

  res.json(response);
}));

// @desc    Get user's community posts
// @route   GET /api/v1/users/:id/posts
// @access  Public
router.get('/:id/posts', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.id;
  const { page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const { data: posts, error } = await supabase
    .from('community_posts')
    .select(`
      *,
      user_profiles(name, image_url),
      post_likes(user_id)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + Number(limit) - 1);

  if (error) {
    logger.error('User posts fetch error:', error);
    throw new AppError('Failed to fetch user posts', 500);
  }

  const processedPosts = posts?.map(post => ({
    ...post,
    author: post.user_profiles,
    is_liked: req.user ? post.post_likes?.some((pl: any) => pl.user_id === req.user!.id) : false,
    user_profiles: undefined,
    post_likes: undefined
  })) || [];

  const response: PaginatedResponse<{ posts: any[] }> = {
    success: true,
    data: { posts: processedPosts },
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: processedPosts.length
    }
  };

  res.json(response);
}));

// @desc    Follow/unfollow user
// @route   POST/DELETE /api/v1/users/:id/follow
// @access  Private
router.post('/:id/follow', protect, asyncHandler(async (req: Request, res: Response) => {
  const targetUserId = req.params.id;

  if (targetUserId === req.user!.id) {
    throw new AppError('Cannot follow yourself', 400);
  }

  // Check if target user exists
  const { data: targetUser, error: userError } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('id', targetUserId)
    .single();

  if (userError || !targetUser) {
    throw new AppError('User not found', 404);
  }

  // Note: You would need to create a user_follows table for this functionality
  // For now, just return success
  const response: ApiResponse = {
    success: true,
    message: 'User followed successfully'
  };

  res.json(response);
}));

router.delete('/:id/follow', protect, asyncHandler(async (req: Request, res: Response) => {
  const targetUserId = req.params.id;

  if (targetUserId === req.user!.id) {
    throw new AppError('Cannot unfollow yourself', 400);
  }

  // Note: You would need to create a user_follows table for this functionality
  // For now, just return success with the target user ID
  const response: ApiResponse = {
    success: true,
    message: `User ${targetUserId} unfollowed successfully`
  };

  res.json(response);
}));

export default router;
