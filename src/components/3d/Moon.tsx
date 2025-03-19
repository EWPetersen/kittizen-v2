import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Html } from '@react-three/drei';
import { Color, Vector3 } from 'three';
import { CelestialType, SCALE_FACTOR, LABEL_OFFSET } from './constants';
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
  children
}) => {
  const moonRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  // Convert diameter from km to scene units
  const radius = (diameter / 2) / 1000000 * SCALE_FACTOR; // km to Gm * SCALE_FACTOR
  
  // Calculate position based on orbit if position not explicitly provided
  const calculatedPosition = useMemo(() => {
    if (position) return new Vector3(...position);
    if (orbitData) {
      // For now, just place at semimajor axis distance along x-axis
      // In real implementation, this would be based on time and orbital parameters
      const parent = new Vector3(...orbitData.parentPosition);
      return new Vector3(
        parent.x + orbitData.semiMajorAxis * SCALE_FACTOR,
        parent.y,
        parent.z
      );
    }
    return new Vector3(0, 0, 0);
  }, [position, orbitData]);
  
  // Animation for rotation
  useFrame(({ clock }) => {
    if (moonRef.current) {
      // Convert rotation period from hours to seconds for animation
      const rotationSpeed = (Math.PI * 2) / (rotationPeriod * 60 * 60);
      moonRef.current.rotation.y += rotationSpeed * clock.getDelta();
    }
  });
  
  // Handle events
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
      {/* Moon mesh */}
      <Sphere 
        ref={moonRef}
        args={[radius, 32, 32]} 
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        <meshStandardMaterial 
          color={color} 
          roughness={0.9} 
          metalness={0.1}
          map={undefined} // Would use a texture here in a full implementation
        />
      </Sphere>
      
      {/* Selection indicator */}
      {isSelected && (
        <Sphere args={[diameter * 1.1, 16, 16]}>
          <meshBasicMaterial color="#ffffff" transparent opacity={0.2} wireframe />
        </Sphere>
      )}
      
      {/* Moon label */}
      <Html 
        position={[0, radius * LABEL_OFFSET, 0]}
        center
        className="moon-label"
        style={{
          color: '#ffffff',
          background: isSelected || hovered ? 'rgba(50, 120, 200, 0.7)' : 'rgba(30, 60, 100, 0.5)',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '10px',
          fontFamily: 'monospace',
          pointerEvents: 'none',
          opacity: hovered || isSelected ? 1 : 0.7,
          transition: 'all 0.2s ease',
          transform: 'translateY(-50%)',
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