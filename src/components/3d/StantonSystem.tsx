import React, { useRef, useState, useEffect } from 'react';
import { Canvas } from './Canvas';
import { Scene } from './Scene';
import { SCALE_FACTOR } from './constants';
import CameraControls from './CameraControls';
import { CameraMode } from './CameraTypes';

interface StantonSystemProps {
  width?: string;
  height?: string;
  showStats?: boolean;
  onSelect?: (objectId: string | null) => void;
}

export const StantonSystem: React.FC<StantonSystemProps> = ({
  width = '100%',
  height = '100%',
  showStats = false,
  onSelect
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fps, setFps] = useState<number>(0);
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [objectInfo, setObjectInfo] = useState<any | null>(null);
  const [currentCameraMode, setCurrentCameraMode] = useState<CameraMode>(CameraMode.OVERVIEW);
  
  // Available celestial bodies for quick selection
  const [availableCelestialBodies] = useState([
    { name: "Stanton", type: "star" },
    { name: "microTech", type: "planet" },
    { name: "ArcCorp", type: "planet" },
    { name: "Clio", type: "moon" },
    { name: "New Babbage", type: "station" },
    { name: "Stanton-Pyro Jump", type: "jump_point" }
  ]);
  
  // Performance monitoring
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const updateFPS = () => {
      const now = performance.now();
      frameCount++;
      
      // Update FPS counter about every second
      if (now - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
      }
      
      requestAnimationFrame(updateFPS);
    };
    
    const animationId = requestAnimationFrame(updateFPS);
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);
  
  // Handle object selection
  const handleSelectObject = (objectId: string | null) => {
    setSelectedObject(objectId);
    
    // Call parent onSelect if provided
    if (onSelect) {
      onSelect(objectId);
    }
    
    // In a real implementation, fetch object info from the system data
    if (objectId) {
      // Mock info panel data
      setObjectInfo({
        name: objectId,
        type: objectId.includes('Tech') ? 'Planet' : 
              objectId.includes('Clio') ? 'Moon' : 
              objectId.includes('Babbage') ? 'Station' : 
              objectId.includes('Jump') ? 'Jump Point' : 'Unknown',
        description: `Information about ${objectId}. In a complete implementation, this would include astronomical data, points of interest, and other contextual information.`,
        // Additional properties based on type would be included here
      });
    } else {
      setObjectInfo(null);
    }
  };
  
  // Camera control handlers - these will call methods on window.sceneCameraController
  const handleZoomIn = () => {
    if ((window as any).sceneCameraController) {
      (window as any).sceneCameraController.zoomIn();
    }
  };
  
  const handleZoomOut = () => {
    if ((window as any).sceneCameraController) {
      (window as any).sceneCameraController.zoomOut();
    }
  };
  
  const handleStopZoom = () => {
    if ((window as any).sceneCameraController) {
      (window as any).sceneCameraController.stopZoom();
    }
  };
  
  const handleResetView = () => {
    if ((window as any).sceneCameraController) {
      (window as any).sceneCameraController.resetView();
      setCurrentCameraMode(CameraMode.OVERVIEW);
      setSelectedObject(null);
      setObjectInfo(null);
    }
  };
  
  const handleSwitchMode = (mode: CameraMode) => {
    setCurrentCameraMode(mode);
    if ((window as any).sceneCameraController) {
      (window as any).sceneCameraController.setCameraMode(mode);
    }
  };
  
  const handleQuickSelect = (name: string) => {
    // Find position and other data for the selected body
    // When user clicks a quick select button, we need to simulate a focus action
    if ((window as any).sceneCameraController) {
      // Get the camera controller from window object
      const cameraController = (window as any).sceneCameraController;
      
      // Set the celestial object as selected (will update the UI)
      setSelectedObject(name);
      
      // We don't have a direct reference to the object data here,
      // but the cameraController interface handles focusing by name
      const bodyType = availableCelestialBodies.find(b => b.name === name)?.type;
      
      // This is a workaround - ideally we would get actual position and size from data
      // For now, setting to focus on the object by name will rely on 
      // the window.sceneCameraController to find and focus the correct object
      if (bodyType) {
        // Trigger an item selection in the 3D scene
        // The actual camera movement will happen inside the Scene component
        if (onSelect) {
          onSelect(name);
        }
      }
    }
  };
  
  return (
    <div 
      ref={containerRef}
      style={{ 
        width, 
        height, 
        position: 'relative',
        overflow: 'hidden',
        background: '#090a0f'
      }}
    >
      {/* Main Canvas */}
      <Canvas showStats={showStats}>
        <Scene onSelectObject={handleSelectObject} />
      </Canvas>
      
      {/* Camera Controls UI - rendered outside the 3D context */}
      <CameraControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onStopZoom={handleStopZoom}
        onResetView={handleResetView}
        onSwitchMode={handleSwitchMode}
        onQuickSelect={handleQuickSelect}
        currentMode={currentCameraMode}
        availableCelestialBodies={availableCelestialBodies}
      />
      
      {/* Performance overlay */}
      {!showStats && (
        <div 
          style={{ 
            position: 'absolute', 
            top: '10px', 
            right: '10px', 
            color: '#ffffff', 
            fontSize: '12px',
            fontFamily: 'monospace',
            padding: '5px',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            borderRadius: '3px'
          }}
        >
          {fps} FPS
        </div>
      )}
      
      {/* Scale legend */}
      <div 
        style={{ 
          position: 'absolute', 
          bottom: '10px', 
          left: '10px', 
          color: '#ffffff', 
          fontSize: '12px',
          fontFamily: 'monospace',
          padding: '5px',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          borderRadius: '3px'
        }}
      >
        Scale: 1 unit = {SCALE_FACTOR} Gm
      </div>
      
      {/* Object information panel */}
      {objectInfo && (
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            width: '250px',
            color: '#ffffff',
            fontFamily: 'monospace',
            padding: '10px',
            backgroundColor: 'rgba(10, 20, 40, 0.8)',
            borderLeft: '2px solid #2288cc',
            borderRadius: '3px',
            backdropFilter: 'blur(2px)',
            transition: 'all 0.3s ease',
            opacity: 0.9,
            maxHeight: '300px',
            overflowY: 'auto',
          }}
        >
          <h3 style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#88ccff' }}>
            {objectInfo.name}
          </h3>
          <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '5px' }}>
            {objectInfo.type}
          </div>
          <p style={{ fontSize: '11px', lineHeight: '1.4', margin: '5px 0' }}>
            {objectInfo.description}
          </p>
          <div style={{ textAlign: 'right', fontSize: '10px', marginTop: '10px' }}>
            <button 
              style={{
                background: 'rgba(40, 100, 180, 0.6)',
                border: 'none',
                borderRadius: '3px',
                padding: '3px 8px',
                color: 'white',
                cursor: 'pointer'
              }}
              onClick={() => handleSelectObject(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 