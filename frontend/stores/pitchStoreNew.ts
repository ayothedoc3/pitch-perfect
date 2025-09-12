import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { pitchesAPI, Pitch, User } from '../lib/api';

// Re-export types for backward compatibility
export interface UserPreferences {
  pitchType: string;
  experienceLevel: string;
  improvementGoals: string[];
  practiceFrequency: string;
}

export interface UserProfile extends User {}

// Store interface
interface PitchStore {
  pitches: Pitch[];
  currentPitch: Pitch | null;
  isRecording: boolean;
  isAnalyzing: boolean;
  uploadProgress: number;
  
  // Actions
  loadPitches: () => Promise<void>;
  addPitch: (pitchData: { title: string; type: string; duration: number }) => Promise<string>;
  updatePitch: (id: string, updates: Partial<Pitch>) => void;
  getPitch: (id: string) => Pitch | undefined;
  deletePitch: (id: string) => Promise<void>;
  uploadPitchFile: (pitchId: string, file: File) => Promise<void>;
  setCurrentPitch: (pitch: Pitch | null) => void;
  setRecording: (recording: boolean) => void;
  setAnalyzing: (analyzing: boolean) => void;
  setUploadProgress: (progress: number) => void;
  
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

// Create store
export const usePitchStore = create<PitchStore>()(
  persist(
    (set, get) => ({
      pitches: [],
      currentPitch: null,
      isRecording: false,
      isAnalyzing: false,
      uploadProgress: 0,
      
      loadPitches: async () => {
        try {
          const response = await pitchesAPI.getAll();
          set({ pitches: response.pitches });
        } catch (error) {
          console.error('Failed to load pitches:', error);
        }
      },
      
      addPitch: async (pitchData) => {
        try {
          const response = await pitchesAPI.create(pitchData);
          const pitch = response.pitch;
          
          set((state) => ({
            pitches: [pitch, ...state.pitches],
            currentPitch: pitch,
          }));
          
          return pitch.id;
        } catch (error) {
          console.error('Failed to create pitch:', error);
          throw error;
        }
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
      
      getPitch: (id) => {
        return get().pitches.find((pitch) => pitch.id === id);
      },
      
      deletePitch: async (id) => {
        try {
          await pitchesAPI.delete(id);
          set((state) => ({
            pitches: state.pitches.filter((pitch) => pitch.id !== id),
            currentPitch: state.currentPitch?.id === id ? null : state.currentPitch,
          }));
        } catch (error) {
          console.error('Failed to delete pitch:', error);
          throw error;
        }
      },
      
      uploadPitchFile: async (pitchId: string, file: File) => {
        try {
          set({ uploadProgress: 0, isAnalyzing: true });
          
          await pitchesAPI.uploadFile(pitchId, file, (progress) => {
            set({ uploadProgress: progress });
          });
          
          // Update pitch status to analyzing
          get().updatePitch(pitchId, { 
            status: 'analyzing',
            progress: 0 
          });
          
          // Poll for analysis completion
          const pollStatus = async () => {
            try {
              const status = await pitchesAPI.getStatus(pitchId);
              
              // Update pitch with current status
              get().updatePitch(pitchId, { 
                status: status.status,
                progress: status.progress || 0
              });
              
              if (status.status === 'analyzing') {
                setTimeout(pollStatus, 2000); // Poll every 2 seconds
              } else if (status.status === 'completed') {
                // Reload the specific pitch to get analysis results
                const response = await pitchesAPI.getById(pitchId);
                get().updatePitch(pitchId, response.pitch);
                set({ isAnalyzing: false });
              } else if (status.status === 'failed') {
                set({ isAnalyzing: false });
              }
            } catch (error) {
              console.error('Failed to poll pitch status:', error);
              set({ isAnalyzing: false });
            }
          };
          
          setTimeout(pollStatus, 1000); // Start polling after 1 second
        } catch (error) {
          console.error('Failed to upload pitch file:', error);
          set({ isAnalyzing: false });
          throw error;
        }
      },
      
      setCurrentPitch: (pitch) => set({ currentPitch: pitch }),
      setRecording: (recording) => set({ isRecording: recording }),
      setAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),
      setUploadProgress: (progress) => set({ uploadProgress: progress }),
      
      // Utility functions
      getPitchesByType: (type) => {
        if (type === 'all') return get().pitches;
        return get().pitches.filter((pitch) => pitch.type === type);
      },

      getRecentPitches: (limit = 5) => {
        return get().pitches
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, limit);
      },

      getUserStats: () => {
        const { pitches } = get();
        const totalPitches = pitches.length;
        const completedPitches = pitches.filter(p => p.analysis);
        const totalFeedback = completedPitches.length;
        const averageScore = completedPitches.length > 0 
          ? completedPitches.reduce((sum, pitch) => sum + (pitch.analysis?.overallScore || 0), 0) / completedPitches.length
          : 0;
        
        // Recent activity (pitches in last 7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const recentActivity = pitches.filter(
          (pitch) => new Date(pitch.createdAt) > weekAgo
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
      name: 'pitchbuddy-store-v2',
      // Only persist pitches list, not the temporary states
      partialize: (state) => ({
        pitches: state.pitches,
        currentPitch: state.currentPitch,
      }),
      skipHydration: typeof window === 'undefined',
    }
  )
);