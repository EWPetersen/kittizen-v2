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
  
  // Calculate inclination based on z-component
  const inclination = Math.atan2(childPos[2], Math.sqrt(childPos[0] * childPos[0] + childPos[1] * childPos[1])) * (180 / Math.PI);
  
  // Calculate rotation (longitude of ascending node)
  const rotation = Math.atan2(childPos[1], childPos[0]) * (180 / Math.PI);
  
  // In a real implementation, we'd calculate eccentricity from actual orbital elements
  // Here we'll just use a simplified approach with random small eccentricity
  const eccentricity = Math.random() * 0.1; // 0-0.1 eccentricity
  
  return {
    parentPosition,
    semiMajorAxis: distance,
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
    try {
      if (!this.rawData || !this.rawData.root) {
        console.error('Failed to load system data: missing root object');
        return;
      }
      
      // Process the root star
      this.processObject(this.rawData.root, null);
      this.rootObject = this.rawData.root.name;
      
      // After processing all objects, ensure all parent-child relationships are correctly set
      this.fixParentChildRelationships();
      
      console.info('System data loaded successfully');
    } catch (error) {
      console.error('Error processing system data:', error);
    }
  }
  
  /**
   * Fix any inconsistencies in parent-child relationships
   * This is needed because the JSON data stores absolute positions
   */
  private fixParentChildRelationships(): void {
    // In our data, planets and moons have parent fields but are positioned with absolute coordinates
    // This function ensures the moons are correctly attached to their parents
    
    // Get all objects
    const objects = Object.values(this.processedData);
    
    // Fix moon parent relationships
    const moons = objects.filter(obj => obj.type === CelestialType.MOON);
    
    moons.forEach(moon => {
      if (moon.parent) {
        // Find the parent object
        const parent = this.processedData[moon.parent];
        
        if (parent) {
          // Ensure this moon is in the parent's children array
          if (!parent.children.includes(moon.id)) {
            parent.children.push(moon.id);
          }
          
          // Log for debugging
          console.debug(`Fixed parent-child relationship: ${moon.name} -> ${parent.name}`);
        }
      }
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
    let position: Vector3;
    
    if (obj.position) {
      // Convert position from meters to Gm
      position = new Vector3(
        obj.position.x / 1000000000,
        obj.position.y / 1000000000,
        obj.position.z / 1000000000
      );
    } else {
      position = new Vector3(0, 0, 0);
    }
    
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
      const distanceToParent = position.distanceTo(parentPos);
      
      return {
        parentPosition: parentPos,
        semiMajorAxis: distanceToParent,
        // We're using simplified orbital parameters since we don't have full Keplerian elements
        eccentricity: 0.01, // Low default eccentricity
        inclination: Math.random() * 5 // Random inclination between 0-5 degrees
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
    console.debug('SystemDataService - Object Count:', Object.keys(this.processedData).length);
    console.debug('SystemDataService - Root Object:', this.rootObject);

    // Log all planets and their positions
    console.debug('SystemDataService - Planets:');
    const planets = this.getObjectsByType(CelestialType.PLANET);
    planets.forEach(planet => {
      console.debug(`Planet ${planet.name}:`, {
        position: {
          x: planet.position.x.toFixed(4),
          y: planet.position.y.toFixed(4),
          z: planet.position.z.toFixed(4)
        },
        size: planet.size,
        parent: planet.parent
      });
    });

    // Log all moons and their positions
    console.debug('SystemDataService - Moons:');
    const moons = this.getObjectsByType(CelestialType.MOON);
    moons.forEach(moon => {
      const parentObj = moon.parent ? this.processedData[moon.parent] : null;
      console.debug(`Moon ${moon.name} (parent: ${moon.parent}):`, {
        position: {
          x: moon.position.x.toFixed(4),
          y: moon.position.y.toFixed(4),
          z: moon.position.z.toFixed(4)
        },
        parentPosition: parentObj ? {
          x: parentObj.position.x.toFixed(4),
          y: parentObj.position.y.toFixed(4),
          z: parentObj.position.z.toFixed(4)
        } : 'Unknown',
        size: moon.size,
        parentName: parentObj ? parentObj.name : 'Unknown'
      });
    });

    // Log parent-child relationships
    console.debug('SystemDataService - Parent-Child Relationships:');
    Object.keys(this.processedData).forEach(id => {
      const obj = this.processedData[id];
      if (obj.parent) {
        const parentObj = this.processedData[obj.parent];
        if (parentObj) {
          console.debug(`${obj.name} -> ${parentObj.name}`);
        } else {
          console.debug(`${obj.name} -> Unknown parent: ${obj.parent}`);
        }
      }
    });
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
}

// Export singleton instance
export const systemDataService = new SystemDataService();
export default systemDataService; 