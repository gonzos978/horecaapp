import { useState, useEffect } from "react";
import { PlayCircle, Clock, User, CheckCircle, AlertTriangle, MapPin } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useWorkerShift } from "../../hooks/useWorkerShift";
import WorkerHeader from "../../components/WorkerHeader";

const TYPE_TO_PWA: Record<string, string> = {
    waiter: "waiter",
    cook: "cook",
    housekeeping: "housekeeper",
    manager: "manager",
};

export default function ShiftStart() {
    const { currentUser, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { activeShift, loading: shiftLoading, startShift } = useWorkerShift();
    const loading = authLoading || shiftLoading;
    const [starting, setStarting] = useState(false);
    const [error, setError] = useState("");
    const [geoStatus, setGeoStatus] = useState<"idle" | "ok" | "denied">("idle");
    const [time] = useState(() =>
        new Date().toLocaleTimeString("bs-BA", { hour: "2-digit", minute: "2-digit" })
    );

    const pwaPage = currentUser?.type ? TYPE_TO_PWA[currentUser.type] ?? "home" : "home";

    // Check geolocation permission on mount
    useEffect(() => {
        if (!navigator.geolocation) { setGeoStatus("denied"); return; }
        navigator.permissions?.query({ name: "geolocation" }).then(r => {
            if (r.state === "granted") setGeoStatus("ok");
            else if (r.state === "denied") setGeoStatus("denied");
        }).catch(() => {});
    }, []);

    const handleStart = async () => {
        setStarting(true);
        setError("");
        // Trigger browser geo prompt if not yet decided
        if (geoStatus === "idle") {
            navigator.geolocation?.getCurrentPosition(
                () => setGeoStatus("ok"),
                () => setGeoStatus("denied"),
                { timeout: 8000 }
            );
        }
        try {
            await startShift();
            setTimeout(() => navigate(`/app/${pwaPage}`), 1000);
        } catch (err: any) {
            setError(err?.message ?? "Greška pri pokretanju smjene.");
            setStarting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Učitavanje...</div>;

    return (
        <div className="min-h-screen bg-slate-50">
        <WorkerHeader />
        <div className="max-w-md mx-auto space-y-6 animate-in fade-in duration-300 p-6">
            {/* Worker card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">{currentUser?.name}</h2>
                <p className="text-sm text-slate-500 capitalize mt-1">
                    {currentUser?.type} · {currentUser?.customerName}
                </p>
            </div>

            {/* Time */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-3">
                <Clock className="w-5 h-5 text-slate-400" />
                <span className="text-sm text-slate-500">
                    {new Date().toLocaleDateString("bs-BA", {
                        weekday: "long", day: "numeric", month: "long", year: "numeric",
                    })}
                </span>
                <span className="ml-auto font-bold text-slate-900 text-lg">{time}</span>
            </div>

            {/* Geolocation status */}
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
                geoStatus === "ok"     ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
                geoStatus === "denied" ? "bg-amber-50  border-amber-200  text-amber-700"  :
                                         "bg-slate-50  border-slate-200  text-slate-500"
            }`}>
                <MapPin className="w-4 h-4 flex-shrink-0" />
                {geoStatus === "ok"     ? "Lokacija će biti zabilježena pri početku smjene." :
                 geoStatus === "denied" ? "Lokacija nije dostupna — smjena će biti snimljena bez GPS-a." :
                                          "Provjera dozvole za lokaciju..."}
            </div>

            {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    {error}
                </div>
            )}

            {/* Already has active shift */}
            {activeShift ? (
                <div className="space-y-3">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-sm text-center">
                        Smjena je već aktivna od{" "}
                        {activeShift.startTime?.toDate
                            ? activeShift.startTime.toDate().toLocaleTimeString("bs-BA", { hour: "2-digit", minute: "2-digit" })
                            : "—"}
                    </div>
                    <button
                        onClick={() => navigate(`/app/${pwaPage}`)}
                        className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all text-lg"
                    >
                        Nastavi smjenu
                    </button>
                </div>
            ) : starting ? (
                <div className="w-full flex items-center justify-center gap-3 bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold py-4 rounded-xl text-lg">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                    Smjena započeta!
                </div>
            ) : (
                <button
                    onClick={handleStart}
                    className="w-full flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-md shadow-emerald-600/30 transition-all text-lg"
                >
                    <PlayCircle className="w-6 h-6" />
                    Počni smjenu
                </button>
            )}
        </div>
        </div>
    );
}
