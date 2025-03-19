import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Html } from '@react-three/drei';
import { Color, ShaderMaterial, Vector3 } from 'three';
import { SCALE_FACTOR } from './constants';

// Vertex shader for the star's surface
const vertexShader = `
  varying vec3 vNormal;
  varying vec2 vUv;
  
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Fragment shader for the star's surface
const fragmentShader = `
  uniform float time;
  uniform vec3 color;
  varying vec3 vNormal;
  varying vec2 vUv;
  
  // Simplex noise function - simplified for this example
  float noise(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }
  
  void main() {
    float n = noise(vUv + time * 0.05);
    float intensity = 1.15 - dot(vNormal, vec3(0.0, 0.0, 1.0));
    
    // Create pulsating glow effect
    float pulse = 0.5 + 0.5 * sin(time * 0.5);
    float glow = min(max(pulse * intensity, 0.0), 1.0);
    
    // Add noise for surface details
    float noiseIntensity = mix(0.7, 1.0, n);
    
    vec3 finalColor = color * noiseIntensity;
    finalColor += color * glow * 0.6;
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

interface StarProps {
  position?: [number, number, number];
  diameter?: number;
  color?: string;
  name?: string;
  onClick?: () => void;
  onDoubleClick?: () => void;
  isSelected?: boolean;
}

export const Star: React.FC<StarProps> = ({
  position = [0, 0, 0],
  diameter = 1.0,
  color = '#ffaa44',
  name,
  onClick,
  onDoubleClick,
  isSelected = false
}) => {
  const materialRef = useRef<ShaderMaterial>(null);
  const starColor = new Color(color);
  
  // Scale the radius based on our scale factor
  const radius = diameter / 2;
  
  // Use useFrame to update the shader time uniform
  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = clock.getElapsedTime();
    }
  });
  
  // Handle user interactions
  const handleClick = (e: any) => {
    e.stopPropagation();
    if (onClick) onClick();
  };
  
  const handleDoubleClick = (e: any) => {
    e.stopPropagation();
    if (onDoubleClick) onDoubleClick();
  };
  
  // Create a glowing point light at the star's center
  return (
    <group position={new Vector3(...position)}>
      {/* Realistic star sphere with custom shader */}
      <mesh 
        castShadow
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        <sphereGeometry args={[radius, 64, 64]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={{
            time: { value: 0 },
            color: { value: starColor },
          }}
        />
      </mesh>
      
      {/* Glow effect using point light */}
      <pointLight 
        color={color} 
        intensity={10} 
        distance={100 * radius} 
        decay={2} 
      />
      
      {/* Lens flare effect */}
      <Sphere args={[radius * 1.05, 32, 32]} position={[0, 0, 0]}>
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.15} 
        />
      </Sphere>
      
      {/* Selection indicator */}
      {isSelected && (
        <Sphere args={[radius * 1.15, 16, 16]} position={[0, 0, 0]}>
          <meshBasicMaterial 
            color="#ffffff" 
            transparent 
            opacity={0.2} 
            wireframe
          />
        </Sphere>
      )}
      
      {/* Label */}
      {name && (
        <Html
          position={[0, radius * 1.4, 0]}
          center
          style={{
            color: 'white',
            backgroundColor: isSelected ? 'rgba(0,100,255,0.7)' : 'rgba(0,0,0,0.5)',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            userSelect: 'none'
          }}
        >
          {name}
        </Html>
      )}
    </group>
  );
}; 