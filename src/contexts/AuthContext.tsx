import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { query, collection, getDocs, where } from "firebase/firestore";
import { auth, db } from "../fb/firebase";
import { TTaskType } from "../models/tasks";

export interface FirestoreUser {
  readonly email: string;
  readonly role: string;
  readonly customerId?: string;
  readonly customerName?: string;
  readonly name?: string;
  readonly phone?: string;
  readonly address?: string;
  readonly createdAt?: any;
  readonly isAdmin?: boolean;
  readonly type: TTaskType;
}

interface AuthContextType {
  readonly user: any; // Firebase Auth user
  readonly currentUser: FirestoreUser | null; // Firestore document
  readonly loading: boolean;
  readonly isAdmin: boolean;
  readonly isSuperAdmin: boolean;
  readonly logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  currentUser: null,
  loading: true,
  isAdmin: false,
  isSuperAdmin: false,
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null); // Firebase Auth
  const [currentUser, setCurrentUser] = useState<FirestoreUser | null>(null); // Firestore document
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setCurrentUser(null);
      setIsAdmin(false);
      setIsSuperAdmin(false);
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);

        try {
          // Query po emailu
          const q = query(
            collection(db, "users"),
            where("email", "==", firebaseUser.email)
          );
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            // Uzmi prvi dokument koji odgovara emailu
            const docSnap = querySnapshot.docs[0];
            const data = docSnap.data() as FirestoreUser;
            setCurrentUser(data);
            setIsAdmin(data.role === "admin");

            const SUPER_ADMIN_UID = "qwfKx9DlZYSkIGGBJBIqTmOQPY02";
            setIsSuperAdmin(firebaseUser.uid === SUPER_ADMIN_UID);
          } else {
            // Ako nema dokumenta s tim emailom
            setCurrentUser(null);
            setIsAdmin(false);
            setIsSuperAdmin(false);
          }
        } catch (err) {
          console.error("Failed to fetch Firestore user", err);
          setCurrentUser(null);
          setIsAdmin(false);
          setIsSuperAdmin(false);
        }
      } else {
        setUser(null);
        setCurrentUser(null);
        setIsAdmin(false);
        setIsSuperAdmin(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, currentUser, loading, isAdmin, isSuperAdmin, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
