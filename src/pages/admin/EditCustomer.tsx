import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db, functions } from "../../fb/firebase";
import { httpsCallable } from "firebase/functions";
import toast from "react-hot-toast";
import {
    Building2, MapPin, Phone, Mail, Lock, Hash,
    Navigation, Globe, Users, CheckCircle2, Loader2, Trash2
} from "lucide-react";
import LocationPicker from "../../components/LocationPicker";

const BUSINESS_TYPES = [
    { value: "restaurant", label: "Restaurant" },
    { value: "hotel", label: "Hotel" },
    { value: "cafe", label: "Café" },
    { value: "bar", label: "Bar" },
    { value: "catering", label: "Catering" },
    { value: "fast_food", label: "Fast Food" },
    { value: "bakery", label: "Bakery / Pekara" },
    { value: "pizzeria", label: "Pizzeria" },
    { value: "resort", label: "Resort" },
    { value: "hostel", label: "Hostel" },
    { value: "motel", label: "Motel" },
    { value: "spa", label: "SPA & Wellness" },
    { value: "event_hall", label: "Event Hall / Sala" },
    { value: "other", label: "Other" },
];

const COUNTRIES = [
    "Bosnia and Herzegovina", "Serbia", "Croatia", "Slovenia",
    "Montenegro", "North Macedonia", "Austria", "Germany",
    "Switzerland", "Netherlands", "Sweden", "Other"
];

const inputCls = "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition";

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                {icon} {label}
            </label>
            {children}
        </div>
    );
}

