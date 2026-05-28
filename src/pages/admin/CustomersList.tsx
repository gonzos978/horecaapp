import {useEffect, useState} from "react";
import {collection, doc, getDoc, getDocs, query, where} from "firebase/firestore";
import {useNavigate} from "react-router-dom";
import {db} from "../../fb/firebase";
import "../../styles/customers.css";
import {Building2, MapPin, Phone, User} from "lucide-react";

export default function CustomersList() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();


    const fetchCustomers = async () => {
        setLoading(true);

        try {
            const q = query(
                collection(db, "users"),
                where("role", "==", "CUSTOMER")
            );

            const querySnapshot = await getDocs(q);

            const users = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));

            // 🔥 ENRICH WITH CUSTOMER DATA
            const enriched = await Promise.all(
                users.map(async (user: any) => {
                    let customerData = null;

                    if (user.customerId) {
                        const customerSnap = await getDoc(
                            doc(db, "customers", user.customerId)
                        );

                        if (customerSnap.exists()) {
                            customerData = customerSnap.data();
                        }
                    }

                    return {
                        ...user,
                        customer: customerData, // 👈 merged data
                    };
                })
            );

            setCustomers(enriched);

        } catch (err) {
            console.error("FETCH ERROR:", err);
        } finally {
            setLoading(false);
        }
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
                            <strong className="customer-name">{c.customerName}</strong>
                            <span className="customer-email">{c.email}</span>
                        </div>

                        <div className="customer-meta grid gap-2 text-sm text-slate-600">

                            {/* Business Type */}
                            <span className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-100 w-fit">
        <Building2 size={16} className="text-slate-500"/>
                                {c.businessType || "N/A"}
    </span>

                            {/* Address */}
                            <span className="flex items-center gap-2">
        <MapPin size={16} className="text-slate-500"/>
                                {c.customer?.address || c.address || "N/A"}
    </span>

                            {/* Phone */}
                            <span className="flex items-center gap-2">
        <Phone size={16} className="text-slate-500"/>
                                {c.customer?.phone || c.phone || "N/A"}
    </span>

                            {/* Role */}
                            <span className="flex items-center gap-2">
        <User size={16} className="text-slate-500"/>
                                {c.role}
    </span>

                        </div>
                        <div className="customer-actions">
                            <button
                                className="edit-btn"
                                onClick={() => navigate(`/admin/edit-customer/${c.id}`)}
                            >
                                Edit
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
