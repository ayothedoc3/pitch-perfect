import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { usePitchStore, mapPitchDetailToStorePitch } from '../../../stores/pitchStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { pitchesAPI } from '../../../lib/api';

const steps = [
  { number: 1, title: 'Speech Analysis', description: 'Analyzing your speech patterns, pacing, and clarity' },
  { number: 2, title: 'Transcription', description: 'Converting your speech to text and identifying key phrases' },
  { number: 3, title: 'Delivery Assessment', description: 'Evaluating confidence, tone variation, and body language' },
  { number: 4, title: 'Feedback Generation', description: 'Creating personalized suggestions and improvements' },
  { number: 5, title: 'Report Compilation', description: 'Finalizing your comprehensive pitch analysis' },
];

const statusMessages: Record<string, string> = {
  recorded: 'Waiting for analysis to begin...',
  analyzing: 'Analyzing your pitch...',
  completed: 'Analysis complete! Preparing your report...',
  failed: 'Analysis failed. Please try recording again.',
};

const deriveStepFromProgress = (status: string, progress: number): number => {
  if (status === 'completed') {
    return steps.length;
  }

  if (status === 'failed') {
    return 1;
  }

  const safeProgress = Math.max(0, Math.min(progress, 100));

  if (safeProgress >= 80) return 5;
  if (safeProgress >= 60) return 4;
  if (safeProgress >= 40) return 3;
  if (safeProgress >= 20) return 2;
  return 1;
};

const ProcessingPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const pitches = usePitchStore((state) => state.pitches);
  const upsertPitch = usePitchStore((state) => state.upsertPitch);

  const pitch = useMemo(() => {
    if (!id || typeof id !== 'string') {
      return undefined;
    }
    return pitches.find((item) => item.id === id);
  }, [id, pitches]);

  const [processingStep, setProcessingStep] = useState(() => deriveStepFromProgress(pitch?.status ?? 'recorded', pitch?.progress ?? 0));
  const [progress, setProgress] = useState(pitch?.progress ?? 0);
  const [statusMessage, setStatusMessage] = useState<string>(
    statusMessages[pitch?.status ?? 'recorded'] ?? 'Preparing analysis...'
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || typeof id !== 'string') {
      return;
    }

    if (pitch) {
      return;
    }

    let cancelled = false;

    const loadPitch = async () => {
      try {
        const response = await pitchesAPI.getById(id);
        if (!cancelled) {
          upsertPitch(mapPitchDetailToStorePitch(response.pitch));
        }
      } catch (loadError) {
        if (!cancelled) {
          console.warn('Unable to fetch pitch detail', loadError);
        }
      }
    };

    loadPitch();

    return () => {
      cancelled = true;
    };
  }, [id, pitch, upsertPitch]);

  useEffect(() => {
    if (!id || typeof id !== 'string') {
      return;
    }

    let cancelled = false;
    let pollTimer: NodeJS.Timeout | null = null;

    const pollStatus = async () => {
      try {
        const statusResponse = await pitchesAPI.getStatus(id);
        if (cancelled) {
          return;
        }

        const { status, progress: statusProgress = 0, hasAnalysis } = statusResponse;
        const nextProgress = Math.max(0, Math.min(statusProgress, 100));

        setProgress(nextProgress);
        setStatusMessage(statusMessages[status] ?? 'Analyzing your pitch...');
        setProcessingStep(deriveStepFromProgress(status, nextProgress));

        if (status === 'failed') {
          setError('Analysis failed. Please record again or contact support if the issue persists.');
          return;
        }

        if (status === 'completed' && hasAnalysis) {
          const detail = await pitchesAPI.getById(id);
          if (!cancelled) {
            upsertPitch(mapPitchDetailToStorePitch(detail.pitch));
            router.replace(`/pitch/${id}`);
          }
          return;
        }

        pollTimer = setTimeout(pollStatus, 4000);
      } catch {
        if (cancelled) {
          return;
        }

        setError('Having trouble checking the analysis status. Retrying...');
        pollTimer = setTimeout(pollStatus, 6000);
      }
    };

    pollStatus();

    return () => {
      cancelled = true;
      if (pollTimer) {
        clearTimeout(pollTimer);
      }
    };
  }, [id, router, upsertPitch]);

  if (!pitch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-gray-600 mb-4">We&apos;re getting things ready...</p>
            <Button asChild>
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressPercentage = progress > 0 ? progress : Math.round(((processingStep - 1) / steps.length) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <Head>
        <title>Analyzing Your Pitch | PitchBuddy</title>
      </Head>
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Analyzing Your Pitch
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            We&apos;re processing &quot;{pitch.title}&quot;
          </p>
          <p className="text-gray-500">{statusMessage}</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
            {error}
          </div>
        )}
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-center">Analysis Progress</CardTitle>
            <CardDescription className="text-center">
              Step {processingStep} of {steps.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {steps.map((step) => {
                const isActive = processingStep === step.number;
                const isCompleted = processingStep > step.number;

                return (
                  <div
                    key={step.number}
                    className={`flex items-start rounded-lg border p-4 transition-colors ${
                      isCompleted
                        ? 'border-green-200 bg-green-50'
                        : isActive
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className={`mr-4 flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isActive
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {isCompleted ? (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        step.number
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{step.title}</h3>
                      <p className="text-sm text-gray-600">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-8">
              <div className="bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500" 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <div className="text-center mt-2 text-sm text-gray-600">
                {progressPercentage}% Complete
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>What You&apos;ll Get</CardTitle>
            <CardDescription>Here&apos;s what our AI analysis will provide</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Overall Score</h4>
                  <p className="text-sm text-gray-600">Comprehensive rating of your pitch performance</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h4a1 1 0 011 1v2m-6 0h8m-8 0a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2m-1 4H8m0 0v8m0-8h8m-8 8h8" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Detailed Metrics</h4>
                  <p className="text-sm text-gray-600">Pacing, clarity, confidence, and delivery analysis</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">AI Feedback</h4>
                  <p className="text-sm text-gray-600">Personalized suggestions for improvement</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Transcription</h4>
                  <p className="text-sm text-gray-600">Full text with highlighted key phrases</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500 mb-4">
            Taking too long? You can view your recording now and check analysis once it&apos;s ready.
          </p>
          <Button variant="outline" asChild>
            <Link href={`/pitch/${id}`}>
              View Recording Now
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
};

export default ProcessingPage;
