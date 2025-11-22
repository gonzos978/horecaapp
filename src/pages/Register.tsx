import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { auth, db } from "../fb/firebase";
import { useNavigate, Link } from "react-router-dom";
import "../styles/AdminLogin.css";

export default function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState(""); // Restaurant/Café name
    const [errorMsg, setErrorMsg] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");
        setLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Create Firestore profile
            await setDoc(doc(db, "users", user.uid), {
                email,
                name,
                role: "Restaurant", // default type
                isAdmin: false,     // new users are not admins
                createdAt: new Date(),
            });

            navigate("/admin/login"); // redirect to login
        } catch (error: any) {
            setErrorMsg(error.message || "Registration failed");
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <div className="card">
                <h2 className="title">Register New User</h2>
                <form onSubmit={handleRegister}>
                    <input type="text" placeholder="Restaurant/Café Name" className="input" value={name} onChange={e => setName(e.target.value)} required disabled={loading} />
                    <input type="email" placeholder="Email" className="input" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} />
                    <input type="password" placeholder="Password" className="input" value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} />
                    {errorMsg && <p className="errorMsg">{errorMsg}</p>}
                    <button type="submit" className="button" disabled={loading}>{loading ? "Registering..." : "Register"}</button>
                </form>
                <div style={{ marginTop: 12, textAlign: "center" }}>
                    <Link to="/admin/login">← Back to Login</Link>
                </div>
            </div>
        </div>
    );
}
