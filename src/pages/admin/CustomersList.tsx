import React, { useEffect, useState } from "react";
import { db } from "../../fb/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function CustomersList() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCustomers = async () => {
            setLoading(true);
            const querySnapshot = await getDocs(collection(db, "customers"));
            const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCustomers(data);
            setLoading(false);
        };

        fetchCustomers();
    }, []);

    if (loading) return <p>Loading customers...</p>;

    return (
        <div style={{ padding: 20 }}>
            <h2>Customers</h2>
            <ul>
                {customers.map(c => (
                    <li key={c.id}>
                        <strong>{c.name}</strong> ({c.email}) – {c.address} – {c.phone}
                    </li>
                ))}
            </ul>
        </div>
    );
}
