import {useState, useEffect} from "react";
import {collection, getDocs, query, where, orderBy} from "firebase/firestore";
import {
    TrendingUp,
    AlertTriangle,
    Trash2,
    Users as UsersIcon,
    Star,
    ShoppingCart,
    ListTodo,
    Smartphone,
    ChefHat,
    Home as HomeIcon,
    ArrowRight,
} from "lucide-react";
import AddUserModal from "../components/AddUserModal";
import AddNotificationModal from "../components/AddNotificationModal";
import {db} from "../fb/firebase";
import {ROLE} from "../models/role";
import {useAuth} from "../contexts/AuthContext";
import {useLanguage} from "../contexts/LanguageContext";
import {useNavigate} from "react-router-dom";

interface AppUser {
    readonly address: string;
    readonly createdAt: Date;
    readonly customerId: string;
    readonly customerName: string;
    readonly email: string;
    readonly id: string;
    readonly name: string;
    readonly role: ROLE;
    readonly type: string;
    readonly photoURL:string | null;
}

interface INotification {
    readonly id: string;
    readonly title: string;
    readonly description: string;
    readonly priority: string;
    readonly amount: number | null;
    readonly visibleFor: string[];
    readonly createdAt: any;
    readonly creatorId: string;
    readonly creatorName: string;
    readonly customerId: string;
    readonly type: string;
}

const severityColors = {
    LOW: "bg-blue-100 text-blue-800 border-blue-200",
    MEDIUM: "bg-amber-100 text-amber-800 border-amber-200",
    HIGH: "bg-orange-100 text-orange-800 border-orange-200",
    CRITICAL: "bg-red-100 text-red-800 border-red-200",
};

