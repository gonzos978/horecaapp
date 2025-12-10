// CustomerRoute.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {JSX} from "react";

interface CustomerRouteProps {
    children: JSX.Element;
}

export default function CustomerRoute({ children }: CustomerRouteProps) {
    const { user, loading, userData } = useAuth();

    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/admin/login" replace />;
    if (userData?.role !== "customer") return <Navigate to="/admin/dashboard" replace />;

    return children;
}
