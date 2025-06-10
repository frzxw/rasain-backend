import { createClient } from '@/config/database';
import { Notification } from '@/types';
import { AppError } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class NotificationModel {
  /**
   * Create a new notification
   */
  static async createNotification(notificationData: {
    userId: string;
    type: 'recipe_like' | 'recipe_comment' | 'recipe_share' | 'follow' | 'system' | 'reminder';
    title: string;
    message: string;
    data?: Record<string, any>;
    actionUrl?: string;
  }): Promise<Notification> {
    const supabase = createClient();

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        id: uuidv4(),
        user_id: notificationData.userId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data || {},
        action_url: notificationData.actionUrl,
        is_read: false,
        is_archived: false
      })
      .select()
      .single();

    if (error) {
      throw new AppError('Failed to create notification', 500);
    }

    return notification;
  }

  /**
   * Get notifications for a user with pagination
   */
  static async getUserNotifications(userId: string, params: {
    page?: number;
    limit?: number;
    type?: string;
    isRead?: boolean;
    isArchived?: boolean;
  }): Promise<{
    notifications: Notification[];
    total: number;
  }> {
    const supabase = createClient();
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (params.type) {
      query = query.eq('type', params.type);
    }
    if (typeof params.isRead === 'boolean') {
      query = query.eq('is_read', params.isRead);
    }
    if (typeof params.isArchived === 'boolean') {
      query = query.eq('is_archived', params.isArchived);
    }

    const { data: notifications, error, count } = await query;

    if (error) {
      throw new AppError('Failed to fetch notifications', 500);
    }

    return {
      notifications: notifications || [],
      total: count || 0
    };
  }

  /**
   * Get unread notification count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    const supabase = createClient();

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)
      .eq('is_archived', false);

    if (error) {
      throw new AppError('Failed to fetch unread count', 500);
    }

    return count || 0;
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    const supabase = createClient();

    const { data: notification, error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new AppError('Failed to mark notification as read', 500);
    }

    return notification;
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      throw new AppError('Failed to mark all notifications as read', 500);
    }
  }

  /**
   * Archive notification
   */
  static async archiveNotification(notificationId: string, userId: string): Promise<Notification> {
    const supabase = createClient();

    const { data: notification, error } = await supabase
      .from('notifications')
      .update({
        is_archived: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new AppError('Failed to archive notification', 500);
    }

    return notification;
  }

  /**
   * Archive multiple notifications
   */
  static async archiveMultiple(notificationIds: string[], userId: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
      .from('notifications')
      .update({
        is_archived: true,
        updated_at: new Date().toISOString()
      })
      .in('id', notificationIds)
      .eq('user_id', userId);

    if (error) {
      throw new AppError('Failed to archive notifications', 500);
    }
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) {
      throw new AppError('Failed to delete notification', 500);
    }
  }

  /**
   * Create system notification for all users
   */
  static async createSystemNotification(notificationData: {
    title: string;
    message: string;
    data?: Record<string, any>;
    actionUrl?: string;
  }): Promise<void> {
    const supabase = createClient();

    // Get all user IDs
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id');

    if (usersError || !users) {
      throw new AppError('Failed to fetch users for system notification', 500);
    }

    // Create notifications for all users
    const notifications = users.map(user => ({
      id: uuidv4(),
      user_id: user.id,
      type: 'system' as const,
      title: notificationData.title,
      message: notificationData.message,
      data: notificationData.data || {},
      action_url: notificationData.actionUrl,
      is_read: false,
      is_archived: false
    }));

    // Insert in batches to avoid overwhelming the database
    const batchSize = 100;
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      const { error } = await supabase
        .from('notifications')
        .insert(batch);

      if (error) {
        console.error(`Failed to insert notification batch ${i / batchSize + 1}:`, error);
      }
    }
  }

  /**
   * Create recipe interaction notification
   */
  static async createRecipeNotification(params: {
    recipeId: string;
    recipeName: string;
    recipeOwnerId: string;
    actorId: string;
    actorName: string;
    type: 'recipe_like' | 'recipe_comment' | 'recipe_share';
    message?: string;
  }): Promise<void> {
    const { recipeId, recipeName, recipeOwnerId, actorId, actorName, type, message } = params;

    // Don't create notification if user is interacting with their own recipe
    if (recipeOwnerId === actorId) {
      return;
    }

    let title: string;
    let notificationMessage: string;

    switch (type) {
      case 'recipe_like':
        title = 'Recipe Liked';
        notificationMessage = `${actorName} liked your recipe "${recipeName}"`;
        break;
      case 'recipe_comment':
        title = 'New Comment';
        notificationMessage = `${actorName} commented on your recipe "${recipeName}"`;
        if (message) {
          notificationMessage += `: "${message}"`;
        }
        break;
      case 'recipe_share':
        title = 'Recipe Shared';
        notificationMessage = `${actorName} shared your recipe "${recipeName}"`;
        break;
      default:
        return;
    }

    await this.createNotification({
      userId: recipeOwnerId,
      type,
      title,
      message: notificationMessage,
      data: {
        recipeId,
        recipeName,
        actorId,
        actorName
      },
      actionUrl: `/recipes/${recipeId}`
    });
  }

  /**
   * Create follow notification
   */
  static async createFollowNotification(followerId: string, followerName: string, followedId: string): Promise<void> {
    await this.createNotification({
      userId: followedId,
      type: 'follow',
      title: 'New Follower',
      message: `${followerName} started following you`,
      data: {
        followerId,
        followerName
      },
      actionUrl: `/users/${followerId}`
    });
  }

  /**
   * Clean up old notifications (older than specified days)
   */
  static async cleanupOldNotifications(daysOld: number = 30): Promise<number> {
    const supabase = createClient();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { count, error } = await supabase
      .from('notifications')
      .delete({ count: 'exact' })
      .lt('created_at', cutoffDate.toISOString());

    if (error) {
      throw new AppError('Failed to cleanup old notifications', 500);
    }

    return count || 0;
  }

  /**
   * Get notification by ID
   */
  static async getById(notificationId: string, userId: string): Promise<Notification | null> {
    const supabase = createClient();

    const { data: notification, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .eq('user_id', userId)
      .single();

    if (error) {
      return null;
    }

    return notification;
  }
}
