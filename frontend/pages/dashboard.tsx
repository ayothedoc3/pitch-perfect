import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Navigation from '../components/ui/Navigation';
import PitchCard from '../components/pitch/PitchCard';
import SkillRadarChart from '../components/visualization/SkillRadarChart';
import { usePitchStore } from '../stores/pitchStore';
import withAuth from '../components/auth/withAuth';

// No sample data - dashboard now shows only real user data


function Dashboard() {
  const router = useRouter();
  const getRecentPitches = usePitchStore((state) => state.getRecentPitches);
  const getUserStats = usePitchStore((state) => state.getUserStats);
  const [activeTab, setActiveTab] = useState('overview');

  // Get real data from store
  const recentPitches = getRecentPitches(3);
  const stats = getUserStats();
  const displayPitches = recentPitches;

  // Calculate skill data from recent pitches with analysis
  const pitchesWithAnalysis = displayPitches.filter(pitch => 'analysis' in pitch && pitch.analysis);
  const skillData = pitchesWithAnalysis.length > 0 && 'analysis' in pitchesWithAnalysis[0] && pitchesWithAnalysis[0].analysis
    ? (pitchesWithAnalysis[0] as { analysis: { skillBreakdown: Array<{ category: string; score: number; previousScore?: number }> } }).analysis.skillBreakdown 
    : [];

  const realSummaryStats = [
    { label: 'Pitches Recorded', value: stats.totalPitches || 0 },
    { label: 'Feedback Received', value: stats.totalFeedback || 0 },
    { label: 'Avg. Score', value: stats.averageScore > 0 ? Math.round(stats.averageScore) : 'N/A' },
    { label: 'Recent Activity', value: `${stats.recentActivity || 0} this week` },
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <Head>
        <title>Dashboard | PitchBuddy</title>
      </Head>
      
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <button 
            onClick={() => router.push('/pitches')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Record New Pitch
          </button>
        </div>
        
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {realSummaryStats.map((stat) => (
            <div key={stat.label} className="card bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <p className="text-3xl font-semibold text-gray-900 mt-1">{stat.value}</p>
            </div>
          ))}
        </div>
        
        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-4 border-b border-gray-200">
            {['Overview', 'Pitches', 'Progress', 'Feedback'].map((tab) => {
              const id = tab.toLowerCase();
              return (
                <button
                  key={id}
                  className={`py-2 px-1 font-medium text-sm border-b-2 ${
                    activeTab === id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab(id)}
                >
                  {tab}
                </button>
              );
            })}
          </nav>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Section */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">Recent Pitches</h2>
            
            {displayPitches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {displayPitches.map((pitch) => (
                  <PitchCard key={pitch.id} {...pitch} />
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="bg-white rounded-lg p-8 text-center border-2 border-dashed border-gray-200">
                <div className="max-w-md mx-auto">
                  <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v5a3 3 0 01-3 3H6a3 3 0 01-3-3V8a3 3 0 013-3h6a3 3 0 013 3v2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Welcome to PitchBuddy!</h3>
                  <p className="text-gray-600 mb-6">
                    Ready to improve your pitching skills? Start by recording your first pitch and get AI-powered feedback.
                  </p>
                  <div className="space-y-3">
                    <button 
                      onClick={() => router.push('/pitches')}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium"
                    >
                      ðŸŽ¥ Record Your First Pitch
                    </button>
                    <button 
                      onClick={() => router.push('/demo')}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium"
                    >
                      ðŸ“š Learn How It Works
                    </button>
                  </div>
                  <div className="mt-6 text-sm text-gray-500">
                    ðŸ’¡ <strong>Tip:</strong> Your first pitch doesn&apos;t need to be perfect - we&apos;re here to help you improve!
                  </div>
                </div>
              </div>
            )}
            
            <div className="card mt-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Upcoming Milestones</h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Record 5 different pitches</p>
                    <p className="text-sm text-gray-500">Progress: 3/5</p>
                  </div>
                  <div className="ml-auto">
                    <div className="w-24 bg-gray-200 rounded-full h-2.5">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Provide feedback to 10 peers</p>
                    <p className="text-sm text-gray-500">Progress: 6/10</p>
                  </div>
                  <div className="ml-auto">
                    <div className="w-24 bg-gray-200 rounded-full h-2.5">
                      <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {skillData.length > 0 ? (
              <SkillRadarChart metrics={skillData} title="Your Skill Progress" />
            ) : (
              /* Empty State for Skills */
              <div className="card">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Your Skill Progress</h3>
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">
                    Record your first pitch to see your skill breakdown and track improvement over time.
                  </p>
                </div>
              </div>
            )}
            
            <div className="card">
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                {displayPitches.length === 0 ? 'Getting Started' : 'Suggested Resources'}
              </h3>
              <div className="space-y-3">
                {displayPitches.length === 0 ? (
                  /* Getting Started Tips for New Users */
                  <>
                    <div className="flex items-center p-3 bg-blue-50 rounded-md">
                      <div className="h-8 w-8 rounded bg-blue-100 flex items-center justify-center text-blue-600">
                        <span className="text-lg">1ï¸âƒ£</span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">Record a practice pitch</p>
                        <p className="text-xs text-gray-500">2-3 minutes is perfect for your first try</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center p-3 bg-green-50 rounded-md">
                      <div className="h-8 w-8 rounded bg-green-100 flex items-center justify-center text-green-600">
                        <span className="text-lg">2ï¸âƒ£</span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">Get AI feedback</p>
                        <p className="text-xs text-gray-500">See detailed analysis of your delivery</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center p-3 bg-purple-50 rounded-md">
                      <div className="h-8 w-8 rounded bg-purple-100 flex items-center justify-center text-purple-600">
                        <span className="text-lg">3ï¸âƒ£</span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">Practice & improve</p>
                        <p className="text-xs text-gray-500">Apply suggestions and track progress</p>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Regular Resources for Active Users */
                  <>
                    <a href="#" className="flex items-center p-3 hover:bg-blue-50 rounded-md transition-colors">
                      <div className="h-8 w-8 rounded bg-blue-100 flex items-center justify-center text-blue-600">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">Improving Your Delivery Confidence</p>
                        <p className="text-xs text-gray-500">5 min read</p>
                      </div>
                    </a>
                    
                    <a href="#" className="flex items-center p-3 hover:bg-blue-50 rounded-md transition-colors">
                      <div className="h-8 w-8 rounded bg-green-100 flex items-center justify-center text-green-600">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">Structuring Your Startup Pitch</p>
                        <p className="text-xs text-gray-500">3 min video</p>
                      </div>
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default withAuth(Dashboard);
