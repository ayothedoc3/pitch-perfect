interface PitchUploadResponse {
  message: string;
  pitch: {
    id: string;
    status: string;
    progress: number;
  };
}

interface PitchStatusResponse {
  id: string;
  status: 'recorded' | 'analyzing' | 'completed' | 'failed';
  progress: number;
  hasAnalysis: boolean;
}

export interface AnalysisResult {
  overallScore: number;
  metrics: {
    pacing: number;
    clarity: number;
    fillerWordFrequency: number;
    toneVariation: number;
    confidence: number;
  };
  skillBreakdown: Array<{
    category: string;
    score: number;
    previousScore?: number;
  }>;
  feedback: string[];
  improvements: string[];
}

export interface TranscriptionResult {
  text: string;
  keyPhrases: string[];
  timestamps: Array<{
    word: string;
    start: number;
    end: number;
  }>;
}

export interface PitchDetail {
  id: string;
  title: string;
  type: string;
  duration: number;
  status: 'recorded' | 'analyzing' | 'completed' | 'failed';
  progress: number;
  createdAt: string;
  updatedAt: string;
  videoUrl?: string | null;
  audioUrl?: string | null;
  analysis: AnalysisResult | null;
  transcription: TranscriptionResult | null;
}

export class SpeechUploadService {
  private baseUrl: string;
  private token: string | null;

  constructor(baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010/api') {
    this.baseUrl = baseUrl;
    this.token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      Accept: 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Create a new pitch record
   */
  async createPitch(title: string, type: string = 'startup', duration: number): Promise<{ pitch: { id: string } }> {
    const response = await fetch(`${this.baseUrl}/pitches`, {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, type, duration }),
    });

