import express, { Request, Response } from 'express';
import { supabase } from '@/config/database';
import { asyncHandler, AppError } from '@/middleware/errorMiddleware';
import { validate } from '@/middleware/validation';
import { pantryItemSchema } from '@/middleware/validation';
import { protect } from '@/middleware/auth';
import { 
  ApiResponse, 
  PaginatedResponse, 
  PantryItem, 
  CreatePantryItemRequest, 
  UpdatePantryItemRequest,
  PantryCategory 
} from '@/types';
import logger from '@/utils/logger';

const router = express.Router();

// @desc    Get user's pantry items
// @route   GET /api/v1/pantry
// @access  Private
router.get('/', protect, asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 50, category, storage_location, expiring_soon } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let query = supabase
    .from('pantry_items')
    .select(`
      *,
      pantry_categories(name, icon)
    `)
    .eq('user_id', req.user!.id);

  // Apply filters
  if (category) {
    query = query.eq('category_id', category);
  }

  if (storage_location) {
    query = query.eq('storage_location', storage_location);
  }

  if (expiring_soon === 'true') {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    query = query.lte('expiration_date', sevenDaysFromNow.toISOString().split('T')[0]);
  }

  const { data: items, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + Number(limit) - 1);

  if (error) {
    logger.error('Pantry items fetch error:', error);
    throw new AppError('Failed to fetch pantry items', 500);
  }

  const response: PaginatedResponse<{ items: PantryItem[] }> = {
    success: true,
    data: { items: items || [] },
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: items?.length || 0
    }
  };

  res.json(response);
}));

// @desc    Get pantry categories
// @route   GET /api/v1/pantry/categories
// @access  Private
router.get('/categories', protect, asyncHandler(async (_req: Request, res: Response) => {
  const { data: categories, error } = await supabase
    .from('pantry_categories')
    .select('*')
    .order('name');

  if (error) {
    logger.error('Pantry categories fetch error:', error);
    throw new AppError('Failed to fetch pantry categories', 500);
  }

  const response: ApiResponse<{ categories: PantryCategory[] }> = {
    success: true,
    data: { categories: categories || [] }
  };

  res.json(response);
}));

// @desc    Get expiring items
// @route   GET /api/v1/pantry/expiring
// @access  Private
router.get('/expiring', protect, asyncHandler(async (req: Request, res: Response) => {
  const { days = 7 } = req.query;

  const { data: expiring_items, error } = await supabase.rpc(
    'get_expiring_items',
    {
      user_uuid: req.user!.id,
      days_ahead: Number(days)
    }
  );

  if (error) {
    logger.error('Expiring items fetch error:', error);
    throw new AppError('Failed to fetch expiring items', 500);
  }

  const response: ApiResponse<{ items: any[] }> = {
    success: true,
    data: { items: expiring_items || [] }
  };

  res.json(response);
}));

// @desc    Get single pantry item
// @route   GET /api/v1/pantry/:id
// @access  Private
router.get('/:id', protect, asyncHandler(async (req: Request, res: Response) => {
  const { data: item, error } = await supabase
    .from('pantry_items')
    .select(`
      *,
      pantry_categories(name, icon)
    `)
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id)
    .single();

  if (error || !item) {
    throw new AppError('Pantry item not found', 404);
  }

  const response: ApiResponse<{ item: PantryItem }> = {
    success: true,
    data: { item }
  };

  res.json(response);
}));

// @desc    Create pantry item
// @route   POST /api/v1/pantry
// @access  Private
router.post('/', protect, validate(pantryItemSchema), asyncHandler(async (req: Request, res: Response) => {
  const itemData: CreatePantryItemRequest = {
    ...req.body,
    user_id: req.user!.id
  };

  const { data: item, error } = await supabase
    .from('pantry_items')
    .insert(itemData)
    .select(`
      *,
      pantry_categories(name, icon)
    `)
    .single();

  if (error) {
    logger.error('Pantry item creation error:', error);
    throw new AppError('Failed to create pantry item', 500);
  }

  logger.info('Pantry item created', { itemId: item.id, userId: req.user!.id });

  const response: ApiResponse<{ item: PantryItem }> = {
    success: true,
    message: 'Pantry item created successfully',
    data: { item }
  };

  res.status(201).json(response);
}));

