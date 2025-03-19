import React, { useMemo } from 'react';
import { Vector3, EllipseCurve, BufferGeometry, LineBasicMaterial, Color } from 'three';
import { Line } from '@react-three/drei';
import { CelestialType, ORBIT_SEGMENTS, ORBIT_LINE_WIDTH, ORBIT_COLOR } from './constants';
import { SCALE_FACTOR } from './constants';

interface OrbitalPathProps {
  parentPosition?: [number, number, number];
  semiMajorAxis: number;  // in Gm
  semiMinorAxis?: number; // in Gm, if undefined will use semiMajorAxis for circular orbit
  eccentricity?: number;  // between 0-1, alternative to providing semiMinorAxis
  inclination?: number;   // in degrees
  rotation?: number;      // in degrees, rotation around the normal vector
  type: CelestialType;
  color?: string;         // override default color
  dashed?: boolean;
}

export const OrbitalPath: React.FC<OrbitalPathProps> = ({
  parentPosition = [0, 0, 0],
  semiMajorAxis,
  semiMinorAxis,
  eccentricity = 0,
  inclination = 0,
  rotation = 0,
  type,
  color,
  dashed = true
}) => {
  // Calculate semi-minor axis if not provided but eccentricity is
  const calculatedSemiMinorAxis = useMemo(() => {
    if (semiMinorAxis !== undefined) return semiMinorAxis;
    if (eccentricity !== undefined) {
      return semiMajorAxis * Math.sqrt(1 - eccentricity * eccentricity);
    }
    return semiMajorAxis; // Circular orbit
  }, [semiMajorAxis, semiMinorAxis, eccentricity]);
  
  // Scale to THREE.js units
  const scaledSemiMajorAxis = semiMajorAxis * SCALE_FACTOR;
  const scaledSemiMinorAxis = calculatedSemiMinorAxis * SCALE_FACTOR;
  
  // Create elliptical path points
  const points = useMemo(() => {
    // Create the basic ellipse in the XY plane
    const curve = new EllipseCurve(
      0, 0,                        // center
      scaledSemiMajorAxis, scaledSemiMinorAxis, // x radius, y radius
      0, 2 * Math.PI,              // start angle, end angle
      false,                       // clockwise
      rotation * (Math.PI / 180)   // rotation
    );
    
    // Get points along the curve
    const basePoints = curve.getPoints(ORBIT_SEGMENTS);
    
    // Convert to 3D points and apply inclination
    const inclinationRad = inclination * (Math.PI / 180);
    const points3D = basePoints.map(point => {
      // Apply inclination rotation around X axis
      const y = point.y * Math.cos(inclinationRad);
      const z = point.y * Math.sin(inclinationRad);
      
      // Create new 3D point
      return new Vector3(
        point.x + parentPosition[0],
        y + parentPosition[1],
        z + parentPosition[2]
      );
    });
    
    return points3D;
  }, [
    scaledSemiMajorAxis,
    scaledSemiMinorAxis,
    rotation,
    inclination,
    parentPosition
  ]);
  
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