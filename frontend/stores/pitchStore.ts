import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PitchDetail } from '../services/SpeechUploadService';

export interface Pitch {
  id: string;
  title: string;
  type: 'startup' | 'elevator' | 'sales' | string;
  duration: number;
  dateRecorded?: string;
  createdAt: string;
  updatedAt: string;
  status: 'recorded' | 'analyzing' | 'completed' | 'failed';
  progress: number;
  videoBlob?: Blob;
  videoUrl?: string | null;
  audioUrl?: string | null;
  thumbnailUrl?: string;
  transcription?: {
    text: string;
    keyPhrases: string[];
    timestamps: Array<{
      word: string;
      start: number;
      end: number;
    }>;
  } | null;
  analysis?: {
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
  } | null;
  feedbackCount: number;
}

export interface UserProfile {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  totalPitches: number;
  totalFeedback: number;
  currentStreak: number;
  preferences: {
    pitchType: string;
    experienceLevel: string;
    improvementGoals: string[];
    practiceFrequency: string;
  };
}

export const mapPitchDetailToStorePitch = (detail: PitchDetail | any): Pitch => {
  const analysis = detail?.analysis;

  // Support both shapes coming from the API:
  // 1) normalized (analysis.metrics.{pacing, clarity, ...})
  // 2) flat fields under analysis (analysis.pacing, analysis.clarity, ...)
  const metrics = analysis
    ? (
        analysis.metrics ?? {
          pacing: analysis.pacing ?? 0,
          clarity: analysis.clarity ?? 0,
          fillerWordFrequency: analysis.fillerWordFrequency ?? 0,
          toneVariation: analysis.toneVariation ?? 0,
          confidence: analysis.confidence ?? 0,
        }
      )
    : undefined;

  return {
    id: detail.id,
    title: detail.title,
    type: detail.type,
    duration: detail.duration,
    dateRecorded: detail.createdAt,
    createdAt: detail.createdAt,
    updatedAt: detail.updatedAt,
    status: detail.status,
    progress: detail.progress,
    videoUrl: detail.videoUrl ?? null,
    audioUrl: detail.audioUrl ?? null,
    thumbnailUrl: undefined,
    transcription: detail.transcription
      ? {
          text: detail.transcription.text,
          keyPhrases: detail.transcription.keyPhrases,
          timestamps: detail.transcription.timestamps,
        }
      : null,
    analysis: analysis
      ? {
          overallScore: analysis.overallScore ?? 0,
          metrics: metrics as {
            pacing: number;
            clarity: number;
            fillerWordFrequency: number;
            toneVariation: number;
            confidence: number;
          },
          skillBreakdown: analysis.skillBreakdown ?? [],
          feedback: analysis.feedback ?? [],
          improvements: analysis.improvements ?? [],
        }
      : null,
    feedbackCount: analysis ? (analysis.feedback?.length ?? 0) : 0,
  };
};

interface PitchStore {
  pitches: Pitch[];
  currentPitch: Pitch | null;
  isRecording: boolean;
  isAnalyzing: boolean;
  userProfile: UserProfile | null;

  addPitch: (pitch: Omit<Pitch, 'id' | 'feedbackCount' | 'createdAt' | 'updatedAt' | 'status' | 'progress'>) => string;
  updatePitch: (id: string, updates: Partial<Pitch>) => void;
  deletePitch: (id: string) => void;
  getPitch: (id: string) => Pitch | undefined;
  setCurrentPitch: (pitch: Pitch | null) => void;
  setRecording: (isRecording: boolean) => void;
  setAnalyzing: (isAnalyzing: boolean) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  setPitches: (pitches: Pitch[]) => void;
  upsertPitch: (pitch: Pitch) => void;

  getPitchesByType: (type: string) => Pitch[];
  getRecentPitches: (limit?: number) => Pitch[];
  getUserStats: () => {
    totalPitches: number;
    totalFeedback: number;
    averageScore: number;
    recentActivity: number;
  };
}

