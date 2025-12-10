import { useState, useEffect } from 'react';
import { Package, AlertTriangle, CheckCircle, TrendingDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';

export default function Inventory() {
  const { t } = useLanguage();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data } = await supabase
      .from('artikli')
      .select('*')
      .order('variance_cost', { ascending: true });

    if (data) setItems(data);
  };

  const totalVariance = items.reduce((sum, item) => sum + Number(item.variance_cost || 0), 0);
  const criticalItems = items.filter(item => Number(item.quantity) < Number(item.min_threshold));

  const getStatus = (item: any) => {
    const qty = Number(item.quantity);
    const threshold = Number(item.min_threshold);
    const varianceCost = Number(item.variance_cost || 0);

    if (varianceCost < -20) return { label: t('artikli.critical'), color: 'bg-red-100 text-red-800 border-red-200' };
    if (qty < threshold) return { label: t('artikli.warning'), color: 'bg-amber-100 text-amber-800 border-amber-200' };
    if (varianceCost < -5) return { label: t('artikli.warning'), color: 'bg-amber-100 text-amber-800 border-amber-200' };
    return { label: t('artikli.ok'), color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
  };

  return (
    <div className="space-y-6">
      <Header title={t('artikli.title')} subtitle={`${items.length} stavki`} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 font-medium">Ukupna razlika</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                €{Math.abs(totalVariance).toFixed(2)}
              </p>
              <p className="text-xs text-slate-500 mt-1">Manjak inventara</p>
            </div>
            <div className="bg-red-500 p-3 rounded-lg">
              <TrendingDown className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 font-medium">Kritične stavke</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{criticalItems.length}</p>
              <p className="text-xs text-slate-500 mt-1">Ispod minimuma</p>
            </div>
            <div className="bg-amber-500 p-3 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 font-medium">Ukupno stavki</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{items.length}</p>
              <p className="text-xs text-slate-500 mt-1">U bazi</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <Package className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {t('artikli.name')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {t('artikli.category')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {t('artikli.quantity')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {t('artikli.expected')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {t('artikli.actual')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {t('artikli.variance')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item) => {
                const status = getStatus(item);
                const varianceCost = Number(item.variance_cost || 0);

                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{item.name}</p>
                          <p className="text-sm text-slate-500">€{Number(item.unit_cost).toFixed(2)}/{item.unit}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-slate-900">
                        {Number(item.quantity).toFixed(1)} {item.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                      {item.expected_qty ? `${Number(item.expected_qty).toFixed(1)} ${item.unit}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                      {item.actual_qty ? `${Number(item.actual_qty).toFixed(1)} ${item.unit}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${varianceCost < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {varianceCost < 0 ? '-' : '+'}€{Math.abs(varianceCost).toFixed(2)}
                        </span>
                        {varianceCost < -10 && <AlertTriangle className="w-4 h-4 text-red-500" />}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg border text-xs font-medium ${status.color}`}>
                        {status.label === t('artikli.ok') && <CheckCircle className="w-3 h-3" />}
                        {status.label !== t('artikli.ok') && <AlertTriangle className="w-3 h-3" />}
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
