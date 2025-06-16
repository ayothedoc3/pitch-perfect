import React, { useState, useRef, useEffect } from 'react';

interface Question {
  id: string;
  text: string;
  type: 'multiple-choice' | 'text' | 'select';
  options?: string[];
}

interface OnboardingResponse {
  questionId: string;
  answer: string;
}

const questions: Question[] = [
  {
    id: 'pitch-type',
    text: 'What type of pitch are you primarily looking to improve?',
    type: 'multiple-choice',
    options: ['Startup Pitch', 'Elevator Pitch', 'Sales Pitch', 'Other'],
  },
  {
    id: 'experience-level',
    text: 'How would you describe your experience with pitching?',
    type: 'multiple-choice',
    options: ['Beginner', 'Intermediate', 'Advanced'],
  },
  {
    id: 'improvement-goals',
    text: 'What aspects of your pitch would you like to focus on improving?',
    type: 'select',
    options: [
      'Clarity and Structure',
      'Confidence and Delivery',
      'Visual Aids and Presentation',
      'Content and Messaging',
      'Audience Engagement',
      'Handling Questions',
    ],
  },
  {
    id: 'practice-frequency',
    text: 'How often do you plan to practice your pitches?',
    type: 'multiple-choice',
    options: ['Daily', 'A few times a week', 'Weekly', 'Occasionally'],
  },
];

interface OnboardingFlowProps {
  onComplete: (responses: OnboardingResponse[]) => void;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<OnboardingResponse[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const fullText = questions[currentStep]?.text || '';
  const messageEndRef = useRef<HTMLDivElement>(null);
  
  // Typing effect for questions
  useEffect(() => {
    if (fullText === displayedText) return;
    
    setIsTyping(true);
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(fullText.substring(0, i));
      i++;
      if (i > fullText.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 30);
    
    return () => clearInterval(interval);
  }, [fullText, displayedText]);
  
  // Scroll to bottom of chat when new messages appear
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayedText, responses.length]);
  
  const handleAnswer = (answer: string) => {
    const newResponse = {
      questionId: questions[currentStep].id,
      answer,
    };
    
    setResponses([...responses, newResponse]);
    
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
      setDisplayedText('');
    } else {
      onComplete([...responses, newResponse]);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-6">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Welcome to Pitch Perfect</h2>
        <p className="text-gray-600 mt-2">Let's get to know you to personalize your experience</p>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto mb-6">
        {/* AI welcome message */}
        <div className="flex mb-4">
          <div className="h-8 