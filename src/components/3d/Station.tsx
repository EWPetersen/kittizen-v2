import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Box } from '@react-three/drei';
import { Color, Vector3, BoxGeometry, EdgesGeometry, LineSegments, LineBasicMaterial } from 'three';
import { CelestialType, SCALE_FACTOR, LABEL_OFFSET } from './constants';
import { OrbitalPath } from './OrbitalPath';

interface StationProps {
  name: string;
  position?: [number, number, number];
  orbitData?: {
    parentPosition: [number, number, number];
    semiMajorAxis: number;
    eccentricity?: number;
    inclination?: number;
    rotation?: number;
  };
  size?: number; // in km
  color?: string;
  rotationPeriod?: number; // in hours
  onClick?: () => void;
  onDoubleClick?: () => void;
  isSelected?: boolean;
}

export const Station: React.FC<StationProps> = ({
  name,
  position = [0, 0, 0],
  orbitData,
  size = 5, // Default size 5 km
  color = '#88ddff',
  rotationPeriod = 12,
  onClick,
  onDoubleClick,
  isSelected = false
}) => {
  const stationRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  
  // Convert size from km to scene units
  const scaledSize = size / 1000000 * SCALE_FACTOR; // km to Gm * SCALE_FACTOR
  
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
  
  // Custom holographic station mesh
  const stationMesh = useMemo(() => {
    // Create basic cube geometry for the station
    const boxGeometry = new BoxGeometry(scaledSize, scaledSize * 0.5, scaledSize * 0.8);
    
    // Create edges for holographic effect
    const edges = new EdgesGeometry(boxGeometry);
    const lineMaterial = new LineBasicMaterial({ 
      color: new Color(color), 
      transparent: true, 
      opacity: 0.8,
      linewidth: 1,
    });
    
    return new LineSegments(edges, lineMaterial);
  }, [scaledSize, color]);
  
  // Animation for rotation
  useFrame(({ clock }) => {
    if (stationRef.current) {
      // Convert rotation period from hours to seconds for animation
      const rotationSpeed = (Math.PI * 2) / (rotationPeriod * 60 * 60);
      stationRef.current.rotation.y += rotationSpeed * clock.getDelta() * 2; // Faster rotation for stations
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
      {/* Station mesh */}
      <group 
        ref={stationRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        <primitive object={stationMesh} />
        
        {/* Holographic glow */}
        <pointLight
          color={color}
          intensity={0.5}
          distance={scaledSize * 10}
          decay={2}
        />
      </group>
      
      {/* Selection indicator */}
      {isSelected && (
        <Box args={[scaledSize * 1.2, scaledSize * 1.2, scaledSize * 1.2]}>
          <meshBasicMaterial color="#ffffff" transparent opacity={0.2} wireframe />
        </Box>
      )}
      
      {/* Station label */}
      <Html 
        position={[0, scaledSize * LABEL_OFFSET * 2, 0]}
        center
        className="station-label"
        style={{
          color: '#ffffff',
          background: isSelected || hovered ? 'rgba(30, 180, 255, 0.7)' : 'rgba(10, 80, 120, 0.5)',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '9px',
          fontFamily: 'monospace',
          pointerEvents: 'none',
          opacity: hovered || isSelected ? 1 : 0.6,
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
          type={CelestialType.STATION}
          dashed={true}
        />
      )}
    </group>
  );
}; 