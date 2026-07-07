import { useEffect, useState } from "react";
import {
    addDoc,
    collection,
    onSnapshot,
    orderBy,
    serverTimestamp,
    deleteDoc,
    doc,
    query, where,
} from "firebase/firestore";

import {
    ref,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject,
} from "firebase/storage";

import {
    FileText,
    Upload,
    Trash2,
    Sparkles,
    ExternalLink,
    Loader2,
    ShieldCheck,
} from "lucide-react";

import { db, storage } from "../../fb/firebase";
import { useAuth } from "../../contexts/AuthContext";
import { getFunctions, httpsCallable } from "firebase/functions";

import "./../../styles/UploadDocuments.css";

const ROLE_LABELS: Record<string, string> = {
    waiter:             'Konobar',
    cook:               'Kuvar',
    housekeeping:       'Sobarica',
    manager:            'Menadžer',
    barman:             'Šanker',
    hotel_manager:      'Menadžer hotela',
    restaurant_manager: 'Menadžer restorana',
    executive_chef:     'Glavni kuvar',
    sous_cook:          'Pomoćni kuvar',
    mixologist:         'Koktel majstor',
    bartender:          'Šanker (bar)',
    busser:             'Servirka',
    housekeeper:        'Sobarica (sobe)',
    night_security:     'Noćni čuvar',
    cleaner:            'Higijeničarka',
    maintenance:        'Domar',
    groundskeeper:      'Vrtlar',
    spa_staff:          'SPA osoblje',
};

