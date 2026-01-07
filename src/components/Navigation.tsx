import {
    LayoutDashboard,
    Package,
    UtensilsCrossed,
    Bell,
    Mic,
    ClipboardCheck,
    GraduationCap,
    Settings,
    Shield,
    Smartphone,
    ChefHat,
    Home,
    ListTodo,
} from "lucide-react";
import {useLanguage} from "../contexts/LanguageContext";

interface NavigationProps {
    currentPage: string;
    onNavigate: (page: any) => void;
    isOpen: boolean;
    onClose: () => void;
}

export default function Navigation({
                                       currentPage,
                                       onNavigate,
                                       isOpen,
                                       onClose,
                                   }: NavigationProps) {
    const {t} = useLanguage();

    const menuItems = [
        {id: "dashboard", icon: LayoutDashboard, label: t("nav.dashboard")},
        {id: "tasks", icon: ListTodo, label: t("nav.tasks")},
        {id: "artikli", icon: Package, label: t("nav.artikli")},
        {id: "menu", icon: UtensilsCrossed, label: t("nav.menu")},
        {id: "alerts", icon: Bell, label: t("nav.alerts")},
        {id: "voice", icon: Mic, label: t("nav.voice")},
        {id: "checklists", icon: ClipboardCheck, label: t("nav.checklists")},
        {id: "training", icon: GraduationCap, label: t("nav.training")},
        {id: "anonymousReports", icon: Shield, label: t("nav.anonymousReports")},
        {id: "settings", icon: Settings, label: t("nav.settings")},
    ];

    const pwaItems = [
        {id: "manager", icon: ListTodo, label: "Menadžer PWA"},
        {id: "waiter", icon: Smartphone, label: "Konobar PWA"},
        {id: "cook", icon: ChefHat, label: "Kuvar PWA"},
        {id: "housekeeper", icon: Home, label: "Sobarica PWA"},
    ];

    return (
        <aside
            className={`
    fixed z-40 left-0 top-0 h-screen w-64 bg-white border-r border-slate-200 shadow-sm
    transition-transform duration-300
    ${isOpen ? "translate-x-0" : "-translate-x-full"}
    md:translate-x-0
  `}>
            <div className="p-6 border-b border-slate-200">
                <h1 className="text-xl font-bold text-slate-900 leading-tight">
                    {t("app.title")}
                </h1>
                <p className="text-xs text-slate-500 mt-1">v3.1</p>
            </div>

            <nav className="p-4 space-y-1">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPage === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => {
                                onNavigate(item.id);
                                onClose();
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                isActive
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            }`}
                        >
                            <Icon className="w-5 h-5"/>
                            <span className="font-medium text-sm">{item.label}</span>
                        </button>
                    );
                })}

                <div className="pt-4 mt-4 border-t border-slate-200">
                    <p className="text-xs font-semibold text-slate-500 uppercase px-4 mb-2">
                        PWA Ekrani
                    </p>
                    {pwaItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentPage === item.id;

                        return (
                            <button
                                key={item.id}
                                onClick={() => onNavigate(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                    isActive
                                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                }`}
                            >
                                <Icon className="w-5 h-5"/>
                                <span className="font-medium text-sm">{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            </nav>
        </aside>
    );
}
