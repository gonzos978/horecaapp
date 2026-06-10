import { useState } from "react";
import { StopCircle, Clock, CheckCircle, AlertTriangle, Hourglass } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useWorkerShift } from "../../hooks/useWorkerShift";

export default function ShiftEnd() {
    const { currentUser } = useAuth();
    const { activeShift, loading, endShift } = useWorkerShift();
    const [ending, setEnding] = useState(false);
    const [done, setDone] = useState(false);
    const [note, setNote] = useState("");
    const [error, setError] = useState("");
    const [tooEarly, setTooEarly] = useState<{ h: number; m: number } | null>(null);
    const [time] = useState(() =>
        new Date().toLocaleTimeString("bs-BA", { hour: "2-digit", minute: "2-digit" })
    );

    const handleEnd = async () => {
        setEnding(true);
        setError("");
        setTooEarly(null);
        try {
            await endShift(note);
            setDone(true);
        } catch (err: any) {
            const msg: string = err?.message ?? "";
            if (msg.startsWith("MIN_SHIFT_HOURS:")) {
                const [, h, m] = msg.split(":");
                setTooEarly({ h: parseInt(h), m: parseInt(m) });
            } else {
                setError(msg || "Greška pri završetku smjene.");
            }
            setEnding(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Učitavanje...</div>;

    if (done) {
        return (
            <div className="max-w-md mx-auto animate-in fade-in duration-300">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center space-y-4">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Smjena završena</h2>
                    <p className="text-slate-500 text-sm">Odjava u {time}. Laku noć!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto space-y-6 animate-in fade-in duration-300">
            {/* Time card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-3">
                <Clock className="w-5 h-5 text-slate-400" />
                <span className="text-sm text-slate-500">{currentUser?.name} · <span className="capitalize">{currentUser?.type}</span></span>
                <span className="ml-auto font-bold text-slate-900 text-lg">{time}</span>
            </div>

            {/* Shift info */}
            {activeShift ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 text-sm text-slate-600">
                    Aktivna smjena od{" "}
                    <span className="font-semibold text-slate-900">
                        {activeShift.startTime?.toDate
                            ? activeShift.startTime.toDate().toLocaleTimeString("bs-BA", { hour: "2-digit", minute: "2-digit" })
                            : "—"}
                    </span>
                </div>
            ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800">Nema aktivne smjene za danas.</p>
                </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">Provjeri da li su sve check liste završene prije odjave.</p>
            </div>

            {/* Note */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    Napomena za narednu smjenu (opciono)
                </label>
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder="Npr. Frižider #2 ima problem..."
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
                />
            </div>

            {tooEarly && (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5 flex gap-4 items-start">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Hourglass className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <p className="font-bold text-amber-900 text-sm">Prerano za završetak smjene</p>
                        <p className="text-amber-700 text-sm mt-0.5">
                            Smjena mora trajati najmanje <span className="font-bold">8 sati</span>.
                            {tooEarly.h > 0
                                ? ` Preostalo: ${tooEarly.h}h ${tooEarly.m}min.`
                                : ` Preostalo: ${tooEarly.m}min.`}
                        </p>
                    </div>
                </div>
            )}

            {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    {error}
                </div>
            )}

            <button
                onClick={handleEnd}
                disabled={ending || !activeShift || !!tooEarly}
                className="w-full flex items-center justify-center gap-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-md shadow-red-500/30 transition-all text-lg"
            >
                <StopCircle className="w-6 h-6" />
                {ending ? "Snimanje..." : "Završi smjenu"}
            </button>
        </div>
    );
}
