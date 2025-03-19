import React, { useRef } from 'react';
import { Color, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import { Grid } from './Grid';
import { Star } from './Star';
import { SCALE_FACTOR } from './constants';

export const Scene: React.FC = () => {
  const sceneRef = useRef<THREE.Group>(null);
  
  // Update scene on each frame if needed
  useFrame(({ clock }) => {
    // Animation or updates can go here
  });

  // Light colors that match Star Citizen aesthetic
  const ambientLightColor = new Color(0x222233);
  const directionalLightColor = new Color(0xffffee);
  
  return (
    <group ref={sceneRef}>
      {/* Ambient light for overall scene illumination */}
      <ambientLight intensity={0.3} color={ambientLightColor} />
      
      {/* Main directional light (sun-like) */}
      <directionalLight 
        position={[0, 100, 0]} 
        intensity={1.5} 
        color={directionalLightColor} 
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={1000}
        shadow-camera-near={0.5}
      />
      
      {/* Stanton star at center of the scene */}
      <Star position={[0, 0, 0]} radius={0.695} />  {/* Stanton radius in Gm */}
      
      {/* Grid for spatial reference */}
      <Grid size={100} divisions={100} />
    </group>
  );
}; 