export default function Dashboard() {
    const navigate = useNavigate();
    const {t} = useLanguage();
    const {currentUser} = useAuth();

    const [modalType, setModalType] = useState<"user" | "notification" | null>(
        null
    );
    const [members, setMembers] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [alerts, setAlerts] = useState<INotification[]>([]);
    const [kpis, setKpis] = useState({
        revenue: 3450,
        theft: 87,
        waste: 45,
        turnover: 87,
        performance: 91,
        orders: 156,
    });

    const isCustomerOrManager =
        currentUser?.role?.toLowerCase() === ROLE.CUSTOMER ||
        currentUser?.role?.toLowerCase() === ROLE.MANAGER;

    const kpiCards = [
        {
            label: t("kpi.revenue"),
            value: `€${kpis.revenue.toLocaleString()}`,
            icon: TrendingUp,
            color: "bg-emerald-500",
            trend: "+12%",
        },
        {
            label: t("kpi.theft"),
            value: `€${kpis.theft}`,
            icon: AlertTriangle,
            color: "bg-red-500",
            trend: "-3%",
        },
        {
            label: t("kpi.waste"),
            value: `€${kpis.waste}`,
            icon: Trash2,
            color: "bg-amber-500",
            trend: "-8%",
        },
        {
            label: t("kpi.turnover"),
            value: `${kpis.turnover}%`,
            icon: UsersIcon,
            color: "bg-purple-500",
            trend: "+5%",
        },
        {
            label: t("kpi.performance"),
            value: `${kpis.performance}%`,
            icon: Star,
            color: "bg-blue-500",
            trend: "+2%",
        },
        {
            label: t("kpi.orders"),
            value: kpis.orders.toString(),
            icon: ShoppingCart,
            color: "bg-teal-500",
            trend: "+18%",
        },
    ];

    const fetchCompanyMembers = async () => {
        if (!currentUser?.customerId) return;

        let rolesToFetch: string[] = [];
        if (currentUser.role?.toLowerCase() === "manager") rolesToFetch = ["worker"];
        else if (currentUser.role?.toLowerCase() === "customer")
            rolesToFetch = ["manager", "worker"];
        else {
            rolesToFetch = ["worker"];
        }

        if (rolesToFetch.length === 0) {
            setMembers([]);
            return;
        }

        setLoading(true);
        try {
            const q = query(
                collection(db, "users"),
                where("customerId", "==", currentUser.customerId),
                where("role", "in", rolesToFetch)
            );

            const querySnapshot = await getDocs(q);
            const data: AppUser[] = querySnapshot.docs.map(
                (doc) => ({id: doc.id, ...doc.data()} as AppUser)
            );
            setMembers(data);
        } catch (err) {
            console.error("Error fetching company members:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchNotifications = async () => {
        if (!currentUser?.customerId) return [];

        // Single-field where() needs no composite index — sort client-side
        const q = currentUser.type
            ? query(
                collection(db, "notifications"),
                where("customerId", "==", currentUser.customerId),
                where("visibleFor", "array-contains", currentUser.type),
              )
            : query(
                collection(db, "notifications"),
                where("customerId", "==", currentUser.customerId),
              );

        const snapshot = await getDocs(q);

        const notifications: INotification[] = snapshot.docs
            .map((doc) => ({ id: doc.id, ...(doc.data() as Omit<INotification, "id">) }))
            .sort((a, b) => {
                const ta = a.createdAt?.toMillis?.() ?? 0;
                const tb = b.createdAt?.toMillis?.() ?? 0;
                return tb - ta;
            });

        setAlerts(notifications);
    };

    const handleCloseModal = () => {
        setModalType(null);
    };

    const handleOnUsersAdded = () => {
        handleCloseModal();
        fetchCompanyMembers();
    };

    const handleOnNotificationAdded = () => {
        handleCloseModal();
        fetchNotifications();
    };

    useEffect(() => {
        setKpis((prev) => ({
            revenue: prev.revenue + Math.floor(Math.random() * 100) - 50,
            theft: Math.max(0, prev.theft + Math.floor(Math.random() * 10) - 5),
            waste: Math.max(0, prev.waste + Math.floor(Math.random() * 8) - 4),
            turnover: Math.min(
                100,
                Math.max(0, prev.turnover + Math.floor(Math.random() * 6) - 3)
            ),
            performance: Math.min(
                100,
                Math.max(70, prev.performance + Math.floor(Math.random() * 4) - 2)
            ),
            orders: prev.orders + Math.floor(Math.random() * 3),
        }));
    }, []);

    useEffect(() => {
        if (currentUser) {
            fetchCompanyMembers();
            fetchNotifications();
        }
    }, [currentUser]);

    // -------------------------------------------
    // Render
    // -------------------------------------------

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* KPI cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {kpiCards.map((kpi, index) => {
                    const Icon = kpi.icon;
                    return (
                        <div
                            key={kpi.label}
                            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all duration-300 animate-in slide-in-from-bottom"
                            style={{animationDelay: `${index * 100}ms`}}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-slate-600 font-medium">
                                        {kpi.label}
                                    </p>
                                    <p className="text-3xl font-bold text-slate-900 mt-2 transition-all duration-500">
                                        {kpi.value}
                                    </p>
                                    <p className="text-sm text-emerald-600 font-medium mt-2">
                                        {kpi.trend}
                                    </p>
                                </div>
                                <div className={`${kpi.color} p-3 rounded-lg`}>
                                    <Icon className="w-6 h-6 text-white"/>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Dodaj korisnika i obavijest */}
            {isCustomerOrManager && (
                <div className="flex flex-row justify-between">
                    <button
                        onClick={() => setModalType("user")}
                        type="button"
                        className="text-white bg-brand box-border border border-transparent hover:bg-brand-strong focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-full text-sm px-4 py-2.5 focus:outline-none"
                    >
                        Dodaj korisnika
                    </button>
                    <button
                        onClick={() => setModalType("notification")}
                        type="button"
                        className="text-white bg-brand box-border border border-transparent hover:bg-brand-strong focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-full text-sm px-4 py-2.5 focus:outline-none"
                    >
                        Dodaj obavijest
                    </button>
                </div>
            )}

            {/* PWA Screens — Manager only */}
            {currentUser?.role?.toLowerCase() === ROLE.MANAGER && (
                <div>
                    <h2 className="text-lg font-bold text-slate-900 mb-4">PWA Ekrani</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            {
                                id: "manager",
                                label: "Menadžer",
                                description: "Checklist smjene, KPI, rasporedi",
                                icon: ListTodo,
                                color: "bg-violet-500",
                                ring: "hover:ring-violet-300",
                            },
                            {
                                id: "waiter",
                                label: "Konobar",
                                description: "Narudžbe, checklist, napojnice",
                                icon: Smartphone,
                                color: "bg-blue-500",
                                ring: "hover:ring-blue-300",
                            },
                            {
                                id: "cook",
                                label: "Kuvar",
                                description: "HACCP, recepti, narudžbe kuhinje",
                                icon: ChefHat,
                                color: "bg-orange-500",
                                ring: "hover:ring-orange-300",
                            },
                            {
                                id: "housekeeper",
                                label: "Sobarica",
                                description: "Čišćenje soba, checklist, status",
                                icon: HomeIcon,
                                color: "bg-emerald-500",
                                ring: "hover:ring-emerald-300",
                            },
                        ].map((pwa) => {
                            const Icon = pwa.icon;
                            return (
                                <button
                                    key={pwa.id}
                                    onClick={() => navigate(`/app/${pwa.id}`)}
                                    className={`bg-white rounded-xl border border-slate-200 p-5 text-left shadow-sm hover:shadow-md hover:ring-2 ${pwa.ring} transition-all duration-200 group`}
                                >
                                    <div className={`${pwa.color} w-10 h-10 rounded-lg flex items-center justify-center mb-3`}>
                                        <Icon className="w-5 h-5 text-white" />
                                    </div>
                                    <p className="font-semibold text-slate-900 text-sm">{pwa.label}</p>
                                    <p className="text-xs text-slate-500 mt-1 leading-tight">{pwa.description}</p>
                                    <div className="flex items-center gap-1 mt-3 text-xs font-medium text-slate-400 group-hover:text-slate-600 transition-colors">
                                        Otvori <ArrowRight className="w-3 h-3" />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Members i Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Members / Leaderboard */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">
                        {t("workers.leaderboard")}
                    </h2>
                    {loading ? (
                        <p>Loading...</p>
                    ) : (
                        <div className="space-y-3">
                            {members.map((member, index) => (
                                <div
                                    key={member.id}
                                    onClick={() =>
                                        navigate(`/app/workers/${encodeURIComponent(member.id)}`, {
                                            state: {worker: member},
                                        })
                                    }
                                    className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition"
                                >
                                    {/* Ranking */}
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                                            index === 0 ? "bg-amber-500" : index === 1 ? "bg-slate-400" : "bg-orange-600"
                                        }`}
                                    >
                                        {index + 1}
                                    </div>

                                    {/* Avatar */}
                                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                                        {member.photoURL ? (
                                            <img
                                                src={member.photoURL}
                                                alt={member.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div
                                                className="w-full h-full bg-gray-300 flex items-center justify-center text-white font-bold">
                                                {member.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>

                                    {/* Name and role */}
                                    <div className="flex-1">
                                        <p
                                            className={`font-medium ${
                                                currentUser?.email === member.email ? "text-blue-500" : "text-slate-900"
                                            }`}
                                        >
                                            {member.name}
                                        </p>
                                        <p
                                            className={`text-sm ${
                                                currentUser?.email === member.email ? "text-blue-500" : "text-slate-600"
                                            }`}
                                        >
                                            {member.role} {member.type}
                                        </p>
                                    </div>

                                    {/* Score */}
                                    <div className="text-right">
                                        <div className="flex items-center gap-1">
        <span
            className={`font-bold ${
                currentUser?.email === member.email ? "text-blue-500" : "text-slate-600"
            }`}
        >
          7.7
        </span>
                                            <Star className="w-3 h-3 text-amber-500 fill-amber-500"/>
                                        </div>
                                    </div>
                                </div>
                            ))}

                        </div>
                    )}
                </div>

                {/* Alerts */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">
                        {t("alerts.title")}
                    </h2>
                    <div className="space-y-3">
                        {alerts.map((alert) => (
                            <div
                                key={alert.id}
                                className={`p-3 border rounded-lg ${
                                    severityColors[
                                        (alert.priority ?? "low").toUpperCase() as keyof typeof severityColors
                                        ]
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-medium">{alert.title}</p>
                                        <p className="text-sm mt-1">{alert.description}</p>
                                    </div>
                                    <AlertTriangle className="w-5 h-5 flex-shrink-0"/>
                                </div>
                                {alert.amount && (
                                    <p className="text-lg font-bold mt-2">€{alert.amount}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <AddUserModal
                isOpen={modalType === "user"}
                onClose={handleCloseModal}
                onUserAdded={handleOnUsersAdded}
            />
            <AddNotificationModal
                isOpen={modalType === "notification"}
                onClose={handleCloseModal}
                onNotificationAdded={handleOnNotificationAdded}
            />
        </div>
    );
}
