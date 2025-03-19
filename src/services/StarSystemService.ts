import { StantonSystem, CelestialBody, Position, OrbitalParameters } from '../models/CelestialBody';
import AstroUtils, { UnitConversions, KeplerianOrbit } from './AstroUtilsService';
import stantonData from '../stanton_system_map.json';

// Constants
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

class StarSystemService {
  private systemData: StantonSystem;
  private bodiesById: Map<string, CelestialBody>;
  private bodiesByType: Map<string, CelestialBody[]>;
  
  constructor() {
    this.systemData = stantonData as StantonSystem;
    this.bodiesById = new Map();
    this.bodiesByType = new Map();
    this.processSystemData();
  }
  
  /**
   * Processes the system data and initializes the service
   */
  private processSystemData(): void {
    this.buildLookupMaps(this.systemData.root);
    this.enrichBodyData();
  }

  /**
   * Builds lookup maps for quick access to celestial bodies
   */
  private buildLookupMaps(body: CelestialBody, parentBody?: CelestialBody): void {
    // Store in id map
    this.bodiesById.set(body.name, body);
    
    // Store in type map
    if (!this.bodiesByType.has(body.type)) {
      this.bodiesByType.set(body.type, []);
    }
    this.bodiesByType.get(body.type)?.push(body);
    
    // Process children recursively
    if (body.children) {
      for (const child of body.children) {
        this.buildLookupMaps(child, body);
      }
    }
  }

  /**
   * Enriches body data with calculated orbital parameters
   */
  private enrichBodyData(): void {
    const bodies = this.getAllBodies();
    
    for (const body of bodies) {
      // Skip the root (star)
      if (!body.parent) continue;
      
      const parentBody = this.getBodyByName(body.parent);
      if (!parentBody) continue;
      
      // Extract orbital parameters from position data
      // This is a simplified approach - in a real system we'd calculate these from proper orbital elements
      if (parentBody && body.position) {
        const relativePosition = this.getRelativePosition(body.position, parentBody.position);
        const distance = this.calculateDistance(relativePosition);
        
        // Calculate simplified orbital parameters based on relative position
        // Note: In a real scenario, we would use proper orbital elements from the data
        const orbitalParams: OrbitalParameters = {
          semiMajorAxis: UnitConversions.kmToGm(distance), // Convert to Gm
          eccentricity: 0.01, // Placeholder - would calculate from actual data
          inclination: 0, // Placeholder
          longitudeOfAscendingNode: 0, // Placeholder
          argumentOfPeriapsis: 0, // Placeholder
          meanAnomaly: this.calculateInitialMeanAnomaly(relativePosition),
          orbitalPeriod: this.estimateOrbitalPeriod(distance, parentBody.diameter || 1000000)
        };
        
        body.orbitalParameters = orbitalParams;
      }
    }
  }
  
  /**
   * Gets the system data
   */
  getSystemData(): StantonSystem {
    return this.systemData;
  }
  
  /**
   * Gets the root celestial body (star)
   */
  getRootBody(): CelestialBody {
    return this.systemData.root;
  }
  
  /**
   * Gets all celestial bodies in the system
   */
  getAllBodies(): CelestialBody[] {
    const bodies: CelestialBody[] = [];
    this.flattenBodies(this.systemData.root, bodies);
    return bodies;
  }
  
  /**
   * Gets a celestial body by name
   */
  getBodyByName(name: string): CelestialBody | undefined {
    return this.bodiesById.get(name);
  }
  
  /**
   * Gets celestial bodies by type
   */
  getBodiesByType(type: string): CelestialBody[] {
    return this.bodiesByType.get(type) || [];
  }
  
  /**
   * Gets the children of a celestial body
   */
  getChildrenOfBody(bodyName: string): CelestialBody[] {
    const body = this.getBodyByName(bodyName);
    return body?.children || [];
  }
  
  /**
   * Flattens the hierarchical structure into an array
   */
  private flattenBodies(body: CelestialBody, result: CelestialBody[]): void {
    result.push(body);
    if (body.children) {
      for (const child of body.children) {
        this.flattenBodies(child, result);
      }
    }
  }
  
