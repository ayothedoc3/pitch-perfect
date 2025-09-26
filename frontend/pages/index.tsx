import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import QuickOnboarding from '../components/onboarding/QuickOnboarding';
import DebugPanel from '../components/debug/DebugPanel';
import { usePitchStore, UserProfile } from '../stores/pitchStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import withAuth from '../components/auth/withAuth';

const HomePage: React.FC = () => {
  const router = useRouter();
  const userProfile = usePitchStore((state) => state.userProfile);
  const setUserProfile = usePitchStore((state) => state.setUserProfile);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side before accessing localStorage
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleOnboardingComplete = (responses: Array<{questionId: string; answer: string}>) => {
    // Create user profile from onboarding responses
    const profile = {
      name: 'User', // Would get from a separate form
      level: responses.find(r => r.questionId === 'experience-level')?.answer.toLowerCase() || 'beginner',
      totalPitches: 0,
      totalFeedback: 0,
      currentStreak: 0,
      preferences: {
        pitchType: responses.find(r => r.questionId === 'pitch-type')?.answer || 'Startup Pitch',
        experienceLevel: responses.find(r => r.questionId === 'experience-level')?.answer || 'Complete beginner',
        improvementGoals: ['Getting started'],
        practiceFrequency: 'Weekly',
      },
    };

    setUserProfile(profile as UserProfile);
    setShowOnboarding(false);
    router.push('/dashboard');
  };

  const handleOnboardingSkip = () => {
    // Create minimal user profile for skipped onboarding
    const profile = {
      name: 'User',
      level: 'beginner',
      totalPitches: 0,
      totalFeedback: 0,
      currentStreak: 0,
      preferences: {
        pitchType: 'Startup Pitch',
        experienceLevel: 'Complete beginner',
        improvementGoals: ['Getting started'],
        practiceFrequency: 'Weekly',
      },
    };

    setUserProfile(profile as UserProfile);
    setShowOnboarding(false);
    router.push('/dashboard');
  };

  if (showOnboarding && isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <QuickOnboarding 
            onComplete={handleOnboardingComplete} 
            onSkip={handleOnboardingSkip}
          />
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-6xl font-display font-bold text-foreground mb-6">
            PitchBuddy
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Master your pitch with AI-powered feedback. Practice, improve, and perfect your presentations with real-time analysis and personalized coaching.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            {isClient && userProfile ? (
              <Button asChild size="lg" className="text-lg">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <Button 
                size="lg" 
                className="text-lg"
                onClick={() => {
                  setShowOnboarding(true);
                }}
              >
                Get Started
              </Button>
            )}
            <Button variant="outline" asChild size="lg" className="text-lg">
              <Link href="/demo">Learn More</Link>
            </Button>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v5a3 3 0 01-3 3H6a3 3 0 01-3-3V8a3 3 0 013-3h6a3 3 0 013 3v2z" />
                  </svg>
                </div>
                <CardTitle className="text-xl">Record & Practice</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Record your pitches with video and audio capture. Practice in a comfortable environment with professional recording tools.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <CardTitle className="text-xl">AI Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Get detailed feedback on pacing, clarity, confidence, and more. Our AI analyzes your speech patterns and provides actionable insights.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <CardTitle className="text-xl">Track Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Monitor your improvement over time with detailed analytics and skill radar charts. See how your pitching skills evolve.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Debug panel - remove in production */}
      <DebugPanel show={process.env.NODE_ENV === 'development'} />
    </div>
  );
};

export default withAuth(HomePage, { requireAuth: false });
