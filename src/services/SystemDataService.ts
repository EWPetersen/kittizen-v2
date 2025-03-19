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