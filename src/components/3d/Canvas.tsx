import { Canvas as ThreeCanvas } from '@react-three/fiber';
import { Stats } from '@react-three/drei';
import React from 'react';
import CameraController, { CameraMode } from './CameraController';

interface CanvasProps {
  children: React.ReactNode;
  showStats?: boolean;
  initialCameraMode?: CameraMode;
}

export const Canvas: React.FC<CanvasProps> = ({ 
  children, 
  showStats = false,
  initialCameraMode = CameraMode.OVERVIEW
}) => {
  return (
    <div className="w-full h-full">
      <ThreeCanvas
        shadows
        gl={{ antialias: true, alpha: false }}
        dpr={window.devicePixelRatio}
      >
        {showStats && <Stats />}
        <CameraController initialCameraMode={initialCameraMode} />
        {children}
      </ThreeCanvas>
    </div>
  );
}; 