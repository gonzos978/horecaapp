import { useState } from "react";
import { LogOut, MapPin, Loader2, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const ROLE_LABEL: Record<string, string> = {
    waiter:       "Konobar",
    cook:         "Kuhar",
    housekeeping: "Sobarica",
    manager:      "Menadžer",
};

export default function WorkerHeader() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    const [locLoading, setLocLoading] = useState(false);
    const [locError,   setLocError]   = useState("");
    const [location,   setLocation]   = useState<{ lat: number; lng: number; accuracy: number } | null>(null);

    const roleLabel = currentUser?.type ? (ROLE_LABEL[currentUser.type] ?? currentUser.type) : "";

    const handleLocate = () => {
        if (!navigator.geolocation) { setLocError("GPS nije dostupan na ovom uređaju."); return; }
        setLocLoading(true);
        setLocError("");
        setLocation(null);
        navigator.geolocation.getCurrentPosition(
            pos => {
                setLocation({
                    lat:      pos.coords.latitude,
                    lng:      pos.coords.longitude,
                    accuracy: Math.round(pos.coords.accuracy),
                });
                setLocLoading(false);
            },
            () => {
                setLocError("Pristup lokaciji odbijen.");
                setLocLoading(false);
            },
            { timeout: 10000 }
        );
    };

    const openMaps = () => {
        if (!location) return;
        window.open(`https://www.google.com/maps?q=${location.lat},${location.lng}`, "_blank");
    };

    return (
        <div className="-mx-3 sm:-mx-6 -mt-3 sm:-mt-6 sticky top-0 z-40 bg-white shadow-md">
            <div className="p-4 flex items-center gap-4">
                <img
                    src="/smarter_horeca_1.jpg"
                    alt="Smarter HoReCA"
                    className="h-14 w-auto cursor-pointer"
                    onClick={() => navigate("/app/shift-start")}
                />
                <div className="flex-1 min-w-0">
                    <h1 className="text-lg font-bold text-slate-900 leading-tight">Smarter HoReCA</h1>
                    {roleLabel && <p className="text-sm text-blue-600 font-semibold">{roleLabel}</p>}
                    <p className="text-xs text-slate-500 truncate">{currentUser?.name}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleLocate}
                        disabled={locLoading}
                        title="Moja lokacija"
                        className={`p-2 rounded-lg transition-colors ${
                            location ? "text-emerald-600 bg-emerald-50" : "text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                        }`}
                    >
                        {locLoading
                            ? <Loader2 className="w-5 h-5 animate-spin" />
                            : <MapPin className="w-5 h-5" />
                        }
                    </button>
                    <button
                        onClick={logout}
                        title="Odjava"
                        className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Location result bar */}
            {(location || locError) && (
                <div className={`px-4 py-2 flex items-center gap-3 text-xs border-t ${
                    location ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-red-50 border-red-100 text-red-700"
                }`}>
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    {location ? (
                        <>
                            <span className="font-mono">{location.lat.toFixed(5)}, {location.lng.toFixed(5)}</span>
                            <span className="text-emerald-600">± {location.accuracy}m</span>
                            <button onClick={openMaps} className="ml-1 underline font-semibold hover:text-emerald-900">
                                Otvori u Maps
                            </button>
                        </>
                    ) : (
                        <span>{locError}</span>
                    )}
                    <button onClick={() => { setLocation(null); setLocError(""); }} className="ml-auto">
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}
        </div>
    );
}
