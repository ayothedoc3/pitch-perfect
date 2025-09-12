import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { usePitchStore } from '../../stores/pitchStore';

const navItems = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'My Pitches', href: '/pitches' },
  { name: 'Feedback', href: '/feedback' },
  { name: 'Community', href: '/community' },
  { name: 'Resources', href: '/resources' },
];

const Navigation: React.FC = () => {
  const router = useRouter();
  const { userProfile, setUserProfile } = usePitchStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    // Clear user profile and all pitches to restart onboarding
    setUserProfile(null);
    // Also clear localStorage
    localStorage.removeItem('pitchbuddy-storage');
    // Redirect to home page
    router.push('/');
    setShowUserMenu(false);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="text-2xl font-display font-bold text-blue-600">
                PitchBuddy
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => {
                const isActive = router.pathname === item.href || router.pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    href={item.href}
                    key={item.name}
                    className={`${
                      isActive
                        ? 'border-b-2 border-blue-500 text-gray-900'
                        : 'border-b-2 border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } inline-flex items-center px-1 pt-1 text-sm font-medium h-full`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            <div className="ml-3 relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 h-9 px-3 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium transition-colors"
              >
                <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm">
                  {userProfile?.name?.[0] || 'U'}
                </div>
                <span className="text-sm">{userProfile?.name || 'User'}</span>
                <svg className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b">
                    <div className="font-medium">{userProfile?.name || 'User'}</div>
                    <div className="text-gray-500">{userProfile?.level || 'beginner'} level</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Start Over / Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
