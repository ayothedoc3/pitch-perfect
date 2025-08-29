// Enhanced AI-powered speech analysis service with more realistic implementation

export interface SpeechMetrics {
  pacing: number;        // Words per minute
  clarity: number;       // 0-1 scale
  fillerWordFrequency: number; // Frequency of um, uh, like, etc.
  toneVariation: number; // Variation in pitch/tone
  confidence: number;    // Perceived confidence
}

export interface TranscriptionResult {
  text: string;
  timestamps: Array<{
    word: string;
    start: number;
    end: number;
  }>;
  keyPhrases: string[];
}

export interface AnalysisResult {
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
  private fillerWords = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'so'];
  private keywordPatterns = [
    /\b(problem|solution|market|revenue|funding|investment|growth|customer|user)\b/gi,
    /\$[\d,]+/g, // Dollar amounts
    /\d+%/g, // Percentages
    /\b(million|billion|thousand)\b/gi,
  ];

  constructor() {
  }

  async analyzeComplete(audioData: Blob, videoDuration: number): Promise<AnalysisResult> {
    
    // Start both transcription and speech analysis in parallel
    const [transcription, metrics] = await Promise.all([
      this.transcribe(audioData),
      this.analyzeSpeech(audioData, videoDuration)
    ]);

    const skillBreakdown = this.calculateSkillBreakdown(metrics, transcription);
    const feedback = this.generateFeedback(metrics, transcription);
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
  }
  
  async transcribe(audioData: Blob): Promise<TranscriptionResult> {
    
    // Simulate realistic processing time based on audio size
    const processingTime = Math.min(3000, audioData.size / 10000);
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    // Generate more realistic mock transcription
    const sampleTexts = [
      "Hi everyone, I'm excited to present our innovative solution to the growing problem in the market. Our startup addresses a critical need that affects millions of users worldwide. We've developed a unique approach that combines cutting-edge technology with user-friendly design. Our business model is proven, with strong revenue projections and a clear path to profitability. We're seeking two million in funding to scale our operations and capture market share. Thank you for your time.",
      "Good morning investors. The problem we're solving is significant - ninety percent of small businesses struggle with this issue daily. Our solution has been tested with over five hundred customers, showing impressive results. We've achieved forty percent month-over-month growth and are positioned to become the market leader. Our team has the expertise and passion to execute this vision. We're looking for strategic partners to help us reach the next level.",
      "Thank you for this opportunity. I'm here to discuss a revolutionary product that will transform how people approach this common challenge. Our research shows that the current market solutions are inadequate, leaving a gap that we're uniquely positioned to fill. We've built strong partnerships and have a clear competitive advantage. The total addressable market is worth five billion dollars annually, and we're ready to capture our share."
    ];
    
    const mockText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
    const words = mockText.split(' ');
    const timestamps = words.map((word, index) => ({
      word: word.replace(/[.,!?]/, ''),
      start: index * 0.5,
      end: (index + 1) * 0.5,
    }));

    const keyPhrases = this.extractKeyPhrases(mockText);
    
    return {
      text: mockText,
      timestamps,
      keyPhrases,
    };
  }
  
  async analyzeSpeech(audioData: Blob, videoDuration: number): Promise<SpeechMetrics> {
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate realistic metrics with some randomization
    const baseMetrics = {
      pacing: 140 + Math.random() * 40, // 140-180 WPM
      clarity: 0.7 + Math.random() * 0.25, // 0.7-0.95
      fillerWordFrequency: Math.random() * 0.08, // 0-8%
      toneVariation: 0.6 + Math.random() * 0.3, // 0.6-0.9
      confidence: 0.65 + Math.random() * 0.3, // 0.65-0.95
    };

    // Adjust metrics based on duration (longer pitches might have more variation)
    if (videoDuration > 300) { // 5+ minutes
      baseMetrics.fillerWordFrequency += 0.02;
      baseMetrics.confidence -= 0.05;
    }

    return baseMetrics;
  }

  private extractKeyPhrases(text: string): string[] {
    const phrases: string[] = [];
    
    // Extract patterns
    this.keywordPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        phrases.push(...matches);
      }
    });

    // Add some business-specific phrases
    const businessPhrases = [
      'market opportunity', 'competitive advantage', 'revenue model',
      'user acquisition', 'growth strategy', 'market validation'
    ];
    
    businessPhrases.forEach(phrase => {
      if (text.toLowerCase().includes(phrase)) {
        phrases.push(phrase);
      }
    });

    return [...new Set(phrases)].slice(0, 8); // Remove duplicates and limit
  }

  private calculateSkillBreakdown(metrics: SpeechMetrics, transcription: TranscriptionResult): Array<{
    category: string;
    score: number;
    previousScore?: number;
  }> {
    return [
      {
        category: 'Clarity',
        score: Math.round(metrics.clarity * 100),
        previousScore: Math.round((metrics.clarity - 0.1) * 100),
      },
      {
        category: 'Confidence',
        score: Math.round(metrics.confidence * 100),
        previousScore: Math.round((metrics.confidence - 0.08) * 100),
      },
      {
        category: 'Structure',
        score: Math.round(85 + Math.random() * 10), // Based on content analysis
        previousScore: Math.round(80 + Math.random() * 8),
      },
      {
        category: 'Delivery',
        score: Math.round(metrics.toneVariation * 100),
        previousScore: Math.round((metrics.toneVariation - 0.05) * 100),
      },
      {
        category: 'Content',
        score: Math.round(75 + (transcription.keyPhrases.length * 3)), // Based on key phrases
        previousScore: Math.round(70 + (transcription.keyPhrases.length * 2.5)),
      },
    ];
  }

  private generateFeedback(metrics: SpeechMetrics, transcription: TranscriptionResult): string[] {
    const feedback: string[] = [];

    // Pacing feedback
    if (metrics.pacing < 130) {
      feedback.push("Your speaking pace is quite slow. Consider speaking a bit faster to maintain audience engagement.");
    } else if (metrics.pacing > 180) {
      feedback.push("You're speaking quite fast. Try slowing down to ensure your audience can follow along.");
    } else if (metrics.pacing >= 140 && metrics.pacing <= 160) {
      feedback.push("Excellent pacing! You're speaking at an optimal rate for comprehension.");
    }

    // Clarity feedback
    if (metrics.clarity > 0.85) {
      feedback.push("Outstanding clarity in your speech. Your words are crisp and easy to understand.");
    } else if (metrics.clarity < 0.7) {
      feedback.push("Work on articulation - some words may be unclear to your audience.");
    }

    // Filler words feedback
    if (metrics.fillerWordFrequency < 0.02) {
      feedback.push("Great job minimizing filler words! Your speech sounds professional and polished.");
    } else if (metrics.fillerWordFrequency > 0.05) {
      feedback.push(`Reduce filler words like 'um' and 'uh' - detected ${Math.round(metrics.fillerWordFrequency * 100)}% frequency.`);
    }

    // Confidence feedback
    if (metrics.confidence > 0.8) {
      feedback.push("You sound very confident and authoritative. This builds trust with your audience.");
    } else if (metrics.confidence < 0.6) {
      feedback.push("Work on projecting more confidence through your voice tone and volume.");
    }

    // Content-based feedback
    if (transcription.keyPhrases.length > 5) {
      feedback.push("Strong use of business terminology and key phrases. This demonstrates expertise.");
    } else if (transcription.keyPhrases.length < 3) {
      feedback.push("Consider incorporating more specific business terms and metrics to strengthen your message.");
    }

    // Tone variation feedback
    if (metrics.toneVariation > 0.75) {
      feedback.push("Excellent vocal variety! Your tone changes help emphasize important points.");
    } else if (metrics.toneVariation < 0.5) {
      feedback.push("Try varying your tone more to avoid sounding monotone and keep the audience engaged.");
    }

    return feedback.slice(0, 5); // Limit to 5 most relevant pieces of feedback
  }

  private generateImprovements(metrics: SpeechMetrics, transcription: TranscriptionResult): string[] {
    const improvements: string[] = [];

    if (metrics.pacing < 130 || metrics.pacing > 180) {
      improvements.push("Practice with a metronome to maintain optimal speaking pace (140-160 WPM)");
    }

    if (metrics.clarity < 0.8) {
      improvements.push("Do vocal warm-ups and articulation exercises before recording");
    }

    if (metrics.fillerWordFrequency > 0.03) {
      improvements.push("Practice pausing instead of using filler words - silence is powerful");
    }

    if (metrics.confidence < 0.7) {
      improvements.push("Record yourself more frequently to build confidence and familiarity");
    }

    if (metrics.toneVariation < 0.6) {
      improvements.push("Practice emphasizing key points with vocal inflection and pauses");
    }

    if (transcription.keyPhrases.length < 4) {
      improvements.push("Include more specific metrics, numbers, and business terminology");
    }

    return improvements.slice(0, 4);
  }

  private calculateOverallScore(skillBreakdown: Array<{ category: string; score: number }>): number {
    const totalScore = skillBreakdown.reduce((sum, skill) => sum + skill.score, 0);
    return Math.round(totalScore / skillBreakdown.length);
  }

  // Utility method for extracting audio from video blob
  async extractAudioFromVideo(videoBlob: Blob): Promise<Blob> {
    // In a real implementation, this would use Web Audio API or similar
    // For now, we'll just return the video blob as-is since our mock analysis doesn't need actual audio
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Create a mock audio blob
    return new Blob([videoBlob], { type: 'audio/wav' });
  }
} 