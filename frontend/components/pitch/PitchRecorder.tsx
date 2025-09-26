import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';

interface PitchRecorderProps {
  onRecordingComplete?: (audioBlob: Blob, videoBlob?: Blob | null, duration?: number) => void;
  onError?: (error: string) => void;
  onAnalysisProgress?: (progress: number) => void;
  maxDuration?: number;
  enableVideo?: boolean;
  className?: string;
}

interface CountdownState {
  isActive: boolean;
  count: number;
}

export const PitchRecorder: React.FC<PitchRecorderProps> = ({
  onRecordingComplete,
  onError,
  onAnalysisProgress,
  maxDuration = 300,
  enableVideo = true,
  className = '',
}) => {
  const [countdown, setCountdown] = useState<CountdownState>({ isActive: false, count: 0 });
  const [recordingState, setRecordingState] = useState<'idle' | 'countdown' | 'recording' | 'processing'>('idle');
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);

  const webcamRef = useRef<Webcam>(null);
  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);

  const audioRecorder = useAudioRecorder({
    sampleRate: 16000,
    channelCount: 1,
    bitRate: 128000,
    maxDuration,
    onError: (error) => onError?.(error.message),
  });

  const formatDuration = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setRecordingState('recording');
      setVideoBlob(null);
      videoChunksRef.current = [];

      await audioRecorder.startRecording();

      if (enableVideo && webcamRef.current?.stream) {
        const webcamStream = webcamRef.current.stream;
        const audioStream = audioRecorder.getStream();
        const combinedStream = new MediaStream();

        webcamStream.getVideoTracks().forEach((track) => combinedStream.addTrack(track.clone()));
        audioStream?.getAudioTracks().forEach((track) => combinedStream.addTrack(track.clone()));

        const options: MediaRecorderOptions = {
          mimeType: 'video/webm;codecs=vp8,opus',
        };

        if (options.mimeType && !MediaRecorder.isTypeSupported(options.mimeType)) {
          options.mimeType = 'video/webm';
        }

        const videoRecorder = new MediaRecorder(combinedStream, options);
        videoChunksRef.current = [];

        videoRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            videoChunksRef.current.push(event.data);
          }
        };

        videoRecorder.onstop = () => {
          const blob = new Blob(videoChunksRef.current, { type: 'video/webm' });
          combinedStream.getTracks().forEach((track) => track.stop());
          setVideoBlob(blob);
        };

        videoRecorder.start();
        videoRecorderRef.current = videoRecorder;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start recording';
      onError?.(errorMessage);
      setRecordingState('idle');
    }
  }, [audioRecorder, enableVideo, onError]);

  const startCountdown = useCallback(async () => {
    if (recordingState !== 'idle') return;

    setRecordingState('countdown');
    setCountdown({ isActive: true, count: 3 });

    for (let i = 3; i > 0; i--) {
      setCountdown({ isActive: true, count: i });
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    setCountdown({ isActive: false, count: 0 });
    startRecording();
  }, [recordingState, startRecording]);

  const stopRecording = useCallback(async () => {
    if (recordingState !== 'recording') return;

    setRecordingState('processing');

    try {
      await audioRecorder.stopRecording();

      if (videoRecorderRef.current && videoRecorderRef.current.state !== 'inactive') {
        videoRecorderRef.current.stop();
        videoRecorderRef.current = null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop recording';
      onError?.(errorMessage);
      setRecordingState('idle');
    }
  }, [audioRecorder, onError, recordingState]);

  const togglePauseRecording = useCallback(() => {
    if (audioRecorder.isPaused) {
      audioRecorder.resumeRecording();
      if (videoRecorderRef.current && videoRecorderRef.current.state === 'paused') {
        videoRecorderRef.current.resume();
      }
    } else {
      audioRecorder.pauseRecording();
      if (videoRecorderRef.current && videoRecorderRef.current.state === 'recording') {
        videoRecorderRef.current.pause();
      }
    }
  }, [audioRecorder]);

  const clearRecording = useCallback(() => {
    audioRecorder.clearRecording();
    if (videoRecorderRef.current && videoRecorderRef.current.state !== 'inactive') {
      videoRecorderRef.current.stop();
    }
    videoRecorderRef.current = null;
    setVideoBlob(null);
    videoChunksRef.current = [];
    setRecordingState('idle');
  }, [audioRecorder]);

  useEffect(() => {
    if (onAnalysisProgress) {
      onAnalysisProgress(audioRecorder.duration);
    }
  }, [audioRecorder.duration, onAnalysisProgress]);

  useEffect(() => {
    if (recordingState === 'processing' && audioRecorder.audioBlob) {
      if (enableVideo && videoRecorderRef.current && !videoBlob) {
        return; // wait for video blob to be ready
      }

      onRecordingComplete?.(
        audioRecorder.audioBlob,
        enableVideo ? videoBlob ?? undefined : undefined,
        audioRecorder.duration
      );
      setRecordingState('idle');
    }
  }, [audioRecorder.audioBlob, audioRecorder.duration, enableVideo, onRecordingComplete, videoBlob, recordingState]);

  useEffect(() => {
    return () => {
      if (videoRecorderRef.current && videoRecorderRef.current.state !== 'inactive') {
        videoRecorderRef.current.stop();
      }
      videoRecorderRef.current = null;
    };
  }, []);

  const getAudioLevelStyle = (): React.CSSProperties => {
    const level = audioRecorder.audioLevel * 100;
    return {
      background: `linear-gradient(to right,
        ${level > 70 ? '#ef4444' : level > 40 ? '#f59e0b' : '#10b981'} ${level}%,
        #e5e7eb ${level}%)`,
    };
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="relative rounded-xl bg-gray-900 overflow-hidden">
        <Webcam
          ref={webcamRef}
          audio={false}
          muted
          width="100%"
          height="auto"
          videoConstraints={{
            width: 1280,
            height: 720,
            facingMode: 'user',
            frameRate: 30,
          }}
          className="w-full rounded-lg bg-gray-900"
        />

        {recordingState === 'recording' && (
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-white text-sm font-medium bg-black bg-opacity-50 px-2 py-1 rounded">
              REC
            </span>
          </div>
        )}

        <div className="absolute top-4 right-4 flex items-center gap-2 text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.127 4.202a1 1 0 011.746 0l7.447 13.31A1 1 0 0118.447 19H5.553a1 1 0 01-.873-1.488l7.447-13.31z" />
          </svg>
          {formatDuration(audioRecorder.duration)}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs uppercase tracking-wide text-gray-500">Audio Level</div>
        <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
          <div className="h-full transition-all" style={getAudioLevelStyle()} />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 justify-center">
        {recordingState === 'idle' && (
          <button
            onClick={startCountdown}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            Start Recording
          </button>
        )}

        {recordingState === 'recording' && (
          <>
            <button
              onClick={stopRecording}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
              </svg>
              Stop Recording
            </button>

            <button
              onClick={togglePauseRecording}
              className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {audioRecorder.isPaused ? (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Resume
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Pause
                </>
              )}
            </button>
          </>
        )}

        {(audioRecorder.audioBlob || videoBlob) && recordingState === 'idle' && (
          <button
            onClick={clearRecording}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear
          </button>
        )}
      </div>

      {recordingState === 'countdown' && (
        <div className="mt-4 text-center text-lg font-medium text-gray-700">
          Get ready! Recording will start in {countdown.count}...
        </div>
      )}

      {recordingState === 'processing' && (
        <div className="mt-4 text-center">
          <div className="text-lg font-medium text-gray-700">Processing recording...</div>
          <div className="mt-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
          </div>
        </div>
      )}

      {audioRecorder.error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
          <p className="text-sm">
            <strong>Recording Error:</strong> {audioRecorder.error}
          </p>
        </div>
      )}

      {audioRecorder.audioBlob && recordingState === 'idle' && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          <strong>Recording Complete!</strong>
          <br />
          Duration: {formatDuration(audioRecorder.duration)}
          <br />
          Audio Size: {Math.round(audioRecorder.audioBlob.size / 1024)} KB
          {videoBlob && (
            <>
              <br />
              Video Size: {Math.round(videoBlob.size / 1024)} KB
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PitchRecorder;

