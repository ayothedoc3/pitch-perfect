import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';

interface PitchRecorderProps {
  onRecordingComplete: (recording: Blob) => void;
  maxDuration?: number; // seconds
}

const PitchRecorder: React.FC<PitchRecorderProps> = ({ 
  onRecordingComplete,
  maxDuration = 600, // 10 minutes default
}) => {
  const webcamRef = useRef<Webcam>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [countdown, setCountdown] = useState<number>(3);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isCountingDown, setIsCountingDown] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleStartCaptureClick = useCallback(() => {
    setIsCountingDown(true);
    setCountdown(3);
    
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          startRecording();
          setIsCountingDown(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);
  
  const startRecording = useCallback(() => {
    setCapturing(true);
    setElapsedTime(0);
    setRecordedChunks([]);
    
    if (webcamRef.current && webcamRef.current.stream) {
      mediaRecorderRef.current = new MediaRecorder(webcamRef.current.stream, {
        mimeType: 'video/webm',
      });
      
      mediaRecorderRef.current.addEventListener('dataavailable', handleDataAvailable);
      mediaRecorderRef.current.start();
      
      // Start timer
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => {
          if (prev >= maxDuration - 1) {
            handleStopCaptureClick();
            return maxDuration;
          }
          return prev + 1;
        });
      }, 1000);
    }
  }, [maxDuration]);
  
  const handleDataAvailable = useCallback(({ data }: BlobEvent) => {
    if (data.size > 0) {
      setRecordedChunks((prev) => [...prev, data]);
    }
  }, []);
  
  const handleStopCaptureClick = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    
    setCapturing(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);
  
  const handleSave = useCallback(() => {
    if (recordedChunks.length > 0) {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      onRecordingComplete(blob);
      setRecordedChunks([]);
    }
  }, [recordedChunks, onRecordingComplete]);
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const remainingTime = maxDuration - elapsedTime;
  const isNearingTimeLimit = remainingTime <= 60;
  
  return (
    <div className="card">
      <div className="relative">
        <Webcam
          audio={true}
          ref={webcamRef}
          className="w-full rounded-lg aspect-video"
        />
        
        {isCountingDown && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
            <div className="text-6xl font-bold text-white">{countdown}</div>
          </div>
        )}
        
        {capturing && (
          <div className="absolute top-3 right-3 flex items-center space-x-2 bg-black bg-opacity-70 rounded-lg px-3 py-1">
            <div className="h-3 w-3 rounded-full bg-red-600 animate-pulse"></div>
            <span className={`text-white text-sm font-medium ${isNearingTimeLimit ? 'text-red-400' : ''}`}>
              {formatTime(elapsedTime)} / {formatTime(maxDuration)}
            </span>
          </div>
        )}
      </div>
      
      <div className="mt-4 flex justify-center space-x-4">
        {capturing ? (
<button 
  onClick={handleStopCaptureClick}
  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center space-x-2"
>
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="6" width="12" height="12" strokeWidth="2" />
  </svg>
  <span>Stop Recording</span>
</button>
        ) : (
          <>
            {recordedChunks.length > 0 ? (
              <>
<button 
  onClick={handleStartCaptureClick}
  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded flex items-center space-x-2"
>
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
  <span>Record Again</span>
</button>
<button 
  onClick={handleSave}
  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center space-x-2"
>
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
  <span>Save Pitch</span>
</button>
              </>
            ) : (
              <button 
                onClick={handleStartCaptureClick}
                className="btn btn-primary flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" strokeWidth="2" />
                  <circle cx="12" cy="12" r="3" fill="currentColor" />
                </svg>
                <span>Start Recording</span>
              </button>
            )}
          </>
        )}
      </div>
      
      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Tips:</h3>
        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li>Find a quiet space with good lighting</li>
          <li>Position yourself centrally in the frame</li>
          <li>Speak clearly and at a moderate pace</li>
          <li>Remember to pause occasionally to emphasize points</li>
          <li>Keep your pitch under 10 minutes for best results</li>
        </ul>
      </div>
    </div>
  );
};

export default PitchRecorder;
