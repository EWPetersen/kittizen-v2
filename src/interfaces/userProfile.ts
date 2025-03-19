// User subscription tiers
export enum SubscriptionTier {
  FREE = 'free',
  BASIC = 'basic',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise'
}

// Feature access flags
export interface FeatureAccess {
  routePlanning: boolean;
  aiPredictions: boolean;
  alertCreation: boolean;
  extendedAlertLifetime: boolean;
  fuelCalculations: boolean;
  offlineAccess: boolean;
  customShips: boolean;
  multiHopRoutes: boolean;
  prioritySupport: boolean;
  betaFeatures: boolean;
}

// User profile interface
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatar?: string;
  createdAt: number; // Unix timestamp
  lastLogin: number; // Unix timestamp
  subscription: {
    tier: SubscriptionTier;
    startDate: number; // Unix timestamp
    endDate?: number; // Unix timestamp for fixed term subscriptions
    autoRenew: boolean;
    paymentMethod?: string;
  };
  features: FeatureAccess;
  preferences: UserPreferences;
  statistics: UserStatistics;
  savedRoutes: string[]; // Array of route IDs
  favoriteLocations: string[]; // Array of location IDs
  deviceTokens: string[]; // For push notifications
}

// User preferences
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  unitSystem: 'metric' | 'imperial';
  timeFormat: '12h' | '24h';
  coordinateFormat: 'decimal' | 'dms';
  defaultMapView: 'system' | '3d' | '2d';
  alertNotifications: boolean;
  emailNotifications: boolean;
  defaultShipId?: string;
}

// User statistics
export interface UserStatistics {
  routesPlanned: number;
  alertsCreated: number;
  alertsVerified: number;
  distanceTraveled: number; // In meters
  systemsVisited: number;
  loginStreak: number;
  contributionScore: number; // Score based on contributions to the community
  reputation: number; // Reputation based on accuracy of alerts and contributions
  lastActiveTimestamp: number;
}

// Authentication data
export interface AuthData {
  userId: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiry: number; // Unix timestamp
  permissions: string[];
} 