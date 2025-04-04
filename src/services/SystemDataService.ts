import { CelestialType } from '../components/3d/constants';
import {
  StantonSystem,
  CelestialObjectData,
  Star,
  Planet,
  Moon,
  Station,
  JumpPoint,
  LagrangePoint,
  Position,
  OrbitData
} from '../interfaces/CelestialObjects';
import stantonData from '../stanton_system_map.json';
import { Vector3 } from 'three';
import { SCALE_FACTOR } from '../components/3d/constants';

/**
 * Converts JSON position to [x, y, z] tuple
 */
const positionToArray = (pos: Position): [number, number, number] => {
  return [pos.x, pos.y, pos.z];
};

/**
 * Converts hex color to a more vibrant holographic version
 */
const enhanceHolographicColor = (color: string | undefined, type: CelestialType): string => {
  if (!color) {
    // Default colors by type if not provided
    switch (type) {
      case CelestialType.STAR: return '#ffdd44';
      case CelestialType.PLANET: return '#44aaff';
      case CelestialType.MOON: return '#aabbcc';
      case CelestialType.STATION: return '#88ddff';
      case CelestialType.JUMP_POINT: return '#ffaa22';
      case CelestialType.LAGRANGE: return '#22ffaa';
      default: return '#ffffff';
    }
  }
  
  // We could apply more logic here to enhance colors based on celestial type
  return color;
};

/**
 * Get atmosphere color based on planet color
 */
const getAtmosphereColor = (planetColor: string | undefined): string => {
  if (!planetColor) return '#88aaff';
  
  // Simple logic to make atmosphere a lighter blue tint of the planet color
  try {
    const color = planetColor.replace('#', '');
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    
    // More blue, lighter atmosphere
    const ar = Math.min(255, Math.floor(r * 0.5 + 100));
    const ag = Math.min(255, Math.floor(g * 0.5 + 120));
    const ab = Math.min(255, Math.floor(b * 0.7 + 150));
    
    return `#${ar.toString(16).padStart(2, '0')}${ag.toString(16).padStart(2, '0')}${ab.toString(16).padStart(2, '0')}`;
  } catch (e) {
    return '#88aaff';
  }
};

/**
 * Calculate rotation period based on size and type
 */
const calculateRotationPeriod = (
  diameter: number, 
  type: CelestialType
): number => {
  // Rough estimations:
  switch (type) {
    case CelestialType.STAR: return 600; // ~25 days
    case CelestialType.PLANET: 
      return 24 * (diameter / 1000); // Roughly scales with diameter
    case CelestialType.MOON: 
      return Math.max(24, 12 * (diameter / 300)); // Smaller moons rotate faster
    case CelestialType.STATION: 
      return 6; // Artificial rotation for habitation
    default: 
      return 24;
  }
};

/**
 * Build orbit data for a celestial object
 */
const buildOrbitData = (
  child: { position: Position },
  parent: { position: Position },
  parentName: string
): OrbitData => {
  // Get parent position
  const parentPosition = positionToArray(parent.position);
  
  // Calculate actual distance from parent to child
  const childPos = new Array(3);
  childPos[0] = child.position.x - parent.position.x;
  childPos[1] = child.position.y - parent.position.y;
  childPos[2] = child.position.z - parent.position.z;
  
  // Calculate semi-major axis (distance)
  const distance = Math.sqrt(
    childPos[0] * childPos[0] + 
    childPos[1] * childPos[1] + 
    childPos[2] * childPos[2]
  );
  
  // Calculate inclination based on z-component (angle from x-y plane)
  // Improved calculation for true inclination
  const xy = Math.sqrt(childPos[0] * childPos[0] + childPos[1] * childPos[1]);
  const inclination = Math.atan2(childPos[2], xy) * (180 / Math.PI);
  
  // Calculate rotation (longitude of ascending node - angle in x-y plane)
  // This determines where around the parent the object orbits
  const rotation = Math.atan2(childPos[1], childPos[0]) * (180 / Math.PI);
  
  // Add slight eccentricity but keep orbits mostly circular
  const eccentricity = 0.05; 
  
  console.debug(`Orbit data for child of ${parentName}:`, {
    distance: distance / 1000000000, // in Gm
    inclination,
    rotation,
    eccentricity,
    childPosition: [
      child.position.x / 1000000000, 
      child.position.y / 1000000000, 
      child.position.z / 1000000000
    ],
    parentPosition: [
      parent.position.x / 1000000000, 
      parent.position.y / 1000000000, 
      parent.position.z / 1000000000
    ]
  });
  
  return {
    parentPosition,
    semiMajorAxis: distance / 1000000000, // Convert meters to Gm
    eccentricity,
    inclination,
    rotation
  };
};

