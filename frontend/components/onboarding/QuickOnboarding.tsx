import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface QuickOnboardingProps {
  onComplete: (responses: Array<{questionId: string; answer: string}>) => void;
  onSkip: () => void;
}

const QuickOnboarding: React.FC<QuickOnboardingProps> = ({ onComplete, onSkip }) => {
  const [step, setStep] = useState(0);
  const [responses, setResponses] = useState<{[key: string]: string}>({});

  const questions = [
    {
      id: 'pitch-type',
      title: 'What type of pitch are you working on?',
      subtitle: 'This helps us provide relevant feedback',
      options: ['Startup Pitch', 'Elevator Pitch', 'Sales Pitch', "I'm just exploring"]
    },
    {
      id: 'experience-level', 
      title: 'How much pitching experience do you have?',
      subtitle: 'We\'ll adjust our feedback accordingly',
      options: ['Complete beginner', 'Some experience', 'Pretty experienced', 'I\'m a pro']
    }
  ];

  const handleAnswer = (questionId: string, answer: string) => {
    const newResponses = { ...responses, [questionId]: answer };
    setResponses(newResponses);
    
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      // Convert to expected format and complete
      const formattedResponses = Object.entries(newResponses).map(([questionId, answer]) => ({
        questionId,
        answer
      }));
      onComplete(formattedResponses);
    }
  };

  const currentQuestion = questions[step];

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-500">Step {step + 1} of {questions.length}</div>
            <Button variant="ghost" size="sm" onClick={onSkip}>
              Skip setup
            </Button>
          </div>
          <CardTitle className="text-2xl mb-2">{currentQuestion.title}</CardTitle>
          <CardDescription className="text-lg">{currentQuestion.subtitle}</CardDescription>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mt-6">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${((step + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 gap-3">
            {currentQuestion.options.map((option) => (
              <Button
                key={option}
                variant="outline"
                size="lg"
                className="h-auto p-4 text-left justify-start hover:border-blue-500 hover:bg-blue-50"
                onClick={() => handleAnswer(currentQuestion.id, option)}
              >
                <div>
                  <div className="font-medium">{option}</div>
                </div>
              </Button>
            ))}
          </div>
          
          <div className="mt-8 text-center">
            <Button
              variant="ghost"
              onClick={onSkip}
              className="text-gray-500"
            >
              I&apos;ll set this up later → Skip to dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickOnboarding;