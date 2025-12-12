import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../fb/firebase";
import {
  collection,
  addDoc,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useAuth } from "../../contexts/AuthContext";

export default function AddCustomer() {
  const { isSuperAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    customerName: "",
    address: "",
    phone: "",
    email: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
  });
  const [loading, setLoading] = useState(false);

  if (!user) return <p>Please log in to access this page.</p>;
  if (!isSuperAdmin) return <p>You do not have permission to add customers.</p>;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!form.customerName || !form.adminEmail || !form.adminPassword) {
      alert("Customer Name, Admin Email and Password are required.");
      setLoading(false);
      return;
    }

    try {
      await addDoc(collection(db, "users"), {
        address: form.address,
        createdAt: serverTimestamp(),
        customerId: uuidv4(),
        email: form.email,
        isAdmin: false,
        name: form.customerName,
        phone: form.phone,
        role: "customer",
      });
      await createUserWithEmailAndPassword(
        auth,
        form.adminEmail,
        form.adminPassword
      );
      navigate("/admin/users", { replace: true });
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        alert("Admin email is already in use.");
      } else {
        // A catch-all for any other errors (auth, firestore, etc.)
        alert("Error creating customer/admin: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 500 }}>
      <h2>Add New Customer</h2>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 10 }}
      >
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
        <input
          name="email"
          placeholder="Customer Email"
          type="email"
          value={form.email}
          onChange={handleChange}
        />

        <h3>Admin Credentials</h3>
        <input
          name="adminName"
          placeholder="Admin Name"
          value={form.adminName}
          onChange={handleChange}
        />
        <input
          name="adminEmail"
          placeholder="Admin Email"
          type="email"
          value={form.adminEmail}
          onChange={handleChange}
          required
        />
        <input
          name="adminPassword"
          placeholder="Admin Password"
          type="password"
          value={form.adminPassword}
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