/**
 * Process a star from the loaded data
 */
const processStar = (star: Star): CelestialObjectData => {
  return {
    name: star.label,
    diameter: star.diameter / 1000, // convert to km
    position: positionToArray(star.position),
    color: enhanceHolographicColor(star.color, CelestialType.STAR),
    description: star.description,
    rotationPeriod: calculateRotationPeriod(star.diameter / 1000, CelestialType.STAR)
  };
};

/**
 * Process a planet and its moons from the loaded data
 */
const processPlanet = (
  planet: Planet, 
  parent: Star | Planet,
  allObjects: Record<string, any>
): CelestialObjectData => {
  // Create basic planet data
  const planetData: CelestialObjectData = {
    name: planet.label,
    diameter: planet.diameter / 1000, // convert to km
    color: enhanceHolographicColor(planet.color, CelestialType.PLANET),
    atmosphereColor: getAtmosphereColor(planet.color),
    atmosphereIntensity: planet.atmosphericHeight ? 0.5 : 0.2,
    description: planet.description,
    rotationPeriod: calculateRotationPeriod(planet.diameter / 1000, CelestialType.PLANET),
    orbitData: buildOrbitData(planet, parent, parent.name),
    children: []
  };
  
  // Process children if any
  if (planet.children) {
    planetData.children = planet.children
      .filter(child => child.type === 'moon' || child.type === 'station')
      .map(child => {
        if (child.type === 'moon') {
          return processMoon(child as Moon, planet, allObjects);
        } else {
          return processStation(child as Station, planet);
        }
      });
  }
  
  return planetData;
};

/**
 * Process a moon from the loaded data
 */
const processMoon = (
  moon: Moon, 
  parent: Planet,
  allObjects: Record<string, any>
): CelestialObjectData => {
  // Create basic moon data
  const moonData: CelestialObjectData = {
    name: moon.label,
    diameter: moon.diameter / 1000, // convert to km
    color: enhanceHolographicColor(moon.color, CelestialType.MOON),
    description: moon.description,
    rotationPeriod: calculateRotationPeriod(moon.diameter / 1000, CelestialType.MOON),
    orbitData: buildOrbitData(moon, parent, parent.name),
    children: []
  };
  
  // Process stations if any
  if (moon.children) {
    moonData.children = moon.children
      .filter(child => child.type === 'station')
      .map(station => processStation(station as Station, moon));
  }
  
  return moonData;
};

/**
 * Process a station from the loaded data
 */
const processStation = (
  station: Station, 
  parent: Planet | Moon
): CelestialObjectData => {
  // Stations don't have diameter, set a reasonable size
  const stationSize = 5; // 5km
  
  return {
    name: station.label,
    size: stationSize,
    color: enhanceHolographicColor(station.color, CelestialType.STATION),
    description: station.description,
    rotationPeriod: calculateRotationPeriod(stationSize, CelestialType.STATION),
    orbitData: buildOrbitData(station, parent, parent.name)
  };
};

/**
 * Process a jump point from the loaded data
 */
const processJumpPoint = (
  jumpPoint: JumpPoint, 
  parent: Star
): CelestialObjectData => {
  // Jump points don't have diameter, set a reasonable size
  const jumpPointSize = 20; // 20km
  
  return {
    name: jumpPoint.label,
    size: jumpPointSize,
    color: enhanceHolographicColor(jumpPoint.color, CelestialType.JUMP_POINT),
    description: jumpPoint.description,
    destination: jumpPoint.destination,
    orbitData: buildOrbitData(jumpPoint, parent, parent.name)
  };
};

