import React, { useRef, useState, useEffect } from 'react';
import { Color, Vector3 } from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Grid } from './Grid';
import { Star } from './Star';
import { Planet } from './Planet';
import { Moon } from './Moon';
import { Station } from './Station';
import { JumpPoint } from './JumpPoint';
import { SCALE_FACTOR, CelestialType, FOCUS_ANIMATION_DURATION } from './constants';

interface SceneProps {
  onSelectObject?: (objectId: string | null) => void;
}

// Mock data - in a full implementation, this would come from the stanton_system_map.json
const mockData = {
  star: {
    name: "Stanton",
    diameter: 696000, // km
    color: "#F9D71C",
    position: [0, 0, 0] as [number, number, number]
  },
  planets: [
    {
      name: "microTech",
      diameter: 1000, // km
      color: "#EDF5FA",
      atmosphereColor: "#88EEFF",
      atmosphereIntensity: 0.5,
      orbitData: {
        parentPosition: [0, 0, 0] as [number, number, number],
        semiMajorAxis: 22.5, // Gm
        eccentricity: 0.05,
        inclination: 2,
        rotation: 45
      },
      moons: [
        {
          name: "Clio",
          diameter: 287, // km
          color: "#AABBCC",
          orbitData: {
            parentPosition: [22.5, 0, 0] as [number, number, number],
            semiMajorAxis: 1.2, // Gm
            eccentricity: 0.01,
            inclination: 5,
            rotation: 10
          }
        }
      ],
      stations: [
        {
          name: "New Babbage",
          size: 10, // km
          color: "#88DDFF",
          orbitData: {
            parentPosition: [22.5, 0, 0] as [number, number, number],
            semiMajorAxis: 0.3, // Gm
            eccentricity: 0,
            inclination: 0,
            rotation: 0
          }
        }
      ]
    },
    {
      name: "ArcCorp",
      diameter: 800, // km
      color: "#CC2222",
      atmosphereColor: "#FF6644",
      atmosphereIntensity: 0.6,
      orbitData: {
        parentPosition: [0, 0, 0] as [number, number, number],
        semiMajorAxis: 15.3, // Gm
        eccentricity: 0.02,
        inclination: 1.5,
        rotation: 120
      }
    }
  ],
  jumpPoints: [
    {
      name: "Stanton-Pyro Jump",
      size: 20, // km
      color: "#FFAA22",
      destination: "Pyro System",
      orbitData: {
        parentPosition: [0, 0, 0] as [number, number, number],
        semiMajorAxis: 30, // Gm
        eccentricity: 0.1,
        inclination: 15,
        rotation: 75
      }
    }
  ]
};

