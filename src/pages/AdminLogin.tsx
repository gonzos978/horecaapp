import React, { useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth, db } from "../fb/firebase";
import { doc, getDoc } from "firebase/firestore";
import "../styles/AdminLogin.css";
import { ROLE } from "../models/role";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      // 1. Login putem Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      // 2. Dohvati Firestore user dokument po emailu
      const q = query(
        collection(db, "users"),
        where("email", "==", user.email)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setErrorMsg("User profile not found.");
        return;
      }

      // 3. Uzimamo prvi dokument koji matcha
      const docSnap = querySnapshot.docs[0];
      const data = docSnap.data();

      // 4. Navigacija na osnovu role
      if (data.role === ROLE.ADMIN) {
        navigate("/admin/dashboard", { replace: true });
      } else if ((Object.values(ROLE) as string[]).includes(data.role)) {
        navigate("/app/home", { replace: true });
      } else {
        setErrorMsg("User role is not recognized.");
      }
    } catch (error: any) {
      console.error(error);
      if (error.code === "auth/user-not-found") setErrorMsg("User not found.");
      else if (error.code === "auth/wrong-password")
        setErrorMsg("Incorrect password.");
      else setErrorMsg(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setResetMsg("");
    setErrorMsg("");
    if (!email) {
      setResetMsg("Please enter your email first.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setResetMsg("Password reset email sent!");
    } catch (error: any) {
      setResetMsg(error.message || "Failed to send reset email.");
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg("");
    setResetMsg("");
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const docSnap = await getDoc(doc(db, "users", user.uid));
      if (!docSnap.exists()) {
        setErrorMsg("User profile not found.");
        return;
      }

      const data = docSnap.data();
      if (data.role === ROLE.ADMIN) {
        navigate("/admin/dashboard", { replace: true });
      } else if ((Object.values(ROLE) as string[]).includes(data.role)) {
        navigate("/app/home", { replace: true });
      } else {
        setErrorMsg("User role is not recognized.");
      }
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || "Google login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="left-side">
        <div className="card">
          <h2 className="title">Login</h2>
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
            <input
              type="password"
              placeholder="Password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
            {errorMsg && <p className="errorMsg">{errorMsg}</p>}
            <button type="submit" className="button" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <button
            type="button"
            className="button google-login"
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{ backgroundColor: "#db4437", marginTop: "10px" }}
          >
            {loading ? "Logging in..." : "Login with Google"}
          </button>

          <p
            style={{ marginTop: 8, cursor: "pointer", color: "#2196f3" }}
            onClick={handleForgotPassword}
          >
            Forgot Password?
          </p>
          {resetMsg && (
            <p style={{ color: "green", marginTop: 4 }}>{resetMsg}</p>
          )}
          <p style={{ marginTop: 12 }}>
            Don't have an account?{" "}
            <Link to="/admin/register">Register here</Link>
          </p>
        </div>
      </div>

      <div className="right-content">
        <h1 className="app-name">Horeca App</h1>
        <p className="slogan"></p>
        <p className="extra-text"></p>
      </div>
    </div>
  );
}
