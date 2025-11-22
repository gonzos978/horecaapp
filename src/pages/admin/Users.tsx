import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import {db} from "../../fb/firebase";


export default function Users() {
    const navigate = useNavigate();
    const [users, setUsers] = useState<any[]>([]);

    useEffect(() => {
        const unsub = onSnapshot(collection(db, "horercausers"), snapshot => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUsers(data);
            console.log(data);
        });
        return () => unsub();
    }, []);

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this user?")) {
            await deleteDoc(doc(db, "horercausers", id));
        }
    };

    return (
        <div style={{ padding: 20 }}>
            <h1>Users Management</h1>

            <button
                style={{ padding: "10px 20px", fontSize: "16px", cursor: "pointer", marginTop: "20px" }}
                onClick={() => navigate("/admin/users/add")}
            >
                ➕ Add User
            </button>

            <table style={{ width: "100%", marginTop: 20, borderCollapse: "collapse" }}>
                <thead>
                <tr>
                    <th style={{ border: "1px solid #ddd", padding: 8 }}>Name</th>
                    <th style={{ border: "1px solid #ddd", padding: 8 }}>Email</th>
                    <th style={{ border: "1px solid #ddd", padding: 8 }}>Role</th>
                    <th style={{ border: "1px solid #ddd", padding: 8 }}>Status</th>
                    <th style={{ border: "1px solid #ddd", padding: 8 }}>Actions</th>
                </tr>
                </thead>
                <tbody>
                {users.map(user => (
                    <tr key={user.id}>
                        <td style={{ border: "1px solid #ddd", padding: 8 }}>{user.name}</td>
                        <td style={{ border: "1px solid #ddd", padding: 8 }}>{user.email}</td>
                        <td style={{ border: "1px solid #ddd", padding: 8 }}>{user.worktype}</td>
                        <td style={{ border: "1px solid #ddd", padding: 8 }}>{user.status}</td>
                        <td style={{ border: "1px solid #ddd", padding: 8 }}>
                            <button
                                style={{ marginRight: 8 }}
                                onClick={() => navigate(`/admin/users/edit/${user.id}`)}
                            >
                                Edit
                            </button>
                            <button onClick={() => handleDelete(user.id)}>Delete</button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
