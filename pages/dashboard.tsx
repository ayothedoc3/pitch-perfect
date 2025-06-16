import { useState } from 'react';
import Head from 'next/head';
import Navigation from '../components/ui/Navigation';
import PitchCard from '../components/pitch/PitchCard';
import SkillRadarChart from '../components/visualization/SkillRadarChart';

// Sample data for demonstration
const samplePitches = [
  {
    id: '1',
    title: 'My Startup Pitch v1',
    type: 'startup' as const,
    duration: 182, // 3:02
    feedbackCount: 5,
    dateRecorded: '2023-04-12T14:30:00Z',
    progress: 75,
  },
  {
    id: '2',
    title: 'Elevator Pitch for Investors',
    type: 'elevator' as const,
    duration: 58, // 0:58
    feedbackCount: 3,
    dateRecorded: '2023-04-08T10:15:00Z',
    progress: 40,
  },
  {
    id: '3',
    title: 'Product Sales Pitch',
    type: 'sales' as const,
    duration: 245, // 4:05
    feedbackCount: 2,
    dateRecorded: '2023-04-01T16:45:00Z',
    progress: 90,
  },
];

const sampleSkillData = [
  { category: 'Clarity', score: 85, previousScore: 72 },
  { category: 'Confidence', score: 68, previousScore: 55 },
  { category: 'Structure', score: 90, previousScore: 88 },
  { category: 'Delivery', score: 75, previousScore: 60 },
  { category: 'Content', score: 82, previousScore: 75 },
];

const summaryStats = [
  { label: 'Pitches Recorded', value: 3 },
  { label: 'Feedback Received', value: 10 },
  { label: 'Avg. Improvement', value: '18%' },
  { label: 'Streak', value: '3 days' },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <Head>
        <title>Dashboard | Pitch Perfect</title>
      </Head>
      
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
<button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">Record New Pitch</button>
        </div>
        
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {summaryStats.map((stat) => (
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {samplePitches.map((pitch) => (
                <PitchCard key={pitch.id} {...pitch} />
              ))}
            </div>
            
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
            <SkillRadarChart metrics={sampleSkillData} title="Your Skill Progress" />
            
            <div className="card">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Suggested Resources</h3>
              <div className="space-y-3">
                <a href="#" className="flex items-center p-3 hover:bg-blue-50 rounded-md transition-colors">
                  <div className="h-8 w-8 rounded bg-blue-100 flex items-center justify-center text-blue-600">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Structuring Your Startup Pitch</p>
                    <p className="text-xs text-gray-500">3 min video</p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
