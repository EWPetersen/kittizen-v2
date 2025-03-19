import { StantonSystem, CelestialBody } from '../models/CelestialBody';
import stantonData from '../stanton_system_map.json';

class StarSystemService {
  private systemData: StantonSystem;
  
  constructor() {
    this.systemData = stantonData as StantonSystem;
  }
  
  getSystemData(): StantonSystem {
    return this.systemData;
  }
  
  getRootBody(): CelestialBody {
    return this.systemData.root;
  }
  
  getAllBodies(): CelestialBody[] {
    const bodies: CelestialBody[] = [];
    this.flattenBodies(this.systemData.root, bodies);
    return bodies;
  }
  
  getBodyByName(name: string): CelestialBody | undefined {
    return this.findBodyByName(this.systemData.root, name);
  }
  
  private flattenBodies(body: CelestialBody, result: CelestialBody[]): void {
    result.push(body);
    if (body.children) {
      for (const child of body.children) {
        this.flattenBodies(child, result);
      }
    }
  }
  
  private findBodyByName(body: CelestialBody, name: string): CelestialBody | undefined {
    if (body.name === name) {
      return body;
    }
    
    if (body.children) {
      for (const child of body.children) {
        const found = this.findBodyByName(child, name);
        if (found) {
          return found;
        }
      }
    }
    
    return undefined;
  }
  
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
  
  getBodyColor(body: CelestialBody): string {
    return body.color || '#FFFFFF';
  }
}

export default new StarSystemService(); 