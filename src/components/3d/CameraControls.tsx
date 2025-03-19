import React, { useRef } from 'react';
import { CameraMode } from './CameraTypes';

interface CameraControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onStopZoom: () => void;
  onResetView: () => void;
  onSwitchMode: (mode: CameraMode) => void;
  onQuickSelect: (celestialName: string) => void;
  currentMode: CameraMode;
  availableCelestialBodies: Array<{name: string, type: string}>;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onStopZoom,
  onResetView,
  onSwitchMode,
  onQuickSelect,
  currentMode,
  availableCelestialBodies = []
}) => {
  // Track button press state for continuous zoom
  const isZoomingIn = useRef(false);
  const isZoomingOut = useRef(false);
  
  // Handle button down and up events for zoom
  const handleZoomInDown = () => {
    isZoomingIn.current = true;
    onZoomIn();
  };
  
  const handleZoomOutDown = () => {
    isZoomingOut.current = true;
    onZoomOut();
  };
  
  const handleZoomUp = () => {
    isZoomingIn.current = false;
    isZoomingOut.current = false;
    onStopZoom();
  };
  
  return (
    <div className="camera-controls fixed bottom-4 right-4 flex flex-col gap-2 bg-slate-800/80 backdrop-blur-sm p-3 rounded-lg text-white z-10">
      <div className="flex flex-row gap-2 justify-between">
        <button 
          onClick={onResetView}
          className="bg-blue-600 hover:bg-blue-700 p-2 rounded"
          title="Reset View"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
        </button>
        
        <div className="flex flex-row gap-1">
          <button 
            onMouseDown={handleZoomInDown}
            onMouseUp={handleZoomUp}
            onMouseLeave={handleZoomUp}
            onTouchStart={handleZoomInDown}
            onTouchEnd={handleZoomUp}
            className="bg-slate-700 hover:bg-slate-600 p-2 rounded"
            title="Zoom In"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
          
          <button 
            onMouseDown={handleZoomOutDown}
            onMouseUp={handleZoomUp}
            onMouseLeave={handleZoomUp}
            onTouchStart={handleZoomOutDown}
            onTouchEnd={handleZoomUp}
            className="bg-slate-700 hover:bg-slate-600 p-2 rounded"
            title="Zoom Out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="camera-modes flex flex-row gap-1 mt-2">
        <button 
          onClick={() => onSwitchMode(CameraMode.OVERVIEW)}
          className={`flex-1 p-1 rounded text-xs ${currentMode === CameraMode.OVERVIEW ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}
          title="Overview"
        >
          Overview
        </button>
        <button 
          onClick={() => onSwitchMode(CameraMode.ORBIT)}
          className={`flex-1 p-1 rounded text-xs ${currentMode === CameraMode.ORBIT ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}
          title="Orbit"
        >
          Orbit
        </button>
        <button 
          onClick={() => onSwitchMode(CameraMode.FIRST_PERSON)}
          className={`flex-1 p-1 rounded text-xs ${currentMode === CameraMode.FIRST_PERSON ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}
          title="First Person"
        >
          First Person
        </button>
      </div>
      
      {availableCelestialBodies.length > 0 && (
        <div className="quick-select mt-2">
          <div className="text-xs mb-1 text-slate-300">Quick Select</div>
          <div className="grid grid-cols-2 gap-1">
            {availableCelestialBodies.slice(0, 6).map(body => (
              <button
                key={body.name}
                onClick={() => onQuickSelect(body.name)}
                className="bg-slate-700 hover:bg-slate-600 p-1 rounded text-xs"
                title={`Focus on ${body.name}`}
              >
                {body.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraControls; 