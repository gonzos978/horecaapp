import { useState, useEffect } from 'react';
import { UtensilsCrossed, TrendingUp, DollarSign } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';

export default function Menu() {
  const { t } = useLanguage();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data } = await supabase
      .from('menu_items')
      .select('*')
      .order('category', { ascending: true });

    if (data) setItems(data);
  };

  const totalRevenue = items.reduce((sum, item) => sum + Number(item.price), 0);
  const avgMargin = items.reduce((sum, item) => {
    const margin = ((Number(item.price) - Number(item.cost || 0)) / Number(item.price)) * 100;
    return sum + margin;
  }, 0) / items.length;

  const categoryColors: { [key: string]: string } = {
    APPETIZER: 'bg-emerald-100 text-emerald-800',
    MAIN: 'bg-blue-100 text-blue-800',
    DESSERT: 'bg-pink-100 text-pink-800',
    BEVERAGE: 'bg-teal-100 text-teal-800',
    ALCOHOL: 'bg-purple-100 text-purple-800',
    COFFEE: 'bg-amber-100 text-amber-800',
    SIDE: 'bg-slate-100 text-slate-800'
  };

  return (
    <div className="space-y-6">
      <Header title={t('menu.title')} subtitle={`${items.length} stavki`} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 font-medium">Ukupan meni</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{items.length}</p>
              <p className="text-xs text-slate-500 mt-1">Stavki</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 font-medium">Prosečna marža</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{avgMargin.toFixed(0)}%</p>
              <p className="text-xs text-slate-500 mt-1">Profitabilnost</p>
            </div>
            <div className="bg-emerald-500 p-3 rounded-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 font-medium">Ukupna vrednost</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">€{totalRevenue.toFixed(2)}</p>
              <p className="text-xs text-slate-500 mt-1">Sve stavke</p>
            </div>
            <div className="bg-amber-500 p-3 rounded-lg">
              <DollarSign className="w-5 h-5 text-white" />
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
                  {t('menu.name')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {t('menu.category')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {t('menu.price')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {t('menu.cost')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {t('menu.margin')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {t('menu.prepTime')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item) => {
                const margin = ((Number(item.price) - Number(item.cost || 0)) / Number(item.price)) * 100;

                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-medium text-slate-900">{item.name}</p>
                          <p className="text-sm text-slate-500">{item.name_en}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${categoryColors[item.category]}`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-bold text-slate-900">€{Number(item.price).toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                      €{Number(item.cost || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-bold ${margin >= 60 ? 'text-emerald-600' : margin >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                        {margin.toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                      {item.prep_time_minutes} min
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.available ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          {t('menu.available')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                          Nedostupno
                        </span>
                      )}
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
