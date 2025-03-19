import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Color, Vector3, PerspectiveCamera } from 'three';
import { useThree } from '@react-three/fiber';
import { Grid } from './Grid';
import { Star } from './Star';
import { Planet } from './Planet';
import { Moon } from './Moon';
import { Station } from './Station';
import { JumpPoint } from './JumpPoint';
import { SCALE_FACTOR, CelestialType } from './constants';
import CameraController from './CameraController';
import { CameraMode } from './CameraTypes';
import systemDataService from '../../services/SystemDataService';

interface SceneProps {
  onSelectObject?: (objectId: string | null) => void;
  debug?: boolean;
}

export const Scene: React.FC<SceneProps> = ({ onSelectObject, debug = true }) => {
  const sceneRef = useRef<THREE.Group>(null);
  const cameraControllerRef = useRef<any>(null);
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [currentCameraMode, setCurrentCameraMode] = useState<CameraMode>(CameraMode.OVERVIEW);
  const { camera } = useThree();

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

  // Debug output for camera position 
  useEffect(() => {
    if (debug) {
      const updateDebugInfo = () => {
        // Cast camera to PerspectiveCamera to access fov
        const perspCamera = camera as PerspectiveCamera;
        
        console.debug('Camera:', {
          position: {
            x: camera.position.x.toFixed(2), 
            y: camera.position.y.toFixed(2), 
            z: camera.position.z.toFixed(2)
          },
          fov: perspCamera.fov || 'N/A',
          near: camera.near, 
          far: camera.far
        });
      };
      
      // Log initial position
      updateDebugInfo();
      
      // Set up interval for updates
      const interval = setInterval(updateDebugInfo, 5000);
      return () => clearInterval(interval);
    }
  }, [camera, debug]);

  // Handle object selection
  const handleSelectObject = useCallback((id: string) => {
    const newSelected = id === selectedObject ? null : id;
    setSelectedObject(newSelected);
    
    // Propagate selection to parent component if onSelectObject is provided
    if (onSelectObject) {
      onSelectObject(newSelected);
    }
    
    if (debug) {
      console.debug('Selected object:', id);
    }
  }, [selectedObject, onSelectObject, debug]);
  
  // Handle double-click on celestial object
  const handleObjectDoubleClick = useCallback((id: string, position: Vector3, type: CelestialType, size: number) => {
    handleSelectObject(id);
    
    if (cameraControllerRef.current) {
      cameraControllerRef.current.changeFocus({
        position,
        objectType: type,
        objectSize: size,
        objectName: id
      });
      
      if (debug) {
        console.debug('Camera focusing on:', {
          id,
          position: {
            x: position.x.toFixed(2), 
            y: position.y.toFixed(2), 
            z: position.z.toFixed(2)
          },
          type,
          size
        });
      }
    }
  }, [handleSelectObject, debug]);
  
  // Force reprocessing of system data on initial load
  useEffect(() => {
    // Force reprocessing of system data
    systemDataService.reprocessData();
    
    // Debug output
    if (debug) {
      console.log('Scene initialized');
      
      // Output camera details
      const perspCamera = camera as PerspectiveCamera;
      console.debug('Camera initial settings:', {
        position: camera.position.toArray(),
        lookAt: new Vector3(0, 0, 0).toArray(),
        fov: perspCamera.fov || 'N/A',
        near: perspCamera.near || 'N/A',
        far: perspCamera.far || 'N/A'
      });
    }
  }, [camera, debug]);

  // Get all objects from the system data service
  const systemData = systemDataService.getAllObjects();
  const rootObject = systemDataService.getRootObject();
  
  // Log system data for debugging
  useEffect(() => {
    if (debug) {
      console.debug('System data loaded:', { 
        objectCount: Object.keys(systemData).length,
        rootObject: rootObject?.name || 'none'
      });
    }
  }, [systemData, rootObject, debug]);
  
  // Light colors that match Star Citizen aesthetic
  const ambientLightColor = new Color(0x222233);
  const directionalLightColor = new Color(0xffffee);
  
  // Get all celestial objects by type
  const planets = systemDataService.getObjectsByType(CelestialType.PLANET);
  const moons = systemDataService.getObjectsByType(CelestialType.MOON);
  const stations = systemDataService.getObjectsByType(CelestialType.STATION);
  const jumpPoints = systemDataService.getObjectsByType(CelestialType.JUMP_POINT);
  
  if (!rootObject) {
    return <group ref={sceneRef}><mesh><boxGeometry /></mesh></group>;
  }
  
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
      
      {/* Star at center of the system */}
      <Star 
        position={[rootObject.position.x, rootObject.position.y, rootObject.position.z]} 
        name={rootObject.name}
        diameter={rootObject.size} 
        color={rootObject.color}
        onClick={() => handleSelectObject(rootObject.id)}
        onDoubleClick={() => handleObjectDoubleClick(
          rootObject.id, 
          rootObject.position,
          CelestialType.STAR,
          rootObject.size
        )}
        isSelected={selectedObject === rootObject.id}
        debug={debug}
      />
      
      {/* Planets */}
      {planets.map(planet => (
        <Planet 
          key={planet.id}
          position={[planet.position.x, planet.position.y, planet.position.z]} 
          name={planet.name}
          diameter={planet.size}
          color={planet.color}
          atmosphereColor={planet.atmosphereColor}
          atmosphereIntensity={0.3}
          onClick={() => handleSelectObject(planet.id)}
          onDoubleClick={() => handleObjectDoubleClick(
            planet.id, 
            planet.position,
            CelestialType.PLANET,
            planet.size
          )}
          isSelected={selectedObject === planet.id}
          debug={debug}
        />
      ))}
      
      {/* Render all moons */}
      {moons.map(moon => {
        const parent = moon.parent ? systemData[moon.parent] : null;
        
        // Skip rendering if parent is not found (shouldn't happen in practice)
        if (moon.parent && !parent) {
          console.warn(`Moon ${moon.name} references parent ${moon.parent} which was not found`);
          return null;
        }
        
        if (debug) {
          console.debug(`Rendering moon ${moon.name}:`, {
            position: moon.position.toArray(),
            parent: parent?.name || 'None',
            parentPosition: parent?.position.toArray() || 'N/A',
            orbit: moon.orbit,
            hasOwnPosition: !!moon.position,
            hasOrbit: !!moon.orbit
          });
        }
        
        return (
          <Moon
            key={moon.id}
            name={moon.name}
            position={moon.position ? [moon.position.x, moon.position.y, moon.position.z] : undefined}
            orbitData={moon.orbit ? {
              parentPosition: [
                moon.orbit.parentPosition.x,
                moon.orbit.parentPosition.y,
                moon.orbit.parentPosition.z
              ],
              semiMajorAxis: moon.orbit.semiMajorAxis,
              eccentricity: moon.orbit.eccentricity,
              inclination: moon.orbit.inclination,
              rotation: moon.orbit.rotation
            } : undefined}
            diameter={moon.size}
            color={moon.color}
            onClick={() => handleSelectObject(moon.id)}
            onDoubleClick={() => handleObjectDoubleClick(
              moon.id,
              moon.position,
              CelestialType.MOON,
              moon.size
            )}
            isSelected={selectedObject === moon.id}
            debug={debug}
          />
        );
      })}
      
      {/* Stations */}
      {stations.map(station => (
        <Station
          key={station.id}
          position={[station.position.x, station.position.y, station.position.z]}
          name={station.name}
          size={station.size}
          color={station.color}
          onClick={() => handleSelectObject(station.id)}
          onDoubleClick={() => handleObjectDoubleClick(
            station.id,
            station.position,
            CelestialType.STATION,
            station.size
          )}
          isSelected={selectedObject === station.id}
          debug={debug}
        />
      ))}
      
      {/* Jump Points */}
      {jumpPoints.map(jumpPoint => (
        <JumpPoint
          key={jumpPoint.id}
          position={[jumpPoint.position.x, jumpPoint.position.y, jumpPoint.position.z]}
          name={jumpPoint.name}
          size={jumpPoint.size}
          color={jumpPoint.color}
          onClick={() => handleSelectObject(jumpPoint.id)}
          onDoubleClick={() => handleObjectDoubleClick(
            jumpPoint.id,
            jumpPoint.position,
            CelestialType.JUMP_POINT,
            jumpPoint.size
          )}
          isSelected={selectedObject === jumpPoint.id}
          debug={debug}
        />
      ))}
      
      {/* Grid for reference */}
      <Grid size={100} divisions={20} />
    </group>
  );
}; 