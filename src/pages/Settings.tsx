import { useState, useEffect, useRef } from "react";
import {
    Globe, Bell, Save, Building2, Users, Lock, CreditCard,
    AlertTriangle, Eye, EyeOff, Upload, Trash2,
    Download, LogOut, Check, X, Mail, Shield, Star,
} from "lucide-react";
import {
    collection, query, where, getDocs, doc, getDoc,
    updateDoc, setDoc, onSnapshot,
} from "firebase/firestore";
import {
    updatePassword, reauthenticateWithCredential,
    EmailAuthProvider, deleteUser,
} from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, auth, storage } from "../fb/firebase";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { DEFAULT_SCORING, type ScoringConfig } from "../hooks/useScoringConfig";
import toast from "react-hot-toast";

type Tab = "company" | "workers" | "password" | "notifications" | "scoring" | "billing" | "danger";

const TABS: { id: Tab; label: string; icon: any; color: string }[] = [
    { id: "company",       label: "Kompanija",      icon: Building2,    color: "blue"   },
    { id: "workers",       label: "Radnici",         icon: Users,        color: "emerald"},
    { id: "password",      label: "Lozinka",         icon: Lock,         color: "violet" },
    { id: "notifications", label: "Obavijesti",      icon: Bell,         color: "amber"  },
    { id: "scoring",       label: "Ocjenjivanje",    icon: Star,         color: "orange" },
    { id: "billing",       label: "Plan",            icon: CreditCard,   color: "indigo" },
    { id: "danger",        label: "Opasna zona",     icon: AlertTriangle,color: "red"    },
];

const DEFAULT_NOTIFS = [
    { key: "late_workers",     label: "Kasni radnici" },
    { key: "low_inventory",    label: "Niski inventar" },
    { key: "haccp_alerts",     label: "HACCP upozorenja" },
    { key: "anonymous_reports",label: "Anonimne prijave" },
    { key: "new_requests",     label: "Novi zahtjevi" },
    { key: "chat_messages",    label: "Chat poruke" },
];

