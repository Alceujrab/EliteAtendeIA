import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { AppUser } from './types';

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, appUser: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Fetch or create user profile in Firestore
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            setAppUser({ id: userDoc.id, ...userDoc.data() } as AppUser);
          } else {
            // Create a new default agent profile
            const role = firebaseUser.email === 'alceujr.ab@gmail.com' ? 'admin' : 'agent';
            const newAppUser: Omit<AppUser, 'id'> = {
              name: firebaseUser.displayName || 'Novo Usuário',
              email: firebaseUser.email || '',
              role: role,
              avatar: firebaseUser.photoURL || '',
              inboxes: []
            };
            await setDoc(userDocRef, newAppUser);
            setAppUser({ id: firebaseUser.uid, ...newAppUser } as AppUser);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setAppUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, appUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
