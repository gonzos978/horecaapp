import { useState, useEffect } from 'react';

import {
    UtensilsCrossed,
    TrendingUp,
    DollarSign,
    Trash,
    Pencil,
    Loader2,
    Upload,
    Plus
} from 'lucide-react';

import { useLanguage } from '../contexts/LanguageContext';

import {
    auth,
    db,
    storage
} from '../fb/firebase';

import {
    collection,
    getDocs,
    addDoc,
    deleteDoc,
    doc,
    updateDoc,
    query,
    where
} from 'firebase/firestore';

import {
    ref,
    uploadBytesResumable,
    getDownloadURL
} from 'firebase/storage';


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

const CATEGORIES = [
    'APPETIZER',
    'MAIN',
    'DESSERT',
    'BEVERAGE',
    'ALCOHOL',
    'COFFEE',
    'SIDE'
];

const IMAGE_KEYWORDS: Record<string, string[]> = {
    APPETIZER: ['starter', 'appetizer', 'snack'],
    MAIN: ['main course', 'dinner', 'meal'],
    DESSERT: ['dessert', 'cake', 'sweet'],
    BEVERAGE: ['drink', 'juice', 'soda'],
    ALCOHOL: ['beer', 'wine', 'cocktail'],
    COFFEE: ['coffee', 'latte'],
    SIDE: ['fries', 'salad'],
};

const UNSPLASH_API_KEY =
    'YOUR_UNSPLASH_KEY';

