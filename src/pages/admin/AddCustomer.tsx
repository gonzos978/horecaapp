import React, { useMemo, useState } from "react";
import { httpsCallable } from "firebase/functions";

import { functions } from "../../fb/firebase";
import { useAuth } from "../../contexts/AuthContext";

import "./../../styles/AddCustomer.css";

export default function AddCustomer() {
    const { isSuperAdmin, user } = useAuth();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    const [form, setForm] = useState({
        customerName: "",
        address: "",
        phone: "",

        adminName: "",
        adminEmail: "",
        adminPassword: "",
    });

    const createCustomerFn = useMemo(() => {
        return httpsCallable(functions, "createCustomer");
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const validate = () => {
        if (!form.customerName.trim()) {
            return "Customer name is required";
        }

        if (!form.adminEmail.trim()) {
            return "Manager email is required";
        }

        if (!form.adminPassword.trim()) {
            return "Manager password is required";
        }

        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (loading) return;

        const validationError = validate();

        if (validationError) {
            setError(validationError);
            return;
        }

        setError(null);
        setLoading(true);

        try {
            await createCustomerFn({
                customerName: form.customerName,
                address: form.address,
                phone: form.phone,

                adminName: form.adminName,
                adminEmail: form.adminEmail,
                adminPassword: form.adminPassword,
            });

            setForm({
                customerName: "",
                address: "",
                phone: "",
                adminName: "",
                adminEmail: "",
                adminPassword: "",
            });

            setShowSuccess(true);
        } catch (err: any) {
            console.error(err);
            setShowSuccess(false);
            setError(err?.message || "Failed to create customer");
        } finally {
            setLoading(false);
        }
    };

    if (!user) return <p>Please log in.</p>;

    if (!isSuperAdmin) return <p>You do not have permission.</p>;

    return (
        <div className="add-customer">
            <h2>Create Customer</h2>

            {error && <div className="error">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="section">
                    <h3>Customer</h3>

                    <input
                        name="customerName"
                        placeholder="Customer Name"
                        value={form.customerName}
                        onChange={handleChange}
                    />

                    <input
                        name="address"
                        placeholder="Address"
                        value={form.address}
                        onChange={handleChange}
                    />

                    <input
                        name="phone"
                        placeholder="Phone"
                        value={form.phone}
                        onChange={handleChange}
                    />
                </div>

                <div className="section">
                    <h3>Manager</h3>

                    <input
                        name="adminName"
                        placeholder="Manager Name"
                        value={form.adminName}
                        onChange={handleChange}
                    />

                    <input
                        name="adminEmail"
                        type="email"
                        placeholder="Manager Email"
                        value={form.adminEmail}
                        onChange={handleChange}
                    />

                    <input
                        name="adminPassword"
                        type="password"
                        placeholder="Manager Password"
                        value={form.adminPassword}
                        onChange={handleChange}
                    />
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Create Customer"}
                </button>
            </form>
            {showSuccess && (
                <div className="popup-overlay">
                    <div className="popup">
                        <div className="popup-icon">✓</div>

                        <h3>Success</h3>

                        <p>Customer created successfully!</p>

                        <button onClick={() => setShowSuccess(false)}>
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}