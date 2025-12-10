import { useAuth } from '../contexts/AuthContext';
import {useNavigate} from "react-router-dom";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {

    // @ts-ignore
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/admin/login");
    };


  return (
    <div className="bg-white shadow-md mb-6 rounded-lg p-6">
      <div className="flex items-start gap-4">
        <img src="/smarter_horeca_1.jpg" alt="Smarter HoReCa Logo" className="h-20 w-auto" />
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Smarter HoReCA</h1>
          <h2 className="text-xl font-semibold text-blue-600">{title}</h2>
          {subtitle && <p className="text-sm text-slate-600 mt-1">{subtitle}</p>}
        </div>
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
      </div>
    </div>
  );
}
