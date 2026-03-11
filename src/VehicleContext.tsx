import React, { createContext, useContext, useState, useEffect } from 'react';
import { Vehicle } from './types';
import { db } from './firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { useAuth } from './AuthProvider';

interface VehicleContextType {
  vehicles: Vehicle[];
  setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>;
  saveVehiclesToFirebase: (newVehicles: Vehicle[]) => Promise<void>;
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

    const unsubscribe = onSnapshot(collection(db, 'vehicles'), (snapshot) => {
      const loadedVehicles = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Vehicle[];
      setVehicles(loadedVehicles);
    }, (error) => {
      console.error("Error fetching vehicles:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const saveVehiclesToFirebase = async (newVehicles: Vehicle[]) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      
      // We could clear existing vehicles or just overwrite/add. 
      // For simplicity, let's just add/overwrite based on ID.
      newVehicles.forEach(vehicle => {
        const docRef = doc(db, 'vehicles', vehicle.id);
        batch.set(docRef, vehicle);
      });

      await batch.commit();
    } catch (error) {
      console.error("Error saving vehicles to Firebase:", error);
      throw error;
    }
  };

  return (
    <VehicleContext.Provider value={{ vehicles, setVehicles, saveVehiclesToFirebase }}>
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
