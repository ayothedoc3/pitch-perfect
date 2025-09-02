import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Navigation from '../components/ui/Navigation';
import PitchCard from '../components/pitch/PitchCard';
import PitchRecorder from '../components/pitch/PitchRecorder';
import { usePitchStore } from '../stores/pitchStore';

// Enhanced sample data with more pitches
const samplePitches = [
  {
    id: '1',
    title: 'My Startup Pitch v1',
    type: 'startup' as const,
    duration: 182,
    feedbackCount: 5,
    dateRecorded: '2023-04-12T14:30:00Z',
    progress: 75,
  },
  {
    id: '2',
    title: 'Elevator Pitch for Investors',
    type: 'elevator' as const,
    duration: 58,
    feedbackCount: 3,
    dateRecorded: '2023-04-08T10:15:00Z',
    progress: 40,
  },
  {
    id: '3',
    title: 'Product Sales Pitch',
    type: 'sales' as const,
    duration: 245,
    feedbackCount: 2,
    dateRecorded: '2023-04-01T16:45:00Z',
    progress: 90,
  },
  {
    id: '4',
    title: 'Team Meeting Presentation',
    type: 'startup' as const,
    duration: 420,
    feedbackCount: 8,
    dateRecorded: '2023-03-25T09:20:00Z',
    progress: 85,
  },
  {
    id: '5',
    title: 'Client Proposal Pitch',
    type: 'sales' as const,
    duration: 180,
    feedbackCount: 4,
    dateRecorded: '2023-03-18T15:10:00Z',
    progress: 65,
  },
];

export default function PitchesPage() {
  const router = useRouter();
  const { pitches } = usePitchStore();
  const [showRecorder, setShowRecorder] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [pitchTitle, setPitchTitle] = useState('');
  const [pitchType, setPitchType] = useState<'startup' | 'elevator' | 'sales'>('startup');

  const handleRecordingComplete = (pitchId: string) => {
    setShowRecorder(false);
    // Navigate to the pitch detail page
    router.push(`/pitch/${pitchId}`);
  };

  // Use real pitches from store, fallback to sample data if empty
  const allPitches = pitches.length > 0 ? pitches : samplePitches;
  
  const filteredPitches = allPitches.filter(pitch => {
    if (filter === 'all') return true;
    return pitch.type === filter;
  });

  const sortedPitches = [...filteredPitches].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.dateRecorded).getTime() - new Date(a.dateRecorded).getTime();
      case 'duration':
        return b.duration - a.duration;
      case 'feedback':
        return b.feedbackCount - a.feedbackCount;
      default:
        return 0;
    }
  });

  if (showRecorder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
        <Head>
          <title>Record Pitch | Pitch Perfect</title>
        </Head>
        <Navigation />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Record New Pitch</h1>
            <button 
              onClick={() => setShowRecorder(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Pitch Setup Form */}
          <div className="card mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Pitch Setup</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pitch Title
                </label>
                <input
                  type="text"
                  value={pitchTitle}
                  onChange={(e) => setPitchTitle(e.target.value)}
                  placeholder="Enter your pitch title..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pitch Type
                </label>
                <select
                  value={pitchType}
                  onChange={(e) => setPitchType(e.target.value as 'startup' | 'elevator' | 'sales')}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="startup">Startup Pitch</option>
                  <option value="elevator">Elevator Pitch</option>
                  <option value="sales">Sales Pitch</option>
                </select>
              </div>
            </div>
          </div>

          <PitchRecorder 
            onRecordingComplete={handleRecordingComplete}
            pitchTitle={pitchTitle || 'New Pitch'}
            pitchType={pitchType}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <Head>
        <title>My Pitches | Pitch Perfect</title>
      </Head>
      
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Pitches</h1>
          <button 
            onClick={() => setShowRecorder(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Record New Pitch</span>
          </button>
        </div>

        {/* Filters and Sorting */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="flex gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Type</label>
                <select 
                  value={filter} 
                  onChange={(e) => setFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="all">All Types</option>
                  <option value="startup">Startup</option>
                  <option value="elevator">Elevator</option>
                  <option value="sales">Sales</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="date">Date Recorded</option>
                  <option value="duration">Duration</option>
                  <option value="feedback">Feedback Count</option>
                </select>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {sortedPitches.length} pitch{sortedPitches.length !== 1 ? 'es' : ''} found
            </div>
          </div>
        </div>

        {/* Pitches Grid */}
        {sortedPitches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedPitches.map((pitch) => (
              <PitchCard key={pitch.id} {...pitch} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v5a3 3 0 01-3 3H6a3 3 0 01-3-3V8a3 3 0 013-3h6a3 3 0 013 3v2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No pitches found</h3>
              <p className="text-gray-500 mb-6">
                {filter === 'all' 
                  ? "You haven't recorded any pitches yet. Get started by recording your first pitch!" 
                  : `No ${filter} pitches found. Try changing your filter or record a new pitch.`
                }
              </p>
              <button 
                onClick={() => setShowRecorder(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg"
              >
                Record Your First Pitch
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}