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
        businessType: "",
        address: "",
        phone: "",

        loginEmail: "",
        loginPassword: "",
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
        if (!form.customerName.trim()) return "Customer name is required";
        if (!form.businessType.trim()) return "Business type is required";
        if (!form.loginEmail.trim()) return "Login email is required";
        if (!form.loginPassword.trim()) return "Login password is required";
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
                businessType: form.businessType,
                address: form.address,
                phone: form.phone,

                adminEmail: form.loginEmail,
                adminPassword: form.loginPassword,
            });

            setForm({
                customerName: "",
                businessType: "",
                address: "",
                phone: "",
                loginEmail: "",
                loginPassword: "",
            });

            setShowSuccess(true);
        } catch (err: any) {
            console.log(err);
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
                <select
                    name="businessType"
                    value={form.businessType}
                    onChange={(e) =>
                        setForm(prev => ({ ...prev, businessType: e.target.value }))
                    }
                >
                    <option value="">Select business type</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="cafe">Café</option>
                    <option value="bar">Bar</option>
                    <option value="hotel">Hotel</option>
                    <option value="other">Other</option>
                </select>

                <div className="section">
                    <h3>Login Credentials</h3>

                    <input
                        name="loginEmail"
                        type="email"
                        placeholder="Login Email"
                        value={form.loginEmail}
                        onChange={handleChange}
                    />

                    <input
                        name="loginPassword"
                        type="password"
                        placeholder="Login Password"
                        value={form.loginPassword}
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