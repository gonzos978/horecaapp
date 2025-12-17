import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from "firebase/firestore";
import {
  TrendingUp,
  AlertTriangle,
  Trash2,
  Users as UsersIcon,
  Star,
  ShoppingCart,
} from "lucide-react";
import Header from "../components/Header";
import AddUserModal from "../components/AddUserModal";
import { db } from "../fb/firebase";
import { ROLE } from "../models/role";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";

interface AppUser {
  readonly address: string;
  readonly createdAt: Date;
  readonly customerId: string;
  readonly customerName: string;
  readonly email: string;
  readonly id: string;
  readonly name: string;
  readonly role: ROLE;
}

export default function Dashboard() {
  const { t, language } = useLanguage();
  const { currentUser } = useAuth();

  const [openModal, setOpenModal] = useState(false);
  const [members, setMembers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [kpis, setKpis] = useState({
    revenue: 3450,
    theft: 87,
    waste: 45,
    turnover: 87,
    performance: 91,
    orders: 156,
  });

  const isCustomerOrManager =
    currentUser?.role === ROLE.CUSTOMER || currentUser?.role === ROLE.MANAGER;

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
    if (currentUser.role === "manager") rolesToFetch = ["worker"];
    else if (currentUser.role === "customer")
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
        (doc) => ({ id: doc.id, ...doc.data() } as AppUser)
      );
      setMembers(data);
    } catch (err) {
      console.error("Error fetching company members:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleOnUsersAdded = () => {
    handleCloseModal();
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
    setAlerts([
      {
        id: "7f64c165-8acc-4030-82ee-572dea1b4d81",
        location_id: "4c5089f6-4fca-4d81-a733-68e712299bd8",
        worker_id: "18fc2272-fbda-4517-ae74-af9863d06759",
        type: "THEFT",
        severity: "CRITICAL",
        title_sr: "Krađa vina detektovana",
        title_hr: "Krađa vina detektirana",
        title_bs: "Krađa vina detektovana",
        title_en: "Wine Theft Detected",
        title_de: "Weindiebstahl erkannt",
        message_sr: "Krađa vina detektovana - €50 (Marko W034)",
        message_hr: "Krađa vina detektirana - €50 (Marko W034)",
        message_bs: "Krađa vina detektovana - €50 (Marko W034)",
        message_en: "Wine theft detected - €50 (Marko W034)",
        message_de: "Weindiebstahl erkannt - €50 (Marko W034)",
        amount: 50,
        metadata: {
          alert_id: "AL-001",
          evidence: "voice_gap_detection",
        },
        read: false,
        resolved: false,
        created_at: "2025-12-04T12:42:40.803129+00:00",
      },
      {
        id: "878a1655-8a50-4a72-988e-3f331feddd56",
        location_id: "4c5089f6-4fca-4d81-a733-68e712299bd8",
        worker_id: null,
        type: "THEFT",
        severity: "HIGH",
        title_sr: "Anonimna prijava: Krađa",
        title_hr: "Anonimna prijava: Krađa",
        title_bs: "Anonimna prijava: Krađa",
        title_en: "Anonymous Report: Theft",
        title_de: "Anonyme Meldung: Diebstahl",
        message_sr:
          "Anonimna prijava: Krađa od pouzdanog radnika (credibility 92%)",
        message_hr:
          "Anonimna prijava: Krađa od pouzdanog radnika (credibility 92%)",
        message_bs:
          "Anonimna prijava: Krađa od pouzdanog radnika (credibility 92%)",
        message_en:
          "Anonymous report: Theft from reliable worker (credibility 92%)",
        message_de:
          "Anonyme Meldung: Diebstahl von zuverlässigem Mitarbeiter (Glaubwürdigkeit 92%)",
        amount: null,
        metadata: {
          alert_id: "AL-002",
          report_id: "R-001",
          credibility: 92,
        },
        read: false,
        resolved: false,
        created_at: "2025-12-04T12:42:40.803129+00:00",
      },
      {
        id: "2ed3ca3d-bbd4-4adc-aa10-9ac1841e437d",
        location_id: "4c5089f6-4fca-4d81-a733-68e712299bd8",
        worker_id: null,
        type: "PERFORMANCE",
        severity: "CRITICAL",
        title_sr: "Rizik odlaska: 3 kuvara",
        title_hr: "Rizik odlaska: 3 kuhara",
        title_bs: "Rizik odlaska: 3 kuvara",
        title_en: "Turnover Risk: 3 Cooks",
        title_de: "Fluktuationsrisiko: 3 Köche",
        message_sr: "Turnover risk: 3 kuvara mogu otići (78%)",
        message_hr: "Turnover risk: 3 kuhara mogu otići (78%)",
        message_bs: "Turnover risk: 3 kuvara mogu otići (78%)",
        message_en: "Turnover risk: 3 cooks may leave (78%)",
        message_de: "Fluktuationsrisiko: 3 Köche könnten gehen (78%)",
        amount: null,
        metadata: {
          workers: ["K001", "K002", "K003"],
          alert_id: "AL-003",
          probability: 78,
        },
        read: false,
        resolved: false,
        created_at: "2025-12-04T12:42:40.803129+00:00",
      },
    ]);
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchCompanyMembers();
    }
  }, [currentUser]);

  // -------------------------------------------
  // Render
  // -------------------------------------------

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Header
        title={t("nav.dashboard")}
        subtitle={`${currentUser?.customerName} - ${currentUser?.name} - ${currentUser?.role}`}
      />

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all duration-300 animate-in slide-in-from-bottom"
              style={{ animationDelay: `${index * 100}ms` }}
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
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dodaj korisnika button */}
      {isCustomerOrManager && (
        <button
          onClick={() => setOpenModal(true)}
          type="button"
          className="text-white bg-brand box-border border border-transparent hover:bg-brand-strong focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-full text-sm px-4 py-2.5 focus:outline-none"
        >
          Dodaj korisnika
        </button>
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
                  className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                      index === 0
                        ? "bg-amber-500"
                        : index === 1
                        ? "bg-slate-400"
                        : "bg-orange-600"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p
                      className={`font-medium ${
                        currentUser?.email === member.email
                          ? "text-blue-500"
                          : "text-slate-900"
                      }`}
                    >
                      {member.name} {member.email}
                    </p>
                    <p
                      className={`text-sm ${
                        currentUser?.email === member.email
                          ? "text-blue-500"
                          : "text-slate-600"
                      }`}
                    >
                      {member.role}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <span
                        className={`font-bold ${
                          currentUser?.email === member.email
                            ? "text-blue-500"
                            : "text-slate-600"
                        }`}
                      >
                        7.7
                      </span>
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
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
            {alerts.map((alert) => {
              const severityColors = {
                LOW: "bg-blue-100 text-blue-800 border-blue-200",
                MEDIUM: "bg-amber-100 text-amber-800 border-amber-200",
                HIGH: "bg-orange-100 text-orange-800 border-orange-200",
                CRITICAL: "bg-red-100 text-red-800 border-red-200",
              };

              const titleKey = `title_${language}` as keyof typeof alert;
              const messageKey = `message_${language}` as keyof typeof alert;

              return (
                <div
                  key={alert.id}
                  className={`p-3 border rounded-lg ${
                    severityColors[
                      alert.severity as keyof typeof severityColors
                    ]
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{alert[titleKey]}</p>
                      <p className="text-sm mt-1">{alert[messageKey]}</p>
                    </div>
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  </div>
                  {alert.amount && (
                    <p className="text-lg font-bold mt-2">€{alert.amount}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <AddUserModal
        isOpen={openModal}
        onClose={handleCloseModal}
        onUserAdded={handleOnUsersAdded}
      />
    </div>
  );
}