// @desc    Update pantry item
// @route   PUT /api/v1/pantry/:id
// @access  Private
router.put('/:id', protect, validate(pantryItemSchema), asyncHandler(async (req: Request, res: Response) => {
  // Check if item exists and user owns it
  const { data: existingItem, error: checkError } = await supabase
    .from('pantry_items')
    .select('user_id')
    .eq('id', req.params.id)
    .single();

  if (checkError || !existingItem) {
    throw new AppError('Pantry item not found', 404);
  }

  if (existingItem.user_id !== req.user!.id) {
    throw new AppError('Not authorized to update this item', 403);
  }

  const updateData: UpdatePantryItemRequest = {
    ...req.body,
    updated_at: new Date().toISOString()
  };

  const { data: item, error } = await supabase
    .from('pantry_items')
    .update(updateData)
    .eq('id', req.params.id)
    .select(`
      *,
      pantry_categories(name, icon)
    `)
    .single();

  if (error) {
    logger.error('Pantry item update error:', error);
    throw new AppError('Failed to update pantry item', 500);
  }

  const response: ApiResponse<{ item: PantryItem }> = {
    success: true,
    message: 'Pantry item updated successfully',
    data: { item }
  };

  res.json(response);
}));

// @desc    Delete pantry item
// @route   DELETE /api/v1/pantry/:id
// @access  Private
router.delete('/:id', protect, asyncHandler(async (req: Request, res: Response) => {
  // Check if item exists and user owns it
  const { data: existingItem, error: checkError } = await supabase
    .from('pantry_items')
    .select('user_id')
    .eq('id', req.params.id)
    .single();

  if (checkError || !existingItem) {
    throw new AppError('Pantry item not found', 404);
  }

  if (existingItem.user_id !== req.user!.id) {
    throw new AppError('Not authorized to delete this item', 403);
  }

  const { error } = await supabase
    .from('pantry_items')
    .delete()
    .eq('id', req.params.id);

  if (error) {
    logger.error('Pantry item deletion error:', error);
    throw new AppError('Failed to delete pantry item', 500);
  }

  const response: ApiResponse = {
    success: true,
    message: 'Pantry item deleted successfully'
  };

  res.json(response);
}));

// @desc    Bulk update pantry items
// @route   PATCH /api/v1/pantry/bulk
// @access  Private
router.patch('/bulk', protect, asyncHandler(async (req: Request, res: Response) => {
  const { items } = req.body;

  if (!items || !Array.isArray(items)) {
    throw new AppError('Items array is required', 400);
  }

  const updatePromises = items.map(async (item: any) => {
    const { id, ...updateData } = item;
    
    // Verify ownership
    const { data: existingItem } = await supabase
      .from('pantry_items')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existingItem || existingItem.user_id !== req.user!.id) {
      throw new AppError(`Not authorized to update item ${id}`, 403);
    }

    return supabase
      .from('pantry_items')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
  });

  try {
    await Promise.all(updatePromises);
  } catch (error) {
    logger.error('Bulk pantry update error:', error);
    throw new AppError('Failed to update pantry items', 500);
  }

  const response: ApiResponse = {
    success: true,
    message: 'Pantry items updated successfully'
  };

  res.json(response);
}));

// @desc    Mark item as used
// @route   POST /api/v1/pantry/:id/use
// @access  Private
router.post('/:id/use', protect, asyncHandler(async (req: Request, res: Response) => {
  const { quantity_used } = req.body;

  // Check if item exists and user owns it
  const { data: existingItem, error: checkError } = await supabase
    .from('pantry_items')
    .select('*')
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id)
    .single();

  if (checkError || !existingItem) {
    throw new AppError('Pantry item not found', 404);
  }

  // Update last used date and optionally reduce quantity
  const updateData: any = {
    last_used_date: new Date().toISOString().split('T')[0],
    updated_at: new Date().toISOString()
  };

  if (quantity_used && existingItem.total_quantity) {
    updateData.total_quantity = Math.max(0, existingItem.total_quantity - quantity_used);
  }

  const { data: item, error } = await supabase
    .from('pantry_items')
    .update(updateData)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) {
    logger.error('Pantry item use update error:', error);
    throw new AppError('Failed to mark item as used', 500);
  }

  const response: ApiResponse<{ item: PantryItem }> = {
    success: true,
    message: 'Item marked as used',
    data: { item }
  };

  res.json(response);
}));

export default router;
