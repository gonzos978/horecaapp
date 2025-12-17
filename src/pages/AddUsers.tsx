import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { collection, doc, setDoc } from "firebase/firestore";
import {db} from "../fb/firebase";


export default function AddUser() {
    const navigate = useNavigate();

    const uloge = ["Konobar", "Šanker", "Čuvar", "Menadžer", "Vlasnik", "Admin"];
    const statusi = ["Aktivan", "Na godišnjem", "Otkazan"];
    const nivoiRizika = ["Nizak", "Srednji", "Visok"];

    const [form, setForm] = useState({
        name: "",
        email: "",
        pass: "",
        telefon: "",
        worktype: "Konobar",
        status: "Aktivan",
        end_tasks: 0,
        processed_orders: 0,
        efficient: 0,
        work_evaluation: 0,
        number_of_irregularities: 0,
        last_irregularity: "",
        risk_level: "Nizak",
        POS_access: false,
        RFID: "",
        biometry: "",
        AI_alert_score: 0,
        predicted_risk: "Nizak",
        check_in_time: "",
        check_out_time: "",
        check_in_location: "",
        check_out_location: "",
    });

    const update = (key: string, value: any) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const newUser = {
            id: uuidv4(),
            ...form,
            timestamp_created: new Date().toISOString(),
            timestamp_updated: new Date().toISOString(),
        };


        try {
            // Spremi usera u Firestore collection "users" pod njegovim id-om
            await setDoc(doc(collection(db, "horercausers"), newUser.id), newUser);

            console.log("User saved to Firebase:", newUser);
            // Vrati nazad na Users list
            navigate("/admin/users");
        } catch (error) {
            console.error("Error saving user:", error);
            alert("Greška pri spremanju korisnika. Provjeri konzolu.");
        }

        navigate("/admin/users");
    };

    return (
        <div className="p-8">
            <h1 className="text-3xl font-semibold mb-6">Add New User</h1>

            <form
                onSubmit={handleSubmit}
                className="bg-white shadow-xl rounded-xl p-8 space-y-10"
            >
                {/* BASIC INFO */}
                <div>
                    <h2 className="text-xl font-bold mb-4 text-gray-700">Basic Information</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-1">Name</label>
                            <input
                                className="w-full border rounded-lg px-4 py-2"
                                value={form.name}
                                onChange={(e) => update("name", e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Email</label>
                            <input
                                type="email"
                                className="w-full border rounded-lg px-4 py-2"
                                value={form.email}
                                onChange={(e) => update("email", e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Password</label>
                            <input
                                type="password"
                                className="w-full border rounded-lg px-4 py-2"
                                value={form.pass}
                                onChange={(e) => update("pass", e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Phone</label>
                            <input
                                className="w-full border rounded-lg px-4 py-2"
                                value={form.telefon}
                                onChange={(e) => update("telefon", e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* ROLES & STATUS */}
                <div>
                    <h2 className="text-xl font-bold mb-4 text-gray-700">Role & Status</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-1">Role</label>
                            <select
                                className="w-full border rounded-lg px-4 py-2"
                                value={form.worktype}
                                onChange={(e) => update("worktype", e.target.value)}
                            >
                                {uloge.map(u => <option key={u}>{u}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Status</label>
                            <select
                                className="w-full border rounded-lg px-4 py-2"
                                value={form.status}
                                onChange={(e) => update("status", e.target.value)}
                            >
                                {statusi.map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Risk Level</label>
                            <select
                                className="w-full border rounded-lg px-4 py-2"
                                value={form.risk_level}
                                onChange={(e) => update("risk_level", e.target.value)}
                            >
                                {nivoiRizika.map(r => <option key={r}>{r}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* SECURITY */}
                <div>
                    <h2 className="text-xl font-bold mb-4 text-gray-700">Security</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={form.POS_access}
                                onChange={(e) => update("POS_access", e.target.checked)}
                            />
                            <label className="text-sm font-medium">POS Access</label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">RFID</label>
                            <input
                                className="w-full border rounded-lg px-4 py-2"
                                value={form.RFID}
                                onChange={(e) => update("RFID", e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Biometrics</label>
                            <input
                                className="w-full border rounded-lg px-4 py-2"
                                value={form.biometry}
                                onChange={(e) => update("biometry", e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* SUBMIT BUTTON */}
                <div className="pt-4">
                    <button
                        type="submit"
                        className="bg-indigo-600 text-white px-8 py-3 rounded-lg shadow hover:bg-indigo-700 transition"
                    >
                        Save User
                    </button>
                </div>
            </form>
        </div>
    );
}
