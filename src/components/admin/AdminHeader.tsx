import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function AdminHeader() {
    // @ts-ignore
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/admin/login");
    };

    return (
        <header style={{
            padding: "10px 20px",
            background: "#222",
            color: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
        }}>
            <h3>Admin Panel</h3>

            <button
                onClick={handleLogout}
                style={{
                    padding: "6px 12px",
                    background: "#e74c3c",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                }}
            >
                Logout
            </button>
        </header>
    );
}