export default function Menu() {

    const { t } = useLanguage();

    const [items, setItems] =
        useState<MenuItem[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [uploading, setUploading] =
        useState(false);

    const [editingItem, setEditingItem] =
        useState<MenuItem | null>(null);

    const [newItem, setNewItem] =
        useState<MenuItem>({
            name: '',
            name_en: '',
            category: CATEGORIES[0],
            price: 0,
            cost: 0,
            prep_time_minutes: 0,
            available: true,
            image_url: '',
        });

    // ---------------- LOAD ----------------
    useEffect(() => {
        loadItems();
    }, []);

    const loadItems = async () => {

        if (!auth.currentUser) return;

        setLoading(true);

        try {

            const q = query(
                collection(db, 'menu'),
                where(
                    'ownerId',
                    '==',
                    auth.currentUser.uid
                )
            );

            console.log(auth.currentUser.email)

            const snapshot =
                await getDocs(q);

            const list: MenuItem[] =
                snapshot.docs.map(docSnap => ({
                    id: docSnap.id,
                    ...docSnap.data(),
                } as MenuItem));

            console.log(snapshot)
            setItems(list);

        } catch (err) {

            console.error(
                'Error loading menu items:',
                err
            );

        } finally {

            setLoading(false);
        }
    };

    // ---------------- RESET ----------------
    const resetNewItem = () => {

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
    };

    // ---------------- ADD ----------------
    const addMenuItem = async () => {

        if (!auth.currentUser) return;

        try {

            const itemToAdd: MenuItem = {
                ...newItem,
                ownerId: auth.currentUser.uid,
            };

            // RANDOM IMAGE
            if (!itemToAdd.image_url) {

                const keywords =
                    IMAGE_KEYWORDS[
                        itemToAdd.category
                        ] || ['food'];

                const randomKeyword =
                    keywords[
                        Math.floor(
                            Math.random() *
                            keywords.length
                        )
                        ];

                const res = await fetch(
                    `https://api.unsplash.com/photos/random?query=${randomKeyword}&orientation=landscape&client_id=${UNSPLASH_API_KEY}`
                );

                const data = await res.json();

                itemToAdd.image_url =
                    data.urls?.small || '';
            }

            const refDoc = await addDoc(
                collection(db, 'menu'),
                itemToAdd
            );

            setItems(prev => [
                ...prev,
                {
                    id: refDoc.id,
                    ...itemToAdd
                }
            ]);

            resetNewItem();

        } catch (err) {

            console.error(
                'Error adding item:',
                err
            );
        }
    };

    // ---------------- UPDATE ----------------
    const updateMenuItem = async () => {

        if (!editingItem?.id) return;

        try {

            const {
                id,
                ...data
            } = editingItem;

            await updateDoc(
                doc(db, 'menu', id),
                data
            );

            setItems(prev =>
                prev.map(item =>
                    item.id === id
                        ? editingItem
                        : item
                )
            );

            setEditingItem(null);

        } catch (err) {

            console.error(
                'Update failed:',
                err
            );
        }
    };

    // ---------------- DELETE ----------------
    const deleteMenuItem = async (
        id: string
    ) => {

        if (
            !window.confirm(
                'Delete this menu item?'
            )
        ) return;

        try {

            await deleteDoc(
                doc(db, 'menu', id)
            );

            setItems(prev =>
                prev.filter(
                    item => item.id !== id
                )
            );

        } catch (err) {

            console.error(
                'Delete failed:',
                err
            );
        }
    };

    // ---------------- IMAGE UPLOAD ----------------
    const handleFileUpload = async (
        file: File,
        isEditing = false
    ) => {

        if (
            !file ||
            !auth.currentUser
        ) return;

        setUploading(true);

        try {

            const storageRef = ref(
                storage,
                `menu_images/${auth.currentUser.uid}_${Date.now()}_${file.name}`
            );

            const uploadTask =
                uploadBytesResumable(
                    storageRef,
                    file
                );

            uploadTask.on(
                'state_changed',
                () => {},
                err => {
                    console.error(err);
                    setUploading(false);
                },
                async () => {

                    const downloadURL =
                        await getDownloadURL(
                            uploadTask.snapshot.ref
                        );

                    if (
                        isEditing &&
                        editingItem
                    ) {

                        setEditingItem({
                            ...editingItem,
                            image_url: downloadURL
                        });

                    } else {

                        setNewItem({
                            ...newItem,
                            image_url: downloadURL
                        });
                    }

                    setUploading(false);
                }
            );

        } catch (err) {

            console.error(err);

            setUploading(false);
        }
    };

    // ---------------- STATS ----------------
    const totalRevenue =
        items.reduce(
            (sum, item) =>
                sum + Number(item.price),
            0
        );

    const avgMargin =
        items.reduce(
            (sum, item) => {

                const margin =
                    (
                        (
                            Number(item.price) -
                            Number(item.cost || 0)
                        ) /
                        Number(item.price || 1)
                    ) * 100;

                return sum + margin;

            },
            0
        ) / (items.length || 1);

    // ---------------- CATEGORY COLORS ----------------
    const categoryColors: Record<string, string> = {
        APPETIZER:
            'bg-emerald-100 text-emerald-700',

        MAIN:
            'bg-blue-100 text-blue-700',

        DESSERT:
            'bg-pink-100 text-pink-700',

        BEVERAGE:
            'bg-cyan-100 text-cyan-700',

        ALCOHOL:
            'bg-purple-100 text-purple-700',

        COFFEE:
            'bg-amber-100 text-amber-700',

        SIDE:
            'bg-slate-100 text-slate-700',
    };

    return (
        <div className="space-y-6">


            {/* STATS */}
            <div className="
                grid
                grid-cols-1
                lg:grid-cols-3
                gap-5
            ">

                <SummaryCard
                    title="Ukupan meni"
                    value={items.length}
                    icon={
                        <UtensilsCrossed />
                    }
                />

                <SummaryCard
                    title="Prosečna marža"
                    value={`${avgMargin.toFixed(0)}%`}
                    icon={
                        <TrendingUp />
                    }
                />

                <SummaryCard
                    title="Ukupna vrednost"
                    value={`€${totalRevenue.toFixed(2)}`}
                    icon={
                        <DollarSign />
                    }
                />
            </div>

            {/* ADD ITEM */}
            <div className="
                bg-white
                rounded-3xl
                shadow-sm
                border
                border-slate-200
                p-6
                space-y-5
            ">

                <div className="
                    flex
                    items-center
                    justify-between
                ">
                    <h3 className="
                        text-2xl
                        font-black
                        text-slate-900
                    ">
                        Dodaj novu stavku
                    </h3>
                </div>

                <div className="
                    grid
                    grid-cols-1
                    md:grid-cols-2
                    xl:grid-cols-3
                    gap-4
                ">

                    <InputField
                        placeholder="Naziv"
                        value={newItem.name}
                        onChange={e =>
                            setNewItem({
                                ...newItem,
                                name: e.target.value
                            })
                        }
                    />

                    <InputField
                        placeholder="Naziv EN"
                        value={newItem.name_en || ''}
                        onChange={e =>
                            setNewItem({
                                ...newItem,
                                name_en: e.target.value
                            })
                        }
                    />

                    <select
                        value={newItem.category}
                        onChange={e =>
                            setNewItem({
                                ...newItem,
                                category: e.target.value
                            })
                        }
                        className={inputClass}
                    >
                        {CATEGORIES.map(cat => (
                            <option
                                key={cat}
                                value={cat}
                            >
                                {cat}
                            </option>
                        ))}
                    </select>

                    <InputField
                        type="number"
                        placeholder="Cijena"
                        value={newItem.price}
                        onChange={e =>
                            setNewItem({
                                ...newItem,
                                price: Number(
                                    e.target.value
                                )
                            })
                        }
                    />

                    <InputField
                        type="number"
                        placeholder="Trošak"
                        value={newItem.cost}
                        onChange={e =>
                            setNewItem({
                                ...newItem,
                                cost: Number(
                                    e.target.value
                                )
                            })
                        }
                    />

                    <InputField
                        type="number"
                        placeholder="Vrijeme pripreme"
                        value={
                            newItem.prep_time_minutes
                        }
                        onChange={e =>
                            setNewItem({
                                ...newItem,
                                prep_time_minutes:
                                    Number(
                                        e.target.value
                                    )
                            })
                        }
                    />

                    <select
                        value={
                            newItem.available
                                ? 'available'
                                : 'unavailable'
                        }
                        onChange={e =>
                            setNewItem({
                                ...newItem,
                                available:
                                    e.target.value ===
                                    'available'
                            })
                        }
                        className={inputClass}
                    >
                        <option value="available">
                            Dostupno
                        </option>

                        <option value="unavailable">
                            Nedostupno
                        </option>
                    </select>

                    {/* IMAGE */}
                    <div className="
                        flex
                        items-center
                        gap-3
                        col-span-1
                        md:col-span-2
                        xl:col-span-3
                    ">

                        <label className="
                            flex
                            items-center
                            gap-2
                            px-5
                            py-3
                            rounded-2xl
                            bg-slate-100
                            hover:bg-slate-200
                            cursor-pointer
                            transition
                        ">
                            <Upload className="
                                w-4
                                h-4
                            " />

                            Upload image

                            <input
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={e =>
                                    e.target.files &&
                                    handleFileUpload(
                                        e.target.files[0]
                                    )
                                }
                            />
                        </label>

                        {uploading && (
                            <Loader2 className="
                                animate-spin
                            " />
                        )}

                        {newItem.image_url && (
                            <img
                                src={
                                    newItem.image_url
                                }
                                className="
                                    w-20
                                    h-20
                                    rounded-2xl
                                    object-cover
                                "
                            />
                        )}
                    </div>
                </div>

                <button
                    onClick={addMenuItem}
                    className="
                        flex
                        items-center
                        gap-2
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
                    <Plus className="
                        w-4
                        h-4
                    " />

                    Dodaj stavku
                </button>
            </div>

            {/* TABLE */}
            <div className="
                bg-white
                rounded-3xl
                shadow-sm
                border
                border-slate-200
                overflow-hidden
            ">

                {loading ? (

                    <div className="
                        p-12
                        flex
                        items-center
                        justify-center
                    ">
                        <Loader2 className="
                            animate-spin
                        " />
                    </div>

                ) : (

                    <div className="
                        overflow-x-auto
                    ">

                        <table className="
                            w-full
                        ">

                            <thead className="
                                bg-slate-50
                                border-b
                            ">

                            <tr>

                                <th className={thClass}>
                                    Stavka
                                </th>

                                <th className={thClass}>
                                    Kategorija
                                </th>

                                <th className={thClass}>
                                    Cijena
                                </th>

                                <th className={thClass}>
                                    Trošak
                                </th>

                                <th className={thClass}>
                                    Marža
                                </th>

                                <th className={thClass}>
                                    Vrijeme
                                </th>

                                <th className={thClass}>
                                    Status
                                </th>

                                <th className={thClass}>
                                    Akcije
                                </th>
                            </tr>
                            </thead>

                            <tbody className="
                                divide-y
                            ">

                            {items.map(item => {

                                const margin =
                                    (
                                        (
                                            Number(item.price) -
                                            Number(item.cost || 0)
                                        ) /
                                        Number(item.price || 1)
                                    ) * 100;

                                return (
                                    <tr
                                        key={item.id}
                                        className="
                                                hover:bg-slate-50
                                                transition
                                            "
                                    >

                                        <td className={tdClass}>

                                            <div className="
                                                    flex
                                                    items-center
                                                    gap-3
                                                ">

                                                {item.image_url && (
                                                    <img
                                                        src={
                                                            item.image_url
                                                        }
                                                        className="
                                                                w-14
                                                                h-14
                                                                rounded-2xl
                                                                object-cover
                                                            "
                                                    />
                                                )}

                                                <div>

                                                    <p className="
                                                            font-bold
                                                        ">
                                                        {item.name}
                                                    </p>

                                                    <p className="
                                                            text-sm
                                                            text-slate-500
                                                        ">
                                                        {item.name_en}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className={tdClass}>
                                                <span className={`
                                                    px-3
                                                    py-1
                                                    rounded-full
                                                    text-xs
                                                    font-bold
                                                    ${categoryColors[item.category]}
                                                `}>
                                                    {item.category}
                                                </span>
                                        </td>

                                        <td className={tdClass}>
                                            €
                                            {item.price.toFixed(2)}
                                        </td>

                                        <td className={tdClass}>
                                            €
                                            {(item.cost || 0).toFixed(2)}
                                        </td>

                                        <td className={tdClass}>

                                                <span className={`
                                                    font-bold
                                                    ${
                                                    margin >= 60
                                                        ? 'text-emerald-600'
                                                        : margin >= 40
                                                            ? 'text-amber-600'
                                                            : 'text-red-600'
                                                }
                                                `}>
                                                    {margin.toFixed(0)}%
                                                </span>
                                        </td>

                                        <td className={tdClass}>
                                            {item.prep_time_minutes} min
                                        </td>

                                        <td className={tdClass}>

                                            {item.available ? (

                                                <span className="
                                                        px-3
                                                        py-1
                                                        rounded-full
                                                        text-xs
                                                        font-bold
                                                        bg-emerald-100
                                                        text-emerald-700
                                                    ">
                                                        Dostupno
                                                    </span>

                                            ) : (

                                                <span className="
                                                        px-3
                                                        py-1
                                                        rounded-full
                                                        text-xs
                                                        font-bold
                                                        bg-slate-100
                                                        text-slate-700
                                                    ">
                                                        Nedostupno
                                                    </span>
                                            )}
                                        </td>

                                        <td className={tdClass}>

                                            <div className="
                                                    flex
                                                    items-center
                                                    gap-3
                                                ">

                                                <button
                                                    onClick={() =>
                                                        setEditingItem(item)
                                                    }
                                                    className="
                                                            text-blue-600
                                                            hover:text-blue-800
                                                        "
                                                >
                                                    <Pencil className="
                                                            w-5
                                                            h-5
                                                        " />
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        deleteMenuItem(item.id!)
                                                    }
                                                    className="
                                                            text-red-600
                                                            hover:text-red-800
                                                        "
                                                >
                                                    <Trash className="
                                                            w-5
                                                            h-5
                                                        " />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

// ---------------- COMPONENTS ----------------

function SummaryCard({
                         title,
                         value,
                         icon
                     }: any) {

    return (
        <div className="
            bg-white
            rounded-3xl
            shadow-sm
            border
            border-slate-200
            p-5
            flex
            items-center
            justify-between
        ">

            <div>

                <p className="
                    text-sm
                    text-slate-500
                    font-medium
                ">
                    {title}
                </p>

                <p className="
                    text-3xl
                    font-black
                    mt-1
                ">
                    {value}
                </p>
            </div>

            <div className="
                w-14
                h-14
                rounded-2xl
                bg-slate-100
                flex
                items-center
                justify-center
            ">
                {icon}
            </div>
        </div>
    );
}

function InputField({
                        value,
                        onChange,
                        placeholder,
                        type = 'text'
                    }: any) {

    return (
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={inputClass}
        />
    );
}

// ---------------- CLASSES ----------------
const inputClass = `
    px-5
    py-3
    rounded-2xl
    border
    border-slate-300
    bg-slate-50
    focus:outline-none
    focus:ring-4
    focus:ring-slate-200
`;

const thClass = `
    px-6
    py-4
    text-left
    text-xs
    font-bold
    uppercase
    text-slate-500
`;

const tdClass = `
    px-6
    py-4
    text-sm
    text-slate-700
`;