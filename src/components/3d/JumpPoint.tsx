import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Ring, Sphere } from '@react-three/drei';
import { Color, Vector3, TorusGeometry, MeshBasicMaterial, Mesh } from 'three';
import { CelestialType, SCALE_FACTOR, LABEL_OFFSET } from './constants';
import { OrbitalPath } from './OrbitalPath';

interface JumpPointProps {
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
  destination?: string;
  onClick?: () => void;
  onDoubleClick?: () => void;
  isSelected?: boolean;
}

export const JumpPoint: React.FC<JumpPointProps> = ({
  name,
  position,
  orbitData,
  size = 20, // Default size 20 km
  color = '#ffaa22',
  destination,
  onClick,
  onDoubleClick,
  isSelected = false
}) => {
  const outerRingRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  // Convert size from km to scene units
  const scaledSize = size / 1000000 * SCALE_FACTOR; // km to Gm * SCALE_FACTOR
  
  // Calculate position based on orbit if position not explicitly provided
  const calculatedPosition = useMemo(() => {
    if (position) return new Vector3(...position);
    if (orbitData) {
      const parent = new Vector3(...orbitData.parentPosition);
      return new Vector3(
        parent.x + orbitData.semiMajorAxis * SCALE_FACTOR,
        parent.y,
        parent.z
      );
    }
    return new Vector3(0, 0, 0);
  }, [position, orbitData]);
  
  // Animation for rings rotation
  useFrame(({ clock }) => {
    if (outerRingRef.current && innerRingRef.current) {
      const time = clock.getElapsedTime();
      
      // Outer ring rotates one way
      outerRingRef.current.rotation.z = time * 0.2;
      outerRingRef.current.rotation.x = Math.sin(time * 0.1) * 0.2;
      
      // Inner ring rotates the opposite way
      innerRingRef.current.rotation.z = -time * 0.3;
      innerRingRef.current.rotation.y = Math.cos(time * 0.15) * 0.2;
      
      // Pulse effect based on hover or selection
      const pulseIntensity = Math.sin(time * 2) * 0.2 + 0.8;
      const baseOpacity = hovered || isSelected ? 0.9 : 0.7;
      
      if (outerRingRef.current.material instanceof MeshBasicMaterial) {
        outerRingRef.current.material.opacity = baseOpacity * pulseIntensity;
      }
      
      if (innerRingRef.current.material instanceof MeshBasicMaterial) {
        innerRingRef.current.material.opacity = baseOpacity * (1 - (pulseIntensity - 0.8));
      }
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
    <group 
      position={calculatedPosition}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* Outer ring */}
      <Ring
        ref={outerRingRef}
        args={[scaledSize, scaledSize * 1.1, 32]}
      >
        <meshBasicMaterial 
          color={color} 
          transparent={true} 
          opacity={0.7}
          side={2} // DoubleSide
        />
      </Ring>
      
      {/* Inner ring */}
      <Ring
        ref={innerRingRef}
        args={[scaledSize * 0.6, scaledSize * 0.7, 32]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <meshBasicMaterial 
          color={new Color(color).getHex() + 0x223344} // Slightly different color
          transparent={true} 
          opacity={0.7}
          side={2} // DoubleSide
        />
      </Ring>
      
      {/* Center glow */}
      <pointLight
        color={color}
        intensity={1.5}
        distance={scaledSize * 15}
        decay={2}
      />
      
      {/* Selection indicator */}
      {isSelected && (
        <Sphere args={[scaledSize * 1.2, 16, 16]}>
          <meshBasicMaterial color="#ffffff" transparent opacity={0.2} wireframe />
        </Sphere>
      )}
      
      {/* Jump point label */}
      <Html 
        position={[0, scaledSize * LABEL_OFFSET * 2, 0]}
        center
        className="jump-point-label"
        style={{
          color: '#ffffff',
          background: isSelected || hovered ? 'rgba(255, 160, 30, 0.7)' : 'rgba(100, 60, 10, 0.5)',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '9px',
          fontFamily: 'monospace',
          pointerEvents: 'none',
          opacity: isSelected || hovered ? 1 : 0.7,
          transition: 'all 0.2s ease',
          transform: 'translateY(-50%)',
        }}
      >
        {name}
        {destination && (
          <div style={{ fontSize: '8px', opacity: 0.8 }}>
            → {destination}
          </div>
        )}
      </Html>
      
      {/* Orbital path */}
      {orbitData && (
        <OrbitalPath
          parentPosition={orbitData.parentPosition}
          semiMajorAxis={orbitData.semiMajorAxis}
          eccentricity={orbitData.eccentricity || 0}
          inclination={orbitData.inclination || 0}
          rotation={orbitData.rotation || 0}
          type={CelestialType.JUMP_POINT}
          dashed={true}
        />
      )}
    </group>
  );
}; 