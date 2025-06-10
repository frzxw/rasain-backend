import express, { Request, Response } from 'express';
import { supabase } from '@/config/database';
import { asyncHandler, AppError } from '@/middleware/errorMiddleware';
import { validate, validateQuery } from '@/middleware/validation';
import { createRecipeSchema, updateRecipeSchema, ratingSchema, searchSchema } from '@/middleware/validation';
import { protect, optionalAuth } from '@/middleware/auth';
import { 
  ApiResponse, 
  PaginatedResponse, 
  Recipe, 
  CreateRecipeRequest, 
  UpdateRecipeRequest,
  RateRecipeRequest 
} from '@/types';
import logger from '@/utils/logger';

const router = express.Router();

// @desc    Get popular recipes
// @route   GET /api/v1/recipes/popular
// @access  Public
router.get('/popular', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const { data: recipes, error } = await supabase
    .from('recipes')
    .select(`
      *,
      recipe_reviews(rating),
      saved_recipes!saved_recipes_recipe_id_fkey(user_id)
    `)
    .eq('is_published', true)
    .order('rating', { ascending: false })
    .order('review_count', { ascending: false })
    .range(offset, offset + Number(limit) - 1);

  if (error) {
    logger.error('Popular recipes fetch error:', error);
    throw new AppError('Failed to fetch popular recipes', 500);
  }

  // Process recipes to include is_saved flag for authenticated users
  const processedRecipes = recipes?.map(recipe => ({
    ...recipe,
    is_saved: req.user ? recipe.saved_recipes?.some((sr: any) => sr.user_id === req.user!.id) : false,
    saved_recipes: undefined // Remove the saved_recipes array from response
  })) || [];

  const response: PaginatedResponse<{ recipes: Recipe[] }> = {
    success: true,
    data: {
      recipes: processedRecipes
    },
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: processedRecipes.length
    }
  };

  res.json(response);
}));

// @desc    Get recipes based on pantry items
// @route   GET /api/v1/recipes/pantry
// @access  Private
router.get('/pantry', protect, asyncHandler(async (req: Request, res: Response) => {
  const { limit = 20 } = req.query;
  // Remove unused page and offset variables since we're using database function

  // Get user's pantry items
  const { data: pantryItems } = await supabase
    .from('pantry_items')
    .select('name')
    .eq('user_id', req.user!.id);

  if (!pantryItems || pantryItems.length === 0) {
    const response: ApiResponse<{ recipes: Recipe[] }> = {
      success: true,
      data: { recipes: [] }
    };
    res.json(response);
    return;
  }

  // Remove unused pantryIngredients since we use database function
  // const pantryIngredients = pantryItems.map(item => item.name.toLowerCase());

  // Use the database function to get pantry-based recommendations
  const { data: recommendations, error } = await supabase.rpc(
    'get_pantry_based_recommendations',
    {
      user_uuid: req.user!.id,
      limit_count: Number(limit)
    }
  );

  if (error) {
    logger.error('Pantry recipes fetch error:', error);
    throw new AppError('Failed to fetch pantry recipes', 500);
  }

  const response: ApiResponse<{ 
    recipes: any[], 
    pantry_items: any[], 
    match_info: string 
  }> = {
    success: true,
    data: {
      recipes: recommendations || [],
      pantry_items: pantryItems,
      match_info: `Found ${recommendations?.length || 0} recipes using your pantry ingredients`
    }
  };

  res.json(response);
}));

// @desc    Get latest recipes
// @route   GET /api/v1/recipes/latest
// @access  Public
router.get('/latest', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const { data: recipes, error } = await supabase
    .from('recipes')
    .select(`
      *,
      recipe_reviews(rating),
      saved_recipes!saved_recipes_recipe_id_fkey(user_id)
    `)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + Number(limit) - 1);

  if (error) {
    logger.error('Latest recipes fetch error:', error);
    throw new AppError('Failed to fetch latest recipes', 500);
  }

  const processedRecipes = recipes?.map(recipe => ({
    ...recipe,
    is_saved: req.user ? recipe.saved_recipes?.some((sr: any) => sr.user_id === req.user!.id) : false,
    saved_recipes: undefined
  })) || [];

  const response: PaginatedResponse<{ recipes: Recipe[] }> = {
    success: true,
    data: {
      recipes: processedRecipes
    },
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: processedRecipes.length
    }
  };

  res.json(response);
}));

