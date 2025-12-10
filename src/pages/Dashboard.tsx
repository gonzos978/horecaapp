import { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, Trash2, Users as UsersIcon, Star, ShoppingCart } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';

export default function Dashboard() {
  const { t, language } = useLanguage();
  const [kpis, setKpis] = useState({
    revenue: 3450,
    theft: 87,
    waste: 45,
    turnover: 87,
    performance: 91,
    orders: 156
  });
  const [workers, setWorkers] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      setKpis(prev => ({
        revenue: prev.revenue + Math.floor(Math.random() * 100) - 50,
        theft: Math.max(0, prev.theft + Math.floor(Math.random() * 10) - 5),
        waste: Math.max(0, prev.waste + Math.floor(Math.random() * 8) - 4),
        turnover: Math.min(100, Math.max(0, prev.turnover + Math.floor(Math.random() * 6) - 3)),
        performance: Math.min(100, Math.max(70, prev.performance + Math.floor(Math.random() * 4) - 2)),
        orders: prev.orders + Math.floor(Math.random() * 3)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    const { data: workersData } = await supabase
      .from('workers')
      .select('*')
      .order('performance_score', { ascending: false })
      .limit(3);

    const { data: alertsData } = await supabase
      .from('alerts')
      .select('*')
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(3);

    if (workersData) setWorkers(workersData);
    if (alertsData) setAlerts(alertsData);
  };

  const kpiCards = [
    {
      label: t('kpi.revenue'),
      value: `€${kpis.revenue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'bg-emerald-500',
      trend: '+12%'
    },
    {
      label: t('kpi.theft'),
      value: `€${kpis.theft}`,
      icon: AlertTriangle,
      color: 'bg-red-500',
      trend: '-3%'
    },
    {
      label: t('kpi.waste'),
      value: `€${kpis.waste}`,
      icon: Trash2,
      color: 'bg-amber-500',
      trend: '-8%'
    },
    {
      label: t('kpi.turnover'),
      value: `${kpis.turnover}%`,
      icon: UsersIcon,
      color: 'bg-purple-500',
      trend: '+5%'
    },
    {
      label: t('kpi.performance'),
      value: `${kpis.performance}%`,
      icon: Star,
      color: 'bg-blue-500',
      trend: '+2%'
    },
    {
      label: t('kpi.orders'),
      value: kpis.orders.toString(),
      icon: ShoppingCart,
      color: 'bg-teal-500',
      trend: '+18%'
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Header title={t('nav.dashboard')} subtitle="Restoran Beograd Centar" />

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
                  <p className="text-sm text-slate-600 font-medium">{kpi.label}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2 transition-all duration-500">
                    {kpi.value}
                  </p>
                  <p className="text-sm text-emerald-600 font-medium mt-2">{kpi.trend}</p>
                </div>
                <div className={`${kpi.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">{t('workers.leaderboard')}</h2>
          <div className="space-y-3">
            {workers.map((worker, index) => (
              <div key={worker.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                  index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-slate-400' : 'bg-orange-600'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{worker.first_name} {worker.last_name}</p>
                  <p className="text-sm text-slate-600">{worker.code}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">{worker.performance_score}</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span className="text-xs text-slate-600">{worker.on_time_percentage}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">{t('alerts.title')}</h2>
          <div className="space-y-3">
            {alerts.map((alert) => {
              const severityColors = {
                LOW: 'bg-blue-100 text-blue-800 border-blue-200',
                MEDIUM: 'bg-amber-100 text-amber-800 border-amber-200',
                HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
                CRITICAL: 'bg-red-100 text-red-800 border-red-200'
              };

              const titleKey = `title_${language}` as keyof typeof alert;
              const messageKey = `message_${language}` as keyof typeof alert;

              return (
                <div key={alert.id} className={`p-3 border rounded-lg ${severityColors[alert.severity as keyof typeof severityColors]}`}>
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
    </div>
  );
}
