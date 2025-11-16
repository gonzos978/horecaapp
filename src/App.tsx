import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

import AdminLogin from "./pages/AdminLogin";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Users from "./pages/admin/Users";
import Settings from "./pages/admin/Settings";

// @ts-ignore
function AdminRoute({ children }: { children: JSX.Element }) {
    const { user, loading, isAdmin } = useAuth();

    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/admin/login" replace />;
    if (!isAdmin) return <div>Access denied</div>;

    return children;
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>

                    {/* Default redirect */}
                    <Route path="/" element={<Navigate to="/admin/login" replace />} />

                    {/* Public login page */}
                    <Route path="/admin/login" element={<AdminLogin />} />

                    {/* Protected admin area */}
                    <Route
                        path="/admin"
                        element={
                            <AdminRoute>
                                <AdminLayout />
                            </AdminRoute>
                        }
                    >
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="users" element={<Users />} />
                        <Route path="settings" element={<Settings />} />

                        {/* Default admin page */}
                        <Route index element={<Navigate to="dashboard" replace />} />
                    </Route>

                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
