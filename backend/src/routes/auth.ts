import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { validate, schemas } from '../middleware/validation';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Register new user
router.post('/register', validate(schemas.register), async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        preferences: {
          create: {
            pitchType: 'Startup Pitch',
            experienceLevel: 'Beginner',
            improvementGoals: JSON.stringify([]),
            practiceFrequency: 'Weekly'
          }
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        level: true,
        createdAt: true,
        totalPitches: true,
        totalFeedback: true,
        currentStreak: true,
        preferences: true
      }
    });

    // Create session token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    // Store session in database
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    logger.info(`New user registered: ${email}`);

    res.status(201).json({
      message: 'User created successfully',
      user,
      token
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login user
router.post('/login', validate(schemas.login), async (req, res) => {
  try {
    // Development bypass - auto-login if no database
    if (process.env.NODE_ENV === 'development') {
      try {
        await prisma.$queryRaw`SELECT 1`;
      } catch (dbError) {
        logger.warn('Database not available, providing development authentication token');

        // Generate a temporary JWT for development
        const token = jwt.sign(
          {
            sub: 'dev-user-123',
            email: 'dev@example.com',
            name: 'Development User'
          },
          process.env.JWT_SECRET!,
          { expiresIn: '24h' }
        );

        return res.json({
          token,
          user: {
            id: 'dev-user-123',
            email: 'dev@example.com',
            name: 'Development User',
            level: 'intermediate',
            createdAt: new Date().toISOString()
          }
        });
      }
    }

    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        preferences: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create session token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    // Clean up old sessions and create new one
    await prisma.session.deleteMany({
      where: {
        userId: user.id,
        expiresAt: { lt: new Date() }
      }
    });

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    const { password: _, ...userWithoutPassword } = user;
    
    logger.info(`User logged in: ${email}`);

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout user
router.post('/logout', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      await prisma.session.delete({
        where: { token }
      });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        level: true,
        createdAt: true,
        updatedAt: true,
        totalPitches: true,
        totalFeedback: true,
        currentStreak: true,
        preferences: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user preferences
router.put('/preferences', authenticateToken, validate(schemas.userPreferences), async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { pitchType, experienceLevel, improvementGoals, practiceFrequency } = req.body;

    const preferences = await prisma.userPreferences.upsert({
      where: { userId },
      update: {
        pitchType: pitchType || undefined,
        experienceLevel: experienceLevel || undefined,
        improvementGoals: improvementGoals ? JSON.stringify(improvementGoals) : undefined,
        practiceFrequency: practiceFrequency || undefined
      },
      create: {
        userId,
        pitchType: pitchType || 'Startup Pitch',
        experienceLevel: experienceLevel || 'Beginner',
        improvementGoals: improvementGoals ? JSON.stringify(improvementGoals) : JSON.stringify([]),
        practiceFrequency: practiceFrequency || 'Weekly'
      }
    });

    res.json({
      message: 'Preferences updated successfully',
      preferences
    });
  } catch (error) {
    logger.error('Update preferences error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;