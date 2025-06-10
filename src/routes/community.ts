import express, { Request, Response } from 'express';
import { supabase } from '@/config/database';
import { asyncHandler, AppError } from '@/middleware/errorMiddleware';
import { validate } from '@/middleware/validation';
import { communityPostSchema } from '@/middleware/validation';
import { protect, optionalAuth } from '@/middleware/auth';
import { 
  ApiResponse, 
  PaginatedResponse, 
  CommunityPost, 
  CreateCommunityPostRequest, 
  UpdateCommunityPostRequest 
} from '@/types';
import logger from '@/utils/logger';

const router = express.Router();

// @desc    Get community posts
// @route   GET /api/v1/community/posts
// @access  Public
router.get('/posts', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20, category, featured } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let query = supabase
    .from('community_posts')
    .select(`
      *,
      user_profiles(name, image_url),
      post_likes(user_id),
      post_tagged_ingredients(ingredient_name)
    `);

  // Apply filters
  if (category) {
    query = query.eq('category', category);
  }

  if (featured === 'true') {
    query = query.eq('is_featured', true);
  }

  const { data: posts, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + Number(limit) - 1);

  if (error) {
    logger.error('Community posts fetch error:', error);
    throw new AppError('Failed to fetch community posts', 500);
  }

  const processedPosts = posts?.map(post => ({
    ...post,
    author: post.user_profiles,
    is_liked: req.user ? post.post_likes?.some((pl: any) => pl.user_id === req.user!.id) : false,
    tagged_ingredients: post.post_tagged_ingredients?.map((pti: any) => pti.ingredient_name) || [],
    user_profiles: undefined,
    post_likes: undefined,
    post_tagged_ingredients: undefined
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

// @desc    Get single community post
// @route   GET /api/v1/community/posts/:id
// @access  Public
router.get('/posts/:id', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { data: post, error } = await supabase
    .from('community_posts')
    .select(`
      *,
      user_profiles(name, image_url),
      post_likes(user_id),
      post_tagged_ingredients(ingredient_name),
      post_comments(
        *,
        user_profiles(name, image_url),
        comment_likes(user_id)
      )
    `)
    .eq('id', req.params.id)
    .single();

  if (error || !post) {
    throw new AppError('Post not found', 404);
  }

  const processedPost = {
    ...post,
    author: post.user_profiles,
    is_liked: req.user ? post.post_likes?.some((pl: any) => pl.user_id === req.user!.id) : false,
    tagged_ingredients: post.post_tagged_ingredients?.map((pti: any) => pti.ingredient_name) || [],
    comments: post.post_comments?.map((comment: any) => ({
      ...comment,
      author: comment.user_profiles,
      is_liked: req.user ? comment.comment_likes?.some((cl: any) => cl.user_id === req.user!.id) : false,
      user_profiles: undefined,
      comment_likes: undefined
    })) || [],
    user_profiles: undefined,
    post_likes: undefined,
    post_tagged_ingredients: undefined,
    post_comments: undefined
  };

  const response: ApiResponse<{ post: any }> = {
    success: true,
    data: { post: processedPost }
  };

  res.json(response);
}));

// @desc    Create community post
// @route   POST /api/v1/community/posts
// @access  Private
router.post('/posts', protect, validate(communityPostSchema), asyncHandler(async (req: Request, res: Response) => {
  const { tagged_ingredients, ...postData }: CreateCommunityPostRequest = req.body;

  const postToInsert = {
    ...postData,
    user_id: req.user!.id,
    like_count: 0,
    comment_count: 0,
    is_featured: false
  };

  const { data: post, error } = await supabase
    .from('community_posts')
    .insert(postToInsert)
    .select()
    .single();

  if (error) {
    logger.error('Community post creation error:', error);
    throw new AppError('Failed to create post', 500);
  }

  // Insert tagged ingredients if provided
  if (tagged_ingredients && tagged_ingredients.length > 0) {
    const ingredientsToInsert = tagged_ingredients.map(ingredient => ({
      post_id: post.id,
      ingredient_name: ingredient
    }));

    const { error: ingredientsError } = await supabase
      .from('post_tagged_ingredients')
      .insert(ingredientsToInsert);

    if (ingredientsError) {
      logger.error('Tagged ingredients creation error:', ingredientsError);
      // Don't fail the post creation if ingredients fail
    }
  }

  logger.info('Community post created', { postId: post.id, userId: req.user!.id });

  const response: ApiResponse<{ post: CommunityPost }> = {
    success: true,
    message: 'Post created successfully',
    data: { post }
  };

  res.status(201).json(response);
}));

// @desc    Update community post
// @route   PUT /api/v1/community/posts/:id
// @access  Private (Post owner only)
router.put('/posts/:id', protect, validate(communityPostSchema), asyncHandler(async (req: Request, res: Response) => {
  // Check if post exists and user owns it
  const { data: existingPost, error: checkError } = await supabase
    .from('community_posts')
    .select('user_id')
    .eq('id', req.params.id)
    .single();

  if (checkError || !existingPost) {
    throw new AppError('Post not found', 404);
  }

  if (existingPost.user_id !== req.user!.id) {
    throw new AppError('Not authorized to update this post', 403);
  }

  const updateData: UpdateCommunityPostRequest = {
    ...req.body,
    updated_at: new Date().toISOString()
  };

  const { data: post, error } = await supabase
    .from('community_posts')
    .update(updateData)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) {
    logger.error('Community post update error:', error);
    throw new AppError('Failed to update post', 500);
  }

  const response: ApiResponse<{ post: CommunityPost }> = {
    success: true,
    message: 'Post updated successfully',
    data: { post }
  };

  res.json(response);
}));

