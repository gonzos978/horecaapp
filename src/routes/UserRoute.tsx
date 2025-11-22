import { Navigate } from "react-router-dom";
import {useAuth} from "../contexts/AuthContext";
import {JSX} from "react";


// Protect routes for regular business users
export default function UserRoute({ children }: { children: JSX.Element }) {
    const { user, loading, isAdmin } = useAuth();

    if (loading) return <div>Loading...</div>;

    // Not logged in → redirect to login
    if (!user) return <Navigate to="/admin/login" replace />;

    // Admins should not access business area
    if (isAdmin) return <Navigate to="/admin/dashboard" replace />;

    return children;
}
