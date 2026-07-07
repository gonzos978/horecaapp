import React, { useState } from "react";
import { getAuth } from "firebase/auth";
import { useAuth } from "../../contexts/AuthContext";
import {
    Building2, MapPin, Phone, Mail, Lock, Hash,
    Navigation, Globe, Users, CheckCircle2, Loader2, ShieldCheck
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

interface Form {
    customerName: string;
    businessType: string;
    locationName: string;
    locationId: string;
    address: string;
    city: string;
    country: string;
    contactFirstName: string;
    contactLastName: string;
    phone: string;
    email: string;
    website: string;
    gpsLat: string;
    gpsLng: string;
    capacity: string;
    notes: string;
    loginEmail: string;
    loginPassword: string;
}

const empty: Form = {
    customerName: "", businessType: "", locationName: "",
    locationId: "", address: "", city: "", country: "Bosnia and Herzegovina",
    contactFirstName: "", contactLastName: "",
    phone: "", email: "", website: "", gpsLat: "", gpsLng: "",
    capacity: "", notes: "", loginEmail: "", loginPassword: "",
};

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

const inputCls = "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition";

export default function AddCustomer() {
    const { isSuperAdmin, user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showMap, setShowMap] = useState(false);
    const [form, setForm] = useState<Form>(empty);

    const set = (field: keyof Form, value: string) =>
        setForm(prev => ({ ...prev, [field]: value }));

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
        set(e.target.name as keyof Form, e.target.value);

    const validate = () => {
        if (!form.customerName.trim()) return "Name of object is required";
        if (!form.businessType) return "Business type is required";
        if (!form.loginEmail.trim()) return "Login email is required";
        if (!form.loginPassword.trim()) return "Login password is required";
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const err = validate();
        if (err) { setError(err); return; }
        setError(null);
        setLoading(true);
        try {
            const token = await getAuth().currentUser?.getIdToken();
            const res = await fetch(
                "https://us-central1-horecaapp-e16cf.cloudfunctions.net/createCustomer",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        customerName: form.customerName,
                        businessType: form.businessType,
                        locationName: form.locationName,
                        locationId: form.locationId,
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
                        adminEmail: form.loginEmail,
                        adminPassword: form.loginPassword,
                    }),
                }
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to create customer");
            setForm(empty);
            setShowSuccess(true);
        } catch (err: any) {
            setError(err?.message || "Failed to create customer");
        } finally {
            setLoading(false);
        }
    };

    if (!user) return <p className="p-8 text-slate-600">Please log in.</p>;
    if (!isSuperAdmin) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="bg-white border border-red-200 shadow-xl rounded-3xl p-8 text-center max-w-md">
                <ShieldCheck size={48} className="mx-auto text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-slate-800">Access Denied</h2>
                <p className="text-slate-500 mt-2">You do not have permission to access this page.</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 p-6">
            <div className="max-w-3xl mx-auto">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-black text-slate-900">Create Customer</h1>
                    <p className="text-slate-500 mt-2">Register a new HoReCa object in the system.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Object Info */}
                    <section className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-xl rounded-3xl p-6">
                        <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
                            <Building2 size={20} /> Object Information
                        </h2>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <Field label="Business Type *" icon={<Building2 size={12} />}>
                                <select name="businessType" value={form.businessType} onChange={handleChange} className={inputCls}>
                                    <option value="">— Select type —</option>
                                    {BUSINESS_TYPES.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </Field>

                            <Field label="Name of Object *" icon={<Building2 size={12} />}>
                                <input name="customerName" placeholder="e.g. Hotel Grand Sarajevo" value={form.customerName} onChange={handleChange} className={inputCls} />
                            </Field>

                            <Field label="Location Name" icon={<MapPin size={12} />}>
                                <input name="locationName" placeholder="e.g. Main Branch, Downtown" value={form.locationName} onChange={handleChange} className={inputCls} />
                            </Field>

                            <Field label="Location ID" icon={<Hash size={12} />}>
                                <input name="locationId" placeholder="e.g. 1, 2, 3..." value={form.locationId} onChange={handleChange} className={inputCls} type="number" min="1" />
                            </Field>

                            <Field label="Seating Capacity" icon={<Users size={12} />}>
                                <input name="capacity" placeholder="e.g. 120" value={form.capacity} onChange={handleChange} className={inputCls} type="number" min="1" />
                            </Field>
                        </div>
                    </section>

                    {/* Location */}
                    <section className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-xl rounded-3xl p-6">
                        <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
                            <MapPin size={20} /> Location
                        </h2>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <Field label="Address" icon={<MapPin size={12} />}>
                                <input name="address" placeholder="Street and number" value={form.address} onChange={handleChange} className={inputCls} />
                            </Field>

                            <Field label="City" icon={<MapPin size={12} />}>
                                <input name="city" placeholder="e.g. Sarajevo" value={form.city} onChange={handleChange} className={inputCls} />
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
                        <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
                            <Phone size={20} /> Contact
                        </h2>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <Field label="First Name" icon={<Users size={12} />}>
                                <input name="contactFirstName" placeholder="Ime" value={form.contactFirstName} onChange={handleChange} className={inputCls} />
                            </Field>

                            <Field label="Last Name" icon={<Users size={12} />}>
                                <input name="contactLastName" placeholder="Prezime" value={form.contactLastName} onChange={handleChange} className={inputCls} />
                            </Field>

                            <Field label="Phone" icon={<Phone size={12} />}>
                                <input name="phone" placeholder="+387 61 000 000" value={form.phone} onChange={handleChange} className={inputCls} />
                            </Field>

                            <Field label="Email" icon={<Mail size={12} />}>
                                <input name="email" type="email" placeholder="info@object.com" value={form.email} onChange={handleChange} className={inputCls} />
                            </Field>

                            <Field label="Website" icon={<Globe size={12} />}>
                                <input name="website" placeholder="https://www.object.com" value={form.website} onChange={handleChange} className={inputCls} />
                            </Field>
                        </div>

                        <div className="mt-4">
                            <Field label="Notes" icon={<Building2 size={12} />}>
                                <textarea name="notes" placeholder="Any additional notes..." value={form.notes} onChange={handleChange} rows={3}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none transition" />
                            </Field>
                        </div>
                    </section>

                    {/* Login Credentials */}
                    <section className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-xl rounded-3xl p-6">
                        <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
                            <Lock size={20} /> Login Credentials
                        </h2>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <Field label="Login Email *" icon={<Mail size={12} />}>
                                <input name="loginEmail" type="email" placeholder="admin@object.com" value={form.loginEmail} onChange={handleChange} className={inputCls} />
                            </Field>

                            <Field label="Login Password *" icon={<Lock size={12} />}>
                                <input name="loginPassword" type="password" placeholder="Min. 8 characters" value={form.loginPassword} onChange={handleChange} className={inputCls} />
                            </Field>
                        </div>
                    </section>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <button type="submit" disabled={loading}
                        className="w-full py-4 rounded-2xl bg-slate-900 text-white font-bold text-lg shadow-xl hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-50 flex items-center justify-center gap-3">
                        {loading ? <><Loader2 size={20} className="animate-spin" /> Creating...</> : <><CheckCircle2 size={20} /> Create Customer</>}
                    </button>
                </form>
            </div>

            {showMap && (
                <LocationPicker
                    lat={form.gpsLat}
                    lng={form.gpsLng}
                    onSelect={(lat, lng, address, city, country) => {
                        setForm(prev => ({
                            ...prev,
                            gpsLat: lat,
                            gpsLng: lng,
                            address: address || prev.address,
                            city: city || prev.city,
                            country: country || prev.country,
                        }));
                    }}
                    onClose={() => setShowMap(false)}
                />
            )}

            {showSuccess && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl p-10 text-center max-w-sm w-full">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 size={32} className="text-green-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800">Customer Created!</h3>
                        <p className="text-slate-500 mt-2">The new HoReCa object has been successfully registered.</p>
                        <button onClick={() => setShowSuccess(false)}
                            className="mt-6 w-full py-3 rounded-2xl bg-slate-900 text-white font-semibold hover:bg-slate-700 transition">
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