export default function UploadDocuments() {
    const { user, isSuperAdmin } = useAuth();

    const [file, setFile] = useState<File | null>(null);
    const [workerType, setWorkerType] = useState<string>("");
    const [progress, setProgress] = useState(0);
    const [loading, setLoading] = useState(false);

    const [documents, setDocuments] = useState<any[]>([]);
    const [listLoading, setListLoading] = useState(true);

    const functions = getFunctions();

    // =========================
    // FIRESTORE LISTENER
    // =========================
    useEffect(() => {
        if (!user) return;

        console.log(user);

        // 🔥 ONLY CURRENT USER DOCUMENTS
        const q = query(
            collection(db, "documents"),
            where("ownerId", "==", user.uid),
            orderBy("createdAt", "desc")
        );

        const unsub = onSnapshot(
            q,
            (snap) => {
                const docs = snap.docs.map((d) => ({
                    id: d.id,
                    ...d.data(),
                    createdAt:
                        d.data().createdAt?.toDate?.() ??
                        new Date(),
                }));

                setDocuments(docs);
                setListLoading(false);
            },
            (err) => {
                console.log("Firestore error:", err);
                setListLoading(false);
            }
        );

        return () => unsub();
    }, [user]);

    // =========================
    // UPLOAD FILE
    // =========================
    const handleUpload = async () => {
        if (!file) {
            alert("Please select a file");
            return;
        }
        if (!workerType) {
            alert("Please select a worker type");
            return;
        }

        if (!user) return;

        try {
            setLoading(true);
            setProgress(0);

            const storagePath = `documents/${user.uid}/${Date.now()}_${file.name}`;

            const storageRef = ref(storage, storagePath);

            const uploadTask = uploadBytesResumable(
                storageRef,
                file
            );

            uploadTask.on(
                "state_changed",

                (snapshot) => {
                    const percent = Math.round(
                        (snapshot.bytesTransferred /
                            snapshot.totalBytes) *
                        100
                    );

                    setProgress(percent);
                },

                (err) => {
                    console.error("UPLOAD ERROR:", err);
                    alert("Upload failed");
                    setLoading(false);
                },

                async () => {
                    const downloadURL =
                        await getDownloadURL(
                            uploadTask.snapshot.ref
                        );

                    const docRef = await addDoc(
                        collection(db, "documents"),
                        {
                            fileName: file.name,
                            fileUrl: downloadURL,
                            filePath: storagePath,
                            contentType: file.type,
                            uploadedBy: user.email,
                            ownerId: user.uid,
                            workerType,
                            isPublic: true,
                            createdAt: serverTimestamp(),
                        }
                    );

                    setDocuments(prev => [{
                        id: docRef.id,
                        fileName: file.name,
                        fileUrl: downloadURL,
                        filePath: storagePath,
                        contentType: file.type,
                        uploadedBy: user.email,
                        ownerId: user.uid,
                        workerType,
                        isPublic: true,
                        createdAt: new Date(),
                    }, ...prev]);

                    setFile(null);
                    setWorkerType("");
                    setProgress(0);
                    setLoading(false);
                }
            );
        } catch (err) {
            console.error("UPLOAD ERROR:", err);
            setLoading(false);
        }
    };

    // =========================
    // DELETE DOCUMENT
    // =========================
    const handleDelete = async (
        docId: string,
        filePath?: string
    ) => {
        const confirmed = window.confirm(
            "Delete this document?"
        );

        if (!confirmed) return;

        try {
            // optimistic UI
            setDocuments((prev) =>
                prev.filter((d) => d.id !== docId)
            );

            await deleteDoc(doc(db, "documents", docId));

            if (filePath) {
                await deleteObject(ref(storage, filePath));
            }
        } catch (err) {
            console.error("DELETE ERROR:", err);
        }
    };

    // =========================
    // CREATE QUIZ
    // =========================
    const handleCreateQuiz = async (
        docId: string
    ) => {
        const createQuiz = httpsCallable(
            functions,
            "createQuizFromPdf"
        );

        try {
            const result = await createQuiz({
                documentId: docId,
            });

            console.log("Quiz created:", result.data);

            alert("Quiz created successfully!");
        } catch (err: any) {
            console.error("Quiz error:", err);

            alert(
                err.message ||
                "Failed to create quiz"
            );
        }
    };

    // =========================
    // GUARDS
    // =========================
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center text-slate-600">
                Please log in.
            </div>
        );
    }

    if (!isSuperAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="bg-white border border-red-200 shadow-xl rounded-3xl p-8 text-center max-w-md">
                    <ShieldCheck
                        size={48}
                        className="mx-auto text-red-500 mb-4"
                    />

                    <h2 className="text-2xl font-bold text-slate-800">
                        Access Denied
                    </h2>

                    <p className="text-slate-500 mt-2">
                        You do not have permission
                        to access this page.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 p-6">

            <div className="max-w-7xl mx-auto">

                {/* HEADER */}
                <div className="mb-8">
                    <h1 className="text-4xl font-black text-slate-900">
                        Documents Center
                    </h1>

                    <p className="text-slate-500 mt-2">
                        Upload PDF documents and
                        generate quizzes automatically.
                    </p>
                </div>

                {/* UPLOAD CARD */}
                <div className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-3xl p-8 mb-10">

                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                            <Upload size={22} />
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">
                                Upload Document
                            </h2>

                            <p className="text-slate-500 text-sm">
                                PDF, DOCX or text files
                            </p>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Tip radnika</label>
                        <select
                            value={workerType}
                            onChange={e => setWorkerType(e.target.value)}
                            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
                        >
                            <option value="">— Odaberite tip radnika —</option>
                            {Object.entries(ROLE_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>{label} ({value})</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid md:grid-cols-[1fr_auto] gap-4 items-center">

                        <label className="flex items-center gap-4 border-2 border-dashed border-slate-300 rounded-2xl px-5 py-4 bg-slate-50 hover:bg-slate-100 transition cursor-pointer">

                            <FileText
                                size={24}
                                className="text-slate-500"
                            />

                            <div className="flex-1">
                                <p className="font-medium text-slate-700">
                                    {file
                                        ? file.name
                                        : "Choose a file"}
                                </p>

                                <p className="text-sm text-slate-400">
                                    Click to browse files
                                </p>
                            </div>

                            <input
                                type="file"
                                className="hidden"
                                onChange={(e) =>
                                    setFile(
                                        e.target
                                            .files?.[0] ||
                                        null
                                    )
                                }
                            />
                        </label>

                        <button
                            onClick={handleUpload}
                            disabled={loading}
                            className="px-8 py-4 rounded-2xl bg-slate-900 text-white font-semibold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2
                                        size={18}
                                        className="animate-spin"
                                    />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload size={18} />
                                    Upload
                                </>
                            )}
                        </button>
                    </div>

                    {/* PROGRESS */}
                    {loading && (
                        <div className="mt-6">

                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-slate-600">
                                    Uploading...
                                </span>

                                <span className="font-semibold text-slate-800">
                                    {progress}%
                                </span>
                            </div>

                            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-slate-900 transition-all duration-300"
                                    style={{
                                        width: `${progress}%`,
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* DOCUMENTS */}
                <div>

                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-slate-800">
                            Uploaded Documents
                        </h2>

                        <div className="text-sm text-slate-500">
                            {documents.length} document(s)
                        </div>
                    </div>

                    {listLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2
                                size={40}
                                className="animate-spin text-slate-500"
                            />
                        </div>
                    ) : documents.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-lg">
                            <FileText
                                size={48}
                                className="mx-auto text-slate-400 mb-4"
                            />

                            <h3 className="text-xl font-bold text-slate-700">
                                No documents uploaded
                            </h3>

                            <p className="text-slate-500 mt-2">
                                Upload your first file to
                                begin creating quizzes.
                            </p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">

                            {documents.map((docItem) => (
                                <div
                                    key={docItem.id}
                                    className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-xl rounded-3xl p-6 hover:shadow-2xl hover:-translate-y-1 transition-all"
                                >

                                    {/* TOP */}
                                    <div className="flex items-start justify-between gap-4 mb-5">

                                        <div className="flex items-start gap-4 min-w-0">

                                            <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                                                <FileText
                                                    size={24}
                                                />
                                            </div>

                                            <div className="min-w-0">
                                                <h3 className="font-bold text-slate-800 truncate">
                                                    {
                                                        docItem.fileName
                                                    }
                                                </h3>

                                                <p className="text-sm text-slate-500 mt-1 truncate">
                                                    Uploaded by {docItem.uploadedBy}
                                                </p>
                                                {docItem.workerType && (
                                                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
                                                        {ROLE_LABELS[docItem.workerType] ?? docItem.workerType}
                                                    </span>
                                                )}
                                                <span className="inline-block mt-1 ml-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                                                    Public
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* DATE */}
                                    <div className="bg-slate-100 rounded-2xl px-4 py-3 mb-6">
                                        <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
                                            Created
                                        </p>

                                        <p className="text-sm font-medium text-slate-700">
                                            {docItem.createdAt.toLocaleString()}
                                        </p>
                                    </div>

                                    {/* ACTIONS */}
                                    <div className="flex flex-wrap gap-3">

                                        <a
                                            href={
                                                docItem.fileUrl
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 min-w-[100px] inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition font-medium"
                                        >
                                            <ExternalLink
                                                size={16}
                                            />
                                            Open
                                        </a>

                                        <button
                                            className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition shadow-lg"
                                            onClick={() =>
                                                handleCreateQuiz(
                                                    docItem.id
                                                )
                                            }
                                        >
                                            <Sparkles
                                                size={16}
                                            />
                                            Create Quiz
                                        </button>

                                        <button
                                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition font-semibold"
                                            onClick={() =>
                                                handleDelete(
                                                    docItem.id,
                                                    docItem.filePath
                                                )
                                            }
                                        >
                                            <Trash2
                                                size={16}
                                            />
                                            Delete
                                        </button>

                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}