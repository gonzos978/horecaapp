import { NavLink } from "react-router-dom";

export default function AdminSidebar() {
    const linkStyle = ({ isActive }: any) => ({
        display: "block",
        padding: "12px 20px",
        background: isActive ? "#444" : "transparent",
        color: "white",
        textDecoration: "none"
    });

    return (
        <aside style={{
            width: "220px",
            background: "#333",
            color: "white",
            display: "flex",
            flexDirection: "column"
        }}>
            <NavLink to="/admin/dashboard" style={linkStyle}>
                Dashboard
            </NavLink>
            <NavLink to="/admin/customers/add" style={linkStyle}>
                Add Customer
            </NavLink>
            <NavLink to="/admin/users" style={linkStyle}>
                Customers
            </NavLink>

            <NavLink to="/admin/settings" style={linkStyle}>
                Settings
            </NavLink>
        </aside>
    );
}
