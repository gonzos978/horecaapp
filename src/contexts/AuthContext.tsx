import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../fb/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

interface AuthContextType {
    user: any;
    loading: boolean;
    isAdmin: boolean;
    isSuperAdmin: boolean;
    userData: any;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    isAdmin: false,
    isSuperAdmin: false,
    userData: null,
    logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [userData, setUserData] = useState<any>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setLoading(true);
            if (currentUser) {
                setUser(currentUser);

                try {
                    const docRef = doc(db, "users", currentUser.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setUserData(data);
                        setIsAdmin(!!data?.role && data.role === "admin");

                        // Super-admin UID
                        const SUPER_ADMIN_UID = "goq3MIVP0IaPZ7VCRZjDF9MxgsN2";
                        setIsSuperAdmin(currentUser.uid === SUPER_ADMIN_UID);

                    } else {
                        setUserData(null);
                        setIsAdmin(false);
                        setIsSuperAdmin(false);
                    }
                } catch (err) {
                    console.error("Failed to fetch user data", err);
                    setUserData(null);
                    setIsAdmin(false);
                    setIsSuperAdmin(false);
                }
            } else {
                setUser(null);
                setUserData(null);
                setIsAdmin(false);
                setIsSuperAdmin(false);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            setUserData(null);
            setIsAdmin(false);
            setIsSuperAdmin(false);
        } catch (err) {
            console.error("Logout failed", err);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, isAdmin, isSuperAdmin, userData, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
