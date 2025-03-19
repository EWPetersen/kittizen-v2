// Export all interfaces from the various files

// Celestial objects
export * from './celestial';

// Orbital parameters
export * from './orbital';

// Route alerts
export * from './routeAlerts';

// User profile
export * from './userProfile';

// Ships and fuel
export * from './ships';

// Route planning and AI predictions
export * from './routePlanning';

// Firestore schema
export * from './firestoreSchema';

// Constant for the 4-hour alert decay time in milliseconds
export const ALERT_DEFAULT_DECAY_TIME = 4 * 60 * 60 * 1000; // 4 hours in milliseconds 