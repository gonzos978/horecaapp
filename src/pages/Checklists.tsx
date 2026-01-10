import { useState, useEffect } from 'react';
import { Circle, Trash } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { auth, db } from '../fb/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import Header from '../components/Header';

type Task = { task: string };

type Checklist = {
    id?: string;
    name: string;
    type: string;
    tasks: Task[];
    active: boolean;
    ownerId?: string;
};

const WORKER_TYPES = ['Šanker', 'Sobarica', 'Kuhar', 'Menadžer', 'Konobar'];

export default function Checklists() {
    const { t } = useLanguage();
    const [checklists, setChecklists] = useState<Checklist[]>([]);
    const [selectedWorkerType, setSelectedWorkerType] = useState<string>(WORKER_TYPES[0]);
    const [newChecklistName, setNewChecklistName] = useState('');
    const [newTasks, setNewTasks] = useState<Task[]>([]);

    // ---------------- Load Firestore data ----------------
    useEffect(() => {
        loadChecklists();
    }, []);

    const loadChecklists = async () => {
        try {
            const snapshot = await getDocs(collection(db, 'checklists'));
            const list: Checklist[] = snapshot.docs.map(docSnap => ({
                id: docSnap.id,
                ...docSnap.data()
            } as Checklist));
            setChecklists(list.filter(c => c.active));
        } catch (error) {
            console.error('Error loading checklists:', error);
        }
    };

    // ---------------- Task operations ----------------
    const addTask = () => {
        if (newTasks.length >= 20) return;
        setNewTasks([...newTasks, { task: '' }]);
    };

    const updateTask = (index: number, value: string) => {
        const updated = [...newTasks];
        updated[index].task = value;
        setNewTasks(updated);
    };

    const removeTask = (index: number) => {
        const updated = [...newTasks];
        updated.splice(index, 1);
        setNewTasks(updated);
    };

    // ---------------- Save new checklist ----------------
    const saveChecklist = async () => {
        if (!selectedWorkerType || !newChecklistName || newTasks.length === 0) return;

        const checklist: Checklist = {
            name: newChecklistName,
            type: selectedWorkerType,
            tasks: newTasks,
            active: true,
            ownerId: auth.currentUser!.uid
        };

        try {
            const docRef = await addDoc(collection(db, 'checklists'), checklist);
            setChecklists([...checklists, { id: docRef.id, ...checklist }]);
            setNewChecklistName('');
            setNewTasks([]);
        } catch (error) {
            console.error('Error adding checklist:', error);
        }
    };

    // ---------------- Delete checklist ----------------
    const deleteChecklist = async (id: string) => {
        if (!window.confirm('Obrisati checklistu?')) return;

        try {
            await deleteDoc(doc(db, 'checklists', id));
            setChecklists(prev => prev.filter(c => c.id !== id));
        } catch (err) {
            console.error('Error deleting checklist:', err);
        }
    };

    return (
        <div className="space-y-6">
            <Header title={t('checklist.title')} subtitle={`${checklists.length} aktivnih listi`} />

            {/* Add New Checklist */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 space-y-4">
                <h3 className="text-lg font-bold text-slate-900">Dodaj novu checklistu</h3>

                <div className="flex flex-col md:flex-row gap-4">
                    <input
                        type="text"
                        placeholder="Naziv checkliste"
                        value={newChecklistName}
                        onChange={e => setNewChecklistName(e.target.value)}
                        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <select
                        value={selectedWorkerType}
                        onChange={e => setSelectedWorkerType(e.target.value)}
                        className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {WORKER_TYPES.map(type => (
                            <option key={type} value={type}>
                                {type}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    {newTasks.map((task, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                            <input
                                type="text"
                                placeholder={`Zadatak #${idx + 1}`}
                                value={task.task}
                                onChange={e => updateTask(idx, e.target.value)}
                                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg"
                            />
                            <button onClick={() => removeTask(idx)} className="text-red-600 hover:text-red-800">
                                <Trash className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                    <button onClick={addTask} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">
                        + Dodaj zadatak
                    </button>
                </div>

                <button
                    onClick={saveChecklist}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-bold"
                >
                    Sačuvaj checklistu
                </button>
            </div>

            {/* Existing Checklists */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {checklists.map(checklist => (
                    <div
                        key={checklist.id}
                        className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative hover:shadow-lg transition-all"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">{checklist.name}</h3>
                                <p className="text-sm text-slate-600 mt-1">{checklist.tasks.length} zadataka</p>
                            </div>
                            <span className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-700">
                {checklist.type}
              </span>
                        </div>

                        <div className="space-y-2">
                            {checklist.tasks.slice(0, 3).map((task, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                                    <Circle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <span>{task.task}</span>
                                </div>
                            ))}
                            {checklist.tasks.length > 3 && (
                                <p className="text-sm text-slate-500 pl-6">+{checklist.tasks.length - 3} više...</p>
                            )}
                        </div>

                        {/* Delete button */}
                        <button
                            onClick={() => deleteChecklist(checklist.id!)}
                            className="absolute top-3 right-3 text-red-600 hover:text-red-800"
                        >
                            <Trash className="w-5 h-5" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
