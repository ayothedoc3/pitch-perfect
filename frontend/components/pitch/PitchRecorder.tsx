import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { usePitchStore } from '../../stores/pitchStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';

interface PitchRecorderProps {
  onRecordingComplete: (pitchId: string) => void;
  maxDuration?: number; // seconds
  pitchTitle?: string;
  pitchType?: 'startup' | 'elevator' | 'sales';
}

const PitchRecorder: React.FC<PitchRecorderProps> = ({ 
  onRecordingComplete,
  maxDuration = 600, // 10 minutes default
  pitchTitle = 'New Pitch',
  pitchType = 'startup',
}) => {
  // Store hooks
  const { addPitch, updatePitch, setRecording, setAnalyzing, isAnalyzing } = usePitchStore();
  
  const webcamRef = useRef<Webcam>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [countdown, setCountdown] = useState<number>(3);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isCountingDown, setIsCountingDown] = useState<boolean>(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string>('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load available cameras on mount
  useEffect(() => {
    const loadDevices = async () => {
      try {
        const mediaDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = mediaDevices.filter(device => device.kind === 'videoinput');
        setDevices(videoDevices);
        if (videoDevices.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
      } catch (error) {
        console.error('Error loading media devices:', error);
      }
    };

    loadDevices();
  }, [selectedDeviceId]);

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

  // Create video URL when recording chunks are available
  useEffect(() => {
    if (recordedChunks.length > 0 && !recordedVideoUrl) {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setRecordedVideoUrl(url);

      // Cleanup URL on unmount
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [recordedChunks, recordedVideoUrl]);
  
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
  }, [maxDuration, handleDataAvailable, handleStopCaptureClick]);

  const handleStartCaptureClick = useCallback(() => {
    // Reset video URL
    if (recordedVideoUrl) {
      URL.revokeObjectURL(recordedVideoUrl);
      setRecordedVideoUrl('');
    }

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
  }, [startRecording, recordedVideoUrl]);

  const analyzeRecording = useCallback(async (pitchId: string, videoBlob: Blob) => {
    try {
      // Import API functions
      const { pitchesAPI } = await import('../../lib/api');

      // Create pitch in backend
      const pitchData = await pitchesAPI.create({
        title: pitchTitle,
        type: pitchType,
        duration: elapsedTime
      });

      // Upload video file to backend
      const file = new File([videoBlob], `pitch-${pitchId}.webm`, { type: 'video/webm' });
      await pitchesAPI.uploadFile(pitchData.pitch.id, file, (progress) => {
        updatePitch(pitchId, { progress: progress * 0.5 }); // Upload is 50% of progress
      });

      // Poll for analysis completion
      const pollInterval = setInterval(async () => {
        try {
          const status = await pitchesAPI.getStatus(pitchData.pitch.id);

          if (status.status === 'completed' && status.hasAnalysis) {
            // Get full pitch data with analysis
            const fullPitchData = await pitchesAPI.getById(pitchData.pitch.id);
            const pitch = fullPitchData.pitch;

            // Update frontend store with backend analysis
            updatePitch(pitchId, {
              analysis: {
                overallScore: pitch.analysis.overallScore,
                metrics: {
                  pacing: pitch.analysis.pacing,
                  clarity: pitch.analysis.clarity,
                  fillerWordFrequency: pitch.analysis.fillerWordFrequency,
                  toneVariation: pitch.analysis.toneVariation,
                  confidence: pitch.analysis.confidence,
                },
                skillBreakdown: pitch.analysis.skillBreakdown,
                feedback: pitch.analysis.feedback,
                improvements: pitch.analysis.improvements,
              },
              transcription: {
                text: pitch.transcription.text,
                timestamps: pitch.transcription.timestamps,
                keyPhrases: pitch.transcription.keyPhrases,
              },
              progress: 100, // Analysis complete
            });

            clearInterval(pollInterval);
            setAnalyzing(false);
          } else if (status.status === 'failed') {
            throw new Error('Backend analysis failed');
          } else {
            // Update progress for ongoing analysis
            updatePitch(pitchId, { progress: 50 + (status.progress || 0) * 0.5 });
          }
        } catch (pollError) {
          console.error('Polling error:', pollError);
          clearInterval(pollInterval);
          throw pollError;
        }
      }, 2000); // Poll every 2 seconds

      // Set timeout to avoid infinite polling
      setTimeout(() => {
        clearInterval(pollInterval);
        if (isAnalyzing) {
          throw new Error('Analysis timeout');
        }
      }, 120000); // 2 minutes timeout

    } catch (error) {
      console.error('Analysis failed:', error);

      // Update pitch with error state
      updatePitch(pitchId, {
        progress: -1, // Indicates analysis failed
      });
      setAnalyzing(false);
    }
  }, [pitchTitle, pitchType, elapsedTime, updatePitch, setAnalyzing, isAnalyzing]);
  
  const handleSave = useCallback(async () => {
    if (recordedChunks.length > 0) {
      try {
        const videoBlob = new Blob(recordedChunks, { type: 'video/webm' });
        
        // Create initial pitch record
        const pitchId = addPitch({
          title: pitchTitle,
          type: pitchType,
          duration: elapsedTime,
          progress: 0,
          videoBlob,
        });

        setRecording(false);
        setAnalyzing(true);

        // Start analysis in the background
        analyzeRecording(pitchId, videoBlob);
        
        // Clear recorded chunks
        setRecordedChunks([]);

        // Clear video URL
        if (recordedVideoUrl) {
          URL.revokeObjectURL(recordedVideoUrl);
          setRecordedVideoUrl('');
        }

        // Notify parent component
        onRecordingComplete(pitchId);
        
      } catch (error) {
        console.error('Error saving pitch:', error);
        alert('Error saving pitch. Please try again.');
      }
    }
  }, [recordedChunks, pitchTitle, pitchType, elapsedTime, addPitch, setRecording, setAnalyzing, onRecordingComplete, analyzeRecording, recordedVideoUrl]);
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const remainingTime = maxDuration - elapsedTime;
  const isNearingTimeLimit = remainingTime <= 60;
  
  return (
    <Card>
      <CardContent className="p-6">
        {/* Camera Selection */}
        {devices.length > 1 && (
          <div className="mb-4">
            <label htmlFor="camera-select" className="block text-sm font-medium text-gray-700 mb-2">
              Select Camera:
            </label>
            <select
              id="camera-select"
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={capturing || isCountingDown}
            >
              {devices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="relative">
          {recordedVideoUrl && !capturing && !isCountingDown ? (
            // Show recorded video preview
            <video
              src={recordedVideoUrl}
              controls
              className="w-full rounded-lg aspect-video"
              style={{ maxHeight: '400px' }}
            />
          ) : (
            // Show live webcam
            <Webcam
              audio={true}
              ref={webcamRef}
              className="w-full rounded-lg aspect-video"
              videoConstraints={{
                deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
              }}
            />
          )}

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
          {isAnalyzing ? (
            <div className="flex items-center space-x-3 text-blue-600">
              <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <span className="font-medium">Analyzing your pitch with AI...</span>
            </div>
          ) : capturing ? (
            <Button onClick={handleStopCaptureClick} className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <rect x="6" y="6" width="12" height="12" strokeWidth="2" />
              </svg>
              <span>Stop Recording</span>
            </Button>
          ) : (
            <>
              {recordedChunks.length > 0 ? (
                <>
                  <Button variant="outline" onClick={handleStartCaptureClick} className="flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Record Again</span>
                  </Button>
                  <Button onClick={handleSave} className="flex items-center space-x-2 bg-green-600 hover:bg-green-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>✨ Analyze My Pitch</span>
                  </Button>
                </>
              ) : (
                <Button onClick={handleStartCaptureClick} className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                  </svg>
                  <span>Start Recording</span>
                </Button>
              )}
            </>
          )}
        </div>
        
        <div className="mt-6">
          <CardTitle className="text-sm mb-2">Tips:</CardTitle>
          <CardDescription>
            <ul className="space-y-1 list-disc list-inside">
              <li>Find a quiet space with good lighting</li>
              <li>Position yourself centrally in the frame</li>
              <li>Speak clearly and at a moderate pace</li>
              <li>Remember to pause occasionally to emphasize points</li>
              <li>Keep your pitch under 10 minutes for best results</li>
            </ul>
          </CardDescription>
        </div>
      </CardContent>
    </Card>
  );
};

export default PitchRecorder;
