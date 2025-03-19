// Firestore Database Schema Definition - Main Collections
export const FirestoreCollections = {
  // Users collection
  users: {
    profile: {
      username: 'string',
      email: 'string',
      displayName: 'string',
      avatar: 'string',
      createdAt: 'timestamp',
      lastLogin: 'timestamp',
    },
    subscription: {
      tier: 'string', // 'free', 'basic', 'premium', 'enterprise'
      startDate: 'timestamp',
      endDate: 'timestamp',
      autoRenew: 'boolean',
    },
    features: {
      routePlanning: 'boolean',
      aiPredictions: 'boolean',
      alertCreation: 'boolean',
      extendedAlertLifetime: 'boolean',
      customShips: 'boolean',
      multiHopRoutes: 'boolean',
    },
    preferences: {
      theme: 'string',
      unitSystem: 'string',
      defaultShipId: 'string',
    },
    statistics: {
      routesPlanned: 'number',
      alertsCreated: 'number',
      contributionScore: 'number',
    },
    deviceTokens: 'array', // For push notifications
  },
  
  // Ships collection
  ships: {
    name: 'string',
    manufacturer: 'string',
    model: 'string',
    size: 'string', // 'small', 'medium', 'large', 'capital'
    role: 'string', // 'fighter', 'freighter', etc.
    crew: {
      min: 'number',
      max: 'number',
    },
    fuel: {
      quantum: {
        capacity: 'number',
        consumption: 'number',
      },
      hydrogen: {
        capacity: 'number',
        consumption: 'object', // Complex consumption rates
      },
    },
    isCustom: 'boolean',
    baseModelId: 'string',
    createdBy: 'string', // User ID for custom ships
  },
  
  // Route alerts collection
  routeAlerts: {
    type: 'string', // 'pirate', 'debris', 'asteroid', etc.
    title: 'string',
    description: 'string',
    severity: 'string', // 'low', 'medium', 'high', 'critical'
    status: 'string', // 'active', 'verified', 'expired', 'resolved', 'flagged'
    location: {
      x: 'number',
      y: 'number',
      z: 'number',
      nearestObjectId: 'string',
    },
    createdAt: 'timestamp',
    expiresAt: 'timestamp', // 4-hour default decay
    createdBy: 'string', // User ID
    verifications: 'number',
    flags: 'number',
    lastActivity: 'timestamp',
  },
  
  // Routes collection
  routes: {
    name: 'string',
    createdBy: 'string', // User ID
    createdAt: 'timestamp',
    isPublic: 'boolean',
    shipId: 'string',
    points: 'array', // Complex route points array
    totalDistance: 'number',
    estimatedDuration: 'number',
    fuelRequired: {
      quantum: 'number',
      hydrogen: 'number',
    },
    dangerLevel: 'number',
    activeAlerts: 'array', // Alert IDs
    optimizationStrategy: 'string', // 'fastest', 'fuelEfficient', etc.
  },
  
  // Multi-hop routes collection
  multiHopRoutes: {
    name: 'string',
    shipId: 'string',
    routes: 'array', // Array of route IDs
    totalDistance: 'number',
    totalDuration: 'number',
    checkpoints: 'array', // Key locations
    createdBy: 'string', // User ID
    isPublic: 'boolean',
  },
  
  // AI predictions collection
  aiPredictions: {
    createdAt: 'timestamp',
    expiresAt: 'timestamp',
    type: 'string', // 'security', 'traffic', 'pirate', etc.
    confidence: 'number',
    affectedArea: {
      center: {
        x: 'number',
        y: 'number',
        z: 'number',
      },
      radius: 'number',
      objectIds: 'array',
    },
    prediction: 'object', // Varies by type
    sources: 'array',
    historicalAccuracy: 'number',
  },
  
  // System data collection - cached version of the system map
  systemData: {
    name: 'string',
    label: 'string',
    type: 'string', // 'star', 'planet', 'moon', etc.
    position: {
      x: 'number',
      y: 'number',
      z: 'number',
    },
    parent: 'string', // Parent object ID
    attributes: 'object', // Various attributes based on type
    lastUpdated: 'timestamp',
  },
};

// Collection paths and subcollections
export const CollectionPaths = {
  USERS: 'users',
  USER_SHIPS: 'users/{userId}/ships',
  SHIPS: 'ships',
  ROUTE_ALERTS: 'routeAlerts',
  ALERT_VERIFICATIONS: 'routeAlerts/{alertId}/verifications',
  ROUTES: 'routes',
  SAVED_ROUTES: 'users/{userId}/savedRoutes',
  MULTI_HOP_ROUTES: 'multiHopRoutes',
  AI_PREDICTIONS: 'aiPredictions',
  SYSTEM_DATA: 'systemData',
}; 