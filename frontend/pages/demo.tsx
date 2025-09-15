import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Navigation from '../components/ui/Navigation';
import SkillRadarChart from '../components/visualization/SkillRadarChart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Demo data to show what the app can do
const demoAnalysis = {
  overallScore: 78,
  metrics: {
    pacing: 85,
    clarity: 72,
    fillerWordFrequency: 15,
    toneVariation: 68,
    confidence: 82
  },
  skillBreakdown: [
    { category: 'Delivery', score: 85, previousScore: 78 },
    { category: 'Clarity', score: 72, previousScore: 68 },
    { category: 'Confidence', score: 82, previousScore: 75 },
    { category: 'Structure', score: 90, previousScore: 85 },
    { category: 'Engagement', score: 76, previousScore: 70 }
  ],
  transcription: {
    text: "Hello everyone, I&apos;m excited to present our innovative startup solution that revolutionizes the market. We&apos;ve identified a key problem in the industry and developed a scalable technology platform to address it. Our revenue model projects 2 million in funding for the first year with 150% growth rate.",
    keyPhrases: ['innovative startup solution', 'scalable technology platform', '2 million in funding', '150% growth rate']
  },
  feedback: [
    "Great opening hook! Your enthusiasm comes through clearly.",
    "Consider slowing down slightly during the technical explanation.",
    "Strong financial projections - make sure to back them up with data."
  ],
  improvements: [
    "Practice your conclusion to end with more impact",
    "Reduce filler words like &apos;um&apos; and &apos;uh&apos;",
    "Use more varied vocal tones to maintain engagement"
  ]
};

const DemoPage: React.FC = () => {
  const [currentView, setCurrentView] = useState<'overview' | 'analysis' | 'feedback'>('overview');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <Head>
        <title>Learn More | PitchBuddy - See How It Works</title>
      </Head>
      
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">How PitchBuddy Works</h1>
          <p className="text-xl text-gray-600 mb-6">
            See exactly what happens when you record a pitch and get AI-powered feedback
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 max-w-2xl mx-auto">
            <p className="text-blue-800">
              📹 <strong>Demo Scenario:</strong> You&apos;ve just recorded a 2-minute startup pitch. 
              Here&apos;s the AI analysis and feedback you&apos;d receive.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex justify-center space-x-8 border-b border-gray-200">
            {[
              { id: 'overview', label: 'Overview & Scores' },
              { id: 'analysis', label: 'Detailed Analysis' },
              { id: 'feedback', label: 'AI Feedback' }
            ].map((tab) => (
              <button
                key={tab.id}
                className={`py-4 px-1 font-medium text-lg border-b-2 transition-colors ${
                  currentView === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setCurrentView(tab.id as 'overview' | 'analysis' | 'feedback')}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Demo Content */}
        {currentView === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Overall Score */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Overall Performance</CardTitle>
                  <CardDescription>Your pitch scored in the top 25% of all users</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-6xl font-bold text-green-600 mb-2">{demoAnalysis.overallScore}</div>
                    <div className="text-xl text-gray-600">out of 100</div>
                    <div className="mt-4 flex justify-center">
                      <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full">
                        🎉 Excellent Performance!
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Key Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Key Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{demoAnalysis.metrics.pacing}</div>
                      <div className="text-gray-600">Pacing Score</div>
                      <div className="text-sm text-green-600">+7 from last pitch</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">{demoAnalysis.metrics.confidence}</div>
                      <div className="text-gray-600">Confidence Level</div>
                      <div className="text-sm text-green-600">+7 from last pitch</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600">{demoAnalysis.metrics.clarity}</div>
                      <div className="text-gray-600">Clarity Score</div>
                      <div className="text-sm text-green-600">+4 from last pitch</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-600">{demoAnalysis.metrics.fillerWordFrequency}</div>
                      <div className="text-gray-600">Filler Words</div>
                      <div className="text-sm text-orange-600">-3 from last pitch</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Skill Radar Chart */}
            <div>
              <SkillRadarChart 
                metrics={demoAnalysis.skillBreakdown} 
                title="Skill Breakdown"
              />
            </div>
          </div>
        )}

        {currentView === 'analysis' && (
          <div className="space-y-8">
            {/* Transcription */}
            <Card>
              <CardHeader>
                <CardTitle>Speech Transcription</CardTitle>
                <CardDescription>AI-generated transcript with key phrases highlighted</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-lg leading-relaxed">{demoAnalysis.transcription.text}</p>
                </div>
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Key Phrases Detected:</h4>
                  <div className="flex flex-wrap gap-2">
                    {demoAnalysis.transcription.keyPhrases.map((phrase, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {phrase}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Speech Patterns</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Words per minute</span>
                      <span className="font-semibold">142 WPM</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Pause frequency</span>
                      <span className="font-semibold">Optimal</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Volume variation</span>
                      <span className="font-semibold">Good</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Content Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Business terms</span>
                      <span className="font-semibold">7 detected</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Call to action</span>
                      <span className="font-semibold">Present</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Structure score</span>
                      <span className="font-semibold">90/100</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {currentView === 'feedback' && (
          <div className="space-y-8">
            {/* AI Feedback */}
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">✅ What You Did Well</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {demoAnalysis.feedback.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-3 mt-1">•</span>
                      <span className="text-lg">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Improvement Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-orange-600">🎯 Areas for Improvement</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {demoAnalysis.improvements.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-orange-500 mr-3 mt-1">•</span>
                      <span className="text-lg">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Practice Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-600">🚀 Recommended Next Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Pacing Exercise</h4>
                    <p className="text-sm text-gray-600">Practice speaking at 140-160 WPM using our built-in metronome tool.</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Confidence Building</h4>
                    <p className="text-sm text-gray-600">Record yourself practicing just the middle section to build confidence.</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Structure Workshop</h4>
                    <p className="text-sm text-gray-600">Your structure is strong! Consider our advanced storytelling course.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-12 text-center bg-white rounded-lg p-8 shadow-sm">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to improve your pitching skills?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Start recording your own pitches and get personalized AI feedback just like this!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg">
              <Link href="/pitches">Start Recording</Link>
            </Button>
            <Button variant="outline" asChild size="lg" className="text-lg">
              <Link href="/">Learn More</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DemoPage;