import React, { useState } from 'react';
import Head from 'next/head';
import Navigation from '../components/ui/Navigation';

interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'article' | 'video' | 'template' | 'guide' | 'checklist';
  category: 'fundamentals' | 'advanced' | 'industry-specific' | 'tools' | 'mindset';
  duration?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  author: string;
  rating: number;
  url?: string;
  isDownloadable?: boolean;
}

const sampleResources: Resource[] = [
  {
    id: '1',
    title: 'The Perfect Pitch Structure: A Complete Guide',
    description: 'Learn the proven 10-slide framework used by successful startups to raise millions. Includes real examples and common mistakes to avoid.',
    type: 'guide',
    category: 'fundamentals',
    duration: '15 min read',
    difficulty: 'beginner',
    author: 'PitchBuddy Team',
    rating: 4.8,
    url: '#',
  },
  {
    id: '2',
    title: 'Overcoming Pitch Anxiety: Mental Strategies That Work',
    description: 'Practical techniques from sports psychology and public speaking experts to help you stay calm and confident during high-stakes presentations.',
    type: 'article',
    category: 'mindset',
    duration: '8 min read',
    difficulty: 'beginner',
    author: 'Dr. Sarah Chen',
    rating: 4.9,
    url: '#',
  },
  {
    id: '3',
    title: 'Investor Pitch Deck Template',
    description: 'Professional PowerPoint template with all essential slides, including notes and tips for each section. Used by 500+ funded startups.',
    type: 'template',
    category: 'tools',
    difficulty: 'intermediate',
    author: 'PitchBuddy Team',
    rating: 4.7,
    url: '#',
    isDownloadable: true,
  },
  {
    id: '4',
    title: 'Body Language Secrets for Powerful Presentations',
    description: 'Master the non-verbal aspects of pitching. Learn how posture, gestures, and eye contact can make or break your presentation.',
    type: 'video',
    category: 'advanced',
    duration: '22 min',
    difficulty: 'intermediate',
    author: 'Marcus Johnson',
    rating: 4.6,
    url: '#',
  },
  {
    id: '5',
    title: 'SaaS Pitch Playbook: Industry-Specific Strategies',
    description: 'Tailored advice for SaaS founders, including metrics that matter, competitive positioning, and technical demo best practices.',
    type: 'guide',
    category: 'industry-specific',
    duration: '25 min read',
    difficulty: 'advanced',
    author: 'Alex Rodriguez',
    rating: 4.8,
    url: '#',
  },
  {
    id: '6',
    title: 'Pre-Pitch Checklist: Never Forget the Essentials',
    description: 'Complete checklist covering everything from technical setup to backup plans. Print-friendly version available.',
    type: 'checklist',
    category: 'tools',
    difficulty: 'beginner',
    author: 'PitchBuddy Team',
    rating: 4.5,
    url: '#',
    isDownloadable: true,
  },
  {
    id: '7',
    title: 'Financial Projections That Investors Actually Believe',
    description: 'Stop making unrealistic forecasts. Learn how to create credible financial models that support your funding request.',
    type: 'article',
    category: 'advanced',
    duration: '12 min read',
    difficulty: 'advanced',
    author: 'Emma Thompson',
    rating: 4.7,
    url: '#',
  },
  {
    id: '8',
    title: 'Storytelling in Business Pitches',
    description: 'Transform dry facts into compelling narratives. Learn the hero&apos;s journey framework adapted for business presentations.',
    type: 'video',
    category: 'advanced',
    duration: '18 min',
    difficulty: 'intermediate',
    author: 'David Park',
    rating: 4.9,
    url: '#',
  },
];

const typeIcons = {
  article: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  video: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10V9a3 3 0 013-3h0a3 3 0 013 3v1" />
    </svg>
  ),
  template: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  guide: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  checklist: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
};

const difficultyColors = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-red-100 text-red-800',
};

export default function ResourcesPage() {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');

  const filteredResources = sampleResources.filter(resource => {
    if (categoryFilter !== 'all' && resource.category !== categoryFilter) return false;
    if (typeFilter !== 'all' && resource.type !== typeFilter) return false;
    if (difficultyFilter !== 'all' && resource.difficulty !== difficultyFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <Head>
        <title>Resources | PitchBuddy</title>
      </Head>
      
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Learning Resources</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive guides, templates, and tools to help you master the art of pitching. 
            From beginner fundamentals to advanced techniques.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="all">All Categories</option>
                <option value="fundamentals">Fundamentals</option>
                <option value="advanced">Advanced Techniques</option>
                <option value="industry-specific">Industry Specific</option>
                <option value="tools">Tools & Templates</option>
                <option value="mindset">Mindset & Psychology</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select 
                value={typeFilter} 
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="all">All Types</option>
                <option value="article">Articles</option>
                <option value="video">Videos</option>
                <option value="guide">Guides</option>
                <option value="template">Templates</option>
                <option value="checklist">Checklists</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
              <select 
                value={difficultyFilter} 
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            {filteredResources.length} resource{filteredResources.length !== 1 ? 's' : ''} found
          </div>
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource) => (
            <div key={resource.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    {typeIcons[resource.type]}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900 capitalize">{resource.type}</span>
                    {resource.duration && (
                      <p className="text-xs text-gray-500">{resource.duration}</p>
                    )}
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${difficultyColors[resource.difficulty]}`}>
                  {resource.difficulty}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                {resource.title}
              </h3>
              <p className="text-gray-600 mb-4 text-sm line-clamp-3">
                {resource.description}
              </p>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <svg 
                      key={i} 
                      className={`h-4 w-4 ${i < Math.floor(resource.rating) ? 'text-yellow-400' : 'text-gray-300'}`} 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="text-sm text-gray-500 ml-1">{resource.rating}</span>
                </div>
                <span className="text-xs text-gray-500 capitalize">{resource.category.replace('-', ' ')}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">by {resource.author}</span>
                <div className="flex space-x-2">
                  {resource.isDownloadable && (
                    <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-4-4m4 4l4-4m3-5a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  )}
                  <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                  <a 
                    href={resource.url}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                  >
                    {resource.type === 'video' ? 'Watch' : 
                     resource.isDownloadable ? 'Download' : 'Read'}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredResources.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
            <p className="text-gray-500">Try adjusting your filters to find relevant learning materials.</p>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Need Something Specific?</h2>
            <p className="text-gray-600 mb-6">
              Can&apos;t find the resource you&apos;re looking for? Our team is constantly adding new content based on community feedback.
            </p>
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium">
              Request a Resource
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}