import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Color, Vector3 } from 'three';
import { useThree } from '@react-three/fiber';
import { Grid } from './Grid';
import { Star } from './Star';
import { Planet } from './Planet';
import { Moon } from './Moon';
import { Station } from './Station';
import { JumpPoint } from './JumpPoint';
import { SCALE_FACTOR, CelestialType } from './constants';
import CameraController, { CameraMode, CameraControllerHandle } from './CameraController';

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
  const cameraControllerRef = useRef<CameraControllerHandle>(null);
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [currentCameraMode, setCurrentCameraMode] = useState<CameraMode>(CameraMode.OVERVIEW);

  // Export the camera controller API for external use via window object
  useEffect(() => {
    if (cameraControllerRef.current) {
      (window as any).sceneCameraController = cameraControllerRef.current;
    }
    
    return () => {
      // Clean up when component unmounts
      (window as any).sceneCameraController = null;
    };
  }, [cameraControllerRef.current]);

  // Handle object selection
  const handleSelectObject = useCallback((name: string) => {
    const newSelected = name === selectedObject ? null : name;
    setSelectedObject(newSelected);
    
    // Propagate selection to parent component if onSelectObject is provided
    if (onSelectObject) {
      onSelectObject(newSelected);
    }
  }, [selectedObject, onSelectObject]);
  
  // Handle double-click on celestial object
  const handleObjectDoubleClick = useCallback((name: string, position: Vector3, type: CelestialType, size: number) => {
    handleSelectObject(name);
    
    if (cameraControllerRef.current) {
      cameraControllerRef.current.changeFocus({
        position,
        objectType: type,
        objectSize: size,
        objectName: name
      });
    }
  }, [handleSelectObject]);
  
  // Light colors that match Star Citizen aesthetic
  const ambientLightColor = new Color(0x222233);
  const directionalLightColor = new Color(0xffffee);
  
  return (
    <group ref={sceneRef}>
      <CameraController 
        ref={cameraControllerRef}
        initialCameraMode={currentCameraMode}
        onFocusChange={(target) => {
          if (target) {
            setSelectedObject(target.objectName);
            if (onSelectObject) {
              onSelectObject(target.objectName);
            }
          }
        }}
      />
      
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
        name={mockData.star.name}
        diameter={mockData.star.diameter / 1000000 * SCALE_FACTOR} 
        color={mockData.star.color}
        onClick={() => handleSelectObject(mockData.star.name)}
        onDoubleClick={() => handleObjectDoubleClick(
          mockData.star.name, 
          new Vector3(...mockData.star.position),
          CelestialType.STAR,
          mockData.star.diameter / 1000000 * SCALE_FACTOR
        )}
        isSelected={selectedObject === mockData.star.name}
      />
      
      {/* Planets */}
      {mockData.planets.map(planet => {
        const position = new Vector3(
          planet.orbitData.parentPosition[0] + planet.orbitData.semiMajorAxis * SCALE_FACTOR,
          planet.orbitData.parentPosition[1],
          planet.orbitData.parentPosition[2]
        );
        
        return (
          <React.Fragment key={planet.name}>
            <Planet 
              position={[position.x, position.y, position.z]} 
              name={planet.name}
              diameter={planet.diameter / 1000000 * SCALE_FACTOR}
              color={planet.color}
              atmosphereColor={planet.atmosphereColor}
              atmosphereIntensity={planet.atmosphereIntensity}
              onClick={() => handleSelectObject(planet.name)}
              onDoubleClick={() => handleObjectDoubleClick(
                planet.name, 
                position,
                CelestialType.PLANET,
                planet.diameter / 1000000 * SCALE_FACTOR
              )}
              isSelected={selectedObject === planet.name}
            />
            
            {/* Moons for this planet */}
            {planet.moons && planet.moons.map(moon => {
              const moonPosition = new Vector3(
                position.x + moon.orbitData.semiMajorAxis * SCALE_FACTOR,
                position.y,
                position.z
              );
              
              return (
                <Moon 
                  key={moon.name}
                  position={[moonPosition.x, moonPosition.y, moonPosition.z]}
                  name={moon.name}
                  diameter={moon.diameter / 1000000 * SCALE_FACTOR}
                  color={moon.color}
                  onClick={() => handleSelectObject(moon.name)}
                  onDoubleClick={() => handleObjectDoubleClick(
                    moon.name, 
                    moonPosition,
                    CelestialType.MOON,
                    moon.diameter / 1000000 * SCALE_FACTOR
                  )}
                  isSelected={selectedObject === moon.name}
                />
              );
            })}
            
            {/* Stations for this planet */}
            {planet.stations && planet.stations.map(station => {
              const stationPosition = new Vector3(
                position.x + station.orbitData.semiMajorAxis * SCALE_FACTOR,
                position.y,
                position.z
              );
              
              return (
                <Station 
                  key={station.name}
                  position={[stationPosition.x, stationPosition.y, stationPosition.z]}
                  name={station.name}
                  size={station.size / 1000000 * SCALE_FACTOR}
                  color={station.color}
                  onClick={() => handleSelectObject(station.name)}
                  onDoubleClick={() => handleObjectDoubleClick(
                    station.name, 
                    stationPosition,
                    CelestialType.STATION,
                    station.size / 1000000 * SCALE_FACTOR
                  )}
                  isSelected={selectedObject === station.name}
                />
              );
            })}
          </React.Fragment>
        );
      })}
      
      {/* Jump Points */}
      {mockData.jumpPoints.map(jumpPoint => {
        const position = new Vector3(
          jumpPoint.orbitData.parentPosition[0] + jumpPoint.orbitData.semiMajorAxis * SCALE_FACTOR,
          jumpPoint.orbitData.parentPosition[1],
          jumpPoint.orbitData.parentPosition[2]
        );
        
        return (
          <JumpPoint 
            key={jumpPoint.name}
            position={[position.x, position.y, position.z]}
            name={jumpPoint.name}
            size={jumpPoint.size / 1000000 * SCALE_FACTOR}
            destination={jumpPoint.destination}
            color={jumpPoint.color}
            onClick={() => handleSelectObject(jumpPoint.name)}
            onDoubleClick={() => handleObjectDoubleClick(
              jumpPoint.name, 
              position,
              CelestialType.JUMP_POINT,
              jumpPoint.size / 1000000 * SCALE_FACTOR
            )}
            isSelected={selectedObject === jumpPoint.name}
          />
        );
      })}
      
      {/* Grid for reference */}
      <Grid size={100} divisions={20} />
    </group>
  );
}; 