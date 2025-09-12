import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Navigation from '../../components/ui/Navigation';
import SkillRadarChart from '../../components/visualization/SkillRadarChart';
import { usePitchStore } from '../../stores/pitchStore';

// No mock data - pitch detail page now requires real data

export default function PitchDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { getPitch } = usePitchStore();
  const [activeTab, setActiveTab] = useState('overview');

  // Get pitch data from store only - no fallback
  const pitch = id ? getPitch(id as string) : null;
  
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

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'analysis', name: 'AI Analysis' },
    { id: 'transcription', name: 'Transcription' },
    { id: 'feedback', name: 'Feedback' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <Head>
        <title>{pitch.title} | Pitch Perfect</title>
      </Head>
      
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
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
                <span>Recorded on {new Date(pitch.dateRecorded).toLocaleDateString()}</span>
                <span>•</span>
                <span>{formatDuration(pitch.duration)}</span>
                <span>•</span>
                <span className="capitalize">{pitch.type} Pitch</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{pitch.analysis?.overallScore || 0}</div>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <div className="card">
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10V9a3 3 0 013-3h0a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <p className="text-gray-600">Video player would be implemented here</p>
                  <p className="text-sm text-gray-500 mt-1">Duration: {formatDuration(pitch.duration)}</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="card">
              <div className="border-b border-gray-200 mb-6">
                <nav className="flex space-x-8">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
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

              {/* Tab Content */}
              <div>
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Stats</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{pitch.analysis?.metrics.pacing || 0}</div>
                          <div className="text-sm text-gray-600">WPM</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{Math.round((pitch.analysis?.metrics.clarity || 0) * 100)}%</div>
                          <div className="text-sm text-gray-600">Clarity</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">{Math.round((pitch.analysis?.metrics.confidence || 0) * 100)}%</div>
                          <div className="text-sm text-gray-600">Confidence</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">{Math.round((pitch.analysis?.metrics.fillerWordFrequency || 0) * 100)}%</div>
                          <div className="text-sm text-gray-600">Filler Words</div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Takeaways</h3>
                      <ul className="space-y-2">
                        {(pitch.analysis?.feedback || []).slice(0, 3).map((item, index) => (
                          <li key={index} className="flex items-start">
                            <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {activeTab === 'analysis' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Analysis</h3>
                      <div className="bg-gray-50 rounded-lg p-6">
                        <SkillRadarChart 
                          metrics={pitch.analysis?.skillBreakdown || []} 
                          title="Your Performance Breakdown"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Areas for Improvement</h3>
                      <ul className="space-y-3">
                        {(pitch.analysis?.improvements || []).map((improvement, index) => (
                          <li key={index} className="flex items-start">
                            <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-gray-700">{improvement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {activeTab === 'transcription' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Full Transcription</h3>
                      <div className="bg-gray-50 rounded-lg p-6">
                        <p className="text-gray-700 leading-relaxed">{pitch.transcription?.text || 'Transcription not available'}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Phrases</h3>
                      <div className="flex flex-wrap gap-2">
                        {(pitch.transcription?.keyPhrases || []).map((phrase, index) => (
                          <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            {phrase}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'feedback' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">AI Feedback</h3>
                      <ul className="space-y-4">
                        {(pitch.analysis?.feedback || []).map((feedback, index) => (
                          <li key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                            <p className="text-gray-700">{feedback}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Request Peer Feedback</h3>
                      <p className="text-gray-600 mb-4">
                        Get additional insights from the Pitch Perfect community. Share your pitch (anonymously if you prefer) 
                        to receive constructive feedback from other entrepreneurs.
                      </p>
                      <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg">
                        Share with Community
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                <button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Video
                </button>
                <button className="w-full border border-gray-300 hover:bg-gray-50 py-2 px-4 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  Share Pitch
                </button>
                <button className="w-full border border-gray-300 hover:bg-gray-50 py-2 px-4 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Re-record
                </button>
              </div>
            </div>

            {/* Practice Suggestions */}
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