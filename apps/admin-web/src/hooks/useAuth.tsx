import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isCounselor: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    isCounselor: false
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCounselor, setIsCounselor] = useState(false);

    useEffect(() => {
        // Fetch initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setIsLoading(false);
            const role = session?.user?.user_metadata?.role;
            setIsCounselor(role === 'counselor' || role === 'admin');
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setIsLoading(false);
            const role = session?.user?.user_metadata?.role;
            setIsCounselor(role === 'counselor' || role === 'admin');
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, isLoading, isCounselor }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
