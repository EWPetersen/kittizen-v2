// Orbital parameters interface
export interface OrbitalParameters {
  semiMajorAxis: number;    // Distance from the center of the orbit to the center of the celestial body
  eccentricity: number;     // Shape of the ellipse (0 = circular, 0-1 = elliptical)
  inclination: number;      // Tilt of the orbital plane (in degrees)
  argumentOfPeriapsis: number; // Orientation of the ellipse in the orbital plane
  longitudeOfAscendingNode: number; // Where the orbit crosses the reference plane
  meanAnomalyAtEpoch: number;     // Position of the object at a specific time
  period: number;           // Time taken to complete one orbit (in seconds)
  epoch?: number;           // Reference time for orbital elements (unix timestamp)
}

// Orbit prediction interface for calculating future positions
export interface OrbitPrediction {
  objectId: string;         // Reference to the celestial object
  startTime: number;        // Prediction start time (unix timestamp)
  endTime: number;          // Prediction end time (unix timestamp)
  timeStep: number;         // Time between prediction points (seconds)
  positions: PredictedPosition[];  // Array of predicted positions
}

// Predicted position at a specific time
export interface PredictedPosition {
  time: number;             // Unix timestamp
  position: {
    x: number;
    y: number;
    z: number;
  };
  velocity?: {              // Optional velocity vector
    x: number;
    y: number;
    z: number;
  };
}

// Transit information between celestial bodies
export interface Transit {
  departureObjectId: string;
  arrivalObjectId: string;
  departureTime: number;    // Unix timestamp
  arrivalTime: number;      // Unix timestamp
  distance: number;         // Distance in meters
  fuelConsumption?: number; // Optional fuel consumption estimate
}

// Gravitational influence data
export interface GravitationalInfluence {
  objectId: string;
  sphereOfInfluenceRadius: number; // Radius where object's gravity is dominant
  escapeVelocity: number;         // Velocity needed to escape gravity
} 