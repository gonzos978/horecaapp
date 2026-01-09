import { useEffect, useState } from "react";
import { collection, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "../../fb/firebase";
import { useAuth } from "../../contexts/AuthContext";
import "./../../styles/UploadDocuments.css";

interface DocumentsCardsProps {
    newDoc?: any; // optional: to add new uploaded doc instantly
}

export default function DocumentsCards({ newDoc }: DocumentsCardsProps) {
    const { user } = useAuth();
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const q = collection(db, "documents");
        const unsub = onSnapshot(q, (snap) => {
            const docs = snap.docs
                .map((d) => ({
                    id: d.id,
                    ...d.data(),
                    createdAt: d.data().createdAt?.toDate ? d.data().createdAt.toDate() : new Date(),
                }))
                .filter((d) => d.ownerId === user.uid);

            setDocuments(docs);
            setLoading(false);
        }, (err) => console.error("Firestore error:", err));

        return () => unsub();
    }, [user]);

    // Add new document if upload just happened
    useEffect(() => {
        if (newDoc) setDocuments((prev) => [newDoc, ...prev]);
    }, [newDoc]);

    const handleDelete = async (docId: string, fileUrl: string) => {
        if (!window.confirm("Are you sure?")) return;

        // Optimistic UI
        setDocuments((prev) => prev.filter((d) => d.id !== docId));

        await deleteDoc(doc(db, "documents", docId));
        const path = fileUrl.split("/o/")[1].split("?")[0];
        await deleteObject(ref(storage, decodeURIComponent(path)));
    };

    if (loading) return <p>Loading documents…</p>;
    if (!documents.length) return <p>No documents uploaded yet.</p>;

    return (
        <div className="documents-cards">
            {documents.map((doc) => (
                <div key={doc.id} className="document-card">
                    <div className="card-header">
                        <strong>{doc.fileName}</strong>
                        <span>Uploaded by {doc.uploadedBy}</span>
                    </div>
                    <div className="card-footer">
                        <small>{doc.createdAt.toLocaleString()}</small>
                        <div className="card-actions">
                            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">Open</a>
                            <button className="delete-btn" onClick={() => handleDelete(doc.id, doc.fileUrl)}>Delete</button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
