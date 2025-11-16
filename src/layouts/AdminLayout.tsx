import { Outlet } from "react-router-dom";
import AdminHeader from "../components/admin/AdminHeader";
import AdminSidebar from "../components/admin/AdminSidebar";

export default function AdminLayout() {
    return (
        <div style={{ display: "flex", height: "100vh" }}>
            <AdminSidebar />

            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <AdminHeader />

                <div style={{ padding: 20 }}>
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
