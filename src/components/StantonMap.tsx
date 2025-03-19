import { useState, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import StarSystemService from '../services/StarSystemService';
import { CelestialBody } from '../models/CelestialBody';
import * as THREE from 'three';

const StantonMap = () => {
  const [bodies, setBodies] = useState<CelestialBody[]>([]);
  const [hoveredBody, setHoveredBody] = useState<CelestialBody | null>(null);
  
  useEffect(() => {
    // Get all celestial bodies for rendering
    setBodies(StarSystemService.getAllBodies());
  }, []);
  
  return (
    <group>
      {bodies.map((body) => (
        <CelestialBodyMesh 
          key={body.name} 
          body={body} 
          onHover={setHoveredBody}
        />
      ))}
      
      {hoveredBody && (
        <group position={[hoveredBody.position.x, hoveredBody.position.y, hoveredBody.position.z]}>
          <Billboard
            follow={true}
            lockX={false}
            lockY={false}
            lockZ={false}
          >
            <Text
              position={[0, 2, 0]}
              fontSize={0.5}
              color="white"
              anchorX="center"
              anchorY="middle"
            >
              {hoveredBody.label}
            </Text>
            {hoveredBody.description && (
              <Text
                position={[0, 1.5, 0]}
                fontSize={0.25}
                color="white"
                anchorX="center"
                anchorY="middle"
                maxWidth={10}
              >
                {hoveredBody.description}
              </Text>
            )}
          </Billboard>
        </group>
      )}
    </group>
  );
};

interface CelestialBodyMeshProps {
  body: CelestialBody;
  onHover: (body: CelestialBody | null) => void;
}

const CelestialBodyMesh = ({ body, onHover }: CelestialBodyMeshProps) => {
  const scale = StarSystemService.getBodyScale(body);
  const bodyColor = StarSystemService.getBodyColor(body);
  
  // For stars add a glow effect
  const isStarOrPlanet = body.type === 'star' || body.type === 'planet';
  
  // Simple animation for stars (pulsating)
  useFrame(({ clock }) => {
    if (body.type === 'star') {
      const elapsedTime = clock.getElapsedTime();
      const scale = StarSystemService.getBodyScale(body);
      const pulsate = scale * (1 + Math.sin(elapsedTime) * 0.05);
      (bodyMeshRef.current as any).scale.set(pulsate, pulsate, pulsate);
    }
  });
  
  const bodyMeshRef = useRef<THREE.Mesh>(null);
  
  return (
    <group 
      position={[body.position.x, body.position.y, body.position.z]}
      onPointerOver={() => onHover(body)}
      onPointerOut={() => onHover(null)}
    >
      <mesh ref={bodyMeshRef}>
        <sphereGeometry args={[scale, 32, 32]} />
        <meshStandardMaterial 
          color={bodyColor}
          emissive={isStarOrPlanet ? bodyColor : undefined} 
          emissiveIntensity={body.type === 'star' ? 2 : 0.1}
        />
      </mesh>
      
      {/* Show label for larger bodies like stars and planets */}
      {(body.type === 'star' || body.type === 'planet') && (
        <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
          <Text 
            position={[0, scale + 0.5, 0]} 
            fontSize={0.3} 
            color="white" 
            anchorX="center" 
            anchorY="middle"
          >
            {body.label}
          </Text>
        </Billboard>
      )}
    </group>
  );
};

export default StantonMap; 