import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Html } from '@react-three/drei';
import { Color, Vector3, ShaderMaterial, MeshStandardMaterial } from 'three';
import { CelestialType, SCALE_FACTOR, LABEL_OFFSET } from './constants';
import { OrbitalPath } from './OrbitalPath';

// Vertex shader for atmosphere effect
const atmosphereVertexShader = `
  varying vec3 vNormal;
  varying vec2 vUv;
  
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Fragment shader for atmosphere effect
const atmosphereFragmentShader = `
  uniform vec3 atmosphereColor;
  uniform float atmosphereIntensity;
  varying vec3 vNormal;
  
  void main() {
    float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
    gl_FragColor = vec4(atmosphereColor, intensity * atmosphereIntensity);
  }
`;

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
}

export const Planet: React.FC<PlanetProps> = ({
  name,
  position,
  orbitData,
  diameter,
  color = '#aabbcc',
  atmosphereColor = '#88aaff',
  atmosphereIntensity = 0.3,
  rotationPeriod = 24,
  onClick,
  onDoubleClick,
  isSelected = false,
  children
}) => {
  const planetRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
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
  
  // Create atmosphere material
  const atmosphereMaterial = useMemo(() => {
    return new ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      uniforms: {
        atmosphereColor: { value: new Color(atmosphereColor) },
        atmosphereIntensity: { value: atmosphereIntensity }
      },
      transparent: true,
      blending: 2, // AdditiveBlending
      side: 1, // BackSide
    });
  }, [atmosphereColor, atmosphereIntensity]);
  
  return (
    <group position={calculatedPosition}>
      {/* Planet mesh */}
      <Sphere 
        ref={planetRef}
        args={[radius, 64, 64]} 
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        <meshStandardMaterial 
          color={color} 
          roughness={0.8} 
          metalness={0.2}
          emissive={new Color(color).multiplyScalar(0.05)}
        />
      </Sphere>
      
      {/* Atmosphere */}
      <Sphere 
        ref={atmosphereRef}
        args={[radius * 1.025, 64, 64]}
      >
        <primitive object={atmosphereMaterial} attach="material" />
      </Sphere>
      
      {/* Selection indicator */}
      {isSelected && (
        <Sphere args={[radius * 1.1, 32, 32]}>
          <meshBasicMaterial color="#ffffff" transparent opacity={0.2} wireframe />
        </Sphere>
      )}
      
      {/* Planet label */}
      <Html 
        position={[0, radius * LABEL_OFFSET, 0]}
        center
        className="planet-label"
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
          type={CelestialType.PLANET}
        />
      )}
      
      {/* Children (moons, stations, etc.) */}
      {children}
    </group>
  );
}; 