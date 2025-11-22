import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

import AdminLogin from "./pages/AdminLogin";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Users from "./pages/admin/Users";
import Settings from "./pages/admin/Settings";
import AddUser from "./pages/AddUsers";
import Register from "./pages/Register";
import UserRoute from "./routes/UserRoute";
import UserLayout from "./layouts/UserLayout";
import BusinessHome from "./placeholders/BusinessHome";
import Workers from "./placeholders/Workers";

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
                    {/* Public */}
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin/register" element={<Register />} />

                    {/* Admin area */}
                    <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="users" element={<Users />} />
                        <Route path="users/add" element={<AddUser />} />
                        <Route path="settings" element={<Settings />} />
                        <Route index element={<Navigate to="dashboard" replace />} />
                    </Route>

                    {/* Business user area */}
                    <Route path="/app" element={<UserRoute><UserLayout /></UserRoute>}>
                        <Route path="home" element={<BusinessHome />} />
                        <Route path="workers" element={<Workers />} />
                        <Route index element={<Navigate to="home" replace />} />
                    </Route>

                    {/* Default redirect */}
                    <Route path="/" element={<Navigate to="/admin/login" replace />} />
                </Routes>

            </BrowserRouter>
        </AuthProvider>
    );
}
