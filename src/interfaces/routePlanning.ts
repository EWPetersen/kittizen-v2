import { Position } from './celestial';

// Route point interface
export interface RoutePoint {
  id: string;
  name: string;
  position: Position;
  objectId?: string; // Reference to a celestial object if applicable
  type: 'departure' | 'destination' | 'waypoint' | 'refuel' | 'jumpPoint' | 'avoidance';
  estimatedTimeOfArrival?: number; // Unix timestamp
  distanceFromPrevious?: number; // Distance from previous point in meters
  fuelRequiredFromPrevious?: {
    quantum: number;
    hydrogen: number;
  };
  estimatedTimeFromPrevious?: number; // Estimated travel time in seconds
}

// Complete route interface
export interface Route {
  id: string;
  name: string;
  createdBy: string; // User ID
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
  isPublic: boolean;
  description?: string;
  shipId: string; // The ship this route was calculated for
  points: RoutePoint[];
  totalDistance: number; // Total distance in meters
  estimatedDuration: number; // Total estimated time in seconds
  fuelRequired: {
    quantum: number;
    hydrogen: number;
  };
  dangerLevel: number; // 0-100 danger assessment
  activeAlerts: string[]; // IDs of active alerts along route
  tags: string[];
  optimizationStrategy: 'fastest' | 'fuelEfficient' | 'safest' | 'balanced';
}

// Multi-hop route planning
export interface MultiHopRoute {
  id: string;
  name: string;
  shipId: string;
  routes: Route[]; // Array of connected routes
  totalDistance: number;
  totalDuration: number;
  totalFuelRequired: {
    quantum: number;
    hydrogen: number;
  };
  checkpoints: string[]; // Key locations to visit in order
  optimizationStrategy: 'fastest' | 'fuelEfficient' | 'safest' | 'balanced' | 'custom';
  customParameters?: any; // Custom optimization parameters
}

// AI prediction data structures
export interface AIPrediction {
  id: string;
  createdAt: number; // Unix timestamp
  expiresAt: number; // Unix timestamp
  type: 'security' | 'traffic' | 'pirate' | 'weather' | 'prices';
  confidence: number; // 0-1 confidence level
  affectedArea: {
    center: Position;
    radius: number; // Radius in meters
    objectIds: string[]; // Affected celestial objects
  };
  prediction: any; // Specific prediction data (varies by type)
  sources: string[]; // Data sources used for prediction
  historicalAccuracy: number; // Historical accuracy of similar predictions (0-1)
}

// Security prediction
export interface SecurityPrediction extends AIPrediction {
  type: 'security';
  prediction: {
    securityLevel: 'low' | 'medium' | 'high';
    patrols: number; // Predicted patrol frequency
    checkpoints: boolean; // Presence of security checkpoints
    response: number; // Estimated response time in seconds
  };
}

// Traffic prediction
export interface TrafficPrediction extends AIPrediction {
  type: 'traffic';
  prediction: {
    density: 'low' | 'medium' | 'high';
    congestion: number; // 0-1 congestion factor
    popular: boolean; // Whether this is a popular route
    timeMultiplier: number; // Time multiplier due to traffic
  };
}

// Pirate prediction
export interface PiratePrediction extends AIPrediction {
  type: 'pirate';
  prediction: {
    activity: 'low' | 'medium' | 'high';
    shipTypes: string[]; // Types of pirate ships predicted
    organized: boolean; // Whether organized pirate groups are predicted
    ambushRisk: number; // 0-1 risk of ambush
  };
} 