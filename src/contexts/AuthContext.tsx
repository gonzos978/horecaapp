import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import type { User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../fb/firebase";

type AuthContextType = {
    user: User | null;
    loading: boolean;
    isAdmin: boolean;
    logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    isAdmin: false,
    logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            setUser(u);

            if (u) {
                const userDoc = await getDoc(doc(db, "users", u.uid));
                setIsAdmin(userDoc.exists() && (userDoc.data() as any).isAdmin === true);
            } else {
                setIsAdmin(false);
            }

            setLoading(false);
        });

        return () => unsub();
    }, []);

    const logout = () => {
        signOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, loading, isAdmin, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