/**
 * Load system data and transform it for visualization
 */
export const loadSystemData = async (): Promise<{
  star: CelestialObjectData;
  planets: CelestialObjectData[];
  jumpPoints: CelestialObjectData[];
}> => {
  try {
    // Load data from JSON file
    const response = await fetch('/src/stanton_system_map.json');
    const data = await response.json() as StantonSystem;
    
    // Create a lookup for all objects
    const allObjects: Record<string, any> = {};
    
    // Process star data
    const star = processStar(data.root);
    allObjects[data.root.name] = data.root;
    
    // Process planets and jump points
    const planets: CelestialObjectData[] = [];
    const jumpPoints: CelestialObjectData[] = [];
    
    if (data.root.children) {
      // Index all objects for parent-child relationships
      const indexObjects = (obj: any) => {
        allObjects[obj.name] = obj;
        if (obj.children) {
          obj.children.forEach(indexObjects);
        }
      };
      
      data.root.children.forEach(indexObjects);
      
      // Process all direct children of the star
      data.root.children.forEach(child => {
        if (child.type === 'planet') {
          planets.push(processPlanet(child as Planet, data.root, allObjects));
        } else if (child.type === 'jump_point') {
          jumpPoints.push(processJumpPoint(child as JumpPoint, data.root));
        }
        // We skip lagrange points for this implementation
      });
    }
    
    return { star, planets, jumpPoints };
  } catch (error) {
    console.error('Failed to load system data:', error);
    
    // Return mock data as fallback
    return {
      star: {
        name: "Stanton",
        diameter: 696000, // km
        color: "#F9D71C",
        position: [0, 0, 0] as [number, number, number],
        rotationPeriod: 600
      },
      planets: [
        {
          name: "microTech",
          diameter: 1000, // km
          color: "#EDF5FA",
          atmosphereColor: "#88EEFF",
          atmosphereIntensity: 0.5,
          orbitData: {
            parentPosition: [0, 0, 0] as [number, number, number],
            semiMajorAxis: 22.5, // Gm
            eccentricity: 0.05,
            inclination: 2,
            rotation: 45
          },
          children: [
            {
              name: "Clio",
              diameter: 287, // km
              color: "#AABBCC",
              orbitData: {
                parentPosition: [22.5, 0, 0] as [number, number, number],
                semiMajorAxis: 1.2, // Gm
                eccentricity: 0.01,
                inclination: 5,
                rotation: 10
              }
            }
          ]
        }
      ],
      jumpPoints: [
        {
          name: "Stanton-Pyro Jump",
          size: 20, // km
          color: "#FFAA22",
          destination: "Pyro System",
          orbitData: {
            parentPosition: [0, 0, 0] as [number, number, number],
            semiMajorAxis: 30, // Gm
            eccentricity: 0.1,
            inclination: 15,
            rotation: 75
          }
        }
      ]
    };
  }
};

// Interfaces for data processing
interface CelestialObject {
  name: string;
  label?: string;
  type: string;
  position?: Position;
  parent?: string;
  diameter?: number;
  color?: string;
  children?: CelestialObject[];
  visualRadius?: number;
  atmosphereRadius?: number;
}

interface ProcessedObject {
  id: string;
  name: string;
  type: CelestialType;
  position: Vector3;
  size: number;
  color: string;
  parent: string | null;
  children: string[];
  orbit?: {
    parentPosition: Vector3;
    semiMajorAxis: number;
    eccentricity?: number;
    inclination?: number;
    rotation?: number;
  };
  atmosphereColor?: string;
  atmosphereIntensity?: number;
  description?: string;
}

class SystemDataService {
  private rawData: any;
  private processedData: { [id: string]: ProcessedObject } = {};
  private rootObject: string | null = null;
  
  constructor() {
    this.rawData = stantonData;
    this.processSystemData();
    this.logDebugInfo();
  }
  
