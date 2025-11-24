import React, { useState } from "react";
import { db } from "../../fb/firebase";
import { collection, addDoc, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom"; // <--- import

export default function AddCustomer() {
    const { isSuperAdmin, user } = useAuth();
    const navigate = useNavigate(); // <--- hook za navigaciju
    const [form, setForm] = useState({
        customerName: "",
        address: "",
        phone: "",
        email: "",
        adminName: "",
        adminEmail: "",
        adminPassword: ""
    });
    const [loading, setLoading] = useState(false);

    if (!user) return <p>Please log in to access this page.</p>;
    if (!isSuperAdmin) return <p>You do not have permission to add customers.</p>;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!form.customerName || !form.adminEmail || !form.adminPassword) {
            alert("Customer Name, Admin Email and Password are required.");
            setLoading(false);
            return;
        }

        try {
            // 1️⃣ create customer document
            const customerRef = await addDoc(collection(db, "customers"), {
                name: form.customerName,
                address: form.address,
                phone: form.phone,
                email: form.email,
                createdAt: serverTimestamp(),
                createdBy: user.uid
            });

            // 2️⃣ create "admin placeholder" document
            await setDoc(doc(db, "users", form.adminEmail), {
                role: "admin",
                customerId: customerRef.id,
                email: form.adminEmail,
                name: form.adminName,
                passwordPlaceholder: form.adminPassword,
                createdAt: serverTimestamp()
            });

            alert("Customer + Admin record successfully created!");
            // Redirect na stranicu sa listom korisnika
            navigate("/admin/users"); // <--- redirect

        } catch (err: any) {
            console.error(err);
            alert("Error creating customer/admin: " + err.message);
        }

        setLoading(false);
    };

    return (
        <div style={{ padding: 20, maxWidth: 500 }}>
            <h2>Add New Customer</h2>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input
                    placeholder="Customer Name"
                    value={form.customerName}
                    onChange={e => setForm({ ...form, customerName: e.target.value })}
                    required
                />
                <input
                    placeholder="Address"
                    value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                />
                <input
                    placeholder="Phone"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                />
                <input
                    placeholder="Customer Email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    type="email"
                />

                <h3>Admin Info (placeholder)</h3>
                <input
                    placeholder="Admin Name"
                    value={form.adminName}
                    onChange={e => setForm({ ...form, adminName: e.target.value })}
                />
                <input
                    placeholder="Admin Email"
                    value={form.adminEmail}
                    onChange={e => setForm({ ...form, adminEmail: e.target.value })}
                    type="email"
                    required
                />
                <input
                    placeholder="Admin Password (placeholder)"
                    value={form.adminPassword}
                    onChange={e => setForm({ ...form, adminPassword: e.target.value })}
                    type="password"
                    required
                />

                <button type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Create Customer + Admin"}
                </button>
            </form>
        </div>
    );
}
