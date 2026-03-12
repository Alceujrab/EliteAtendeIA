import React, { createContext, useContext, useState, useEffect } from 'react';
import { Vehicle } from './types';
import axios from 'axios';
import { useAuth } from './AuthProvider';

interface VehicleContextType {
  vehicles: Vehicle[];
  setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>;
  saveVehicles: (newVehicles: Vehicle[]) => Promise<void>;
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

export function VehicleProvider({ children }: { children: React.ReactNode }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setVehicles([]);
      return;
    }

    const fetchVehicles = async () => {
      try {
        const res = await axios.get('/api/vehicles');
        setVehicles(res.data);
      } catch (error) {
        console.error("Error fetching vehicles:", error);
      }
    };

    fetchVehicles();
    const interval = setInterval(fetchVehicles, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const saveVehicles = async (newVehicles: Vehicle[]) => {
    if (!user) return;
    try {
      // Send all vehicles to the API for batch save
      await axios.post('/api/vehicles/batch', { vehicles: newVehicles });
    } catch (error) {
      console.error("Error saving vehicles:", error);
      throw error;
    }
  };

  return (
    <VehicleContext.Provider value={{ vehicles, setVehicles, saveVehicles }}>
      {children}
    </VehicleContext.Provider>
  );
}

export function useVehicles() {
  const context = useContext(VehicleContext);
  if (context === undefined) {
    throw new Error('useVehicles must be used within a VehicleProvider');
  }
  return context;
}
