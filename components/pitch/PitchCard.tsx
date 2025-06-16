import React from 'react';
import Link from 'next/link';

interface PitchCardProps {
  id: string;
  title: string;
  type: 'startup' | 'elevator' | 'sales';
  duration: number; // in seconds
  feedbackCount: number;
  dateRecorded: string;
  thumbnailUrl?: string;
  progress?: number; // 0-100
}

const PitchCard: React.FC<PitchCardProps> = ({
  id,
  title,
  type,
  duration,
  feedbackCount,
  dateRecorded,
  thumbnailUrl,
  progress = 0,
}) => {
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const typeColors = {
    startup: 'bg-purple-100 text-purple-800',
    elevator: 'bg-green-100 text-green-800',
    sales: 'bg-blue-100 text-blue-800',
  };
  
  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="relative aspect-video bg-gray-100 rounded-md mb-4 overflow-hidden">
        {thumbnailUrl ? (
          <img 
            src={thumbnailUrl} 
            alt={title} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 rounded-md px-2 py-1 text-white text-xs">
          {formatDuration(duration)}
        </div>
      </div>
      
      <h3 className="font-semibold text-lg mb-1 truncate">{title}</h3>
      
      <div className="flex items-center space-x-2 mb-3">
        <span className={`text-xs px-2 py-1 rounded-full ${typeColors[type]}`}>
          {type.charAt(0).toUpperCase() + type.slice(1)} Pitch
        </span>
        <span className="text-xs text-gray-500">
          {new Date(dateRecorded).toLocaleDateString()}
        </span>
      </div>
      
      {progress > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
          <div 
            className="bg-blue-600 h-2 rounded-full" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          <span className="font-medium text-gray-700">{feedbackCount}</span> feedback
        </div>
        
        <Link href={`/pitch/${id}`}>
<a className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded text-sm">View Details</a>
        </Link>
      </div>
    </div>
  );
};

export default PitchCard;
