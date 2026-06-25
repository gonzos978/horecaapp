import { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastItem {
    id: number;
    type: ToastType;
    title: string;
    message?: string;
}

interface ToastProps {
    toasts: ToastItem[];
    remove: (id: number) => void;
}

const CFG: Record<ToastType, { icon: React.ReactNode; bar: string; bg: string; title: string; border: string }> = {
    success: {
        icon:   <CheckCircle size={20} className="text-emerald-500 flex-shrink-0" />,
        bar:    "bg-emerald-500",
        bg:     "bg-white",
        title:  "text-emerald-800",
        border: "border-emerald-200",
    },
    error: {
        icon:   <XCircle size={20} className="text-red-500 flex-shrink-0" />,
        bar:    "bg-red-500",
        bg:     "bg-white",
        title:  "text-red-800",
        border: "border-red-200",
    },
    warning: {
        icon:   <AlertTriangle size={20} className="text-amber-500 flex-shrink-0" />,
        bar:    "bg-amber-400",
        bg:     "bg-white",
        title:  "text-amber-800",
        border: "border-amber-200",
    },
    info: {
        icon:   <Info size={20} className="text-blue-500 flex-shrink-0" />,
        bar:    "bg-blue-500",
        bg:     "bg-white",
        title:  "text-blue-800",
        border: "border-blue-200",
    },
};

function ToastCard({ toast, remove }: { toast: ToastItem; remove: () => void }) {
    const [visible, setVisible] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const cfg = CFG[toast.type];

    useEffect(() => {
        // Slide in
        const t1 = setTimeout(() => setVisible(true), 10);
        // Start exit
        const t2 = setTimeout(() => setLeaving(true), 3800);
        // Remove after exit animation
        const t3 = setTimeout(() => remove(), 4200);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, []);

    return (
        <div className={`relative w-80 rounded-2xl shadow-2xl border overflow-hidden transition-all duration-300 ease-out ${cfg.bg} ${cfg.border}
            ${visible && !leaving ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
        `}>
            {/* Top accent bar */}
            <div className={`h-1 w-full ${cfg.bar}`} />

            {/* Content */}
            <div className="flex items-start gap-3 p-4 pr-10">
                {cfg.icon}
                <div className="min-w-0">
                    <p className={`text-sm font-bold ${cfg.title}`}>{toast.title}</p>
                    {toast.message && (
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{toast.message}</p>
                    )}
                </div>
            </div>

            {/* Close button */}
            <button
                onClick={() => { setLeaving(true); setTimeout(remove, 300); }}
                className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
                <X size={13} />
            </button>

            {/* Progress bar */}
            <div className="h-0.5 bg-slate-100">
                <div className={`h-full ${cfg.bar} opacity-40 animate-[shrink_3.8s_linear_forwards]`} />
            </div>
        </div>
    );
}

export function ToastContainer({ toasts, remove }: ToastProps) {
    return (
        <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 items-end pointer-events-none">
            {toasts.map(t => (
                <div key={t.id} className="pointer-events-auto">
                    <ToastCard toast={t} remove={() => remove(t.id)} />
                </div>
            ))}
        </div>
    );
}

/* ── Hook ── */
let _nextId = 1;

export function useToast() {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const show = (type: ToastType, title: string, message?: string) => {
        const id = _nextId++;
        setToasts(prev => [...prev, { id, type, title, message }]);
    };

    const remove = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

    return {
        toasts,
        remove,
        success: (title: string, message?: string) => show("success", title, message),
        error:   (title: string, message?: string) => show("error",   title, message),
        warning: (title: string, message?: string) => show("warning", title, message),
        info:    (title: string, message?: string) => show("info",    title, message),
    };
}
