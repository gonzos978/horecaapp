import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../fb/firebase";

export default function CustomersList() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchCustomers = async () => {
    setLoading(true);

    const q = query(collection(db, "users"), where("role", "==", "customer"));

    const querySnapshot = await getDocs(q);

    const data = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setCustomers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  if (loading) return <p>Loading customers...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Users</h2>
      <ul>
        {customers.map((c) => (
          <li key={c.id}>
            <strong>{c.name}</strong> ({c.email}) – {c.address || "N/A"} –{" "}
            {c.phone || "N/A"} {c.role}
          </li>
        ))}
      </ul>
    </div>
  );
}
