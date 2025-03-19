// Types of route alerts
export enum AlertType {
  PIRATE = 'pirate',
  DEBRIS = 'debris',
  ASTEROID = 'asteroid',
  SECURITY = 'security',
  RESCUE = 'rescue',
  OTHER = 'other'
}

// Severity levels for alerts
export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Alert status
export enum AlertStatus {
  ACTIVE = 'active',
  VERIFIED = 'verified',
  EXPIRED = 'expired',
  RESOLVED = 'resolved',
  FLAGGED = 'flagged'
}

// Base route alert interface
export interface RouteAlert {
  id: string;
  type: AlertType;
  title: string;
  description: string;
  severity: AlertSeverity;
  status: AlertStatus;
  location: {
    x: number;
    y: number;
    z: number;
    nearestObjectId?: string; // Reference to nearest celestial object
    distanceFromObject?: number;
  };
  createdAt: number; // Unix timestamp
  expiresAt: number; // Unix timestamp (createdAt + 4 hours by default)
  createdBy: string; // User ID
  verifications: number; // Number of users who verified this alert
  flags: number; // Number of users who flagged this as inaccurate
  lastActivity: number; // Timestamp of last verification/flag
}

// Alert decay system parameters
export interface AlertDecaySystem {
  defaultExpirationTime: number; // 4 hours in milliseconds (14400000)
  verificationBonus: number; // Additional time added per verification (in ms)
  maxLifetime: number; // Maximum lifetime regardless of verifications
  decayRate: number; // Rate at which reliability decreases over time
  minVerificationsForExtension: number; // Minimum verifications needed to extend lifetime
}

// Alert filter parameters
export interface AlertFilter {
  types?: AlertType[];
  severities?: AlertSeverity[];
  statuses?: AlertStatus[];
  newerThan?: number; // Unix timestamp
  olderThan?: number; // Unix timestamp
  nearObjectId?: string; // Find alerts near a specific object
  radius?: number; // Search radius in meters
  minVerifications?: number;
  createdBy?: string; // Filter by creator
}

// Alert notification subscription
export interface AlertSubscription {
  userId: string;
  filters: AlertFilter;
  notificationMethod: 'app' | 'email' | 'both';
  enabled: boolean;
} 