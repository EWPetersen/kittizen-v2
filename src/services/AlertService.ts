import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { Alert, AlertType } from '../models/Alert';
import { Position } from '../models/CelestialBody';

class AlertService {
  private readonly COLLECTION_NAME = 'alerts';
  
  async createAlert(alert: Omit<Alert, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, this.COLLECTION_NAME), {
      ...alert,
      createdAt: Timestamp.fromDate(new Date()).toMillis(),
    });
    return docRef.id;
  }
  
  async updateAlert(id: string, data: Partial<Omit<Alert, 'id' | 'userId'>>): Promise<void> {
    const alertRef = doc(db, this.COLLECTION_NAME, id);
    await updateDoc(alertRef, data);
  }
  
  async deleteAlert(id: string): Promise<void> {
    const alertRef = doc(db, this.COLLECTION_NAME, id);
    await deleteDoc(alertRef);
  }
  
  async getPublicAlerts(): Promise<Alert[]> {
    const q = query(
      collection(db, this.COLLECTION_NAME),
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ 
      id: doc.id,
      ...doc.data() 
    } as Alert));
  }
  
  async getUserAlerts(userId: string): Promise<Alert[]> {
    const q = query(
      collection(db, this.COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ 
      id: doc.id,
      ...doc.data() 
    } as Alert));
  }
  
  async getAlertsNearPosition(position: Position, radiusKm: number): Promise<Alert[]> {
    // For simplicity, we'll fetch all alerts and filter on the client side
    // A more complex implementation would use geofencing or spatial queries
    const allAlerts = await this.getPublicAlerts();
    
    return allAlerts.filter(alert => {
      const distance = this.calculateDistance(position, alert.position);
      return distance <= radiusKm;
    });
  }
  
  private calculateDistance(pos1: Position, pos2: Position): number {
    // Simple Euclidean distance calculation
    // In a real application, would need to account for the scale of the system
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;
    
    return Math.sqrt(dx * dx + dy * dy + dz * dz) / 1000000; // Convert to km
  }
}

export default new AlertService(); 