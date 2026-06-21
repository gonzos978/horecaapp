import { useState, useEffect } from 'react';
import { GraduationCap, Play, FileText, Award, PlusCircle, Clock, Users, Pencil, Trash2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { getDownloadURL, getStorage, ref, uploadBytes, listAll, deleteObject } from "firebase/storage";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../fb/firebase.ts";
import { getAuth } from "firebase/auth";
import { useAuth } from '../contexts/AuthContext';

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
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const isManager = ["manager", "MANAGER", "customer", "CUSTOMER"].includes(currentUser?.role ?? "");

    const [positions, setPositions] = useState<any[]>([]);
    const [modules, setModules] = useState<any[]>([]);
    const [publicModules, setPublicModules] = useState<any[]>([]);
    const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
    const [positionCounters, setPositionCounters] = useState<Record<string, number>>({});
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [quizFilter, setQuizFilter] = useState<string>("all");
    const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
    const [deleteQuizTarget, setDeleteQuizTarget] = useState<any | null>(null);

    const [uploading, setUploading] = useState(false);
    const [workerType, setWorkerType] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [fileInputKey, setFileInputKey] = useState(Date.now());

    const auth = getAuth();
    const user = auth.currentUser;
    const userId = user?.uid;

    const workerTypes = [
        { value: "konobar", label: "Konobar" },
        { value: "kuvar", label: "Kuvar" },
        { value: "sobarica", label: "Sobarica" },
        { value: "sanker", label: "Šanker" },
    ];

    const contentTypeIcons = { VIDEO: Play, QUIZ: FileText, PRACTICE: Award, DOCUMENT: FileText, INTERACTIVE: Award };
    const contentTypeColors = { VIDEO: 'bg-red-100 text-red-800', QUIZ: 'bg-blue-100 text-blue-800', PRACTICE: 'bg-purple-100 text-purple-800', DOCUMENT: 'bg-slate-100 text-slate-800', INTERACTIVE: 'bg-emerald-100 text-emerald-800' };

    useEffect(() => {
        loadPositions();
        loadPublicModules();
        loadQuizzes();
    }, []);

    useEffect(() => {
        if (userId) loadPrivateModules();
    }, [userId]);

    const loadPositions = () => {
        setPositions([
            { id: '1', code: 'konobar', name_en: 'Waiter', name_bs: 'Konobar' },
            { id: '2', code: 'kuvar', name_en: 'Chef', name_bs: 'Kuvar' },
            { id: '3', code: 'sobarica', name_en: 'Housekeeper', name_bs: 'Sobarica' },
            { id: '4', code: 'sanker', name_en: 'Barman', name_bs: 'Šanker' },
        ]);
    };

    const getPositionCodeFromFileName = (fileName: string) => {
        const lower = fileName.toLowerCase();
        if (lower.includes("konobar")) return "konobar";
        if (lower.includes("kuvar")) return "kuvar";
        if (lower.includes("sobarica")) return "sobarica";
        if (lower.includes("šanker") || lower.includes("barmen")) return "sanker";
        return "";
    };

    const getAllModules = () => [...modules, ...publicModules];
    const getPositionModules = (code: string) => getAllModules().filter(m => m.position_code === code);

    const calculatePositionCounters = () => {
        const counters: Record<string, number> = {};
        getAllModules().forEach(m => {
            if (!m.position_code) return;
            counters[m.position_code] = (counters[m.position_code] || 0) + 1;
        });
        setPositionCounters(counters);
    };

    const loadPrivateModules = async () => {
        if (!userId) return;
        const storage = getStorage();
        const allModules: any[] = [];
        for (const w of workerTypes) {
            const folderRef = ref(storage, `training-instructions/${userId}/${w.value}`);
            try {
                const list = await listAll(folderRef);
                for (const itemRef of list.items) {
                    const url = await getDownloadURL(itemRef);
                    allModules.push({ id: itemRef.name, position_code: w.value, fileName: itemRef.name, fileUrl: url, isPublic: false, content_type: "DOCUMENT" });
                }
            } catch { /* folder may not exist */ }
        }
        setModules(allModules);
        calculatePositionCounters();
    };

    const loadPublicModules = async () => {
        try {
            const snapshot = await getDocs(collection(db, "documents"));
            const docs = snapshot.docs.map(d => ({
                id: d.id, isPublic: true,
                fileName: d.data().fileName, fileUrl: d.data().fileUrl,
                position_code: getPositionCodeFromFileName(d.data().fileName),
                content_type: "DOCUMENT",
            }));
            setPublicModules(docs);
            calculatePositionCounters();
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

    const uploadInstruction = async () => {
        if (!file || !workerType) { alert("Izaberite tip radnika i PDF fajl"); return; }
        if (!file.name.toLowerCase().endsWith(".pdf")) { alert("Dozvoljen je samo PDF"); return; }
        if (!userId) { alert("Morate biti prijavljeni da biste uploadovali PDF"); return; }
        setUploading(true);
        try {
            const uniqueName = `${Date.now()}-${file.name}`;
            const storageRef = ref(getStorage(), `training-instructions/${userId}/${workerType}/${uniqueName}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            setModules(prev => [...prev, { id: uniqueName, position_code: workerType, fileName: file.name, fileUrl: downloadURL, isPublic: false, content_type: "DOCUMENT" }]);
            calculatePositionCounters();
            alert("Instrukcija uspješno uploadovana");
            setFile(null); setWorkerType(""); setFileInputKey(Date.now());
        } catch { alert("Greška pri uploadu PDF-a"); }
        finally { setUploading(false); }
    };

    const deletePdf = async () => {
        if (!deleteTarget) return;
        try {
            if (!deleteTarget.isPublic) {
                const fileRef = ref(getStorage(), `training-instructions/${userId}/${deleteTarget.position_code}/${deleteTarget.id}`);
                await deleteObject(fileRef);
                setModules(prev => prev.filter(m => m.id !== deleteTarget.id));
            } else {
                setPublicModules(prev => prev.filter(m => m.id !== deleteTarget.id));
            }
            setDeleteTarget(null);
            calculatePositionCounters();
        } catch { alert("Greška pri brisanju PDF-a"); }
    };

    const deleteQuiz = async () => {
        if (!deleteQuizTarget) return;
        try {
            await deleteDoc(doc(db, "quizzes", deleteQuizTarget.id));
            setQuizzes(prev => prev.filter(q => q.id !== deleteQuizTarget.id));
            setDeleteQuizTarget(null);
        } catch { alert("Greška pri brisanju kviza."); }
    };

    const filteredQuizzes = quizFilter === "all" ? quizzes : quizzes.filter(q => q.role === quizFilter);

    return (
        <div className="space-y-6">
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

            <div className="flex items-start justify-between gap-4">
                <Header title={t('training.title')} subtitle={`${positions.length} pozicija • ${getAllModules().length} modula • ${quizzes.length} kvizova`} />
                {isManager && (
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
                    {/* Role filter */}
                    <div className="flex gap-2 flex-wrap">
                        {["all", ...Object.keys(ROLE_LABELS)].map(r => (
                            <button
                                key={r}
                                onClick={() => setQuizFilter(r)}
                                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${quizFilter === r ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                            >
                                {r === "all" ? "Svi" : ROLE_LABELS[r]}
                            </button>
                        ))}
                    </div>
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
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── PDF Modules ── */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 space-y-2">
                    <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider px-2">Pozicije</h3>
                    <div className="space-y-1">
                        {positions.map(position => {
                            const isSelected = selectedPosition === position.code;
                            const posModules = getPositionModules(position.code);
                            const nameKey = `name_${language}` as keyof typeof position;
                            const counter = positionCounters[position.code] || 0;
                            return (
                                <button key={position.code} onClick={() => setSelectedPosition(position.code)} className={`w-full text-left px-4 py-3 rounded-lg transition-all ${isSelected ? 'bg-blue-600 text-white shadow-md' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'}`}>
                                    <div className="font-medium">{position[nameKey]}</div>
                                    <div className={`text-xs mt-1 ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>{posModules.length} modula • {counter} PDF</div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="lg:col-span-3">
                    {selectedPosition ? (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-slate-900">
                                Moduli za: {positions.find(p => p.code === selectedPosition)?.[`name_${language}`]}
                            </h2>
                            {getPositionModules(selectedPosition).map(module => {
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
                            {getPositionModules(selectedPosition).length === 0 && (
                                <div className="text-center py-12 text-slate-500">Nema dostupnih modula za ovu poziciju</div>
                            )}
                        </div>
                    ) : (
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
