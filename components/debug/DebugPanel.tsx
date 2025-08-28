import React, { useState, useEffect } from 'react';
import { usePitchStore } from '../../stores/pitchStore';

interface DebugPanelProps {
  show: boolean;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ show }) => {
  const { pitches, userProfile } = usePitchStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!show || !isClient) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">Debug Info</h3>
      <div>
        <p>Pitches: {pitches.length}</p>
        <p>User Profile: {userProfile ? 'Set' : 'None'}</p>
        <p>User Level: {userProfile?.level || 'N/A'}</p>
        <p>Client: Yes</p>
      </div>
    </div>
  );
};

export default DebugPanel;