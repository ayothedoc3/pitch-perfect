import React from 'react';
import { useState } from 'react';

interface DashboardProps {
  userName?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ userName = 'Pitcher' }) => {
  const [activeTab, setActiveTab] = useState('myPitches');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">Pitch Perfect</h1>
          <div className="flex items-center space-x-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
              New Pitch
            </button>
            <div className="relative">
              <div className="h-10 w-10 rounded-full bg-blue-200 flex items-center justify-center">
                <span className="text-blue-800 font-medium">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to your Pitch Dashboard</h2>
            <p className="text-gray-600">
              Practice, receive feedback, and perfect your pitch through our AI-powered platform and community.
            </p>
          </div>
          
          <nav className="mb-8">
            <ul className="flex border-b border-gray-200">
              {['My Pitches', 'Feedback', 'Progress', 'Resources'].map((tab) => {
                const id = tab.toLowerCase().replace(/\s/g, '');
                return (
                  <li key={id} className="-mb-px mr-1">
                    <button
                      className={`inline-block py-2 px-4 font-medium ${
                        activeTab === id 
                          ? 'border-b-2 border-blue-500 text-blue-600' 
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                      onClick={() => setActiveTab(id)}
                    >
                      {tab}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Placeholder for pitch cards */}
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-6 h-64 flex flex-col justify-center items-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <p className="text-gray-600 text-center">Record your first pitch to get started</p>
              <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
                Record Pitch
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 