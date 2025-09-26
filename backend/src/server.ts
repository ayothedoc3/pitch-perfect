import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import dotenv from 'dotenv';

import { logger } from './config/logger';
import { prisma } from './config/database';
import authRoutes from './routes/auth';
import pitchRoutes from './routes/pitches';

// Load environment variables
import fs from 'fs';

// First try to load from backend/.env
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('Loaded .env from backend directory');
} else {
  console.log('.env file not found at:', envPath);
}

// Debug environment loading
console.log('Environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  NODE_ENV_TRIMMED: process.env.NODE_ENV?.trim(),
  PORT: process.env.PORT,
  OPENAI_API_KEY_EXISTS: !!process.env.OPENAI_API_KEY,
  OPENAI_API_KEY_LENGTH: process.env.OPENAI_API_KEY?.length || 0,
  ENV_PATH: envPath,
  ENV_EXISTS: fs.existsSync(envPath)
});

// Trim NODE_ENV if it has extra spaces
if (process.env.NODE_ENV) {
  process.env.NODE_ENV = process.env.NODE_ENV.trim();
}

const app = express();
const PORT = process.env.PORT || 3011;

const rawCorsOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URLS,
  process.env.CORS_ALLOWED_ORIGINS,
  'http://localhost:3000',
  'http://localhost:3003',
  'http://localhost:3004'
].filter(Boolean) as string[];

const allowedOrigins: string[] = Array.from(
  new Set(
    rawCorsOrigins
      .flatMap(originList => originList.split(','))
      .map(origin => origin.trim())
      .filter(origin => origin.length > 0)
  )
);

logger.info('Configured CORS origins', { origins: allowedOrigins });


// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60 * 1000, // 15 minutes default
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware - Updated CORS config
app.use(helmet());
app.use(compression());
app.use(limiter);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes('*')) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    logger.warn(`Blocked CORS origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/pitches', pitchRoutes);

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Global error handler:', error);
  
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large' });
  }
  
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { details: error.message })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
async function startServer() {
  try {
    // Try to connect to database, but don't fail if unavailable in development
    if (process.env.NODE_ENV === 'production') {
      await prisma.$connect();
      logger.info('Database connected successfully');
    } else {
      try {
        await prisma.$connect();
        logger.info('Database connected successfully');
      } catch (dbError) {
        logger.warn('Database connection failed - running without database for development:', dbError);
      }
    }
    
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3001'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();