// @desc    Search recipes
// @route   GET /api/v1/recipes/search
// @access  Public
router.get('/search', validateQuery(searchSchema), optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { query, category, page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let supabaseQuery = supabase
    .from('recipes')
    .select(`
      *,
      recipe_reviews(rating),
      saved_recipes!saved_recipes_recipe_id_fkey(user_id)
    `)
    .eq('is_published', true);

  // Text search in name and description
  if (query) {
    supabaseQuery = supabaseQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
  }

  // Category filter
  if (category) {
    supabaseQuery = supabaseQuery.contains('categories', [category]);
  }

  const { data: recipes, error } = await supabaseQuery
    .order('rating', { ascending: false })
    .range(offset, offset + Number(limit) - 1);

  if (error) {
    logger.error('Recipe search error:', error);
    throw new AppError('Failed to search recipes', 500);
  }

  const processedRecipes = recipes?.map(recipe => ({
    ...recipe,
    is_saved: req.user ? recipe.saved_recipes?.some((sr: any) => sr.user_id === req.user!.id) : false,
    saved_recipes: undefined
  })) || [];

  const response: PaginatedResponse<{ 
    recipes: Recipe[], 
    query: string | undefined, 
    category: string | undefined 
  }> = {
    success: true,
    data: {
      recipes: processedRecipes,
      query: query as string,
      category: category as string
    },
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: processedRecipes.length
    }
  };

  res.json(response);
}));

// @desc    Get single recipe by ID
// @route   GET /api/v1/recipes/:id
// @access  Public
router.get('/:id', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { data: recipe, error } = await supabase
    .from('recipes')
    .select(`
      *,
      user_profiles(name, image_url),
      recipe_reviews(rating, comment, user_id, created_at),
      saved_recipes!saved_recipes_recipe_id_fkey(user_id),
      recipe_ingredients(*),
      recipe_instructions(*)
    `)
    .eq('id', req.params.id)
    .eq('is_published', true)
    .single();

  if (error || !recipe) {
    throw new AppError('Recipe not found', 404);
  }

  // Process recipe data
  const processedRecipe = {
    ...recipe,
    is_saved: req.user ? recipe.saved_recipes?.some((sr: any) => sr.user_id === req.user!.id) : false,
    author: recipe.user_profiles,
    reviews: recipe.recipe_reviews,
    ingredients: recipe.recipe_ingredients,
    instructions: recipe.recipe_instructions,
    user_profiles: undefined,
    recipe_reviews: undefined,
    recipe_ingredients: undefined,
    recipe_instructions: undefined,
    saved_recipes: undefined
  };

  const response: ApiResponse<{ recipe: any }> = {
    success: true,
    data: { recipe: processedRecipe }
  };

  res.json(response);
}));

// @desc    Create new recipe
// @route   POST /api/v1/recipes
// @access  Private
router.post('/', protect, validate(createRecipeSchema), asyncHandler(async (req: Request, res: Response) => {
  const recipeData: CreateRecipeRequest = req.body;

  const recipeToInsert = {
    ...recipeData,
    created_by: req.user!.id,
    slug: recipeData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    is_published: true,
    rating: 0,
    review_count: 0
  };

  // Remove ingredients and instructions from main recipe data
  const { ingredients, instructions, ...mainRecipeData } = recipeToInsert;

  const { data: recipe, error } = await supabase
    .from('recipes')
    .insert(mainRecipeData)
    .select()
    .single();

  if (error) {
    logger.error('Recipe creation error:', error);
    throw new AppError('Failed to create recipe', 500);
  }

  // Insert ingredients
  if (ingredients && ingredients.length > 0) {
    const ingredientsToInsert = ingredients.map((ingredient, index) => ({
      recipe_id: recipe.id,
      ...ingredient,
      order_index: index
    }));

    const { error: ingredientsError } = await supabase
      .from('recipe_ingredients')
      .insert(ingredientsToInsert);

    if (ingredientsError) {
      logger.error('Recipe ingredients creation error:', ingredientsError);
      // Clean up recipe if ingredients fail
      await supabase.from('recipes').delete().eq('id', recipe.id);
      throw new AppError('Failed to create recipe ingredients', 500);
    }
  }

  // Insert instructions
  if (instructions && instructions.length > 0) {
    const instructionsToInsert = instructions.map((instruction, index) => ({
      recipe_id: recipe.id,
      step_number: index + 1,
      ...instruction
    }));

    const { error: instructionsError } = await supabase
      .from('recipe_instructions')
      .insert(instructionsToInsert);

    if (instructionsError) {
      logger.error('Recipe instructions creation error:', instructionsError);
      // Clean up recipe and ingredients if instructions fail
      await supabase.from('recipe_ingredients').delete().eq('recipe_id', recipe.id);
      await supabase.from('recipes').delete().eq('id', recipe.id);
      throw new AppError('Failed to create recipe instructions', 500);
    }
  }

  logger.info('Recipe created', { recipeId: recipe.id, userId: req.user!.id });

  const response: ApiResponse<{ recipe: Recipe }> = {
    success: true,
    message: 'Recipe created successfully',
    data: { recipe }
  };

  res.status(201).json(response);
}));

