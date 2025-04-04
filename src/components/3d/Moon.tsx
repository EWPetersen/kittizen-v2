import React, { useRef, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sphere, Html } from '@react-three/drei';
import { Color, Vector3 } from 'three';
import { CelestialType, SCALE_FACTOR, LABEL_OFFSET, VISUAL_SCALE_FACTORS, getAdaptiveScale } from './constants';
import { OrbitalPath } from './OrbitalPath';

interface MoonProps {
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
  rotationPeriod?: number; // in hours
  onClick?: () => void;
  onDoubleClick?: () => void;
  isSelected?: boolean;
  children?: React.ReactNode;
  debug?: boolean; // Flag to enable debug rendering
}

export const Moon: React.FC<MoonProps> = ({
  name,
  position,
  orbitData,
  diameter,
  color = '#aaaaaa',
  rotationPeriod = 24,
  onClick,
  onDoubleClick,
  isSelected = false,
  children,
  debug = false
}) => {
  const moonRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const { camera } = useThree();
  
  // Apply visual scale factor for better visibility
  const visualScaleFactor = VISUAL_SCALE_FACTORS.MOON;
  
  // Calculate position based on orbit if position not explicitly provided
  const calculatedPosition = useMemo(() => {
    if (position) {
      if (debug) {
        console.debug(`Moon ${name} using explicit position:`, position);
      }
      return new Vector3(...position);
    }
    
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
        console.debug(`Moon ${name} orbital calculation:`, {
          parent: parent.toArray(),
          parentName: "Unknown", // Add parent name if available
          distance: distance.toFixed(3),
          rawDistance: orbitData.semiMajorAxis,
          scaleFactor: SCALE_FACTOR,
          inclination,
          rotation,
          calculatedPosition: [x, y, z],
          orbitData
        });
      }
      
      return new Vector3(x, y, z);
    }
    
    if (debug) {
      console.warn(`Moon ${name} has no position or orbit data`);
    }
    return new Vector3(0, 0, 0);
  }, [position, orbitData, debug, name]);
  
  // Calculate adaptive size based on camera distance
  const adaptiveRadius = useMemo(() => {
    // Get distance from camera to object
    const cameraDistance = calculatedPosition.distanceTo(camera.position);
    
    // Base radius calculation (same as before)
    const baseRadius = (diameter / 2) / 1000000 * SCALE_FACTOR;
    
    // Apply adaptive scaling based on camera distance
    const adaptiveSize = getAdaptiveScale(baseRadius, CelestialType.MOON, cameraDistance);
    
    if (debug) {
      console.debug(`Moon ${name} adaptive sizing:`, {
        baseRadius,
        cameraDistance,
        adaptiveSize
      });
    }
    
    return adaptiveSize;
  }, [camera.position, calculatedPosition, diameter, debug, name]);
  
  // Animation for rotation
  useFrame(({ clock }) => {
    if (moonRef.current) {
      // Convert rotation period from hours to seconds for animation
      const rotationSpeed = (Math.PI * 2) / (rotationPeriod * 60 * 60);
      moonRef.current.rotation.y += rotationSpeed * clock.getDelta();
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
      {/* Moon mesh - using adaptive radius */}
      <Sphere 
        ref={moonRef}
        args={[adaptiveRadius, 32, 32]} 
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        <meshStandardMaterial 
          color={color} 
          roughness={0.9}
          metalness={0.1}
        />
      </Sphere>
      
      {/* Selection indicator - using adaptive radius */}
      {isSelected && (
        <Sphere args={[adaptiveRadius * 1.1, 16, 16]}>
          <meshBasicMaterial color="#ffffff" transparent opacity={0.2} wireframe />
        </Sphere>
      )}
      
      {/* Moon label - using adaptive radius */}
      <Html 
        position={[0, adaptiveRadius * LABEL_OFFSET, 0]}
        center
        className="moon-label"
        style={{
          color: 'white',
          backgroundColor: isSelected ? 'rgba(0,100,255,0.7)' : (hovered ? 'rgba(0,70,180,0.5)' : 'rgba(0,0,0,0.5)'),
          padding: '3px 6px',
          borderRadius: '4px',
          fontSize: '12px',
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
          type={CelestialType.MOON}
        />
      )}
      
      {/* Children (stations, etc.) */}
      {children}
    </group>
  );
}; 