  /**
   * Process the raw system data into a format usable for visualization
   */
  private processSystemData(): void {
    if (!this.rawData || !this.rawData.root) {
      console.error('Invalid system data format');
      return;
    }
    
    // Process the hierarchical structure starting from the root
    this.processObject(this.rawData.root, null);
    this.rootObject = this.rawData.root.name;
    
    console.log('System data processed', {
      objectCount: Object.keys(this.processedData).length,
      root: this.rootObject
    });
  }
  
  /**
   * Process a celestial object and its children
   */
  private processObject(obj: CelestialObject, parentId: string | null): void {
    if (!obj.name) {
      console.warn('Object without name found', obj);
      return;
    }
    
    const id = obj.name;
    const name = obj.label || obj.name;
    
    // Determine object type
    let type: CelestialType;
    switch (obj.type?.toLowerCase()) {
      case 'star':
        type = CelestialType.STAR;
        break;
      case 'planet':
        type = CelestialType.PLANET;
        break;
      case 'moon':
        type = CelestialType.MOON;
        break;
      case 'station':
      case 'outpost':
        type = CelestialType.STATION;
        break;
      case 'gateway':
      case 'jumppoint':
        type = CelestialType.JUMP_POINT;
        break;
      case 'lagrange':
        type = CelestialType.LAGRANGE;
        break;
      default:
        type = CelestialType.STATION; // Default fallback
    }
    
    // Convert position to Vector3
    const position = obj.position 
      ? new Vector3(
          obj.position.x / 1000000000, // Convert from meters to Gm
          obj.position.y / 1000000000,
          obj.position.z / 1000000000
        )
      : new Vector3(0, 0, 0);
    
    // Determine size (diameter or radius)
    let size = 0;
    if (obj.diameter) {
      size = obj.diameter;
    } else if (obj.visualRadius) {
      size = obj.visualRadius * 2;
    } else {
      // Default sizes based on type
      switch (type) {
        case CelestialType.STAR:
          size = 1000000; // 1,000,000 km
          break;
        case CelestialType.PLANET:
          size = 1000; // 1,000 km
          break;
        case CelestialType.MOON:
          size = 300; // 300 km
          break;
        default:
          size = 10; // 10 km
      }
    }
    
    // Calculate orbital parameters if there's a parent
    const orbit = parentId && this.processedData[parentId] ? (() => {
      const parent = this.processedData[parentId];
      const parentPos = parent.position;
      
      // Calculate the vector from parent to child
      const childVec = new Vector3().subVectors(position, parentPos);
      const distanceToParent = childVec.length();
      
      // Calculate inclination (angle from x-y plane)
      const xy = Math.sqrt(childVec.x * childVec.x + childVec.y * childVec.y);
      const inclination = Math.atan2(childVec.z, xy) * (180 / Math.PI);
      
      // Calculate rotation (angle in x-y plane)
      const rotation = Math.atan2(childVec.y, childVec.x) * (180 / Math.PI);
      
      console.debug(`Orbit data for ${name} (child of ${this.processedData[parentId].name}):`, {
        distance: distanceToParent,
        inclination,
        rotation,
        childPosition: position.toArray(),
        parentPosition: parentPos.toArray()
      });
      
      return {
        parentPosition: parentPos,
        semiMajorAxis: distanceToParent,
        eccentricity: 0.01,
        inclination,
        rotation
      };
    })() : undefined;
    
    // Generate a color if not provided
    const color = obj.color || this.generateColorForType(type);
    
    // Create the processed object
    this.processedData[id] = {
      id,
      name,
      type,
      position,
      size,
      color,
      parent: parentId,
      children: [],
      orbit,
      atmosphereColor: this.generateAtmosphereColor(color),
      atmosphereIntensity: 0.3,
      description: `${name} - ${type}`
    };
    
    // Add this object as a child to its parent
    if (parentId && this.processedData[parentId]) {
      this.processedData[parentId].children.push(id);
    }
    
    // Process children recursively
    if (obj.children && Array.isArray(obj.children)) {
      obj.children.forEach(child => {
        this.processObject(child, id);
      });
    }
  }
  
