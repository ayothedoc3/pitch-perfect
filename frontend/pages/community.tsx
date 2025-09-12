import React, { useState } from 'react';
import Head from 'next/head';
import Navigation from '../components/ui/Navigation';

interface CommunityPost {
  id: string;
  author: {
    name: string;
    avatar: string;
    level: string;
  };
  title: string;
  content: string;
  category: 'showcase' | 'question' | 'tip' | 'feedback-request';
  pitchLink?: string;
  likes: number;
  comments: number;
  date: string;
  tags: string[];
}

const samplePosts: CommunityPost[] = [
  {
    id: '1',
    author: {
      name: 'Alex Chen',
      avatar: 'AC',
      level: 'Advanced',
    },
    title: 'Just landed my first investor meeting!',
    content: 'After practicing on PitchBuddy for 3 months, I finally got a yes from a seed investor. The AI feedback really helped me nail my delivery timing. Special thanks to everyone who gave peer feedback on my earlier versions!',
    category: 'showcase',
    pitchLink: '/pitch/showcase-1',
    likes: 47,
    comments: 12,
    date: '2023-04-10T14:30:00Z',
    tags: ['success-story', 'startup', 'investor'],
  },
  {
    id: '2',
    author: {
      name: 'Sarah Williams',
      avatar: 'SW',
      level: 'Intermediate',
    },
    title: 'How do you handle tough questions during Q&A?',
    content: 'I&apos;ve been practicing my pitch and feel confident about the main presentation, but I always struggle when investors ask unexpected questions. Any tips for staying composed and giving good answers on the spot?',
    category: 'question',
    likes: 23,
    comments: 18,
    date: '2023-04-09T10:15:00Z',
    tags: ['qa', 'nerves', 'tips'],
  },
  {
    id: '3',
    author: {
      name: 'Marcus Johnson',
      avatar: 'MJ',
      level: 'Expert',
    },
    title: 'Pro tip: Use the 3-second pause rule',
    content: 'Here&apos;s something that changed my pitching game: After making a key point, pause for 3 full seconds. It feels awkward at first, but it gives your audience time to absorb the information and makes you appear more confident and in control.',
    category: 'tip',
    likes: 89,
    comments: 25,
    date: '2023-04-08T16:45:00Z',
    tags: ['delivery', 'confidence', 'technique'],
  },
  {
    id: '4',
    author: {
      name: 'Emma Rodriguez',
      avatar: 'ER',
      level: 'Beginner',
    },
    title: 'First pitch attempt - please be kind!',
    content: 'This is my very first recorded pitch for my sustainable fashion startup. I know it needs work, especially my pacing and maybe the structure. Would love constructive feedback from the community!',
    category: 'feedback-request',
    pitchLink: '/pitch/community-4',
    likes: 15,
    comments: 8,
    date: '2023-04-07T09:20:00Z',
    tags: ['beginner', 'fashion', 'sustainability'],
  },
  {
    id: '5',
    author: {
      name: 'David Park',
      avatar: 'DP',
      level: 'Intermediate',
    },
    title: 'Dealing with pitch anxiety - what works for you?',
    content: 'I get really nervous before presenting, even in practice. My hands shake, voice gets shaky, and I forget my key points. Has anyone overcome similar issues? Looking for practical techniques that actually work.',
    category: 'question',
    likes: 34,
    comments: 22,
    date: '2023-04-06T13:10:00Z',
    tags: ['anxiety', 'nerves', 'mental-health'],
  },
];

const categoryColors = {
  showcase: 'bg-green-100 text-green-800',
  question: 'bg-blue-100 text-blue-800',
  tip: 'bg-purple-100 text-purple-800',
  'feedback-request': 'bg-orange-100 text-orange-800',
};

const categoryIcons = {
  showcase: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  ),
  question: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  tip: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  'feedback-request': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
};

export default function CommunityPage() {
  const [filter, setFilter] = useState('all');
  const [showNewPost, setShowNewPost] = useState(false);

  const filteredPosts = samplePosts.filter(post => {
    if (filter === 'all') return true;
    return post.category === filter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <Head>
        <title>Community | PitchBuddy</title>
      </Head>
      
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Community</h1>
            <p className="text-gray-600 mt-1">Share your progress, ask questions, and learn from fellow pitchers</p>
          </div>
          <button 
            onClick={() => setShowNewPost(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>New Post</span>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === 'all' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Posts
            </button>
            <button
              onClick={() => setFilter('showcase')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center space-x-1 ${
                filter === 'showcase' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {categoryIcons.showcase}
              <span>Showcases</span>
            </button>
            <button
              onClick={() => setFilter('question')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center space-x-1 ${
                filter === 'question' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {categoryIcons.question}
              <span>Questions</span>
            </button>
            <button
              onClick={() => setFilter('tip')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center space-x-1 ${
                filter === 'tip' 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {categoryIcons.tip}
              <span>Tips</span>
            </button>
            <button
              onClick={() => setFilter('feedback-request')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center space-x-1 ${
                filter === 'feedback-request' 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {categoryIcons['feedback-request']}
              <span>Feedback Requests</span>
            </button>
          </div>
        </div>

        {/* Posts */}
        <div className="space-y-6">
          {filteredPosts.map((post) => (
            <div key={post.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                  {post.author.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{post.author.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      post.author.level === 'Expert' ? 'bg-gold-100 text-gold-800' :
                      post.author.level === 'Advanced' ? 'bg-purple-100 text-purple-800' :
                      post.author.level === 'Intermediate' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {post.author.level}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full flex items-center space-x-1 ${categoryColors[post.category]}`}>
                      {categoryIcons[post.category]}
                      <span className="capitalize">{post.category.replace('-', ' ')}</span>
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-3">{post.title}</h2>
                  <p className="text-gray-700 mb-4 leading-relaxed">{post.content}</p>
                  
                  {post.pitchLink && (
                    <div className="mb-4">
                      <a 
                        href={post.pitchLink}
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v5a3 3 0 01-3 3H6a3 3 0 01-3-3V8a3 3 0 013-3h6a3 3 0 013 3v2z" />
                        </svg>
                        Watch Pitch
                      </a>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <button className="flex items-center space-x-1 hover:text-red-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span>{post.likes}</span>
                      </button>
                      <button className="flex items-center space-x-1 hover:text-blue-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>{post.comments} comments</span>
                      </button>
                    </div>
                    <span>{new Date(post.date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* New Post Modal (Placeholder) */}
        {showNewPost && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Create New Post</h3>
                <button 
                  onClick={() => setShowNewPost(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 mb-4">
                New post creation will be available in the next update. For now, enjoy reading and engaging with existing community posts!
              </p>
              <button 
                onClick={() => setShowNewPost(false)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}