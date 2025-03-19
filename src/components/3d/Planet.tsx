import React, { useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sphere, Html } from '@react-three/drei';
import { Vector3 } from 'three';
import { CelestialType, SCALE_FACTOR, LABEL_OFFSET, getAdaptiveScale } from './constants';
import { OrbitalPath } from './OrbitalPath';
import { Atmosphere } from './Atmosphere';

interface PlanetProps {
  name: string;
  position?: [number, number, number];
  orbitData?: {
    parentPosition: [number, number, number];
    semiMajorAxis: number;
    eccentricity?: number;
    inclination?: number;
    rotation?: number;
  };
  diameter: number; // in km
  color?: string;
  atmosphereColor?: string;
  atmosphereIntensity?: number;
  rotationPeriod?: number; // in hours
  onClick?: () => void;
  onDoubleClick?: () => void;
  isSelected?: boolean;
  children?: React.ReactNode;
  debug?: boolean; // Flag to enable debug rendering
}

export const Planet: React.FC<PlanetProps> = ({
  name,
  position,
  orbitData,
  diameter,
  color = '#88aacc',
  atmosphereColor = '#88eeff',
  atmosphereIntensity = 0.3,
  rotationPeriod = 24,
  onClick,
  onDoubleClick,
  isSelected = false,
  children,
  debug = false
}) => {
  const planetRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const { camera } = useThree();
  
  // Calculate position based on orbit if position not explicitly provided
  const calculatedPosition = useMemo(() => {
    if (position) return new Vector3(...position);
    if (orbitData) {
      // Instead of placing only on x-axis, distribute around the parent
      // using inclination and rotation to determine the direction
      const parent = new Vector3(...orbitData.parentPosition);
      const inclination = orbitData.inclination || 0;
      const rotation = orbitData.rotation || 0;
      
      // Convert degrees to radians
      const inclinationRad = inclination * (Math.PI / 180);
      const rotationRad = rotation * (Math.PI / 180);
      
      // Calculate position using spherical coordinates
      const distance = orbitData.semiMajorAxis * SCALE_FACTOR;
      
      // Calculate x, y, z components
      const x = parent.x + distance * Math.cos(rotationRad) * Math.cos(inclinationRad);
      const y = parent.y + distance * Math.sin(rotationRad) * Math.cos(inclinationRad);
      const z = parent.z + distance * Math.sin(inclinationRad);
      
      if (debug) {
        console.debug(`Planet ${name} orbital calculation:`, {
          parent: parent.toArray(),
          distance,
          inclination,
          rotation,
          calculatedPosition: [x, y, z]
        });
      }
      
      return new Vector3(x, y, z);
    }
    return new Vector3(0, 0, 0);
  }, [position, orbitData, debug, name]);
  
  // Calculate adaptive size based on camera distance
  const adaptiveRadius = useMemo(() => {
    // Get distance from camera to object
    const cameraDistance = calculatedPosition.distanceTo(camera.position);
    
    // Base radius calculation
    const baseRadius = (diameter / 2) / 1000000 * SCALE_FACTOR;
    
    // Apply adaptive scaling based on camera distance
    const adaptiveSize = getAdaptiveScale(baseRadius, CelestialType.PLANET, cameraDistance);
    
    if (debug) {
      console.debug(`Planet ${name} adaptive sizing:`, {
        baseRadius,
        cameraDistance,
        adaptiveSize
      });
    }
    
    return adaptiveSize;
  }, [camera.position, calculatedPosition, diameter, debug, name]);
  
  // Animation for rotation
  useFrame(({ clock }) => {
    if (planetRef.current) {
      // Convert rotation period from hours to seconds for animation
      const rotationSpeed = (Math.PI * 2) / (rotationPeriod * 60 * 60);
      planetRef.current.rotation.y += rotationSpeed * clock.getDelta();
    }
  });
  
  // Handle hover and selection
  const handlePointerOver = () => setHovered(true);
  const handlePointerOut = () => setHovered(false);
  const handleClick = (e: any) => {
    e.stopPropagation();
    if (onClick) onClick();
  };
  const handleDoubleClick = (e: any) => {
    e.stopPropagation();
    if (onDoubleClick) onDoubleClick();
  };
  
  return (
    <group position={calculatedPosition}>
      {/* Planet mesh */}
      <Sphere 
        ref={planetRef}
        args={[adaptiveRadius, 32, 32]} 
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        <meshStandardMaterial 
          color={color} 
          roughness={0.8}
          metalness={0.1}
        />
      </Sphere>
      
      {/* Planet atmosphere */}
      {atmosphereColor && (
        <Atmosphere 
          radius={adaptiveRadius} 
          color={atmosphereColor} 
          intensity={atmosphereIntensity} 
        />
      )}
      
      {/* Selection indicator */}
      {isSelected && (
        <Sphere args={[adaptiveRadius * 1.1, 16, 16]}>
          <meshBasicMaterial color="#ffffff" transparent opacity={0.2} wireframe />
        </Sphere>
      )}
      
      {/* Planet label */}
      <Html 
        position={[0, adaptiveRadius * LABEL_OFFSET, 0]}
        center
        className="planet-label"
        style={{
          color: 'white',
          backgroundColor: isSelected ? 'rgba(0,100,255,0.7)' : (hovered ? 'rgba(0,70,180,0.5)' : 'rgba(0,0,0,0.5)'),
          padding: '3px 8px',
          borderRadius: '4px',
          fontSize: '14px',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          userSelect: 'none'
        }}
      >
        {name}
      </Html>
      
      {/* Orbital path */}
      {orbitData && (
        <OrbitalPath
          parentPosition={orbitData.parentPosition}
          semiMajorAxis={orbitData.semiMajorAxis}
          eccentricity={orbitData.eccentricity || 0}
          inclination={orbitData.inclination || 0}
          rotation={orbitData.rotation || 0}
          type={CelestialType.PLANET}
        />
      )}
      
      {/* Children */}
      {children}
    </group>
  );
}; 