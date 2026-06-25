import { useState, useEffect } from 'react';
import {
    Circle,
    Trash,
    Pencil,
    Save,
    X,
    Plus
} from 'lucide-react';

import { useLanguage } from '../contexts/LanguageContext';
import { auth, db } from '../fb/firebase';

import {
    collection,
    getDocs,
    addDoc,
    deleteDoc,
    doc,
    updateDoc
} from 'firebase/firestore';


type Task = {
    task: string;
};

type Checklist = {
    id?: string;
    name: string;
    type: string;
    tasks: Task[];
    active: boolean;
    ownerId?: string;
};

const WORKER_TYPES = [
    'Šanker',
    'Sobarica',
    'Kuhar',
    'Menadžer',
    'Konobar'
];

export default function Checklists() {

    const { t } = useLanguage();

    const [checklists, setChecklists] = useState<Checklist[]>([]);

    const [selectedWorkerType, setSelectedWorkerType] = useState<string>(
        WORKER_TYPES[0]
    );

    const [newChecklistName, setNewChecklistName] = useState('');

    const [newTasks, setNewTasks] = useState<Task[]>([]);

    // EDIT STATE
    const [editingId, setEditingId] = useState<string | null>(null);

    const [editData, setEditData] = useState<Checklist | null>(null);

    // ---------------- LOAD ----------------
    useEffect(() => {
        loadChecklists();
    }, []);

    const loadChecklists = async () => {

        try {

            const snapshot = await getDocs(
                collection(db, 'checklists')
            );

            const list: Checklist[] = snapshot.docs.map(docSnap => ({
                id: docSnap.id,
                ...docSnap.data()
            } as Checklist));

            setChecklists(list.filter(c => c.active));

        } catch (error) {

            console.error('Error loading checklists:', error);
        }
    };

    // ---------------- NEW TASKS ----------------
    const addTask = () => {

        if (newTasks.length >= 20) return;

        setNewTasks([
            ...newTasks,
            { task: '' }
        ]);
    };

    const updateTask = (
        index: number,
        value: string
    ) => {

        const updated = [...newTasks];

        updated[index].task = value;

        setNewTasks(updated);
    };

    const removeTask = (index: number) => {

        const updated = [...newTasks];

        updated.splice(index, 1);

        setNewTasks(updated);
    };

    // ---------------- SAVE NEW ----------------
    const saveChecklist = async () => {

        if (
            !selectedWorkerType ||
            !newChecklistName ||
            newTasks.length === 0
        ) return;

        const checklist: Checklist = {
            name: newChecklistName,
            type: selectedWorkerType,
            tasks: newTasks,
            active: true,
            ownerId: auth.currentUser!.uid
        };

        try {

            const docRef = await addDoc(
                collection(db, 'checklists'),
                checklist
            );

            setChecklists([
                ...checklists,
                {
                    id: docRef.id,
                    ...checklist
                }
            ]);

            setNewChecklistName('');
            setNewTasks([]);

        } catch (error) {

            console.error('Error adding checklist:', error);
        }
    };

    // ---------------- DELETE ----------------
    const deleteChecklist = async (id: string) => {

        if (!window.confirm('Obrisati checklistu?')) return;

        try {

            await deleteDoc(
                doc(db, 'checklists', id)
            );

            setChecklists(prev =>
                prev.filter(c => c.id !== id)
            );

        } catch (err) {

            console.error('Error deleting checklist:', err);
        }
    };

    // ---------------- EDIT ----------------
    const startEdit = (checklist: Checklist) => {

        setEditingId(checklist.id!);

        setEditData({
            ...checklist,
            tasks: [...checklist.tasks]
        });
    };

    const cancelEdit = () => {

        setEditingId(null);
        setEditData(null);
    };

    const updateEditTask = (
        index: number,
        value: string
    ) => {

        if (!editData) return;

        const updated = [...editData.tasks];

        updated[index].task = value;

        setEditData({
            ...editData,
            tasks: updated
        });
    };

    const removeEditTask = (index: number) => {

        if (!editData) return;

        const updated = [...editData.tasks];

        updated.splice(index, 1);

        setEditData({
            ...editData,
            tasks: updated
        });
    };

    const addEditTask = () => {

        if (!editData) return;

        setEditData({
            ...editData,
            tasks: [
                ...editData.tasks,
                { task: '' }
            ]
        });
    };

    const saveEdit = async () => {

        if (!editData || !editData.id) return;

        try {

            await updateDoc(
                doc(db, 'checklists', editData.id),
                {
                    name: editData.name,
                    type: editData.type,
                    tasks: editData.tasks
                }
            );

            setChecklists(prev =>
                prev.map(c =>
                    c.id === editData.id
                        ? editData
                        : c
                )
            );

            cancelEdit();

        } catch (err) {

            console.error('Error updating checklist:', err);
        }
    };

    return (
        <div className="space-y-6">


            {/* ADD NEW */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-5">

                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-900">
                        Dodaj novu checklistu
                    </h3>
                </div>

                <div className="flex flex-col md:flex-row gap-4">

                    <input
                        type="text"
                        placeholder="Naziv checkliste"
                        value={newChecklistName}
                        onChange={e =>
                            setNewChecklistName(e.target.value)
                        }
                        className="
                            flex-1
                            px-5
                            py-3
                            rounded-2xl
                            border
                            border-slate-300
                            bg-slate-50
                            focus:outline-none
                            focus:ring-4
                            focus:ring-blue-100
                        "
                    />

                    <select
                        value={selectedWorkerType}
                        onChange={e =>
                            setSelectedWorkerType(e.target.value)
                        }
                        className="
                            px-5
                            py-3
                            rounded-2xl
                            border
                            border-slate-300
                            bg-slate-50
                        "
                    >
                        {WORKER_TYPES.map(type => (
                            <option
                                key={type}
                                value={type}
                            >
                                {type}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-3">

                    {newTasks.map((task, idx) => (

                        <div
                            key={idx}
                            className="flex items-center gap-3"
                        >

                            <input
                                type="text"
                                placeholder={`Zadatak #${idx + 1}`}
                                value={task.task}
                                onChange={e =>
                                    updateTask(
                                        idx,
                                        e.target.value
                                    )
                                }
                                className="
                                    flex-1
                                    px-4
                                    py-3
                                    rounded-2xl
                                    border
                                    border-slate-300
                                    bg-slate-50
                                "
                            />

                            <button
                                onClick={() =>
                                    removeTask(idx)
                                }
                                className="
                                    w-11
                                    h-11
                                    rounded-xl
                                    bg-red-100
                                    text-red-600
                                    flex
                                    items-center
                                    justify-center
                                    hover:bg-red-200
                                "
                            >
                                <Trash className="w-5 h-5" />
                            </button>
                        </div>
                    ))}

                    <button
                        onClick={addTask}
                        className="
                            flex
                            items-center
                            gap-2
                            px-5
                            py-3
                            rounded-2xl
                            bg-blue-100
                            text-blue-700
                            hover:bg-blue-200
                            font-semibold
                        "
                    >
                        <Plus className="w-4 h-4" />
                        Dodaj zadatak
                    </button>
                </div>

                <button
                    onClick={saveChecklist}
                    className="
                        px-6
                        py-3
                        rounded-2xl
                        bg-emerald-600
                        hover:bg-emerald-700
                        text-white
                        font-bold
                        transition
                    "
                >
                    Sačuvaj checklistu
                </button>
            </div>

            {/* CHECKLISTS */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

                {checklists.map(checklist => {

                    const isEditing =
                        editingId === checklist.id;

                    return (
                        <div
                            key={checklist.id}
                            className="
                                bg-white
                                rounded-3xl
                                shadow-sm
                                border
                                border-slate-200
                                p-6
                                hover:shadow-xl
                                transition-all
                            "
                        >

                            {/* HEADER */}
                            <div className="flex items-start justify-between mb-5">

                                <div className="flex-1">

                                    {isEditing ? (
                                        <input
                                            value={editData?.name || ''}
                                            onChange={e =>
                                                setEditData(prev => ({
                                                    ...prev!,
                                                    name: e.target.value
                                                }))
                                            }
                                            className="
                                                w-full
                                                px-4
                                                py-2
                                                rounded-xl
                                                border
                                                border-slate-300
                                            "
                                        />
                                    ) : (
                                        <h3 className="text-xl font-black text-slate-900">
                                            {checklist.name}
                                        </h3>
                                    )}

                                    <p className="text-sm text-slate-500 mt-2">
                                        {checklist.tasks.length} zadataka
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">

                                    <span className="
                                        px-3
                                        py-1
                                        rounded-xl
                                        text-xs
                                        font-semibold
                                        bg-blue-100
                                        text-blue-700
                                    ">
                                        {isEditing
                                            ? editData?.type
                                            : checklist.type}
                                    </span>

                                    {!isEditing ? (
                                        <>
                                            <button
                                                onClick={() =>
                                                    startEdit(checklist)
                                                }
                                                className="
                                                    w-10
                                                    h-10
                                                    rounded-xl
                                                    bg-amber-100
                                                    text-amber-600
                                                    flex
                                                    items-center
                                                    justify-center
                                                "
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>

                                            <button
                                                onClick={() =>
                                                    deleteChecklist(checklist.id!)
                                                }
                                                className="
                                                    w-10
                                                    h-10
                                                    rounded-xl
                                                    bg-red-100
                                                    text-red-600
                                                    flex
                                                    items-center
                                                    justify-center
                                                "
                                            >
                                                <Trash className="w-4 h-4" />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={saveEdit}
                                                className="
                                                    w-10
                                                    h-10
                                                    rounded-xl
                                                    bg-emerald-100
                                                    text-emerald-600
                                                    flex
                                                    items-center
                                                    justify-center
                                                "
                                            >
                                                <Save className="w-4 h-4" />
                                            </button>

                                            <button
                                                onClick={cancelEdit}
                                                className="
                                                    w-10
                                                    h-10
                                                    rounded-xl
                                                    bg-slate-100
                                                    text-slate-600
                                                    flex
                                                    items-center
                                                    justify-center
                                                "
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* TASKS */}
                            <div className="space-y-3">

                                {(isEditing
                                        ? editData?.tasks
                                        : checklist.tasks
                                )?.map((task, idx) => (

                                    <div
                                        key={idx}
                                        className="
                                            flex
                                            items-start
                                            gap-3
                                        "
                                    >

                                        <Circle className="
                                            w-4
                                            h-4
                                            mt-1
                                            text-slate-400
                                            flex-shrink-0
                                        " />

                                        {isEditing ? (
                                            <div className="flex-1 flex gap-2">

                                                <input
                                                    type="text"
                                                    value={task.task}
                                                    onChange={e =>
                                                        updateEditTask(
                                                            idx,
                                                            e.target.value
                                                        )
                                                    }
                                                    className="
                                                        flex-1
                                                        px-4
                                                        py-2
                                                        rounded-xl
                                                        border
                                                        border-slate-300
                                                        bg-slate-50
                                                    "
                                                />

                                                <button
                                                    onClick={() =>
                                                        removeEditTask(idx)
                                                    }
                                                    className="
                                                        w-10
                                                        h-10
                                                        rounded-xl
                                                        bg-red-100
                                                        text-red-600
                                                        flex
                                                        items-center
                                                        justify-center
                                                    "
                                                >
                                                    <Trash className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-slate-700">
                                                {task.task}
                                            </span>
                                        )}
                                    </div>
                                ))}

                                {isEditing && (
                                    <button
                                        onClick={addEditTask}
                                        className="
                                            mt-3
                                            flex
                                            items-center
                                            gap-2
                                            px-4
                                            py-2
                                            rounded-xl
                                            bg-blue-100
                                            text-blue-700
                                            hover:bg-blue-200
                                            text-sm
                                            font-semibold
                                        "
                                    >
                                        <Plus className="w-4 h-4" />
                                        Dodaj zadatak
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}