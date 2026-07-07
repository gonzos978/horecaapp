import { useState, useEffect } from "react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "../fb/firebase";
import { useAuth } from "../contexts/AuthContext";
import {
    UserCircle, Mail, Phone, MapPin, Briefcase,
    GraduationCap, ShieldCheck, TrendingUp, ChevronLeft,
    CalendarDays, Star,
} from "lucide-react";

interface WorkerData {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    type?: string;
    role?: string;
    customerName?: string;
    training?: boolean;
    trainingScore?: number;
    evaluation?: string;
    photoURL?: string;
    createdAt?: { seconds: number };
    avgChecklistScore?: number;
    totalShifts?: number;
}

function scoreColor(s: number) {
    if (s >= 80) return "text-emerald-600";
    if (s >= 50) return "text-amber-500";
    return "text-red-500";
}
function scoreBg(s: number) {
    if (s >= 80) return "bg-emerald-100 text-emerald-700";
    if (s >= 50) return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-600";
}
function scoreBar(s: number) {
    if (s >= 80) return "bg-emerald-500";
    if (s >= 50) return "bg-amber-400";
    return "bg-red-400";
}

function calcScore(items: { completed: boolean }[]) {
    if (!items.length) return 0;
    return Math.round((items.filter((i) => i.completed).length / items.length) * 100);
}

