import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Navigation from '../../components/ui/Navigation';
import SkillRadarChart from '../../components/visualization/SkillRadarChart';
import { usePitchStore, mapPitchDetailToStorePitch, Pitch } from '../../stores/pitchStore';
import { pitchesAPI } from '../../lib/api';

export default function PitchDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const getPitch = usePitchStore((state) => state.getPitch);
  const upsertPitch = usePitchStore((state) => state.upsertPitch);

  const [pitch, setPitch] = useState<Pitch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!id || typeof id !== 'string') {
      return;
    }

    const cachedPitch = getPitch(id);
    if (cachedPitch) {
      setPitch(cachedPitch);
      setIsLoading(false);
    }

    let cancelled = false;

    const fetchPitch = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await pitchesAPI.getById(id);
        const normalized = mapPitchDetailToStorePitch(response.pitch);
        if (!cancelled) {
          upsertPitch(normalized);
          setPitch(normalized);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to load pitch detail';
          setError(message);
          if (!cachedPitch) {
            setPitch(null);
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchPitch();

    return () => {
      cancelled = true;
    };
  }, [getPitch, id, upsertPitch]);

  const tabs = useMemo(() => ([
    { id: 'overview', name: 'Overview' },
    { id: 'analysis', name: 'AI Analysis' },
    { id: 'transcription', name: 'Transcription' },
    { id: 'feedback', name: 'Feedback' },
  ]), []);

  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!pitch) {
      setActiveTab('overview');
    }
  }, [pitch]);

  if (isLoading && !pitch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center text-blue-700">
          Loading pitch details...
        </div>
      </div>
    );
  }

  if (error && !pitch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Unable to load pitch</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/pitches')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Back to My Pitches
          </button>
        </div>
      </div>
    );
  }

  if (!pitch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Pitch Not Found</h1>
            <p className="text-gray-600">The requested pitch could not be found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <Head>
        <title>{pitch.title} | PitchBuddy</title>
      </Head>

      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.push('/pitches')}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to My Pitches
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{pitch.title}</h1>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <span>Recorded on {new Date(pitch.createdAt || pitch.dateRecorded || '').toLocaleDateString()}</span>
                <span>·</span>
                <span>{formatDuration(pitch.duration)}</span>
                <span>·</span>
                <span className="capitalize">{pitch.type} Pitch</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{pitch.analysis?.overallScore ?? 0}</div>
                <div className="text-sm text-gray-500">Overall Score</div>
              </div>
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10V9a3 3 0 013-3h0a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <p className="text-gray-600">Video playback coming soon</p>
                  <p className="text-sm text-gray-500 mt-1">Duration: {formatDuration(pitch.duration)}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="border-b border-gray-200 mb-6">
                <nav className="flex space-x-8">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab.name}
                    </button>
                  ))}
                </nav>
              </div>

              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white border border-gray-200 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Quick Stats</h3>
                      <div className="space-y-2 text-gray-700">
                        <p><strong>Status:</strong> {pitch.status}</p>
                        <p><strong>Progress:</strong> {pitch.progress}%</p>
                        <p><strong>Recorded:</strong> {new Date(pitch.createdAt || pitch.dateRecorded || '').toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="p-4 bg-white border border-gray-200 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Performance</h3>
                      <div className="space-y-2 text-gray-700">
                        <p><strong>Overall Score:</strong> {pitch.analysis?.overallScore ?? 'N/A'}</p>
                        <p><strong>Clarity:</strong> {pitch.analysis?.metrics?.clarity ? Math.round(pitch.analysis.metrics.clarity * 100) : 0}%</p>
                        <p><strong>Confidence:</strong> {pitch.analysis?.metrics?.confidence ? Math.round(pitch.analysis.metrics.confidence * 100) : 0}%</p>
                      </div>
                    </div>
                  </div>

                  {pitch.analysis && pitch.analysis.skillBreakdown.length > 0 && (
                    <div className="p-4 bg-white border border-gray-200 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-500 mb-4">Skill Breakdown</h3>
                      <SkillRadarChart metrics={pitch.analysis.skillBreakdown} />
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'analysis' && pitch.analysis && (
                <div className="space-y-4 text-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">Pacing</h4>
                      <p>{Math.round((pitch.analysis?.metrics?.pacing ?? 0))} words per minute</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-semibold text-purple-900 mb-2">Tone Variation</h4>
                      <p>{Math.round(((pitch.analysis?.metrics?.toneVariation ?? 0) * 100))}%</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2">Clarity</h4>
                      <p>{Math.round(((pitch.analysis?.metrics?.clarity ?? 0) * 100))}%</p>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <h4 className="font-semibold text-yellow-900 mb-2">Filler Words</h4>
                      <p>{Math.round(((pitch.analysis?.metrics?.fillerWordFrequency ?? 0) * 100))}%</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">Feedback Highlights</h4>
                    <ul className="space-y-3">
                      {(pitch.analysis?.feedback ?? []).map((item, index) => (
                        <li key={index} className="border-l-4 border-blue-500 pl-4 text-gray-700">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">Suggested Improvements</h4>
                    <ul className="space-y-3">
                      {(pitch.analysis?.improvements ?? []).map((item, index) => (
                        <li key={index} className="border-l-4 border-green-500 pl-4 text-gray-700">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'transcription' && pitch.transcription && (
                <div className="space-y-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Full Transcript</h3>
                    <p className="text-gray-800 leading-relaxed">
                      {pitch.transcription.text}
                    </p>
                  </div>

                  {pitch.transcription.keyPhrases.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Key Phrases</h3>
                      <div className="flex flex-wrap gap-2">
                        {pitch.transcription.keyPhrases.map((phrase, index) => (
                          <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            {phrase}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'feedback' && pitch.analysis && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">AI Feedback</h3>
                    <ul className="space-y-4">
                      {(pitch.analysis?.feedback ?? []).map((feedback, index) => (
                        <li key={index} className="border-l-4 border-blue-500 pl-4 py-2 text-gray-700">
                          {feedback}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/practice')}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Practice Again
                </button>
                {pitch.videoUrl && (
                  <a
                    href={pitch.videoUrl}
                    className="block w-full border border-gray-300 hover:bg-gray-50 py-2 px-4 rounded-lg text-center"
                  >
                    Download Video
                  </a>
                )}
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Practice Suggestions</h3>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900">Pacing Exercise</h4>
                  <p className="text-blue-700 mt-1">Practice speaking at 140-160 WPM using our built-in metronome tool.</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900">Confidence Building</h4>
                  <p className="text-green-700 mt-1">Record yourself practicing just the middle section to build confidence.</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-900">Structure Workshop</h4>
                  <p className="text-purple-700 mt-1">Your structure is strong! Consider our advanced storytelling course.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
