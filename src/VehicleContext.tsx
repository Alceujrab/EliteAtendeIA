import React, { createContext, useContext, useState, useEffect } from 'react';
import { Vehicle } from './types';
import { mockVehicles } from './data';

interface VehicleContextType {
  vehicles: Vehicle[];
  setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>;
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

export function VehicleProvider({ children }: { children: React.ReactNode }) {
  // Try to load from localStorage first, otherwise use mockVehicles
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem('catalog_vehicles');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return mockVehicles;
      }
    }
    return mockVehicles;
  });

  // Save to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('catalog_vehicles', JSON.stringify(vehicles));
  }, [vehicles]);

  return (
    <VehicleContext.Provider value={{ vehicles, setVehicles }}>
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