export default function Settings() {
    const { t, language, setLanguage } = useLanguage();
    const { user, currentUser, logout } = useAuth();
    const [tab, setTab] = useState<Tab>("company");

    // ── Company ──────────────────────────────────────────────
    const [company, setCompany] = useState<any>({});
    const [companySaving, setCompanySaving] = useState(false);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string>("");
    const logoInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!currentUser?.customerId) return;
        getDoc(doc(db, "customers", currentUser.customerId)).then(snap => {
            if (snap.exists()) {
                const d = snap.data();
                setCompany(d);
                setLogoPreview(d.logoUrl || "");
            }
        });
    }, [currentUser?.customerId]);

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setLogoFile(f);
        setLogoPreview(URL.createObjectURL(f));
    };

    const saveCompany = async () => {
        if (!currentUser?.customerId) return;
        setCompanySaving(true);
        try {
            let logoUrl = company.logoUrl || "";
            if (logoFile) {
                const r = ref(storage, `logos/${currentUser.customerId}`);
                await uploadBytes(r, logoFile);
                logoUrl = await getDownloadURL(r);
            }
            await updateDoc(doc(db, "customers", currentUser.customerId), { ...company, logoUrl });
            setCompany((p: any) => ({ ...p, logoUrl }));
            setLogoFile(null);
            toast.success("Kompanija ažurirana");
        } catch {
            toast.error("Greška pri čuvanju");
        } finally {
            setCompanySaving(false);
        }
    };

    // ── Workers ───────────────────────────────────────────────
    const [workers, setWorkers] = useState<any[]>([]);
    const [workersLoading, setWorkersLoading] = useState(false);

    useEffect(() => {
        if (tab !== "workers" || !currentUser?.customerId) return;
        setWorkersLoading(true);
        const roles = currentUser.role === "manager" ? ["worker"] : ["manager", "worker"];
        const q = query(
            collection(db, "users"),
            where("customerId", "==", currentUser.customerId),
            where("role", "in", roles)
        );
        getDocs(q).then(snap => {
            setWorkers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setWorkersLoading(false);
        });
    }, [tab, currentUser?.customerId, currentUser?.role]);

    // ── Password ──────────────────────────────────────────────
    const [currentPw, setCurrentPw]   = useState("");
    const [newPw, setNewPw]           = useState("");
    const [confirmPw, setConfirmPw]   = useState("");
    const [showPw, setShowPw]         = useState(false);
    const [showNewPw, setShowNewPw]   = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);
    const [pwSaving, setPwSaving]     = useState(false);

    const changePassword = async () => {
        if (!user || newPw !== confirmPw) { toast.error("Lozinke se ne poklapaju"); return; }
        if (newPw.length < 6) { toast.error("Minimalno 6 karaktera"); return; }
        setPwSaving(true);
        try {
            const cred = EmailAuthProvider.credential(user.email!, currentPw);
            await reauthenticateWithCredential(user, cred);
            await updatePassword(user, newPw);
            setCurrentPw(""); setNewPw(""); setConfirmPw("");
            toast.success("Lozinka promijenjena");
        } catch (e: any) {
            toast.error(e.code === "auth/wrong-password" ? "Pogrešna trenutna lozinka" : "Greška pri promjeni lozinke");
        } finally {
            setPwSaving(false);
        }
    };

    // ── Notifications ─────────────────────────────────────────
    const [notifs, setNotifs] = useState<Record<string, boolean>>({});
    const [notifSaving, setNotifSaving] = useState(false);

    useEffect(() => {
        if (tab !== "notifications" || !currentUser?.customerId) return;
        const ref = doc(db, "settings", currentUser.customerId);
        getDoc(ref).then(snap => {
            if (snap.exists()) setNotifs(snap.data().notifications || {});
            else {
                const defaults: Record<string, boolean> = {};
                DEFAULT_NOTIFS.forEach(n => (defaults[n.key] = true));
                setNotifs(defaults);
            }
        });
    }, [tab, currentUser?.customerId]);

    const saveNotifs = async () => {
        if (!currentUser?.customerId) return;
        setNotifSaving(true);
        try {
            await setDoc(doc(db, "settings", currentUser.customerId), { notifications: notifs }, { merge: true });
            toast.success("Obavijesti sačuvane");
        } catch {
            toast.error("Greška");
        } finally {
            setNotifSaving(false);
        }
    };

    // ── Language ──────────────────────────────────────────────
    const languages = [
        { code: "bs", name: "Bosanski",  flag: "🇧🇦" },
        { code: "hr", name: "Hrvatski",  flag: "🇭🇷" },
        { code: "sr", name: "Srpski",    flag: "🇷🇸" },
        { code: "en", name: "English",   flag: "🇬🇧" },
        { code: "de", name: "Deutsch",   flag: "🇩🇪" },
    ];

    // ── Danger zone ───────────────────────────────────────────
    const [deleteConfirm, setDeleteConfirm] = useState("");
    const [deleting, setDeleting] = useState(false);

    const exportData = async () => {
        if (!currentUser?.customerId) return;
        const [custSnap, usersSnap] = await Promise.all([
            getDoc(doc(db, "customers", currentUser.customerId)),
            getDocs(query(collection(db, "users"), where("customerId", "==", currentUser.customerId))),
        ]);
        const data = {
            company: custSnap.data(),
            users: usersSnap.docs.map(d => d.data()),
            exportedAt: new Date().toISOString(),
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = "horeca-export.json"; a.click();
        URL.revokeObjectURL(url);
        toast.success("Podaci exportovani");
    };

    const deleteAccount = async () => {
        if (deleteConfirm !== "OBRIŠI" || !user) return;
        setDeleting(true);
        try {
            await deleteUser(user);
            toast.success("Nalog obrisan");
            logout();
        } catch (e: any) {
            if (e.code === "auth/requires-recent-login") {
                toast.error("Potrebna ponovna prijava radi sigurnosti");
            } else {
                toast.error("Greška pri brisanju");
            }
        } finally {
            setDeleting(false);
        }
    };

    // ── Scoring config ────────────────────────────────────────
    const [scoring, setScoring] = useState<ScoringConfig>(DEFAULT_SCORING);
    const [scoringSaving, setScoringSaving] = useState(false);

    useEffect(() => {
        if (tab !== "scoring" || !currentUser?.customerId) return;
        getDoc(doc(db, "settings", currentUser.customerId)).then(snap => {
            if (snap.exists() && snap.data().scoring) {
                setScoring({ ...DEFAULT_SCORING, ...snap.data().scoring });
            }
        });
    }, [tab, currentUser?.customerId]);

    const saveScoring = async () => {
        if (!currentUser?.customerId) return;
        setScoringSaving(true);
        try {
            await setDoc(doc(db, "settings", currentUser.customerId), { scoring }, { merge: true });
            toast.success("Postavke ocjenjivanja sačuvane");
        } catch {
            toast.error("Greška");
        } finally {
            setScoringSaving(false);
        }
    };

    const ScoreSlider = ({
        label, description, value, onChange, min, max, unit = "%", step = 1,
    }: { label: string; description: string; value: number; onChange: (v: number) => void; min: number; max: number; unit?: string; step?: number }) => {
        const pct = ((value - min) / (max - min)) * 100;
        return (
            <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold text-slate-700">{label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <input
                            type="number"
                            min={min} max={max} step={step}
                            value={value}
                            onChange={e => {
                                const v = Math.min(max, Math.max(min, Number(e.target.value)));
                                onChange(v);
                            }}
                            className="w-16 text-center font-bold text-slate-900 text-sm border border-slate-200 rounded-lg px-1 py-1 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                        />
                        <span className="text-sm text-slate-500 font-medium">{unit}</span>
                    </div>
                </div>
                <div className="relative h-6 flex items-center">
                    {/* Track background */}
                    <div className="absolute inset-x-0 h-2 rounded-full bg-slate-200" />
                    {/* Track fill */}
                    <div
                        className="absolute left-0 h-2 rounded-full bg-orange-500 transition-all"
                        style={{ width: `${pct}%` }}
                    />
                    {/* Thumb via range input (invisible but functional) */}
                    <input
                        type="range" min={min} max={max} step={step} value={value}
                        onChange={e => onChange(Number(e.target.value))}
                        className="absolute inset-x-0 w-full h-2 opacity-0 cursor-pointer"
                        style={{ zIndex: 10 }}
                    />
                    {/* Visual thumb */}
                    <div
                        className="absolute w-5 h-5 rounded-full bg-white border-2 border-orange-500 shadow-md transition-all pointer-events-none"
                        style={{ left: `calc(${pct}% - 10px)` }}
                    />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                    <span>{min}{unit}</span>
                    <span>{max}{unit}</span>
                </div>
            </div>
        );
    };

    const tabColor: Record<string, string> = {
        blue: "bg-blue-600", emerald: "bg-emerald-600", violet: "bg-violet-600",
        amber: "bg-amber-500", indigo: "bg-indigo-600", red: "bg-red-600", orange: "bg-orange-500",
    };

    const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
        <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
            {children}
        </div>
    );

    const Input = ({ value, onChange, placeholder, type = "text" }: any) => (
        <input
            type={type} value={value ?? ""} onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50"
        />
    );

    return (
        <div className="space-y-4 sm:space-y-6 max-w-5xl">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Postavke</h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">Upravljaj profilom kompanije, radnicima i sigurnosnim opcijama</p>
            </div>

            {/* Tab bar — horizontally scrollable on mobile */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap scrollbar-hide">
                {TABS.map(t => {
                    const Icon = t.icon;
                    const active = tab === t.id;
                    return (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-sm font-medium transition shrink-0 ${
                                active
                                    ? `${tabColor[t.color]} text-white shadow-md`
                                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{t.label}</span>
                            <span className="sm:hidden text-xs">{t.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* ── COMPANY ── */}
            {tab === "company" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-5 sm:space-y-6">
                    <h2 className="font-bold text-slate-800 text-lg">Profil kompanije</h2>

                    {/* Logo */}
                    <div className="flex items-center gap-5">
                        <div
                            onClick={() => logoInputRef.current?.click()}
                            className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden cursor-pointer hover:border-blue-400 transition bg-slate-50"
                        >
                            {logoPreview
                                ? <img src={logoPreview} className="w-full h-full object-cover" alt="Logo" />
                                : <Upload className="w-6 h-6 text-slate-400" />
                            }
                        </div>
                        <div>
                            <p className="font-semibold text-slate-700">Logo kompanije</p>
                            <p className="text-xs text-slate-400 mt-0.5">JPG, PNG — preporučeno 200×200px</p>
                            <button onClick={() => logoInputRef.current?.click()} className="mt-2 text-xs text-blue-600 font-medium hover:underline">
                                Promijeni sliku
                            </button>
                        </div>
                        <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Naziv objekta">
                            <Input value={company.customerName} onChange={(v: string) => setCompany((p: any) => ({ ...p, customerName: v }))} placeholder="Naziv..." />
                        </Field>
                        <Field label="Tip objekta">
                            <select
                                value={company.businessType || ""}
                                onChange={e => setCompany((p: any) => ({ ...p, businessType: e.target.value }))}
                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50"
                            >
                                {["Restaurant", "Hotel", "Cafe", "Bar", "Catering", "Hostel", "Resort", "Club", "Bakery", "Other"].map(t => (
                                    <option key={t}>{t}</option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Adresa">
                            <Input value={company.address} onChange={(v: string) => setCompany((p: any) => ({ ...p, address: v }))} placeholder="Ulica i broj..." />
                        </Field>
                        <Field label="Grad">
                            <Input value={company.city} onChange={(v: string) => setCompany((p: any) => ({ ...p, city: v }))} placeholder="Grad..." />
                        </Field>
                        <Field label="Država">
                            <Input value={company.country} onChange={(v: string) => setCompany((p: any) => ({ ...p, country: v }))} placeholder="Država..." />
                        </Field>
                        <Field label="Kapacitet (mjesta)">
                            <Input value={company.capacity} onChange={(v: string) => setCompany((p: any) => ({ ...p, capacity: v }))} placeholder="npr. 80" />
                        </Field>
                        <Field label="Telefon">
                            <Input value={company.phone} onChange={(v: string) => setCompany((p: any) => ({ ...p, phone: v }))} placeholder="+387..." />
                        </Field>
                        <Field label="Website">
                            <Input value={company.website} onChange={(v: string) => setCompany((p: any) => ({ ...p, website: v }))} placeholder="https://..." />
                        </Field>
                        <Field label="Ime kontakt osobe">
                            <Input value={company.contactFirstName} onChange={(v: string) => setCompany((p: any) => ({ ...p, contactFirstName: v }))} placeholder="Ime..." />
                        </Field>
                        <Field label="Prezime kontakt osobe">
                            <Input value={company.contactLastName} onChange={(v: string) => setCompany((p: any) => ({ ...p, contactLastName: v }))} placeholder="Prezime..." />
                        </Field>
                        <Field label="Napomene">
                            <textarea
                                value={company.notes || ""}
                                onChange={e => setCompany((p: any) => ({ ...p, notes: e.target.value }))}
                                rows={3}
                                placeholder="Interno..."
                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50 resize-none col-span-2"
                            />
                        </Field>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={saveCompany}
                            disabled={companySaving}
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition disabled:opacity-50"
                        >
                            {companySaving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                            Sačuvaj
                        </button>
                    </div>
                </div>
            )}

            {/* ── WORKERS ── */}
            {tab === "workers" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-bold text-slate-800 text-lg">Radnici i menadžeri</h2>
                        <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{workers.length} ukupno</span>
                    </div>

                    {workersLoading ? (
                        <div className="flex justify-center py-12">
                            <span className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : workers.length === 0 ? (
                        <p className="text-center text-slate-400 py-12">Nema radnika</p>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {workers.map(w => (
                                <div key={w.id} className="flex items-center gap-3 py-3">
                                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-600 shrink-0 text-sm">
                                        {(w.name || w.email || "?")[0].toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-800 truncate text-sm">{w.name || "—"}</p>
                                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                                w.role === "manager" || w.role === "MANAGER"
                                                    ? "bg-violet-100 text-violet-700"
                                                    : "bg-slate-100 text-slate-600"
                                            }`}>{w.role}</span>
                                            {w.type && (
                                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{w.type}</span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-400 truncate max-w-[100px] hidden sm:block">{w.email}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="pt-2 border-t border-slate-100">
                        <p className="text-xs text-slate-400">Za dodavanje novih radnika idi na stranicu <span className="font-semibold text-slate-600">Radnici → Dodaj radnika</span>.</p>
                    </div>
                </div>
            )}

            {/* ── PASSWORD ── */}
            {tab === "password" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-5 max-w-md">
                    <h2 className="font-bold text-slate-800 text-lg">Promjena lozinke</h2>

                    {(
                        [
                            { label: "Trenutna lozinka",    value: currentPw,  set: setCurrentPw,  show: showPw,        toggle: () => setShowPw(p => !p),        placeholder: "••••••••",        match: null },
                            { label: "Nova lozinka",        value: newPw,      set: setNewPw,      show: showNewPw,     toggle: () => setShowNewPw(p => !p),     placeholder: "Min. 6 karaktera", match: null },
                            { label: "Potvrdi lozinku",     value: confirmPw,  set: setConfirmPw,  show: showConfirmPw, toggle: () => setShowConfirmPw(p => !p), placeholder: "Ponovi lozinku",   match: confirmPw ? newPw === confirmPw : null },
                        ] as const
                    ).map(({ label, value, set, show, toggle, placeholder, match }) => (
                        <div key={label} className="space-y-1.5">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
                            <div className="relative">
                                <input
                                    key={`${label}-${show}`}
                                    type={show ? "text" : "password"}
                                    value={value}
                                    onChange={e => set(e.target.value)}
                                    placeholder={placeholder}
                                    autoComplete="off"
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-slate-50"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    {match !== null && (
                                        match
                                            ? <Check className="w-4 h-4 text-emerald-500" />
                                            : <X className="w-4 h-4 text-red-500" />
                                    )}
                                    <button
                                        type="button"
                                        onMouseDown={e => { e.preventDefault(); toggle(); }}
                                        className="text-slate-400 hover:text-slate-600 transition p-1"
                                    >
                                        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={changePassword}
                        disabled={pwSaving || !currentPw || !newPw || newPw !== confirmPw}
                        className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm transition disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                        {pwSaving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Lock className="w-4 h-4" />}
                        Promijeni lozinku
                    </button>
                </div>
            )}

            {/* ── NOTIFICATIONS ── */}
            {tab === "notifications" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-6 max-w-xl">
                    <h2 className="font-bold text-slate-800 text-lg">Obavijesti</h2>

                    <div className="space-y-3">
                        {DEFAULT_NOTIFS.map(n => (
                            <div key={n.key} className="flex items-center justify-between py-2">
                                <span className="text-sm font-medium text-slate-700">{n.label}</span>
                                <button
                                    onClick={() => setNotifs(p => ({ ...p, [n.key]: !p[n.key] }))}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${notifs[n.key] ? "bg-emerald-500" : "bg-slate-200"}`}
                                >
                                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${notifs[n.key] ? "translate-x-6" : "translate-x-0"}`} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                        <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Jezik interfejsa</p>
                        <div className="grid grid-cols-2 gap-2">
                            {languages.map(lang => (
                                <button
                                    key={lang.code}
                                    onClick={() => setLanguage(lang.code as any)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition ${
                                        language === lang.code ? "border-blue-500 bg-blue-50" : "border-slate-100 hover:border-slate-200 bg-slate-50"
                                    }`}
                                >
                                    <span className="text-xl">{lang.flag}</span>
                                    <span className={`text-sm font-medium ${language === lang.code ? "text-blue-800" : "text-slate-700"}`}>{lang.name}</span>
                                    {language === lang.code && <Check className="w-4 h-4 text-blue-600 ml-auto" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={saveNotifs}
                            disabled={notifSaving}
                            className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold text-sm transition disabled:opacity-50"
                        >
                            {notifSaving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                            Sačuvaj
                        </button>
                    </div>
                </div>
            )}

            {/* ── SCORING ── */}
            {tab === "scoring" && (
                <div className="space-y-4 max-w-xl">
                    {/* Test passing */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-5">
                        <div className="flex items-center gap-3 pb-1 border-b border-slate-100">
                            <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
                                <Star className="w-4 h-4 text-orange-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">Prolaznost testova</h3>
                                <p className="text-xs text-slate-400">Postoci koji određuju rezultat testa</p>
                            </div>
                        </div>

                        <ScoreSlider
                            label="Minimalni postotak za prolaz"
                            description="Radnik mora dostići ovaj postotak tačnih odgovora da bi položio test"
                            value={scoring.passPercent}
                            onChange={v => setScoring(p => ({ ...p, passPercent: v }))}
                            min={50} max={100}
                        />
                        <ScoreSlider
                            label="Prag za ocjenu 'Odlično'"
                            description="Postotak tačnih odgovora za najvišu ocjenu"
                            value={scoring.excellentThreshold}
                            onChange={v => setScoring(p => ({ ...p, excellentThreshold: v }))}
                            min={scoring.passPercent} max={100}
                        />
                        <ScoreSlider
                            label="Prag za ocjenu 'Dobro'"
                            description="Postotak između prolaza i odličnog"
                            value={scoring.goodThreshold}
                            onChange={v => setScoring(p => ({ ...p, goodThreshold: v }))}
                            min={scoring.passPercent} max={scoring.excellentThreshold}
                        />
                        <ScoreSlider
                            label="Čekanje između pokušaja"
                            description="Koliko sati mora proći prije ponovnog rješavanja testa"
                            value={scoring.testRetryHours}
                            onChange={v => setScoring(p => ({ ...p, testRetryHours: v }))}
                            min={1} max={168} unit="h"
                        />
                    </div>

                    {/* Shift scoring */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-5">
                        <div className="pb-1 border-b border-slate-100">
                            <h3 className="font-bold text-slate-800">Score smjene (checkliste)</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Pragovi za boju kartice score smjene</p>
                        </div>

                        <ScoreSlider
                            label="Zeleni prag (odlično)"
                            description="Postotak završenih stavki za zeleni indikator"
                            value={scoring.shiftScoreGreen}
                            onChange={v => setScoring(p => ({ ...p, shiftScoreGreen: v }))}
                            min={scoring.shiftScoreAmber + 1} max={100}
                        />
                        <ScoreSlider
                            label="Žuti prag (u redu)"
                            description="Postotak ispod kojeg se prikazuje crveni indikator"
                            value={scoring.shiftScoreAmber}
                            onChange={v => setScoring(p => ({ ...p, shiftScoreAmber: v }))}
                            min={10} max={scoring.shiftScoreGreen - 1}
                        />
                        <ScoreSlider
                            label="Minimalno vrijeme između popunjavanja checkliste"
                            description="Radnik ne može ponovo predati istu cheklistu prije nego istekne ovo vrijeme (0 = bez ograničenja)"
                            value={scoring.checklistMinIntervalMinutes}
                            onChange={v => setScoring(p => ({ ...p, checklistMinIntervalMinutes: v }))}
                            min={0} max={20} unit=" min" step={1}
                        />
                    </div>

                    {/* XP / Points */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-5">
                        <div className="pb-1 border-b border-slate-100">
                            <h3 className="font-bold text-slate-800">XP bodovi</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Bodovi koje radnici zarađuju rješavanjem testova</p>
                        </div>

                        <ScoreSlider
                            label="Bodovi po tačnom odgovoru"
                            description="XP bodova za svaki tačan odgovor"
                            value={scoring.pointsPerCorrect}
                            onChange={v => setScoring(p => ({ ...p, pointsPerCorrect: v }))}
                            min={1} max={50} unit=" XP"
                        />
                        <ScoreSlider
                            label="Bonus za odličan rezultat"
                            description={`Ekstra bodovi ako radnik postigne ${scoring.excellentThreshold}%+`}
                            value={scoring.bonusOnExcellent}
                            onChange={v => setScoring(p => ({ ...p, bonusOnExcellent: v }))}
                            min={0} max={200} unit=" XP"
                        />
                    </div>

                    {/* Live preview */}
                    <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 space-y-3">
                        <p className="text-sm font-bold text-orange-800">Pregled ocjena</p>
                        {[
                            { pct: 100, label: "100% tačnih" },
                            { pct: scoring.excellentThreshold, label: `${scoring.excellentThreshold}% tačnih` },
                            { pct: scoring.goodThreshold, label: `${scoring.goodThreshold}% tačnih` },
                            { pct: scoring.passPercent, label: `${scoring.passPercent}% tačnih (granica)` },
                            { pct: scoring.passPercent - 1, label: `${scoring.passPercent - 1}% tačnih` },
                        ].map(({ pct, label }) => {
                            const passed = pct >= scoring.passPercent;
                            const grade = pct >= scoring.excellentThreshold ? "Odlično" : pct >= scoring.goodThreshold ? "Dobro" : passed ? "Položio/la" : "Nije položio/la";
                            const xp = passed ? pct / 100 * scoring.pointsPerCorrect * 10 + (pct >= scoring.excellentThreshold ? scoring.bonusOnExcellent : 0) : 0;
                            return (
                                <div key={pct} className="flex items-center justify-between text-xs">
                                    <span className="text-slate-600">{label}</span>
                                    <div className="flex items-center gap-2">
                                        <span className={`font-semibold px-2 py-0.5 rounded-full ${
                                            grade === "Odlično" ? "bg-emerald-100 text-emerald-700" :
                                            grade === "Dobro"   ? "bg-blue-100 text-blue-700" :
                                            passed             ? "bg-amber-100 text-amber-700" :
                                                                 "bg-red-100 text-red-700"
                                        }`}>{grade}</span>
                                        {passed && <span className="text-orange-600 font-bold">+{Math.round(xp)} XP</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={saveScoring}
                            disabled={scoringSaving}
                            className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold text-sm transition disabled:opacity-50"
                        >
                            {scoringSaving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                            Sačuvaj
                        </button>
                    </div>
                </div>
            )}

            {/* ── BILLING ── */}
            {tab === "billing" && (
                <div className="space-y-4 max-w-xl">
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-4 sm:p-6 text-white">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-indigo-200 text-sm font-medium">Trenutni plan</p>
                                <h3 className="text-2xl font-bold mt-1">Smarter HoReCa Pro</h3>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <div className="flex items-end gap-1">
                            <span className="text-3xl font-bold">€49</span>
                            <span className="text-indigo-200 mb-1">/mjesec</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
                        <h3 className="font-bold text-slate-800">Uključeno u plan</h3>
                        {[
                            "Neograničeni radnici",
                            "Real-time chat",
                            "AI asistent Ana",
                            "Upravljanje inventarom",
                            "Checkliste i HACCP",
                            "Analitika i izvještaji",
                            "Obuke i testovi",
                            "Anonimne prijave",
                        ].map(f => (
                            <div key={f} className="flex items-center gap-3 text-sm text-slate-700">
                                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                {f}
                            </div>
                        ))}
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <h3 className="font-bold text-slate-800 mb-1">Sljedeća naplata</h3>
                        <p className="text-sm text-slate-500">Kontaktiraj podršku za upravljanje pretplatom.</p>
                        <a href="mailto:support@smart-horeca-ai.com" className="mt-3 inline-flex items-center gap-2 text-sm text-indigo-600 font-medium hover:underline">
                            <Mail className="w-4 h-4" /> support@smart-horeca-ai.com
                        </a>
                    </div>
                </div>
            )}

            {/* ── DANGER ZONE ── */}
            {tab === "danger" && (
                <div className="space-y-4 max-w-xl">
                    {/* Export */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h3 className="font-bold text-slate-800">Export podataka</h3>
                                <p className="text-sm text-slate-500 mt-1">Preuzmi sve podatke kompanije i radnika u JSON formatu.</p>
                            </div>
                            <button
                                onClick={exportData}
                                className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-semibold transition shrink-0"
                            >
                                <Download className="w-4 h-4" /> Export
                            </button>
                        </div>
                    </div>

                    {/* Logout */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h3 className="font-bold text-slate-800">Odjava</h3>
                                <p className="text-sm text-slate-500 mt-1">Odjavi se sa svog naloga na ovom uređaju.</p>
                            </div>
                            <button
                                onClick={logout}
                                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition shrink-0"
                            >
                                <LogOut className="w-4 h-4" /> Odjavi se
                            </button>
                        </div>
                    </div>

                    {/* Delete account */}
                    <div className="bg-white rounded-2xl border-2 border-red-200 shadow-sm p-4 sm:p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-red-700">Brisanje naloga</h3>
                                <p className="text-sm text-slate-500">Ova akcija je nepovratna.</p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-600">
                            Ukucaj <span className="font-mono font-bold text-red-600">OBRIŠI</span> da potvrdiš brisanje svog naloga. Podaci kompanije i radnici neće biti automatski obrisani.
                        </p>
                        <input
                            type="text"
                            value={deleteConfirm}
                            onChange={e => setDeleteConfirm(e.target.value)}
                            placeholder="Ukucaj OBRIŠI"
                            className="w-full rounded-xl border border-red-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-red-50"
                        />
                        <button
                            onClick={deleteAccount}
                            disabled={deleteConfirm !== "OBRIŠI" || deleting}
                            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition disabled:opacity-40 flex items-center justify-center gap-2"
                        >
                            {deleting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            Obriši nalog
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
