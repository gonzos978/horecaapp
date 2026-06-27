import {
    LayoutDashboard,
    Package,
    UtensilsCrossed,
    Bell,
    ClipboardCheck,
    GraduationCap,
    Settings,
    Shield,
    Smartphone,
    ChefHat,
    Home,
    ListTodo,
    PlayCircle,
    StopCircle,
    UserX,
    TrendingUp,
    UserCircle,
    FileQuestion,
    CircleUser,
    InboxIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, updateDoc, doc, addDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "../fb/firebase";
import {useLanguage} from "../contexts/LanguageContext";
import {useAuth} from "../contexts/AuthContext";

interface NavigationProps {
    currentPage: string;
    onNavigate: (page: any) => void;
    isOpen: boolean;
    onClose: () => void;
}

export default function Navigation({
                                       currentPage,
                                       onNavigate,
                                       isOpen,
                                       onClose,
                                   }: NavigationProps) {
    const {t} = useLanguage();
    const {currentUser} = useAuth();
    const isWorker = currentUser?.role?.toLowerCase() === "worker";
    const [pendingCount,  setPendingCount]  = useState(0);
    const [pendingReports, setPendingReports] = useState(0);
    const [unreadNotifs, setUnreadNotifs]   = useState<any[]>([]);
    const [showNotifs,   setShowNotifs]     = useState(false);
    const [actingNotif,  setActingNotif]    = useState<string | null>(null);
    const { user } = useAuth();

    // Manager: count pending vacation/sick/replacement requests
    useEffect(() => {
        if (!currentUser?.customerId || isWorker) return;
        const q = query(
            collection(db, "requests"),
            where("customerId", "==", currentUser.customerId),
            where("status", "==", "pending")
        );
        const unsub = onSnapshot(q, snap => setPendingCount(snap.size));
        return () => unsub();
    }, [currentUser?.customerId, isWorker]);

    // Manager: count unread/new anonymous reports
    useEffect(() => {
        if (!currentUser?.customerId || isWorker) return;
        const q = query(
            collection(db, "anonymous_reports"),
            where("customerId", "==", currentUser.customerId),
            where("status", "==", "pending")
        );
        const unsub = onSnapshot(q, snap => setPendingReports(snap.size));
        return () => unsub();
    }, [currentUser?.customerId, isWorker]);

    // Worker: unread notifications — also pop a toast for non-replacement-request types
    const prevNotifsRef = useState<Set<string>>(() => new Set())[0];
    useEffect(() => {
        if (!user?.uid || !isWorker) return;
        const q = query(
            collection(db, "workerNotifications"),
            where("workerId", "==", user.uid),
            where("read", "==", false)
        );
        const unsub = onSnapshot(q, snap => {
            const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
            setUnreadNotifs(docs);

            // Show a browser notification / visual pop for newly arrived non-actionable ones
            docs.forEach(n => {
                if (!prevNotifsRef.has(n.id) && n.type !== "replacement_request") {
                    // Auto-open the bell panel so the worker sees it
                    setShowNotifs(true);
                }
                prevNotifsRef.add(n.id);
            });
        });
        return () => unsub();
    }, [user?.uid, isWorker]);

    const markNonActionableRead = async () => {
        for (const n of unreadNotifs) {
            if (n.type !== "replacement_request") {
                await updateDoc(doc(db, "workerNotifications", n.id), { read: true });
            }
        }
    };

    const handleReplacementDecision = async (notif: any, decision: "approved" | "declined") => {
        setActingNotif(notif.id);
        try {
            // Mark notification as read
            await updateDoc(doc(db, "workerNotifications", notif.id), { read: true });

            // If linked to a vacation/sick request doc — update it too
            if (notif.requestId) {
                await updateDoc(doc(db, "requests", notif.requestId), {
                    replacementStatus: decision,
                    status: decision === "approved" ? "pending" : "replacement_declined",
                });
            }

            // If shift replacement accepted and no existing request doc → create one for manager to approve
            if (decision === "approved" && !notif.requestId && notif.originalWorkerId) {
                await addDoc(collection(db, "requests"), {
                    workerId:             notif.originalWorkerId,
                    workerDocId:          notif.originalWorkerId,
                    workerName:           notif.originalName || "",
                    customerId:           notif.customerId,
                    type:                 "replacement_shift",
                    date:                 notif.date || "",
                    shift:                notif.shift || "",
                    note:                 notif.note  || "",
                    replacementWorkerId:  user?.uid,
                    replacementWorkerName: currentUser?.name || "",
                    status:               "pending",
                    createdAt:            serverTimestamp(),
                });
            }

            // Notify the original worker of the decision
            if (notif.originalWorkerId) {
                await addDoc(collection(db, "workerNotifications"), {
                    workerId:   notif.originalWorkerId,
                    customerId: notif.customerId,
                    type:       decision === "approved" ? "replacement_approved" : "replacement_declined",
                    title:      decision === "approved" ? "✅ Zamjena prihvaćena" : "❌ Zamjena odbijena",
                    body:       decision === "approved"
                        ? `${currentUser?.name} je prihvatio/la zamjenu smjene${notif.shift ? ` (${notif.shift}` : ""}${notif.date ? `, ${new Date(notif.date).toLocaleDateString("bs-BA")}` : ""}${notif.shift || notif.date ? ")" : ""}. Čeka odobrenje menadžera.`
                        : `${currentUser?.name} nije prihvatio/la zamjenu smjene${notif.shift ? ` (${notif.shift})` : ""}.`,
                    read:      false,
                    createdAt: serverTimestamp(),
                });
            }
        } catch (err) {
            console.error("Replacement decision error:", err);
        } finally {
            setActingNotif(null);
        }
    };

    // Map user type to their PWA route (housekeeping → housekeeper)
    const TYPE_TO_PWA: Record<string, string> = {
        waiter: "waiter",
        cook: "cook",
        housekeeping: "housekeeper",
        manager: "manager",
    };
    const workerPwaId = currentUser?.type ? TYPE_TO_PWA[currentUser.type] : undefined;

    const menuItems = [
        {id: "home", icon: LayoutDashboard, label: t("nav.dashboard")},
        {id: "workers", icon: ListTodo, label: t("nav.workers")},
        {id: "artikli", icon: Package, label: t("nav.artikli")},
        {id: "menu", icon: UtensilsCrossed, label: t("nav.menu")},
        {id: "alerts", icon: Bell, label: t("nav.alerts")},
        {id: "checklists", icon: ClipboardCheck, label: t("nav.checklists")},
        {id: "training", icon: GraduationCap, label: t("nav.training")},
        {id: "anonymousReports", icon: Shield, label: t("nav.anonymousReports")},
        {id: "requests", icon: InboxIcon, label: "Zahtjevi"},
        {id: "settings", icon: Settings, label: t("nav.settings")},
    ];

    // @ts-ignore
    const pwaItems = [
        {id: "manager", icon: ListTodo, label: "Menadžer PWA"},
        {id: "waiter", icon: Smartphone, label: "Konobar PWA"},
        {id: "cook", icon: ChefHat, label: "Kuvar PWA"},
        {id: "housekeeper", icon: Home, label: "Sobarica PWA"},
    ];

    return (
        <aside
            className={`
    fixed z-40 left-0 top-0 h-screen w-64 bg-white border-r border-slate-200 shadow-sm
    transition-transform duration-300
    ${isOpen ? "translate-x-0" : "-translate-x-full"}
    md:translate-x-0
  `}>
            <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 leading-tight">{t("app.title")}</h1>
                        <p className="text-xs text-slate-500 mt-1">v3.1</p>
                    </div>
                    {isWorker && (
                        <button
                            onClick={() => { setShowNotifs(v => !v); if (!showNotifs) markNonActionableRead(); }}
                            className="relative w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition"
                        >
                            <Bell className="w-4 h-4 text-slate-600" />
                            {unreadNotifs.length > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                                    {unreadNotifs.length}
                                </span>
                            )}
                        </button>
                    )}
                </div>

                {/* Worker notification dropdown */}
                {isWorker && showNotifs && (
                    <div className="mt-3 space-y-2 max-h-80 overflow-y-auto">
                        {unreadNotifs.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-2">Nema novih obavijesti.</p>
                        ) : unreadNotifs.map((n: any) => {
                            const isReplacement = n.type === "replacement_request";
                            const cls = isReplacement
                                ? "bg-violet-50 border-violet-200 text-violet-900"
                                : n.type === "approved" || n.type === "replacement_approved"
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                    : "bg-red-50 border-red-200 text-red-800";
                            return (
                                <div key={n.id} className={`rounded-xl border px-3 py-3 text-xs ${cls}`}>
                                    <p className="font-bold text-sm">{n.title}</p>
                                    <p className="mt-1 opacity-80 leading-relaxed">{n.body}</p>
                                    {isReplacement && (
                                        <div className="flex gap-2 mt-3">
                                            <button
                                                onClick={() => handleReplacementDecision(n, "approved")}
                                                disabled={actingNotif === n.id}
                                                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition disabled:opacity-50"
                                            >
                                                {actingNotif === n.id
                                                    ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    : "✓"} Prihvati
                                            </button>
                                            <button
                                                onClick={() => handleReplacementDecision(n, "declined")}
                                                disabled={actingNotif === n.id}
                                                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold transition disabled:opacity-50"
                                            >
                                                ✕ Odbij
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <nav className="p-4 space-y-1">
                {!isWorker && menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPage === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => {
                                onNavigate(item.id);
                                onClose();
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                isActive
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            }`}
                        >
                            <Icon className="w-5 h-5"/>
                            <span className="font-medium text-sm flex-1">{item.label}</span>
                            {item.id === "requests" && pendingCount > 0 && (
                                <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                                    {pendingCount}
                                </span>
                            )}
                            {item.id === "anonymousReports" && pendingReports > 0 && (
                                <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                                    {pendingReports}
                                </span>
                            )}
                        </button>
                    );
                })}

                {isWorker && (
                <div className="pt-2">
                    {[
                        { id: "shift-start",                     icon: PlayCircle,    label: "Početak smjene",   color: "emerald", hideOnChecklist: false },
                        { id: workerPwaId ?? "home",              icon: ClipboardCheck,label: "Moja lista",       color: "blue",    hideOnChecklist: false },
                        { id: "shift-end",                       icon: StopCircle,    label: "Kraj smjene",      color: "red",     hideOnChecklist: false },
                        { id: "training",                         icon: FileQuestion,  label: "Testovi",          color: "violet",  hideOnChecklist: false },
                        { id: "anonymousReports",                 icon: UserX,         label: "Anonimna prijava", color: "slate",   hideOnChecklist: false },
                        { id: "myProfile",                        icon: CircleUser,    label: "Moj profil",       color: "blue",    hideOnChecklist: false },
                    ].filter(item => !(item.hideOnChecklist && currentPage === (workerPwaId ?? "home")))
                    .map(({ id, icon: Icon, label, color }) => {
                        const isActive = currentPage === id;
                        const activeClass =
                            color === "emerald" ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                          : color === "red"     ? "bg-red-500 text-white shadow-md shadow-red-500/30"
                          : color === "slate"   ? "bg-slate-700 text-white shadow-md shadow-slate-700/30"
                          : color === "violet"  ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                          :                       "bg-blue-600 text-white shadow-md shadow-blue-600/30";
                        return (
                            <button
                                key={id}
                                onClick={() => { onNavigate(id); onClose(); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                    isActive ? activeClass : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="font-medium text-sm flex-1">{label}</span>
                                {id === "myProfile" && unreadNotifs.length > 0 && (
                                    <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                                        {unreadNotifs.length}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
                )}
            </nav>
        </aside>
    );
}
