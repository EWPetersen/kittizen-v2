// Ship size categories
export enum ShipSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  CAPITAL = 'capital'
}

// Ship role types
export enum ShipRole {
  FIGHTER = 'fighter',
  FREIGHTER = 'freighter',
  EXPLORER = 'explorer',
  MINING = 'mining',
  PASSENGER = 'passenger',
  MULTIPURPOSE = 'multipurpose',
  SUPPORT = 'support'
}

// Ship base interface
export interface Ship {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  size: ShipSize;
  role: ShipRole;
  crew: {
    min: number;
    max: number;
  };
  mass: number; // In kilograms
  cargo: number; // Cargo capacity in SCU
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  speed: {
    scm: number; // Space Combat Maneuvering speed (m/s)
    afterburner: number; // Afterburner speed (m/s)
    cruise: number; // Cruise speed (m/s)
    qtravel: {
      standardEntry: number; // Time to enter quantum travel (seconds)
      spoolTime: number; // Quantum drive spool time (seconds)
      maxSpeed: number; // Maximum quantum travel speed (m/s)
    }
  };
  fuel: FuelParameters;
  upgrades: ShipUpgrades;
  isCustom: boolean; // Whether this is a custom ship or standard
  baseModelId?: string; // Reference to the base model if this is a custom variant
  imageUrl?: string;
}

// Fuel parameters
export interface FuelParameters {
  quantum: {
    capacity: number; // Total quantum fuel capacity
    consumption: number; // Base consumption rate (per 1000km)
    currentLevel: number; // Current quantum fuel level
    refillRate: number; // Refill rate per minute
  };
  hydrogen: {
    capacity: number; // Total hydrogen fuel capacity
    consumption: {
      idle: number; // Consumption when idle
      scm: number; // Consumption at SCM speed
      afterburner: number; // Consumption with afterburner
    };
    currentLevel: number; // Current hydrogen fuel level
    refillRate: number; // Refill rate per minute
  };
  efficiency: number; // Overall fuel efficiency multiplier (1.0 = standard)
}

// Ship upgrades
export interface ShipUpgrades {
  quantum: {
    driveType: string;
    grade: 'civilian' | 'military' | 'industrial' | 'competition';
    efficiency: number; // Efficiency multiplier
    speedMultiplier: number; // Speed multiplier compared to base
  };
  engines: {
    thrusterType: string;
    grade: string;
    efficiency: number; // Efficiency multiplier
    heatGeneration: number; // Heat generation multiplier
  };
  powerPlant: {
    type: string;
    grade: string;
    output: number; // Power output
  };
  shields: {
    type: string;
    grade: string;
    capacity: number;
    regenRate: number;
  };
}

// Ship route planning parameters
export interface ShipRouteParameters {
  shipId: string;
  fuelSafetyMargin: number; // Percentage of fuel to keep as safety margin
  refuelStops: boolean; // Whether to include refuel stops in route planning
  avoidDangerZones: boolean; // Whether to avoid areas with active alerts
  avoidSecurity: boolean; // Whether to avoid security checkpoints
  prioritizeSafety: boolean; // Prioritize safety over speed
  prioritizeFuelEfficiency: boolean; // Prioritize fuel efficiency over speed
  customWaypoints: string[]; // Custom waypoints to include in route
} 