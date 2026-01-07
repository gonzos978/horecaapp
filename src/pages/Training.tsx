import { useState, useEffect } from 'react';
import { GraduationCap, Play, FileText, Award, Clock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/Header';
import { getDownloadURL, getStorage, ref, uploadBytes, listAll } from "firebase/storage";
import { addDoc, collection, serverTimestamp} from "firebase/firestore";
import { db } from "../fb/firebase.ts";
import { getAuth } from "firebase/auth";

export default function Training() {
    const { t, language } = useLanguage();

    const [positions, setPositions] = useState<any[]>([]);

    // @ts-ignore
    const [modules, setModules] = useState<any[]>([]);
    const [selectedPosition, setSelectedPosition] = useState<string | null>(null);

    const [uploading, setUploading] = useState(false);
    const [workerType, setWorkerType] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [fileInputKey, setFileInputKey] = useState(Date.now());
    const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
    const [positionCounters, setPositionCounters] = useState<Record<string, number>>({});

    const auth = getAuth();
    const user = auth.currentUser;
    const userId = user?.uid;

    const workerTypes = [
        { value: "konobar", label: "Konobar" },
        { value: "kuvar", label: "Kuvar" },
        { value: "sobarica", label: "Sobarica" },
        { value: "sanker", label: "Šanker" },
    ];

    useEffect(() => {
        loadPositions();
        loadUploadedFiles();
    }, []);

    const loadPositions = async () => {
        const pos = [
            { id: '1', code: 'konobar', name_en: 'Waiter', name_bs: 'Konobar' },
            { id: '2', code: 'kuvar', name_en: 'Chef', name_bs: 'Kuvar' },
            { id: '3', code: 'sobarica', name_en: 'Housekeeper', name_bs: 'Sobarica' },
            { id: '4', code: 'sanker', name_en: 'Barman', name_bs: 'Šanker' },
        ];
        setPositions(pos);
    };

    const loadUploadedFiles = async () => {
        if (!userId) return;

        const storage = getStorage();
        const counters: Record<string, number> = {};
        const files: any[] = [];

        // For each worker type, check the folder in Storage
        for (const w of workerTypes) {
            const folderRef = ref(storage, `training-instructions/${userId}/${w.value}`);
            try {
                const list = await listAll(folderRef);
                counters[w.value] = list.items.length;

                // Also build uploaded files list
                for (const itemRef of list.items) {
                    const url = await getDownloadURL(itemRef);
                    files.push({
                        fileName: itemRef.name,
                        fileUrl: url,
                        workerType: w.value
                    });
                }
            } catch (err) {
                // If folder doesn’t exist, just continue
                counters[w.value] = 0;
            }
        }
        console.log("Uploaded files:", files);
        setUploadedFiles(files);
        setPositionCounters(counters);
    };

    const uploadInstruction = async () => {
        if (!file || !workerType) {
            alert("Izaberite tip radnika i PDF fajl");
            return;
        }

        if (!file.name.toLowerCase().endsWith(".pdf")) {
            alert("Dozvoljen je samo PDF");
            return;
        }

        if (!userId) {
            alert("Morate biti prijavljeni da biste uploadovali PDF");
            return;
        }

        setUploading(true);
        try {
            const uniqueName = `${Date.now()}-${file.name}`;
            const storageRef = ref(getStorage(), `training-instructions/${userId}/${workerType}/${uniqueName}`);

            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            // Store in Firestore
            await addDoc(collection(db, "training-instructions"), {
                workerType,
                fileUrl: downloadURL,
                fileName: file.name,
                uploadedAt: serverTimestamp(),
                userId
            });

            setUploadedFiles(prev => [...prev, { fileName: file.name, fileUrl: downloadURL, workerType }]);
            setPositionCounters(prev => ({
                ...prev,
                [workerType]: (prev[workerType] || 0) + 1
            }));

            alert("Instrukcija uspješno uploadovana");

            setFile(null);
            setWorkerType("");
            setFileInputKey(Date.now());
        } catch (err: any) {
            console.error("Full Error Object:", err);
            console.log("Error Code:", err.code);
            console.log("Error Message:", err.message);
            alert(`Greška: ${err.code || 'Unknown error'}`);
        } finally {
            setUploading(false);
        }
    };

    const getPositionModules = (positionCode: string) => {
        return modules.filter(m => m.position_code === positionCode);
    };

    const contentTypeIcons = { VIDEO: Play, QUIZ: FileText, PRACTICE: Award, DOCUMENT: FileText, INTERACTIVE: Award };
    const contentTypeColors = { VIDEO: 'bg-red-100 text-red-800', QUIZ: 'bg-blue-100 text-blue-800', PRACTICE: 'bg-purple-100 text-purple-800', DOCUMENT: 'bg-slate-100 text-slate-800', INTERACTIVE: 'bg-emerald-100 text-emerald-800' };

    return (
        <div className="space-y-6">
            <Header title={t('training.title')} subtitle={`${positions.length} pozicija, ${modules.length} modula`} />

            {/* Upload Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">📄 Upload PDF instrukcija</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <select value={workerType} onChange={e => setWorkerType(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2">
                        <option value="">Izaberite tip radnika</option>
                        {workerTypes.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
                    </select>

                    <input
                        key={fileInputKey}
                        type="file"
                        accept="application/pdf"
                        onChange={e => setFile(e.target.files?.[0] || null)}
                        className="border border-slate-300 rounded-lg px-3 py-2"
                    />

                    <button
                        onClick={uploadInstruction}
                        disabled={uploading}
                        className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
                    >
                        {uploading ? "Uploadujem..." : "Upload PDF"}
                    </button>
                </div>

                {uploadedFiles.length > 0 && (
                    <div className="mt-6">
                        <h4 className="text-md font-semibold text-slate-700 mb-2">Uploaded PDFs</h4>
                        <ul className="list-disc list-inside space-y-1">
                            {uploadedFiles.map(file => (
                                <li key={file.fileUrl}>
                                    <a href={file.fileUrl} target="_blank" className="text-blue-600 hover:underline">
                                        {file.fileName} ({file.workerType})
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Positions + Modules with PDF counters */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 space-y-2">
                    <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider px-2">Pozicije</h3>
                    <div className="space-y-1">
                        {positions.slice(0, 20).map(position => {
                            const isSelected = selectedPosition === position.code;
                            const posModules = getPositionModules(position.code);
                            const nameKey = `name_${language}` as keyof typeof position;
                            const counter = positionCounters[position.code] || 0;

                            return (
                                <button
                                    key={position.id}
                                    onClick={() => setSelectedPosition(position.code)}
                                    className={`w-full text-left px-4 py-3 rounded-lg transition-all ${isSelected ? 'bg-blue-600 text-white shadow-md' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'}`}
                                >
                                    <div className="font-medium">{position[nameKey]}</div>
                                    <div className={`text-xs mt-1 ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                                        {posModules.length} modula • {counter} PDF
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Modules Section */}
                <div className="lg:col-span-3">
                    {selectedPosition ? (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-slate-900">
                                Moduli za: {positions.find(p => p.code === selectedPosition)?.[`name_${language}`]}
                            </h2>

                            {getPositionModules(selectedPosition).map(module => {
                                const Icon = contentTypeIcons[module.content_type as keyof typeof contentTypeIcons];
                                const titleKey = `title_${language}` as keyof typeof module;

                                return (
                                    <div key={module.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-blue-300 transition-all">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-4 flex-1">
                                                <div className={`p-3 rounded-lg ${contentTypeColors[module.content_type as keyof typeof contentTypeColors]}`}>
                                                    <Icon className="w-6 h-6" />
                                                </div>

                                                <div className="flex-1">
                                                    <h3 className="text-lg font-bold text-slate-900">{module[titleKey]}</h3>
                                                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-4 h-4" />
                                                            {module.duration_minutes} min
                                                        </span>
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${contentTypeColors[module.content_type as keyof typeof contentTypeColors]}`}>
                                                            {module.content_type}
                                                        </span>
                                                        {module.mandatory && <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">Obavezno</span>}
                                                    </div>

                                                    {module.quiz_questions && JSON.parse(module.quiz_questions).length > 0 && (
                                                        <div className="mt-3 text-sm text-slate-600">
                                                            📝 {JSON.parse(module.quiz_questions).length} pitanja • Prolaznost: {module.passing_score}%
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                                                Započni
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}

                            {getPositionModules(selectedPosition).length === 0 && (
                                <div className="text-center py-12 text-slate-500">
                                    Nema dostupnih modula za ovu poziciju
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                            <GraduationCap className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <p className="text-lg text-slate-600">
                                Izaberite poziciju da vidite dostupne module za obuku
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
