import { Vector3, Vector2, Camera, Raycaster } from 'three';
import { SCALE_FACTOR } from './constants';

/**
 * Convert world coordinates to screen coordinates
 */
export function worldToScreen(
  worldPosition: Vector3,
  camera: Camera,
  containerWidth: number,
  containerHeight: number
): Vector2 {
  // Clone the position to avoid modifying the original
  const position = worldPosition.clone();
  
  // Project 3D point to 2D screen space
  position.project(camera);
  
  // Convert to screen coordinates
  const x = (position.x + 1) * containerWidth / 2;
  const y = (-position.y + 1) * containerHeight / 2;
  
  return new Vector2(x, y);
}

/**
 * Convert screen coordinates to world coordinates on a plane
 */
export function screenToWorld(
  screenX: number,
  screenY: number,
  camera: Camera,
  containerWidth: number,
  containerHeight: number,
  targetZ: number = 0
): Vector3 {
  // Normalize screen coordinates to NDC (-1 to +1)
  const normalizedX = (screenX / containerWidth) * 2 - 1;
  const normalizedY = -(screenY / containerHeight) * 2 + 1;
  
  // Create a raycaster from the camera
  const raycaster = new Raycaster();
  raycaster.setFromCamera(new Vector2(normalizedX, normalizedY), camera);
  
  // Calculate where the ray intersects the z-plane
  const plane = new Vector3(0, 0, 1);
  const result = new Vector3();
  
  // Line-plane intersection math
  const ray = raycaster.ray;
  const planePoint = new Vector3(0, 0, targetZ);
  
  const denominator = ray.direction.dot(plane);
  if (Math.abs(denominator) > 1e-6) {
    const t = planePoint.sub(ray.origin).dot(plane) / denominator;
    result.copy(ray.origin).addScaledVector(ray.direction, t);
  }
  
  return result;
}

/**
 * Determine level of detail based on distance from camera
 */
export function getLODLevel(
  objectPosition: Vector3,
  cameraPosition: Vector3
): number {
  const distance = objectPosition.distanceTo(cameraPosition) / SCALE_FACTOR;
  
  // LOD levels based on distance
  if (distance < 5) return 0; // Highest detail
  if (distance < 20) return 1; // High detail
  if (distance < 100) return 2; // Medium detail
  if (distance < 500) return 3; // Low detail
  return 4; // Lowest detail/simplified representation
}

/**
 * Format distance values for display
 */
export function formatDistance(
  distanceGm: number,
  showUnit: boolean = true
): string {
  let formattedValue: string;
  let unit: string;
  
  if (distanceGm >= 1000) {
    formattedValue = (distanceGm / 1000).toFixed(2);
    unit = 'Tm'; // Terameter
  } else if (distanceGm >= 1) {
    formattedValue = distanceGm.toFixed(2);
    unit = 'Gm'; // Gigameter
  } else if (distanceGm >= 0.001) {
    formattedValue = (distanceGm * 1000).toFixed(2);
    unit = 'Mm'; // Megameter
  } else {
    formattedValue = (distanceGm * 1000000).toFixed(2);
    unit = 'km'; // Kilometer
  }
  
  return showUnit ? `${formattedValue} ${unit}` : formattedValue;
}

/**
 * Generate a predictable color from a string (for consistent entity colors)
 */
export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate color in HSL format for better distribution
  const h = Math.abs(hash) % 360;
  const s = 70 + (Math.abs(hash) % 20); // 70-90% saturation
  const l = 40 + (Math.abs(hash) % 20); // 40-60% lightness
  
  return `hsl(${h}, ${s}%, ${l}%)`;
} 