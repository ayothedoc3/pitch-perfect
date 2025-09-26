import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';
import { SpeechAnalysisService } from '../services/speechAnalysis';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
const envPath = path.join(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

// Trim NODE_ENV if it has extra spaces
if (process.env.NODE_ENV) {
  process.env.NODE_ENV = process.env.NODE_ENV.trim();
}

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const extension = path.extname(file.originalname);
    cb(null, `${uniqueId}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.UPLOAD_MAX_SIZE || '100000000'), // 100MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['video/mp4', 'video/webm', 'audio/wav', 'audio/mp3', 'audio/webm'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video and audio files are allowed.'));
    }
  }
});

// Initialize speech analysis service
const speechAnalysis = new SpeechAnalysisService();

// Get all pitches for authenticated user
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 10 } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    
    const pitches = await prisma.pitch.findMany({
      where: { userId },
      include: {
        analysis: true,
        transcription: true
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: Number(limit)
    });

    const total = await prisma.pitch.count({
      where: { userId }
    });

    // Parse JSON fields for each pitch
    const parsedPitches = pitches.map(pitch => ({
      ...pitch,
      analysis: pitch.analysis ? {
        ...pitch.analysis,
        skillBreakdown: JSON.parse(pitch.analysis.skillBreakdown),
        feedback: JSON.parse(pitch.analysis.feedback),
        improvements: JSON.parse(pitch.analysis.improvements)
      } : null,
      transcription: pitch.transcription ? {
        ...pitch.transcription,
        timestamps: JSON.parse(pitch.transcription.timestamps),
        keyPhrases: JSON.parse(pitch.transcription.keyPhrases)
      } : null
    }));

    res.json({
      pitches: parsedPitches,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Get pitches error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific pitch
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const pitch = await prisma.pitch.findFirst({
      where: { id, userId },
      include: {
        analysis: true,
        transcription: true
      }
    });

    if (!pitch) {
      return res.status(404).json({ error: 'Pitch not found' });
    }

    // Parse JSON fields
    const parsedPitch = {
      ...pitch,
      analysis: pitch.analysis ? {
        ...pitch.analysis,
        skillBreakdown: JSON.parse(pitch.analysis.skillBreakdown),
        feedback: JSON.parse(pitch.analysis.feedback),
        improvements: JSON.parse(pitch.analysis.improvements)
      } : null,
      transcription: pitch.transcription ? {
        ...pitch.transcription,
        timestamps: JSON.parse(pitch.transcription.timestamps),
        keyPhrases: JSON.parse(pitch.transcription.keyPhrases)
      } : null
    };

    res.json({ pitch: parsedPitch });
  } catch (error) {
    logger.error('Get pitch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new pitch
router.post('/', authenticateToken, validate(schemas.pitch), async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { title, type, duration } = req.body;

    const pitch = await prisma.pitch.create({
      data: {
        userId,
        title,
        type,
        duration,
        status: 'recorded'
      },
      include: {
        analysis: true,
        transcription: true
      }
    });

    // Update user stats
    await prisma.user.update({
      where: { id: userId },
      data: {
        totalPitches: { increment: 1 }
      }
    });

    logger.info(`New pitch created: ${pitch.id} by user: ${userId}`);

    res.status(201).json({
      message: 'Pitch created successfully',
      pitch
    });
  } catch (error) {
    logger.error('Create pitch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload video/audio for pitch
router.post('/:id/upload', authenticateToken, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Verify pitch belongs to user
    const pitch = await prisma.pitch.findFirst({
      where: { id, userId }
    });

    if (!pitch) {
      // Clean up uploaded file
      fs.unlinkSync(file.path);
      return res.status(404).json({ error: 'Pitch not found' });
    }

    // Update pitch with file URLs
    const updatedPitch = await prisma.pitch.update({
      where: { id },
      data: {
        videoUrl: file.mimetype.startsWith('video/') ? `/uploads/${file.filename}` : undefined,
        audioUrl: file.mimetype.startsWith('audio/') ? `/uploads/${file.filename}` : undefined,
        status: 'analyzing'
      }
    });

    // Start analysis in background
    setImmediate(async () => {
      try {
        logger.info(`Starting analysis for pitch: ${id}`);
        
        const analysisResult = await speechAnalysis.analyzeComplete(file.path, pitch.duration);
        
        // Save analysis results
        await prisma.$transaction(async (tx) => {
          // Save analysis
          await tx.pitchAnalysis.create({
            data: {
              pitchId: id,
              overallScore: analysisResult.overallScore,
              pacing: analysisResult.metrics.pacing,
              clarity: analysisResult.metrics.clarity,
              fillerWordFrequency: analysisResult.metrics.fillerWordFrequency,
              toneVariation: analysisResult.metrics.toneVariation,
              confidence: analysisResult.metrics.confidence,
              skillBreakdown: JSON.stringify(analysisResult.skillBreakdown),
              feedback: JSON.stringify(analysisResult.feedback),
              improvements: JSON.stringify(analysisResult.improvements)
            }
          });

          // Save transcription
          await tx.pitchTranscription.create({
            data: {
              pitchId: id,
              text: analysisResult.transcription.text,
              timestamps: JSON.stringify(analysisResult.transcription.timestamps),
              keyPhrases: JSON.stringify(analysisResult.transcription.keyPhrases)
            }
          });

          // Update pitch status
          await tx.pitch.update({
            where: { id },
            data: {
              status: 'completed',
              progress: 100
            }
          });

          // Update user stats
          await tx.user.update({
            where: { id: userId },
            data: {
              totalFeedback: { increment: 1 }
            }
          });
        });

        logger.info(`Analysis completed for pitch: ${id}`);
      } catch (analysisError) {
        logger.error(`Analysis failed for pitch: ${id}`, analysisError);
        
        // Mark pitch as failed
        await prisma.pitch.update({
          where: { id },
          data: {
            status: 'failed',
            progress: -1
          }
        });
      }
    });

    res.json({
      message: 'File uploaded successfully. Analysis started.',
      pitch: updatedPitch
    });
  } catch (error) {
    logger.error('Upload error:', error);
    
    // Clean up file if it was uploaded
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        logger.error('File cleanup error:', cleanupError);
      }
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete pitch
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const pitch = await prisma.pitch.findFirst({
      where: { id, userId }
    });

    if (!pitch) {
      return res.status(404).json({ error: 'Pitch not found' });
    }

    // Delete associated files
    const filesToDelete = [pitch.videoUrl, pitch.audioUrl].filter(Boolean);
    for (const fileUrl of filesToDelete) {
      try {
        const filePath = path.join(process.env.UPLOAD_DIR || './uploads', path.basename(fileUrl!));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (fileError) {
        logger.warn('Failed to delete file:', fileError);
      }
    }

    // Delete pitch (cascade will handle analysis and transcription)
    await prisma.pitch.delete({
      where: { id }
    });

    // Update user stats
    await prisma.user.update({
      where: { id: userId },
      data: {
        totalPitches: { decrement: 1 }
      }
    });

    res.json({ message: 'Pitch deleted successfully' });
  } catch (error) {
    logger.error('Delete pitch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get pitch analysis status
router.get('/:id/status', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const pitch = await prisma.pitch.findFirst({
      where: { id, userId },
      select: {
        id: true,
        status: true,
        progress: true,
        analysis: {
          select: {
            overallScore: true
          }
        }
      }
    });

    if (!pitch) {
      return res.status(404).json({ error: 'Pitch not found' });
    }

    res.json({
      id: pitch.id,
      status: pitch.status,
      progress: pitch.progress,
      hasAnalysis: !!pitch.analysis
    });
  } catch (error) {
    logger.error('Get pitch status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;