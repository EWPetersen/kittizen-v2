import React, { useState } from 'react';
import { StantonSystem } from './components/3d';
import NavBar from './components/NavBar';
import AlertPanel from './components/AlertPanel';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  const [showAlerts, setShowAlerts] = useState(false);
  const [showStats, setShowStats] = useState(false);

  return (
    <AuthProvider>
      <div className="w-full h-full flex flex-col">
        <NavBar 
          onToggleAlerts={() => setShowAlerts(!showAlerts)} 
          onToggleStats={() => setShowStats(!showStats)} 
        />
        
        <div className="relative flex-grow">
          <StantonSystem 
            width="100%" 
            height="100%" 
            showStats={showStats}
            onSelect={(objectId) => console.log('Selected:', objectId)}
          />
          
          {showAlerts && (
            <div className="absolute top-0 right-0 h-full">
              <AlertPanel />
            </div>
          )}
        </div>
      </div>
    </AuthProvider>
  );
}

export default App; 