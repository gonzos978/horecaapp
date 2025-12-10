// AdminRoute.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {JSX} from "react";

interface AdminRouteProps {
    children: JSX.Element;
}

export default function AdminRoute({ children }: AdminRouteProps) {
    const { user, loading, isAdmin } = useAuth();

    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/admin/login" replace />;
    if (!isAdmin) return <Navigate to="/app/home" replace />; // redirect non-admins

    return children;
}
