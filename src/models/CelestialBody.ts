export interface Position {
  x: number;
  y: number;
  z: number;
}

export type CelestialBodyType = 'star' | 'planet' | 'moon' | 'station' | 'outpost' | 'orbital_marker';

export interface OrbitalParameters {
  semiMajorAxis?: number;  // in Gm
  eccentricity?: number;   // unitless
  inclination?: number;    // in degrees
  longitudeOfAscendingNode?: number; // in degrees
  argumentOfPeriapsis?: number;     // in degrees
  meanAnomaly?: number;   // in degrees
  orbitalPeriod?: number; // in hours
}

export interface CelestialBody {
  name: string;
  label: string;
  position: Position;
  type: CelestialBodyType;
  parent?: string;
  diameter?: number;      // in km
  atmosphericHeight?: number; // in m
  qtHeight?: number;
  color?: string;
  description?: string;
  children?: CelestialBody[];
  visualRadius?: number;  // in m
  atmosphereRadius?: number; // in m
  qtRadius?: number;      // in m
  orbitalParameters?: OrbitalParameters;
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
  root: CelestialBody;
} 