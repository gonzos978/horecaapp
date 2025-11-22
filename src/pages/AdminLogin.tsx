import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmailAndPassword, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import {auth, db} from "../fb/firebase";
import "../styles/AdminLogin.css";
import {doc, getDoc} from "firebase/firestore";

export default function AdminLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [resetMsg, setResetMsg] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(""); setLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const docSnap = await getDoc(doc(db, "users", user.uid));
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.isAdmin) navigate("/admin/dashboard");
                else navigate("/app/home");
            } else {
                setErrorMsg("User profile not found.");
            }
        } catch (error: any) {
            setErrorMsg(error.message || "Login failed");
            setLoading(false);
        }
    };


    const handleForgotPassword = async () => {
        setResetMsg(""); setErrorMsg("");
        if (!email) { setResetMsg("Please enter your email first."); return; }
        try { await sendPasswordResetEmail(auth, email); setResetMsg("Password reset email sent!"); }
        catch (error: any) { setResetMsg(error.message || "Failed to send reset email."); }
    };

    const handleGoogleLogin = async () => {
        setErrorMsg(""); setResetMsg(""); setLoading(true);
        const provider = new GoogleAuthProvider();
        try { await signInWithPopup(auth, provider); navigate("/admin"); }
        catch (error: any) { setErrorMsg(error.message || "Google login failed"); setLoading(false); }
    };

    return (
        <div className="container">
            {/* LEFT: Login Form */}
            <div className="left-side">
                <div className="card">
                    <h2 className="title">Admin Login</h2>
                    <form onSubmit={handleLogin}>
                        <input type="email" placeholder="Email" className="input" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} />
                        <input type="password" placeholder="Password" className="input" value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} />
                        {errorMsg && <p className="errorMsg">{errorMsg}</p>}
                        <button type="submit" className="button" disabled={loading}>{loading ? "Logging in..." : "Login"}</button>
                    </form>

                    <button type="button" className="button google-login" onClick={handleGoogleLogin} disabled={loading} style={{ backgroundColor: "#db4437", marginTop: "10px" }}>
                        {loading ? "Logging in..." : "Login with Google"}
                    </button>

                    <p style={{ marginTop: 8, cursor: "pointer", color: "#2196f3" }} onClick={handleForgotPassword}>Forgot Password?</p>
                    {resetMsg && <p style={{ color: "green", marginTop: 4 }}>{resetMsg}</p>}
                    <p style={{ marginTop: 12 }}>Don't have an account? <Link to="/admin/register">Register here</Link></p>
                </div>
            </div>

            {/* RIGHT: Centered Logo & Software Name */}
            {/* Right Content */}
            <div className="right-content">

                <h1 className="app-name">Horeca App</h1>
                <p className="slogan">

                </p>
                <p className="extra-text">

                </p>
            </div>

        </div>
    );
}
