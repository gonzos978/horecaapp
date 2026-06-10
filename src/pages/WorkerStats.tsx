import { useState, useEffect } from "react";
import {
    collection,
    getDocs,
    query,
    where,
    orderBy,
} from "firebase/firestore";
import { db } from "../fb/firebase";
import { useAuth } from "../contexts/AuthContext";
import { TrendingUp, User, ChevronDown, ChevronUp, Calendar } from "lucide-react";

interface DayScore {
    date: string;
    score: number;
    completedItems: number;
    totalItems: number;
    checklists: { title: string; score: number }[];
}

interface WorkerRow {
    id: string;
    name: string;
    type: string;
    avgScore: number;
    days: DayScore[];
}

function calcScore(items: { completed: boolean }[]) {
    if (!items.length) return 0;
    return Math.round((items.filter((i) => i.completed).length / items.length) * 100);
}

export default function WorkerStats() {
    const { currentUser } = useAuth();
    const [workers, setWorkers] = useState<WorkerRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<string | null>(null);

    useEffect(() => {
        load();
    }, [currentUser?.customerId]);

    async function load() {
        if (!currentUser?.customerId) return;
        setLoading(true);
        try {
            // 1. Fetch workers for this customer
            const usersSnap = await getDocs(
                query(
                    collection(db, "users"),
                    where("customerId", "==", currentUser.customerId),
                    where("role", "in", ["worker"])
                )
            );
            const workerList = usersSnap.docs.map((d) => ({
                id: d.id,
                name: d.data().name ?? d.id,
                type: d.data().type ?? "",
            }));

            // 2. Fetch all completed shifts for this customer
            const shiftsSnap = await getDocs(
                query(
                    collection(db, "shifts"),
                    where("customerId", "==", currentUser.customerId),
                    where("status", "==", "completed"),
                    orderBy("date", "desc")
                )
            );

            // 3. For each shift, load its checklist subcollection
            const shiftDocs = shiftsSnap.docs;

            // Group by workerId → date
            const byWorker: Record<string, Record<string, { title: string; items: { completed: boolean }[] }[]>> = {};

            await Promise.all(
                shiftDocs.map(async (shiftDoc) => {
                    const { workerId, date } = shiftDoc.data();
                    if (!workerId || !date) return;

                    const clSnap = await getDocs(
                        collection(db, "shifts", shiftDoc.id, "checklists")
                    );
                    if (clSnap.empty) return;

                    if (!byWorker[workerId]) byWorker[workerId] = {};
                    if (!byWorker[workerId][date]) byWorker[workerId][date] = [];

                    clSnap.docs.forEach((clDoc) => {
                        const data = clDoc.data();
                        byWorker[workerId][date].push({
                            title: data.checklistTitle ?? "Checklist",
                            items: data.items ?? [],
                        });
                    });
                })
            );

            // 4. Build WorkerRow[]
            const rows: WorkerRow[] = workerList.map((w) => {
                const dateMap = byWorker[w.id] ?? {};
                const days: DayScore[] = Object.entries(dateMap)
                    .sort(([a], [b]) => b.localeCompare(a))
                    .slice(0, 30)
                    .map(([date, cls]) => {
                        const allItems = cls.flatMap((c) => c.items);
                        const completedItems = allItems.filter((i) => i.completed).length;
                        const totalItems = allItems.length;
                        return {
                            date,
                            score: calcScore(allItems),
                            completedItems,
                            totalItems,
                            checklists: cls.map((c) => ({
                                title: c.title,
                                score: calcScore(c.items),
                            })),
                        };
                    });

                const avgScore =
                    days.length > 0
                        ? Math.round(days.reduce((s, d) => s + d.score, 0) / days.length)
                        : 0;

                return { ...w, avgScore, days };
            });

            rows.sort((a, b) => b.avgScore - a.avgScore);
            setWorkers(rows);
        } catch (err) {
            console.error("WorkerStats load:", err);
        } finally {
            setLoading(false);
        }
    }

    function scoreColor(score: number) {
        if (score >= 80) return "text-emerald-600";
        if (score >= 50) return "text-amber-500";
        return "text-red-500";
    }

    function scoreBg(score: number) {
        if (score >= 80) return "bg-emerald-100 text-emerald-700";
        if (score >= 50) return "bg-amber-100 text-amber-700";
        return "bg-red-100 text-red-600";
    }

    function scoreBar(score: number) {
        if (score >= 80) return "bg-emerald-500";
        if (score >= 50) return "bg-amber-400";
        return "bg-red-400";
    }

    if (loading) {
        return (
            <div className="p-8 text-center text-slate-400">Učitavanje statistike...</div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-4 pb-10">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Statistika radnika</h1>
                    <p className="text-sm text-slate-500">Prosječan rezultat checkliste po danu</p>
                </div>
            </div>

            {workers.length === 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
                    Nema podataka o završenim smjenama.
                </div>
            )}

            {workers.map((w) => (
                <div key={w.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Worker header row */}
                    <button
                        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left"
                        onClick={() => setExpanded(expanded === w.id ? null : w.id)}
                    >
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 truncate">{w.name}</p>
                            <p className="text-xs text-slate-400 capitalize">{w.type}</p>
                        </div>

                        {/* Score badge */}
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className={`text-2xl font-bold ${scoreColor(w.avgScore)}`}>
                                    {w.avgScore}%
                                </p>
                                <p className="text-xs text-slate-400">{w.days.length} dana</p>
                            </div>
                            {expanded === w.id ? (
                                <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                        </div>
                    </button>

                    {/* Progress bar */}
                    <div className="h-1.5 bg-slate-100">
                        <div
                            className={`h-full transition-all ${scoreBar(w.avgScore)}`}
                            style={{ width: `${w.avgScore}%` }}
                        />
                    </div>

                    {/* Expanded day-by-day */}
                    {expanded === w.id && (
                        <div className="border-t border-slate-100 divide-y divide-slate-100">
                            {w.days.length === 0 && (
                                <p className="px-5 py-4 text-sm text-slate-400">Nema završenih smjena.</p>
                            )}
                            {w.days.map((day) => (
                                <div key={day.date} className="px-5 py-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                            {day.date}
                                        </div>
                                        <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${scoreBg(day.score)}`}>
                                            {day.score}%
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {day.checklists.map((cl, i) => (
                                            <span
                                                key={i}
                                                className={`text-xs px-2 py-0.5 rounded-full ${scoreBg(cl.score)}`}
                                            >
                                                {cl.title}: {cl.score}%
                                            </span>
                                        ))}
                                    </div>
                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${scoreBar(day.score)}`}
                                            style={{ width: `${day.score}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400">
                                        {day.completedItems}/{day.totalItems} stavki završeno
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