  /**
   * Generate a color based on object type
   */
  private generateColorForType(type: CelestialType): string {
    switch (type) {
      case CelestialType.STAR:
        return '#F9D71C'; // Yellow
      case CelestialType.PLANET:
        return '#78A0C3'; // Blue-gray
      case CelestialType.MOON:
        return '#AABBCC'; // Light gray
      case CelestialType.STATION:
        return '#88DDFF'; // Light blue
      case CelestialType.JUMP_POINT:
        return '#FFAA22'; // Orange
      case CelestialType.LAGRANGE:
        return '#22FFAA'; // Teal
      default:
        return '#FFFFFF'; // White
    }
  }
  
  /**
   * Generate atmosphere color based on planet color
   */
  private generateAtmosphereColor(baseColor: string): string {
    // For now, just return a light blue color
    return '#88EEFF';
  }
  
  /**
   * Get all processed celestial objects
   */
  getAllObjects(): { [id: string]: ProcessedObject } {
    return this.processedData;
  }
  
  /**
   * Get the root object of the system
   */
  getRootObject(): ProcessedObject | null {
    return this.rootObject ? this.processedData[this.rootObject] : null;
  }
  
  /**
   * Get objects by type
   */
  getObjectsByType(type: CelestialType): ProcessedObject[] {
    return Object.values(this.processedData).filter(obj => obj.type === type);
  }
  
  /**
   * Get children of an object
   */
  getChildren(objectId: string): ProcessedObject[] {
    const parent = this.processedData[objectId];
    if (!parent) return [];
    
    return parent.children.map(childId => this.processedData[childId]);
  }
  
  /**
   * Log debug information about the system
   */
  logDebugInfo(): void {
    // Count objects by type
    const countByType: Record<string, number> = {};
    Object.values(this.processedData).forEach(obj => {
      countByType[obj.type] = (countByType[obj.type] || 0) + 1;
    });
    
    // Calculate some distances to verify
    const microTech = this.getObjectByName('microTech');
    const arcCorp = this.getObjectByName('ArcCorp');
    const hurston = this.getObjectByName('Hurston');
    const crusader = this.getObjectByName('Crusader');
    const yela = this.getObjectByName('Yela');
    const daymar = this.getObjectByName('Daymar');
    
    const distances = {
      'MicroTech to ArcCorp': microTech && arcCorp ? 
        microTech.position.distanceTo(arcCorp.position).toFixed(2) + ' Gm' : 'N/A',
      'Hurston to Crusader': hurston && crusader ? 
        hurston.position.distanceTo(crusader.position).toFixed(2) + ' Gm' : 'N/A',
      'Yela to Daymar': yela && daymar ? 
        yela.position.distanceTo(daymar.position).toFixed(2) + ' Gm' : 'N/A'
    };
    
    // Log detailed system info
    console.info('%c Stanton System Info ', 'background: #002244; color: #88CCFF; font-weight: bold;');
    console.info('Objects by type:', countByType);
    console.info('Key distances:', distances);
    console.info('Scale factor (1 unit = n Gm):', SCALE_FACTOR);
    
    // Output planets for verification
    const planets = this.getObjectsByType(CelestialType.PLANET);
    console.info('Planets:', planets.map(p => ({
      name: p.name,
      position: {
        x: p.position.x.toFixed(2),
        y: p.position.y.toFixed(2),
        z: p.position.z.toFixed(2)
      },
      size: p.size,
      parent: p.parent
    })));
  }
  
  /**
   * Find an object by name (case insensitive)
   */
  getObjectByName(name: string): ProcessedObject | null {
    const lowerName = name.toLowerCase();
    const match = Object.values(this.processedData).find(
      obj => obj.name.toLowerCase() === lowerName
    );
    return match || null;
  }
  
  /**
   * Force reprocessing of the data
   */
  reprocessData(): void {
    console.log('Reprocessing system data...');
    // Clear existing data
    this.processedData = {};
    this.rootObject = null;
    
    // Process data again
    this.processSystemData();
    this.logDebugInfo();
  }
}

// Export singleton instance
export const systemDataService = new SystemDataService();
export default systemDataService; 