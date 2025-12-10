import { useState, useEffect } from 'react';
import { Users, Star, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';

export default function Workers() {
  const { t } = useLanguage();
  const [workers, setWorkers] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: workersData } = await supabase
      .from('workers')
      .select('*')
      .order('performance_score', { ascending: false });

    const { data: positionsData } = await supabase
      .from('positions')
      .select('*');

    if (workersData) setWorkers(workersData);
    if (positionsData) setPositions(positionsData);
  };

  const getPositionName = (code: string) => {
    const position = positions.find(p => p.code === code);
    return position ? position.name_sr : code;
  };

  return (
    <div className="space-y-6">
      <Header title={t('workers.title')} subtitle={`${workers.length} ${t('workers.title').toLowerCase()}`} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {[
          { label: 'Ukupno radnika', value: workers.length, icon: Users, color: 'bg-blue-500' },
          { label: 'Aktivnih', value: workers.filter(w => w.active).length, icon: CheckCircle, color: 'bg-emerald-500' },
          { label: 'Prosečan skor', value: Math.round(workers.reduce((sum, w) => sum + w.performance_score, 0) / workers.length || 0), icon: Star, color: 'bg-amber-500' },
          { label: 'Na vreme %', value: Math.round(workers.reduce((sum, w) => sum + Number(w.on_time_percentage), 0) / workers.length || 0) + '%', icon: TrendingUp, color: 'bg-teal-500' }
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {t('workers.code')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {t('workers.name')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {t('workers.position')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {t('workers.score')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {t('workers.shifts')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {t('workers.onTime')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {t('workers.status')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {workers.map((worker, index) => (
                <tr key={worker.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-sm font-medium text-slate-900">{worker.code}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                        index === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                        index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500' :
                        index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                        'bg-gradient-to-br from-blue-400 to-blue-600'
                      }`}>
                        {worker.first_name[0]}{worker.last_name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{worker.first_name} {worker.last_name}</p>
                        <p className="text-sm text-slate-500">{worker.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getPositionName(worker.position_code)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-slate-900">{worker.performance_score}</span>
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                    {worker.total_shifts}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`font-medium ${
                      Number(worker.on_time_percentage) >= 95 ? 'text-emerald-600' :
                      Number(worker.on_time_percentage) >= 85 ? 'text-amber-600' :
                      'text-red-600'
                    }`}>
                      {Number(worker.on_time_percentage).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {worker.active ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        <CheckCircle className="w-3 h-3" />
                        {t('workers.active')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        <XCircle className="w-3 h-3" />
                        {t('workers.inactive')}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
