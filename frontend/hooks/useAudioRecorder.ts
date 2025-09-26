import { useState, useRef, useCallback, useEffect } from 'react';

interface AudioRecorderConfig {
  sampleRate?: number;
  channelCount?: number;
  bitRate?: number;
  maxDuration?: number; // in seconds
  onDataAvailable?: (blob: Blob) => void;
  onError?: (error: Error) => void;
}

interface AudioRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioLevel: number;
  error: string | null;
  audioBlob: Blob | null;
  audioURL: string | null;
}

interface AudioRecorderActions {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  clearRecording: () => void;
  downloadRecording: (filename?: string) => void;
  getStream: () => MediaStream | null;
}

export const useAudioRecorder = (
  config: AudioRecorderConfig = {}
): AudioRecorderState & AudioRecorderActions => {
  const {
    sampleRate = 16000,
    channelCount = 1,
    bitRate = 128000,
    maxDuration = 300,
    onDataAvailable,
    onError,
  } = config;

  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioLevel: 0,
    error: null,
    audioBlob: null,
    audioURL: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioLevelTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const isRecordingRef = useRef(false);
  const isPausedRef = useRef(false);
  const stopRecordingRef = useRef<() => Promise<void>>(async () => {});

  const clearDurationTimer = () => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
  };

  const cleanupAudioResources = useCallback(() => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }

    if (audioContextRef.current) {
      if (audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => undefined);
      }
      audioContextRef.current = null;
    }

    analyserRef.current = null;
  }, []);

  const getAudioConstraints = useCallback(() => ({
    audio: {
      channelCount,
      sampleRate,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      googEchoCancellation: true,
      googAutoGainControl: true,
      googNoiseSuppression: true,
      googHighpassFilter: true,
      googTypingNoiseDetection: true,
      googAudioMirroring: false,
    },
  }), [channelCount, sampleRate]);

  const startAudioLevelMonitoring = useCallback(() => {
    if (!audioContextRef.current || !analyserRef.current) return;

    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateAudioLevel = () => {
      if (!isRecordingRef.current || isPausedRef.current) {
        audioLevelTimerRef.current = setTimeout(updateAudioLevel, 200);
        return;
      }

      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      const normalizedLevel = average / 255;

      setState(prev => ({ ...prev, audioLevel: normalizedLevel }));

      audioLevelTimerRef.current = setTimeout(updateAudioLevel, 100);
    };

    updateAudioLevel();
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null, duration: 0 }));
      isRecordingRef.current = true;
      isPausedRef.current = false;

      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current = null;

      cleanupAudioResources();
      clearDurationTimer();
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia(getAudioConstraints());
      audioStreamRef.current = stream;

      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4;codecs=mp4a.40.2',
        'audio/mp4',
        'audio/wav',
      ];

      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }

      if (!selectedMimeType) {
        throw new Error('No supported audio format found');
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
        audioBitsPerSecond: bitRate,
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          onDataAvailable?.(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: selectedMimeType });
        const audioURL = URL.createObjectURL(audioBlob);

        audioUrlRef.current = audioURL;
        audioChunksRef.current = [];

        setState(prev => ({
          ...prev,
          audioBlob,
          audioURL,
          isRecording: false,
          isPaused: false,
          audioLevel: 0,
        }));

        clearDurationTimer();
        cleanupAudioResources();
        mediaRecorderRef.current = null;
        isRecordingRef.current = false;
        isPausedRef.current = false;
      };

      mediaRecorder.onerror = (event) => {
        const recorderEvent = event as { error?: { message?: string } };
        const errorEvent = event as ErrorEvent;
        const message =
          recorderEvent?.error?.message ||
          errorEvent?.message ||
          'MediaRecorder encountered an unexpected error.';
        const error = new Error(message);

        setState(prev => ({ ...prev, error: message }));
        clearDurationTimer();
        cleanupAudioResources();
        mediaRecorderRef.current = null;
        audioChunksRef.current = [];
        isRecordingRef.current = false;
        isPausedRef.current = false;
        onError?.(error);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000);

      setState(prev => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        audioBlob: null,
        audioURL: null,
      }));

      clearDurationTimer();
      durationTimerRef.current = setInterval(() => {
        if (!isRecordingRef.current || isPausedRef.current) {
          return;
        }

        setState(prev => {
          const nextDuration = prev.duration + 1;
          if (nextDuration >= maxDuration) {
            stopRecordingRef.current?.();
          }
          return { ...prev, duration: nextDuration };
        });
      }, 1000);

      startAudioLevelMonitoring();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown recording error');
      const normalizedMessage = err.message?.toLowerCase() || '';
      const permissionDenied = (err as DOMException).name === 'NotAllowedError' || normalizedMessage.includes('denied');
      const hardwareConflict = (err as DOMException).name === 'NotReadableError' || normalizedMessage.includes('could not start audio source');

      const userMessage = permissionDenied
        ? 'Microphone access was denied. Please allow microphone permissions and try again.'
        : hardwareConflict
          ? 'Could not access the microphone. Ensure no other application is using it and that it is enabled in your system settings.'
          : err.message || 'Unable to start recording.';

      setState(prev => ({ ...prev, error: userMessage }));
      isRecordingRef.current = false;
      isPausedRef.current = false;
      clearDurationTimer();
      cleanupAudioResources();
      mediaRecorderRef.current = null;
      audioChunksRef.current = [];
      onError?.(new Error(userMessage));
    }
  }, [bitRate, cleanupAudioResources, getAudioConstraints, maxDuration, onDataAvailable, onError, startAudioLevelMonitoring]);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current) {
      return;
    }

    if (mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    clearDurationTimer();
    if (audioLevelTimerRef.current) {
      clearTimeout(audioLevelTimerRef.current);
      audioLevelTimerRef.current = null;
    }

    isRecordingRef.current = false;
    isPausedRef.current = false;
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecordingRef.current && !isPausedRef.current) {
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.pause();
        isPausedRef.current = true;
        setState(prev => ({ ...prev, isPaused: true, audioLevel: 0 }));
      }
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecordingRef.current && isPausedRef.current) {
      if (mediaRecorderRef.current.state === 'paused') {
        mediaRecorderRef.current.resume();
        isPausedRef.current = false;
        setState(prev => ({ ...prev, isPaused: false }));
        startAudioLevelMonitoring();
      }
    }
  }, [startAudioLevelMonitoring]);

  const clearRecording = useCallback(() => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }

    clearDurationTimer();
    if (audioLevelTimerRef.current) {
      clearTimeout(audioLevelTimerRef.current);
      audioLevelTimerRef.current = null;
    }

    cleanupAudioResources();
    mediaRecorderRef.current = null;
    isRecordingRef.current = false;
    isPausedRef.current = false;

    setState(prev => ({
      ...prev,
      audioBlob: null,
      audioURL: null,
      duration: 0,
      error: null,
      isRecording: false,
      isPaused: false,
      audioLevel: 0,
    }));

    audioChunksRef.current = [];
  }, [cleanupAudioResources]);

  const downloadRecording = useCallback((filename?: string) => {
    if (!state.audioBlob) return;

    const url = URL.createObjectURL(state.audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `recording-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [state.audioBlob]);

  const getStream = useCallback(() => audioStreamRef.current, []);

  useEffect(() => {
    stopRecordingRef.current = stopRecording;
  }, [stopRecording]);

  useEffect(() => {
    return () => {
      clearDurationTimer();
      if (audioLevelTimerRef.current) {
        clearTimeout(audioLevelTimerRef.current);
        audioLevelTimerRef.current = null;
      }

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current = null;

      cleanupAudioResources();
      audioChunksRef.current = [];
      isRecordingRef.current = false;
      isPausedRef.current = false;
    };
  }, [cleanupAudioResources]);

  return {
    ...state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearRecording,
    downloadRecording,
    getStream,
  };
};
