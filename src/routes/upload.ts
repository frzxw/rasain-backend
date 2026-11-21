import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '@/middleware/auth';
import { validateRequest } from '@/middleware/validation';
import { createClient } from '@/config/database';
import { AppError } from '@/utils/logger';
import {
  AuthenticatedRequest,
  ApiResponse,
  FileUploadResponse
} from '@/types';
import Joi from 'joi';
import fs from 'fs/promises';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({  destination: async (_req, _file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads');
    
    // Create uploads directory if it doesn't exist
    try {
      await fs.access(uploadPath);
    } catch {
      await fs.mkdir(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allow images only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files are allowed', 400));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Maximum 5 files per request
  }
});

// Validation schemas
const uploadMetadataSchema = Joi.object({
  type: Joi.string().valid('recipe', 'profile', 'ingredient', 'step').required(),
  recipeId: Joi.string().uuid().optional(),
  description: Joi.string().max(500).optional()
});

/**
 * @desc    Upload single image
 * @route   POST /api/v1/upload/image
 * @access  Private
 */
router.post(
  '/image',
  auth,
  upload.single('image'),
  validateRequest({ body: uploadMetadataSchema }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new AppError('No image file provided', 400);
      }

      const { type, recipeId, description } = req.body;
      const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
      const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;

      // Save upload record to database
      const supabase = createClient();
      const { data: uploadRecord, error } = await supabase
        .from('uploads')
        .insert({
          id: uuidv4(),
          user_id: req.user!.id,
          filename: req.file.filename,
          original_name: req.file.originalname,
          mime_type: req.file.mimetype,
          size: req.file.size,
          url: imageUrl,
          type,
          recipe_id: recipeId || null,
          description: description || null
        })
        .select()
        .single();

      if (error) {
        // Clean up uploaded file if database insertion fails
        await fs.unlink(req.file.path).catch(() => {});
        throw new AppError('Failed to save upload record', 500);
      }

      const response: ApiResponse<FileUploadResponse> = {
        success: true,
        message: 'Image uploaded successfully',
        data: {
          id: uploadRecord.id,
          url: imageUrl,
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          type: uploadRecord.type
        }
      };

      res.status(201).json(response);
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      next(error);
    }
  }
);

/**
 * @desc    Upload multiple images
 * @route   POST /api/v1/upload/images
 * @access  Private
 */
router.post(
  '/images',
  auth,
  upload.array('images', 5),
  validateRequest({ body: uploadMetadataSchema }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        throw new AppError('No image files provided', 400);
      }

      const { type, recipeId, description } = req.body;
      const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
      
      const uploadPromises = files.map(async (file) => {
        const imageUrl = `${baseUrl}/uploads/${file.filename}`;
        
        const supabase = createClient();
        const { data: uploadRecord, error } = await supabase
          .from('uploads')
          .insert({
            id: uuidv4(),
            user_id: req.user!.id,
            filename: file.filename,
            original_name: file.originalname,
            mime_type: file.mimetype,
            size: file.size,
            url: imageUrl,
            type,
            recipe_id: recipeId || null,
            description: description || null
          })
          .select()
          .single();

        if (error) {
          // Clean up uploaded file if database insertion fails
          await fs.unlink(file.path).catch(() => {});
          throw new AppError(`Failed to save upload record for ${file.originalname}`, 500);
        }

        return {
          id: uploadRecord.id,
          url: imageUrl,
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
          type: uploadRecord.type
        };
      });

      const uploadResults = await Promise.all(uploadPromises);

      const response: ApiResponse<FileUploadResponse[]> = {
        success: true,
        message: `${uploadResults.length} images uploaded successfully`,
        data: uploadResults
      };

      res.status(201).json(response);
    } catch (error) {
      // Clean up uploaded files on error
      if (req.files) {
        const files = req.files as Express.Multer.File[];
        for (const file of files) {
          await fs.unlink(file.path).catch(() => {});
        }
      }
      next(error);
    }
  }
);

