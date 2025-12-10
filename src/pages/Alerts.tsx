import { useState, useEffect } from 'react';
import { Bell, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';

export default function Alerts() {
  const { t, language } = useLanguage();
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setAlerts(data);
  };

  const markAsRead = async (id: string) => {
    await supabase
      .from('alerts')
      .update({ read: true })
      .eq('id', id);

    loadData();
  };

  const resolveAlert = async (id: string) => {
    await supabase
      .from('alerts')
      .update({ resolved: true, read: true })
      .eq('id', id);

    loadData();
  };

  const unreadCount = alerts.filter(a => !a.read).length;

  const severityConfig = {
    LOW: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Bell, label: t('alerts.severity.LOW') },
    MEDIUM: { color: 'bg-amber-100 text-amber-800 border-amber-200', icon: AlertTriangle, label: t('alerts.severity.MEDIUM') },
    HIGH: { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: AlertTriangle, label: t('alerts.severity.HIGH') },
    CRITICAL: { color: 'bg-red-100 text-red-800 border-red-200', icon: AlertTriangle, label: t('alerts.severity.CRITICAL') }
  };

  return (
    <div className="space-y-6">
      <Header title={t('alerts.title')} subtitle={`${unreadCount} ${t('alerts.unread').toLowerCase()}`} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {Object.entries(severityConfig).map(([severity, config]) => {
          const count = alerts.filter(a => a.severity === severity && !a.resolved).length;
          const Icon = config.icon;

          return (
            <div key={severity} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">{config.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{count}</p>
                </div>
                <div className={`${config.color} p-3 rounded-lg border`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-4">
        {alerts.map((alert) => {
          const config = severityConfig[alert.severity as keyof typeof severityConfig];
          const Icon = config.icon;
          const titleKey = `title_${language}` as keyof typeof alert;
          const messageKey = `message_${language}` as keyof typeof alert;

          return (
            <div
              key={alert.id}
              className={`bg-white rounded-xl shadow-sm border-2 p-6 transition-all ${
                alert.read ? 'opacity-60 border-slate-200' : 'border-slate-300'
              } ${alert.resolved ? 'bg-slate-50' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div className={`${config.color} p-3 rounded-lg border flex-shrink-0`}>
                  <Icon className="w-6 h-6" />
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-slate-900">{alert[titleKey]}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color} border`}>
                          {config.label}
                        </span>
                        {alert.resolved && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            <CheckCircle className="w-3 h-3" />
                            Rešeno
                          </span>
                        )}
                      </div>
                      <p className="text-slate-700 mt-2">{alert[messageKey]}</p>

                      {alert.amount && (
                        <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
                          <span className="text-sm font-medium text-red-700">Iznos:</span>
                          <span className="text-xl font-bold text-red-900">€{Number(alert.amount).toFixed(2)}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-3 text-sm text-slate-500">
                        <Clock className="w-4 h-4" />
                        {new Date(alert.created_at).toLocaleString('sr-RS')}
                      </div>
                    </div>
                  </div>

                  {!alert.resolved && (
                    <div className="flex items-center gap-3 mt-4">
                      {!alert.read && (
                        <button
                          onClick={() => markAsRead(alert.id)}
                          className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium text-sm"
                        >
                          {t('alerts.markRead')}
                        </button>
                      )}
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium text-sm"
                      >
                        {t('alerts.resolve')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
