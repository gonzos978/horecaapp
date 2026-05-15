import { useNavigate, useLocation } from "react-router-dom";
import {
    ArrowLeft,
    Pencil,
    Mail,
    Phone,
    MapPin,
    ShieldCheck,
    Briefcase,
    GraduationCap,
    Star,
    CalendarDays
} from "lucide-react";

export default function Worker() {

    const navigate = useNavigate();
    const location = useLocation();

    const worker = location.state?.worker;

    const handleBack = () => {
        navigate("/app/home");
    };

    const handleEdit = () => {
        navigate(`/app/workers/edit/${encodeURIComponent(worker.id)}`, {
            state: { worker }
        });
    };

    if (!worker) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
                <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="text-5xl mb-4">⚠️</div>

                    <h2 className="text-2xl font-bold text-slate-800 mb-2">
                        Worker Not Found
                    </h2>

                    <p className="text-slate-500 mb-6">
                        The worker data could not be loaded.
                    </p>

                    <button
                        onClick={handleBack}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 text-white hover:bg-slate-700 transition"
                    >
                        <ArrowLeft size={18} />
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 p-6">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* HEADER CARD */}
                <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl p-8 text-white">

                    <div className="absolute top-0 right-0 opacity-10 text-[180px] font-black leading-none">
                        {worker.name?.charAt(0)}
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">

                        {/* LEFT */}
                        <div className="flex items-center gap-5">
                            <img
                                src={worker.photoURL || "/default-avatar.png"}
                                alt={worker.name}
                                className="w-28 h-28 rounded-3xl object-cover border-4 border-white/20 shadow-lg"
                            />

                            <div>
                                <h1 className="text-4xl font-black tracking-tight">
                                    {worker.name}
                                </h1>

                                <div className="mt-3 flex flex-wrap gap-2">

                                    <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-sm">
                                        {worker.role}
                                    </span>

                                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-sm">
                                        {worker.type}
                                    </span>

                                    <span className={`px-3 py-1 rounded-full text-sm ${
                                        worker.training
                                            ? "bg-green-500/20 text-green-300"
                                            : "bg-red-500/20 text-red-300"
                                    }`}>
                                        {worker.training ? "Training Finished" : "Training Pending"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* ACTIONS */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleBack}
                                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 transition backdrop-blur"
                            >
                                <ArrowLeft size={18} />
                                Back
                            </button>

                            <button
                                onClick={handleEdit}
                                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 transition font-semibold shadow-lg"
                            >
                                <Pencil size={18} />
                                Edit Worker
                            </button>
                        </div>
                    </div>
                </div>

                {/* INFO GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

                    <InfoCard
                        icon={<Mail size={18} />}
                        label="Email"
                        value={worker.email}
                    />

                    <InfoCard
                        icon={<Phone size={18} />}
                        label="Phone"
                        value={worker.phone || "N/A"}
                    />

                    <InfoCard
                        icon={<MapPin size={18} />}
                        label="Address"
                        value={worker.address || "N/A"}
                    />

                    <InfoCard
                        icon={<Briefcase size={18} />}
                        label="Customer"
                        value={worker.customerName || "N/A"}
                    />

                    <InfoCard
                        icon={<ShieldCheck size={18} />}
                        label="Evaluation"
                        value={worker.evaluation || "N/A"}
                    />

                    <InfoCard
                        icon={<GraduationCap size={18} />}
                        label="Training Score"
                        value={`${worker.trainingScore || 0}%`}
                    />

                    <InfoCard
                        icon={<Star size={18} />}
                        label="Worker ID"
                        value={worker.id}
                    />

                    <InfoCard
                        icon={<CalendarDays size={18} />}
                        label="Created At"
                        value={
                            worker.createdAt?.seconds
                                ? new Date(worker.createdAt.seconds * 1000).toLocaleString()
                                : "N/A"
                        }
                    />
                </div>

                {/* STATUS PANEL */}
                <div className="bg-white rounded-3xl shadow-xl p-8">
                    <h2 className="text-2xl font-bold text-slate-800 mb-6">
                        Training Overview
                    </h2>

                    <div className="space-y-4">

                        <div className="flex justify-between text-sm font-medium">
                            <span className="text-slate-500">
                                Completion
                            </span>

                            <span className="text-slate-800">
                                {worker.trainingScore || 0}%
                            </span>
                        </div>

                        <div className="h-4 bg-slate-200 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
                                style={{
                                    width: `${worker.trainingScore || 0}%`
                                }}
                            />
                        </div>

                        <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold ${
                            worker.training
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                        }`}>
                            {worker.training
                                ? "✔ Training Completed"
                                : "✖ Training Not Completed"}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* COMPONENT */
function InfoCard({
                      icon,
                      label,
                      value
                  }: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="bg-white rounded-3xl shadow-lg p-5 hover:shadow-2xl transition-all duration-300 border border-slate-100">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700">
                    {icon}
                </div>

                <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                    {label}
                </span>
            </div>

            <p className="text-lg font-bold text-slate-800 break-words">
                {value}
            </p>
        </div>
    );
}