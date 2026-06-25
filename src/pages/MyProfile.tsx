import { useState, useEffect } from "react";
import {
    User, Palmtree, Thermometer, Users,
    Save, CheckCircle, Loader2, CalendarDays, Clock, XCircle
} from "lucide-react";
import {
    collection, doc, getDoc, getDocs, addDoc, query, where, serverTimestamp, onSnapshot
} from "firebase/firestore";
import { db } from "../fb/firebase";
import { useAuth } from "../contexts/AuthContext";
import { useToast, ToastContainer } from "../components/Toast";
import WorkerHeader from "../components/WorkerHeader";

interface WorkerOption {
    id: string;
    name: string;
    type: string;
    email: string;
}

export default function MyProfile() {
    const { user, currentUser } = useAuth();
    const toast = useToast();

    const [coworkers, setCoworkers]           = useState<WorkerOption[]>([]);
    const [loadingCoworkers, setLoadingCoworkers] = useState(true);
    const [myDocId, setMyDocId]               = useState<string | null>(null);
    const [saving, setSaving]                 = useState(false);

    const [vacationTotal,       setVacationTotal]       = useState(0);
    const [vacationAllowedFrom, setVacationAllowedFrom] = useState("");
    const [vacationAllowedTo,   setVacationAllowedTo]   = useState("");
    const [vacationFrom,        setVacationFrom]        = useState("");
    const [vacationTo,          setVacationTo]          = useState("");
    const [vacationNote,        setVacationNote]        = useState("");

    const [sickTotal,  setSickTotal]          = useState(0);
    const [sickFrom,   setSickFrom]           = useState("");
    const [sickTo,     setSickTo]             = useState("");
    const [sickNote,   setSickNote]           = useState("");

    const [myRequests, setMyRequests]                   = useState<any[]>([]);
    const [replacementRequests, setReplacementRequests] = useState<any[]>([]);
    const [actingReplace, setActingReplace]             = useState<string | null>(null);
    const [replaceModal, setReplaceModal]               = useState<WorkerOption | null>(null);
    const [upcomingReplacements, setUpcomingReplacements] = useState<any[]>([]);

    // Live listener for this worker's own requests
    useEffect(() => {
        if (!user?.uid) return;
        const q = query(collection(db, "requests"), where("workerId", "==", user.uid));
        const unsub = onSnapshot(q, snap => {
            setMyRequests(snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .sort((a: any, b: any) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)));
        });
        return () => unsub();
    }, [user?.uid]);

    // Live listener for incoming replacement requests (this worker is the replacement)
    useEffect(() => {
        if (!user?.uid) return;
        const q = query(
            collection(db, "requests"),
            where("replacementWorkerId", "==", user.uid),
            where("replacementStatus", "==", "pending")
        );
        const unsub = onSnapshot(q, snap => {
            setReplacementRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, [user?.uid]);

    // Approved future replacement shifts where this worker is the replacement
    useEffect(() => {
        if (!user?.uid) return;
        const today = new Date().toISOString().slice(0, 10);
        const q = query(
            collection(db, "requests"),
            where("replacementWorkerId", "==", user.uid),
            where("type", "==", "replacement_shift"),
            where("status", "==", "approved")
        );
        const unsub = onSnapshot(q, snap => {
            const future = snap.docs
                .map(d => ({ id: d.id, ...d.data() } as any))
                .filter(r => r.date >= today)
                .sort((a, b) => a.date.localeCompare(b.date));
            setUpcomingReplacements(future);
        });
        return () => unsub();
    }, [user?.uid]);

    useEffect(() => {
        if (!user?.uid) return;

        const load = async () => {
            try {
                // 1. Find my own doc — try UID first (new workers), then email query (old workers)
                let docId: string | null = null;
                let d: any = null;

                const byUid = await getDoc(doc(db, "users", user.uid));
                if (byUid.exists()) {
                    docId = byUid.id;
                    d = byUid.data();
                } else if (currentUser?.email) {
                    const snap = await getDocs(
                        query(collection(db, "users"), where("email", "==", currentUser.email))
                    );
                    if (!snap.empty) {
                        docId = snap.docs[0].id;
                        d = snap.docs[0].data();
                    }
                }

                if (!docId || !d) {
                    toast.warning("Profil nije pronađen", "Kontaktiraj menadžera.");
                    setLoadingCoworkers(false);
                    return;
                }

                setMyDocId(docId);

                // Prefill vacation — fall back to flat field if nested total was wiped
                const vTotal = d.vacation?.total ?? d.vacationTotal ?? 0;
                setVacationTotal(vTotal);
                setVacationAllowedFrom(d.vacation?.allowedFrom || "");
                setVacationAllowedTo(d.vacation?.allowedTo || "");
                setVacationFrom(d.vacation?.from || "");
                setVacationTo(d.vacation?.to || "");
                setVacationNote(d.vacation?.note || "");

                // Prefill sick — same fallback
                const sTotal = d.sickDays?.total ?? d.sickDaysTotal ?? 0;
                setSickTotal(sTotal);
                setSickFrom(d.sickDays?.from || "");
                setSickTo(d.sickDays?.to || "");
                setSickNote(d.sickDays?.note || "");

                // Prefill replacement


                // 2. Load coworkers — same customer, worker role, not me
                if (d.customerId) {
                    setLoadingCoworkers(true);
                    const cwSnap = await getDocs(
                        query(
                            collection(db, "users"),
                            where("customerId", "==", d.customerId),
                            where("role", "==", "worker")
                        )
                    );
                    const list: WorkerOption[] = cwSnap.docs
                        .map(cw => ({ id: cw.id, ...(cw.data() as any) }))
                        .filter(w => w.email !== (d.email || currentUser?.email));
                    setCoworkers(list);
                }
                setLoadingCoworkers(false);

            } catch (err: any) {
                toast.error("Greška pri učitavanju", err?.message);
                setLoadingCoworkers(false);
            }
        };

        load();
    }, [user?.uid]);

    const submitRequest = async (type: "vacation" | "sickDays") => {
        if (!myDocId) {
            toast.error("Profil nije učitan", "Refresh stranicu pa pokušaj ponovo.");
            return;
        }

        const from  = type === "vacation" ? vacationFrom : sickFrom;
        const to    = type === "vacation" ? vacationTo   : sickTo;
        const note  = type === "vacation" ? vacationNote : sickNote;
        const total = type === "vacation" ? vacationTotal : sickTotal;

        if (!from || !to) {
            toast.warning("Nedostaju datumi", "Odaberi oba datuma.");
            return;
        }
        if (new Date(to) <= new Date(from)) {
            toast.warning("Neispravan period", "Datum završetka mora biti poslije početka.");
            return;
        }

        const days = daysBetween(from, to);

        if (total > 0 && days > total) {
            toast.error("Previše dana", `Odabrao si ${days} dana, a imaš samo ${total}.`);
            return;
        }
        if (type === "vacation") {
            if (vacationAllowedFrom && from < vacationAllowedFrom) {
                toast.error("Van dozvoljenog perioda", `Odmor ne može početi prije ${fmt(vacationAllowedFrom)}.`);
                return;
            }
            if (vacationAllowedTo && to > vacationAllowedTo) {
                toast.error("Van dozvoljenog perioda", `Odmor ne može završiti poslije ${fmt(vacationAllowedTo)}.`);
                return;
            }
        }

        setSaving(true);
        try {
            await addDoc(collection(db, "requests"), {
                workerId:    user!.uid,
                workerDocId: myDocId,
                workerName:  currentUser?.name || "",
                workerEmail: currentUser?.email || "",
                customerId:  currentUser?.customerId || "",
                type,
                from,
                to,
                days,
                note,
                total,
                status:      "pending",
                createdAt:   serverTimestamp(),
            });
            toast.success("Zahtjev poslan!", "Menadžer će pregledati tvoj zahtjev.");
        } catch (err: any) {
            toast.error("Greška", err?.message);
        } finally {
            setSaving(false);
        }
    };

    const handleReplacementDecision = async (req: any, decision: "approved" | "declined") => {
        setActingReplace(req.id);
        try {
            const { updateDoc: upd, writeBatch: wb, serverTimestamp: sts } = await import("firebase/firestore");
            const batch = wb(db);

            batch.update(doc(db, "requests", req.id), {
                replacementStatus: decision,
                // If replacement approved → move to manager queue; if declined → mark ended
                status: decision === "approved" ? "pending" : "replacement_declined",
            });
            await batch.commit();

            if (decision === "approved") {
                // Notify manager (via workerNotifications targeting manager — use customerId sentinel)
                await addDoc(collection(db, "workerNotifications"), {
                    workerId:   req.workerId, // notify the original worker too
                    customerId: req.customerId,
                    type:       "replacement_approved",
                    title:      `✅ Zamjena potvrđena`,
                    body:       `${currentUser?.name} je prihvatio/la zamjenu. Zahtjev je poslan menadžeru na odobrenje.`,
                    requestId:  req.id,
                    read:       false,
                    createdAt:  serverTimestamp(),
                });
                toast.success("Zamjena prihvaćena", "Zahtjev je proslijeđen menadžeru.");
            } else {
                // Notify the original worker that replacement declined
                await addDoc(collection(db, "workerNotifications"), {
                    workerId:   req.workerId,
                    customerId: req.customerId,
                    type:       "replacement_declined",
                    title:      `❌ Zamjena odbijena`,
                    body:       `${currentUser?.name} nije prihvatio/la zamjenu za tvoj zahtjev (${fmt(req.from)} – ${fmt(req.to)}).`,
                    requestId:  req.id,
                    read:       false,
                    createdAt:  serverTimestamp(),
                });
                toast.warning("Zamjena odbijena", "Originalni radnik je obaviješten.");
            }
        } catch (err: any) {
            toast.error("Greška", err?.message);
        } finally {
            setActingReplace(null);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100">
            <WorkerHeader />
            <ToastContainer toasts={toast.toasts} remove={toast.remove} />
            <div className="max-w-2xl mx-auto space-y-5 p-4">

                {/* Header */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                        <User size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black">{currentUser?.name || "Moj profil"}</h1>
                        <p className="text-slate-300 text-sm mt-0.5">{currentUser?.type} · {currentUser?.customerName}</p>
                    </div>
                </div>

                {/* Incoming replacement requests */}
                {replacementRequests.length > 0 && (
                    <div className="bg-violet-50 border border-violet-200 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center gap-2">
                            <Users size={18} className="text-violet-600" />
                            <h2 className="font-bold text-violet-800">Zahtjevi za zamjenu</h2>
                            <span className="ml-auto text-xs bg-violet-200 text-violet-800 font-bold px-2 py-0.5 rounded-full">{replacementRequests.length}</span>
                        </div>
                        {replacementRequests.map(req => (
                            <div key={req.id} className="bg-white rounded-xl border border-violet-200 p-4">
                                <p className="text-sm font-semibold text-slate-800">
                                    {req.workerName} traži te kao zamjenu
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    {req.type === "vacation" ? "Godišnji odmor" : "Bolovanje"} · {fmt(req.from)} – {fmt(req.to)} · {req.days} dana
                                </p>
                                {req.note && <p className="text-xs text-slate-400 italic mt-1">„{req.note}"</p>}
                                <div className="flex gap-2 mt-3">
                                    <button
                                        onClick={() => handleReplacementDecision(req, "approved")}
                                        disabled={actingReplace === req.id}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition disabled:opacity-50"
                                    >
                                        {actingReplace === req.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                                        Prihvati
                                    </button>
                                    <button
                                        onClick={() => handleReplacementDecision(req, "declined")}
                                        disabled={actingReplace === req.id}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition disabled:opacity-50"
                                    >
                                        <XCircle size={13} /> Odbij
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Vacation */}
                <Card icon={<Palmtree size={18} className="text-amber-500" />} title="Godišnji odmor">
                    <QuotaBar
                        total={vacationTotal}
                        selected={vacationFrom && vacationTo ? daysBetween(vacationFrom, vacationTo) : 0}
                        color="amber"
                        emptyMsg="Menadžer još nije dodijelio dane odmora."
                    />
                    {vacationAllowedFrom && vacationAllowedTo && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                            <CalendarDays size={13} />
                            Dozvoljeni period: <strong>{fmt(vacationAllowedFrom)} – {fmt(vacationAllowedTo)}</strong>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                            <label className={labelCls}>Od datuma</label>
                            <input type="date" value={vacationFrom}
                                min={vacationAllowedFrom || undefined}
                                max={vacationAllowedTo || undefined}
                                onChange={e => setVacationFrom(e.target.value)} className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Do datuma</label>
                            <input type="date" value={vacationTo}
                                min={vacationFrom || vacationAllowedFrom || undefined}
                                max={vacationAllowedTo || undefined}
                                onChange={e => setVacationTo(e.target.value)} className={inputCls} />
                        </div>
                    </div>
                    <DaySummary from={vacationFrom} to={vacationTo} total={vacationTotal} />
                    <div className="mt-3">
                        <label className={labelCls}>Napomena (opciono)</label>
                        <textarea value={vacationNote} onChange={e => setVacationNote(e.target.value)} rows={2}
                            placeholder="npr. porodični odmor..." className={inputCls + " resize-none"} />
                    </div>
                    <RequestStatus requests={myRequests} type="vacation" />
                    <button onClick={() => submitRequest("vacation")} disabled={saving}
                        className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition disabled:opacity-50"
                    >
                        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                        Pošalji novi zahtjev za odmor
                    </button>
                </Card>

                {/* Sick days */}
                {upcomingReplacements.length > 0 && (
                    <Card icon={<Users size={18} className="text-violet-500" />} title="Nadolazeće zamjene">
                        <div className="space-y-2">
                            {upcomingReplacements.map(r => (
                                <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl bg-violet-50 border border-violet-200">
                                    <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                                        <Users size={16} className="text-violet-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-violet-800">
                                            Ti si zamjena za {r.workerName}
                                        </p>
                                        <p className="text-xs text-violet-600">
                                            {r.shift && `${r.shift} · `}{r.date ? new Date(r.date).toLocaleDateString("bs-BA", { day: "2-digit", month: "2-digit", year: "numeric" }) : ""}
                                        </p>
                                    </div>
                                    <span className="ml-auto text-[10px] font-bold text-violet-500 bg-violet-100 px-2 py-1 rounded-full">Odobreno</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                <Card icon={<Thermometer size={18} className="text-red-500" />} title="Bolovanje">
                    <QuotaBar
                        total={sickTotal}
                        selected={sickFrom && sickTo ? daysBetween(sickFrom, sickTo) : 0}
                        color="red"
                        emptyMsg="Menadžer još nije dodijelio dane bolovanja."
                    />
                    <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                            <label className={labelCls}>Od datuma</label>
                            <input type="date" value={sickFrom} onChange={e => setSickFrom(e.target.value)} className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Do datuma</label>
                            <input type="date" value={sickTo} onChange={e => setSickTo(e.target.value)} className={inputCls} />
                        </div>
                    </div>
                    <DaySummary from={sickFrom} to={sickTo} total={sickTotal} />
                    <div className="mt-3">
                        <label className={labelCls}>Napomena (opciono)</label>
                        <textarea value={sickNote} onChange={e => setSickNote(e.target.value)} rows={2}
                            placeholder="npr. prehlada..." className={inputCls + " resize-none"} />
                    </div>
                    <RequestStatus requests={myRequests} type="sickDays" />
                    <button onClick={() => submitRequest("sickDays")} disabled={saving}
                        className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition disabled:opacity-50"
                    >
                        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                        Pošalji novi zahtjev za bolovanje
                    </button>
                </Card>

                {/* Replacement */}
                <Card icon={<Users size={18} className="text-violet-500" />} title="Zamjena smjene">
                    <p className="text-sm text-slate-500 mb-3">Klikni na kolegu da mu/joj pošalješ zahtjev za zamjenu smjene.</p>
                    {loadingCoworkers ? (
                        <div className="flex items-center gap-2 text-slate-400 text-sm py-3">
                            <Loader2 size={14} className="animate-spin" /> Učitavanje kolega...
                        </div>
                    ) : coworkers.length === 0 ? (
                        <p className="text-sm text-slate-400 py-3">Nema dostupnih kolega.</p>
                    ) : (
                        <div className="grid grid-cols-1 gap-2">
                            {coworkers.map(w => (
                                <button key={w.id} type="button" onClick={() => setReplaceModal(w)}
                                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-violet-300 hover:bg-violet-50 bg-white text-left transition group"
                                >
                                    <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-violet-100 flex items-center justify-center text-slate-600 font-bold text-sm flex-shrink-0 transition">
                                        {(w.name || "?").charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-slate-800 truncate">{w.name}</p>
                                        <p className="text-xs text-slate-500 truncate">{w.type}</p>
                                    </div>
                                    <span className="text-xs text-violet-500 font-semibold opacity-0 group-hover:opacity-100 transition">Pošalji zahtjev →</span>
                                </button>
                            ))}
                        </div>
                    )}
                </Card>

                {replaceModal && (
                    <ReplacementModal
                        worker={replaceModal}
                        me={{ uid: user!.uid, name: currentUser?.name || "", customerId: currentUser?.customerId || "" }}
                        onClose={() => setReplaceModal(null)}
                        onSent={() => { setReplaceModal(null); toast.success("Zahtjev poslan!", `${replaceModal.name} će dobiti obavijest.`); }}
                    />
                )}

            </div>
        </div>
    );
}

/* ── ReplacementModal ── */
const SHIFTS = ["1. smjena", "2. smjena", "3. smjena"];

function ReplacementModal({ worker, me, onClose, onSent }: {
    worker: WorkerOption;
    me: { uid: string; name: string; customerId: string };
    onClose: () => void;
    onSent: () => void;
}) {
    const [date,     setDate]     = useState("");
    const [shift,    setShift]    = useState("");
    const [note,     setNote]     = useState("");
    const [sending,  setSending]  = useState(false);
    const [error,    setError]    = useState("");

    const handleSend = async () => {
        if (!date)  { setError("Odaberi datum."); return; }
        if (!shift) { setError("Odaberi smjenu."); return; }
        setError("");
        setSending(true);
        try {
            await addDoc(collection(db, "workerNotifications"), {
                workerId:         worker.id,
                originalWorkerId: me.uid,
                originalName:     me.name,
                customerId:       me.customerId,
                type:             "replacement_request",
                title:            "Zahtjev za zamjenu smjene",
                body:             `${me.name} te traži da preuzmeš smjenu — ${shift}, ${new Date(date).toLocaleDateString("bs-BA", { day: "2-digit", month: "2-digit", year: "numeric" })}. Prihvataš li?`,
                date,
                shift,
                note,
                read:             false,
                createdAt:        serverTimestamp(),
            });
            onSent();
        } catch (err: any) {
            setError(err?.message || "Greška pri slanju.");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-5" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-700 font-black text-lg flex-shrink-0">
                        {(worker.name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="font-black text-slate-900">Zahtjev za zamjenu</h2>
                        <p className="text-sm text-slate-500 truncate">→ {worker.name}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition">
                        <XCircle size={18} />
                    </button>
                </div>

                {/* Date */}
                <div>
                    <label className={labelCls}>Datum smjene</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
                </div>

                {/* Shift selector */}
                <div>
                    <label className={labelCls}>Smjena</label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                        {SHIFTS.map(s => (
                            <button key={s} type="button" onClick={() => setShift(s)}
                                className={`py-2.5 rounded-xl text-sm font-bold border transition ${
                                    shift === s
                                        ? "bg-violet-600 border-violet-600 text-white"
                                        : "border-slate-200 text-slate-600 hover:border-violet-300 hover:bg-violet-50"
                                }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Note */}
                <div>
                    <label className={labelCls}>Napomena (opciono)</label>
                    <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
                        placeholder="npr. bolestan/na sam..." className={inputCls + " resize-none"} />
                </div>

                {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}

                <button onClick={handleSend} disabled={sending}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold transition disabled:opacity-50"
                >
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Pošalji zahtjev
                </button>
            </div>
        </div>
    );
}

/* ── RequestStatus ── */
function RequestStatus({ requests, type }: { requests: any[]; type: "vacation" | "sickDays" }) {
    const relevant = requests.filter(r => r.type === type);
    if (relevant.length === 0) return null;

    const latest = relevant[0];

    const cfgMap: Record<string, { icon: React.ReactNode; label: string; cls: string }> = {
        pending:               { icon: <Clock size={14} className="text-amber-600" />,     label: "Na čekanju — čeka odobrenje menadžera",   cls: "bg-amber-50 border-amber-200 text-amber-800" },
        awaiting_replacement:  { icon: <Clock size={14} className="text-violet-600" />,    label: "Čeka potvrdu zamjene od kolege",           cls: "bg-violet-50 border-violet-200 text-violet-800" },
        approved:              { icon: <CheckCircle size={14} className="text-emerald-600" />, label: "Odobreno",                              cls: "bg-emerald-50 border-emerald-200 text-emerald-800" },
        rejected:              { icon: <XCircle size={14} className="text-red-600" />,     label: "Odbijeno od menadžera",                   cls: "bg-red-50 border-red-200 text-red-800" },
        replacement_declined:  { icon: <XCircle size={14} className="text-red-600" />,     label: "Zamjena odbijena — odaberi drugu osobu",  cls: "bg-red-50 border-red-200 text-red-800" },
    };
    const cfg = cfgMap[latest.status] ?? { icon: null, label: latest.status, cls: "bg-slate-50 border-slate-200 text-slate-700" };

    return (
        <div className={`mt-4 flex items-start gap-2 rounded-xl border px-4 py-3 ${cfg.cls}`}>
            <span className="mt-0.5 flex-shrink-0">{cfg.icon}</span>
            <div className="text-xs leading-relaxed">
                <span className="font-bold">{cfg.label}</span>
                <span className="block text-[11px] opacity-70 mt-0.5">
                    {fmtDate(latest.from)} – {fmtDate(latest.to)} · {latest.days} dana
                    {latest.createdAt?.toDate ? ` · Poslano ${latest.createdAt.toDate().toLocaleDateString("bs-BA")}` : ""}
                </span>
            </div>
        </div>
    );
}

/* ── sub-components ── */

function QuotaBar({ total, selected, color, emptyMsg }: {
    total: number; selected: number; color: "amber" | "red"; emptyMsg: string;
}) {
    const bg   = color === "amber" ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200";
    const text = color === "amber" ? "text-amber-800" : "text-red-800";
    const bold = color === "amber" ? "text-amber-900" : "text-red-900";
    const track = color === "amber" ? "bg-amber-200" : "bg-red-200";
    const fill  = selected > total && total > 0 ? "bg-red-500" : color === "amber" ? "bg-amber-500" : "bg-red-400";
    const pct   = total > 0 ? Math.min(100, Math.round((selected / total) * 100)) : 0;

    return (
        <div className={`p-3 rounded-xl border ${bg}`}>
            <div className="flex items-center justify-between text-sm mb-2">
                <span className={`font-semibold ${text}`}>Dostupno</span>
                <span className={`font-black ${bold}`}>{total} dana</span>
            </div>
            <div className={`h-2 rounded-full overflow-hidden ${track}`}>
                <div className={`h-full rounded-full transition-all ${fill}`} style={{ width: `${pct}%` }} />
            </div>
            {total === 0 && <p className={`text-xs mt-1 ${text}`}>{emptyMsg}</p>}
        </div>
    );
}

function DaySummary({ from, to, total }: { from: string; to: string; total: number }) {
    if (!from || !to || new Date(to) <= new Date(from)) return null;
    const days = daysBetween(from, to);
    const remaining = total - days;
    const over = total > 0 && days > total;

    return (
        <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-sm rounded-xl px-4 py-2 border ${
            over ? "bg-red-50 border-red-200 text-red-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"
        }`}>
            <span><CalendarDays size={14} className="inline mr-1" />Odabrano: <strong>{days} dana</strong></span>
            {total > 0 && !over && <span>· Preostalo: <strong>{remaining} dana</strong></span>}
            {over && <span>· <strong>Premašuješ limit za {days - total} dana!</strong></span>}
        </div>
    );
}

/* ── helpers ── */
const labelCls = "block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1";
const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300";

function daysBetween(from: string, to: string) {
    return Math.max(0, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000));
}

function fmt(dateStr: string) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("bs-BA", { day: "2-digit", month: "2-digit", year: "numeric" });
}
const fmtDate = fmt;

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center gap-2 mb-4">{icon}<h2 className="font-bold text-slate-800">{title}</h2></div>
            {children}
        </div>
    );
}
