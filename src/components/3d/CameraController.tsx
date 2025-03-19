import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Vector3, PerspectiveCamera, MathUtils } from 'three';
import { PerspectiveCamera as DreiCamera, OrbitControls } from '@react-three/drei';
import { CelestialType, SCALE_FACTOR } from './constants';

export enum CameraMode {
  OVERVIEW = 'overview',
  ORBIT = 'orbit',
  FIRST_PERSON = 'first_person'
}

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

interface CameraControllerHandle {
  changeFocus: (target: FocusTarget | null, transitionTime?: number) => void;
  setCameraMode: (mode: CameraMode) => void;
  resetView: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  stopZoom: () => void;
}

// Default position for the overview camera - 90 Gm above origin
const DEFAULT_CAMERA_POSITION = new Vector3(0, 90, 0);

export const CameraController = forwardRef<CameraControllerHandle, CameraControllerProps>(({
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
      cam.near = 0.0000001; // 0.1 meters in Gm (extremely close)
      cam.far = 200;        // 200 Gm (very far)
      cam.updateProjectionMatrix();
      
      // Initialize position
      cam.position.copy(DEFAULT_CAMERA_POSITION);
      
      console.debug('Camera initialized:', {
        position: cam.position,
        near: cam.near,
        far: cam.far,
        fov: cam.fov
      });
    }
  }, []);
  
  // Set up orbit controls configuration for adaptive zooming
  useEffect(() => {
    if (controlsRef.current) {
      const controls = controlsRef.current;
      
      // Configure controls for better zoom behavior
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      
      // Allow zooming to get extremely close or far
      controls.minDistance = 0.0001; // 100,000 meters in Gm
      controls.maxDistance = 150;    // 150 Gm
      
      // Adjust zoom speed based on distance
      const origZoomSpeed = controls.zoomSpeed;
      controls.zoomSpeed = 1.0;
      
      // Add a custom zoom handler that adjusts speed based on distance
      const origDolly = controls.dolly;
      controls.dolly = (dollyScale: number) => {
        // Scale zoom speed based on distance from target
        const distanceToTarget = controls.object.position.distanceTo(controls.target);
        let adjustedSpeed;
        
        if (distanceToTarget > 10) {
          // Far away (system scale) - faster zooming
          adjustedSpeed = 2.0;
        } else if (distanceToTarget < 0.01) {
          // Very close (station/detailed scale) - slower zooming
          adjustedSpeed = 0.2;
        } else {
          // Normal range
          adjustedSpeed = 1.0;
        }
        
        controls.zoomSpeed = origZoomSpeed * adjustedSpeed;
        origDolly.call(controls, dollyScale);
      };
      
      console.debug('Orbit controls configured for adaptive zooming');
    }
  }, [controlsRef.current]);
  
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
      const zoomSpeed = 5 * delta * (1 + focusTarget.objectSize);
      
      if (zoomLevel < 0) {
        // Zoom in
        cam.position.sub(zoomDirection.multiplyScalar(zoomSpeed));
      } else if (zoomLevel > 0) {
        // Zoom out
        cam.position.add(zoomDirection.multiplyScalar(zoomSpeed));
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
  const getDistanceForObject = (type: CelestialType, size: number): number => {
    // Base distance calculation that varies with object size
    let baseFactor = 0;
    
    switch (type) {
      case CelestialType.STAR:
        baseFactor = 10;
        break;
      case CelestialType.PLANET:
        baseFactor = 5;
        break;
      case CelestialType.MOON:
        baseFactor = 3; 
        break;
      case CelestialType.STATION:
        baseFactor = 0.5;
        break;
      default:
        baseFactor = 2;
    }
    
    // Logarithmic scaling to handle huge size differences
    // For planets/moons, size is in km, so convert to appropriate scale
    // Small objects get closer, large objects viewed from further
    let scaledSize = size;
    
    if (type === CelestialType.PLANET || type === CelestialType.MOON) {
      // Convert km to Gm for distance calculation
      scaledSize = size / 1000000;
    } else if (type === CelestialType.STAR) {
      // Stars are huge, so scale them down more aggressively
      scaledSize = (size / 1000000) * 0.1;
    }
    
    // Calculate distance with logarithmic scaling to handle huge size differences
    const distance = baseFactor * (0.1 + Math.log10(1 + scaledSize));
    
    return distance;
  };
  
  const updateCameraPlanes = (cam: PerspectiveCamera) => {
    // Astronomical scale requires adaptive near/far planes
    if (focusTarget) {
      const distance = cam.position.distanceTo(focusTarget.position);
      
      // Set near plane based on distance and object size
      // This allows zooming in to 1000m
      cam.near = Math.max(0.001, distance * 0.001);
      
      // Set far plane based on system scale - 120 Gm
      cam.far = 150;
      
      // Update projection matrix for changes to take effect
      cam.updateProjectionMatrix();
    }
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
    zoomSpeed: 1.0,
    panSpeed: 1.0,
    rotateSpeed: 0.8,
    maxDistance: 120, // 120 Gm
    minDistance: 0.001, // 1000 meters
    maxPolarAngle: cameraMode === CameraMode.OVERVIEW ? Math.PI / 2 - 0.1 : Math.PI, // Prevent going below horizon in overview
    ref: controlsRef
  };
  
  return (
    <>
      <DreiCamera ref={cameraRef as React.RefObject<PerspectiveCamera>} makeDefault position={DEFAULT_CAMERA_POSITION} />
      <OrbitControls {...controlsConfig} />
    </>
  );
});

export default CameraController; 