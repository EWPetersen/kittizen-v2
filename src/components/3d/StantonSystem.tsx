import React, { useRef, useState, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Canvas } from './Canvas';
import { Scene } from './Scene';
import { SCALE_FACTOR } from './constants';
import * as Utils from './utils';

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
        <Scene />
      </Canvas>
      
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
    </div>
  );
};

// This component can be used inside the Scene component to handle camera state
export const CameraManager: React.FC = () => {
  const { camera } = useThree();
  
  // Access and manage camera state
  useEffect(() => {
    // Initial camera setup
    camera.position.set(0, 50, 200);
    camera.lookAt(0, 0, 0);
    
    // You can add listeners or other camera management logic here
    
    return () => {
      // Cleanup if needed
    };
  }, [camera]);
  
  return null; // This component doesn't render anything
}; 