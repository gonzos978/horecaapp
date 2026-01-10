import { useState, useEffect } from 'react';
import { UtensilsCrossed, TrendingUp, DollarSign, Trash, Pencil } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { auth, db } from '../fb/firebase';
import {collection, getDocs, addDoc, deleteDoc, doc, updateDoc} from 'firebase/firestore';
import Header from '../components/Header';

type MenuItem = {
    id?: string;
    name: string;
    name_en?: string;
    category: string;
    price: number;
    cost: number;
    prep_time_minutes: number;
    available: boolean;
    image_url?: string;
    ownerId?: string;
};

const CATEGORIES = ['APPETIZER', 'MAIN', 'DESSERT', 'BEVERAGE', 'ALCOHOL', 'COFFEE', 'SIDE'];

export default function Menu() {
    const { t } = useLanguage();
    const [items, setItems] = useState<MenuItem[]>([]);
    const [newItem, setNewItem] = useState<MenuItem>({
        name: '',
        name_en: '',
        category: CATEGORIES[0],
        price: 0,
        cost: 0,
        prep_time_minutes: 0,
        available: true,
        image_url: '',
    });
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);



    // ---------------- Load menu items ----------------
    useEffect(() => {
        loadItems();
    }, []);

    const updateMenuItem = async () => {
        if (!editingItem?.id) return;

        try {
            const { id, ...data } = editingItem;
            await updateDoc(doc(db, 'menu_items', id), data);

            setItems(items.map(i => (i.id === id ? editingItem : i)));
            setEditingItem(null);
        } catch (err) {
            console.error('Error updating menu item:', err);
        }
    };

    const loadItems = async () => {
        try {
            const snapshot = await getDocs(collection(db, 'menu_items'));
            const list: MenuItem[] = snapshot.docs.map(docSnap => ({
                id: docSnap.id,
                ...docSnap.data()
            } as MenuItem));
            setItems(list);
        } catch (err) {
            console.error('Error loading menu items:', err);
        }
    };

    // ---------------- Add new menu item ----------------
    const addMenuItem = async () => {
        if (!auth.currentUser) {
            console.error("User not authenticated");
            return;
        }

        const itemToAdd: MenuItem = {
            ...newItem,
            ownerId: auth.currentUser.uid, // 🔥 ALWAYS
        };

        try {
            const ref = await addDoc(collection(db, 'menu_items'), itemToAdd);
            setItems(prev => [...prev, { id: ref.id, ...itemToAdd }]);

            setNewItem({
                name: '',
                name_en: '',
                category: CATEGORIES[0],
                price: 0,
                cost: 0,
                prep_time_minutes: 0,
                available: true,
                image_url: '',
            });
        } catch (e) {
            console.error("Add menu item failed:", e);
        }
    };


    // ---------------- Delete menu item ----------------
    const deleteMenuItem = async (id: string) => {
        if (!confirm('Obrisati stavku?')) return;
        try {
            await deleteDoc(doc(db, 'menu_items', id));
            setItems(items.filter(item => item.id !== id));
        } catch (err) {
            console.error('Error deleting menu item:', err);
        }
    };

    const totalRevenue = items.reduce((sum, item) => sum + Number(item.price), 0);
    const avgMargin = items.reduce((sum, item) => {
        const margin = ((Number(item.price) - Number(item.cost || 0)) / Number(item.price)) * 100;
        return sum + margin;
    }, 0) / (items.length || 1);

    const categoryColors: { [key: string]: string } = {
        APPETIZER: 'bg-emerald-100 text-emerald-800',
        MAIN: 'bg-blue-100 text-blue-800',
        DESSERT: 'bg-pink-100 text-pink-800',
        BEVERAGE: 'bg-teal-100 text-teal-800',
        ALCOHOL: 'bg-purple-100 text-purple-800',
        COFFEE: 'bg-amber-100 text-amber-800',
        SIDE: 'bg-slate-100 text-slate-800',
    };

    return (
        <div className="space-y-6">
            <Header title={t('menu.title')} subtitle={`${items.length} stavki`} />

            {/* Summary Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600 font-medium">Ukupan meni</p>
                            <p className="text-2xl font-bold text-slate-900 mt-1">{items.length}</p>
                        </div>
                        <div className="bg-blue-500 p-3 rounded-lg">
                            <UtensilsCrossed className="w-5 h-5 text-white" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600 font-medium">Prosečna marža</p>
                            <p className="text-2xl font-bold text-emerald-600 mt-1">{avgMargin.toFixed(0)}%</p>
                        </div>
                        <div className="bg-emerald-500 p-3 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600 font-medium">Ukupna vrednost</p>
                            <p className="text-2xl font-bold text-slate-900 mt-1">€{totalRevenue.toFixed(2)}</p>
                        </div>
                        <div className="bg-amber-500 p-3 rounded-lg">
                            <DollarSign className="w-5 h-5 text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Add new menu item form */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 space-y-4">
                <h3 className="text-lg font-bold text-slate-900">Dodaj novu stavku</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <input
                        type="text"
                        placeholder="Naziv"
                        value={newItem.name}
                        onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                        className="px-4 py-2 border rounded-lg"
                    />
                    <input
                        type="text"
                        placeholder="Naziv EN"
                        value={newItem.name_en}
                        onChange={e => setNewItem({ ...newItem, name_en: e.target.value })}
                        className="px-4 py-2 border rounded-lg"
                    />
                    <select
                        value={newItem.category}
                        onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                        className="px-4 py-2 border rounded-lg"
                    >
                        {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">
                            Cijena (€)
                        </label>
                        <input
                            type="number"
                            value={newItem.price}
                            onChange={e => setNewItem({ ...newItem, price: Number(e.target.value) })}
                            className="px-4 py-2 border rounded-lg w-full"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">
                            Trošak (€)
                        </label>
                        <input
                            type="number"
                            value={newItem.cost}
                            onChange={e => setNewItem({ ...newItem, cost: Number(e.target.value) })}
                            className="px-4 py-2 border rounded-lg w-full"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">
                            Vrijeme pripreme (min)
                        </label>
                        <input
                            type="number"
                            value={newItem.prep_time_minutes}
                            onChange={e =>
                                setNewItem({ ...newItem, prep_time_minutes: Number(e.target.value) })
                            }
                            className="px-4 py-2 border rounded-lg w-full"
                        />
                    </div>

                    <select
                        value={newItem.available ? 'available' : 'unavailable'}
                        onChange={e => setNewItem({ ...newItem, available: e.target.value === 'available' })}
                        className="px-4 py-2 border rounded-lg"
                    >
                        <option value="available">Dostupno</option>
                        <option value="unavailable">Nedostupno</option>
                    </select>
                </div>
                <button
                    onClick={addMenuItem}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold"
                >
                    Dodaj stavku
                </button>
            </div>

            {editingItem && (
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 space-y-4">
                    <h3 className="text-lg font-bold text-blue-900">Uredi stavku</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <input
                            type="text"
                            placeholder="Naziv"
                            value={editingItem.name}
                            onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                            className="px-4 py-2 border rounded-lg"
                        />

                        <input
                            type="text"
                            placeholder="Naziv EN"
                            value={editingItem.name_en || ''}
                            onChange={e => setEditingItem({ ...editingItem, name_en: e.target.value })}
                            className="px-4 py-2 border rounded-lg"
                        />

                        <select
                            value={editingItem.category}
                            onChange={e => setEditingItem({ ...editingItem, category: e.target.value })}
                            className="px-4 py-2 border rounded-lg"
                        >
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>

                        <input
                            type="number"
                            placeholder="Cijena"
                            value={editingItem.price}
                            onChange={e => setEditingItem({ ...editingItem, price: Number(e.target.value) })}
                            className="px-4 py-2 border rounded-lg"
                        />

                        <input
                            type="number"
                            placeholder="Trošak"
                            value={editingItem.cost}
                            onChange={e => setEditingItem({ ...editingItem, cost: Number(e.target.value) })}
                            className="px-4 py-2 border rounded-lg"
                        />

                        <input
                            type="number"
                            placeholder="Vrijeme pripreme (min)"
                            value={editingItem.prep_time_minutes}
                            onChange={e => setEditingItem({ ...editingItem, prep_time_minutes: Number(e.target.value) })}
                            className="px-4 py-2 border rounded-lg"
                        />

                        <select
                            value={editingItem.available ? 'available' : 'unavailable'}
                            onChange={e => setEditingItem({ ...editingItem, available: e.target.value === 'available' })}
                            className="px-4 py-2 border rounded-lg"
                        >
                            <option value="available">Dostupno</option>
                            <option value="unavailable">Nedostupno</option>
                        </select>

                        <input
                            type="text"
                            placeholder="Image URL"
                            value={editingItem.image_url || ''}
                            onChange={e => setEditingItem({ ...editingItem, image_url: e.target.value })}
                            className="px-4 py-2 border rounded-lg col-span-1 md:col-span-2 lg:col-span-3"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setEditingItem(null)}
                            className="px-5 py-2 bg-slate-300 rounded-lg font-medium"
                        >
                            Cancel
                        </button>

                        <button
                            onClick={() => updateMenuItem()}
                            className="px-5 py-2 bg-blue-600 text-white rounded-lg font-bold"
                        >
                            Save changes
                        </button>
                    </div>
                </div>
            )}



            {/* Menu Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Naziv</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Kategorija</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Cijena</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Trošak</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Marža</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Vrijeme pripreme</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Akcija</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                    {items.map(item => {
                        const margin = ((Number(item.price) - Number(item.cost || 0)) / Number(item.price)) * 100;
                        return (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">{item.name}</td>
                                <td className="px-6 py-4">{item.category}</td>
                                <td className="px-6 py-4">€{Number(item.price).toFixed(2)}</td>
                                <td className="px-6 py-4">€{Number(item.cost || 0).toFixed(2)}</td>
                                <td className="px-6 py-4">
                    <span className={`${margin >= 60 ? 'text-emerald-600' : margin >= 40 ? 'text-amber-600' : 'text-red-600'} font-bold`}>
                      {margin.toFixed(0)}%
                    </span>
                                </td>
                                <td className="px-6 py-4">{item.prep_time_minutes} min</td>
                                <td className="px-6 py-4">
                                    {item.available ? (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        Dostupno
                      </span>
                                    ) : (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        Nedostupno
                      </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 flex gap-3">
                                    <button
                                        onClick={() => setEditingItem(item)}
                                        className="text-blue-600 hover:text-blue-800"
                                        title="Uredi"
                                    >
                                        <Pencil className="w-5 h-5" />
                                    </button>

                                    <button
                                        onClick={() => deleteMenuItem(item.id!)}
                                        className="text-red-600 hover:text-red-800"
                                        title="Obriši"
                                    >
                                        <Trash className="w-5 h-5" />
                                    </button>
                                </td>

                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