export const usePitchStore = create<PitchStore>()(
  persist(
    (set, get) => ({
      pitches: [],
      currentPitch: null,
      isRecording: false,
      isAnalyzing: false,
      userProfile: null,

      addPitch: (pitchData) => {
        const id = `pitch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();
        const newPitch: Pitch = {
          ...pitchData,
          id,
          createdAt: now,
          updatedAt: now,
          status: 'recorded',
          progress: 0,
          feedbackCount: 0,
          analysis: pitchData.analysis ?? null,
          transcription: pitchData.transcription ?? null,
        };

        set((state) => ({
          pitches: [...state.pitches, newPitch],
          currentPitch: newPitch,
        }));

        return id;
      },

      updatePitch: (id, updates) => {
        set((state) => ({
          pitches: state.pitches.map((pitch) =>
            pitch.id === id ? { ...pitch, ...updates } : pitch
          ),
          currentPitch: state.currentPitch?.id === id
            ? { ...state.currentPitch, ...updates }
            : state.currentPitch,
        }));
      },

      deletePitch: (id) => {
        set((state) => ({
          pitches: state.pitches.filter((pitch) => pitch.id !== id),
          currentPitch: state.currentPitch?.id === id ? null : state.currentPitch,
        }));
      },

      getPitch: (id) => {
        return get().pitches.find((pitch) => pitch.id === id);
      },

      setCurrentPitch: (pitch) => {
        set({ currentPitch: pitch });
      },

      setRecording: (isRecording) => {
        set({ isRecording });
      },

      setAnalyzing: (isAnalyzing) => {
        set({ isAnalyzing });
      },

      setUserProfile: (profile) => {
        set({ userProfile: profile });
      },

      updateUserProfile: (updates) => {
        set((state) => ({
          userProfile: state.userProfile
            ? { ...state.userProfile, ...updates }
            : null,
        }));
      },

      setPitches: (pitches) => {
        set((state) => ({
          pitches,
          currentPitch: state.currentPitch
            ? pitches.find((pitch) => pitch.id === state.currentPitch!.id) || state.currentPitch
            : null,
        }));
      },

      upsertPitch: (pitch) => {
        set((state) => {
          const existingIndex = state.pitches.findIndex((p) => p.id === pitch.id);
          const updatedPitches = existingIndex >= 0
            ? state.pitches.map((p) => (p.id === pitch.id ? pitch : p))
            : [...state.pitches, pitch];

          return {
            pitches: updatedPitches,
            currentPitch: state.currentPitch?.id === pitch.id ? pitch : state.currentPitch,
          };
        });
      },

      getPitchesByType: (type) => {
        if (type === 'all') return get().pitches;
        return get().pitches.filter((pitch) => pitch.type === type);
      },

      getRecentPitches: (limit = 5) => {
        return get().pitches
          .sort((a, b) => new Date(b.createdAt || b.dateRecorded || '').getTime() - new Date(a.createdAt || a.dateRecorded || '').getTime())
          .slice(0, limit);
      },

      getUserStats: () => {
        const { pitches } = get();
        const totalPitches = pitches.length;
        const totalFeedback = pitches.reduce((sum, pitch) => sum + pitch.feedbackCount, 0);
        const averageScore = pitches.length > 0
          ? pitches.reduce((sum, pitch) => sum + (pitch.analysis?.overallScore || 0), 0) / pitches.length
          : 0;

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const recentActivity = pitches.filter(
          (pitch) => new Date(pitch.createdAt || pitch.dateRecorded || '') > weekAgo
        ).length;

        return {
          totalPitches,
          totalFeedback,
          averageScore,
          recentActivity,
        };
      },
    }),
    {
      name: 'pitchbuddy-storage',
      partialize: (state) => ({
        pitches: state.pitches.map(({ videoBlob, ...pitch }) => ({ ...pitch })),
        currentPitch: state.currentPitch ? ({ ...state.currentPitch, videoBlob: undefined }) : null,
        userProfile: state.userProfile,
      }),
    }
  )
);
