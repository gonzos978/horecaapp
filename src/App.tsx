import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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

// -------------------- CUSTOMER APP --------------------
import { LanguageProvider } from "./contexts/LanguageContext";
import Navigation from "./components/Navigation";
import Dashboard from "./pages/Dashboard";
import Workers from "./pages/Workers";
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

// -------------------- PAGE TYPE --------------------
type Page =
  | "dashboard"
  | "workers"
  | "artikli"
  | "menu"
  | "alerts"
  | "voice"
  | "checklists"
  | "training"
  | "settings"
  | "anonymousReports"
  | "waiter"
  | "cook"
  | "housekeeper"
  | "manager";

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

// -------------------- CUSTOMER MAIN APP --------------------
function CustomerMainApp() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "workers":
        return <Workers />;
      case "artikli":
        return <Inventory />;
      case "menu":
        return <Menu />;
      case "alerts":
        return <Alerts />;
      case "voice":
        return <VoiceOrders />;
      case "checklists":
        return <Checklists />;
      case "training":
        return <Training />;
      case "settings":
        return <Settings />;
      case "anonymousReports":
        return <AnonymousReports />;
      case "waiter":
        return <WaiterApp />;
      case "cook":
        return <CookApp />;
      case "housekeeper":
        return <HousekeeperApp />;
      case "manager":
        return <ManagerApp />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />
        <main className="ml-64 p-8">{renderPage()}</main>
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
            <Route path="workers" element={<Workers />} />
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
