import { useState, useEffect } from "react";
import {
    CheckCircle, XCircle, Clock, Palmtree, Thermometer,
    User, Users, CalendarDays, Loader2, RefreshCw
} from "lucide-react";
import {
    collection, query, where, onSnapshot, doc,
    serverTimestamp, writeBatch, addDoc
} from "firebase/firestore";
import { db } from "../fb/firebase";
import { useAuth } from "../contexts/AuthContext";
import { useToast, ToastContainer } from "../components/Toast";

interface Request {
    id: string;
    workerId: string;
    workerName: string;
    workerEmail: string;
    workerDocId: string;
    customerId: string;
    type: "vacation" | "sickDays";
    from: string;
    to: string;
    days: number;
    note: string;
    status: "pending" | "approved" | "rejected";
    createdAt: any;
    total: number;
}

const TYPE_LABEL: Record<string, { label: string; icon: any; color: string; bg: string; border: string }> = {
    vacation: {
        label: "Godišnji odmor",
        icon: Palmtree,
        color: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200",
    },
    sickDays: {
        label: "Bolovanje",
        icon: Thermometer,
        color: "text-red-600",
        bg: "bg-red-50",
        border: "border-red-200",
    },
    replacement_shift: {
        label: "Zamjena smjene",
        icon: Users,
        color: "text-violet-600",
        bg: "bg-violet-50",
        border: "border-violet-200",
    },
};

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
    pending:              { label: "Na čekanju",           cls: "bg-amber-100 text-amber-800 border-amber-200" },
    awaiting_replacement: { label: "Čeka zamjenu",         cls: "bg-violet-100 text-violet-800 border-violet-200" },
    approved:             { label: "Odobreno",             cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    rejected:             { label: "Odbijeno",             cls: "bg-red-100 text-red-800 border-red-200" },
    replacement_declined: { label: "Zamjena odbijena",     cls: "bg-red-100 text-red-800 border-red-200" },
};

