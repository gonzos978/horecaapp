import {useEffect, useMemo, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {doc, getDoc, updateDoc} from "firebase/firestore";

import {getAuth} from "firebase/auth";
import {db, functions} from "../../fb/firebase";
import {httpsCallable} from "firebase/functions";
import toast from "react-hot-toast";

export default function EditCustomer() {
    const {id} = useParams();
    // id = USER id (from users collection)

    const auth = getAuth();
    // @ts-ignore
    const currentUser = auth.currentUser;

    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // IDs
    const [customerId, setCustomerId] = useState("");
    const [customerUserId, setCustomerUserId] = useState("");

    // FORM DATA (single source of truth)
    const [customerName, setCustomerName] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [businessType, setBusinessType] = useState("");

    const deleteCustomerFn =

        useMemo(() => {
            return httpsCallable(functions, "deleteCustomerUser");
        }, []);


    const handleDelete = async () => {
        if (!customerUserId) return;

        const confirmDelete = await new Promise<boolean>((resolve) => {
            toast(
                (t) => (
                    <div className="flex flex-col gap-3">
                        <p className="text-sm font-medium">
                            Delete this customer?
                        </p>

                        <div className="flex gap-2 justify-end">
                            <button
                                className="px-3 py-1 rounded bg-slate-200"
                                onClick={() => {
                                    toast.dismiss(t.id);
                                    resolve(false);
                                }}
                            >
                                Cancel
                            </button>

                            <button
                                className="px-3 py-1 rounded bg-red-600 text-white"
                                onClick={() => {
                                    toast.dismiss(t.id);
                                    resolve(true);
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ),
                { duration: Infinity }
            );
        });
        if (!confirmDelete) return;

        try {
            setSaving(true);

            await deleteCustomerFn({
                userId: customerUserId,
                customerId: customerId,
            });

            toast.success("Customer updated successfully 🎉");

            navigate("/admin/users");

        } catch (err) {
            console.error("DELETE ERROR:", err);
            toast.success("Customer updated successfully 🎉");
        } finally {
            setSaving(false);
        }
    };

    // ---------------- LOAD ----------------
    useEffect(() => {
        const load = async () => {
            if (!id) return;

            try {
                setLoading(true);

                setCustomerUserId(id);

                // 1️⃣ LOAD USER
                const userRef = doc(db, "users", id);
                const userSnap = await getDoc(userRef);

                if (!userSnap.exists()) {
                    throw new Error("User not found");
                }

                const userData = userSnap.data();

                const cid = userData.customerId;
                setCustomerId(cid || "");

                // fallback from user
                setCustomerName(userData.customerName || "");
                setPhone(userData.phone || "");
                setAddress(userData.address || "");
                setBusinessType(userData.businessType || "");

                // 2️⃣ LOAD CUSTOMER (OVERRIDES WITH REAL BUSINESS DATA)
                if (cid) {
                    const customerRef = doc(db, "customers", cid);
                    const customerSnap = await getDoc(customerRef);

                    if (customerSnap.exists()) {
                        const c = customerSnap.data();

                        setCustomerName(c.customerName || "");
                        setPhone(c.phone || "");
                        setAddress(c.address || "");
                        setBusinessType(c.businessType || "");
                    }
                }

            } catch (err) {
                console.error("LOAD ERROR:", err);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [id]);

    // ---------------- SAVE ----------------
    const saveCustomer = async () => {
        if (!customerId || !customerUserId) {
            alert("Missing customerId or userId");
            return;
        }

        try {
            setSaving(true);

            // 1️⃣ UPDATE customers (BUSINESS SOURCE OF TRUTH)
            await updateDoc(doc(db, "customers", customerId), {
                customerName,
                phone,
                address,
                businessType,
            });

            // 2️⃣ SYNC users (LOGIN / PROFILE DATA)
            await updateDoc(doc(db, "users", customerUserId), {
                customerName,
                phone,
                address,
                businessType,
                customerId,
            });

            toast.success("Customer updated successfully 🎉");
            navigate("/admin/users");

        } catch (err) {
            console.error("SAVE ERROR:", err);
            toast.error("Failed to update customer");
        } finally {
            setSaving(false);
        }
    };

    // ---------------- UI ----------------
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                Loading...
            </div>
        );
    }

    return (
        <div
            className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 p-6 flex items-center justify-center">

            <div className="w-full max-w-3xl">

                {/* CARD */}
                <div
                    className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-3xl overflow-hidden">

                    {/* HEADER */}
                    <div className="bg-gradient-to-r from-slate-900 to-slate-700 p-8 text-white">
                        <h1 className="text-3xl font-bold tracking-tight">
                            Edit Customer
                        </h1>
                        <p className="text-slate-300 mt-1 text-sm">
                            Update business information and contact details
                        </p>
                    </div>

                    {/* BODY */}
                    <div className="p-8 space-y-8">

                        {/* GRID */}
                        <div className="grid md:grid-cols-2 gap-6">

                            {/* BUSINESS TYPE */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">
                                    Business Type
                                </label>

                                <input
                                    value={businessType}
                                    onChange={(e) => setBusinessType(e.target.value)}
                                    placeholder="restaurant / cafe / hotel"
                                    className="w-full px-4 py-3 rounded-2xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-200 outline-none transition"
                                />
                            </div>

                            {/* NAME */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">
                                    Business Name
                                </label>

                                <input
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    placeholder="My Restaurant"
                                    className="w-full px-4 py-3 rounded-2xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-200 outline-none transition"
                                />
                            </div>

                            {/* PHONE */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">
                                    Phone
                                </label>

                                <input
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+387..."
                                    className="w-full px-4 py-3 rounded-2xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-200 outline-none transition"
                                />
                            </div>

                            {/* ADDRESS */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">
                                    Address
                                </label>

                                <input
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="Street, City"
                                    className="w-full px-4 py-3 rounded-2xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-200 outline-none transition"
                                />
                            </div>
                        </div>

                        {/* ACTIONS */}
                        <div className="flex items-center justify-between pt-4">

                            <button
                                onClick={() => navigate("/admin/users")}
                                className="px-6 py-3 rounded-2xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition font-medium"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={saveCustomer}
                                disabled={saving}
                                className="px-8 py-3 rounded-2xl bg-slate-900 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-50"
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-6 py-3 rounded-2xl bg-red-600 text-white font-semibold hover:bg-red-700 transition"
                            >
                                Delete Customer
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}