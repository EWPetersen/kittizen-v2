import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Html } from '@react-three/drei';
import { Color, Vector3 } from 'three';
import { CelestialType, SCALE_FACTOR, LABEL_OFFSET, VISUAL_SCALE_FACTORS } from './constants';
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
  
  // Apply visual scale factor for better visibility
  const visualScaleFactor = VISUAL_SCALE_FACTORS.MOON;
  
  // Convert diameter from km to scene units, with visual scaling
  const radius = (diameter / 2) / 1000000 * SCALE_FACTOR * visualScaleFactor;
  
  // Log debug info if debug flag is set
  React.useEffect(() => {
    if (debug) {
      console.debug(`Moon ${name}:`, {
        position: position ? {
          x: position[0].toFixed(4),
          y: position[1].toFixed(4),
          z: position[2].toFixed(4)
        } : 'None',
        orbitData: orbitData ? {
          parentPosition: orbitData.parentPosition ? {
            x: orbitData.parentPosition[0].toFixed(4),
            y: orbitData.parentPosition[1].toFixed(4),
            z: orbitData.parentPosition[2].toFixed(4)
          } : 'None',
          semiMajorAxis: orbitData.semiMajorAxis
        } : 'None',
        diameter,
        radius: (diameter / 2) / 1000000 * SCALE_FACTOR, // Actual radius without visual scale
        visualRadius: radius, // Scaled radius for display
        visualScaleFactor
      });
    }
  }, [name, position, orbitData, diameter, radius, debug, visualScaleFactor]);
  
  // Calculate position based on orbit if position not explicitly provided
  const calculatedPosition = useMemo(() => {
    // If we have orbitData (which includes the parent's position), use it for positioning
    // rather than the absolute position from the data
    if (orbitData) {
      const parent = new Vector3(...orbitData.parentPosition);
      // Add a random offset around the parent based on semi-major axis
      // This creates a more visually appealing arrangement of moons
      const angle = name.charCodeAt(0) * 0.5; // Use name to create a consistent angle
      return new Vector3(
        parent.x + Math.cos(angle) * orbitData.semiMajorAxis,
        parent.y + Math.sin(angle) * orbitData.semiMajorAxis,
        parent.z
      );
    }
    // Fall back to absolute position if no orbit data
    if (position) return new Vector3(...position);
    
    return new Vector3(0, 0, 0);
  }, [position, orbitData, name]);
  
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
        />
      </Sphere>
      
      {/* Selection indicator */}
      {isSelected && (
        <Sphere args={[radius * 1.1, 16, 16]}>
          <meshBasicMaterial color="#ffffff" transparent opacity={0.2} wireframe />
        </Sphere>
      )}
      
      {/* Moon label */}
      <Html 
        position={[0, radius * LABEL_OFFSET, 0]}
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