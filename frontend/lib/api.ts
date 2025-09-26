// API client for Pitch Perfect application
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid token
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      
      // Redirect to login if not already there
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// Types
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  level: string;
  totalPitches: number;
  totalFeedback: number;
  currentStreak: number;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  id: string;
  pitchType: string;
  experienceLevel: string;
  improvementGoals: string[];
  practiceFrequency: string;
}

export interface Pitch {
  id: string;
  title: string;
  type: string;
  duration: number;
  videoUrl?: string;
  audioUrl?: string;
  progress: number;
  status: 'recorded' | 'analyzing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
  analysis?: PitchAnalysis;
  transcription?: PitchTranscription;
}

export interface PitchAnalysis {
  id: string;
  overallScore: number;
  pacing: number;
  clarity: number;
  fillerWordFrequency: number;
  toneVariation: number;
  confidence: number;
  skillBreakdown: Array<{
    category: string;
    score: number;
    previousScore?: number;
  }>;
  feedback: string[];
  improvements: string[];
}

export interface PitchTranscription {
  id: string;
  text: string;
  timestamps: Array<{
    word: string;
    start: number;
    end: number;
  }>;
  keyPhrases: string[];
}

// Auth API
export const authAPI = {
  register: async (data: { email: string; password: string; name?: string }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updatePreferences: async (preferences: Partial<UserPreferences>) => {
    const response = await api.put('/auth/preferences', preferences);
    return response.data;
  },
};

// Pitches API
export const pitchesAPI = {
  getAll: async (page = 1, limit = 10) => {
    const response = await api.get(`/pitches?page=${page}&limit=${limit}`);
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/pitches/${id}`);
    return response.data;
  },

  create: async (data: { title: string; type: string; duration: number }) => {
    const response = await api.post('/pitches', data);
    return response.data;
  },

  uploadFile: async (pitchId: string, file: File, onUploadProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/pitches/${pitchId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(progress);
        }
      },
    });

    return response.data;
  },

  getStatus: async (id: string) => {
    const response = await api.get(`/pitches/${id}/status`);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/pitches/${id}`);
    return response.data;
  },
};

// Utility functions
export const setAuthToken = (token: string) => {
  localStorage.setItem('auth_token', token);
};

export const removeAuthToken = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
};

export const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

export const setUser = (user: User) => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const getUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export default api;