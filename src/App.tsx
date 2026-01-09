import {BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate, useLocation} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// -------------------- LOGIN --------------------
import AdminLogin from "./pages/AdminLogin";
import Register from "./pages/Register";

// -------------------- ADMIN --------------------
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AddCustomer from "./pages/admin/AddCustomer";
import CustomersList from "./pages/admin/CustomersList";
import AdminSettings from "./pages/admin/Settings";
import UploadDocuments from "./pages/admin/UploadDocuments";

// -------------------- CUSTOMER APP --------------------
import { LanguageProvider } from "./contexts/LanguageContext";
import Navigation from "./components/Navigation";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Workers from "./pages/Workers";
import Worker from "./pages/workers/Worker";
import Inventory from "./pages/Inventory";
import Menu from "./pages/Menu";
import Alerts from "./pages/Alerts";
import VoiceOrders from "./pages/VoiceOrders";
import Checklists from "./pages/Checklists";
import Training from "./pages/Training";
import Settings from "./pages/Settings";
import AnonymousReports from "./pages/AnonymousReports";
import WaiterApp from "./pages/pwa/WaiterApp";
import CookApp from "./pages/pwa/CookApp";
import HousekeeperApp from "./pages/pwa/HousekeeperApp";
import ManagerApp from "./pages/pwa/ManagerApp";
import EditWorker from "./pages/workers/EditWorker.tsx";
import {useEffect, useState} from "react";
import { Menu as MenuIcon } from "lucide-react";


// -------------------- ROUTE GUARDS --------------------
function AdminRoute({ children }: { children: JSX.Element }) {
    const { user, loading, isAdmin } = useAuth();
    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/admin/login" replace />;
    if (!isAdmin) return <Navigate to="/app/home" replace />;
    return children;
}

function UserRoute({ children }: { children: JSX.Element }) {
    const { user, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/admin/login" replace />;
    return children;
}

// -------------------- CUSTOMER MAIN APP LAYOUT --------------------
function CustomerMainApp() {
    const navigate = useNavigate();
    const location = useLocation();

    const [sidebarOpen, setSidebarOpen] = useState(false);

    const currentPage = location.pathname.split("/")[2] || "home";

    // Auto-close sidebar when switching to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setSidebarOpen(false);
            }
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <LanguageProvider>
            <div className="min-h-screen bg-slate-50">
                {/* Mobile header */}
                <header className="md:hidden flex items-center gap-3 p-4 bg-white border-b">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-lg hover:bg-slate-100"
                    >
                        <MenuIcon className="w-6 h-6" />
                    </button>
                    <span className="font-semibold">App</span>
                </header>

                <Navigation
                    currentPage={currentPage}
                    onNavigate={(page) => navigate(`/app/${page}`)}
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                />

                {/* Overlay */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/30 z-30 md:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                <main className="md:ml-64 p-6">
                    <Outlet />
                </main>
            </div>
        </LanguageProvider>
    );
}

// -------------------- APP ROOT --------------------
export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* PUBLIC LOGIN */}
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin/register" element={<Register />} />

                    {/* ADMIN AREA */}
                    <Route
                        path="/admin"
                        element={
                            <AdminRoute>
                                <AdminLayout />
                            </AdminRoute>
                        }
                    >
                        <Route index element={<Navigate to="dashboard" replace />} />
                        <Route path="dashboard" element={<AdminDashboard />} />
                        <Route path="customers/add" element={<AddCustomer />} />
                        <Route path="users" element={<CustomersList />} />
                        <Route path="settings" element={<AdminSettings />} />
                        <Route path="documents" element={<UploadDocuments />} />

                    </Route>

                    {/* CUSTOMER APP AREA */}
                    <Route
                        path="/app"
                        element={
                            <UserRoute>
                                <CustomerMainApp />
                            </UserRoute>
                        }
                    >
                        <Route index element={<Navigate to="home" replace />} />
                        <Route path="home" element={<Dashboard />} />
                        <Route path="tasks" element={<Tasks />} />
                        <Route path="workers" element={<Workers />} />
                        <Route path="workers/:id" element={<Worker />} />
                        <Route path="workers/edit/:id" element={<EditWorker />} />
                        <Route path="artikli" element={<Inventory />} />
                        <Route path="menu" element={<Menu />} />
                        <Route path="alerts" element={<Alerts />} />
                        <Route path="voice" element={<VoiceOrders />} />
                        <Route path="checklists" element={<Checklists />} />
                        <Route path="training" element={<Training />} />
                        <Route path="settings" element={<Settings />} />
                        <Route path="anonymousReports" element={<AnonymousReports />} />
                        <Route path="waiter" element={<WaiterApp />} />
                        <Route path="cook" element={<CookApp />} />
                        <Route path="housekeeper" element={<HousekeeperApp />} />
                        <Route path="manager" element={<ManagerApp />} />
                    </Route>

                    {/* DEFAULT */}
                    <Route path="/" element={<Navigate to="/admin/login" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