export default function EditCustomer() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showMap, setShowMap] = useState(false);
    const [customerId, setCustomerId] = useState("");
    const [customerUserId, setCustomerUserId] = useState("");

    const [form, setForm] = useState({
        customerName: "", businessType: "", locationName: "", locationId: "",
        address: "", city: "", country: "Bosnia and Herzegovina",
        contactFirstName: "", contactLastName: "",
        phone: "", email: "", website: "",
        gpsLat: "", gpsLng: "", capacity: "", notes: "",
        loginEmail: "", loginPassword: "",
    });

    const deleteCustomerFn = useMemo(() => httpsCallable(functions, "deleteCustomerUser"), []);

    const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
        set(e.target.name, e.target.value);

    useEffect(() => {
        const load = async () => {
            if (!id) return;
            try {
                setLoading(true);
                setCustomerUserId(id);

                const userSnap = await getDoc(doc(db, "users", id));
                if (!userSnap.exists()) throw new Error("User not found");
                const userData = userSnap.data();
                const cid = userData.customerId;
                setCustomerId(cid || "");

                if (cid) {
                    const customerSnap = await getDoc(doc(db, "customers", cid));
                    if (customerSnap.exists()) {
                        const c = customerSnap.data();
                        setForm({
                            customerName: c.customerName || "",
                            businessType: c.businessType || "",
                            locationName: c.locationName || "",
                            locationId: c.locationId ? String(c.locationId) : "",
                            address: c.address || "",
                            city: c.city || "",
                            country: c.country || "Bosnia and Herzegovina",
                            contactFirstName: c.contactFirstName || "",
                            contactLastName: c.contactLastName || "",
                            phone: c.phone || "",
                            email: c.email || "",
                            website: c.website || "",
                            gpsLat: c.gps?.lat ? String(c.gps.lat) : "",
                            gpsLng: c.gps?.lng ? String(c.gps.lng) : "",
                            capacity: c.capacity ? String(c.capacity) : "",
                            notes: c.notes || "",
                            loginEmail: userData.email || "",
                            loginPassword: "",
                        });
                    }
                }
            } catch (err) {
                console.error("LOAD ERROR:", err);
                toast.error("Failed to load customer");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    const saveCustomer = async () => {
        if (!customerId || !customerUserId) return;
        try {
            setSaving(true);

            const customerData: any = {
                customerName: form.customerName,
                businessType: form.businessType,
                locationName: form.locationName,
                locationId: form.locationId || null,
                address: form.address,
                city: form.city,
                country: form.country,
                contactFirstName: form.contactFirstName,
                contactLastName: form.contactLastName,
                phone: form.phone,
                email: form.email,
                website: form.website,
                gps: form.gpsLat && form.gpsLng
                    ? { lat: parseFloat(form.gpsLat), lng: parseFloat(form.gpsLng) }
                    : null,
                capacity: form.capacity ? parseInt(form.capacity) : null,
                notes: form.notes,
            };

            await updateDoc(doc(db, "customers", customerId), customerData);
            await updateDoc(doc(db, "users", customerUserId), {
                customerName: form.customerName,
                businessType: form.businessType,
            });

            // Update password if provided
            if (form.loginPassword.trim()) {
                const token = await getAuth().currentUser?.getIdToken();
                await fetch("https://us-central1-horecaapp-e16cf.cloudfunctions.net/updateUserPassword", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                    body: JSON.stringify({ uid: customerUserId, password: form.loginPassword }),
                });
            }

            toast.success("Customer updated successfully");
            navigate("/admin/users");
        } catch (err) {
            console.error("SAVE ERROR:", err);
            toast.error("Failed to update customer");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!customerUserId) return;
        const confirmed = await new Promise<boolean>((resolve) => {
            toast((t) => (
                <div className="flex flex-col gap-3">
                    <p className="text-sm font-medium">Delete this customer permanently?</p>
                    <div className="flex gap-2 justify-end">
                        <button className="px-3 py-1 rounded bg-slate-200" onClick={() => { toast.dismiss(t.id); resolve(false); }}>Cancel</button>
                        <button className="px-3 py-1 rounded bg-red-600 text-white" onClick={() => { toast.dismiss(t.id); resolve(true); }}>Delete</button>
                    </div>
                </div>
            ), { duration: Infinity });
        });
        if (!confirmed) return;
        try {
            setSaving(true);
            await deleteCustomerFn({ userId: customerUserId, customerId });
            toast.success("Customer deleted");
            navigate("/admin/users");
        } catch (err) {
            toast.error("Failed to delete customer");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 size={36} className="animate-spin text-slate-400" />
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 p-6">
            <div className="max-w-3xl mx-auto">

                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900">Edit Customer</h1>
                        <p className="text-slate-500 mt-1">Update HoReCa object information.</p>
                    </div>
                    <button onClick={handleDelete} disabled={saving}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-red-50 border border-red-200 text-red-600 font-semibold hover:bg-red-100 transition text-sm">
                        <Trash2 size={15} /> Delete
                    </button>
                </div>

                <div className="space-y-6">

                    {/* Object Info */}
                    <section className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-xl rounded-3xl p-6">
                        <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2"><Building2 size={20} /> Object Information</h2>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <Field label="Business Type" icon={<Building2 size={12} />}>
                                <select name="businessType" value={form.businessType} onChange={handleChange} className={inputCls}>
                                    <option value="">— Select type —</option>
                                    {BUSINESS_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </Field>
                            <Field label="Name of Object" icon={<Building2 size={12} />}>
                                <input name="customerName" value={form.customerName} onChange={handleChange} className={inputCls} placeholder="e.g. Hotel Grand Sarajevo" />
                            </Field>
                            <Field label="Location Name" icon={<MapPin size={12} />}>
                                <input name="locationName" value={form.locationName} onChange={handleChange} className={inputCls} placeholder="e.g. Main Branch" />
                            </Field>
                            <Field label="Location ID" icon={<Hash size={12} />}>
                                <input name="locationId" type="number" value={form.locationId} onChange={handleChange} className={inputCls} placeholder="1, 2, 3..." />
                            </Field>
                            <Field label="Seating Capacity" icon={<Users size={12} />}>
                                <input name="capacity" type="number" value={form.capacity} onChange={handleChange} className={inputCls} placeholder="e.g. 120" />
                            </Field>
                        </div>
                    </section>

                    {/* Location */}
                    <section className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-xl rounded-3xl p-6">
                        <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2"><MapPin size={20} /> Location</h2>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <Field label="Address" icon={<MapPin size={12} />}>
                                <input name="address" value={form.address} onChange={handleChange} className={inputCls} placeholder="Street and number" />
                            </Field>
                            <Field label="City" icon={<MapPin size={12} />}>
                                <input name="city" value={form.city} onChange={handleChange} className={inputCls} placeholder="e.g. Sarajevo" />
                            </Field>
                            <Field label="Country" icon={<Globe size={12} />}>
                                <select name="country" value={form.country} onChange={handleChange} className={inputCls}>
                                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </Field>
                            <div className="sm:col-span-2">
                                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                                    <Navigation size={12} /> GPS Location
                                </label>
                                <button type="button" onClick={() => setShowMap(true)}
                                    className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold py-3 text-sm transition">
                                    <MapPin size={16} />
                                    {form.gpsLat && form.gpsLng
                                        ? `📍 ${parseFloat(form.gpsLat).toFixed(5)}, ${parseFloat(form.gpsLng).toFixed(5)}`
                                        : "Pick location on map"}
                                </button>
                                {form.gpsLat && form.gpsLng && (
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        <input name="gpsLat" value={form.gpsLat} onChange={handleChange} className={inputCls} placeholder="Lat" />
                                        <input name="gpsLng" value={form.gpsLng} onChange={handleChange} className={inputCls} placeholder="Lng" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Contact */}
                    <section className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-xl rounded-3xl p-6">
                        <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2"><Phone size={20} /> Contact</h2>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <Field label="First Name" icon={<Users size={12} />}>
                                <input name="contactFirstName" value={form.contactFirstName} onChange={handleChange} className={inputCls} placeholder="Ime" />
                            </Field>
                            <Field label="Last Name" icon={<Users size={12} />}>
                                <input name="contactLastName" value={form.contactLastName} onChange={handleChange} className={inputCls} placeholder="Prezime" />
                            </Field>
                            <Field label="Phone" icon={<Phone size={12} />}>
                                <input name="phone" value={form.phone} onChange={handleChange} className={inputCls} placeholder="+387 61 000 000" />
                            </Field>
                            <Field label="Email" icon={<Mail size={12} />}>
                                <input name="email" type="email" value={form.email} onChange={handleChange} className={inputCls} placeholder="info@object.com" />
                            </Field>
                            <Field label="Website" icon={<Globe size={12} />}>
                                <input name="website" value={form.website} onChange={handleChange} className={inputCls} placeholder="https://www.object.com" />
                            </Field>
                        </div>
                        <div className="mt-4">
                            <Field label="Notes" icon={<Building2 size={12} />}>
                                <textarea name="notes" value={form.notes} onChange={handleChange} rows={3}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none transition"
                                    placeholder="Any additional notes..." />
                            </Field>
                        </div>
                    </section>

                    {/* Login */}
                    <section className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-xl rounded-3xl p-6">
                        <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2"><Lock size={20} /> Login Credentials</h2>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <Field label="Login Email" icon={<Mail size={12} />}>
                                <input name="loginEmail" type="email" value={form.loginEmail} disabled className={inputCls + " opacity-60 cursor-not-allowed"} />
                            </Field>
                            <Field label="New Password" icon={<Lock size={12} />}>
                                <input name="loginPassword" type="password" value={form.loginPassword} onChange={handleChange} className={inputCls} placeholder="Leave blank to keep current" />
                            </Field>
                        </div>
                    </section>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button onClick={() => navigate("/admin/users")}
                            className="px-6 py-3 rounded-2xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition">
                            Cancel
                        </button>
                        <button onClick={saveCustomer} disabled={saving}
                            className="flex-1 py-3 rounded-2xl bg-slate-900 text-white font-bold shadow-xl hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-50 flex items-center justify-center gap-2">
                            {saving ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : <><CheckCircle2 size={18} /> Save Changes</>}
                        </button>
                    </div>
                </div>
            </div>

            {showMap && (
                <LocationPicker
                    lat={form.gpsLat} lng={form.gpsLng}
                    onSelect={(lat, lng, address, city, country) => {
                        setForm(prev => ({
                            ...prev, gpsLat: lat, gpsLng: lng,
                            address: address || prev.address,
                            city: city || prev.city,
                            country: country || prev.country,
                        }));
                    }}
                    onClose={() => setShowMap(false)}
                />
            )}
        </div>
    );
}
