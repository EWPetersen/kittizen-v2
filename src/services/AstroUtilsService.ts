/**
 * AstroUtilsService - Utility functions for astronomical calculations
 * Provides helper functions for unit conversions and orbital mechanics
 */

// Constants
const KM_PER_GM = 1_000_000; // 1 Gm = 1,000,000 km
const M_PER_KM = 1_000;      // 1 km = 1,000 m
const MM_PER_GM = 1_000;     // 1 Gm = 1,000 Mm
const G = 6.67430e-11;       // Gravitational constant in m³ kg⁻¹ s⁻²
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/**
 * Unit conversion functions
 */
export const UnitConversions = {
  /**
   * Converts kilometers to gigameters
   * @param km - Distance in kilometers
   * @returns Distance in gigameters
   */
  kmToGm: (km: number): number => km / KM_PER_GM,

  /**
   * Converts gigameters to kilometers
   * @param gm - Distance in gigameters
   * @returns Distance in kilometers
   */
  gmToKm: (gm: number): number => gm * KM_PER_GM,

  /**
   * Converts megameters to gigameters
   * @param mm - Distance in megameters
   * @returns Distance in gigameters
   */
  mmToGm: (mm: number): number => mm / MM_PER_GM,

  /**
   * Converts gigameters to megameters
   * @param gm - Distance in gigameters
   * @returns Distance in megameters
   */
  gmToMm: (gm: number): number => gm * MM_PER_GM,

  /**
   * Converts meters to kilometers
   * @param m - Distance in meters
   * @returns Distance in kilometers
   */
  mToKm: (m: number): number => m / M_PER_KM,

  /**
   * Converts kilometers to meters
   * @param km - Distance in kilometers
   * @returns Distance in meters
   */
  kmToM: (km: number): number => km * M_PER_KM,

  /**
   * Converts astronomical units to gigameters
   * 1 AU = 149,597,870.7 kilometers = ~149.6 Gm
   * @param au - Distance in astronomical units
   * @returns Distance in gigameters
   */
  auToGm: (au: number): number => au * 149.597870707,

  /**
   * Converts gigameters to astronomical units
   * @param gm - Distance in gigameters
   * @returns Distance in astronomical units
   */
  gmToAu: (gm: number): number => gm / 149.597870707
};

/**
 * Kepler's laws and orbital mechanics functions
 */
