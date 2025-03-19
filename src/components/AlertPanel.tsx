import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AlertService from '../services/AlertService';
import { Alert, AlertType } from '../models/Alert';
import StarSystemService from '../services/StarSystemService';
import { Position } from '../models/CelestialBody';

const AlertPanel: React.FC = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newAlert, setNewAlert] = useState<Partial<Alert>>({
    title: '',
    description: '',
    nearestBodyName: '',
    position: { x: 0, y: 0, z: 0 },
    type: 'info' as AlertType,
    isPublic: true
  });
  
  useEffect(() => {
    loadAlerts();
  }, [user]);
  
  const loadAlerts = async () => {
    try {
      if (user) {
        const userAlerts = await AlertService.getUserAlerts(user.uid);
        const publicAlerts = await AlertService.getPublicAlerts();
        
        // Combine and de-duplicate alerts
        const combinedAlerts = [...userAlerts];
        publicAlerts.forEach(alert => {
          if (!combinedAlerts.some(a => a.id === alert.id)) {
            combinedAlerts.push(alert);
          }
        });
        
        setAlerts(combinedAlerts);
      } else {
        const publicAlerts = await AlertService.getPublicAlerts();
        setAlerts(publicAlerts);
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  };
  
  const handleCreateAlert = async () => {
    if (!user) {
      alert('You must be logged in to create alerts');
      return;
    }
    
    try {
      const alertData: Omit<Alert, 'id'> = {
        ...newAlert as Omit<Alert, 'id'>,
        userId: user.uid,
        createdAt: Date.now(),
      };
      
      await AlertService.createAlert(alertData);
      setIsCreating(false);
      setNewAlert({
        title: '',
        description: '',
        nearestBodyName: '',
        position: { x: 0, y: 0, z: 0 },
        type: 'info' as AlertType,
        isPublic: true
      });
      
      // Reload alerts
      loadAlerts();
    } catch (error) {
      console.error('Error creating alert:', error);
    }
  };
  
  const handleDeleteAlert = async (alertId: string) => {
    try {
      await AlertService.deleteAlert(alertId);
      setAlerts(alerts.filter(alert => alert.id !== alertId));
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };
  
  const handleBodySelect = (bodyName: string) => {
    const body = StarSystemService.getBodyByName(bodyName);
    if (body) {
      setNewAlert({
        ...newAlert,
        nearestBodyName: bodyName,
        position: body.position
      });
    }
  };
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };
  
  const getAlertTypeColor = (type: AlertType) => {
    switch (type) {
      case 'danger':
        return 'bg-red-800';
      case 'warning':
        return 'bg-yellow-700';
      case 'info':
        return 'bg-blue-700';
      case 'opportunity':
        return 'bg-green-700';
      default:
        return 'bg-blue-700';
    }
  };
  
  return (
    <div className="h-full w-64 bg-gray-900 bg-opacity-80 p-4 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Alerts</h2>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm"
        >
          {isCreating ? 'Cancel' : 'Create Alert'}
        </button>
      </div>
      
      {isCreating && (
        <div className="mb-4 p-2 border border-gray-700 rounded">
          <h3 className="font-bold mb-2">New Alert</h3>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Title"
              value={newAlert.title}
              onChange={e => setNewAlert({...newAlert, title: e.target.value})}
              className="w-full px-2 py-1 bg-gray-800 text-white rounded"
            />
            <textarea
              placeholder="Description"
              value={newAlert.description}
              onChange={e => setNewAlert({...newAlert, description: e.target.value})}
              className="w-full px-2 py-1 bg-gray-800 text-white rounded"
              rows={3}
            />
            <select
              value={newAlert.nearestBodyName}
              onChange={e => handleBodySelect(e.target.value)}
              className="w-full px-2 py-1 bg-gray-800 text-white rounded"
            >
              <option value="">Select Nearest Body</option>
              {StarSystemService.getAllBodies().map(body => (
                <option key={body.name} value={body.name}>
                  {body.label}
                </option>
              ))}
            </select>
            <select
              value={newAlert.type}
              onChange={e => setNewAlert({...newAlert, type: e.target.value as AlertType})}
              className="w-full px-2 py-1 bg-gray-800 text-white rounded"
            >
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="danger">Danger</option>
              <option value="opportunity">Opportunity</option>
            </select>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPublic"
                checked={newAlert.isPublic}
                onChange={e => setNewAlert({...newAlert, isPublic: e.target.checked})}
                className="mr-2"
              />
              <label htmlFor="isPublic">Public Alert</label>
            </div>
            <button
              onClick={handleCreateAlert}
              className="w-full px-2 py-1 rounded bg-green-600 hover:bg-green-700 text-white font-medium"
            >
              Create Alert
            </button>
          </div>
        </div>
      )}
      
      {alerts.length === 0 ? (
        <p className="text-gray-400">No alerts available</p>
      ) : (
        <div className="space-y-2">
          {alerts.map(alert => (
            <div 
              key={alert.id} 
              className={`p-2 rounded ${getAlertTypeColor(alert.type)} relative`}
            >
              <div className="flex justify-between">
                <h3 className="font-bold">{alert.title}</h3>
                {user && alert.userId === user.uid && (
                  <button
                    onClick={() => handleDeleteAlert(alert.id)}
                    className="text-xs text-red-300 hover:text-red-100"
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className="text-sm">{alert.description}</p>
              <div className="text-xs text-gray-300 mt-1">
                <div>Near: {alert.nearestBodyName}</div>
                <div>{formatDate(alert.createdAt)}</div>
                <div>{alert.isPublic ? 'Public' : 'Private'}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlertPanel; 