export interface Position {
  x: number;
  y: number;
  z: number;
}

export type CelestialBodyType = 'star' | 'planet' | 'moon' | 'station' | 'outpost';

export interface CelestialBody {
  name: string;
  label: string;
  position: Position;
  type: CelestialBodyType;
  parent?: string;
  diameter?: number;
  atmosphericHeight?: number;
  qtHeight?: number;
  color?: string;
  description?: string;
  children?: CelestialBody[];
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