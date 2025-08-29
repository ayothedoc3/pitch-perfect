import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Pitch {
  id: string;
  title: string;
  type: 'startup' | 'elevator' | 'sales';
  duration: number;
  dateRecorded: string;
  videoBlob?: Blob;
  videoUrl?: string;
  thumbnailUrl?: string;
  progress: number;
  transcription?: {
    text: string;
    keyPhrases: string[];
    timestamps: Array<{
      word: string;
      start: number;
      end: number;
    }>;
  };
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
  };
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

interface PitchStore {
  // State
  pitches: Pitch[];
  currentPitch: Pitch | null;
  isRecording: boolean;
  isAnalyzing: boolean;
  userProfile: UserProfile | null;
  
  // Actions
  addPitch: (pitch: Omit<Pitch, 'id' | 'dateRecorded' | 'feedbackCount'>) => string;
  updatePitch: (id: string, updates: Partial<Pitch>) => void;
  deletePitch: (id: string) => void;
  getPitch: (id: string) => Pitch | undefined;
  setCurrentPitch: (pitch: Pitch | null) => void;
  setRecording: (isRecording: boolean) => void;
  setAnalyzing: (isAnalyzing: boolean) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  
  // Utility functions
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
      // Initial state
      pitches: [],
      currentPitch: null,
      isRecording: false,
      isAnalyzing: false,
      userProfile: null,

      // Actions
      addPitch: (pitchData) => {
        const id = `pitch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newPitch: Pitch = {
          ...pitchData,
          id,
          dateRecorded: new Date().toISOString(),
          feedbackCount: 0,
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

      // Utility functions
      getPitchesByType: (type) => {
        if (type === 'all') return get().pitches;
        return get().pitches.filter((pitch) => pitch.type === type);
      },

      getRecentPitches: (limit = 5) => {
        return get().pitches
          .sort((a, b) => new Date(b.dateRecorded).getTime() - new Date(a.dateRecorded).getTime())
          .slice(0, limit);
      },

      getUserStats: () => {
        const { pitches } = get();
        const totalPitches = pitches.length;
        const totalFeedback = pitches.reduce((sum, pitch) => sum + pitch.feedbackCount, 0);
        const averageScore = pitches.length > 0 
          ? pitches.reduce((sum, pitch) => sum + (pitch.analysis?.overallScore || 0), 0) / pitches.length
          : 0;
        
        // Recent activity (pitches in last 7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const recentActivity = pitches.filter(
          (pitch) => new Date(pitch.dateRecorded) > weekAgo
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
      name: 'pitch-perfect-storage',
      // Only persist certain fields, not video blobs
      partialize: (state) => ({
        pitches: state.pitches.map(pitch => ({
          ...pitch,
          videoBlob: undefined, // Don't persist video blobs
        })),
        userProfile: state.userProfile,
      }),
      // Skip hydration on server-side to prevent mismatches
      skipHydration: typeof window === 'undefined',
    }
  )
);