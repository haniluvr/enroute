import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isCounselor: boolean;
    signIn: (email: string) => Promise<void>; // This is now a redirect or legacy wrapper
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    isCounselor: false,
    signIn: async () => { },
    signOut: async () => { },
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
            // In a real app, you would check the user's role here
            setIsCounselor(session?.user?.user_metadata?.role === 'counselor');
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setIsLoading(false);
            setIsCounselor(session?.user?.user_metadata?.role === 'counselor');
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const signIn = async (email: string) => {
        // This is kept for compatibility with existing code that calls it after login success
        // or for manual state overrides if needed, though session listener is preferred.
    };

    const signOut = async () => {
        setIsLoading(true);
        await supabase.auth.signOut();
        setUser(null);
        setIsLoading(false);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, isCounselor, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
