// src/pages/app/BusinessHome.tsx
import { useNavigate } from "react-router-dom";

import { signOut } from "firebase/auth";
import {useAuth} from "../contexts/AuthContext";
import {auth} from "../fb/firebase";


export default function BusinessHome() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate("/admin/login"); // redirect to login page
        } catch (err) {
            console.error("Logout failed:", err);
        }
    };

    return (
        <div style={{ padding: 20 }}>
            <h1>Welcome, {user?.email}</h1>
            <button
                onClick={handleLogout}
                style={{
                    padding: "10px 20px",
                    backgroundColor: "#e53935",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    marginTop: 20,
                }}
            >
                Logout
            </button>
        </div>
    );
}