// @desc    Delete community post
// @route   DELETE /api/v1/community/posts/:id
// @access  Private (Post owner only)
router.delete('/posts/:id', protect, asyncHandler(async (req: Request, res: Response) => {
  // Check if post exists and user owns it
  const { data: existingPost, error: checkError } = await supabase
    .from('community_posts')
    .select('user_id')
    .eq('id', req.params.id)
    .single();

  if (checkError || !existingPost) {
    throw new AppError('Post not found', 404);
  }

  if (existingPost.user_id !== req.user!.id) {
    throw new AppError('Not authorized to delete this post', 403);
  }

  const { error } = await supabase
    .from('community_posts')
    .delete()
    .eq('id', req.params.id);

  if (error) {
    logger.error('Community post deletion error:', error);
    throw new AppError('Failed to delete post', 500);
  }

  const response: ApiResponse = {
    success: true,
    message: 'Post deleted successfully'
  };

  res.json(response);
}));

// @desc    Like/unlike post
// @route   POST/DELETE /api/v1/community/posts/:id/like
// @access  Private
router.post('/posts/:id/like', protect, asyncHandler(async (req: Request, res: Response) => {
  // Check if post exists
  const { data: post, error: postError } = await supabase
    .from('community_posts')
    .select('id')
    .eq('id', req.params.id)
    .single();

  if (postError || !post) {
    throw new AppError('Post not found', 404);
  }

  // Check if already liked
  const { data: existingLike } = await supabase
    .from('post_likes')
    .select('*')
    .eq('user_id', req.user!.id)
    .eq('post_id', req.params.id)
    .single();

  if (existingLike) {
    throw new AppError('Post already liked', 400);
  }

  // Like post
  const { error } = await supabase
    .from('post_likes')
    .insert({
      user_id: req.user!.id,
      post_id: req.params.id
    });

  if (error) {
    logger.error('Post like error:', error);
    throw new AppError('Failed to like post', 500);
  }

  const response: ApiResponse = {
    success: true,
    message: 'Post liked successfully'
  };

  res.json(response);
}));

router.delete('/posts/:id/like', protect, asyncHandler(async (req: Request, res: Response) => {
  const { error } = await supabase
    .from('post_likes')
    .delete()
    .eq('user_id', req.user!.id)
    .eq('post_id', req.params.id);

  if (error) {
    logger.error('Post unlike error:', error);
    throw new AppError('Failed to unlike post', 500);
  }

  const response: ApiResponse = {
    success: true,
    message: 'Post unliked successfully'
  };

  res.json(response);
}));

// @desc    Add comment to post
// @route   POST /api/v1/community/posts/:id/comments
// @access  Private
router.post('/posts/:id/comments', protect, asyncHandler(async (req: Request, res: Response) => {
  const { content, parent_comment_id } = req.body;

  if (!content || content.trim().length === 0) {
    throw new AppError('Comment content is required', 400);
  }

  // Check if post exists
  const { data: post, error: postError } = await supabase
    .from('community_posts')
    .select('id')
    .eq('id', req.params.id)
    .single();

  if (postError || !post) {
    throw new AppError('Post not found', 404);
  }

  const { data: comment, error } = await supabase
    .from('post_comments')
    .insert({
      post_id: req.params.id,
      user_id: req.user!.id,
      content: content.trim(),
      parent_comment_id: parent_comment_id || null,
      like_count: 0
    })
    .select(`
      *,
      user_profiles(name, image_url)
    `)
    .single();

  if (error) {
    logger.error('Comment creation error:', error);
    throw new AppError('Failed to create comment', 500);
  }

  const response: ApiResponse<{ comment: any }> = {
    success: true,
    message: 'Comment created successfully',
    data: { comment }
  };

  res.status(201).json(response);
}));

// @desc    Delete comment
// @route   DELETE /api/v1/community/comments/:id
// @access  Private (Comment owner only)
router.delete('/comments/:id', protect, asyncHandler(async (req: Request, res: Response) => {
  // Check if comment exists and user owns it
  const { data: existingComment, error: checkError } = await supabase
    .from('post_comments')
    .select('user_id')
    .eq('id', req.params.id)
    .single();

  if (checkError || !existingComment) {
    throw new AppError('Comment not found', 404);
  }

  if (existingComment.user_id !== req.user!.id) {
    throw new AppError('Not authorized to delete this comment', 403);
  }

  const { error } = await supabase
    .from('post_comments')
    .delete()
    .eq('id', req.params.id);

  if (error) {
    logger.error('Comment deletion error:', error);
    throw new AppError('Failed to delete comment', 500);
  }

  const response: ApiResponse = {
    success: true,
    message: 'Comment deleted successfully'
  };

  res.json(response);
}));

export default router;