/**
 * @desc    Get user uploads
 * @route   GET /api/v1/upload/my-uploads
 * @access  Private
 */
router.get(
  '/my-uploads',
  auth,
  validateRequest({
    query: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
      type: Joi.string().valid('recipe', 'profile', 'ingredient', 'step').optional()
    })
  }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { page = 1, limit = 20, type } = req.query as any;
      const offset = (page - 1) * limit;

      const supabase = createClient();
      let query = supabase
        .from('uploads')
        .select('*', { count: 'exact' })
        .eq('user_id', req.user!.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (type) {
        query = query.eq('type', type);
      }

      const { data: uploads, error, count } = await query;

      if (error) {
        throw new AppError('Failed to fetch uploads', 500);
      }

      const response: ApiResponse<{
        uploads: any[];
        pagination: {
          currentPage: number;
          totalPages: number;
          totalItems: number;
          hasNextPage: boolean;
          hasPreviousPage: boolean;
        };
      }> = {
        success: true,
        message: 'Uploads retrieved successfully',
        data: {
          uploads: uploads || [],
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
 * @desc    Delete uploaded file
 * @route   DELETE /api/v1/upload/:id
 * @access  Private
 */
router.delete(
  '/:id',
  auth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const supabase = createClient();
      
      // Get upload record to find the file
      const { data: upload, error: fetchError } = await supabase
        .from('uploads')
        .select('*')
        .eq('id', id)
        .eq('user_id', req.user!.id)
        .single();

      if (fetchError || !upload) {
        throw new AppError('Upload not found', 404);
      }

      // Delete file from filesystem
      const filePath = path.join(process.cwd(), 'uploads', upload.filename);
      try {
        await fs.unlink(filePath);
      } catch (_fileError) {
        // File might already be deleted, continue with database cleanup
        console.warn(`Failed to delete file: ${filePath}`);
      }

      // Delete record from database
      const { error: deleteError } = await supabase
        .from('uploads')
        .delete()
        .eq('id', id)
        .eq('user_id', req.user!.id);

      if (deleteError) {
        throw new AppError('Failed to delete upload record', 500);
      }

      const response: ApiResponse<{ message: string }> = {
        success: true,
        message: 'File deleted successfully',
        data: { message: 'File deleted successfully' }
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @desc    Get upload by ID
 * @route   GET /api/v1/upload/:id
 * @access  Private
 */
router.get(
  '/:id',
  auth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const supabase = createClient();
      const { data: upload, error } = await supabase
        .from('uploads')
        .select('*')
        .eq('id', id)
        .eq('user_id', req.user!.id)
        .single();

      if (error || !upload) {
        throw new AppError('Upload not found', 404);
      }

      const response: ApiResponse<any> = {
        success: true,
        message: 'Upload retrieved successfully',
        data: upload
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @desc    Update upload metadata
 * @route   PATCH /api/v1/upload/:id
 * @access  Private
 */
router.patch(
  '/:id',
  auth,
  validateRequest({
    body: Joi.object({
      description: Joi.string().max(500).optional(),
      type: Joi.string().valid('recipe', 'profile', 'ingredient', 'step').optional()
    })
  }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { description, type } = req.body;

      const supabase = createClient();
      
      // Check if upload exists and belongs to user
      const { data: existingUpload, error: fetchError } = await supabase
        .from('uploads')
        .select('*')
        .eq('id', id)
        .eq('user_id', req.user!.id)
        .single();

      if (fetchError || !existingUpload) {
        throw new AppError('Upload not found', 404);
      }

      const { data: upload, error } = await supabase
        .from('uploads')
        .update({
          description: description ?? existingUpload.description,
          type: type ?? existingUpload.type,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', req.user!.id)
        .select()
        .single();

      if (error) {
        throw new AppError('Failed to update upload', 500);
      }

      const response: ApiResponse<any> = {
        success: true,
        message: 'Upload updated successfully',
        data: upload
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
