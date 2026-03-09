import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth'; // Will be real later
import { auth } from '../config/firebase';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isCounselor: boolean;
    signIn: (email: string) => Promise<void>;
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
        // Placeholder for actual firebase auth listener
        // Let's start as null (logged out) to show the intro flow correctly
        setUser(null);
        setIsLoading(false);
    }, []);

    const signIn = async (email: string) => {
        setIsLoading(true);
        setUser({ email } as User);
        setIsLoading(false);
    };

    const signOut = async () => {
        setIsLoading(true);
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
