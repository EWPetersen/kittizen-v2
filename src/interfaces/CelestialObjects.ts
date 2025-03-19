export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface CelestialObjectBase {
  name: string;
  label: string;
  position: Position;
  type: string;
  diameter: number;
  atmosphericHeight?: number;
  qtHeight?: number;
  color?: string;
  description?: string;
}

export interface OrbitData {
  parentPosition: [number, number, number];
  semiMajorAxis: number;
  eccentricity?: number;
  inclination?: number;
  rotation?: number;
}

export interface Star extends CelestialObjectBase {
  type: 'star';
}

export interface Planet extends CelestialObjectBase {
  type: 'planet';
  parent: string;
  children?: (Moon | Station)[];
}

export interface Moon extends CelestialObjectBase {
  type: 'moon';
  parent: string;
  children?: Station[];
}

export interface Station extends CelestialObjectBase {
  type: 'station';
  parent: string;
}

export interface JumpPoint extends CelestialObjectBase {
  type: 'jump_point';
  destination: string;
}

export interface LagrangePoint extends CelestialObjectBase {
  type: 'lagrange';
  parent: string;
}

export interface StantonSystem {
  systemName: string;
  metadata: {
    Version: string;
    Generator: string;
    BuildVersion: string;
    ScraperVersion: string;
    ScrapeTimestamp: string;
    EnhancedBodies: string;
  };
  root: Star & {
    children: (Planet | JumpPoint | LagrangePoint)[];
  };
}

export interface CelestialObjectData {
  name: string;
  position?: [number, number, number];
  diameter?: number; // in km - required except for objects that use size instead
  color?: string;
  atmosphereColor?: string;
  atmosphereIntensity?: number;
  description?: string;
  orbitData?: OrbitData;
  rotationPeriod?: number; // in hours
  children?: CelestialObjectData[];
  size?: number; // for stations and jump points
  destination?: string; // for jump points
} 