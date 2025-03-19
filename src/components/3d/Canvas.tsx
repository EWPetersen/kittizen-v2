import { Canvas as ThreeCanvas } from '@react-three/fiber';
import { Stats, OrbitControls } from '@react-three/drei';
import React from 'react';

interface CanvasProps {
  children: React.ReactNode;
  showStats?: boolean;
}

export const Canvas: React.FC<CanvasProps> = ({ children, showStats = false }) => {
  return (
    <div className="w-full h-full">
      <ThreeCanvas
        shadows
        camera={{
          position: [0, 50, 200],
          fov: 60,
          near: 0.1,
          far: 100000
        }}
        gl={{ antialias: true, alpha: false }}
        dpr={window.devicePixelRatio}
      >
        {showStats && <Stats />}
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          zoomSpeed={1.5}
          panSpeed={1.5}
          rotateSpeed={1.0}
          maxDistance={10000}
        />
        {children}
      </ThreeCanvas>
    </div>
  );
}; 