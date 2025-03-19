import { CelestialBody, Position, StantonSystem } from "../models/CelestialBody";

/**
 * Interface for the StarSystemService
 */
export interface IStarSystemService {
  /**
   * Gets the full system data
   */
  getSystemData(): StantonSystem;
  
  /**
   * Gets the root celestial body (star)
   */
  getRootBody(): CelestialBody;
  
  /**
   * Gets all celestial bodies in the system as a flat array
   */
  getAllBodies(): CelestialBody[];
  
  /**
   * Gets a celestial body by its name identifier
   * @param name - The unique name of the celestial body
   */
  getBodyByName(name: string): CelestialBody | undefined;
  
  /**
   * Gets all celestial bodies of a specific type
   * @param type - The type of celestial bodies to retrieve
   */
  getBodiesByType(type: string): CelestialBody[];
  
  /**
   * Gets all children of a specified celestial body
   * @param bodyName - The name of the parent celestial body
   */
  getChildrenOfBody(bodyName: string): CelestialBody[];
  
  /**
   * Calculates the current position of a celestial body based on orbital parameters
   * @param body - The celestial body
   * @param timeInHours - The time in hours (can be used for animation)
   */
  calculateCurrentPosition(body: CelestialBody, timeInHours: number): Position;
  
  /**
   * Calculates the distance between two positions
   * @param p1 - First position
   * @param p2 - Second position (optional, defaults to origin)
   */
  calculateDistance(p1: Position, p2?: Position): number;
  
  /**
   * Calculates the distance between two celestial bodies
   * @param body1Name - Name of the first celestial body
   * @param body2Name - Name of the second celestial body
   * @param timeInHours - Time in hours (for bodies with changing positions)
   */
  calculateDistanceBetweenBodies(body1Name: string, body2Name: string, timeInHours?: number): number;
  
  /**
   * Gets the relative position between two positions
   * @param p - The position to get relative coordinates for
   * @param relative - The reference position
   */
  getRelativePosition(p: Position, relative: Position): Position;
  
  /**
   * Gets the visual scale factor for rendering a celestial body
   * @param body - The celestial body
   */
  getBodyScale(body: CelestialBody): number;
  
  /**
   * Gets the color for rendering a celestial body
   * @param body - The celestial body
   */
  getBodyColor(body: CelestialBody): string;
}

/**
 * Interface for unit conversion utilities
 */
export interface IUnitConversions {
  kmToGm(km: number): number;
  gmToKm(gm: number): number;
  mmToGm(mm: number): number;
  gmToMm(gm: number): number;
  mToKm(m: number): number;
  kmToM(km: number): number;
  auToGm(au: number): number;
  gmToAu(gm: number): number;
}

/**
 * Interface for Keplerian orbit calculations
 */
export interface IKeplerianOrbit {
  calculateOrbitalPeriod(semiMajorAxis: number, centralMass: number): number;
  calculateSemiMajorAxis(period: number, centralMass: number): number;
  solveKeplersEquation(meanAnomaly: number, eccentricity: number): number;
  calculateTrueAnomaly(eccentricAnomaly: number, eccentricity: number): number;
  calculateRadius(semiMajorAxis: number, eccentricity: number, eccentricAnomaly: number): number;
  orbitalToCartesian(semiMajorAxis: number, eccentricity: number, trueAnomaly: number): [number, number];
  rotateToReferenceFrame(
    x: number,
    y: number,
    inclination: number,
    longitudeOfAscendingNode: number,
    argumentOfPeriapsis: number
  ): [number, number, number];
} 