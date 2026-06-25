import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    ArrowLeft, Pencil, Mail, Phone, MapPin, ShieldCheck,
    Briefcase, GraduationCap, Star, Trash2,
    Clock, Power, Thermometer, Palmtree, Users, Save, X
} from "lucide-react";
import { httpsCallable } from "firebase/functions";
import { doc, updateDoc } from "firebase/firestore";
import { functions, db } from "../../fb/firebase";

export default function Worker() {
    const navigate = useNavigate();
    const location = useLocation();
    const [worker, setWorker] = useState<any>(location.state?.worker);
    const [showConfirm, setShowConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [saving, setSaving] = useState(false);

    // Inline edit state
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState<any>({});

    const handleBack = () => navigate("/app/workers");
    const handleEdit = () =>
        navigate(`/app/workers/edit/${encodeURIComponent(worker.id)}`, { state: { worker } });

    const startEdit = () => {
        setDraft({
            startWorkAt:         worker.startWorkAt || "",
            stopWorkAt:          worker.stopWorkAt || "",
            active:              worker.active !== false,
            sickDaysTotal:       worker.sickDays?.total ?? 0,
            sickDaysUsed:        worker.sickDays?.used ?? 0,
            sickDaysNote:        worker.sickDays?.note || "",
            vacationTotal:       worker.vacation?.total ?? 0,
            vacationUsed:        worker.vacation?.used ?? 0,
            vacationAllowedFrom: worker.vacation?.allowedFrom || "",
            vacationAllowedTo:   worker.vacation?.allowedTo || "",
            vacationNote:        worker.vacation?.note || "",
            replacementReplaces:    worker.replacement?.replaces || "",
            replacementReplacedBy:  worker.replacement?.replacedBy || "",
            replacementPeriod:      worker.replacement?.period || "",
            replacementNote:        worker.replacement?.note || "",
        });
        setEditing(true);
    };

    const cancelEdit = () => setEditing(false);

    const saveEdit = async () => {
        setSaving(true);
        try {
            const update = {
                startWorkAt: draft.startWorkAt,
                stopWorkAt:  draft.stopWorkAt,
                active:      draft.active,
                sickDays: {
                    total: Number(draft.sickDaysTotal),
                    used:  Number(draft.sickDaysUsed),
                    note:  draft.sickDaysNote,
                },
                vacation: {
                    total:        Number(draft.vacationTotal),
                    used:         Number(draft.vacationUsed),
                    allowedFrom:  draft.vacationAllowedFrom,
                    allowedTo:    draft.vacationAllowedTo,
                    note:         draft.vacationNote,
                },
                replacement: {
                    replaces:   draft.replacementReplaces,
                    replacedBy: draft.replacementReplacedBy,
                    period:     draft.replacementPeriod,
                    note:       draft.replacementNote,
                },
            };
            await updateDoc(doc(db, "users", worker.id), update);
            setWorker({ ...worker, ...update });
            setEditing(false);
        } catch (err: any) {
            alert(`Greška pri snimanju: ${err?.message}`);
        } finally {
            setSaving(false);
        }
    };

    const set = (key: string, val: any) => setDraft((d: any) => ({ ...d, [key]: val }));

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const deleteWorker = httpsCallable(functions, "deleteWorker");
            await deleteWorker({ email: worker.email ?? worker.id, uid: worker.uid ?? null });
            navigate("/app/workers");
        } catch (err: any) {
            alert(`Greška pri brisanju radnika: ${err?.message ?? err}`);
        } finally {
            setDeleting(false);
            setShowConfirm(false);
        }
    };

    if (!worker) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
                <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="text-5xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Worker Not Found</h2>
                    <p className="text-slate-500 mb-6">The worker data could not be loaded.</p>
                    <button onClick={handleBack} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 text-white hover:bg-slate-700 transition">
                        <ArrowLeft size={18} /> Nazad
                    </button>
                </div>
            </div>
        );
    }

    const fmt = (val: any) => val || "N/A";
    const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString("bs-BA", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

    return (
        <div className="min-h-screen bg-slate-100 p-6">

            {/* Delete confirm modal */}
            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
                        <h3 className="text-lg font-bold text-slate-900">Obriši radnika?</h3>
                        <p className="mt-2 text-slate-600 text-sm">
                            Da li ste sigurni da želite obrisati <span className="font-semibold">{worker.name}</span>? Ova akcija je nepovratna.
                        </p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={() => setShowConfirm(false)} disabled={deleting} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50">Otkaži</button>
                            <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
                                {deleting ? "Brisanje..." : "Obriši"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto space-y-6">

                {/* HEADER */}
                <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl p-8 text-white">
                    <div className="absolute top-0 right-0 opacity-10 text-[180px] font-black leading-none">{worker.name?.charAt(0)}</div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <img src={worker.photoURL || "/default-avatar.png"} alt={worker.name}
                                className="w-28 h-28 rounded-3xl object-cover border-4 border-white/20 shadow-lg" />
                            <div>
                                <h1 className="text-4xl font-black tracking-tight">{worker.name}</h1>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-sm">{worker.role}</span>
                                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-sm">{worker.type}</span>
                                    <span className={`px-3 py-1 rounded-full text-sm ${worker.active !== false ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}>
                                        {worker.active !== false ? "Aktivan" : "Neaktivan"}
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-sm ${worker.training ? "bg-blue-500/20 text-blue-300" : "bg-yellow-500/20 text-yellow-300"}`}>
                                        {worker.training ? "Trening završen" : "Trening u toku"}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <button onClick={handleBack} className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 transition backdrop-blur">
                                <ArrowLeft size={18} /> Nazad
                            </button>
                            <button onClick={handleEdit} className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 transition font-semibold shadow-lg">
                                <Pencil size={18} /> Uredi profil
                            </button>
                            <button onClick={() => setShowConfirm(true)} className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-500 transition font-semibold shadow-lg">
                                <Trash2 size={18} /> Obriši
                            </button>
                        </div>
                    </div>
                </div>

                {/* CONTACT INFO */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    <InfoCard icon={<Mail size={18} />}       label="Email"      value={fmt(worker.email)} />
                    <InfoCard icon={<Phone size={18} />}      label="Telefon"    value={fmt(worker.phone)} />
                    <InfoCard icon={<MapPin size={18} />}     label="Adresa"     value={fmt(worker.address)} />
                    <InfoCard icon={<Briefcase size={18} />}  label="Kompanija"  value={fmt(worker.customerName)} />
                    <InfoCard icon={<ShieldCheck size={18} />}label="Evaluacija" value={fmt(worker.evaluation)} />
                    <InfoCard icon={<Star size={18} />}       label="Worker ID"  value={fmt(worker.id)} />
                </div>

                {/* OPERATIONAL SECTION — inline editable */}
                <div className="bg-white rounded-3xl shadow-xl p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-800">Operativne informacije</h2>
                        {!editing ? (
                            <button onClick={startEdit} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm hover:bg-slate-700 transition">
                                <Pencil size={15} /> Uredi
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <button onClick={cancelEdit} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm hover:bg-slate-50">
                                    <X size={15} /> Otkaži
                                </button>
                                <button onClick={saveEdit} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm hover:bg-emerald-500 disabled:opacity-50">
                                    <Save size={15} /> {saving ? "Snimanje..." : "Sačuvaj"}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* RADNO VRIJEME + ACTIVE */}
                    <Section title="Zaposlenje" icon={<Clock size={16} className="text-blue-500" />}>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Field label="Datum zaposlenja" editing={editing}
                                display={worker.startWorkAt ? new Date(worker.startWorkAt).toLocaleDateString("bs") : "—"}
                                input={<input type="date" value={draft.startWorkAt} onChange={e => set("startWorkAt", e.target.value)} className={inputCls} />}
                            />
                            <Field label="Datum prestanka rada" editing={editing}
                                display={worker.stopWorkAt ? new Date(worker.stopWorkAt).toLocaleDateString("bs") : "—"}
                                input={<input type="date" value={draft.stopWorkAt} onChange={e => set("stopWorkAt", e.target.value)} className={inputCls} />}
                            />
                            <Field label="Status" editing={editing}
                                display={
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${worker.active !== false ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                                        <Power size={13} /> {worker.active !== false ? "Aktivan" : "Neaktivan"}
                                    </span>
                                }
                                input={
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <span className="text-sm text-slate-600">{draft.active ? "Aktivan" : "Neaktivan"}</span>
                                        <div className="relative" onClick={() => set("active", !draft.active)}>
                                            <div className={`w-12 h-6 rounded-full transition-colors ${draft.active ? "bg-emerald-500" : "bg-slate-300"}`}>
                                                <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-transform ${draft.active ? "translate-x-6" : "translate-x-0.5"}`} />
                                            </div>
                                        </div>
                                    </label>
                                }
                            />
                        </div>
                    </Section>

                    <div className="border-t border-slate-100 my-6" />

                    {/* BOLOVANJE */}
                    <Section title="Bolovanje" icon={<Thermometer size={16} className="text-red-500" />}>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Field label="Ukupno dana" editing={editing}
                                display={`${worker.sickDays?.total ?? 0} dana`}
                                input={<input type="number" min={0} value={draft.sickDaysTotal} onChange={e => set("sickDaysTotal", e.target.value)} className={inputCls} />}
                            />
                            <Field label="Iskorišteno" editing={editing}
                                display={`${worker.sickDays?.used ?? 0} dana`}
                                input={<input type="number" min={0} value={draft.sickDaysUsed} onChange={e => set("sickDaysUsed", e.target.value)} className={inputCls} />}
                            />
                            <Field label="Preostalo" editing={false}
                                display={`${(worker.sickDays?.total ?? 0) - (worker.sickDays?.used ?? 0)} dana`}
                                input={null}
                            />
                            <div className="sm:col-span-3">
                                <Field label="Napomena" editing={editing}
                                    display={worker.sickDays?.note || "—"}
                                    input={<textarea value={draft.sickDaysNote} onChange={e => set("sickDaysNote", e.target.value)} rows={2} className={inputCls + " resize-none"} />}
                                />
                            </div>
                        </div>
                    </Section>

                    <div className="border-t border-slate-100 my-6" />

                    {/* GODIŠNJI */}
                    <Section title="Godišnji odmor" icon={<Palmtree size={16} className="text-amber-500" />}>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Field label="Ukupno dana" editing={editing}
                                display={`${worker.vacation?.total ?? 0} dana`}
                                input={<input type="number" min={0} value={draft.vacationTotal} onChange={e => set("vacationTotal", e.target.value)} className={inputCls} />}
                            />
                            <Field label="Iskorišteno" editing={editing}
                                display={`${worker.vacation?.used ?? 0} dana`}
                                input={<input type="number" min={0} value={draft.vacationUsed} onChange={e => set("vacationUsed", e.target.value)} className={inputCls} />}
                            />
                            <Field label="Preostalo" editing={false}
                                display={`${(worker.vacation?.total ?? 0) - (worker.vacation?.used ?? 0)} dana`}
                                input={null}
                            />
                            <Field label="Dozvoljeno od" editing={editing}
                                display={fmtDate(worker.vacation?.allowedFrom || "")}
                                input={<input type="date" value={draft.vacationAllowedFrom} onChange={e => set("vacationAllowedFrom", e.target.value)} className={inputCls} />}
                            />
                            <Field label="Dozvoljeno do" editing={editing}
                                display={fmtDate(worker.vacation?.allowedTo || "")}
                                input={<input type="date" value={draft.vacationAllowedTo} onChange={e => set("vacationAllowedTo", e.target.value)} className={inputCls} />}
                            />
                            <div className="sm:col-span-3">
                                <Field label="Napomena" editing={editing}
                                    display={worker.vacation?.note || "—"}
                                    input={<textarea value={draft.vacationNote} onChange={e => set("vacationNote", e.target.value)} rows={2} className={inputCls + " resize-none"} />}
                                />
                            </div>
                        </div>
                    </Section>

                    <div className="border-t border-slate-100 my-6" />

                    {/* ZAMJENA */}
                    <Section title="Zamjena" icon={<Users size={16} className="text-violet-500" />}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Zamjenjuje" editing={editing}
                                display={worker.replacement?.replaces || "—"}
                                input={<input type="text" value={draft.replacementReplaces} onChange={e => set("replacementReplaces", e.target.value)} placeholder="Ime radnika" className={inputCls} />}
                            />
                            <Field label="Zamjenjuje ga/je" editing={editing}
                                display={worker.replacement?.replacedBy || "—"}
                                input={<input type="text" value={draft.replacementReplacedBy} onChange={e => set("replacementReplacedBy", e.target.value)} placeholder="Ime radnika" className={inputCls} />}
                            />
                            <Field label="Period" editing={editing}
                                display={worker.replacement?.period || "—"}
                                input={<input type="text" value={draft.replacementPeriod} onChange={e => set("replacementPeriod", e.target.value)} placeholder="npr. 01.07 – 15.07" className={inputCls} />}
                            />
                            <Field label="Napomena" editing={editing}
                                display={worker.replacement?.note || "—"}
                                input={<textarea value={draft.replacementNote} onChange={e => set("replacementNote", e.target.value)} rows={2} className={inputCls + " resize-none"} />}
                            />
                        </div>
                    </Section>
                </div>

                {/* TRAINING */}
                <div className="bg-white rounded-3xl shadow-xl p-8">
                    <h2 className="text-xl font-bold text-slate-800 mb-5 flex items-center gap-2">
                        <GraduationCap size={20} className="text-violet-500" /> Trening pregled
                    </h2>
                    <div className="flex justify-between text-sm font-medium mb-2">
                        <span className="text-slate-500">Završenost</span>
                        <span className="text-slate-800 font-bold">{worker.trainingScore || 0}%</span>
                    </div>
                    <div className="h-4 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
                            style={{ width: `${worker.trainingScore || 0}%` }} />
                    </div>
                    <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold ${worker.training ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {worker.training ? "✔ Trening završen" : "✖ Trening nije završen"}
                    </div>
                    <div className="mt-4 text-sm text-slate-500">
                        Kreiran: <span className="font-semibold text-slate-700">
                            {worker.createdAt?.seconds ? new Date(worker.createdAt.seconds * 1000).toLocaleDateString("bs") : "N/A"}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* --- shared style --- */
const inputCls = "w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300";

/* --- sub-components --- */

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div>
            <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5 mb-4">{icon}{title}</h3>
            {children}
        </div>
    );
}

function Field({ label, editing, display, input }: { label: string; editing: boolean; display: React.ReactNode; input: React.ReactNode }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</label>
            {editing && input ? input : <div className="text-sm font-semibold text-slate-800">{display}</div>}
        </div>
    );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="bg-white rounded-3xl shadow-lg p-5 hover:shadow-2xl transition-all duration-300 border border-slate-100">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700">{icon}</div>
                <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
            </div>
            <p className="text-lg font-bold text-slate-800 break-words">{value}</p>
        </div>
    );
}
