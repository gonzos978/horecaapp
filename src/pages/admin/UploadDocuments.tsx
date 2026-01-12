import { useEffect, useState } from "react";
import {
    addDoc,
    collection,
    onSnapshot,
    orderBy,
    serverTimestamp,
    deleteDoc,
    doc,
    query,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "../../fb/firebase";
import { useAuth } from "../../contexts/AuthContext";
import "./../../styles/UploadDocuments.css";
import { getFunctions, httpsCallable } from "firebase/functions"; // CORRECT for frontend

export default function UploadDocuments() {
    const { user, isSuperAdmin } = useAuth();

    const [file, setFile] = useState<File | null>(null);
    const [progress, setProgress] = useState(0);
    const [loading, setLoading] = useState(false);

    const [documents, setDocuments] = useState<any[]>([]);
    const [listLoading, setListLoading] = useState(true);

    if (!user) return <p>Please log in.</p>;
    if (!isSuperAdmin) return <p>You do not have permission.</p>;

    // 🔹 Firestore listener for this user's documents
    useEffect(() => {
        if (!user) return;

        console.log(user.uid)
        const q = query(
            collection(db, "documents"),
            orderBy("createdAt", "desc")
        );

        const unsub = onSnapshot(
            q,
            (snap) => {
                const docs = snap.docs.map((d) => ({
                    id: d.id,
                    ...d.data(),
                    createdAt: d.data().createdAt?.toDate ? d.data().createdAt.toDate() : new Date()
                }));
                setDocuments(docs);
                setListLoading(false);
            },
            (err) => console.error("Firestore error:", err)
        );

        return () => unsub();
    }, [user]);

    // 🔹 Upload document
    const handleUpload = async () => {
        if (!file) return alert("Please select a file");

        setLoading(true);
        const storageRef = ref(storage, `documents/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
            "state_changed",
            (snapshot) => setProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)),
            (err) => {
                console.error(err);
                alert("Upload failed");
                setLoading(false);
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                // @ts-ignore
                const docRef = await addDoc(collection(db, "documents"), {
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

    // 🔹 Delete document
    const handleDelete = async (docId: string, fileUrl: string) => {
        if (!window.confirm("Are you sure?")) return;

        setDocuments((prev) => prev.filter((d) => d.id !== docId)); // optimistic UI

        try {
            await deleteDoc(doc(db, "documents", docId));

            const path = fileUrl.split("/o/")[1].split("?")[0];
            await deleteObject(ref(storage, decodeURIComponent(path)));
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };

    const handleCreateQuiz = async (docId: string) => {
        const functions = getFunctions();
        // Create a reference to your function
        const createQuiz = httpsCallable(functions, 'createQuizFromPdf');

        try {
            // Just call it like a regular function!
            // No need for URLs, JSON.stringify, or headers.
            const result = await createQuiz({ documentId: docId });

            console.log("Success:", result.data);
            alert("Quiz created successfully!");
        } catch (err: any) {
            // Firebase automatically parses the HttpsError you threw in the backend
            console.error("Error code:", err.code);
            alert(err.message || "Failed to create quiz");
        }
    };

    return (
        <div className="documents-cards-row">
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

                            {/* Create Quiz button */}
                            <button
                                className="quiz-btn"
                                onClick={() => handleCreateQuiz(doc.id)}
                            >
                                Create Quiz
                            </button>

                            <button
                                className="delete-btn"
                                onClick={() => handleDelete(doc.id, doc.fileUrl)}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>

    );
}
