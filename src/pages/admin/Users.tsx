import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import {db} from "../../fb/firebase";
import "../../styles/users.css";


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
        <div className="users-page">
            <div className="users-header">
                <h1>Users Management</h1>

                <button
                    className="btn-primary"
                    onClick={() => navigate("/admin/users/add")}
                >
                    ➕ Add User
                </button>
            </div>

            <table className="users-table">
                <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
                </thead>

                <tbody>
                {users.map(user => (
                    <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.worktype}</td>

                        <td>
                <span className={`status ${user.status}`}>
                  {user.status}
                </span>
                        </td>

                        <td>
                            <div className="actions">
                                <button
                                    className="btn-edit"
                                    onClick={() => navigate(`/admin/users/edit/${user.id}`)}
                                >
                                    Edit
                                </button>

                                <button
                                    className="btn-delete"
                                    onClick={() => handleDelete(user.id)}
                                >
                                    Delete
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
