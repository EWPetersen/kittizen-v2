// Constants for astronomical scale - 1 unit = 1 Gm (gigameter)
export const SCALE_FACTOR = 1; // 1 unit = 1 Gm

// Visual scaling to make objects visible at system scale
// These values artificially inflate the size of objects to make them visible
export const VISUAL_SCALE_FACTORS = {
  STAR: 5,        // 5x actual size for stars (increased from 0.5x)
  PLANET: 75,      // 75x actual size for planets (increased from 50x)
  MOON: 150,       // 150x actual size for moons (increased from 100x)
  STATION: 500,    // 500x actual size for stations
  JUMP_POINT: 200, // 200x actual size for jump points
  LAGRANGE: 200    // 200x actual size for lagrange points
};

// Celestial object types
export enum CelestialType {
  STAR = 'star',
  PLANET = 'planet',
  MOON = 'moon',
  STATION = 'station',
  JUMP_POINT = 'jump_point',
  LAGRANGE = 'lagrange'
}

// Orbit visualization settings
export const ORBIT_SEGMENTS = 128; // Segments used to render orbital paths
export const ORBIT_LINE_WIDTH = 1.5; // Width of orbit lines
export const ORBIT_COLOR = {
  [CelestialType.PLANET]: '#2288cc',  // Blue for planets
  [CelestialType.MOON]: '#55aaff',    // Light blue for moons
  [CelestialType.STATION]: '#88ddff',  // Lighter blue for stations
  [CelestialType.JUMP_POINT]: '#ffaa22', // Orange for jump points
  [CelestialType.LAGRANGE]: '#22ffaa'  // Teal for lagrange points
};

// Label settings
export const LABEL_OFFSET = 1.2; // Offset for labels relative to object radius
export const FOCUS_ANIMATION_DURATION = 1.5; // Duration in seconds for camera focus animation 