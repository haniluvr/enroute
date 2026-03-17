import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { AppState, AppStateStatus } from 'react-native';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isCounselor: boolean;
    signIn: (emailOrUser: string | User, metadata?: any) => Promise<void>;
    signOut: () => Promise<void>;
    refreshUser: () => Promise<void>;
    syncProfile: (details: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    isCounselor: false,
    signIn: async () => { },
    signOut: async () => { },
    refreshUser: async () => { },
    syncProfile: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCounselor, setIsCounselor] = useState(false);

    const refreshUser = async () => {
        try {
            const { data: { user: updatedUser }, error } = await supabase.auth.getUser();
            if (error) {
                if (!error.message.includes('Auth session missing')) {
                    console.error('Refresh User Error:', error.message);
                }
                return;
            }
            if (updatedUser) {
                setUser(updatedUser);
                setIsCounselor(updatedUser.user_metadata?.role === 'counselor');
            }
        } catch (err) {
            console.error('Refresh User Exception:', err);
        }
    };

    useEffect(() => {
        // Fetch initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setIsLoading(false);
            setIsCounselor(session?.user?.user_metadata?.role === 'counselor');
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            console.log(`[useAuth] Auth Event: ${_event}`, {
                sessionId: session?.user?.id,
                event: _event,
                hasUser: !!session?.user
            });
            
            if (session?.user) {
                console.log(`[useAuth] Setting user to ${session.user.id}`);
                setUser(session.user);
                setIsCounselor(session.user.user_metadata?.role === 'counselor');
                setIsLoading(false);
            } else if (_event === 'SIGNED_OUT') {
                console.log('[useAuth] User signed out');
                setUser(null);
                setIsCounselor(false);
                setIsLoading(false);
            } else if (_event === 'INITIAL_SESSION') {
                console.log('[useAuth] Initial session check complete.');
                if (session?.user) {
                    setUser(session.user);
                    setIsLoading(false);
                } else {
                    // Only clear if we aren't already in a pending state
                    setUser(prev => {
                        if (prev && prev.id === 'pending') return prev;
                        return null;
                    });
                    setIsLoading(false);
                }
            } else {
                console.log(`[useAuth] Session is null for event ${_event}.`);
                // For other events where session is null, only clear if we aren't in 'pending' state
                setUser(prev => {
                    if (prev && prev.id === 'pending') {
                        console.log('[useAuth] Retaining pending user state');
                        return prev;
                    }
                    console.log('[useAuth] Clearing user state');
                    return null;
                });
                setIsLoading(false);
            }
        });

        // Refresh user when app comes to foreground (for email verification)
        const subscriptionAppState = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') {
                refreshUser();
            }
        });

        return () => {
            subscription.unsubscribe();
            subscriptionAppState.remove();
        };
    }, []);

    const syncProfile = async (details: any) => {
        const email = user?.email || details.email;
        if (!email) return;

        try {
            // Update auth metadata. The Supabase Database Trigger will automatically 
            // sync this into the public.profiles table!
            await supabase.auth.updateUser({ data: details });

            // Update local state immediately
            setUser(prev => ({
                ...((prev || { email, id: 'pending' }) as User),
                user_metadata: { ...(prev?.user_metadata || {}), ...details }
            } as User));
        } catch (err) {
            console.error('Profile sync error:', err);
        }
    };

    const signIn = async (emailOrUser: string | User, metadata?: any) => {
        if (typeof emailOrUser !== 'string') {
            console.log('SignIn called with User object:', emailOrUser.id);
            setUser(emailOrUser);
            setIsLoading(false);
            if (emailOrUser.user_metadata?.role === 'counselor' || metadata?.role === 'counselor') {
                setIsCounselor(true);
            }
            return;
        }

        const email = emailOrUser;
        // Check if we already have a real session from Supabase
        const { data: { session } } = await supabase.auth.getSession();
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();
        
        const realUser = session?.user || supabaseUser;

        if (realUser) {
            setUser(realUser);
            setIsLoading(false);
            if (realUser.user_metadata?.role === 'counselor' || metadata?.role === 'counselor') {
                setIsCounselor(true);
            }
            return;
        }

        // Strong manual update for initial landing (e.g. before email verify)
        // Try to keep the email as part of the identification
        setUser({
            id: 'pending',
            email,
            user_metadata: metadata || {}
        } as User);
        setIsLoading(false);
        if (metadata?.role === 'counselor') {
            setIsCounselor(true);
        }
    };

    const signOut = async () => {
        setIsLoading(true);
        await supabase.auth.signOut();
        setUser(null);
        setIsCounselor(false);
        setIsLoading(false);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, isCounselor, signIn, signOut, refreshUser, syncProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
