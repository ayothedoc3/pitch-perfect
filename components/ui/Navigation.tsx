import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const navItems = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'My Pitches', href: '/pitches' },
  { name: 'Feedback', href: '/feedback' },
  { name: 'Community', href: '/community' },
  { name: 'Resources', href: '/resources' },
];

const Navigation: React.FC = () => {
  const router = useRouter();
  
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard">
                <span className="text-2xl font-display font-bold text-blue-600 cursor-pointer">Pitch Perfect</span>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => {
                const isActive = router.pathname === item.href || router.pathname.startsWith(`${item.href}/`);
                return (
                  <Link href={item.href} key={item.name}>
                    <span
                      className={`${
                        isActive
                          ? 'border-b-2 border-blue-500 text-gray-900'
                          : 'border-b-2 border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      } inline-flex items-center px-1 pt-1 text-sm font-medium cursor-pointer h-full`}
                    >
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
<button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">Record New Pitch</button>
            
            <div className="ml-3 relative">
              <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-medium">
                U
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
