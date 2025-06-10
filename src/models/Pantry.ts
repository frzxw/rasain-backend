import { createClient } from '@/config/database';
import { PantryItem } from '@/types';
import { AppError } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class PantryModel {
  /**
   * Get all pantry items for a user
   */
  static async getUserPantryItems(userId: string): Promise<PantryItem[]> {
    const supabase = createClient();

    const { data: items, error } = await supabase
      .from('pantry_items')
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (error) {
      throw new AppError('Failed to fetch pantry items', 500);
    }

    return items || [];
  }

  /**
   * Add item to pantry
   */
  static async addPantryItem(userId: string, itemData: {
    name: string;
    quantity: number;
    unit: string;
    category?: string;
    expiryDate?: string;
    notes?: string;
  }): Promise<PantryItem> {
    const supabase = createClient();

    // Check if item already exists
    const { data: existingItem } = await supabase
      .from('pantry_items')
      .select('*')
      .eq('user_id', userId)
      .eq('name', itemData.name)
      .single();

    if (existingItem) {
      // Update existing item quantity
      const { data: item, error } = await supabase
        .from('pantry_items')
        .update({
          quantity: existingItem.quantity + itemData.quantity,
          unit: itemData.unit,
          category: itemData.category || existingItem.category,
          expiry_date: itemData.expiryDate || existingItem.expiry_date,
          notes: itemData.notes || existingItem.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingItem.id)
        .select()
        .single();

      if (error) {
        throw new AppError('Failed to update pantry item', 500);
      }

      return item;
    } else {
      // Create new item
      const { data: item, error } = await supabase
        .from('pantry_items')
        .insert({
          id: uuidv4(),
          user_id: userId,
          name: itemData.name,
          quantity: itemData.quantity,
          unit: itemData.unit,
          category: itemData.category,
          expiry_date: itemData.expiryDate,
          notes: itemData.notes
        })
        .select()
        .single();

      if (error) {
        throw new AppError('Failed to add pantry item', 500);
      }

      return item;
    }
  }

  /**
   * Update pantry item
   */
  static async updatePantryItem(userId: string, itemId: string, updateData: Partial<PantryItem>): Promise<PantryItem> {
    const supabase = createClient();

    // Check if item belongs to user
    const { data: existingItem, error: fetchError } = await supabase
      .from('pantry_items')
      .select('*')
      .eq('id', itemId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingItem) {
      throw new AppError('Pantry item not found', 404);
    }

    const { data: item, error } = await supabase
      .from('pantry_items')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new AppError('Failed to update pantry item', 500);
    }

    return item;
  }

  /**
   * Delete pantry item
   */
  static async deletePantryItem(userId: string, itemId: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
      .from('pantry_items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', userId);

    if (error) {
      throw new AppError('Failed to delete pantry item', 500);
    }
  }

  /**
   * Get pantry items by category
   */
  static async getItemsByCategory(userId: string, category: string): Promise<PantryItem[]> {
    const supabase = createClient();

    const { data: items, error } = await supabase
      .from('pantry_items')
      .select('*')
      .eq('user_id', userId)
      .eq('category', category)
      .order('name');

    if (error) {
      throw new AppError('Failed to fetch pantry items by category', 500);
    }

    return items || [];
  }

  /**
   * Get expiring items (within specified days)
   */
  static async getExpiringItems(userId: string, days: number = 7): Promise<PantryItem[]> {
    const supabase = createClient();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);

    const { data: items, error } = await supabase
      .from('pantry_items')
      .select('*')
      .eq('user_id', userId)
      .not('expiry_date', 'is', null)
      .lte('expiry_date', cutoffDate.toISOString().split('T')[0])
      .order('expiry_date');

    if (error) {
      throw new AppError('Failed to fetch expiring items', 500);
    }

    return items || [];
  }

  /**
   * Search pantry items
   */
  static async searchItems(userId: string, query: string): Promise<PantryItem[]> {
    const supabase = createClient();

    const { data: items, error } = await supabase
      .from('pantry_items')
      .select('*')
      .eq('user_id', userId)
      .ilike('name', `%${query}%`)
      .order('name');

    if (error) {
      throw new AppError('Failed to search pantry items', 500);
    }

    return items || [];
  }

  /**
   * Get pantry statistics
   */
  static async getPantryStats(userId: string): Promise<{
    totalItems: number;
    totalCategories: number;
    expiringCount: number;
    expiredCount: number;
  }> {
    const supabase = createClient();

    // Get total items
    const { count: totalItems } = await supabase
      .from('pantry_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get unique categories
    const { data: categories } = await supabase
      .from('pantry_items')
      .select('category')
      .eq('user_id', userId)
      .not('category', 'is', null);

    const uniqueCategories = new Set(categories?.map(item => item.category));

    // Get expiring items (within 7 days)
    const expiringItems = await this.getExpiringItems(userId, 7);
    
    // Get expired items
    const today = new Date().toISOString().split('T')[0];
    const { count: expiredCount } = await supabase
      .from('pantry_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('expiry_date', 'is', null)
      .lt('expiry_date', today);

    return {
      totalItems: totalItems || 0,
      totalCategories: uniqueCategories.size,
      expiringCount: expiringItems.length,
      expiredCount: expiredCount || 0
    };
  }

  /**
   * Consume pantry item (reduce quantity)
   */
  static async consumeItem(userId: string, itemId: string, quantity: number): Promise<PantryItem> {
    const supabase = createClient();

    // Get current item
    const { data: item, error: fetchError } = await supabase
      .from('pantry_items')
      .select('*')
      .eq('id', itemId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !item) {
      throw new AppError('Pantry item not found', 404);
    }

    if (item.quantity < quantity) {
      throw new AppError('Insufficient quantity in pantry', 400);
    }

    const newQuantity = item.quantity - quantity;

    if (newQuantity === 0) {
      // Delete item if quantity becomes 0
      await this.deletePantryItem(userId, itemId);
      return { ...item, quantity: 0 };
    } else {
      // Update quantity
      const { data: updatedItem, error } = await supabase
        .from('pantry_items')
        .update({
          quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new AppError('Failed to consume pantry item', 500);
      }

      return updatedItem;
    }
  }

  /**
   * Get suggested recipes based on pantry items
   */
  static async getSuggestedRecipes(userId: string, limit: number = 10): Promise<any[]> {
    const supabase = createClient();

    // Get user's pantry items
    const pantryItems = await this.getUserPantryItems(userId);
    const pantryIngredients = pantryItems.map(item => item.name.toLowerCase());

    if (pantryIngredients.length === 0) {
      return [];
    }

    // Find recipes that use pantry ingredients
    const { data: recipes, error } = await supabase
      .from('recipes')
      .select(`
        *,
        ingredients(name)
      `)
      .eq('is_published', true)
      .order('rating', { ascending: false })
      .limit(limit * 3); // Get more recipes to filter

    if (error) {
      throw new AppError('Failed to fetch suggested recipes', 500);
    }

    // Score recipes based on ingredient matches
    const scoredRecipes = recipes?.map(recipe => {
      const recipeIngredients = (recipe as any).ingredients?.map((ing: any) => 
        ing.name.toLowerCase()
      ) || [];
      
      const matchCount = recipeIngredients.filter((ing: string) =>
        pantryIngredients.some(pantryIng => 
          ing.includes(pantryIng) || pantryIng.includes(ing)
        )
      ).length;

      return {
        ...recipe,
        matchScore: matchCount,
        matchPercentage: recipeIngredients.length > 0 
          ? (matchCount / recipeIngredients.length) * 100 
          : 0
      };
    }) || [];

    // Sort by match score and percentage, then limit results
    return scoredRecipes
      .filter(recipe => recipe.matchScore > 0)
      .sort((a, b) => {
        if (a.matchScore !== b.matchScore) {
          return b.matchScore - a.matchScore;
        }
        return b.matchPercentage - a.matchPercentage;
      })
      .slice(0, limit);
  }
}
