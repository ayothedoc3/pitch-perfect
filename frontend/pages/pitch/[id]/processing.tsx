import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { usePitchStore } from '../../../stores/pitchStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const ProcessingPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { pitches } = usePitchStore();
  const [processingStep, setProcessingStep] = useState(1);
  
  const pitch = pitches.find(p => p.id === id);
  
  // Simulate processing steps
  useEffect(() => {
    if (!pitch) return;
    
    const steps = [
      { step: 1, duration: 1000, message: "Analyzing speech patterns..." },
      { step: 2, duration: 1500, message: "Transcribing your pitch..." },
      { step: 3, duration: 2000, message: "Evaluating delivery and confidence..." },
      { step: 4, duration: 1500, message: "Generating personalized feedback..." },
      { step: 5, duration: 1000, message: "Finalizing analysis..." }
    ];
    
    let currentStep = 1;
    
    const processNextStep = () => {
      if (currentStep <= steps.length) {
        setProcessingStep(currentStep);
        setTimeout(() => {
          currentStep++;
          if (currentStep > steps.length) {
            // Analysis complete, redirect to results
            router.push(`/pitch/${id}`);
          } else {
            processNextStep();
          }
        }, steps[currentStep - 1].duration);
      }
    };
    
    processNextStep();
  }, [pitch, id, router]);
  
  const steps = [
    { number: 1, title: "Speech Analysis", description: "Analyzing your speech patterns, pacing, and clarity" },
    { number: 2, title: "Transcription", description: "Converting your speech to text and identifying key phrases" },
    { number: 3, title: "Delivery Assessment", description: "Evaluating confidence, tone variation, and body language" },
    { number: 4, title: "Feedback Generation", description: "Creating personalized suggestions and improvements" },
    { number: 5, title: "Report Compilation", description: "Finalizing your comprehensive pitch analysis" }
  ];
  
  if (!pitch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-gray-600 mb-4">Pitch not found</p>
            <Button asChild>
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <Head>
        <title>Analyzing Your Pitch | PitchBuddy</title>
      </Head>
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Analyzing Your Pitch
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Our AI is hard at work analyzing &quot;{pitch.title}&quot;
          </p>
          <p className="text-gray-500">
            This usually takes 10-15 seconds. Hang tight!
          </p>
        </div>
        
        {/* Progress Steps */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-center">Analysis Progress</CardTitle>
            <CardDescription className="text-center">
              Step {processingStep} of {steps.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {steps.map((step) => {
                const isActive = processingStep === step.number;
                const isCompleted = processingStep > step.number;
                
                return (
                  <div key={step.number} className="flex items-center">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 ${
                      isCompleted 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : isActive 
                        ? 'border-blue-500 text-blue-600 bg-blue-50' 
                        : 'border-gray-300 text-gray-400'
                    }`}>
                      {isCompleted ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        step.number
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <div className={`text-sm font-medium ${
                        isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        {step.title}
                        {isActive && (
                          <span className="ml-2 animate-pulse">...</span>
                        )}
                      </div>
                      <div className={`text-sm mt-1 ${
                        isActive ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        {step.description}
                      </div>
                    </div>
                    {isActive && (
                      <div className="flex-shrink-0">
                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Progress Bar */}
            <div className="mt-8">
              <div className="bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500" 
                  style={{ width: `${(processingStep / steps.length) * 100}%` }}
                ></div>
              </div>
              <div className="text-center mt-2 text-sm text-gray-600">
                {Math.round((processingStep / steps.length) * 100)}% Complete
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* What to Expect */}
        <Card>
          <CardHeader>
            <CardTitle>What You&apos;ll Get</CardTitle>
            <CardDescription>Here&apos;s what our AI analysis will provide</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Overall Score</h4>
                  <p className="text-sm text-gray-600">Comprehensive rating of your pitch performance</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h4a1 1 0 011 1v2m-6 0h8m-8 0a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2m-1 4H8m0 0v8m0-8h8m-8 8h8" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Detailed Metrics</h4>
                  <p className="text-sm text-gray-600">Pacing, clarity, confidence, and delivery analysis</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">AI Feedback</h4>
                  <p className="text-sm text-gray-600">Personalized suggestions for improvement</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Transcription</h4>
                  <p className="text-sm text-gray-600">Full text with highlighted key phrases</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Skip Option */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500 mb-4">
            Taking too long? You can view your recording now and check analysis later.
          </p>
          <Button variant="outline" asChild>
            <Link href={`/pitch/${id}`}>
              View Recording Now
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
};

export default ProcessingPage;