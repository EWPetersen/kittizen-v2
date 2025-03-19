import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Vector3, PerspectiveCamera, MathUtils } from 'three';
import { PerspectiveCamera as DreiCamera, OrbitControls } from '@react-three/drei';
import { CelestialType, SCALE_FACTOR } from './constants';
import { CameraMode } from './CameraTypes';

interface FocusTarget {
  position: Vector3;
  objectType: CelestialType;
  objectSize: number;
  objectName: string;
}

interface CameraControllerProps {
  initialFocusTarget?: FocusTarget | null;
  initialCameraMode?: CameraMode;
  onFocusChange?: (target: FocusTarget | null) => void;
}

export interface CameraControllerHandle {
  changeFocus: (target: FocusTarget | null, transitionTime?: number) => void;
  setCameraMode: (mode: CameraMode) => void;
  resetView: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  stopZoom: () => void;
}

// Default position for the overview camera - 90 Gm above origin
const DEFAULT_CAMERA_POSITION = new Vector3(0, 90, 0);

// Debug counter to limit logging frequency
let debugCounter = 0;

const CameraController = forwardRef<CameraControllerHandle, CameraControllerProps>(({
  initialFocusTarget,
  initialCameraMode = CameraMode.OVERVIEW,
  onFocusChange
}, ref) => {
  // Get camera and other Three.js objects
  const { camera, size } = useThree();
  const cameraRef = useRef<PerspectiveCamera | null>(null);
  const controlsRef = useRef<any>();
  
  // State for camera behavior
  const [cameraMode, setCameraMode] = useState<CameraMode>(initialCameraMode);
  const [focusTarget, setFocusTarget] = useState<FocusTarget | null>(initialFocusTarget || null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionStartPos] = useState(new Vector3());
  const [transitionStartTarget] = useState(new Vector3());
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(0);
  
  // Reference to previous camera position for smooth transitions
  const prevCameraPosition = useRef(new Vector3());
  const prevTargetPosition = useRef(new Vector3());
  
  // Set camera default position and target based on mode
  useEffect(() => {
    if (!isTransitioning && cameraRef.current) {
      const cam = cameraRef.current || camera;
      
      switch (cameraMode) {
        case CameraMode.OVERVIEW:
          cam.position.copy(DEFAULT_CAMERA_POSITION);
          if (controlsRef.current) {
            controlsRef.current.target.set(0, 0, 0);
          }
          break;
          
        case CameraMode.ORBIT:
          if (focusTarget) {
            const distanceFactor = getDistanceForObject(focusTarget.objectType, focusTarget.objectSize);
            const orbitPosition = focusTarget.position.clone().add(new Vector3(distanceFactor, distanceFactor * 0.5, distanceFactor));
            cam.position.copy(orbitPosition);
            
            if (controlsRef.current) {
              controlsRef.current.target.copy(focusTarget.position);
            }
          }
          break;
          
        case CameraMode.FIRST_PERSON:
          if (focusTarget) {
            const forwardDirection = new Vector3(1, 0, 0);
            const distance = focusTarget.objectSize * 1.1;
            
            const firstPersonPosition = focusTarget.position.clone().add(
              forwardDirection.multiplyScalar(distance)
            );
            
            cam.position.copy(firstPersonPosition);
            
            if (controlsRef.current) {
              controlsRef.current.target.copy(focusTarget.position);
            }
          }
          break;
      }
      
      // Store current camera and target positions
      prevCameraPosition.current.copy(cam.position);
      if (controlsRef.current) {
        prevTargetPosition.current.copy(controlsRef.current.target);
      }
    }
  }, [camera, cameraMode, controlsRef, isTransitioning]);
  
  // Initialize camera on mount - set up far plane for star system scale
  useEffect(() => {
    if (cameraRef.current) {
      const cam = cameraRef.current;
      
      // Set up near and far planes to handle the required zoom range (1000m to 120 Gm)
      cam.near = 0.001; // 1 meter (in Gm units)
      cam.far = 150;    // 150 Gm
      cam.updateProjectionMatrix();
      
      // Initialize position
      cam.position.copy(DEFAULT_CAMERA_POSITION);
      
      console.debug('Camera initialized:', {
        position: cam.position,
        near: cam.near,
        far: cam.far,
        fov: cam.fov
      });
      
      // Add keyboard listener for debug key
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'd') {
          const distance = focusTarget ? cam.position.distanceTo(focusTarget.position) : 'N/A';
          console.log('%c CAMERA DEBUG INFO ', 'background: #003366; color: #88CCFF; font-weight: bold; padding: 2px 5px;');
          console.log('Camera position:', cam.position.toArray().map(v => v.toFixed(6)).join(', '));
          console.log('Look target:', focusTarget ? focusTarget.position.toArray().map(v => v.toFixed(6)).join(', ') : 'None');
          console.log('Distance to target:', typeof distance === 'number' ? `${distance.toFixed(8)} Gm (${(distance * 1000000000).toFixed(0)} meters)` : distance);
          console.log('Near plane:', `${cam.near.toFixed(8)} Gm (${(cam.near * 1000000000).toFixed(0)} meters)`);
          console.log('Far plane:', `${cam.far.toFixed(2)} Gm (${(cam.far * 1000000000).toFixed(0)} meters)`);
          console.log('Field of view:', cam.fov.toFixed(2) + '°');
          console.log('Zoom level:', zoomLevel);
          console.log('Camera mode:', cameraMode);
          console.log('Focused object:', focusTarget ? `${focusTarget.objectName} (${focusTarget.objectType})` : 'None');
          console.log('Object size:', focusTarget ? `${focusTarget.objectSize.toFixed(4)} Gm (${(focusTarget.objectSize * 1000000000).toFixed(0)} meters)` : 'N/A');
          
          if (controlsRef.current) {
            console.log('Controls min distance:', controlsRef.current.minDistance);
            console.log('Controls max distance:', controlsRef.current.maxDistance);
          }
        }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [cameraMode, focusTarget, zoomLevel]);
  
  // Handle focus change
  const changeFocus = useCallback((newTarget: FocusTarget | null, transitionTime = 1.5) => {
    // Store starting position
    const cam = cameraRef.current || camera;
    transitionStartPos.copy(cam.position);
    
    if (controlsRef.current) {
      transitionStartTarget.copy(controlsRef.current.target);
    }
    
    // Reset transition progress
    setTransitionProgress(0);
    setIsTransitioning(true);
    setFocusTarget(newTarget);
    
    // Notify parent components
    if (onFocusChange) {
      onFocusChange(newTarget);
    }
    
    // Auto-switch to appropriate camera mode based on target type
    if (newTarget) {
      switch (newTarget.objectType) {
        case CelestialType.STAR:
          setCameraMode(CameraMode.OVERVIEW);
          break;
        case CelestialType.PLANET:
        case CelestialType.MOON:
          setCameraMode(CameraMode.ORBIT);
          break;
        case CelestialType.STATION:
        case CelestialType.JUMP_POINT:
        case CelestialType.LAGRANGE:
          setCameraMode(CameraMode.FIRST_PERSON);
          break;
      }
    } else {
      // Reset to overview if no target
      setCameraMode(CameraMode.OVERVIEW);
    }
  }, [camera, onFocusChange, transitionStartPos, transitionStartTarget]);
  
  // Handle camera updates each frame
  useFrame((_, delta) => {
    if (!cameraRef.current || !controlsRef.current) return;
    
    const cam = cameraRef.current;
    const controls = controlsRef.current;
    
    // Handle camera transitions
    if (isTransitioning) {
      // Update transition progress
      const progressDelta = delta / 1.5; // 1.5 second transition
      setTransitionProgress(prev => {
        const newProgress = prev + progressDelta;
        if (newProgress >= 1.0) {
          setIsTransitioning(false);
          return 1.0;
        }
        return newProgress;
      });
      
      // Calculate target position based on focus target and camera mode
      const targetCameraPosition = new Vector3();
      const targetControlsPosition = new Vector3();
      
      if (focusTarget) {
        switch (cameraMode) {
          case CameraMode.OVERVIEW:
            targetCameraPosition.copy(DEFAULT_CAMERA_POSITION);
            targetControlsPosition.set(0, 0, 0);
            break;
            
          case CameraMode.ORBIT:
            const orbitDistance = getDistanceForObject(focusTarget.objectType, focusTarget.objectSize);
            targetCameraPosition.set(
              focusTarget.position.x + orbitDistance,
              focusTarget.position.y + orbitDistance * 0.5,
              focusTarget.position.z + orbitDistance
            );
            targetControlsPosition.copy(focusTarget.position);
            break;
            
          case CameraMode.FIRST_PERSON:
            const fpDistance = focusTarget.objectSize * 1.1;
            targetCameraPosition.set(
              focusTarget.position.x + fpDistance,
              focusTarget.position.y + fpDistance * 0.1,
              focusTarget.position.z
            );
            targetControlsPosition.copy(focusTarget.position);
            break;
        }
      } else {
        // Default to overview if no target
        targetCameraPosition.copy(DEFAULT_CAMERA_POSITION);
        targetControlsPosition.set(0, 0, 0);
      }
      
      // Smooth transition using easing function
      const easeProgress = easeInOutCubic(transitionProgress);
      
      // Apply interpolated position
      cam.position.lerpVectors(transitionStartPos, targetCameraPosition, easeProgress);
      controls.target.lerpVectors(transitionStartTarget, targetControlsPosition, easeProgress);
    }
    
    // Apply zoom level adjustments
    if (zoomLevel !== 0 && focusTarget) {
      const zoomDirection = cam.position.clone().sub(controls.target).normalize();
      
      // Calculate distance to target for adaptive zoom speed
      const distanceToTarget = cam.position.distanceTo(focusTarget.position);
      
      // Logarithmic zoom speed that scales with distance
      // Fast at large distances, precise at close distances
      const baseZoomSpeed = 10 * delta; // Increased base speed
      let adaptiveZoomSpeed;
      
      if (distanceToTarget > 10) { // > 10 Gm - fast zoom for system scale
        adaptiveZoomSpeed = baseZoomSpeed * distanceToTarget * 0.2;
      } else if (distanceToTarget > 1) { // 1-10 Gm - medium zoom for planet scale
        adaptiveZoomSpeed = baseZoomSpeed * distanceToTarget * 0.3;
      } else if (distanceToTarget > 0.1) { // 0.1-1 Gm - slower zoom for moon scale
        adaptiveZoomSpeed = baseZoomSpeed * distanceToTarget * 0.4;
      } else if (distanceToTarget > 0.01) { // 0.01-0.1 Gm - precise zoom for station scale
        adaptiveZoomSpeed = baseZoomSpeed * distanceToTarget * 0.6;
      } else if (distanceToTarget > 0.001) { // 0.001-0.01 Gm - very precise zoom for surface details
        adaptiveZoomSpeed = baseZoomSpeed * distanceToTarget * 0.8;
      } else { // < 0.001 Gm - extremely precise zoom for close-up details
        adaptiveZoomSpeed = baseZoomSpeed * distanceToTarget * 1.2;
      }
      
      // Apply minimum and maximum zoom speed limits
      adaptiveZoomSpeed = Math.max(0.000001, Math.min(40, adaptiveZoomSpeed));
      
      if (zoomLevel < 0) {
        // Zoom in - much more aggressive zooming in
        cam.position.sub(zoomDirection.multiplyScalar(adaptiveZoomSpeed * 2.0));
      } else if (zoomLevel > 0) {
        // Zoom out - standard zooming out
        cam.position.add(zoomDirection.multiplyScalar(adaptiveZoomSpeed));
      }
    }
    
    // Prevent camera from going below the orbital plane
    if (cameraMode === CameraMode.OVERVIEW) {
      if (cam.position.y < 10) {
        cam.position.y = 10;
      }
    }
    
    // Ensure camera doesn't clip into objects
    if (focusTarget) {
      const distanceToTarget = cam.position.distanceTo(focusTarget.position);
      const minDistance = focusTarget.objectSize * 1.1;
      
      if (distanceToTarget < minDistance) {
        const direction = cam.position.clone().sub(focusTarget.position).normalize();
        cam.position.copy(focusTarget.position.clone().add(direction.multiplyScalar(minDistance)));
      }
    }
    
    // Update near/far planes based on camera position and target
    updateCameraPlanes(cam);
  });
  
  // Utility functions
  const getDistanceForObject = (objectType: CelestialType, objectSize: number): number => {
    const baseDistance = objectSize * 5;
    
    switch (objectType) {
      case CelestialType.STAR:
        return baseDistance * 2;
      case CelestialType.PLANET:
        return baseDistance * 1.5;
      case CelestialType.MOON:
        return baseDistance * 1.2;
      default:
        return baseDistance;
    }
  };
  
  const updateCameraPlanes = (cam: PerspectiveCamera) => {
    // Astronomical scale requires adaptive near/far planes
    if (focusTarget) {
      const distance = cam.position.distanceTo(focusTarget.position);
      
      // Adaptive near plane calculation:
      // - At large distances, use larger near plane to avoid precision issues
      // - At close distances, use smaller near plane to see details
      // - Near plane should never be less than 0.0000001 Gm (100 meters)
      let nearPlaneDistance;
      
      if (distance > 10) { // System scale (> 10 Gm)
        nearPlaneDistance = distance * 0.01; // 1% of distance
      } else if (distance > 1) { // Planet scale (1-10 Gm)
        nearPlaneDistance = distance * 0.001; // 0.1% of distance
      } else if (distance > 0.1) { // Moon scale (0.1-1 Gm)
        nearPlaneDistance = distance * 0.0001; // 0.01% of distance
      } else if (distance > 0.01) { // Station scale (0.01-0.1 Gm)
        nearPlaneDistance = distance * 0.00001; // 0.001% of distance
      } else if (distance > 0.001) { // Surface detail scale (0.001-0.01 Gm)
        nearPlaneDistance = distance * 0.000001; // 0.0001% of distance
      } else { // Extreme close-up scale (< 0.001 Gm)
        nearPlaneDistance = 0.0000001; // 100 meters (fixed minimum)
      }
      
      // Apply the calculated near plane, but never less than 100 meters (0.0000001 Gm)
      cam.near = Math.max(0.0000001, nearPlaneDistance);
      
      // Far plane should cover the entire star system, but can be adjusted based on focus
      if (distance > 50) { // Very far away (system view)
        cam.far = 200; // See entire system plus some margin
      } else if (distance > 10) { // Far away (between planets)
        cam.far = 150; // See most of the system
      } else if (distance > 1) { // Planet-scale distances
        cam.far = Math.max(100, distance * 15); // At least 100 Gm or 15x current distance
      } else { // Close-up views
        cam.far = Math.max(50, distance * 20); // At least 50 Gm or 20x current distance
      }
      
      // Log camera parameters when debugging
      if (debugCounter % 60 === 0) { // Log every 60 frames to avoid spam
        console.debug('Camera planes updated:', {
          distance: distance.toFixed(8) + ' Gm',
          near: cam.near.toFixed(8) + ' Gm',
          far: cam.far.toFixed(2) + ' Gm',
          distanceMeters: (distance * 1000000000).toFixed(0) + ' m',
          nearMeters: (cam.near * 1000000000).toFixed(0) + ' m',
          objectName: focusTarget.objectName,
          objectType: focusTarget.objectType,
          objectSize: focusTarget.objectSize
        });
      }
      
      // Update projection matrix for changes to take effect
      cam.updateProjectionMatrix();
    }
    
    // Increment debug counter
    debugCounter = (debugCounter + 1) % 60;
  };
  
  // Easing function for smooth transitions
  const easeInOutCubic = (t: number): number => {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };
  
  // Public methods exposed via ref pattern
  useImperativeHandle(
    ref,
    () => ({
      changeFocus,
      setCameraMode,
      resetView: () => {
        changeFocus(null);
        setCameraMode(CameraMode.OVERVIEW);
      },
      zoomIn: () => setZoomLevel(-1),
      zoomOut: () => setZoomLevel(1),
      stopZoom: () => setZoomLevel(0)
    }),
    [changeFocus, setCameraMode]
  );
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (cameraRef.current) {
        cameraRef.current.aspect = size.width / size.height;
        cameraRef.current.updateProjectionMatrix();
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [size]);
  
  // Handle mobile touch events
  const touchStartRef = useRef({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        // Handle pinch to zoom
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
        
        // Use the distance to determine zoom direction
        if (dist < 100) {
          setZoomLevel(-1); // Zoom in
        } else {
          setZoomLevel(1); // Zoom out
        }
      }
    };
    
    const handleTouchEnd = () => {
      setZoomLevel(0); // Stop zooming
    };
    
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);
  
  const controlsConfig = {
    enabled: !isTransitioning,
    enablePan: true,
    enableZoom: true,
    enableRotate: true,
    zoomSpeed: 4.0, // Dramatically increased zoom speed for astronomical scale
    panSpeed: 1.0,
    rotateSpeed: 0.8,
    maxDistance: 120, // 120 Gm - maximum zoom out
    minDistance: 0.00000001, // 10 meters (0.00000001 Gm) - extremely close zoom in 
    maxPolarAngle: cameraMode === CameraMode.OVERVIEW ? Math.PI / 2 - 0.1 : Math.PI, // Prevent going below horizon in overview
    dampingFactor: 0.05, // Add smooth damping effect
    screenSpacePanning: true, // More intuitive panning
    ref: controlsRef
  };
  
  // Add keyboard controls for zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '+' || e.key === '=') {
        setZoomLevel(-1); // Zoom in
      } else if (e.key === '-' || e.key === '_') {
        setZoomLevel(1); // Zoom out
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (['+', '=', '-', '_'].includes(e.key)) {
        setZoomLevel(0); // Stop zooming
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  return (
    <>
      <DreiCamera ref={cameraRef as React.RefObject<PerspectiveCamera>} makeDefault position={DEFAULT_CAMERA_POSITION} />
      <OrbitControls {...controlsConfig} />
    </>
  );
});

export default CameraController; 