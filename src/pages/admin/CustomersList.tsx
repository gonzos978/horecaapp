import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../fb/firebase";
import "../../styles/customers.css";

export default function CustomersList() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCustomers = async () => {
        setLoading(true);

        const q = query(
            collection(db, "users"),
            where("role", "==", "customer")
        );

        const querySnapshot = await getDocs(q);

        const data = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        setCustomers(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    if (loading) return <p className="loading">Loading customers...</p>;

    return (
        <div className="customers-page">
            <h2>Customers</h2>

            {customers.length === 0 && (
                <p className="empty">No customers found.</p>
            )}

            <ul className="customers-list">
                {customers.map(c => (
                    <li key={c.id} className="customer-card">
                        <div className="customer-main">
                            <strong className="customer-name">{c.name}</strong>
                            <span className="customer-email">{c.email}</span>
                        </div>

                        <div className="customer-meta">
                            <span>📍 {c.address || "N/A"}</span>
                            <span>📞 {c.phone || "N/A"}</span>
                            <span className="role">👤 {c.role}</span>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
