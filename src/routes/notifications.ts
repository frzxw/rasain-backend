import { Router, Response, NextFunction } from 'express';
import { auth } from '@/middleware/auth';
import { validateRequest } from '@/middleware/validation';
import { createClient } from '@/config/database';
import { AppError } from '@/utils/logger';
import {
  Notification,
  ApiResponse,
  CreateNotificationRequest,
  UpdateNotificationRequest,
  AuthenticatedRequest,
  PaginationQuery
} from '@/types';
import Joi from 'joi';

const router = Router();

// Validation schemas
const createNotificationSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  type: Joi.string().valid('recipe_like', 'recipe_comment', 'recipe_share', 'follow', 'system', 'reminder').required(),
  title: Joi.string().min(1).max(100).required(),
  message: Joi.string().min(1).max(500).required(),
  data: Joi.object().optional(),
  actionUrl: Joi.string().uri().optional()
});

const updateNotificationSchema = Joi.object({
  isRead: Joi.boolean().optional(),
  isArchived: Joi.boolean().optional()
});

const notificationQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  type: Joi.string().valid('recipe_like', 'recipe_comment', 'recipe_share', 'follow', 'system', 'reminder').optional(),
  isRead: Joi.boolean().optional(),
  isArchived: Joi.boolean().optional()
});

/**
 * @desc    Get user notifications with pagination and filtering
 * @route   GET /api/v1/notifications
 * @access  Private
 */
router.get(
  '/',
  auth,
  validateRequest({ query: notificationQuerySchema }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { page = 1, limit = 20, type, isRead, isArchived } = req.query as PaginationQuery & {
        type?: string;
        isRead?: boolean;
        isArchived?: boolean;
      };
      const offset = (page - 1) * limit;

      const supabase = createClient();
      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', req.user!.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply filters
      if (type) {
        query = query.eq('type', type);
      }
      if (typeof isRead === 'boolean') {
        query = query.eq('is_read', isRead);
      }
      if (typeof isArchived === 'boolean') {
        query = query.eq('is_archived', isArchived);
      }

      const { data: notifications, error, count } = await query;

      if (error) {
        throw new AppError('Failed to fetch notifications', 500);
      }

      const response: ApiResponse<{
        notifications: Notification[];
        pagination: {
          currentPage: number;
          totalPages: number;
          totalItems: number;
          hasNextPage: boolean;
          hasPreviousPage: boolean;
        };
      }> = {
        success: true,
        message: 'Notifications retrieved successfully',
        data: {
          notifications: notifications || [],
          pagination: {
            currentPage: page,
            totalPages: Math.ceil((count || 0) / limit),
            totalItems: count || 0,
            hasNextPage: (page * limit) < (count || 0),
            hasPreviousPage: page > 1
          }
        }
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @desc    Get unread notification count
 * @route   GET /api/v1/notifications/unread-count
 * @access  Private
 */
router.get(
  '/unread-count',
  auth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const supabase = createClient();
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', req.user!.id)
        .eq('is_read', false)
        .eq('is_archived', false);

      if (error) {
        throw new AppError('Failed to fetch unread count', 500);
      }

      const response: ApiResponse<{ count: number }> = {
        success: true,
        message: 'Unread count retrieved successfully',
        data: { count: count || 0 }
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @desc    Create a new notification (admin/system use)
 * @route   POST /api/v1/notifications
 * @access  Private (Admin)
 */
router.post(
  '/',
  auth,
  validateRequest({ body: createNotificationSchema }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Check if user has admin role (implement role-based access)
      // For now, any authenticated user can create notifications
      const notificationData: CreateNotificationRequest = req.body;

      const supabase = createClient();
      const { data: notification, error } = await supabase
        .from('notifications')
        .insert({
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

      const response: ApiResponse<Notification> = {
        success: true,
        message: 'Notification created successfully',
        data: notification
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @desc    Mark all notifications as read
 * @route   PATCH /api/v1/notifications/mark-all-read
 * @access  Private
 * Registered before /:id so the literal path is not captured as an id.
 */
router.patch(
  '/mark-all-read',
  auth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', req.user!.id)
        .eq('is_read', false);

      if (error) {
        throw new AppError('Failed to mark notifications as read', 500);
      }

      const response: ApiResponse<{ message: string }> = {
        success: true,
        message: 'All notifications marked as read',
        data: { message: 'All notifications marked as read successfully' }
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @desc    Archive multiple notifications
 * @route   PATCH /api/v1/notifications/bulk-archive
 * @access  Private
 */
router.patch(
  '/bulk-archive',
  auth,
  validateRequest({
    body: Joi.object({
      notificationIds: Joi.array().items(Joi.string().uuid()).required()
    })
  }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { notificationIds } = req.body;

      const supabase = createClient();
      const { error } = await supabase
        .from('notifications')
        .update({
          is_archived: true,
          updated_at: new Date().toISOString()
        })
        .in('id', notificationIds)
        .eq('user_id', req.user!.id);

      if (error) {
        throw new AppError('Failed to archive notifications', 500);
      }

      const response: ApiResponse<{ message: string }> = {
        success: true,
        message: 'Notifications archived successfully',
        data: { message: `${notificationIds.length} notifications archived successfully` }
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @desc    Update notification (mark as read/unread, archive)
 * @route   PATCH /api/v1/notifications/:id
 * @access  Private
 */
router.patch(
  '/:id',
  auth,
  validateRequest({ body: updateNotificationSchema }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const updateData: UpdateNotificationRequest = req.body;

      const supabase = createClient();
      
      // Check if notification belongs to user
      const { data: existingNotification, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', id)
        .eq('user_id', req.user!.id)
        .single();

      if (fetchError || !existingNotification) {
        throw new AppError('Notification not found', 404);
      }

      const { data: notification, error } = await supabase
        .from('notifications')
        .update({
          is_read: updateData.isRead ?? existingNotification.is_read,
          is_archived: updateData.isArchived ?? existingNotification.is_archived,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', req.user!.id)
        .select()
        .single();

      if (error) {
        throw new AppError('Failed to update notification', 500);
      }

      const response: ApiResponse<Notification> = {
        success: true,
        message: 'Notification updated successfully',
        data: notification
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @desc    Delete notification
 * @route   DELETE /api/v1/notifications/:id
 * @access  Private
 */
router.delete(
  '/:id',
  auth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const supabase = createClient();
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)
        .eq('user_id', req.user!.id);

      if (error) {
        throw new AppError('Failed to delete notification', 500);
      }

      const response: ApiResponse<{ message: string }> = {
        success: true,
        message: 'Notification deleted successfully',
        data: { message: 'Notification deleted successfully' }
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
