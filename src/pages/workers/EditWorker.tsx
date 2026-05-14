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
import { XCircle } from "lucide-react";

interface FormValues {
    name: string;
    email: string;
    role: string;
    type: string;
    phone: string;
    address: string;
}

export default function EditWorker() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [worker, setWorker] = useState<any>(location.state?.worker || null);

    const [loading, setLoading] = useState(!worker);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // @ts-ignore
    const [uploading, setUploading] = useState(false);
    const [photoURL, setPhotoURL] = useState(worker?.photoURL || "");

    // ✅ DELETE MODAL STATE
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [form, setForm] = useState<FormValues>({
        name: "",
        email: "",
        role: "",
        type: "",
        phone: "",
        address: "",
    });

    const handlePhotoUpload = async (
        file: File,
        workerId: string,
        customerId: string
    ) => {
        if (!file) return null;

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
                        let workerData = {
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
            });
        }
    }, [worker]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    // SAVE
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

            await updateDoc(doc(db, "users", worker.id), {
                ...form,
                customerId: worker.customerId,
                customerName: worker.customerName,
                createdAt: worker.createdAt,
                isAdmin: worker.isAdmin || false,
                photoURL: uploadedPhotoURL,
            });

            navigate(`/app/workers/${encodeURIComponent(worker.id)}`, {
                state: {
                    worker: { ...worker, ...form, photoURL: uploadedPhotoURL },
                },
            });

        } catch (err: any) {
            setError(err.message || "Error updating user");
        } finally {
            setSaving(false);
        }
    };

    // DELETE
    const confirmDelete = async () => {
        if (!worker) return;

        setDeleting(true);
        console.log("Deleting worker:", worker.id);
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

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !worker) return;

        const file = e.target.files[0];
        setSelectedFile(file);

        setUploading(true);

        try {
            const url = await handlePhotoUpload(file, worker.id, worker.customerId);
            setPhotoURL(url);
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <p className="p-8">Loading worker data...</p>;
    if (error) return <p className="p-8 text-red-500">{error}</p>;

    return (
        <div className="p-8">

            {/* HEADER */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-slate-900">
                    {worker.name || worker.email}
                </h1>

                <div className="flex gap-2">
                    <button
                        onClick={() => navigate("/app/workers")}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        ← Back
                    </button>

                    {/* DELETE BUTTON */}
                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                        Delete
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                    >
                        {saving ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>

            {/* FORM (UNCHANGED) */}
            <div className="bg-white p-6 rounded-lg shadow space-y-4 max-w-xl">

                {photoURL && (
                    <img
                        src={photoURL}
                        className="w-32 h-32 rounded-full object-cover"
                    />
                )}

                <input type="file" onChange={handlePhotoChange} />

                <input name="name" value={form.name} onChange={handleChange} />
                <input name="email" value={form.email} onChange={handleChange} />
                <input name="type" value={form.type} onChange={handleChange} />
                <input name="phone" value={form.phone} onChange={handleChange} />
                <input name="address" value={form.address} onChange={handleChange} />
            </div>

            {/* ================= DELETE MODAL ================= */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">

                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">

                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                <XCircle className="text-red-600" />
                            </div>

                            <div>
                                <h2 className="text-xl font-bold">
                                    Delete Worker
                                </h2>
                                <p className="text-sm text-slate-500">
                                    This action cannot be undone
                                </p>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-lg mb-6">
                            <p className="text-sm text-slate-600">
                                Are you sure you want to delete:
                            </p>
                            <p className="font-semibold">
                                {worker.name || worker.email}
                            </p>
                        </div>

                        <div className="flex justify-end gap-3">

                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 border rounded-lg"
                                disabled={deleting}
                            >
                                Cancel
                            </button>

                            <button
                                onClick={confirmDelete}
                                disabled={deleting}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg"
                            >
                                {deleting ? "Deleting..." : "Delete"}
                            </button>

                        </div>

                    </div>

                </div>
            )}
        </div>
    );
}