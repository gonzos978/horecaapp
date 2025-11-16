import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../fb/firebase";
import { useNavigate, Link } from "react-router-dom";
import "../styles/AdminLogin.css";

export default function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
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

            await setDoc(doc(db, "users", user.uid), {
                email,
                isAdmin: true,
                createdAt: new Date(),
            });

            navigate("/admin"); // redirect on success
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
                    <input
                        type="email"
                        placeholder="Email"
                        className="input"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        disabled={loading}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        className="input"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        disabled={loading}
                    />
                    {errorMsg && <p className="errorMsg">{errorMsg}</p>}
                    <button type="submit" className="button" disabled={loading}>
                        {loading ? "Registering..." : "Register"}
                    </button>
                </form>
                <div style={{ marginTop: 12, textAlign: "center" }}>
                    <Link to="/admin/login">← Back to Login</Link>
                </div>
            </div>
        </div>
    );
}