    return this.handleResponse(response);
  }

  /**
   * Upload audio/video file for a pitch
   * Optimized for speech analysis with proper format conversion
   */
  async uploadPitchFile(
    pitchId: string,
    audioBlob: Blob,
    videoBlob?: Blob,
    onProgress?: (progress: number) => void
  ): Promise<PitchUploadResponse> {
    const optimizedAudioBlob = await this.optimizeAudioForSpeech(audioBlob);

    const formData = new FormData();
    formData.append('file', optimizedAudioBlob, 'audio.webm');

    if (videoBlob) {
      formData.append('video', videoBlob, 'video.webm');
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Invalid response format'));
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            reject(new Error(errorData.error || `Upload failed with status ${xhr.status}`));
          } catch (error) {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed due to network error'));
      });

      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload timed out'));
      });

      xhr.open('POST', `${this.baseUrl}/pitches/${pitchId}/upload`);

      const headers = this.getHeaders();
      Object.entries(headers).forEach(([key, value]) => {
        if (key !== 'Content-Type') {
          xhr.setRequestHeader(key, value as string);
        }
      });

      xhr.timeout = 5 * 60 * 1000;
      xhr.send(formData);
    });
  }

  /**
   * Optimize audio blob for speech analysis
   */
  private async optimizeAudioForSpeech(audioBlob: Blob): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (audioBlob.type.includes('webm') && audioBlob.type.includes('opus')) {
        resolve(audioBlob);
        return;
      }

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const fileReader = new FileReader();

      fileReader.onload = async (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

          const optimizedBuffer = audioContext.createBuffer(
            1,
            Math.floor(audioBuffer.duration * 16000),
            16000
          );

          const originalData = audioBuffer.getChannelData(0);
          const optimizedData = optimizedBuffer.getChannelData(0);
          const ratio = originalData.length / optimizedData.length;

          for (let i = 0; i < optimizedData.length; i++) {
            const index = Math.floor(i * ratio);
            optimizedData[i] = originalData[index] || 0;
          }

          const stream = audioContext.createMediaStreamDestination();
          const source = audioContext.createBufferSource();
          source.buffer = optimizedBuffer;
          source.connect(stream);

          const recorder = new MediaRecorder(stream.stream, {
            mimeType: 'audio/webm;codecs=opus',
            audioBitsPerSecond: 128000,
          });

          const chunks: BlobPart[] = [];

          recorder.ondataavailable = (recordEvent) => {
            if (recordEvent.data.size > 0) {
              chunks.push(recordEvent.data);
            }
          };

          recorder.onstop = () => {
            resolve(new Blob(chunks, { type: 'audio/webm;codecs=opus' }));
            audioContext.close().catch(() => undefined);
          };

          recorder.onerror = () => {
            reject(new Error('Failed to convert audio for analysis'));
            audioContext.close().catch(() => undefined);
          };

          recorder.start();
          source.start();
          source.onended = () => recorder.stop();
        } catch (error) {
          reject(new Error('Failed to process audio for analysis'));
          audioContext.close().catch(() => undefined);
        }
      };

      fileReader.onerror = () => {
        reject(new Error('Failed to read audio for conversion'));
        audioContext.close().catch(() => undefined);
      };

      fileReader.readAsArrayBuffer(audioBlob);
    });
  }

  /**
   * Check the status of pitch analysis
   */
  async checkPitchStatus(pitchId: string): Promise<PitchStatusResponse> {
    const response = await fetch(`${this.baseUrl}/pitches/${pitchId}/status`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  private normalizePitch(pitch: any): PitchDetail {
    const analysis: AnalysisResult | null = pitch.analysis
      ? {
          overallScore: pitch.analysis.overallScore,
          metrics: {
            pacing: pitch.analysis.pacing,
            clarity: pitch.analysis.clarity,
            fillerWordFrequency: pitch.analysis.fillerWordFrequency,
            toneVariation: pitch.analysis.toneVariation,
            confidence: pitch.analysis.confidence,
          },
          skillBreakdown: pitch.analysis.skillBreakdown || [],
          feedback: pitch.analysis.feedback || [],
          improvements: pitch.analysis.improvements || [],
        }
      : null;

    const transcription: TranscriptionResult | null = pitch.transcription
      ? {
          text: pitch.transcription.text,
          keyPhrases: pitch.transcription.keyPhrases || [],
          timestamps: pitch.transcription.timestamps || [],
        }
      : null;

    return {
      id: pitch.id,
      title: pitch.title,
      type: pitch.type,
      duration: pitch.duration,
      status: pitch.status,
      progress: pitch.progress,
      createdAt: pitch.createdAt,
      updatedAt: pitch.updatedAt,
      videoUrl: pitch.videoUrl ?? null,
      audioUrl: pitch.audioUrl ?? null,
      analysis,
      transcription,
    };
  }

  /**
   * Get complete pitch detail (including analysis & transcription)
   */
  async getPitchDetail(pitchId: string): Promise<PitchDetail> {
    const response = await fetch(`${this.baseUrl}/pitches/${pitchId}`, {
      headers: this.getHeaders(),
    });

    const data = await this.handleResponse<{ pitch: any }>(response);
    if (!data.pitch) {
      throw new Error('Pitch not found');
    }

    return this.normalizePitch(data.pitch);
  }

  /**
   * Poll for analysis completion and return full pitch detail
   */
  async waitForAnalysisCompletion(
    pitchId: string,
    onProgress?: (progress: number, status: string) => void,
    maxWaitTime: number = 300000
  ): Promise<PitchDetail> {
    const startTime = Date.now();
    const pollInterval = 2000;

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const status = await this.checkPitchStatus(pitchId);
          onProgress?.(status.progress, status.status);

          if (status.status === 'completed' && status.hasAnalysis) {
            const detail = await this.getPitchDetail(pitchId);
            resolve(detail);
            return;
          }

          if (status.status === 'failed') {
            reject(new Error('Speech analysis failed'));
            return;
          }

          if (Date.now() - startTime > maxWaitTime) {
            reject(new Error('Analysis timeout - taking too long to complete'));
            return;
          }

          setTimeout(poll, pollInterval);
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }

  /**
   * Complete workflow: create pitch, upload recording and return final detail
   */
  async analyzeRecording(
    audioBlob: Blob,
    videoBlob: Blob | undefined,
    duration: number,
    title: string = `Pitch ${new Date().toLocaleDateString()}`,
    type: string = 'startup',
    onUploadProgress?: (progress: number) => void,
    onAnalysisProgress?: (progress: number, status: string) => void
  ): Promise<PitchDetail> {
    try {
      const { pitch } = await this.createPitch(title, type, duration);

      await this.uploadPitchFile(
        pitch.id,
        audioBlob,
        videoBlob,
        onUploadProgress
      );

      const detail = await this.waitForAnalysisCompletion(
        pitch.id,
        onAnalysisProgress
      );

      return detail;
    } catch (error) {
      console.error('Speech analysis workflow failed:', error);
      throw error;
    }
  }

  /**
   * Update auth token used for requests
   */
  setAuthToken(token: string | null): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }
}
