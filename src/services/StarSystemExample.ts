import StarSystemService from './StarSystemService';
import { UnitConversions } from './AstroUtilsService';

/**
 * This file demonstrates how to use the StarSystemService
 */

// Example 1: Get basic system information
export function getStarSystemInfo() {
  const systemData = StarSystemService.getSystemData();
  console.log(`Star System: ${systemData.systemName}`);
  console.log(`Metadata: Version ${systemData.metadata.Version}`);
  
  const star = StarSystemService.getRootBody();
  console.log(`Central star: ${star.label} (${star.diameter?.toLocaleString()} km diameter)`);
  
  const planets = StarSystemService.getBodiesByType('planet');
  console.log(`Number of planets: ${planets.length}`);
  planets.forEach(planet => {
    console.log(`- ${planet.label}: ${planet.description?.substring(0, 100)}...`);
  });
}

// Example 2: Calculate distances between celestial objects
export function calculateDistances() {
  const star = StarSystemService.getRootBody();
  const microtech = StarSystemService.getBodyByName('OOC_Stanton_4_Microtech');
  
  if (!microtech) {
    console.error('Could not find microTech');
    return;
  }
  
  // Distance to star in Gm
  const distanceToStar = StarSystemService.calculateDistanceBetweenBodies(
    star.name, 
    microtech.name
  );
  
  console.log(`Distance from ${star.label} to ${microtech.label}: ${
    UnitConversions.kmToGm(distanceToStar).toFixed(2)
  } Gm (${distanceToStar.toLocaleString()} km)`);
  
  // Find moons of microTech
  const moons = StarSystemService.getChildrenOfBody(microtech.name)
    .filter(body => body.type === 'moon');
  
  console.log(`\n${microtech.label} has ${moons.length} moons:`);
  
  // Calculate distances between planet and moons
  moons.forEach(moon => {
    const distanceToPlanet = StarSystemService.calculateDistanceBetweenBodies(
      microtech.name,
      moon.name
    );
    
    console.log(`- ${moon.label}: ${
      UnitConversions.kmToGm(distanceToPlanet).toFixed(3)
    } Gm (${distanceToPlanet.toLocaleString()} km)`);
  });
}

// Example 3: Calculate positions based on orbital parameters and time
export function calculatePositionsOverTime() {
  const microtech = StarSystemService.getBodyByName('OOC_Stanton_4_Microtech');
  if (!microtech) return;
  
  console.log(`\nCalculating ${microtech.label}'s position over time:`);
  
  // Calculate positions at different times
  const timePoints = [0, 24, 48, 72]; // hours
  
  timePoints.forEach(time => {
    const position = StarSystemService.calculateCurrentPosition(microtech, time);
    console.log(`Time: ${time} hours - Position: X: ${position.x.toExponential(4)}, Y: ${position.y.toExponential(4)}, Z: ${position.z.toExponential(4)}`);
  });
}

// Example 4: Get details about a specific location
export function getOutpostDetails() {
  const newBabbage = StarSystemService.getBodyByName('OOC_Stanton4_NewBabbage');
  const microTech = StarSystemService.getBodyByName('OOC_Stanton_4_Microtech');
  
  console.log('\nSearching for outposts on microTech...');
  
  if (microTech) {
    // Get all outposts on the planet by filtering children
    const allOutposts = StarSystemService.getAllBodies().filter(body => 
      body.type === 'outpost' && body.parent === microTech.name
    );
    
    console.log(`Found ${allOutposts.length} outposts on ${microTech.label}:`);
    allOutposts.forEach(outpost => {
      console.log(`- ${outpost.label}`);
      
      // Calculate relative position to planet center
      const relPos = StarSystemService.getRelativePosition(outpost.position, microTech.position);
      const distanceFromCenter = StarSystemService.calculateDistance(relPos);
      
      console.log(`  Distance from planet center: ${(distanceFromCenter / 1000).toFixed(2)} km`);
      console.log(`  Relative position: X: ${relPos.x.toExponential(2)}, Y: ${relPos.y.toExponential(2)}, Z: ${relPos.z.toExponential(2)}`);
    });
  }
}

// Run all examples
export function runAllExamples() {
  console.log('=== STANTON SYSTEM EXPLORER ===\n');
  getStarSystemInfo();
  console.log('\n---\n');
  calculateDistances();
  console.log('\n---\n');
  calculatePositionsOverTime();
  console.log('\n---\n');
  getOutpostDetails();
}

// Uncomment to run examples
// runAllExamples(); 