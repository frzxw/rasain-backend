import { createClient } from '@/config/database';
import { Recipe, Ingredient, RecipeStep, DifficultyLevel } from '@/types';
import { AppError } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class RecipeModel {
  /**
   * Create a new recipe
   */
  static async createRecipe(recipeData: {
    name: string;
    description?: string;
    imageUrl?: string;
    cookTime?: string;
    prepTime?: string;
    servings?: number;
    difficultyLevel?: DifficultyLevel;
    nutritionInfo?: Record<string, any>;
    tips?: string;
    createdBy: string;
    ingredients: Array<{
      name: string;
      amount: string;
      unit: string;
      notes?: string;
    }>;
    steps: Array<{
      stepNumber: number;
      instruction: string;
      estimatedTime?: string;
      imageUrl?: string;
    }>;
  }): Promise<Recipe> {
    const supabase = createClient();
    const recipeId = uuidv4();

    // Generate slug from name
    const slug = recipeData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Calculate total time
    const totalTime = this.calculateTotalTime(recipeData.cookTime, recipeData.prepTime);

    // Create recipe
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .insert({
        id: recipeId,
        name: recipeData.name,
        slug: `${slug}-${Date.now()}`, // Add timestamp to ensure uniqueness
        image_url: recipeData.imageUrl,
        rating: 0,
        review_count: 0,
        cook_time: recipeData.cookTime,
        prep_time: recipeData.prepTime,
        total_time: totalTime,
        servings: recipeData.servings,
        difficulty_level: recipeData.difficultyLevel || 'medium',
        description: recipeData.description,
        nutrition_info: recipeData.nutritionInfo || {},
        tips: recipeData.tips,
        created_by: recipeData.createdBy,
        is_featured: false,
        is_published: true
      })
      .select()
      .single();

    if (recipeError) {
      throw new AppError('Failed to create recipe', 500);
    }

    // Create ingredients
    if (recipeData.ingredients.length > 0) {
      const ingredients = recipeData.ingredients.map(ing => ({
        id: uuidv4(),
        recipe_id: recipeId,
        name: ing.name,
        quantity: ing.amount,
        unit: ing.unit,
        notes: ing.notes
      }));

      const { error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .insert(ingredients);

      if (ingredientsError) {
        // Cleanup: delete recipe if ingredients creation fails
        await supabase.from('recipes').delete().eq('id', recipeId);
        throw new AppError('Failed to create recipe ingredients', 500);
      }
    }

    // Create steps
    if (recipeData.steps.length > 0) {
      const steps = recipeData.steps.map(step => ({
        id: uuidv4(),
        recipe_id: recipeId,
        step_number: step.stepNumber,
        instruction_text: step.instruction,
        estimated_time: step.estimatedTime,
        image_url: step.imageUrl
      }));

      const { error: stepsError } = await supabase
        .from('recipe_instructions')
        .insert(steps);

      if (stepsError) {
        // Cleanup: delete recipe and ingredients if steps creation fails
        await supabase.from('recipe_ingredients').delete().eq('recipe_id', recipeId);
        await supabase.from('recipes').delete().eq('id', recipeId);
        throw new AppError('Failed to create recipe steps', 500);
      }
    }

    return recipe;
  }

  /**
   * Get recipe by ID with ingredients and steps
   */
  static async getRecipeById(id: string): Promise<{
    recipe: Recipe;
    ingredients: Ingredient[];
    steps: RecipeStep[];
  } | null> {
    const supabase = createClient();

    // Get recipe
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', id)
      .eq('is_published', true)
      .single();

    if (recipeError || !recipe) {
      return null;
    }

    // Get ingredients
    const { data: ingredients, error: ingredientsError } = await supabase
        .from('recipe_ingredients')
      .select('*')
      .eq('recipe_id', id)
      .order('created_at');

    if (ingredientsError) {
      throw new AppError('Failed to fetch recipe ingredients', 500);
    }

    // Get steps
    const { data: steps, error: stepsError } = await supabase
      .from('recipe_instructions')
      .select('*')
      .eq('recipe_id', id)
      .order('step_number');

    if (stepsError) {
      throw new AppError('Failed to fetch recipe steps', 500);
    }

    return {
      recipe,
      ingredients: ingredients || [],
      steps: steps || []
    };
  }

  /**
   * Get recipe by slug
   */
  static async getRecipeBySlug(slug: string): Promise<{
    recipe: Recipe;
    ingredients: Ingredient[];
    steps: RecipeStep[];
  } | null> {
    const supabase = createClient();

    const { data: recipe, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (error || !recipe) {
      return null;
    }

    return this.getRecipeById(recipe.id);
  }

  /**
   * Search recipes with filters
   */
  static async searchRecipes(params: {
    query?: string;
    difficulty?: DifficultyLevel;
    maxCookTime?: string;
    minRating?: number;
    page?: number;
    limit?: number;
    userId?: string;
  }): Promise<{
    recipes: Recipe[];
    total: number;
  }> {
    const supabase = createClient();
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('recipes')
      .select('*', { count: 'exact' })
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (params.query) {
      query = query.or(`name.ilike.%${params.query}%,description.ilike.%${params.query}%`);
    }
    
    if (params.difficulty) {
      query = query.eq('difficulty_level', params.difficulty);
    }
    
    if (params.minRating) {
      query = query.gte('rating', params.minRating);
    }
    
    if (params.userId) {
      query = query.eq('created_by', params.userId);
    }

    const { data: recipes, error, count } = await query;

    if (error) {
      throw new AppError('Failed to search recipes', 500);
    }

    return {
      recipes: recipes || [],
      total: count || 0
    };
  }

  /**
   * Get featured recipes
   */
  static async getFeaturedRecipes(limit: number = 10): Promise<Recipe[]> {
    const supabase = createClient();

    const { data: recipes, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('is_featured', true)
      .eq('is_published', true)
      .order('rating', { ascending: false })
      .limit(limit);

    if (error) {
      throw new AppError('Failed to fetch featured recipes', 500);
    }

    return recipes || [];
  }

  /**
   * Get popular recipes (highest rated)
   */
  static async getPopularRecipes(limit: number = 10): Promise<Recipe[]> {
    const supabase = createClient();

    const { data: recipes, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('is_published', true)
      .gte('review_count', 5) // At least 5 reviews
      .order('rating', { ascending: false })
      .order('review_count', { ascending: false })
      .limit(limit);

    if (error) {
      throw new AppError('Failed to fetch popular recipes', 500);
    }

    return recipes || [];
  }

  /**
   * Update recipe
   */
  static async updateRecipe(id: string, userId: string, updateData: Partial<Recipe>): Promise<Recipe> {
    const supabase = createClient();

    // Check if user owns the recipe
    const { data: existingRecipe, error: fetchError } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', id)
      .eq('created_by', userId)
      .single();

    if (fetchError || !existingRecipe) {
      throw new AppError('Recipe not found or access denied', 404);
    }

    const { data: recipe, error } = await supabase
      .from('recipes')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('created_by', userId)
      .select()
      .single();

    if (error) {
      throw new AppError('Failed to update recipe', 500);
    }

    return recipe;
  }

  /**
   * Delete recipe
   */
  static async deleteRecipe(id: string, userId: string): Promise<void> {
    const supabase = createClient();

    // Check if user owns the recipe
    const { data: existingRecipe, error: fetchError } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', id)
      .eq('created_by', userId)
      .single();

    if (fetchError || !existingRecipe) {
      throw new AppError('Recipe not found or access denied', 404);
    }    // Delete ingredients and steps (cascade delete should handle this, but we check anyway)
    const { error: _ingredientsError } = await supabase
        .from('recipe_ingredients')
      .delete()
      .eq('recipe_id', id);

    const { error: _stepsError } = await supabase
      .from('recipe_instructions')
      .delete()
      .eq('recipe_id', id);

    // Delete recipe
    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', id)
      .eq('created_by', userId);

    if (error) {
      throw new AppError('Failed to delete recipe', 500);
    }
  }

  /**
   * Rate a recipe
   */
  static async rateRecipe(recipeId: string, userId: string, rating: number): Promise<void> {
    const supabase = createClient();

    // Check if user already rated this recipe
    const { data: existingRating } = await supabase
      .from('recipe_ratings')
      .select('*')
      .eq('recipe_id', recipeId)
      .eq('user_id', userId)
      .single();

    if (existingRating) {
      // Update existing rating
      const { error } = await supabase
        .from('recipe_ratings')
        .update({
          rating,
          updated_at: new Date().toISOString()
        })
        .eq('recipe_id', recipeId)
        .eq('user_id', userId);

      if (error) {
        throw new AppError('Failed to update rating', 500);
      }
    } else {
      // Create new rating
      const { error } = await supabase
        .from('recipe_ratings')
        .insert({
          id: uuidv4(),
          recipe_id: recipeId,
          user_id: userId,
          rating
        });

      if (error) {
        throw new AppError('Failed to create rating', 500);
      }
    }

    // Update recipe average rating and review count
    await this.updateRecipeRating(recipeId);
  }

  /**
   * Update recipe average rating and review count
   */
  private static async updateRecipeRating(recipeId: string): Promise<void> {
    const supabase = createClient();

    // Calculate average rating and count
    const { data: ratingData, error: ratingError } = await supabase
      .from('recipe_ratings')
      .select('rating')
      .eq('recipe_id', recipeId);

    if (ratingError) {
      throw new AppError('Failed to calculate rating', 500);
    }

    const ratings = ratingData || [];
    const averageRating = ratings.length > 0 
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
      : 0;

    // Update recipe
    const { error } = await supabase
      .from('recipes')
      .update({
        rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
        review_count: ratings.length,
        updated_at: new Date().toISOString()
      })
      .eq('id', recipeId);

    if (error) {
      throw new AppError('Failed to update recipe rating', 500);
    }
  }

  /**
   * Calculate total time from prep and cook time
   */
  private static calculateTotalTime(cookTime?: string, prepTime?: string): string | undefined {
    if (!cookTime && !prepTime) return undefined;
    
    const parseTime = (time: string): number => {
      const match = time.match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    };

    const cookMinutes = cookTime ? parseTime(cookTime) : 0;
    const prepMinutes = prepTime ? parseTime(prepTime) : 0;
    const totalMinutes = cookMinutes + prepMinutes;

    if (totalMinutes < 60) {
      return `${totalMinutes} minutes`;
    } else {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return minutes > 0 ? `${hours} hours ${minutes} minutes` : `${hours} hours`;
    }
  }
}
