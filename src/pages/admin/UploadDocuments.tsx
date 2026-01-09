import { useEffect, useState } from "react";
import {
    addDoc,
    collection,
    onSnapshot,
    serverTimestamp,
    deleteDoc,
    doc,
    query,
    where
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "../../fb/firebase";
import { useAuth } from "../../contexts/AuthContext";
import "./../../styles/UploadDocuments.css";

export default function UploadDocuments() {
    const { user, isSuperAdmin } = useAuth();

    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    const [documents, setDocuments] = useState<any[]>([]);
    const [listLoading, setListLoading] = useState(true);

    // 🔹 Real-time Listener (The Single Source of Truth)
    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, "documents"),
            where("ownerId", "==", user.uid)
        );

        // includeMetadataChanges ensures the UI feels fast by showing local changes immediately
        const unsub = onSnapshot(q, { includeMetadataChanges: true }, (snap) => {
            const docs = snap.docs.map((d) => ({
                id: d.id,
                ...d.data(),
                // Use server timestamp if available, otherwise use local current date
                createdAt: d.data().createdAt?.toDate?.() || new Date()
            }));

            setDocuments(docs);
            setListLoading(false);
        }, (err) => {
            console.error("Firestore error:", err);
            setListLoading(false);
        });

        return () => unsub();
    }, [user]);

    if (!user) return <p>Please log in.</p>;
    if (!isSuperAdmin) return <p>You do not have permission.</p>;

    // 🔹 Delete Logic: Cleans up both DB and Storage
    const handleDelete = async (docId: string, fileUrl: string) => {
        if (!window.confirm("Are you sure? This deletes the database record and the file.")) return;

        try {
            setLoading(true);

            // 1. Delete from Firestore (This removes it from your UI list immediately)
            await deleteDoc(doc(db, "documents", docId));

            // 2. Delete from Storage (The physical file)
            const path = fileUrl.split("/o/")[1].split("?")[0];
            const decodedPath = decodeURIComponent(path);
            await deleteObject(ref(storage, decodedPath));

        } catch (err: any) {
            console.error("Delete failed:", err);
            alert("Delete failed. Check your Security Rules.");
        } finally {
            setLoading(false);
        }
    };

    // 🔹 Upload Logic
    const handleUpload = async () => {
        if (!file) return alert("Please select a file");

        setLoading(true);
        setProgress(0);

        const storageRef = ref(storage, `documents/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
            "state_changed",
            (snapshot) => {
                const percent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setProgress(Math.round(percent));
            },
            (error) => {
                console.error(error);
                alert("Upload failed");
                setLoading(false);
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                // Add to Firestore (The listener above will automatically add it to your UI)
                await addDoc(collection(db, "documents"), {
                    fileName: file.name,
                    fileUrl: downloadURL,
                    contentType: file.type,
                    uploadedBy: user.email,
                    ownerId: user.uid,
                    createdAt: serverTimestamp()
                });

                setFile(null);
                setProgress(0);
                setLoading(false);
            }
        );
    };

    return (
        <div className="upload-documents">
            <h2>Upload Documents</h2>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />

            {progress > 0 && (
                <div className="progress">
                    <div className="bar" style={{ width: `${progress}%` }} />
                </div>
            )}

            <button onClick={handleUpload} disabled={loading || !file}>
                {loading ? "Processing..." : "Upload Document"}
            </button>

            <hr style={{ margin: "24px 0", opacity: 0.2 }} />

            <h3>Uploaded Documents</h3>
            {listLoading ? (
                <p>Loading documents…</p>
            ) : documents.length === 0 ? (
                <p style={{ color: "#777" }}>No documents found in database.</p>
            ) : (
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
                                    <button
                                        className="delete-btn"
                                        disabled={loading}
                                        onClick={() => handleDelete(doc.id, doc.fileUrl)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}