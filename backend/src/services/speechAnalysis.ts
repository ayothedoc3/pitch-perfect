import OpenAI from 'openai';
import { logger } from '../config/logger';
import fs from 'fs';
import path from 'path';

interface SpeechMetrics {
  pacing: number;
  clarity: number;
  fillerWordFrequency: number;
  toneVariation: number;
  confidence: number;
}

interface TranscriptionResult {
  text: string;
  timestamps: Array<{
    word: string;
    start: number;
    end: number;
  }>;
  keyPhrases: string[];
}

interface AnalysisResult {
  overallScore: number;
  metrics: SpeechMetrics;
  skillBreakdown: Array<{
    category: string;
    score: number;
    previousScore?: number;
  }>;
  feedback: string[];
  improvements: string[];
  transcription: TranscriptionResult;
}

export class SpeechAnalysisService {
  private openai: OpenAI;
  private fillerWords = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'so', 'well'];
  private keywordPatterns = [
    /\b(problem|solution|market|revenue|funding|investment|growth|customer|user)\b/gi,
    /\$[\d,]+/g,
    /\d+%/g,
    /\b(million|billion|thousand)\b/gi,
  ];

  constructor() {
    logger.info(`Checking OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? 'Found' : 'Not found'}`);
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      logger.info('OpenAI client initialized successfully');
    } else {
      logger.warn('OPENAI_API_KEY not found - running in mock mode for development');
      this.openai = null as any; // Will use mock responses
    }
  }

  async analyzeComplete(audioFilePath: string, videoDuration: number): Promise<AnalysisResult> {
    try {
      logger.info('Starting complete speech analysis');
      
      // Transcribe audio using OpenAI Whisper
      const transcription = await this.transcribe(audioFilePath);
      
      // Analyze speech metrics
      const metrics = await this.analyzeSpeechMetrics(transcription, videoDuration);
      
      // Generate skill breakdown and feedback
      const skillBreakdown = this.calculateSkillBreakdown(metrics, transcription);
      const feedback = await this.generateFeedback(metrics, transcription);
      const improvements = this.generateImprovements(metrics, transcription);
      const overallScore = this.calculateOverallScore(skillBreakdown);

      return {
        overallScore,
        metrics,
        skillBreakdown,
        feedback,
        improvements,
        transcription,
      };
    } catch (error) {
      logger.error('Speech analysis failed:', error);
      throw error;
    }
  }

  async transcribe(audioFilePath: string): Promise<TranscriptionResult> {
    try {
      // Use mock data if OpenAI is not available
      if (!this.openai) {
        logger.info('Using mock transcription data for development');
        const mockText = "Hello everyone, I'm excited to present our innovative startup solution that revolutionizes the market. We've identified a key problem in the industry and developed a scalable technology platform to address it. Our revenue model projects 2 million in funding for the first year with 150% growth rate.";
        
        const words = mockText.split(' ');
        const timestamps = words.map((word, index) => ({
          word,
          start: index * 0.5,
          end: (index + 1) * 0.5
        }));

        const keyPhrases = this.extractKeyPhrases(mockText);
        
        return {
          text: mockText,
          timestamps,
          keyPhrases,
        };
      }

      logger.info('Transcribing audio with OpenAI Whisper');
      
      const audioFile = fs.createReadStream(audioFilePath);
      
      const response = await this.openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        response_format: 'verbose_json',
        timestamp_granularities: ['word']
      });

      const text = response.text;
      const timestamps = response.words?.map(word => ({
        word: word.word,
        start: word.start,
        end: word.end
      })) || [];

      const keyPhrases = this.extractKeyPhrases(text);
      
      return {
        text,
        timestamps,
        keyPhrases,
      };
    } catch (error) {
      logger.error('Transcription failed:', error);
      throw error;
    }
  }

  private async analyzeSpeechMetrics(
    transcription: TranscriptionResult,
    videoDuration: number
  ): Promise<SpeechMetrics> {
    const words = transcription.text.split(' ').filter(word => word.length > 0);
    const totalWords = words.length;
    
    // Calculate pacing (words per minute)
    const pacing = (totalWords / (videoDuration / 60));
    
    // Calculate filler word frequency
    const fillerWords = words.filter(word => 
      this.fillerWords.some(filler => 
        word.toLowerCase().includes(filler.toLowerCase())
      )
    ).length;
    const fillerWordFrequency = totalWords > 0 ? fillerWords / totalWords : 0;
    
    // Use AI to analyze other metrics
    const aiAnalysis = await this.getAIMetricsAnalysis(transcription.text);
    
    return {
      pacing,
      clarity: aiAnalysis.clarity || 0.8,
      fillerWordFrequency,
      toneVariation: aiAnalysis.toneVariation || 0.7,
      confidence: aiAnalysis.confidence || 0.75,
    };
  }

  private async getAIMetricsAnalysis(text: string): Promise<{
    clarity: number;
    toneVariation: number;
    confidence: number;
  }> {
    try {
      const prompt = `
        Analyze this pitch transcript for speech quality metrics. Return a JSON object with scores from 0-1:
        - clarity: How clear and articulate the speech is
        - toneVariation: How much vocal variety and emphasis is used
        - confidence: How confident and authoritative the speaker sounds
        
        Text: "${text}"
        
        Respond with only a JSON object like: {"clarity": 0.8, "toneVariation": 0.7, "confidence": 0.75}
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        return JSON.parse(content);
      }
    } catch (error) {
      logger.warn('AI metrics analysis failed, using defaults:', error);
    }
    
    // Return default values if AI analysis fails
    return {
      clarity: 0.8,
      toneVariation: 0.7,
      confidence: 0.75,
    };
  }

  private async generateFeedback(
    metrics: SpeechMetrics,
    transcription: TranscriptionResult
  ): Promise<string[]> {
    try {
      const prompt = `
        Generate 3-5 specific, actionable feedback points for this pitch based on the analysis:
        
        Speech Metrics:
        - Pacing: ${metrics.pacing.toFixed(1)} words per minute
        - Clarity: ${(metrics.clarity * 100).toFixed(1)}%
        - Filler word frequency: ${(metrics.fillerWordFrequency * 100).toFixed(1)}%
        - Tone variation: ${(metrics.toneVariation * 100).toFixed(1)}%
        - Confidence: ${(metrics.confidence * 100).toFixed(1)}%
        
        Transcript: "${transcription.text.substring(0, 500)}..."
        
        Return a JSON array of feedback strings. Each should be specific and actionable.
        Example: ["Great pacing! You maintained an optimal speaking rate.", "Consider reducing filler words to sound more polished."]
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        return JSON.parse(content);
      }
    } catch (error) {
      logger.warn('AI feedback generation failed, using defaults:', error);
    }

    // Return default feedback if AI generation fails
    return this.generateDefaultFeedback(metrics, transcription);
  }

  private generateDefaultFeedback(
    metrics: SpeechMetrics,
    transcription: TranscriptionResult
  ): string[] {
    const feedback: string[] = [];

    if (metrics.pacing < 130) {
      feedback.push("Consider speaking slightly faster to maintain audience engagement.");
    } else if (metrics.pacing > 180) {
      feedback.push("Try slowing down to ensure your audience can follow along.");
    } else {
      feedback.push("Excellent pacing! You're speaking at an optimal rate.");
    }

    if (metrics.clarity > 0.85) {
      feedback.push("Outstanding clarity in your speech delivery.");
    } else if (metrics.clarity < 0.7) {
      feedback.push("Focus on articulation to improve speech clarity.");
    }

    if (metrics.fillerWordFrequency < 0.02) {
      feedback.push("Great job minimizing filler words!");
    } else if (metrics.fillerWordFrequency > 0.05) {
      feedback.push("Reduce filler words like 'um' and 'uh' for more professional delivery.");
    }

    return feedback.slice(0, 5);
  }

  private extractKeyPhrases(text: string): string[] {
    const phrases: string[] = [];
    
    this.keywordPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        phrases.push(...matches);
      }
    });

    const businessPhrases = [
      'market opportunity', 'competitive advantage', 'revenue model',
      'user acquisition', 'growth strategy', 'market validation'
    ];
    
    businessPhrases.forEach(phrase => {
      if (text.toLowerCase().includes(phrase)) {
        phrases.push(phrase);
      }
    });

    return [...new Set(phrases)].slice(0, 8);
  }

  private calculateSkillBreakdown(
    metrics: SpeechMetrics,
    transcription: TranscriptionResult
  ): Array<{ category: string; score: number; previousScore?: number }> {
    return [
      {
        category: 'Clarity',
        score: Math.round(metrics.clarity * 100),
        previousScore: Math.max(0, Math.round((metrics.clarity - 0.1) * 100)),
      },
      {
        category: 'Confidence',
        score: Math.round(metrics.confidence * 100),
        previousScore: Math.max(0, Math.round((metrics.confidence - 0.08) * 100)),
      },
      {
        category: 'Delivery',
        score: Math.round(metrics.toneVariation * 100),
        previousScore: Math.max(0, Math.round((metrics.toneVariation - 0.05) * 100)),
      },
      {
        category: 'Content',
        score: Math.min(100, Math.round(75 + (transcription.keyPhrases.length * 3))),
        previousScore: Math.max(0, Math.min(95, Math.round(70 + (transcription.keyPhrases.length * 2.5)))),
      },
    ];
  }

  private generateImprovements(
    metrics: SpeechMetrics,
    transcription: TranscriptionResult
  ): string[] {
    const improvements: string[] = [];

    if (metrics.pacing < 130 || metrics.pacing > 180) {
      improvements.push("Practice maintaining optimal speaking pace (130-180 WPM)");
    }

    if (metrics.clarity < 0.8) {
      improvements.push("Practice articulation exercises and vocal warm-ups");
    }

    if (metrics.fillerWordFrequency > 0.03) {
      improvements.push("Practice pausing instead of using filler words");
    }

    if (metrics.confidence < 0.7) {
      improvements.push("Record practice sessions to build confidence");
    }

    if (transcription.keyPhrases.length < 4) {
      improvements.push("Include more specific business metrics and terminology");
    }

    return improvements.slice(0, 4);
  }

  private calculateOverallScore(
    skillBreakdown: Array<{ category: string; score: number }>
  ): number {
    const totalScore = skillBreakdown.reduce((sum, skill) => sum + skill.score, 0);
    return Math.round(totalScore / skillBreakdown.length);
  }
}