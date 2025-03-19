import React, { useRef, useMemo } from 'react';
import { Sphere } from '@react-three/drei';
import { Color, ShaderMaterial } from 'three';

// Vertex shader for atmosphere
const atmosphereVertexShader = `
varying vec3 vNormal;
varying vec3 vWorldPosition;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// Fragment shader for atmosphere
const atmosphereFragmentShader = `
uniform vec3 glowColor;
uniform float intensity;

varying vec3 vNormal;
varying vec3 vWorldPosition;

void main() {
  float atmosphere = pow(0.75 - dot(vNormal, vec3(0, 0, 1.0)), 4.0);
  gl_FragColor = vec4(glowColor, atmosphere * intensity);
}
`;

interface AtmosphereProps {
  radius: number;
  color?: string;
  intensity?: number;
}

export const Atmosphere: React.FC<AtmosphereProps> = ({
  radius,
  color = '#88EEFF',
  intensity = 0.3
}) => {
  const atmosphereRef = useRef<THREE.Mesh>(null);

  // Create atmosphere material with shaders
  const atmosphereMaterial = useMemo(() => {
    return new ShaderMaterial({
      uniforms: {
        glowColor: { value: new Color(color) },
        intensity: { value: intensity }
      },
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      transparent: true,
      side: 2 // FrontSide + BackSide
    });
  }, [color, intensity]);

  return (
    <Sphere
      ref={atmosphereRef}
      args={[radius * 1.025, 32, 32]}
    >
      <primitive object={atmosphereMaterial} attach="material" />
    </Sphere>
  );
}; 