export default function Requests() {
    const { currentUser } = useAuth();
    const toast = useToast();
    const [requests, setRequests] = useState<Request[]>([]);
    const [loading, setLoading]   = useState(true);
    const [filter, setFilter]     = useState<"all" | "pending" | "approved" | "rejected">("pending");
    const [acting, setActing]     = useState<string | null>(null);

    useEffect(() => {
        if (!currentUser?.customerId) return;
        const q = query(
            collection(db, "requests"),
            where("customerId", "==", currentUser.customerId)
        );
        const unsub = onSnapshot(q, snap => {
            const list = snap.docs
                .map(d => ({ id: d.id, ...d.data() } as Request))
                .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
            setRequests(list);
            setLoading(false);
        }, () => setLoading(false));
        return () => unsub();
    }, [currentUser?.customerId]);

    const handleDecision = async (req: Request, decision: "approved" | "rejected") => {
        setActing(req.id);
        try {
            const batch = writeBatch(db);

            // 1. Update request status
            batch.update(doc(db, "requests", req.id), {
                status: decision,
                decidedAt: serverTimestamp(),
                decidedBy: currentUser?.name || "Manager",
            });

            // 2. If approved and it's a vacation/sick request — update the worker's doc
            if (decision === "approved" && req.type !== "replacement_shift") {
                const workerRef = doc(db, "users", req.workerDocId);
                const field = req.type === "vacation" ? "vacation" : "sickDays";
                batch.update(workerRef, {
                    [`${field}.from`]: req.from,
                    [`${field}.to`]:   req.to,
                    [`${field}.used`]: req.days,
                    [`${field}.note`]: req.note,
                });
            }

            await batch.commit();

            // 3. Notify the worker
            const typeLabel = req.type === "vacation" ? "Godišnji odmor"
                           : req.type === "sickDays"  ? "Bolovanje"
                           :                            "Zamjena smjene";
            const detail = req.type === "replacement_shift"
                ? `${req.shift ? req.shift + ", " : ""}${fmtDate(req.date)}`
                : `${fmtDate(req.from)} – ${fmtDate(req.to)}`;

            // Notify the original worker
            await addDoc(collection(db, "workerNotifications"), {
                workerId:   req.workerId,
                customerId: req.customerId,
                type:       decision,
                title:      decision === "approved" ? `✅ ${typeLabel} odobren` : `❌ ${typeLabel} odbijen`,
                body:       decision === "approved"
                    ? `Menadžer je odobrio/la tvoj zahtjev za ${typeLabel.toLowerCase()} (${detail}).`
                    : `Menadžer je odbio/la tvoj zahtjev za ${typeLabel.toLowerCase()} (${detail}).`,
                requestId:  req.id,
                read:       false,
                createdAt:  serverTimestamp(),
                decidedBy:  currentUser?.name || "Manager",
            });

            // Also notify the replacement worker if this is a shift replacement
            if (req.type === "replacement_shift" && req.replacementWorkerId) {
                await addDoc(collection(db, "workerNotifications"), {
                    workerId:   req.replacementWorkerId,
                    customerId: req.customerId,
                    type:       decision,
                    title:      decision === "approved" ? `✅ Zamjena odobrena` : `❌ Zamjena odbijena`,
                    body:       decision === "approved"
                        ? `Menadžer je odobrio/la zamjenu smjene za ${req.workerName} (${detail}).`
                        : `Menadžer je odbio/la zamjenu smjene za ${req.workerName} (${detail}).`,
                    requestId:  req.id,
                    read:       false,
                    createdAt:  serverTimestamp(),
                });
            }

            toast.success(
                decision === "approved" ? "Zahtjev odobren" : "Zahtjev odbijen",
                req.type === "replacement_shift" ? `${req.workerName} — ${req.shift}` : `${req.workerName} — ${req.days} dana`
            );
        } catch (err: any) {
            toast.error("Greška", err?.message);
        } finally {
            setActing(null);
        }
    };

    const filtered = requests.filter(r => filter === "all" || r.status === filter);
    const pendingCount = requests.filter(r => r.status === "pending").length;

    return (
        <div className="space-y-6">
            <ToastContainer toasts={toast.toasts} remove={toast.remove} />

            {/* Filter tabs */}
            <div className="flex gap-2 flex-wrap">
                {(["pending", "approved", "rejected", "all"] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${
                            filter === f
                                ? "bg-slate-900 text-white border-slate-900"
                                : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                        }`}
                    >
                        {f === "pending" ? `Na čekanju${pendingCount > 0 ? ` (${pendingCount})` : ""}` : f === "approved" ? "Odobreno" : f === "rejected" ? "Odbijeno" : "Sve"}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
                    <Loader2 size={20} className="animate-spin" /> Učitavanje...
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400">
                    <RefreshCw size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Nema zahtjeva</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(req => {
                        const cfg = TYPE_LABEL[req.type] ?? TYPE_LABEL.vacation;
                        const Icon = cfg.icon;
                        const statusCfg = STATUS_CFG[req.status];
                        const isPending = req.status === "pending";
                        const isWaitingReplacement = req.status === "awaiting_replacement";

                        return (
                            <div key={req.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${isPending ? "border-amber-200" : "border-slate-100"}`}>
                                {/* Top accent */}
                                <div className={`h-1 w-full ${isPending ? "bg-amber-400" : req.status === "approved" ? "bg-emerald-500" : "bg-red-400"}`} />

                                <div className="p-5">
                                    <div className="flex items-start gap-4">
                                        {/* Type icon */}
                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                                            <Icon size={20} className={cfg.color} />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-bold text-slate-800">{req.workerName}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                                                    {cfg.label}
                                                </span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${statusCfg.cls}`}>
                                                    {statusCfg.label}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-4 mt-2 text-sm text-slate-600 flex-wrap">
                                                {req.type === "replacement_shift" ? (
                                                    <>
                                                        <span className="flex items-center gap-1">
                                                            <CalendarDays size={13} />
                                                            {fmtDate(req.date)}
                                                        </span>
                                                        {req.shift && <span className="font-semibold text-violet-700">{req.shift}</span>}
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="flex items-center gap-1">
                                                            <CalendarDays size={13} />
                                                            {fmtDate(req.from)} – {fmtDate(req.to)}
                                                        </span>
                                                        <span className="font-semibold text-slate-800">{req.days} dana</span>
                                                        {req.total > 0 && <span className="text-slate-400">od {req.total} ukupno</span>}
                                                    </>
                                                )}
                                            </div>

                                            {req.replacementWorkerName && (
                                                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                                    <span className="text-violet-500">↔</span>
                                                    Zamjena: <span className="font-semibold text-slate-700">{req.replacementWorkerName}</span>
                                                    {isWaitingReplacement && <span className="text-violet-600">(čeka potvrdu)</span>}
                                                </p>
                                            )}
                                            {req.note && (
                                                <p className="text-xs text-slate-500 mt-1.5 italic">„{req.note}"</p>
                                            )}

                                            <p className="text-xs text-slate-400 mt-1">
                                                Poslano: {req.createdAt?.toDate ? req.createdAt.toDate().toLocaleString("bs-BA") : "—"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {isPending && (
                                        <div className="flex gap-2 mt-4">
                                            <button
                                                onClick={() => handleDecision(req, "approved")}
                                                disabled={acting === req.id}
                                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition disabled:opacity-50"
                                            >
                                                {acting === req.id ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                                                Odobri
                                            </button>
                                            <button
                                                onClick={() => handleDecision(req, "rejected")}
                                                disabled={acting === req.id}
                                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition disabled:opacity-50"
                                            >
                                                <XCircle size={15} /> Odbij
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function fmtDate(d: string) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("bs-BA", { day: "2-digit", month: "2-digit", year: "numeric" });
}
