// Type definitions for Rasain Backend API
import { Request } from 'express';

export interface DatabaseRecord {
  id: string;
  created_at: string;
  updated_at: string;
}

// Upload and file types
export interface FileUploadResponse {
  id: string;
  url: string;
  filename: string;
  originalName: string;
  size: number;
  type: string;
}

export interface Upload extends DatabaseRecord {
  user_id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  url: string;
  type: 'recipe' | 'profile' | 'ingredient' | 'step';
  recipe_id?: string;
  description?: string;
}

// User types
export interface User extends DatabaseRecord {
  email: string;
  password_hash?: string;
  email_verified: boolean;
  phone?: string;
  phone_verified: boolean;
  last_sign_in_at?: string;
}

export interface UserProfile extends DatabaseRecord {
  id: string; // References user id
  name: string;
  image_url?: string;
  saved_recipes_count: number;
  posts_count: number;
  is_notifications_enabled: boolean;
  language: 'id' | 'en';
  is_dark_mode_enabled: boolean;
}

// Recipe types
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface Recipe extends DatabaseRecord {
  name: string;
  slug?: string;
  image_url?: string;
  rating: number;
  review_count: number;
  estimated_cost?: string;
  cook_time?: string;
  prep_time?: string;
  total_time?: string;
  servings?: number;
  difficulty_level?: DifficultyLevel;
  description?: string;
  nutrition_info?: Record<string, any>;
  tips?: string;
  created_by?: string;
  is_featured: boolean;
  is_published: boolean;
}

// Add missing type aliases for consistency
export type Ingredient = RecipeIngredient;
export type RecipeStep = RecipeInstruction;

export interface RecipeCategory {
  id: number;
  name: string;
  name_id?: string;
  name_en?: string;
  description?: string;
  created_at: string;
}

export interface RecipeIngredient extends DatabaseRecord {
  recipe_id: string;
  name: string;
  quantity?: string;
  unit?: string;
  price?: string;
  image_url?: string;
  is_optional: boolean;
  notes?: string;
  order_index: number;
}

export interface RecipeInstruction extends DatabaseRecord {
  recipe_id: string;
  step_number: number;
  instruction_text: string;
  video_url?: string;
  image_url?: string;
  estimated_time?: string;
  temperature?: string;
  notes?: string;
}

export interface RecipeReview extends DatabaseRecord {
  recipe_id: string;
  user_id: string;
  rating: number;
  comment?: string;
  images?: string[];
  is_verified_purchase: boolean;
  helpful_count: number;
}

// Pantry types
export interface PantryCategory {
  id: number;
  name: string;
  name_id?: string;
  name_en?: string;
  description?: string;
  icon?: string;
  created_at: string;
}

export interface PantryItem extends DatabaseRecord {
  user_id: string;
  name: string;
  image_url?: string;
  quantity?: string;
  unit?: string;
  price?: string;
  category_id?: number;
  storage_location?: string;
  total_quantity?: number;
  low_stock_alert: boolean;
  expiration_alert: boolean;
  expiration_date?: string;
  purchase_date?: string;
  last_used_date?: string;
  notes?: string;
}

// Community types
export interface CommunityPost extends DatabaseRecord {
  user_id: string;
  content?: string;
  image_url?: string;
  type: 'text' | 'recipe_share' | 'image';
  recipe_id?: string;
  shared_post_id?: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
}

export interface PostComment extends DatabaseRecord {
  post_id: string;
  user_id: string;
  parent_id?: string;
  content: string;
  likes_count: number;
}

export interface PostLike extends DatabaseRecord {
  post_id: string;
  user_id: string;
}

// Chat types
export type MessageType = 'text' | 'image';
export type MessageSender = 'user' | 'ai' | 'assistant';

export interface ChatConversation extends DatabaseRecord {
  user_id: string;
  title?: string;
}

export interface ChatMessage extends DatabaseRecord {
  conversation_id: string;
  content: string;
  message_type: MessageType;
  sender: MessageSender;
  image_url?: string;
  is_rated_positive?: boolean;
  is_rated_negative?: boolean;
  metadata?: Record<string, any>;
}

// Notification types
export type NotificationType = 
  | 'recipe_like'
  | 'recipe_comment'
  | 'recipe_share'
  | 'follow'
  | 'system'
  | 'reminder';

export interface Notification extends DatabaseRecord {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  action_url?: string;
  is_read: boolean;
  is_archived: boolean;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    message: string;
    details?: any;
  };
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
  pagination?: PaginationInfo;
}

// Request types
export interface AuthenticatedUser {
  id: string;
  email: string;
  user_metadata?: Record<string, any>;
  profile?: UserProfile;
}

export interface CreateRecipeRequest {
  name: string;
  description?: string;
  estimated_cost?: string;
  cook_time?: string;
  prep_time?: string;
  total_time?: string;
  servings?: number;
  difficulty_level?: DifficultyLevel;
  categories?: string[];
  ingredients: {
    name: string;
    quantity: string;
    unit?: string;
    price?: string;
    is_optional?: boolean;
    notes?: string;
  }[];
  instructions: {
    instruction_text: string;
    video_url?: string;
    image_url?: string;
    estimated_time?: string;
    temperature?: string;
    notes?: string;
  }[];
  nutrition_info?: Record<string, any>;
  tips?: string;
  image_url?: string;
}

export interface UpdateRecipeRequest extends Partial<CreateRecipeRequest> {}

export interface CreatePantryItemRequest {
  name: string;
  quantity?: string;
  unit?: string;
  price?: string;
  category_id?: number;
  storage_location?: string;
  total_quantity?: number;
  low_stock_alert?: boolean;
  expiration_alert?: boolean;
  expiration_date?: string;
  purchase_date?: string;
  notes?: string;
  image_url?: string;
}

export interface UpdatePantryItemRequest extends Partial<CreatePantryItemRequest> {}

export interface CreateCommunityPostRequest {
  content?: string;
  image_url?: string;
  category?: string;
  tagged_ingredients?: string[];
}

export interface UpdateCommunityPostRequest extends Partial<CreateCommunityPostRequest> {}

export interface CreateChatMessageRequest {
  conversation_id?: string;
  content: string;
  message_type?: MessageType;
  image_url?: string;
}

export interface RateRecipeRequest {
  rating: number;
  comment?: string;
}

// Search and filter types
export interface SearchQuery {
  query?: string;
  category?: string;
  page?: number;
  limit?: number;
  sort_by?: 'rating' | 'created_at' | 'name' | 'review_count';
  sort_order?: 'asc' | 'desc';
}

export interface RecipeFilters {
  categories?: string[];
  difficulty_level?: DifficultyLevel[];
  max_cook_time?: number;
  min_rating?: number;
  has_ingredients?: string[];
}

// Extended Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

// Missing types for notifications and requests
export interface CreateNotificationRequest {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  actionUrl?: string;
}

export interface UpdateNotificationRequest {
  isRead?: boolean;
  isArchived?: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

// Utility types
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Database helper types
export interface SupabaseResponse<T = any> {
  data: T | null;
  error: {
    message: string;
    details?: string;
    hint?: string;
    code?: string;
  } | null;
}