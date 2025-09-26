import React, { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import PitchRecorder from '../components/pitch/PitchRecorder';
import { SpeechUploadService, PitchDetail, AnalysisResult } from '../services/SpeechUploadService';
import { usePitchStore, mapPitchDetailToStorePitch } from '../stores/pitchStore';

const speechUploadServiceFactory = () => new SpeechUploadService();

const PitchPracticePage: React.FC = () => {
  const router = useRouter();
  const upsertPitch = usePitchStore((state) => state.upsertPitch);

  const serviceRef = useRef<SpeechUploadService | null>(null);
  if (serviceRef.current === null) {
    serviceRef.current = speechUploadServiceFactory();
  }
  const speechUploadService = serviceRef.current!;

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [latestPitch, setLatestPitch] = useState<PitchDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRecordingComplete = useCallback(async (
    audioBlob: Blob,
    videoBlob?: Blob | null,
    duration?: number
  ) => {
    if (!audioBlob) {
      setError('No audio recorded');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    setLatestPitch(null);
    setUploadProgress(0);
    setAnalysisProgress(0);
    setAnalysisStatus('queued');

    try {
      const result = await speechUploadService.analyzeRecording(
        audioBlob,
        videoBlob || undefined,
        duration || 0,
        `Pitch Recording ${new Date().toLocaleDateString()}`,
        'startup',
        (progress) => {
          setUploadProgress(progress);
        },
        (progress, status) => {
          setAnalysisProgress(progress);
          setAnalysisStatus(status);
        }
      );

      upsertPitch(mapPitchDetailToStorePitch(result));
      setLatestPitch(result);
      setAnalysisResult(result.analysis ?? null);
      setAnalysisProgress(100);
      setAnalysisStatus('completed');
    } catch (err) {
      console.error('Analysis failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Speech analysis failed';
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  }, [speechUploadService, upsertPitch]);

  const handleError = useCallback((errorMessage: string) => {
    console.error('Recording error:', errorMessage);
    setError(errorMessage);
  }, []);

  const resetAnalysis = useCallback(() => {
    setAnalysisResult(null);
    setLatestPitch(null);
    setError(null);
    setUploadProgress(0);
    setAnalysisProgress(0);
    setAnalysisStatus('');
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Practice Your Pitch
        </h1>
        <p className="text-gray-600">
          Record your pitch and get AI-powered feedback on your delivery, clarity, and content.
        </p>
      </div>

      <div className="mb-8">
        <PitchRecorder
          onRecordingComplete={handleRecordingComplete}
          onError={handleError}

          maxDuration={300}
          enableVideo={true}
          className="w-full"
        />
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-100 border border-red-200 text-red-700 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      )}

      {isAnalyzing && (
        <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">Analyzing your pitch...</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-blue-800 mb-1">Upload Progress</p>
              <div className="w-full bg-blue-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-2 transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-blue-700 mt-1">{uploadProgress}% uploaded</p>
            </div>

            <div>
              <p className="text-sm font-medium text-blue-800 mb-1">Analysis Progress</p>
              <div className="w-full bg-blue-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-500 h-2 transition-all"
                  style={{ width: `${analysisProgress}%` }}
                />
              </div>
              <p className="text-xs text-blue-700 mt-1">
                Status: {analysisStatus || 'working...'}
              </p>
            </div>
          </div>
        </div>
      )}

      {latestPitch && (
        <div className="mb-8 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="font-semibold">Pitch saved and analyzed!</p>
            <p className="text-sm text-green-700">
              View the full breakdown, transcription, and feedback.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/pitch/${latestPitch.id}`)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
            >
              View Detailed Feedback
            </button>
            <button
              onClick={() => router.push('/pitches')}
              className="px-4 py-2 bg-green-100 hover:bg-green-200 text-green-800 rounded-lg text-sm font-medium"
            >
              Go to Pitch Library
            </button>
          </div>
        </div>
      )}

      {analysisResult && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Summary</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(analysisResult.metrics.pacing)}
                </div>
                <div className="text-sm text-gray-600">Words per minute</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(analysisResult.metrics.clarity * 100)}%
                </div>
                <div className="text-sm text-gray-600">Clarity</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(analysisResult.metrics.confidence * 100)}%
                </div>
                <div className="text-sm text-gray-600">Confidence</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {Math.round(analysisResult.metrics.toneVariation * 100)}%
                </div>
                <div className="text-sm text-gray-600">Tone Variation</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {Math.round(analysisResult.metrics.fillerWordFrequency * 100)}%
                </div>
                <div className="text-sm text-gray-600">Filler Words</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">AI Feedback</h3>
            <div className="space-y-3">
              {analysisResult.feedback.map((item, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <p className="text-gray-700">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Improvement Suggestions</h3>
            <div className="space-y-3">
              {analysisResult.improvements.map((item, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-gray-700">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Next Steps</h3>
            <div className="flex gap-3 justify-center">
              <button
                onClick={resetAnalysis}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Record Another Pitch
              </button>
              <button
                onClick={() => window.print()}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Save Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PitchPracticePage;
