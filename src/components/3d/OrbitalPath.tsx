import React, { useMemo } from 'react';
import { Vector3, EllipseCurve, BufferGeometry, LineBasicMaterial, Color } from 'three';
import { Line } from '@react-three/drei';
import { CelestialType, ORBIT_SEGMENTS, ORBIT_LINE_WIDTH, ORBIT_COLOR } from './constants';
import { SCALE_FACTOR } from './constants';

interface OrbitalPathProps {
  parentPosition?: [number, number, number];
  semiMajorAxis: number;  // in Gm
  eccentricity?: number;  // between 0-1, alternative to providing semiMinorAxis
  inclination?: number;   // in degrees
  rotation?: number;      // in degrees, rotation around the normal vector
  segments?: number;
  lineColor?: string;
  lineWidth?: number;
  visible?: boolean;
  type: CelestialType;
  color?: string;         // override default color
  dashed?: boolean;
}

export const OrbitalPath: React.FC<OrbitalPathProps> = ({
  parentPosition = [0, 0, 0],
  semiMajorAxis,
  eccentricity = 0,
  inclination = 0,
  rotation = 0,
  segments = 64,
  lineColor = '#444455',
  lineWidth = 0.1,
  visible = true,
  type,
  color,
  dashed = true
}) => {
  // Generate a circle of points
  const points = useMemo(() => {
    const circlePoints: Vector3[] = [];
    const parentPos = new Vector3(...parentPosition);
    
    // Convert angles from degrees to radians
    const inclinationRad = inclination * (Math.PI / 180);
    const rotationRad = rotation * (Math.PI / 180);
    
    // Create orbit points
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      
      // Calculate point on an ellipse in 2D plane
      const radius = semiMajorAxis * (1 - eccentricity * eccentricity) / (1 + eccentricity * Math.cos(angle));
      
      // Calculate 3D position (in orbital plane)
      let x = radius * Math.cos(angle);
      let y = radius * Math.sin(angle);
      let z = 0;
      
      // Apply inclination (tilt the orbital plane)
      const tempY = y;
      y = y * Math.cos(inclinationRad) - z * Math.sin(inclinationRad);
      z = tempY * Math.sin(inclinationRad) + z * Math.cos(inclinationRad);
      
      // Apply rotation (rotate the orbital plane around z-axis)
      const tempX = x;
      x = x * Math.cos(rotationRad) - y * Math.sin(rotationRad);
      y = tempX * Math.sin(rotationRad) + y * Math.cos(rotationRad);
      
      // Apply scale factor to get correct scene units
      x *= SCALE_FACTOR;
      y *= SCALE_FACTOR;
      z *= SCALE_FACTOR;
      
      // Add parent position
      circlePoints.push(new Vector3(
        parentPos.x + x,
        parentPos.y + y,
        parentPos.z + z
      ));
    }
    
    return circlePoints;
  }, [parentPosition, semiMajorAxis, eccentricity, inclination, rotation, segments]);
  
  // Get color based on celestial type or override
  const pathColor = color || ORBIT_COLOR[type] || '#ffffff';

  // Use Three.js Line component for the orbit path
  return (
    <Line
      points={points}
      color={new Color(pathColor)}
      lineWidth={ORBIT_LINE_WIDTH}
      dashed={dashed}
      dashSize={2}
      dashScale={10}
      transparent
      opacity={0.7}
    />
  );
}; 