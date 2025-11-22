// src/layouts/UserLayout.tsx
import { Outlet, Link } from "react-router-dom";

export default function UserLayout() {
    return (
        <div style={{ display: "flex", minHeight: "100vh" }}>
            {/* Sidebar */}
            <nav style={{ width: 200, background: "#f5f5f5", padding: 20 }}>
                <h2>Horeca App</h2>
                <ul style={{ listStyle: "none", padding: 0 }}>
                    <li><Link to="/app/home">Home</Link></li>
                    <li><Link to="/app/workers">Workers</Link></li>
                </ul>
            </nav>

            {/* Main content */}
            <main style={{ flex: 1, padding: 20 }}>
                <Outlet />
            </main>
        </div>
    );
}
