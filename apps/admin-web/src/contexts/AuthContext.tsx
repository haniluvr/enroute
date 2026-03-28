import React, { createContext, useContext, useEffect, useState } from 'react';
import { type Session, type User } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  mockAdminLogin: () => void;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  role: null,
  loading: true,
  signOut: async () => { },
  mockAdminLogin: () => { },
});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const mockAdminLogin = () => {
    setUser({ id: 'mock-admin-id', email: 'admin@gmail.com', role: 'authenticated' } as User);
    setRole('admin');
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id, session.user);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id, session.user);
      } else {
        setRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string, currentUser: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) {
        // Fallback for hardcoded admin account
        if (currentUser.email === 'admin@gmail.com') {
          setRole('admin');
        } else {
          setRole(null);
        }
      } else if (data) {
        setRole(data.role);
      }
    } catch (err) {
      console.error('Unexpected error fetching role', err);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    // Check if it's the mock user
    if (user?.id === 'mock-admin-id') {
      setUser(null);
      setRole(null);
      return;
    }
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, role, loading, signOut, mockAdminLogin }}>
      {children}
    </AuthContext.Provider>
  );
};
