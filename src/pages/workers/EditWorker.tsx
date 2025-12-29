import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { doc, getDoc, updateDoc, DocumentReference } from "firebase/firestore";
import { db } from "../../fb/firebase";

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

    const [worker, setWorker] = useState<any>(location.state?.worker || null);
    const [loading, setLoading] = useState(!worker);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState<FormValues>({
        name: "",
        email: "",
        role: "",
        type: "",
        phone: "",
        address: "",
    });

    // Fetch worker from Firestore if state is missing
    useEffect(() => {
        if (!worker && id) {
            const fetchWorker = async () => {
                setLoading(true);
                try {
                    const docRef = doc(db, "users", encodeURIComponent(id));
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        let workerData = docSnap.data();

                        // Resolve customer reference if it exists
                        if (workerData.customerId && workerData.customerId instanceof DocumentReference) {
                            const customerSnap = await getDoc(workerData.customerId);
                            if (customerSnap.exists()) {
                                workerData.customerName = customerSnap.data().name;
                                workerData.customerId = customerSnap.id;
                            }
                        }

                        setWorker(workerData);
                    } else {
                        setError("Worker not found");
                    }
                } catch (err: any) {
                    console.error("Error fetching worker:", err);
                    setError(err.message);
                }
                setLoading(false);
            };
            fetchWorker();
        }
    }, [id, worker]);

    // Initialize form when worker is available
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

    const handleSave = async () => {
        if (!worker) return;
        setSaving(true);
        setError(null);

        try {
            const docRef = doc(db, "users", worker.id);
            console.log(worker.id)
            await updateDoc(docRef, {
                ...form,
                customerId: worker.customerId,
                customerName: worker.customerName,
                createdAt: worker.createdAt,
                isAdmin: worker.isAdmin || false,
            });

            navigate(`/app/workers/${encodeURIComponent(worker.id)}`, {
                state: { worker: { ...worker, ...form } },
            });
        } catch (err: any) {
            console.error("Error updating user:", err);
            setError(err.message || "Error updating user");
        } finally {
            setSaving(false);
        }
    };

    const handleBack = () => {
        navigate("/app/home");
    };

    if (loading) return <p className="p-8">Loading worker data...</p>;
    if (error) return <p className="p-8 text-red-500">{error}</p>;

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-slate-900">{worker.name}</h1>
                <div className="flex gap-2">
                    <button
                        onClick={handleBack}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        ← Back to Dashboard
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

            {/* Form */}
            <div className="bg-white p-6 rounded-lg shadow space-y-4 max-w-xl">
                <div>
                    <label className="block font-medium mb-1">Name</label>
                    <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        className="w-full border rounded px-3 py-2"
                    />
                </div>

                <div>
                    <label className="block font-medium mb-1">Email</label>
                    <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        className="w-full border rounded px-3 py-2"
                    />
                </div>

                <div>
                    <label className="block font-medium mb-1">Role</label>
                    <select
                        name="role"
                        value={form.role}
                        onChange={handleChange}
                        className="w-full border rounded px-3 py-2"
                    >
                        <option value="worker">Worker</option>
                        <option value="manager">Manager</option>
                    </select>
                </div>

                <div>
                    <label className="block font-medium mb-1">Type</label>
                    <input
                        type="text"
                        name="type"
                        value={form.type}
                        onChange={handleChange}
                        className="w-full border rounded px-3 py-2"
                    />
                </div>

                <div>
                    <label className="block font-medium mb-1">Phone</label>
                    <input
                        type="text"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        className="w-full border rounded px-3 py-2"
                    />
                </div>

                <div>
                    <label className="block font-medium mb-1">Address</label>
                    <input
                        type="text"
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        className="w-full border rounded px-3 py-2"
                    />
                </div>

                <div>
                    <label className="block font-medium mb-1">Customer</label>
                    <input
                        type="text"
                        value={worker.customerName || ""}
                        readOnly
                        className="w-full border rounded px-3 py-2 bg-gray-100"
                    />
                </div>
            </div>
        </div>
    );
}
