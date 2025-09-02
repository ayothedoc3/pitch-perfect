import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { logger } from '../config/logger';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      logger.warn('Validation error:', error.details);
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }
    
    req.body = value;
    next();
  };
};

// Common validation schemas
export const schemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().min(2).max(50).optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  pitch: Joi.object({
    title: Joi.string().min(1).max(200).required(),
    type: Joi.string().valid('startup', 'elevator', 'sales').required(),
    duration: Joi.number().integer().min(1).max(3600).required()
  }),

  userPreferences: Joi.object({
    pitchType: Joi.string().optional(),
    experienceLevel: Joi.string().valid('Beginner', 'Intermediate', 'Advanced').optional(),
    improvementGoals: Joi.array().items(Joi.string()).optional(),
    practiceFrequency: Joi.string().valid('Daily', 'Weekly', 'Monthly').optional()
  })
};