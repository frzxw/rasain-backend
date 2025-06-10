import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

// User registration validation
export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(128).required(),
  phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional()
});

// User login validation
export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// User profile update validation
export const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional(),
  bio: Joi.string().max(500).optional(),
  is_notifications_enabled: Joi.boolean().optional(),
  language: Joi.string().valid('id', 'en').optional(),
  is_dark_mode_enabled: Joi.boolean().optional()
});

// Recipe creation validation
export const createRecipeSchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  description: Joi.string().max(1000).optional(),
  estimated_cost: Joi.string().max(50).optional(),
  cook_time: Joi.string().max(50).optional(),
  prep_time: Joi.string().max(50).optional(),
  total_time: Joi.string().max(50).optional(),
  servings: Joi.number().integer().min(1).max(50).optional(),
  difficulty_level: Joi.string().valid('easy', 'medium', 'hard').optional(),
  categories: Joi.array().items(Joi.string().max(50)).optional(),
  ingredients: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      quantity: Joi.string().required(),
      unit: Joi.string().optional(),
      price: Joi.string().optional(),
      is_optional: Joi.boolean().optional(),
      notes: Joi.string().optional()
    })
  ).min(1).required(),
  instructions: Joi.array().items(
    Joi.object({
      instruction_text: Joi.string().required(),
      video_url: Joi.string().uri().optional(),
      image_url: Joi.string().uri().optional(),
      estimated_time: Joi.string().optional(),
      temperature: Joi.string().optional(),
      notes: Joi.string().optional()
    })
  ).min(1).required(),
  nutrition_info: Joi.object().optional(),
  tips: Joi.string().optional(),
  image_url: Joi.string().uri().optional()
});

// Recipe update validation
export const updateRecipeSchema = Joi.object({
  name: Joi.string().min(2).max(200).optional(),
  description: Joi.string().max(1000).optional(),
  estimated_cost: Joi.string().max(50).optional(),
  cook_time: Joi.string().max(50).optional(),
  prep_time: Joi.string().max(50).optional(),
  total_time: Joi.string().max(50).optional(),
  servings: Joi.number().integer().min(1).max(50).optional(),
  difficulty_level: Joi.string().valid('easy', 'medium', 'hard').optional(),
  categories: Joi.array().items(Joi.string().max(50)).optional(),
  ingredients: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      quantity: Joi.string().required(),
      unit: Joi.string().optional(),
      price: Joi.string().optional(),
      is_optional: Joi.boolean().optional(),
      notes: Joi.string().optional()
    })
  ).optional(),
  instructions: Joi.array().items(
    Joi.object({
      instruction_text: Joi.string().required(),
      video_url: Joi.string().uri().optional(),
      image_url: Joi.string().uri().optional(),
      estimated_time: Joi.string().optional(),
      temperature: Joi.string().optional(),
      notes: Joi.string().optional()
    })
  ).optional(),
  nutrition_info: Joi.object().optional(),
  tips: Joi.string().optional(),
  image_url: Joi.string().uri().optional()
});

// Pantry item validation
export const pantryItemSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  quantity: Joi.string().max(50).optional(),
  unit: Joi.string().max(20).optional(),
  price: Joi.string().max(50).optional(),
  category_id: Joi.number().integer().optional(),
  storage_location: Joi.string().max(50).optional(),
  expiration_date: Joi.date().iso().optional(),
  purchase_date: Joi.date().iso().optional(),
  total_quantity: Joi.number().integer().min(0).optional(),
  low_stock_alert: Joi.boolean().optional(),
  expiration_alert: Joi.boolean().optional(),
  notes: Joi.string().optional(),
  image_url: Joi.string().uri().optional()
});

// Community post validation
export const communityPostSchema = Joi.object({
  content: Joi.string().max(2000).optional(),
  category: Joi.string().max(50).optional(),
  tagged_ingredients: Joi.array().items(Joi.string().max(100)).optional(),
  image_url: Joi.string().uri().optional()
});

// Recipe rating validation
export const ratingSchema = Joi.object({
  rating: Joi.number().min(1).max(5).required(),
  comment: Joi.string().max(1000).optional()
});

// Chat message validation
export const chatMessageSchema = Joi.object({
  content: Joi.string().min(1).max(2000).required(),
  message_type: Joi.string().valid('text', 'image').default('text'),
  conversation_id: Joi.string().uuid().optional(),
  image_url: Joi.string().uri().optional()
});

// Search validation
export const searchSchema = Joi.object({
  query: Joi.string().min(1).max(200).optional(),
  category: Joi.string().max(50).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  sort_by: Joi.string().valid('rating', 'created_at', 'name', 'review_count').optional(),
  sort_order: Joi.string().valid('asc', 'desc').default('desc')
});

// Validation error interface
interface ValidationError {
  field: string;
  message: string;
}

// Validation middleware factory
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors: ValidationError[] = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors
        }
      });
      return;
    }

    req.body = value;
    next();
  };
};

// Generic validation middleware factory
export const validateRequest = (validationRules: {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: ValidationError[] = [];

    // Validate body
    if (validationRules.body) {
      const { error } = validationRules.body.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
      });
      if (error) {
        errors.push(...error.details.map(detail => ({
          field: `body.${detail.path.join('.')}`,
          message: detail.message
        })));
      }
    }

    // Validate query
    if (validationRules.query) {
      const { error } = validationRules.query.validate(req.query, {
        abortEarly: false,
        stripUnknown: true
      });
      if (error) {
        errors.push(...error.details.map(detail => ({
          field: `query.${detail.path.join('.')}`,
          message: detail.message
        })));
      }
    }

    // Validate params
    if (validationRules.params) {
      const { error } = validationRules.params.validate(req.params, {
        abortEarly: false,
        stripUnknown: true
      });
      if (error) {
        errors.push(...error.details.map(detail => ({
          field: `params.${detail.path.join('.')}`,
          message: detail.message
        })));
      }
    }

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors
        }
      });
      return;
    }

    next();
  };
};

// Query validation middleware factory
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors: ValidationError[] = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      res.status(400).json({
        success: false,
        error: {
          message: 'Query validation failed',
          details: errors
        }
      });
      return;
    }

    req.query = value;
    next();
  };
};