// @desc    Update recipe
// @route   PUT /api/v1/recipes/:id
// @access  Private (Recipe owner only)
router.put('/:id', protect, validate(updateRecipeSchema), asyncHandler(async (req: Request, res: Response) => {
  // Check if recipe exists and user owns it
  const { data: existingRecipe, error: checkError } = await supabase
    .from('recipes')
    .select('created_by')
    .eq('id', req.params.id)
    .single();

  if (checkError || !existingRecipe) {
    throw new AppError('Recipe not found', 404);
  }

  if (existingRecipe.created_by !== req.user!.id) {
    throw new AppError('Not authorized to update this recipe', 403);
  }

  const updateData: UpdateRecipeRequest = {
    ...req.body,
    updated_at: new Date().toISOString()
  };

  if (req.body.name) {
    updateData.name = req.body.name;
  }

  const { data: recipe, error } = await supabase
    .from('recipes')
    .update(updateData)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) {
    logger.error('Recipe update error:', error);
    throw new AppError('Failed to update recipe', 500);
  }

  const response: ApiResponse<{ recipe: Recipe }> = {
    success: true,
    message: 'Recipe updated successfully',
    data: { recipe }
  };

  res.json(response);
}));

// @desc    Delete recipe
// @route   DELETE /api/v1/recipes/:id
// @access  Private (Recipe owner only)
router.delete('/:id', protect, asyncHandler(async (req: Request, res: Response) => {
  // Check if recipe exists and user owns it
  const { data: existingRecipe, error: checkError } = await supabase
    .from('recipes')
    .select('created_by')
    .eq('id', req.params.id)
    .single();

  if (checkError || !existingRecipe) {
    throw new AppError('Recipe not found', 404);
  }

  if (existingRecipe.created_by !== req.user!.id) {
    throw new AppError('Not authorized to delete this recipe', 403);
  }

  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', req.params.id);

  if (error) {
    logger.error('Recipe deletion error:', error);
    throw new AppError('Failed to delete recipe', 500);
  }

  const response: ApiResponse = {
    success: true,
    message: 'Recipe deleted successfully'
  };

  res.json(response);
}));

// @desc    Save/unsave recipe
// @route   POST/DELETE /api/v1/recipes/:id/save
// @access  Private
router.post('/:id/save', protect, asyncHandler(async (req: Request, res: Response) => {
  // Check if recipe exists
  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .select('id')
    .eq('id', req.params.id)
    .eq('is_published', true)
    .single();

  if (recipeError || !recipe) {
    throw new AppError('Recipe not found', 404);
  }

  // Check if already saved
  const { data: existingSave } = await supabase
    .from('saved_recipes')
    .select('*')
    .eq('user_id', req.user!.id)
    .eq('recipe_id', req.params.id)
    .single();

  if (existingSave) {
    throw new AppError('Recipe already saved', 400);
  }

  // Save recipe
  const { error } = await supabase
    .from('saved_recipes')
    .insert({
      user_id: req.user!.id,
      recipe_id: req.params.id
    });

  if (error) {
    logger.error('Recipe save error:', error);
    throw new AppError('Failed to save recipe', 500);
  }

  const response: ApiResponse = {
    success: true,
    message: 'Recipe saved successfully'
  };

  res.json(response);
}));

router.delete('/:id/save', protect, asyncHandler(async (req: Request, res: Response) => {
  const { error } = await supabase
    .from('saved_recipes')
    .delete()
    .eq('user_id', req.user!.id)
    .eq('recipe_id', req.params.id);

  if (error) {
    logger.error('Recipe unsave error:', error);
    throw new AppError('Failed to unsave recipe', 500);
  }

  const response: ApiResponse = {
    success: true,
    message: 'Recipe unsaved successfully'
  };

  res.json(response);
}));

// @desc    Rate recipe
// @route   POST /api/v1/recipes/:id/rate
// @access  Private
router.post('/:id/rate', protect, validate(ratingSchema), asyncHandler(async (req: Request, res: Response) => {
  const { rating, comment }: RateRecipeRequest = req.body;

  // Check if recipe exists
  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .select('id, created_by')
    .eq('id', req.params.id)
    .eq('is_published', true)
    .single();

  if (recipeError || !recipe) {
    throw new AppError('Recipe not found', 404);
  }

  // Users can't rate their own recipes
  if (recipe.created_by === req.user!.id) {
    throw new AppError('Cannot rate your own recipe', 400);
  }

  // Check if user already rated this recipe
  const { data: existingRating } = await supabase
    .from('recipe_reviews')
    .select('id')
    .eq('user_id', req.user!.id)
    .eq('recipe_id', req.params.id)
    .single();

  if (existingRating) {
    // Update existing rating
    const { error } = await supabase
      .from('recipe_reviews')
      .update({ rating, comment, updated_at: new Date().toISOString() })
      .eq('id', existingRating.id);

    if (error) {
      logger.error('Rating update error:', error);
      throw new AppError('Failed to update rating', 500);
    }
  } else {
    // Create new rating
    const { error } = await supabase
      .from('recipe_reviews')
      .insert({
        user_id: req.user!.id,
        recipe_id: req.params.id,
        rating,
        comment
      });

    if (error) {
      logger.error('Rating creation error:', error);
      throw new AppError('Failed to rate recipe', 500);
    }
  }

  const response: ApiResponse = {
    success: true,
    message: 'Recipe rated successfully'
  };

  res.json(response);
}));

export default router;