export default function WorkerProfile() {
    const { currentUser } = useAuth();
    const [workers, setWorkers] = useState<WorkerData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<WorkerData | null>(null);

    useEffect(() => {
        load();
    }, [currentUser?.customerId]);

    async function load() {
        if (!currentUser?.customerId) return;
        setLoading(true);
        try {
            const usersSnap = await getDocs(
                query(
                    collection(db, "users"),
                    where("customerId", "==", currentUser.customerId),
                    where("role", "in", ["worker"])
                )
            );
            const list: WorkerData[] = usersSnap.docs.map((d) => ({
                id: d.id,
                ...d.data(),
            } as WorkerData));

            // Fetch completed shifts to compute avg checklist score per worker
            const shiftsSnap = await getDocs(
                query(
                    collection(db, "shifts"),
                    where("customerId", "==", currentUser.customerId),
                    where("status", "==", "completed"),
                    orderBy("date", "desc")
                )
            );

            const scoreMap: Record<string, { total: number; count: number; shifts: number }> = {};

            await Promise.all(
                shiftsSnap.docs.map(async (shiftDoc) => {
                    const { workerId } = shiftDoc.data();
                    if (!workerId) return;
                    if (!scoreMap[workerId]) scoreMap[workerId] = { total: 0, count: 0, shifts: 0 };
                    scoreMap[workerId].shifts++;

                    const clSnap = await getDocs(collection(db, "shifts", shiftDoc.id, "checklists"));
                    clSnap.docs.forEach((clDoc) => {
                        const items: { completed: boolean }[] = clDoc.data().items ?? [];
                        if (items.length) {
                            scoreMap[workerId].total += calcScore(items);
                            scoreMap[workerId].count++;
                        }
                    });
                })
            );

            const enriched = list.map((w) => {
                const s = scoreMap[w.id];
                return {
                    ...w,
                    avgChecklistScore: s && s.count > 0 ? Math.round(s.total / s.count) : 0,
                    totalShifts: s?.shifts ?? 0,
                };
            });

            enriched.sort((a, b) => (b.avgChecklistScore ?? 0) - (a.avgChecklistScore ?? 0));
            setWorkers(enriched);
        } catch (err) {
            console.error("WorkerProfile load:", err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <div className="p-8 text-center text-slate-400">Učitavanje...</div>;

    if (selected) return <ProfileDetail worker={selected} onBack={() => setSelected(null)} />;

    return (
        <div className="max-w-2xl mx-auto space-y-3 pb-10">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <UserCircle className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Profil radnika</h1>
                    <p className="text-sm text-slate-500">Odaberi radnika za detalje</p>
                </div>
            </div>

            {workers.length === 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
                    Nema radnika u sistemu.
                </div>
            )}

            {workers.map((w) => (
                <button
                    key={w.id}
                    onClick={() => setSelected(w)}
                    className="w-full bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4 flex items-center gap-4 hover:shadow-md hover:border-slate-300 transition-all text-left"
                >
                    <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {w.photoURL
                            ? <img src={w.photoURL} alt={w.name} className="w-full h-full object-cover" />
                            : <UserCircle className="w-6 h-6 text-slate-400" />
                        }
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{w.name}</p>
                        <p className="text-xs text-slate-400 capitalize">{w.type} · {w.totalShifts} smjena</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                        <p className={`text-xl font-bold ${scoreColor(w.avgChecklistScore ?? 0)}`}>
                            {w.avgChecklistScore}%
                        </p>
                        <p className="text-xs text-slate-400">prosjek</p>
                    </div>
                </button>
            ))}
        </div>
    );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-500">
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
                <p className="text-sm font-semibold text-slate-800 break-words">{value}</p>
            </div>
        </div>
    );
}

function ProfileDetail({ worker, onBack }: { worker: WorkerData; onBack: () => void }) {
    const score = worker.avgChecklistScore ?? 0;
    const training = worker.trainingScore ?? 0;

    return (
        <div className="max-w-2xl mx-auto space-y-4 pb-10">
            {/* Back */}
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
            >
                <ChevronLeft className="w-4 h-4" />
                Nazad na listu
            </button>

            {/* Hero card */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {worker.photoURL
                            ? <img src={worker.photoURL} alt={worker.name} className="w-full h-full object-cover" />
                            : <UserCircle className="w-9 h-9 text-white/60" />
                        }
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">{worker.name}</h2>
                        <div className="flex flex-wrap gap-2 mt-1.5">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 capitalize">{worker.type}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${worker.training ? "bg-emerald-500/30 text-emerald-300" : "bg-red-500/30 text-red-300"}`}>
                                {worker.training ? "Trening završen" : "Trening nije završen"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Score pills */}
                <div className="grid grid-cols-3 gap-3 mt-5">
                    <div className="bg-white/10 rounded-xl p-3 text-center">
                        <p className={`text-2xl font-bold ${scoreColor(score)}`}>{score}%</p>
                        <p className="text-xs text-white/60 mt-0.5">Prosjek checkliste</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-white">{worker.totalShifts}</p>
                        <p className="text-xs text-white/60 mt-0.5">Smjena</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-white">{training}%</p>
                        <p className="text-xs text-white/60 mt-0.5">Trening skor</p>
                    </div>
                </div>
            </div>

            {/* Checklist score bar */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <TrendingUp className="w-4 h-4 text-slate-400" />
                        Prosječan rezultat checkliste
                    </div>
                    <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${scoreBg(score)}`}>{score}%</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${scoreBar(score)}`} style={{ width: `${score}%` }} />
                </div>
            </div>

            {/* Training score bar */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <GraduationCap className="w-4 h-4 text-slate-400" />
                        Trening rezultat
                    </div>
                    <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${scoreBg(training)}`}>{training}%</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${scoreBar(training)}`} style={{ width: `${training}%` }} />
                </div>
            </div>

            {/* Info */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={worker.email ?? "—"} />
                <InfoRow icon={<Phone className="w-4 h-4" />} label="Telefon" value={worker.phone ?? "—"} />
                <InfoRow icon={<MapPin className="w-4 h-4" />} label="Adresa" value={worker.address ?? "—"} />
                <InfoRow icon={<Briefcase className="w-4 h-4" />} label="Objekat" value={worker.customerName ?? "—"} />
                <InfoRow icon={<ShieldCheck className="w-4 h-4" />} label="Evaluacija" value={worker.evaluation ?? "—"} />
                <InfoRow icon={<Star className="w-4 h-4" />} label="ID" value={worker.id} />
                <InfoRow
                    icon={<CalendarDays className="w-4 h-4" />}
                    label="Datum registracije"
                    value={worker.createdAt?.seconds
                        ? new Date(worker.createdAt.seconds * 1000).toLocaleDateString("bs-BA")
                        : "—"}
                />
            </div>
        </div>
    );
}
