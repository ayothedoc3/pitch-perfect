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
    if (!fullText) return;
    
    // Reset typing state when question changes
    setDisplayedText('');
    setIsTyping(true);
    
    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i <= fullText.length) {
        setDisplayedText(fullText.substring(0, i));
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 30);
    
    return () => clearInterval(interval);
  }, [fullText]);
  
  // Scroll to bottom of chat when new messages appear
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayedText, responses.length]);
  
  const handleAnswer = (answer: string) => {
    console.log('Answer selected:', answer, 'for question:', questions[currentStep].id);
    console.log('Current state - step:', currentStep, 'isTyping:', isTyping, 'displayedText length:', displayedText.length);
    
    const newResponse = {
      questionId: questions[currentStep].id,
      answer,
    };
    
    setResponses([...responses, newResponse]);
    
    if (currentStep < questions.length - 1) {
      console.log('Moving to next question, step:', currentStep + 1);
      setCurrentStep(currentStep + 1);
      setDisplayedText('');
    } else {
      console.log('Onboarding complete, calling onComplete');
      onComplete([...responses, newResponse]);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-6">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Welcome to Pitch Perfect</h2>
        <p className="text-gray-600 mt-2">Let&apos;s get to know you to personalize your experience</p>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto mb-6">
        {/* AI welcome message */}
        <div className="flex mb-4">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
            AI
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm flex-1">
            <p className="text-gray-700">Hi! I&apos;m here to help you improve your pitching skills. Let me ask you a few questions to customize your experience.</p>
          </div>
        </div>
        
        {/* Previous responses */}
        {responses.map((response, index) => (
          <div key={index} className="mb-4">
            <div className="flex mb-2">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                AI
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm flex-1">
                <p className="text-gray-700">{questions[index].text}</p>
              </div>
            </div>
            <div className="flex justify-end">
              <div className="bg-blue-500 text-white rounded-lg p-3 shadow-sm max-w-xs">
                <p>{response.answer}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 ml-3">
                You
              </div>
            </div>
          </div>
        ))}
        
        {/* Current question */}
        {currentStep < questions.length && (
          <div className="flex mb-4">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
              AI
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm flex-1">
              <p className="text-gray-700">
                {displayedText}
                {isTyping && <span className="animate-pulse">|</span>}
              </p>
            </div>
          </div>
        )}
        
        <div ref={messageEndRef} />
      </div>
      
      {/* Answer options */}
      {currentStep < questions.length && !isTyping && (
        <div className="space-y-3">
          {console.log('Rendering answer options for step:', currentStep, 'question type:', questions[currentStep]?.type)}
          {questions[currentStep].type === 'multiple-choice' && (
            <div className="grid grid-cols-1 gap-2">
              {questions[currentStep].options?.map((option) => (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  className="text-left p-3 bg-gray-100 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  {option}
                </button>
              ))}
            </div>
          )}
          
          {questions[currentStep].type === 'select' && (
            <div className="grid grid-cols-1 gap-2">
              {questions[currentStep].options?.map((option) => (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  className="text-left p-3 bg-gray-100 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Progress indicator */}
      <div className="mt-6">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>Progress</span>
          <span>{currentStep + 1} of {questions.length}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;