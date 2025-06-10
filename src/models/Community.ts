import { createClient } from '@/config/database';
import { CommunityPost, PostComment } from '@/types';
import { AppError } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class CommunityModel {
  /**
   * Create a new community post
   */
  static async createPost(postData: {
    userId: string;
    content: string;
    imageUrl?: string;
    recipeId?: string;
    type: 'text' | 'recipe_share' | 'image';
  }): Promise<CommunityPost> {
    const supabase = createClient();

    const { data: post, error } = await supabase
      .from('community_posts')
      .insert({
        id: uuidv4(),
        user_id: postData.userId,
        content: postData.content,
        image_url: postData.imageUrl,
        recipe_id: postData.recipeId,
        type: postData.type,
        likes_count: 0,
        comments_count: 0,
        shares_count: 0
      })
      .select()
      .single();

    if (error) {
      throw new AppError('Failed to create community post', 500);
    }

    // Update user's posts count
    await this.updateUserPostsCount(postData.userId);

    return post;
  }

  /**
   * Get community posts with pagination
   */
  static async getPosts(params: {
    page?: number;
    limit?: number;
    userId?: string;
    type?: string;
  }): Promise<{
    posts: any[];
    total: number;
  }> {
    const supabase = createClient();
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('community_posts')
      .select(`
        *,
        user_profiles!inner(name, image_url),
        recipes(name, image_url, slug)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (params.userId) {
      query = query.eq('user_id', params.userId);
    }
    if (params.type) {
      query = query.eq('type', params.type);
    }

    const { data: posts, error, count } = await query;

    if (error) {
      throw new AppError('Failed to fetch community posts', 500);
    }

    return {
      posts: posts || [],
      total: count || 0
    };
  }

  /**
   * Get post by ID with user and recipe details
   */
  static async getPostById(postId: string): Promise<any | null> {
    const supabase = createClient();

    const { data: post, error } = await supabase
      .from('community_posts')
      .select(`
        *,
        user_profiles!inner(name, image_url),
        recipes(name, image_url, slug)
      `)
      .eq('id', postId)
      .single();

    if (error) {
      return null;
    }

    return post;
  }

  /**
   * Update post
   */
  static async updatePost(postId: string, userId: string, updateData: {
    content?: string;
    imageUrl?: string;
  }): Promise<CommunityPost> {
    const supabase = createClient();

    // Check if user owns the post
    const { data: existingPost, error: fetchError } = await supabase
      .from('community_posts')
      .select('*')
      .eq('id', postId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingPost) {
      throw new AppError('Post not found or access denied', 404);
    }

    const { data: post, error } = await supabase
      .from('community_posts')
      .update({
        content: updateData.content || existingPost.content,
        image_url: updateData.imageUrl || existingPost.image_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new AppError('Failed to update post', 500);
    }

    return post;
  }

  /**
   * Delete post
   */
  static async deletePost(postId: string, userId: string): Promise<void> {
    const supabase = createClient();

    // Check if user owns the post
    const { data: existingPost, error: fetchError } = await supabase
      .from('community_posts')
      .select('*')
      .eq('id', postId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingPost) {
      throw new AppError('Post not found or access denied', 404);
    }

    // Delete related comments and likes first
    await supabase.from('post_comments').delete().eq('post_id', postId);
    await supabase.from('post_likes').delete().eq('post_id', postId);

    // Delete post
    const { error } = await supabase
      .from('community_posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', userId);

    if (error) {
      throw new AppError('Failed to delete post', 500);
    }

    // Update user's posts count
    await this.updateUserPostsCount(userId);
  }

  /**
   * Like/Unlike a post
   */
  static async toggleLike(postId: string, userId: string): Promise<{ liked: boolean; likesCount: number }> {
    const supabase = createClient();

    // Check if user already liked the post
    const { data: existingLike } = await supabase
      .from('post_likes')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();

    if (existingLike) {
      // Unlike the post
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);

      if (error) {
        throw new AppError('Failed to unlike post', 500);
      }

      // Update likes count
      const likesCount = await this.updatePostLikesCount(postId);
      return { liked: false, likesCount };
    } else {
      // Like the post
      const { error } = await supabase
        .from('post_likes')
        .insert({
          id: uuidv4(),
          post_id: postId,
          user_id: userId
        });

      if (error) {
        throw new AppError('Failed to like post', 500);
      }

      // Update likes count
      const likesCount = await this.updatePostLikesCount(postId);
      return { liked: true, likesCount };
    }
  }

  /**
   * Add comment to post
   */
  static async addComment(commentData: {
    postId: string;
    userId: string;
    content: string;
    parentId?: string;
  }): Promise<PostComment> {
    const supabase = createClient();

    const { data: comment, error } = await supabase
      .from('post_comments')
      .insert({
        id: uuidv4(),
        post_id: commentData.postId,
        user_id: commentData.userId,
        content: commentData.content,
        parent_id: commentData.parentId || null
      })
      .select()
      .single();

    if (error) {
      throw new AppError('Failed to add comment', 500);
    }

    // Update comments count
    await this.updatePostCommentsCount(commentData.postId);

    return comment;
  }

  /**
   * Get comments for a post
   */
  static async getPostComments(postId: string, params: {
    page?: number;
    limit?: number;
  }): Promise<{
    comments: any[];
    total: number;
  }> {
    const supabase = createClient();
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    const { data: comments, error, count } = await supabase
      .from('post_comments')
      .select(`
        *,
        user_profiles!inner(name, image_url)
      `, { count: 'exact' })
      .eq('post_id', postId)
      .is('parent_id', null) // Get only top-level comments
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new AppError('Failed to fetch comments', 500);
    }

    return {
      comments: comments || [],
      total: count || 0
    };
  }

  /**
   * Delete comment
   */
  static async deleteComment(commentId: string, userId: string): Promise<void> {
    const supabase = createClient();

    // Check if user owns the comment
    const { data: existingComment, error: fetchError } = await supabase
      .from('post_comments')
      .select('*')
      .eq('id', commentId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingComment) {
      throw new AppError('Comment not found or access denied', 404);
    }

    // Delete replies first
    await supabase
      .from('post_comments')
      .delete()
      .eq('parent_id', commentId);

    // Delete comment
    const { error } = await supabase
      .from('post_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId);

    if (error) {
      throw new AppError('Failed to delete comment', 500);
    }

    // Update comments count
    await this.updatePostCommentsCount(existingComment.post_id);
  }

  /**
   * Share a post (create a new post that references the original)
   */
  static async sharePost(postId: string, userId: string, content?: string): Promise<CommunityPost> {
    const supabase = createClient();

    // Get the original post
    const { data: originalPost, error: fetchError } = await supabase
      .from('community_posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (fetchError || !originalPost) {
      throw new AppError('Original post not found', 404);
    }

    // Create share post
    const { data: sharePost, error } = await supabase
      .from('community_posts')
      .insert({
        id: uuidv4(),
        user_id: userId,
        content: content || `Shared a post`,
        type: 'text',
        shared_post_id: postId,
        likes_count: 0,
        comments_count: 0,
        shares_count: 0
      })
      .select()
      .single();

    if (error) {
      throw new AppError('Failed to share post', 500);
    }

    // Update original post shares count
    await this.updatePostSharesCount(postId);

    // Update user's posts count
    await this.updateUserPostsCount(userId);

    return sharePost;
  }

  /**
   * Get trending posts (most liked/commented in recent time)
   */
  static async getTrendingPosts(limit: number = 10): Promise<any[]> {
    const supabase = createClient();
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const { data: posts, error } = await supabase
      .from('community_posts')
      .select(`
        *,
        user_profiles!inner(name, image_url),
        recipes(name, image_url, slug)
      `)
      .gte('created_at', oneDayAgo.toISOString())
      .order('likes_count', { ascending: false })
      .order('comments_count', { ascending: false })
      .limit(limit);

    if (error) {
      throw new AppError('Failed to fetch trending posts', 500);
    }

    return posts || [];
  }

  /**
   * Get user's feed (posts from followed users)
   */
  static async getUserFeed(userId: string, params: {
    page?: number;
    limit?: number;
  }): Promise<{
    posts: any[];
    total: number;
  }> {
    const supabase = createClient();
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    // First get users that this user follows
    const { data: following } = await supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', userId);

    const followingIds = following?.map(f => f.following_id) || [];
    followingIds.push(userId); // Include user's own posts

    const { data: posts, error, count } = await supabase
      .from('community_posts')
      .select(`
        *,
        user_profiles!inner(name, image_url),
        recipes(name, image_url, slug)
      `, { count: 'exact' })
      .in('user_id', followingIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new AppError('Failed to fetch user feed', 500);
    }

    return {
      posts: posts || [],
      total: count || 0
    };
  }

  /**
   * Update post likes count
   */
  private static async updatePostLikesCount(postId: string): Promise<number> {
    const supabase = createClient();

    const { count } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    const likesCount = count || 0;

    await supabase
      .from('community_posts')
      .update({ likes_count: likesCount })
      .eq('id', postId);

    return likesCount;
  }

  /**
   * Update post comments count
   */
  private static async updatePostCommentsCount(postId: string): Promise<number> {
    const supabase = createClient();

    const { count } = await supabase
      .from('post_comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    const commentsCount = count || 0;

    await supabase
      .from('community_posts')
      .update({ comments_count: commentsCount })
      .eq('id', postId);

    return commentsCount;
  }

  /**
   * Update post shares count
   */
  private static async updatePostSharesCount(postId: string): Promise<number> {
    const supabase = createClient();

    const { count } = await supabase
      .from('community_posts')
      .select('*', { count: 'exact', head: true })
      .eq('shared_post_id', postId);

    const sharesCount = count || 0;

    await supabase
      .from('community_posts')
      .update({ shares_count: sharesCount })
      .eq('id', postId);

    return sharesCount;
  }

  /**
   * Update user's posts count
   */
  private static async updateUserPostsCount(userId: string): Promise<void> {
    const supabase = createClient();

    const { count } = await supabase
      .from('community_posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    await supabase
      .from('user_profiles')
      .update({ posts_count: count || 0 })
      .eq('id', userId);
  }
}
