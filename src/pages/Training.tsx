import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { GraduationCap, Play, FileText, Award, PlusCircle, Clock, Users, Pencil, Trash2, CheckCircle, XCircle, ChevronRight, RotateCcw } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { getDownloadURL, getStorage, ref, uploadBytes, listAll, deleteObject } from "firebase/storage";
import { collection, getDocs, deleteDoc, doc, addDoc, serverTimestamp, query, where } from "firebase/firestore";
import { db } from "../fb/firebase.ts";
import { useAuth } from '../contexts/AuthContext';
import WorkerHeader from '../components/WorkerHeader';
import { useScoringConfig } from '../hooks/useScoringConfig';

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

export default function Training() {
    const { t, language } = useLanguage();
    const { currentUser, user: authUser } = useAuth();
    const navigate = useNavigate();
    const isManager = ["manager", "MANAGER", "customer", "CUSTOMER"].includes(currentUser?.role ?? "");
    const isWorker = currentUser?.role?.toLowerCase() === "worker";
    // For workers, derive their role key from their type (e.g. "waiter" → "waiter")
    const workerRoleKey = isWorker ? (currentUser?.type ?? null) : null;

    const [positions, setPositions] = useState<any[]>([]);
    const [modules, setModules] = useState<any[]>([]);
    const [publicModules, setPublicModules] = useState<any[]>([]);
    const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
    const [positionCounters, setPositionCounters] = useState<Record<string, number>>({});
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [quizFilter, setQuizFilter] = useState<string>("all");
    const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
    const [deleteQuizTarget, setDeleteQuizTarget] = useState<any | null>(null);
    // last result per quizId for the current user
    const [myResults, setMyResults] = useState<Record<string, any>>({});

    const [uploading, setUploading] = useState(false);
    const [workerType, setWorkerType] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [fileInputKey, setFileInputKey] = useState(Date.now());

    // ── Scoring config (from settings) ────────────────────────────────────
    const scoringConfig = useScoringConfig(currentUser?.customerId);

    // ── Quiz taking ────────────────────────────────────────────────────────
    const PASS_PERCENT = scoringConfig.passPercent;
    const [activeQuiz, setActiveQuiz] = useState<any | null>(null);
    const [qIndex, setQIndex] = useState(0);
    const [answers, setAnswers] = useState<(number | null)[]>([]);
    const [selected, setSelected] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [quizDone, setQuizDone] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const startQuiz = (quiz: any) => {
        const r = myResults[quiz.id];
        const completedMs = r?.completedAt?.seconds ? r.completedAt.seconds * 1000 : null;
        if (completedMs && Date.now() - completedMs < scoringConfig.testRetryHours * 60 * 60 * 1000) return;
        setActiveQuiz(quiz);
        setQIndex(0);
        setAnswers([]);
        setSelected(null);
        setTimeLeft(quiz.timePerQuestion ?? 60);
        setQuizDone(false);
    };

    const closeQuiz = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setActiveQuiz(null);
        setQuizDone(false);
    };

    const commitAnswer = (idx: number | null) => {
        if (!activeQuiz) return;
        const next = [...answers, idx];
        setAnswers(next);
        if (timerRef.current) clearInterval(timerRef.current);

        const nextIdx = qIndex + 1;
        if (nextIdx >= activeQuiz.questions.length) {
            setQuizDone(true);
            // calculate final score and save
            const correct = next.filter((a, i) => a === activeQuiz.questions[i]?.correct).length;
            const total = activeQuiz.questions.length;
            const pct = Math.round((correct / total) * 100);
            const didPass = pct >= PASS_PERCENT;
            addDoc(collection(db, "quiz_results"), {
                userId: authUser?.uid ?? null,
                userEmail: authUser?.email ?? null,
                userName: currentUser?.name ?? authUser?.email ?? "Nepoznat",
                userRole: currentUser?.type ?? currentUser?.role ?? null,
                customerId: currentUser?.customerId ?? null,
                customerName: currentUser?.customerName ?? null,
                quizId: activeQuiz.id,
                quizTitle: activeQuiz.title,
                quizRole: activeQuiz.role,
                score: correct,
                total,
                percentage: pct,
                passed: didPass,
                completedAt: serverTimestamp(),
            }).then(() => { console.log("Quiz result saved"); loadMyResults(); }).catch(err => console.error("Failed to save quiz result:", err));
        } else {
            setQIndex(nextIdx);
            setSelected(null);
            setTimeLeft(activeQuiz.timePerQuestion ?? 60);
        }
    };

    // countdown
    useEffect(() => {
        if (!activeQuiz || quizDone) return;
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) {
                    clearInterval(timerRef.current!);
                    commitAnswer(null); // time up = wrong
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [qIndex, activeQuiz, quizDone]);

    const scoreCorrect = activeQuiz
        ? answers.filter((a, i) => a === activeQuiz.questions[i]?.correct).length
        : 0;
    const passed = activeQuiz
        ? (scoreCorrect / activeQuiz.questions.length) * 100 >= PASS_PERCENT
        : false;

    const userId = authUser?.uid;

    const workerTypes = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }));

    const contentTypeIcons = { VIDEO: Play, QUIZ: FileText, PRACTICE: Award, DOCUMENT: FileText, INTERACTIVE: Award };
    const contentTypeColors = { VIDEO: 'bg-red-100 text-red-800', QUIZ: 'bg-blue-100 text-blue-800', PRACTICE: 'bg-purple-100 text-purple-800', DOCUMENT: 'bg-slate-100 text-slate-800', INTERACTIVE: 'bg-emerald-100 text-emerald-800' };

    useEffect(() => {
        loadPositions();
        loadPublicModules();
        loadQuizzes();
    }, []);

    useEffect(() => {
        if (authUser?.email) loadMyResults();
    }, [authUser?.email, authUser?.uid]);

    useEffect(() => {
        if (userId) loadPrivateModules();
    }, [userId]);

    useEffect(() => {
        calculatePositionCounters();
    }, [modules, publicModules]);

    useEffect(() => {
        if (isWorker && workerRoleKey) setSelectedPosition(workerRoleKey);
    }, [isWorker, workerRoleKey]);

    const loadPositions = () => {
        setPositions(Object.entries(ROLE_LABELS).map(([code, name_bs], i) => ({
            id: String(i + 1), code, name_en: code, name_bs,
        })));
    };

    const getPositionCodeFromFileName = (fileName: string) => {
        const lower = fileName.toLowerCase();
        if (lower.includes("konobar") || lower.includes("waiter"))         return "waiter";
        if (lower.includes("kuvar") || lower.includes("cook"))             return "cook";
        if (lower.includes("sobarica") || lower.includes("housekeeper"))   return "housekeeper";
        if (lower.includes("šanker") || lower.includes("barman") || lower.includes("barmen")) return "barman";
        if (lower.includes("manager") || lower.includes("menadžer"))       return "manager";
        return "";
    };

    const getAllModules = () => {
        const all = [...modules, ...publicModules];
        return isWorker && workerRoleKey ? all.filter(m => m.position_code === workerRoleKey) : all;
    };
    const getPositionModules = (code: string) => getAllModules().filter(m => m.position_code === code);
    const visiblePositions = isWorker && workerRoleKey ? positions.filter(p => p.code === workerRoleKey) : positions;

    const calculatePositionCounters = (overrideModules?: any[], overridePublic?: any[]) => {
        const all = [...(overrideModules ?? modules), ...(overridePublic ?? publicModules)];
        const counters: Record<string, number> = {};
        all.forEach(m => {
            if (!m.position_code) return;
            counters[m.position_code] = (counters[m.position_code] || 0) + 1;
        });
        setPositionCounters(counters);
    };

    const loadPrivateModules = async () => {
        if (!currentUser?.customerId) return;
        try {
            const q = query(
                collection(db, "training-instructions"),
                where("customerId", "==", currentUser.customerId)
            );
            const snap = await getDocs(q);
            const allModules = snap.docs.map(d => {
                const data = d.data();
                const fileUrl = data.filePath ? makeStorageUrl(data.filePath) : data.fileUrl;
                return { id: d.id, position_code: data.workerType, fileName: data.fileName, fileUrl, filePath: data.filePath, isPublic: false, content_type: "DOCUMENT" };
            });
            setModules(allModules);
            calculatePositionCounters(allModules);
        } catch (err) {
            console.error("Error loading training instructions:", err);
        }
    };

    const makeStorageUrl = (filePath: string) => {
        const bucket = "horecaapp-e16cf.firebasestorage.app";
        return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(filePath)}?alt=media`;
    };

    const loadPublicModules = async () => {
        try {
            // First load from Firestore (has workerType metadata)
            const firestoreDocs: any[] = [];
            try {
                const snapshot = await getDocs(collection(db, "documents"));
                snapshot.docs.forEach(d => {
                    const data = d.data();
                    const fileUrl = data.filePath ? makeStorageUrl(data.filePath) : data.fileUrl;
                    firestoreDocs.push({
                        id: d.id, isPublic: true,
                        fileName: data.fileName, fileUrl,
                        filePath: data.filePath,
                        position_code: data.workerType || getPositionCodeFromFileName(data.fileName),
                        content_type: "DOCUMENT",
                    });
                });
            } catch { /* ignore */ }

            // Also list Storage directly to catch files not in Firestore
            const storageDocs: any[] = [];
            try {
                const storage = getStorage();
                const listRef = ref(storage, "documents");
                const result = await listAll(listRef);

                // List subdirectories (each user's folder)
                for (const folderRef of result.prefixes) {
                    const folderResult = await listAll(folderRef);
                    for (const itemRef of folderResult.items) {
                        const filePath = itemRef.fullPath;
                        const fileName = itemRef.name.replace(/^\d+_/, ""); // strip timestamp prefix
                        // Skip if already in firestoreDocs
                        if (firestoreDocs.some(d => d.filePath === filePath)) continue;
                        const fileUrl = makeStorageUrl(filePath);
                        storageDocs.push({
                            id: filePath, isPublic: true,
                            fileName, fileUrl, filePath,
                            position_code: getPositionCodeFromFileName(fileName),
                            content_type: "DOCUMENT",
                        });
                    }
                }
            } catch { /* ignore */ }

            const all = [...firestoreDocs, ...storageDocs];
            setPublicModules(all);
            calculatePositionCounters(undefined, all);
        } catch (err) {
            console.error("Error loading public modules:", err);
        }
    };

    const loadQuizzes = async () => {
        try {
            const snapshot = await getDocs(collection(db, "quizzes"));
            setQuizzes(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) {
            console.error("Error loading quizzes:", err);
        }
    };

    const loadMyResults = async () => {
        if (!authUser) return;
        try {
            // fetch by email AND by uid (covers old docs saved before email fix)
            const queries = [];
            if (authUser.email) queries.push(getDocs(query(collection(db, "quiz_results"), where("userEmail", "==", authUser.email))));
            if (authUser.uid)   queries.push(getDocs(query(collection(db, "quiz_results"), where("userId",    "==", authUser.uid))));

            const snaps = await Promise.all(queries);
            const seen = new Set<string>();
            const all: any[] = [];
            snaps.forEach(snap => snap.docs.forEach(d => {
                if (!seen.has(d.id)) { seen.add(d.id); all.push({ id: d.id, ...d.data() }); }
            }));

            all.sort((a, b) => (b.completedAt?.seconds ?? 0) - (a.completedAt?.seconds ?? 0));
            const map: Record<string, any> = {};
            all.forEach(r => { if (!map[r.quizId]) map[r.quizId] = r; });
            setMyResults(map);
        } catch (err) {
            console.error("Error loading my results:", err);
        }
    };

    const uploadInstruction = async () => {
        if (!file || !workerType) { toast.error("Izaberite tip radnika i PDF fajl"); return; }
        if (!file.name.toLowerCase().endsWith(".pdf")) { toast.error("Dozvoljen je samo PDF format"); return; }
        if (!userId || !currentUser?.customerId) { toast.error("Morate biti prijavljeni da biste uploadovali PDF"); return; }
        setUploading(true);
        try {
            const uniqueName = `${Date.now()}-${file.name}`;
            const filePath = `training-instructions/${currentUser.customerId}/${workerType}/${uniqueName}`;
            const storageRef = ref(getStorage(), filePath);
            await uploadBytes(storageRef, file);
            const fileUrl = makeStorageUrl(filePath);
            const docRef = await addDoc(collection(db, "training-instructions"), {
                customerId: currentUser.customerId,
                customerName: currentUser.customerName ?? "",
                workerType,
                fileName: file.name,
                filePath,
                fileUrl,
                uploadedBy: userId,
                createdAt: serverTimestamp(),
            });
            setModules(prev => [...prev, { id: docRef.id, position_code: workerType, fileName: file.name, fileUrl, filePath, isPublic: false, content_type: "DOCUMENT" }]);
            calculatePositionCounters();
            toast.success("Instrukcija uspješno uploadovana!");
            setFile(null); setWorkerType(""); setFileInputKey(Date.now());
        } catch (err) { console.error(err); toast.error("Greška pri uploadu PDF-a. Pokušajte ponovo."); }
        finally { setUploading(false); }
    };

    const deletePdf = async () => {
        if (!deleteTarget) return;
        try {
            if (!deleteTarget.isPublic) {
                // Delete from Storage
                if (deleteTarget.filePath) {
                    try { await deleteObject(ref(getStorage(), deleteTarget.filePath)); } catch { /* may already be gone */ }
                }
                // Delete from Firestore
                await deleteDoc(doc(db, "training-instructions", deleteTarget.id));
                setModules(prev => prev.filter(m => m.id !== deleteTarget.id));
            } else {
                setPublicModules(prev => prev.filter(m => m.id !== deleteTarget.id));
            }
            setDeleteTarget(null);
            calculatePositionCounters();
        } catch { toast.error("Greška pri brisanju PDF-a"); }
    };

    const deleteQuiz = async () => {
        if (!deleteQuizTarget) return;
        try {
            await deleteDoc(doc(db, "quizzes", deleteQuizTarget.id));
            setQuizzes(prev => prev.filter(q => q.id !== deleteQuizTarget.id));
            setDeleteQuizTarget(null);
        } catch { toast.error("Greška pri brisanju kviza"); }
    };

    const filteredQuizzes = workerRoleKey
        ? quizzes.filter(q => q.role === workerRoleKey)
        : quizFilter === "all" ? quizzes : quizzes.filter(q => q.role === quizFilter);

    return (
        <div className="space-y-6">
        <WorkerHeader />

        {/* ── QUIZ MODAL ── */}
        {activeQuiz && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">

                    {!quizDone ? (() => {
                        const q = activeQuiz.questions[qIndex];
                        const total = activeQuiz.questions.length;
                        const pct = Math.round((timeLeft / (activeQuiz.timePerQuestion ?? 60)) * 100);
                        return (
                            <div className="p-6 space-y-5">
                                {/* header */}
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{activeQuiz.title}</span>
                                    <span className="text-xs font-bold text-slate-400">{qIndex + 1} / {total}</span>
                                </div>

                                {/* progress bar */}
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${((qIndex) / total) * 100}%` }} />
                                </div>

                                {/* timer */}
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${pct > 50 ? 'bg-emerald-500' : pct > 20 ? 'bg-amber-400' : 'bg-red-500'}`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <span className={`text-sm font-bold w-8 text-right ${pct <= 20 ? 'text-red-500' : 'text-slate-600'}`}>{timeLeft}s</span>
                                </div>

                                {/* question */}
                                <p className="text-lg font-bold text-slate-900 leading-snug">{q.question}</p>

                                {/* options */}
                                <div className="space-y-2">
                                    {q.options.map((opt: string, i: number) => (
                                        <button
                                            key={i}
                                            onClick={() => { setSelected(i); commitAnswer(i); }}
                                            disabled={selected !== null}
                                            className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium
                                                ${selected === i ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50 text-slate-700'}
                                                disabled:cursor-not-allowed`}
                                        >
                                            <span className="font-bold mr-2 text-slate-400">{String.fromCharCode(65 + i)}.</span>{opt}
                                        </button>
                                    ))}
                                </div>

                                <button onClick={closeQuiz} className="w-full text-center text-xs text-slate-400 hover:text-slate-600 pt-1">Odustani</button>
                            </div>
                        );
                    })() : (
                        /* Results screen */
                        <div className="p-8 text-center space-y-5">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${passed ? 'bg-emerald-100' : 'bg-red-100'}`}>
                                {passed
                                    ? <CheckCircle className="w-10 h-10 text-emerald-600" />
                                    : <XCircle className="w-10 h-10 text-red-500" />}
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">{passed ? 'Položio/la si! 🎉' : 'Nisi položio/la'}</h2>
                                <p className="text-slate-500 mt-1 text-sm">{activeQuiz.title}</p>
                            </div>

                            <div className="bg-slate-50 rounded-xl p-4 space-y-1">
                                <p className="text-4xl font-black text-slate-900">{scoreCorrect} / {activeQuiz.questions.length}</p>
                                <p className="text-sm text-slate-500">tačnih odgovora</p>
                                <p className={`text-sm font-semibold mt-1 ${passed ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {passed ? `✓ Položio/la si (${PASS_PERCENT}% prolazna ocjena)` : `✗ Potrebno ${PASS_PERCENT}% tačnih za prolaz`}
                                </p>
                            </div>

                            {/* per-question breakdown */}
                            <div className="text-left space-y-1 max-h-48 overflow-y-auto pr-1">
                                {activeQuiz.questions.map((q: any, i: number) => {
                                    const correct = answers[i] === q.correct;
                                    return (
                                        <div key={i} className={`flex items-start gap-2 text-xs px-3 py-2 rounded-lg ${correct ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
                                            {correct ? <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> : <XCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />}
                                            <span className="leading-tight">{q.question}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex gap-3 pt-1">
                                <button onClick={() => startQuiz(activeQuiz)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50">
                                    <RotateCcw className="w-4 h-4" /> Pokušaj ponovo
                                </button>
                                <button onClick={closeQuiz} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">
                                    Zatvori
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}
            {/* Delete PDF confirm */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-slate-900">Obriši PDF?</h3>
                        <p className="mt-2 text-slate-600">Da li ste sigurni da želite obrisati <span className="font-semibold">{deleteTarget.fileName}</span>?</p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50">Otkaži</button>
                            <button onClick={deletePdf} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">Obriši</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Quiz confirm */}
            {deleteQuizTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-slate-900">Obriši kviz?</h3>
                        <p className="mt-2 text-slate-600">Da li ste sigurni da želite obrisati <span className="font-semibold">"{deleteQuizTarget.title}"</span>? Ova akcija je nepovratna.</p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={() => setDeleteQuizTarget(null)} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50">Otkaži</button>
                            <button onClick={deleteQuiz} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">Obriši</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-start justify-between gap-4">`n                {isManager && (
                    <button onClick={() => navigate('/app/create-quiz')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold flex-shrink-0 mt-1">
                        <PlusCircle className="w-4 h-4" />
                        Kreiraj kviz
                    </button>
                )}
            </div>

            {/* Upload Section — manager only */}
            {isManager && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">📄 Upload PDF instrukcija</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <select value={workerType} onChange={e => setWorkerType(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2">
                            <option value="">Izaberite tip radnika</option>
                            {workerTypes.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
                        </select>
                        <input key={fileInputKey} type="file" accept="application/pdf" onChange={e => setFile(e.target.files?.[0] || null)} className="border border-slate-300 rounded-lg px-3 py-2" />
                        <button onClick={uploadInstruction} disabled={uploading} className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50">
                            {uploading ? "Uploadujem..." : "Upload PDF"}
                        </button>
                    </div>
                </div>
            )}

            {/* ── QUIZZES ── */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        Kvizovi ({quizzes.length})
                    </h3>
                    {/* Role filter — hidden for workers */}
                    {!isWorker && <div className="flex gap-2 flex-wrap">
                        {["all", ...Object.keys(ROLE_LABELS)].map(r => (
                            <button
                                key={r}
                                onClick={() => setQuizFilter(r)}
                                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${quizFilter === r ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                            >
                                {r === "all" ? "Svi" : ROLE_LABELS[r]}
                            </button>
                        ))}
                    </div>}
                </div>

                {filteredQuizzes.length === 0 ? (
                    <p className="text-center py-8 text-slate-400">Nema kreiranih kvizova.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredQuizzes.map(quiz => (
                            <div key={quiz.id} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-sm leading-tight">{quiz.title}</h4>
                                        <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                                            {ROLE_LABELS[quiz.role] ?? quiz.role}
                                        </span>
                                    </div>
                                    {isManager && (
                                        <div className="flex gap-1 flex-shrink-0">
                                            <button
                                                onClick={() => navigate(`/app/create-quiz?id=${quiz.id}`)}
                                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Uredi kviz"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteQuizTarget(quiz)}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Obriši kviz"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-4 text-xs text-slate-500">
                                    <span className="flex items-center gap-1">
                                        <FileText className="w-3 h-3" />
                                        {quiz.questions?.length ?? 0} pitanja
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {quiz.timePerQuestion ?? 60}s / pitanju
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        ~{Math.round(((quiz.timePerQuestion ?? 60) * (quiz.questions?.length ?? 0)) / 60)} min
                                    </span>
                                </div>

                                {(() => {
                                    const r = myResults[quiz.id];
                                    if (!r) return null;
                                    const completedMs = r.completedAt?.seconds ? r.completedAt.seconds * 1000 : null;
                                    const cooldownMs = 24 * 60 * 60 * 1000;
                                    const nextAllowed = completedMs ? completedMs + cooldownMs : null;
                                    const remaining = nextAllowed ? nextAllowed - Date.now() : 0;
                                    const locked = remaining > 0;
                                    const hrs = Math.floor(remaining / 3600000);
                                    const mins = Math.floor((remaining % 3600000) / 60000);
                                    return (
                                        <div className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold ${r.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                                            <span>{r.passed ? '✓ Položio/la' : '✗ Nije položio/la'}</span>
                                            <span>{r.score}/{r.total} — {r.percentage}%</span>
                                            {locked && <span className="ml-2 text-slate-400">⏳ {hrs}h {mins}m</span>}
                                        </div>
                                    );
                                })()}

                                {(() => {
                                    const r = myResults[quiz.id];
                                    const completedMs = r?.completedAt?.seconds ? r.completedAt.seconds * 1000 : null;
                                    const remaining = completedMs ? (completedMs + 24 * 60 * 60 * 1000) - Date.now() : 0;
                                    const locked = remaining > 0;
                                    const hrs = Math.floor(remaining / 3600000);
                                    const mins = Math.floor((remaining % 3600000) / 60000);
                                    return locked ? (
                                        <div className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-400 rounded-lg text-sm font-semibold cursor-not-allowed">
                                            <Clock className="w-4 h-4" /> Dostupno za {hrs}h {mins}m
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => startQuiz(quiz)}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold transition-colors"
                                        >
                                            <ChevronRight className="w-4 h-4" /> {r ? 'Ponovi test' : 'Započni test'}
                                        </button>
                                    );
                                })()}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── PDF Modules ── */}
            <div className="space-y-4">
                {isWorker ? null : (
                    <div className="flex items-center gap-3">
                        <label className="text-sm font-semibold text-slate-600 whitespace-nowrap">Pozicija:</label>
                        <select
                            value={selectedPosition ?? ""}
                            onChange={e => setSelectedPosition(e.target.value || null)}
                            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[220px]"
                        >
                            <option value="">— Odaberite poziciju —</option>
                            {visiblePositions
                                .filter(p => (positionCounters[p.code] || 0) > 0)
                                .map(p => (
                                    <option key={p.code} value={p.code}>
                                        {p.name_bs} ({positionCounters[p.code]} PDF)
                                    </option>
                                ))}
                        </select>
                    </div>
                )}

                <div className="lg:col-span-3">
                    {selectedPosition ? (() => {
                        const allMods = getPositionModules(selectedPosition);
                        const publicMods = allMods.filter(m => m.isPublic);
                        const internalMods = allMods.filter(m => !m.isPublic);
                        return (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-slate-900">
                                Moduli za: {positions.find(p => p.code === selectedPosition)?.name_bs}
                            </h2>

                            {/* Public docs */}
                            {publicMods.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wide">🌐 Javni dokumenti</span>
                                        <span className="text-xs text-slate-400">{publicMods.length} PDF</span>
                                    </div>
                                    <div className="space-y-3">
                                        {publicMods.map(module => {
                                const Icon = contentTypeIcons[module.content_type as keyof typeof contentTypeIcons];
                                return (
                                    <div key={module.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-blue-300 transition-all">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-4 flex-1">
                                                <div className={`p-3 rounded-lg ${contentTypeColors[module.content_type as keyof typeof contentTypeColors]}`}>
                                                    <Icon className="w-6 h-6" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                                        {module.fileName}
                                                        {module.isPublic && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-xs font-semibold">Javno</span>}
                                                    </h3>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <a href={module.fileUrl} target="_blank" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
                                                    Otvori
                                                </a>
                                                {isManager && (
                                                    <button onClick={() => setDeleteTarget(module)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                                    </div>
                                </div>
                            )}

                            {/* Internal docs */}
                            {internalMods.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wide">🔒 Interni dokumenti</span>
                                        <span className="text-xs text-slate-400">{internalMods.length} PDF</span>
                                    </div>
                                    <div className="space-y-3">
                                        {internalMods.map(module => {
                                            const Icon = contentTypeIcons[module.content_type as keyof typeof contentTypeIcons];
                                            return (
                                                <div key={module.id} className="bg-white rounded-xl shadow-sm border border-blue-100 p-6 hover:shadow-md hover:border-blue-300 transition-all">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-start gap-4 flex-1">
                                                            <div className={`p-3 rounded-lg ${contentTypeColors[module.content_type as keyof typeof contentTypeColors]}`}>
                                                                <Icon className="w-6 h-6" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <h3 className="text-lg font-bold text-slate-900">{module.fileName}</h3>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <a href={module.fileUrl} target="_blank" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
                                                                Otvori
                                                            </a>
                                                            {isManager && (
                                                                <button onClick={() => setDeleteTarget(module)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {allMods.length === 0 && (
                                <div className="text-center py-12 text-slate-500">Nema dostupnih modula za ovu poziciju</div>
                            )}
                        </div>
                        );
                    })() : (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                            <GraduationCap className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <p className="text-lg text-slate-600">Izaberite poziciju da vidite dostupne module za obuku</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

