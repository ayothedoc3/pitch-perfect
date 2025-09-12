import React, { useState } from 'react';
import Head from 'next/head';
import Navigation from '../components/ui/Navigation';

interface FeedbackItem {
  id: string;
  pitchId: string;
  pitchTitle: string;
  type: 'ai' | 'peer';
  author?: string;
  content: string;
  rating: number;
  categories: {
    clarity: number;
    confidence: number;
    structure: number;
    delivery: number;
    content: number;
  };
  date: string;
  isRead: boolean;
}

const sampleFeedback: FeedbackItem[] = [
  {
    id: '1',
    pitchId: '1',
    pitchTitle: 'My Startup Pitch v1',
    type: 'ai',
    content: 'Your pitch shows strong structure and clear value proposition. Consider slowing down your pace in the middle section to emphasize key points. Your confidence improved significantly compared to previous recordings.',
    rating: 4.2,
    categories: {
      clarity: 85,
      confidence: 68,
      structure: 90,
      delivery: 75,
      content: 82,
    },
    date: '2023-04-12T15:30:00Z',
    isRead: true,
  },
  {
    id: '2',
    pitchId: '1',
    pitchTitle: 'My Startup Pitch v1',
    type: 'peer',
    author: 'Sarah M.',
    content: 'Great job on explaining the problem clearly! I loved the personal story at the beginning. Maybe add more specific numbers about market size to strengthen your case.',
    rating: 4.5,
    categories: {
      clarity: 90,
      confidence: 75,
      structure: 85,
      delivery: 80,
      content: 88,
    },
    date: '2023-04-12T18:45:00Z',
    isRead: false,
  },
  {
    id: '3',
    pitchId: '2',
    pitchTitle: 'Elevator Pitch for Investors',
    type: 'ai',
    content: 'Excellent timing for an elevator pitch! Your energy and enthusiasm come through clearly. Work on reducing filler words (um, uh) which appeared 8 times in 58 seconds.',
    rating: 4.0,
    categories: {
      clarity: 75,
      confidence: 85,
      structure: 80,
      delivery: 70,
      content: 85,
    },
    date: '2023-04-08T10:20:00Z',
    isRead: true,
  },
  {
    id: '4',
    pitchId: '3',
    pitchTitle: 'Product Sales Pitch',
    type: 'peer',
    author: 'Mike R.',
    content: 'Your product demo was fantastic! Really helped me understand the value. The pricing section felt a bit rushed - maybe slow down there and give more time for the benefits to sink in.',
    rating: 4.3,
    categories: {
      clarity: 88,
      confidence: 82,
      structure: 85,
      delivery: 78,
      content: 90,
    },
    date: '2023-04-01T17:20:00Z',
    isRead: false,
  },
];

export default function FeedbackPage() {
  const [filter, setFilter] = useState('all');
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);

  const filteredFeedback = sampleFeedback.filter(feedback => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !feedback.isRead;
    return feedback.type === filter;
  });

  const unreadCount = sampleFeedback.filter(f => !f.isRead).length;

  const handleFeedbackClick = (feedback: FeedbackItem) => {
    setSelectedFeedback(feedback);
    // Mark as read
    feedback.isRead = true;
  };

  const getOverallRating = (categories: FeedbackItem['categories']) => {
    const values = Object.values(categories);
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <Head>
        <title>Feedback | PitchBuddy</title>
      </Head>
      
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Feedback</h1>
            {unreadCount > 0 && (
              <p className="text-blue-600 mt-1">{unreadCount} new feedback item{unreadCount !== 1 ? 's' : ''}</p>
            )}
          </div>
          <div className="flex gap-3">
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">All Feedback</option>
              <option value="unread">Unread</option>
              <option value="ai">AI Feedback</option>
              <option value="peer">Peer Feedback</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Feedback List */}
          <div className="lg:col-span-1 space-y-4">
            {filteredFeedback.map((feedback) => (
              <div 
                key={feedback.id}
                onClick={() => handleFeedbackClick(feedback)}
                className={`card cursor-pointer transition-all hover:shadow-lg ${
                  !feedback.isRead ? 'border-l-4 border-blue-500 bg-blue-50' : ''
                } ${selectedFeedback?.id === feedback.id ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {feedback.type === 'ai' ? (
                      <div className="h-6 w-6 rounded bg-green-100 flex items-center justify-center">
                        <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-600">
                        {feedback.author?.charAt(0) || 'P'}
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-900">
                      {feedback.type === 'ai' ? 'AI Analysis' : feedback.author}
                    </span>
                  </div>
                  {!feedback.isRead && (
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  )}
                </div>
                <p className="text-sm text-gray-600 font-medium mb-1">{feedback.pitchTitle}</p>
                <p className="text-sm text-gray-500 line-clamp-2">{feedback.content}</p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <svg 
                        key={i} 
                        className={`h-4 w-4 ${i < Math.floor(feedback.rating) ? 'text-yellow-400' : 'text-gray-300'}`} 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="text-sm text-gray-500 ml-1">{feedback.rating}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(feedback.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}

            {filteredFeedback.length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-gray-500">No feedback found for the selected filter.</p>
              </div>
            )}
          </div>

          {/* Feedback Detail */}
          <div className="lg:col-span-2">
            {selectedFeedback ? (
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    {selectedFeedback.type === 'ai' ? (
                      <div className="h-10 w-10 rounded bg-green-100 flex items-center justify-center">
                        <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-lg font-medium text-blue-600">
                        {selectedFeedback.author?.charAt(0) || 'P'}
                      </div>
                    )}
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {selectedFeedback.type === 'ai' ? 'AI Analysis' : selectedFeedback.author}
                      </h2>
                      <p className="text-gray-600">for &quot;{selectedFeedback.pitchTitle}&quot;</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <svg 
                          key={i} 
                          className={`h-5 w-5 ${i < Math.floor(selectedFeedback.rating) ? 'text-yellow-400' : 'text-gray-300'}`} 
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(selectedFeedback.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Feedback</h3>
                  <p className="text-gray-700 leading-relaxed">{selectedFeedback.content}</p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Detailed Scores</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(selectedFeedback.categories).map(([category, score]) => (
                      <div key={category} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 capitalize">{category}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${score}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 w-8">{score}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-medium text-gray-900">Overall Score</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-green-600 h-3 rounded-full" 
                            style={{ width: `${getOverallRating(selectedFeedback.categories)}%` }}
                          ></div>
                        </div>
                        <span className="text-base font-semibold text-gray-900">
                          {Math.round(getOverallRating(selectedFeedback.categories))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card text-center py-12">
                <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select feedback to view details</h3>
                <p className="text-gray-500">Choose a feedback item from the list to see detailed analysis and scores.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}