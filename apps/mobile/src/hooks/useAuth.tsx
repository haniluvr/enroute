import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth'; // Will be real later
import { auth } from '../config/firebase';

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
        // Placeholder for actual firebase auth listener
        // This allows us to work on the UI without a live project yet.
        const mockAuthWait = setTimeout(() => {
            setUser(null); // Set to true to test logged in state
            setIsLoading(false);
        }, 1000);

        return () => clearTimeout(mockAuthWait);
    }, []);

    return (
        <AuthContext.Provider value={{ user, isLoading, isCounselor }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
