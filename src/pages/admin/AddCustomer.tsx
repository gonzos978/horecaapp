import React, { useState } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "../../fb/firebase";
import { useAuth } from "../../contexts/AuthContext";
import { ROLE } from "../../models/role";
import "./../../styles/AddCustomer.css";


export default function AddCustomer() {
  const { isSuperAdmin, user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    address: "",
    customerId: "",
    customerName: "",
    email: "",
    isAdmin: false,
    name: "",
    password: "",
    phone: "",
    role: ROLE.CUSTOMER,
    type: ROLE.CUSTOMER,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!form.customerName || !form.email || !form.password) {
      alert("Customer Name, Admin Email and Password are required.");
      setLoading(false);
      return;
    }

    try {
      await setDoc(doc(db, "users", form.email), {
        address: form.address,
        createdAt: serverTimestamp(),
        customerId: form.email,
        customerName: form.customerName,
        email: form.email,
        isAdmin: false,
        name: form.name,
        phone: form.phone,
        role: ROLE.CUSTOMER,
        type: ROLE.CUSTOMER,
      });
      await createUserWithEmailAndPassword(auth, form.email, form.password);
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        alert("Customer email is already in use.");
      } else {
        // A catch-all for any other errors (auth, firestore, etc.)
        alert("Error creating customer/admin: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <p>Please log in to access this page.</p>;
  if (!isSuperAdmin) return <p>You do not have permission to add customers.</p>;

    return (
        <div className="add-customer">
            <h2>Add New Customer</h2>

            <form onSubmit={handleSubmit}>
                <input
                    name="customerName"
                    placeholder="Customer Name"
                    value={form.customerName}
                    onChange={handleChange}
                    required
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

                <h3>Admin Credentials</h3>

                <input
                    name="name"
                    placeholder="Admin Name"
                    value={form.name}
                    onChange={handleChange}
                />

                <input
                    name="email"
                    placeholder="Admin Email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                />

                <input
                    name="password"
                    placeholder="Admin Password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                />

                <button type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Create Customer"}
                </button>
            </form>
        </div>
    );

}