export const KeplerianOrbit = {
  /**
   * Calculates the orbital period using Kepler's Third Law
   * T² = (4π²/GM) * a³
   * @param semiMajorAxis - Semi-major axis in meters
   * @param centralMass - Mass of the central body in kg
   * @returns Orbital period in seconds
   */
  calculateOrbitalPeriod: (semiMajorAxis: number, centralMass: number): number => {
    return 2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxis, 3) / (G * centralMass));
  },

  /**
   * Calculates the semi-major axis from the orbital period using Kepler's Third Law
   * a³ = (GM * T²) / (4π²)
   * @param period - Orbital period in seconds
   * @param centralMass - Mass of the central body in kg
   * @returns Semi-major axis in meters
   */
  calculateSemiMajorAxis: (period: number, centralMass: number): number => {
    return Math.cbrt((G * centralMass * Math.pow(period, 2)) / (4 * Math.PI * Math.PI));
  },

  /**
   * Solves Kepler's Equation to find the eccentric anomaly
   * M = E - e * sin(E)
   * @param meanAnomaly - Mean anomaly in radians
   * @param eccentricity - Orbital eccentricity (0 ≤ e < 1)
   * @returns Eccentric anomaly in radians
   */
  solveKeplersEquation: (meanAnomaly: number, eccentricity: number): number => {
    // Normalize mean anomaly to be between 0 and 2π
    const M = meanAnomaly % (2 * Math.PI);
    
    // Initial guess (better initial approximation for high eccentricity)
    let E = eccentricity > 0.8 ? Math.PI : M;
    
    // Newton-Raphson method to solve Kepler's equation
    const tolerance = 1e-10;
    let delta = 1;
    let iteration = 0;
    const maxIterations = 30;
    
    while (Math.abs(delta) > tolerance && iteration < maxIterations) {
      delta = (E - eccentricity * Math.sin(E) - M) / (1 - eccentricity * Math.cos(E));
      E -= delta;
      iteration++;
    }
    
    return E;
  },

  /**
   * Calculates the true anomaly from the eccentric anomaly
   * @param eccentricAnomaly - Eccentric anomaly in radians
   * @param eccentricity - Orbital eccentricity
   * @returns True anomaly in radians
   */
  calculateTrueAnomaly: (eccentricAnomaly: number, eccentricity: number): number => {
    const cosE = Math.cos(eccentricAnomaly);
    const sinE = Math.sin(eccentricAnomaly);
    
    // Calculate true anomaly
    const cosV = (cosE - eccentricity) / (1 - eccentricity * cosE);
    const sinV = (Math.sqrt(1 - eccentricity * eccentricity) * sinE) / (1 - eccentricity * cosE);
    
    // Use atan2 to get the correct quadrant
    return Math.atan2(sinV, cosV);
  },

  /**
   * Calculates the radius (distance from focus) from the eccentric anomaly
   * @param semiMajorAxis - Semi-major axis
   * @param eccentricity - Orbital eccentricity
   * @param eccentricAnomaly - Eccentric anomaly in radians
   * @returns Distance from focus
   */
  calculateRadius: (semiMajorAxis: number, eccentricity: number, eccentricAnomaly: number): number => {
    return semiMajorAxis * (1 - eccentricity * Math.cos(eccentricAnomaly));
  },

  /**
   * Converts from orbital elements to cartesian coordinates in the orbital plane
   * @param semiMajorAxis - Semi-major axis
   * @param eccentricity - Orbital eccentricity
   * @param trueAnomaly - True anomaly in radians
   * @returns [x, y] coordinates in the orbital plane
   */
  orbitalToCartesian: (
    semiMajorAxis: number,
    eccentricity: number,
    trueAnomaly: number
  ): [number, number] => {
    const radius = semiMajorAxis * (1 - eccentricity * eccentricity) / (1 + eccentricity * Math.cos(trueAnomaly));
    return [
      radius * Math.cos(trueAnomaly),
      radius * Math.sin(trueAnomaly)
    ];
  },

  /**
   * Rotates orbital plane coordinates to 3D space using orbital elements
   * @param x - x-coordinate in orbital plane
   * @param y - y-coordinate in orbital plane
   * @param inclination - Orbital inclination in radians
   * @param longitudeOfAscendingNode - Longitude of ascending node in radians
   * @param argumentOfPeriapsis - Argument of periapsis in radians
   * @returns [x, y, z] coordinates in 3D space
   */
  rotateToReferenceFrame: (
    x: number,
    y: number,
    inclination: number,
    longitudeOfAscendingNode: number,
    argumentOfPeriapsis: number
  ): [number, number, number] => {
    // Combine rotations for argument of periapsis, inclination, and longitude of ascending node
    const cosAoP = Math.cos(argumentOfPeriapsis);
    const sinAoP = Math.sin(argumentOfPeriapsis);
    const cosInc = Math.cos(inclination);
    const sinInc = Math.sin(inclination);
    const cosLAN = Math.cos(longitudeOfAscendingNode);
    const sinLAN = Math.sin(longitudeOfAscendingNode);
    
    // Apply rotation matrix
    const xRef = (cosLAN * cosAoP - sinLAN * sinAoP * cosInc) * x + 
                 (-cosLAN * sinAoP - sinLAN * cosAoP * cosInc) * y;
                 
    const yRef = (sinLAN * cosAoP + cosLAN * sinAoP * cosInc) * x + 
                 (-sinLAN * sinAoP + cosLAN * cosAoP * cosInc) * y;
                 
    const zRef = (sinAoP * sinInc) * x + (cosAoP * sinInc) * y;
    
    return [xRef, yRef, zRef];
  }
};

export default {
  UnitConversions,
  KeplerianOrbit
}; 