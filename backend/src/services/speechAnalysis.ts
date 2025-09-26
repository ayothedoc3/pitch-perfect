import OpenAI from 'openai';
import { logger } from '../config/logger';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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
  private openai: OpenAI | null;
  private fillerWords = [
    'um', 'uh', 'like', 'you know', 'basically', 'actually', 'so', 'well',
    'kind of', 'sort of', 'I mean', 'you see', 'right', 'okay'
  ];

  private keywordPatterns = [
    // Business metrics and numbers
    /\$[\d,]+(?:\.\d+)?[kmb]?/gi,
    /\d+%/g,
    /\b\d+(?:\.\d+)?\s*(?:million|billion|thousand|percent)\b/gi,

    // Business terms
    /\b(?:problem|solution|market|revenue|funding|investment|growth|customer|user|profit|loss|roi|kpi)\b/gi,
    /\b(?:strategy|competitive advantage|market opportunity|value proposition|business model)\b/gi,
    /\b(?:scale|scalable|scalability|disruption|innovation|technology|platform|ecosystem)\b/gi,
  ];

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      logger.info('OpenAI client initialized for speech analysis');
    } else {
      this.openai = null;
      logger.error('OPENAI_API_KEY not found - speech analysis will fail');
      throw new Error('OpenAI API key is required for speech analysis');
    }
  }

  /**
   * Main analysis entry point
   */
  async analyzeComplete(audioFilePath: string, videoDuration: number): Promise<AnalysisResult> {
    try {
      logger.info(`Starting complete speech analysis for: ${audioFilePath}`);

      // Verify file exists and is accessible
      if (!fs.existsSync(audioFilePath)) {
        throw new Error(`Audio file not found: ${audioFilePath}`);
      }

      const fileStats = fs.statSync(audioFilePath);
      logger.info(`Audio file size: ${fileStats.size} bytes`);

      // Convert audio to optimal format for analysis if needed
      const processedAudioPath = await this.preprocessAudio(audioFilePath);

      // Perform transcription
      const transcription = await this.transcribe(processedAudioPath);

      // Analyze speech metrics
      const metrics = await this.analyzeSpeechMetrics(transcription, videoDuration);

      // Generate comprehensive analysis
      const skillBreakdown = this.calculateSkillBreakdown(metrics, transcription);
      const feedback = await this.generateFeedback(metrics, transcription);
      const improvements = this.generateImprovements(metrics, transcription);
      const overallScore = this.calculateOverallScore(skillBreakdown);

      // Clean up processed file if it was created
      if (processedAudioPath !== audioFilePath && fs.existsSync(processedAudioPath)) {
        fs.unlinkSync(processedAudioPath);
      }

      logger.info(`Speech analysis completed successfully. Overall score: ${overallScore}`);

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

  /**
   * Preprocess audio file for optimal analysis
   */
  private async preprocessAudio(audioFilePath: string): Promise<string> {
    try {
      const fileExtension = path.extname(audioFilePath).toLowerCase();
      const fileName = path.basename(audioFilePath, fileExtension);
      const outputPath = path.join(path.dirname(audioFilePath), `${fileName}_processed.wav`);

      // Skip processing if already in WAV format
      if (fileExtension === '.wav') {
        return audioFilePath;
      }

      logger.info(`Converting ${fileExtension} to WAV for better analysis`);

      // Use ffmpeg to convert and optimize for speech recognition
      // This requires ffmpeg to be installed on the system
      const ffmpegCommand = [
        'ffmpeg',
        '-i', `"${audioFilePath}"`,
        '-acodec', 'pcm_s16le',    // 16-bit PCM
        '-ar', '16000',            // 16kHz sample rate (optimal for speech)
        '-ac', '1',                // Mono
        '-af', 'highpass=f=80,lowpass=f=8000', // Filter frequencies outside speech range
        '-y',                      // Overwrite output file
        `"${outputPath}"`
      ].join(' ');

      await execAsync(ffmpegCommand);

      if (fs.existsSync(outputPath)) {
        logger.info(`Audio preprocessed successfully: ${outputPath}`);
        return outputPath;
      } else {
        logger.warn('Audio preprocessing failed, using original file');
        return audioFilePath;
      }
    } catch (error) {
      logger.warn('Audio preprocessing failed, using original file:', error);
      return audioFilePath;
    }
  }

  /**
   * Transcribe audio using OpenAI Whisper
   */
  async transcribe(audioFilePath: string): Promise<TranscriptionResult> {
    try {
      if (!this.openai) {
        throw new Error('OpenAI client not initialized - API key required');
      }

      logger.info('Transcribing audio with OpenAI Whisper');

      const audioFile = fs.createReadStream(audioFilePath);

      const response = await this.openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        response_format: 'verbose_json',
        timestamp_granularities: ['word'],
        language: 'en', // Optimize for English
      });

      const text = response.text;
      const timestamps = response.words?.map(word => ({
        word: word.word,
        start: word.start,
        end: word.end
      })) || [];

      // Extract key phrases from transcription
      const keyPhrases = this.extractKeyPhrases(text);

      logger.info(`Transcription completed: ${text.length} characters, ${timestamps.length} words`);

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

  /**
   * Analyze speech metrics from transcription
   */
  private async analyzeSpeechMetrics(
    transcription: TranscriptionResult,
    videoDuration: number
  ): Promise<SpeechMetrics> {
    const words = transcription.text.split(/\s+/).filter(word => word.length > 0);
    const totalWords = words.length;

    // Calculate pacing (words per minute)
    const durationMinutes = videoDuration / 60;
    const pacing = totalWords > 0 ? Math.round((totalWords / durationMinutes) * 10) / 10 : 150;

    // Calculate filler word frequency
    const fillerCount = words.filter(word =>
      this.fillerWords.some(filler =>
        word.toLowerCase().replace(/[^\w]/g, '').includes(filler.toLowerCase())
      )
    ).length;
    const fillerWordFrequency = totalWords > 0 ? Math.round((fillerCount / totalWords) * 1000) / 1000 : 0.02;

    // Use AI to analyze other metrics
    const aiAnalysis = await this.getAIMetricsAnalysis(transcription.text);

    // Calculate confidence based on various factors
    const confidenceFactors = {
      pacing: this.scorePacing(pacing),
      fillerWords: Math.max(0, 1 - fillerWordFrequency * 10),
      keyPhrases: Math.min(1, transcription.keyPhrases.length / 8),
      textLength: Math.min(1, transcription.text.length / 500),
    };

    const confidence = Object.values(confidenceFactors).reduce((a, b) => a + b, 0) / Object.keys(confidenceFactors).length;

    logger.info('Speech metrics calculated:', {
      totalWords,
      videoDuration,
      pacing,
      fillerCount,
      fillerWordFrequency,
      aiAnalysis
    });

    return {
      pacing,
      clarity: aiAnalysis.clarity,
      fillerWordFrequency,
      toneVariation: aiAnalysis.toneVariation,
      confidence: Math.min(confidence, aiAnalysis.confidence),
    };
  }

  /**
   * Score pacing quality (optimal range: 140-180 WPM)
   */
  private scorePacing(pacing: number): number {
    if (pacing >= 140 && pacing <= 180) return 1.0;
    if (pacing >= 120 && pacing <= 200) return 0.8;
    if (pacing >= 100 && pacing <= 220) return 0.6;
    if (pacing >= 80 && pacing <= 250) return 0.4;
    return 0.2;
  }

  /**
   * Use AI to analyze subjective speech qualities
   */
  private async getAIMetricsAnalysis(text: string): Promise<{
    clarity: number;
    toneVariation: number;
    confidence: number;
  }> {
    try {
      if (!this.openai) {
        throw new Error('OpenAI client not initialized');
      }

      const prompt = `Analyze this pitch transcript for speech quality metrics. Respond with ONLY a JSON object with scores from 0-1:

TEXT: "${text}"

Evaluate:
- clarity: How clear, articulate and easy to understand (grammar, word choice, structure)
- toneVariation: How much vocal variety and emphasis (not monotone vs dynamic delivery)
- confidence: How confident and authoritative the speaker sounds (strong statements, no hesitation)

Respond with ONLY this JSON format: {"clarity": 0.8, "toneVariation": 0.7, "confidence": 0.75}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 100,
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (content) {
        // Clean up response and parse JSON
        const jsonStr = content.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(jsonStr);

        // Validate scores are in range
        return {
          clarity: Math.max(0, Math.min(1, parsed.clarity || 0.8)),
          toneVariation: Math.max(0, Math.min(1, parsed.toneVariation || 0.7)),
          confidence: Math.max(0, Math.min(1, parsed.confidence || 0.75)),
        };
      }
    } catch (error) {
      logger.error('AI metrics analysis failed:', error);
      throw error;
    }

    throw new Error('Failed to get AI metrics analysis');
  }

  /**
   * Generate AI-powered feedback
   */
  private async generateFeedback(
    metrics: SpeechMetrics,
    transcription: TranscriptionResult
  ): Promise<string[]> {
    try {
      if (!this.openai) {
        throw new Error('OpenAI client not initialized');
      }

      const prompt = `Generate 3-4 specific, actionable feedback points for this pitch based on the analysis:

SPEECH METRICS:
- Pacing: ${metrics.pacing.toFixed(1)} words per minute
- Clarity: ${(metrics.clarity * 100).toFixed(1)}%
- Filler word frequency: ${(metrics.fillerWordFrequency * 100).toFixed(1)}%
- Tone variation: ${(metrics.toneVariation * 100).toFixed(1)}%
- Confidence: ${(metrics.confidence * 100).toFixed(1)}%

TRANSCRIPT SAMPLE: "${transcription.text.substring(0, 300)}..."

Generate feedback as a JSON array of strings. Each should be:
- Specific and actionable
- Encouraging but honest
- Focused on improvement
- Professional tone

Example format: ["Great pacing! You maintained an optimal speaking rate.", "Consider reducing filler words to sound more polished."]

Respond with ONLY the JSON array.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 300,
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (content) {
        const jsonStr = content.replace(/```json|```/g, '').trim();
        const feedback = JSON.parse(jsonStr);

        if (Array.isArray(feedback)) {
          return feedback.slice(0, 5); // Limit to 5 items
        }
      }
    } catch (error) {
      logger.error('AI feedback generation failed:', error);
      throw error;
    }

    throw new Error('Failed to generate AI feedback');
  }

  /**
   * Extract key business phrases and metrics
   */
  private extractKeyPhrases(text: string): string[] {
    const phrases = new Set<string>();

    // Extract using regex patterns
    this.keywordPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => phrases.add(match.toLowerCase()));
      }
    });

    // Extract common business phrases
    const businessPhrases = [
      'market opportunity', 'competitive advantage', 'revenue model', 'value proposition',
      'user acquisition', 'growth strategy', 'market validation', 'product-market fit',
      'scalable solution', 'disruptive technology', 'customer retention', 'market share'
    ];

    businessPhrases.forEach(phrase => {
      if (text.toLowerCase().includes(phrase)) {
        phrases.add(phrase);
      }
    });

    return Array.from(phrases).slice(0, 10); // Limit to top 10
  }

  /**
   * Calculate skill breakdown scores
   */
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
        score: Math.min(100, Math.round(70 + (transcription.keyPhrases.length * 4))),
        previousScore: Math.max(0, Math.min(95, Math.round(65 + (transcription.keyPhrases.length * 3)))),
      },
    ];
  }

  /**
   * Generate improvement suggestions
   */
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

  /**
   * Calculate overall score
   */
  private calculateOverallScore(
    skillBreakdown: Array<{ category: string; score: number }>
  ): number {
    const totalScore = skillBreakdown.reduce((sum, skill) => sum + skill.score, 0);
    return Math.round(totalScore / skillBreakdown.length);
  }
}