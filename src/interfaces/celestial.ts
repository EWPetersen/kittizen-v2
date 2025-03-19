// Basic position interface
export interface Position {
  x: number;
  y: number;
  z: number;
}

// Base interface for all celestial objects
export interface CelestialObject {
  name: string;
  label: string;
  position: Position;
  type: CelestialObjectType;
  parent?: string;
  children?: CelestialObject[];
}

// Types of celestial objects
export type CelestialObjectType = 'star' | 'planet' | 'moon' | 'station' | 'outpost' | 'city' | 'orbital_marker';

// Star-specific interface
export interface Star extends CelestialObject {
  type: 'star';
  diameter: number;
  atmosphericHeight: number;
  color: string;
  description: string;
}

// Planet-specific interface
export interface Planet extends CelestialObject {
  type: 'planet';
  diameter: number;
  atmosphericHeight: number;
  qtHeight: number;
  color: string;
  description: string;
  visualRadius?: number;
  atmosphereRadius?: number;
  qtRadius?: number;
}

// Moon-specific interface
export interface Moon extends CelestialObject {
  type: 'moon';
  diameter: number;
  atmosphericHeight: number;
  qtHeight: number;
  color: string;
  description: string;
  visualRadius: number;
  atmosphereRadius: number;
  qtRadius: number;
}

// Station-specific interface
export interface Station extends CelestialObject {
  type: 'station';
}

// Outpost-specific interface
export interface Outpost extends CelestialObject {
  type: 'outpost';
}

// City-specific interface
export interface City extends CelestialObject {
  type: 'city';
}

// Orbital marker interface
export interface OrbitalMarker extends CelestialObject {
  type: 'orbital_marker';
}

// System map metadata
export interface SystemMapMetadata {
  Version: string;
  Generator: string;
  BuildVersion: string;
  ScraperVersion: string;
  ScrapeTimestamp: string;
  EnhancedBodies: string;
}

// Complete system map
export interface SystemMap {
  systemName: string;
  metadata: SystemMapMetadata;
  root: Star;
} 