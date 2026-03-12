import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { AppUser } from './types';

interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  appUser: AppUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, appUser: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Try to get the authenticated user from Laravel
        const res = await axios.get('/api/user', { 
          headers: { 'Accept': 'application/json' }
        });
        
        if (res.data && res.data.id) {
          const userData = res.data;
          const authUser: AuthUser = {
            uid: String(userData.id),
            email: userData.email,
            displayName: userData.name,
            photoURL: userData.avatar || null
          };
          setUser(authUser);

          // Fetch app user profile
          try {
            const appUserRes = await axios.get(`/api/users/${userData.id}`);
            setAppUser(appUserRes.data);
          } catch {
            // If no app user profile, create a basic one
            setAppUser({
              id: String(userData.id),
              name: userData.name || 'Novo Usuário',
              email: userData.email || '',
              role: 'agent',
              avatar: userData.avatar || '',
              inboxes: []
            } as AppUser);
          }
        }
      } catch {
        // Not authenticated, set a default demo user for development
        const demoUser: AuthUser = {
          uid: '1',
          email: 'admin@elitecrm.com',
          displayName: 'Admin',
          photoURL: null
        };
        setUser(demoUser);
        setAppUser({
          id: '1',
          name: 'Admin',
          email: 'admin@elitecrm.com',
          role: 'admin',
          avatar: '',
          inboxes: []
        } as AppUser);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, appUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