export const Scene: React.FC<SceneProps> = ({ onSelectObject }) => {
  const sceneRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [focusTarget, setFocusTarget] = useState<Vector3 | null>(null);
  const [focusDistance, setFocusDistance] = useState<number | null>(null);
  
  // Update scene on each frame
  useFrame(({ clock }) => {
    // Animate camera focus if needed
    if (focusTarget && focusDistance !== null) {
      const currentPosition = camera.position.clone();
      const targetDirection = focusTarget.clone().sub(currentPosition).normalize();
      const targetPosition = focusTarget.clone().add(
        targetDirection.multiplyScalar(-focusDistance)
      );
      
      // Smooth camera movement
      camera.position.lerp(targetPosition, 0.05);
      camera.lookAt(focusTarget);
    }
  });
  
  // Handle object selection
  const handleSelectObject = (name: string) => {
    const newSelected = name === selectedObject ? null : name;
    setSelectedObject(newSelected);
    
    // Propagate selection to parent component if onSelectObject is provided
    if (onSelectObject) {
      onSelectObject(newSelected);
    }
  };
  
  // Focus camera on object when selected
  useEffect(() => {
    if (!selectedObject) {
      // Reset to default view if nothing selected
      setFocusTarget(null);
      return;
    }
    
    // Find the selected object in our data
    let targetPosition = new Vector3();
    let targetSize = 1;
    
    // Check if it's the star
    if (selectedObject === mockData.star.name) {
      targetPosition = new Vector3(...mockData.star.position);
      targetSize = mockData.star.diameter / 1000000 * SCALE_FACTOR;
    } else {
      // Check planets
      for (const planet of mockData.planets) {
        if (selectedObject === planet.name) {
          const pos = new Vector3(
            planet.orbitData.parentPosition[0] + planet.orbitData.semiMajorAxis * SCALE_FACTOR,
            planet.orbitData.parentPosition[1],
            planet.orbitData.parentPosition[2]
          );
          targetPosition = pos;
          targetSize = planet.diameter / 1000000 * SCALE_FACTOR;
          break;
        }
        
        // Check moons of this planet
        if (planet.moons) {
          for (const moon of planet.moons) {
            if (selectedObject === moon.name) {
              const planetPos = new Vector3(
                planet.orbitData.parentPosition[0] + planet.orbitData.semiMajorAxis * SCALE_FACTOR,
                planet.orbitData.parentPosition[1],
                planet.orbitData.parentPosition[2]
              );
              const pos = new Vector3(
                planetPos.x + moon.orbitData.semiMajorAxis * SCALE_FACTOR,
                planetPos.y,
                planetPos.z
              );
              targetPosition = pos;
              targetSize = moon.diameter / 1000000 * SCALE_FACTOR;
              break;
            }
          }
        }
        
        // Check stations of this planet
        if (planet.stations) {
          for (const station of planet.stations) {
            if (selectedObject === station.name) {
              const planetPos = new Vector3(
                planet.orbitData.parentPosition[0] + planet.orbitData.semiMajorAxis * SCALE_FACTOR,
                planet.orbitData.parentPosition[1],
                planet.orbitData.parentPosition[2]
              );
              const pos = new Vector3(
                planetPos.x + station.orbitData.semiMajorAxis * SCALE_FACTOR,
                planetPos.y,
                planetPos.z
              );
              targetPosition = pos;
              targetSize = station.size / 1000000 * SCALE_FACTOR;
              break;
            }
          }
        }
      }
      
      // Check jump points
      for (const jumpPoint of mockData.jumpPoints) {
        if (selectedObject === jumpPoint.name) {
          const pos = new Vector3(
            jumpPoint.orbitData.parentPosition[0] + jumpPoint.orbitData.semiMajorAxis * SCALE_FACTOR,
            jumpPoint.orbitData.parentPosition[1],
            jumpPoint.orbitData.parentPosition[2]
          );
          targetPosition = pos;
          targetSize = jumpPoint.size / 1000000 * SCALE_FACTOR;
          break;
        }
      }
    }
    
    // Set focus target and distance based on size
    setFocusTarget(targetPosition);
    setFocusDistance(targetSize * 10); // Distance based on size
    
  }, [selectedObject]);
  
  // Light colors that match Star Citizen aesthetic
  const ambientLightColor = new Color(0x222233);
  const directionalLightColor = new Color(0xffffee);
  
  return (
    <group ref={sceneRef}>
      {/* Ambient light for overall scene illumination */}
      <ambientLight intensity={0.3} color={ambientLightColor} />
      
      {/* Main directional light (sun-like) */}
      <directionalLight 
        position={[0, 100, 0]} 
        intensity={1.5} 
        color={directionalLightColor} 
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={1000}
        shadow-camera-near={0.5}
      />
      
      {/* Stanton star at center of the scene */}
      <Star 
        position={mockData.star.position} 
        radius={mockData.star.diameter / 1000000} 
        color={mockData.star.color} 
      />
      
      {/* Planets */}
      {mockData.planets.map((planet) => (
        <Planet
          key={planet.name}
          name={planet.name}
          diameter={planet.diameter}
          color={planet.color}
          atmosphereColor={planet.atmosphereColor}
          atmosphereIntensity={planet.atmosphereIntensity}
          orbitData={planet.orbitData}
          onSelect={handleSelectObject}
          selected={selectedObject === planet.name}
        >
          {/* Moons of this planet */}
          {planet.moons?.map((moon) => (
            <Moon
              key={moon.name}
              name={moon.name}
              diameter={moon.diameter}
              color={moon.color}
              orbitData={moon.orbitData}
              onSelect={handleSelectObject}
              selected={selectedObject === moon.name}
            />
          ))}
          
          {/* Stations around this planet */}
          {planet.stations?.map((station) => (
            <Station
              key={station.name}
              name={station.name}
              size={station.size}
              color={station.color}
              orbitData={station.orbitData}
              onSelect={handleSelectObject}
              selected={selectedObject === station.name}
            />
          ))}
        </Planet>
      ))}
      
      {/* Jump Points */}
      {mockData.jumpPoints.map((jumpPoint) => (
        <JumpPoint
          key={jumpPoint.name}
          name={jumpPoint.name}
          size={jumpPoint.size}
          color={jumpPoint.color}
          destination={jumpPoint.destination}
          orbitData={jumpPoint.orbitData}
          onSelect={handleSelectObject}
          selected={selectedObject === jumpPoint.name}
        />
      ))}
      
      {/* Grid for spatial reference */}
      <Grid size={100} divisions={100} />
    </group>
  );
}; 