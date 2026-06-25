import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
    doc,
    getDoc,
    updateDoc,
    deleteDoc,
} from "firebase/firestore";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { db, storage } from "../../fb/firebase";

import {
    ArrowLeft, Save, Trash2, Upload, Loader2,
    User, Mail, Phone, MapPin, Briefcase, XCircle,
    Clock, Power, Thermometer, Palmtree, Users
} from "lucide-react";

interface FormValues {
    name: string;
    email: string;
    role: string;
    type: string;
    phone: string;
    address: string;
    startWorkAt: string;
    stopWorkAt: string;
    active: boolean;
    sickDaysTotal: number;
    sickDaysUsed: number;
    sickDaysNote: string;
    vacationTotal: number;
    vacationUsed: number;
    vacationNote: string;
    replacementReplaces: string;
    replacementReplacedBy: string;
    replacementPeriod: string;
    replacementNote: string;
}

export default function EditWorker() {

    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const [worker, setWorker] = useState<any>(
        location.state?.worker || null
    );

    const [loading, setLoading] = useState(!worker);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [error, setError] = useState<string | null>(null);

    const [photoURL, setPhotoURL] = useState(worker?.photoURL || "");

    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [form, setForm] = useState<FormValues>({
        name: "",
        email: "",
        role: "",
        type: "",
        phone: "",
        address: "",
        startWorkAt: "",
        stopWorkAt: "",
        active: true,
        sickDaysTotal: 0,
        sickDaysUsed: 0,
        sickDaysNote: "",
        vacationTotal: 0,
        vacationUsed: 0,
        vacationNote: "",
        replacementReplaces: "",
        replacementReplacedBy: "",
        replacementPeriod: "",
        replacementNote: "",
    });

    const handlePhotoUpload = async (
        file: File,
        workerId: string,
        customerId: string
    ) => {

        const storageRef = ref(
            storage,
            `customers/${customerId}/workers/${workerId}/${file.name}`
        );

        await uploadBytes(storageRef, file);

        return await getDownloadURL(storageRef);
    };

    useEffect(() => {

        if (!worker && id) {

            const fetchWorker = async () => {

                setLoading(true);

                try {

                    const docRef = doc(db, "users", id);

                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {

                        const workerData = {
                            id: docSnap.id,
                            ...docSnap.data(),
                        };

                        setWorker(workerData);

                        // @ts-ignore
                        setPhotoURL(workerData.photoURL || "");

                    } else {
                        setError("Worker not found");
                    }

                } catch (err: any) {
                    setError(err.message);
                }

                setLoading(false);
            };

            fetchWorker();
        }

    }, [id, worker]);

    useEffect(() => {

        if (worker) {
            setForm({
                name: worker.name || "",
                email: worker.email || "",
                role: worker.role || "",
                type: worker.type || "",
                phone: worker.phone || "",
                address: worker.address || "",
                startWorkAt: worker.startWorkAt || "",
                stopWorkAt: worker.stopWorkAt || "",
                active: worker.active !== false,
                sickDaysTotal: worker.sickDays?.total ?? 0,
                sickDaysUsed: worker.sickDays?.used ?? 0,
                sickDaysNote: worker.sickDays?.note || "",
                vacationTotal: worker.vacation?.total ?? 0,
                vacationUsed: worker.vacation?.used ?? 0,
                vacationNote: worker.vacation?.note || "",
                replacementReplaces: worker.replacement?.replaces || "",
                replacementReplacedBy: worker.replacement?.replacedBy || "",
                replacementPeriod: worker.replacement?.period || "",
                replacementNote: worker.replacement?.note || "",
            });
        }

    }, [worker]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value, type } = e.target;
        setForm({
            ...form,
            [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked
                   : type === "number"  ? Number(value)
                   : value
        });
    };

    const handleSave = async () => {

        if (!worker) return;

        setSaving(true);
        setError(null);

        try {

            let uploadedPhotoURL = worker.photoURL || null;

            if (selectedFile) {

                uploadedPhotoURL = await handlePhotoUpload(
                    selectedFile,
                    worker.id,
                    worker.customerId
                );
            }

            const { sickDaysTotal, sickDaysUsed, sickDaysNote,
                    vacationTotal, vacationUsed, vacationNote,
                    replacementReplaces, replacementReplacedBy, replacementPeriod, replacementNote,
                    startWorkAt, stopWorkAt, active,
                    ...baseForm } = form;

            await updateDoc(doc(db, "users", worker.id), {
                ...baseForm,
                startWorkAt,
                stopWorkAt,
                active,
                sickDays: { total: sickDaysTotal, used: sickDaysUsed, note: sickDaysNote },
                vacation:  { total: vacationTotal,  used: vacationUsed,  note: vacationNote  },
                replacement: {
                    replaces:    replacementReplaces,
                    replacedBy:  replacementReplacedBy,
                    period:      replacementPeriod,
                    note:        replacementNote,
                },
                customerId:   worker.customerId,
                customerName: worker.customerName,
                createdAt:    worker.createdAt,
                isAdmin:      worker.isAdmin || false,
                photoURL:     uploadedPhotoURL,
            });

            navigate(`/app/workers/${encodeURIComponent(worker.id)}`, {
                state: {
                    worker: {
                        ...worker,
                        ...form,
                        photoURL: uploadedPhotoURL
                    }
                }
            });

        } catch (err: any) {

            setError(err.message || "Error updating worker");

        } finally {

            setSaving(false);
        }
    };

    const confirmDelete = async () => {

        if (!worker) return;

        setDeleting(true);

        try {

            await deleteDoc(doc(db, "users", worker.id));

            navigate("/app/workers");

        } catch (err: any) {

            setError(err.message || "Error deleting worker");

        } finally {

            setDeleting(false);
            setShowDeleteModal(false);
        }
    };

    const handlePhotoChange = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {

        if (!e.target.files || !worker) return;

        const file = e.target.files[0];

        setSelectedFile(file);

        setUploading(true);

        try {

            const url = await handlePhotoUpload(
                file,
                worker.id,
                worker.customerId
            );

            setPhotoURL(url);

        } finally {

            setUploading(false);
        }
    };

    if (loading) {

        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center">
                <div className="flex items-center gap-3 text-slate-700">
                    <Loader2 className="animate-spin" />
                    Loading worker...
                </div>
            </div>
        );
    }

    if (error) {

        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">

                <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">

                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                        <XCircle className="text-red-600" size={32} />
                    </div>

                    <h2 className="text-2xl font-bold text-slate-800 mb-2">
                        Something went wrong
                    </h2>

                    <p className="text-slate-500 mb-6">
                        {error}
                    </p>

                    <button
                        onClick={() => navigate("/app/workers")}
                        className="px-5 py-3 rounded-2xl bg-slate-900 text-white hover:bg-slate-700 transition"
                    >
                        Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 p-6">

            <div className="max-w-5xl mx-auto space-y-6">

                {/* HEADER */}
                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl p-8 text-white relative overflow-hidden">

                    <div className="absolute right-0 top-0 opacity-10 text-[180px] font-black leading-none">
                        {form.name?.charAt(0)}
                    </div>

                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

                        <div className="flex items-center gap-5">

                            <div className="relative">

                                <img
                                    src={photoURL || "/default-avatar.png"}
                                    alt={form.name}
                                    className="w-28 h-28 rounded-3xl object-cover border-4 border-white/20 shadow-xl"
                                />

                                {uploading && (
                                    <div className="absolute inset-0 bg-black/60 rounded-3xl flex items-center justify-center">
                                        <Loader2 className="animate-spin text-white" />
                                    </div>
                                )}
                            </div>

                            <div>
                                <h1 className="text-4xl font-black">
                                    Edit Worker
                                </h1>

                                <p className="text-slate-300 mt-2">
                                    Update worker information and settings
                                </p>
                            </div>
                        </div>

                        {/* ACTIONS */}
                        <div className="flex flex-wrap gap-3">

                            <button
                                onClick={() => navigate("/app/workers")}
                                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 transition"
                            >
                                <ArrowLeft size={18} />
                                Back
                            </button>

                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-red-500 hover:bg-red-400 transition"
                            >
                                <Trash2 size={18} />
                                Delete
                            </button>

                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 transition font-semibold disabled:opacity-50"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* FORM */}
                <div className="bg-white rounded-3xl shadow-xl p-8">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* PHOTO */}
                        <div className="md:col-span-2">

                            <label className="block text-sm font-semibold text-slate-600 mb-3">
                                Profile Photo
                            </label>

                            <label className="flex items-center justify-center gap-3 border-2 border-dashed border-slate-300 rounded-3xl p-6 cursor-pointer hover:border-slate-500 transition bg-slate-50">

                                <Upload size={20} className="text-slate-500" />

                                <span className="font-medium text-slate-600">
                                    Upload New Photo
                                </span>

                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={handlePhotoChange}
                                />
                            </label>
                        </div>

                        <InputField
                            icon={<User size={18} />}
                            label="Full Name"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                        />

                        <InputField
                            icon={<Mail size={18} />}
                            label="Email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                        />

                        <InputField
                            icon={<Briefcase size={18} />}
                            label="Role"
                            name="role"
                            value={form.role}
                            onChange={handleChange}
                        />

                        <InputField
                            icon={<Briefcase size={18} />}
                            label="Type"
                            name="type"
                            value={form.type}
                            onChange={handleChange}
                        />

                        <InputField
                            icon={<Phone size={18} />}
                            label="Phone"
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                        />

                        <InputField
                            icon={<MapPin size={18} />}
                            label="Address"
                            name="address"
                            value={form.address}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                {/* RADNO VRIJEME I STATUS */}
                <div className="bg-white rounded-3xl shadow-xl p-8">
                    <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
                        <Clock size={18} className="text-blue-500" /> Zaposlenje i status
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <InputField icon={<Clock size={18} />} label="Datum zaposlenja" name="startWorkAt" value={form.startWorkAt} onChange={handleChange} type="date" />
                        <InputField icon={<Clock size={18} />} label="Datum prestanka rada" name="stopWorkAt" value={form.stopWorkAt} onChange={handleChange} type="date" />
                        <div>
                            <label className="block text-sm font-semibold text-slate-600 mb-2">Status</label>
                            <label className="flex items-center gap-3 cursor-pointer p-4 rounded-2xl border border-slate-300 bg-slate-50 hover:bg-slate-100 transition">
                                <Power size={18} className={form.active ? "text-emerald-500" : "text-slate-400"} />
                                <span className="font-medium text-slate-700">{form.active ? "Aktivan" : "Neaktivan"}</span>
                                <div className="ml-auto relative">
                                    <input type="checkbox" name="active" checked={form.active} onChange={handleChange} className="sr-only" />
                                    <div className={`w-12 h-6 rounded-full transition-colors ${form.active ? "bg-emerald-500" : "bg-slate-300"}`}>
                                        <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-transform ${form.active ? "translate-x-6" : "translate-x-0.5"}`} />
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* BOLOVANJE */}
                <div className="bg-white rounded-3xl shadow-xl p-8">
                    <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
                        <Thermometer size={18} className="text-red-500" /> Bolovanje
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <InputField icon={<Thermometer size={18} />} label="Ukupno dana" name="sickDaysTotal" value={String(form.sickDaysTotal)} onChange={handleChange} type="number" />
                        <InputField icon={<Thermometer size={18} />} label="Iskorišteno" name="sickDaysUsed" value={String(form.sickDaysUsed)} onChange={handleChange} type="number" />
                        <div>
                            <label className="block text-sm font-semibold text-slate-600 mb-2">Napomena</label>
                            <textarea name="sickDaysNote" value={form.sickDaysNote} onChange={handleChange} rows={2}
                                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-slate-200 resize-none" />
                        </div>
                    </div>
                </div>

                {/* GODIŠNJI ODMOR */}
                <div className="bg-white rounded-3xl shadow-xl p-8">
                    <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
                        <Palmtree size={18} className="text-amber-500" /> Godišnji odmor
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <InputField icon={<Palmtree size={18} />} label="Ukupno dana" name="vacationTotal" value={String(form.vacationTotal)} onChange={handleChange} type="number" />
                        <InputField icon={<Palmtree size={18} />} label="Iskorišteno" name="vacationUsed" value={String(form.vacationUsed)} onChange={handleChange} type="number" />
                        <div>
                            <label className="block text-sm font-semibold text-slate-600 mb-2">Napomena</label>
                            <textarea name="vacationNote" value={form.vacationNote} onChange={handleChange} rows={2}
                                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-slate-200 resize-none" />
                        </div>
                    </div>
                </div>

                {/* ZAMJENA */}
                <div className="bg-white rounded-3xl shadow-xl p-8">
                    <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
                        <Users size={18} className="text-violet-500" /> Zamjena
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField icon={<Users size={18} />} label="Zamjenjuje (ime radnika)" name="replacementReplaces" value={form.replacementReplaces} onChange={handleChange} />
                        <InputField icon={<Users size={18} />} label="Zamjenjuje ga/je (ime radnika)" name="replacementReplacedBy" value={form.replacementReplacedBy} onChange={handleChange} />
                        <InputField icon={<Clock size={18} />} label="Period zamjene (npr. 01.07 - 15.07)" name="replacementPeriod" value={form.replacementPeriod} onChange={handleChange} />
                        <div>
                            <label className="block text-sm font-semibold text-slate-600 mb-2">Napomena</label>
                            <textarea name="replacementNote" value={form.replacementNote} onChange={handleChange} rows={2}
                                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-slate-200 resize-none" />
                        </div>
                    </div>
                </div>
            </div>

            {/* DELETE MODAL */}
            {showDeleteModal && (

                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">

                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

                        <div className="p-8">

                            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-5">
                                <Trash2 className="text-red-600" size={30} />
                            </div>

                            <h2 className="text-3xl font-black text-slate-900 mb-2">
                                Delete Worker
                            </h2>

                            <p className="text-slate-500 mb-6">
                                This action cannot be undone.
                            </p>

                            <div className="bg-slate-100 rounded-2xl p-4 mb-8">
                                <p className="text-sm text-slate-500 mb-1">
                                    Worker
                                </p>

                                <p className="font-bold text-slate-800">
                                    {worker.name || worker.email}
                                </p>
                            </div>

                            <div className="flex justify-end gap-3">

                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    disabled={deleting}
                                    className="px-5 py-3 rounded-2xl border border-slate-300 hover:bg-slate-100 transition"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={confirmDelete}
                                    disabled={deleting}
                                    className="px-5 py-3 rounded-2xl bg-red-600 text-white hover:bg-red-500 transition disabled:opacity-50 flex items-center gap-2"
                                >
                                    {deleting ? (
                                        <>
                                            <Loader2 className="animate-spin" size={18} />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 size={18} />
                                            Delete Worker
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* INPUT FIELD */
function InputField({ icon, label, name, value, onChange, type = "text" }: any) {
    return (
        <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">{label}</label>
            <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>
                <input
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-300 bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200 focus:border-slate-500 transition"
                />
            </div>
        </div>
    );
}