  /**
   * Calculates the current position of a celestial body based on its orbital parameters
   * and the current time, using Kepler's laws
   */
  calculateCurrentPosition(body: CelestialBody, timeInHours: number): Position {
    // If no parent or orbital parameters, return static position
    if (!body.parent || !body.orbitalParameters) {
      return body.position;
    }
    
    const parentBody = this.getBodyByName(body.parent);
    if (!parentBody) return body.position;
    
    const {
      semiMajorAxis = 1,
      eccentricity = 0,
      inclination = 0,
      longitudeOfAscendingNode = 0,
      argumentOfPeriapsis = 0,
      meanAnomaly = 0,
      orbitalPeriod = 24
    } = body.orbitalParameters;
    
    // Calculate mean anomaly at the current time
    const n = 2 * Math.PI / orbitalPeriod; // Mean motion (radians per hour)
    const M = (meanAnomaly * DEG_TO_RAD + n * timeInHours) % (2 * Math.PI);
    
    // Solve Kepler's equation to find eccentric anomaly
    const E = KeplerianOrbit.solveKeplersEquation(M, eccentricity);
    
    // Calculate true anomaly
    const trueAnomaly = KeplerianOrbit.calculateTrueAnomaly(E, eccentricity);
    
    // Convert to cartesian coordinates in the orbital plane
    const [x, y] = KeplerianOrbit.orbitalToCartesian(semiMajorAxis, eccentricity, trueAnomaly);
    
    // Rotate to 3D reference frame
    const [xRef, yRef, zRef] = KeplerianOrbit.rotateToReferenceFrame(
      x, 
      y, 
      inclination * DEG_TO_RAD,
      longitudeOfAscendingNode * DEG_TO_RAD,
      argumentOfPeriapsis * DEG_TO_RAD
    );
    
    // Add parent body position to get absolute position
    // Convert from Gm to km for the final result
    return {
      x: parentBody.position.x + xRef * UnitConversions.gmToKm(1),
      y: parentBody.position.y + yRef * UnitConversions.gmToKm(1),
      z: parentBody.position.z + zRef * UnitConversions.gmToKm(1)
    };
  }
  
  /**
   * Calculates the distance between two positions
   */
  calculateDistance(p1: Position, p2?: Position): number {
    if (!p2) {
      // Calculate magnitude of the position vector from origin
      return Math.sqrt(p1.x * p1.x + p1.y * p1.y + p1.z * p1.z);
    }
    
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dz = p2.z - p1.z;
    
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  
  /**
   * Calculates the distance between two celestial bodies
   */
  calculateDistanceBetweenBodies(body1Name: string, body2Name: string, timeInHours = 0): number {
    const body1 = this.getBodyByName(body1Name);
    const body2 = this.getBodyByName(body2Name);
    
    if (!body1 || !body2) return -1;
    
    const pos1 = this.calculateCurrentPosition(body1, timeInHours);
    const pos2 = this.calculateCurrentPosition(body2, timeInHours);
    
    return this.calculateDistance(pos1, pos2);
  }
  
  /**
   * Gets the relative position between two points
   */
  getRelativePosition(p: Position, relative: Position): Position {
    return {
      x: p.x - relative.x,
      y: p.y - relative.y,
      z: p.z - relative.z
    };
  }
  
  /**
   * Estimates the orbital period based on distance and parent mass
   * using Kepler's Third Law
   */
  private estimateOrbitalPeriod(distanceKm: number, parentDiameterKm: number): number {
    // Rough mass estimate based on diameter (very simplified)
    // For a star like Stanton, mass ≈ 2e30 kg (solar mass)
    // For planets, we'd use a different approximation
    
    let parentMass: number;
    const parentVolume = (4/3) * Math.PI * Math.pow(parentDiameterKm / 2, 3);
    
    // Very rough density approximation based on type
    if (parentDiameterKm > 100000) {
      // Star density (approx 1.4 g/cm³)
      parentMass = parentVolume * 1.4;
    } else {
      // Planet density (approx 5.5 g/cm³ like Earth)
      parentMass = parentVolume * 5.5;
    }
    
    // Convert distance to meters
    const distanceM = UnitConversions.kmToM(distanceKm);
    
    // Use AstroUtils to calculate the period
    const periodSeconds = KeplerianOrbit.calculateOrbitalPeriod(distanceM, parentMass);
    
    // Convert to hours
    return periodSeconds / 3600;
  }
  
  /**
   * Calculates the initial mean anomaly from the position
   */
  private calculateInitialMeanAnomaly(position: Position): number {
    // Very simplified - in reality would calculate from position vectors
    const angle = Math.atan2(position.y, position.x);
    return (angle * RAD_TO_DEG + 360) % 360;
  }
  
  /**
   * Gets the visual scale for rendering
   */
  getBodyScale(body: CelestialBody): number {
    // Scale the bodies for visual representation
    switch (body.type) {
      case 'star':
        return 5;
      case 'planet':
        return 1;
      case 'moon':
        return 0.5;
      case 'station':
        return 0.2;
      case 'outpost':
        return 0.1;
      default:
        return 0.1;
    }
  }
  
  /**
   * Gets the color for rendering
   */
  getBodyColor(body: CelestialBody): string {
    return body.color || '#FFFFFF';
  }
}

export default new StarSystemService(); 