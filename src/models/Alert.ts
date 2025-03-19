import { Position } from './CelestialBody';

export type AlertType = 'danger' | 'info' | 'warning' | 'opportunity';

export interface Alert {
  id: string;
  userId: string;
  title: string;
  description: string;
  position: Position;
  nearestBodyName: string;
  type: AlertType;
  createdAt: number;
  expiresAt?: number;
  isPublic: boolean;
} 