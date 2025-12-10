import { useState, useEffect } from 'react';
import { ClipboardCheck, Camera, CheckCircle2, Circle, AlertTriangle, TrendingUp, TrendingDown, User } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';

export default function Checklists() {
  const { t } = useLanguage();
  const [checklists, setChecklists] = useState<any[]>([]);
  const [selectedChecklist, setSelectedChecklist] = useState<any>(null);
  const [showReports, setShowReports] = useState(false);

  const [workerReports] = useState([
    {
      id: 1,
      worker_name: 'Stefan Marković',
      role: 'Menadžer',
      worker_id: 'MGR01',
      checklist_status: 'completed',
      completion_rate: 100,
      tasks_completed: 5,
      tasks_total: 5,
      rating: 5.0,
      last_completed: '08.12.2025 18:30',
      streak: 15
    },
    {
      id: 2,
      worker_name: 'Mirko Jovanović',
      role: 'Kuvar',
      worker_id: 'K001',
      checklist_status: 'completed',
      completion_rate: 100,
      tasks_completed: 8,
      tasks_total: 8,
      rating: 4.9,
      last_completed: '08.12.2025 14:20',
      streak: 22,
      note: 'HACCP izvještaj poslan'
    },
    {
      id: 3,
      worker_name: 'Marko Petrović',
      role: 'Konobar',
      worker_id: 'W034',
      checklist_status: 'completed',
      completion_rate: 100,
      tasks_completed: 5,
      tasks_total: 5,
      rating: 4.7,
      last_completed: '08.12.2025 12:45',
      streak: 12
    },
    {
      id: 4,
      worker_name: 'Ana Kovačević',
      role: 'Sobarica',
      worker_id: 'W012',
      checklist_status: 'incomplete',
      completion_rate: 62,
      tasks_completed: 5,
      tasks_total: 8,
      rating: 3.8,
      last_completed: '07.12.2025 16:00',
      streak: 0,
      missing_tasks: ['Provjera mini-bara', 'Kontrola peškira', 'Fotografija sobe'],
      alert_sent: true,
      rating_penalty: -0.5
    },
    {
      id: 5,
      worker_name: 'Jovana Nikolić',
      role: 'Konobar',
      worker_id: 'W028',
      checklist_status: 'partial',
      completion_rate: 80,
      tasks_completed: 4,
      tasks_total: 5,
      rating: 4.2,
      last_completed: '08.12.2025 15:30',
      streak: 8,
      missing_tasks: ['Prebroj artiklе sa kase']
    },
    {
      id: 6,
      worker_name: 'Nikola Đorđević',
      role: 'Šef konobara',
      worker_id: 'W001',
      checklist_status: 'completed',
      completion_rate: 100,
      tasks_completed: 6,
      tasks_total: 6,
      rating: 4.8,
      last_completed: '08.12.2025 19:00',
      streak: 18
    }
  ]);

  const completionStats = {
    total_workers: workerReports.length,
    completed: workerReports.filter(w => w.checklist_status === 'completed').length,
    incomplete: workerReports.filter(w => w.checklist_status === 'incomplete').length,
    partial: workerReports.filter(w => w.checklist_status === 'partial').length,
    avg_rating: (workerReports.reduce((sum, w) => sum + w.rating, 0) / workerReports.length).toFixed(1),
    avg_completion: Math.round(workerReports.reduce((sum, w) => sum + w.completion_rate, 0) / workerReports.length)
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data } = await supabase
      .from('checklists')
      .select('*')
      .eq('active', true);

    if (data) setChecklists(data);
  };

  const typeColors = {
    OPENING: 'bg-emerald-100 text-emerald-800',
    CLOSING: 'bg-amber-100 text-amber-800',
    HACCP: 'bg-red-100 text-red-800',
    CLEANING: 'bg-blue-100 text-blue-800',
    MAINTENANCE: 'bg-purple-100 text-purple-800',
    SAFETY: 'bg-orange-100 text-orange-800'
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'incomplete': return 'bg-red-100 text-red-800';
      case 'partial': return 'bg-amber-100 text-amber-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Završeno';
      case 'incomplete': return 'Nije završeno';
      case 'partial': return 'Djelimično';
      default: return 'Nepoznato';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Header title={t('checklist.title')} subtitle={`${checklists.length} aktivnih listi`} />
        <button
          onClick={() => setShowReports(!showReports)}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold shadow-lg"
        >
          {showReports ? 'Prikaži Liste' : 'Izvještaji Radnika'}
        </button>
      </div>

      {showReports && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Ukupno Radnika</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{completionStats.total_workers}</p>
                </div>
                <User className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-emerald-50 rounded-xl shadow-md border-2 border-emerald-300 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-700 font-medium">Završeno</p>
                  <p className="text-3xl font-bold text-emerald-900 mt-1">{completionStats.completed}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Prosečna Ocena</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{completionStats.avg_rating}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Prosečan %</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{completionStats.avg_completion}%</p>
                </div>
                <ClipboardCheck className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-xl font-bold text-red-900 mb-2">🚨 Alert Vlasniku - Nepopunjene Čekliste</h3>
                <div className="space-y-3">
                  {workerReports.filter(w => w.checklist_status !== 'completed').map((worker) => (
                    <div key={worker.id} className="bg-white border border-red-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-bold text-slate-900">{worker.worker_name} ({worker.role})</p>
                          <p className="text-sm text-slate-600">ID: {worker.worker_id}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${getStatusColor(worker.checklist_status)}`}>
                          {getStatusLabel(worker.checklist_status)}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div className="bg-slate-50 rounded p-2 text-center">
                          <p className="text-xs text-slate-600">Završeno</p>
                          <p className="text-lg font-bold text-slate-900">{worker.tasks_completed}/{worker.tasks_total}</p>
                        </div>
                        <div className="bg-slate-50 rounded p-2 text-center">
                          <p className="text-xs text-slate-600">Procenat</p>
                          <p className="text-lg font-bold text-slate-900">{worker.completion_rate}%</p>
                        </div>
                        <div className={`rounded p-2 text-center ${worker.rating_penalty ? 'bg-red-100' : 'bg-slate-50'}`}>
                          <p className="text-xs text-slate-600">Ocena</p>
                          <p className="text-lg font-bold text-slate-900">
                            {worker.rating}
                            {worker.rating_penalty && (
                              <span className="text-xs text-red-600 ml-1">({worker.rating_penalty})</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {worker.missing_tasks && (
                        <div className="bg-red-50 border border-red-200 rounded p-3">
                          <p className="text-sm font-medium text-red-900 mb-2">Nedostajući zadaci:</p>
                          <ul className="space-y-1">
                            {worker.missing_tasks.map((task, idx) => (
                              <li key={idx} className="text-sm text-red-700 flex items-start gap-2">
                                <span>•</span>
                                <span>{task}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {worker.alert_sent && (
                        <div className="mt-3 bg-amber-100 border border-amber-300 rounded p-2">
                          <p className="text-xs font-bold text-amber-900">✓ Vlasnik automatski obavešten - Ocena snižena za {Math.abs(worker.rating_penalty || 0)} poena</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-900">Izvještaj Radnika - Check Liste</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Radnik</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Uloga</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Zadaci</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">%</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Ocena</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Serija</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Poslednji put</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {workerReports.map((worker) => (
                    <tr key={worker.id} className={`hover:bg-slate-50 transition-colors ${
                      worker.checklist_status === 'incomplete' ? 'bg-red-50' : ''
                    }`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-bold text-slate-900">{worker.worker_name}</p>
                          <p className="text-xs text-slate-600">{worker.worker_id}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-700">{worker.role}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${getStatusColor(worker.checklist_status)}`}>
                          {getStatusLabel(worker.checklist_status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-slate-900">
                          {worker.tasks_completed}/{worker.tasks_total}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                worker.completion_rate === 100
                                  ? 'bg-emerald-500'
                                  : worker.completion_rate >= 80
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${worker.completion_rate}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold text-slate-900">{worker.completion_rate}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <span className="text-lg font-bold text-slate-900">{worker.rating}</span>
                          {worker.rating_penalty && (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                        {worker.rating_penalty && (
                          <p className="text-xs text-red-600 font-medium">Snižena</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
                          worker.streak > 10 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {worker.streak} 🔥
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {worker.last_completed}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!showReports && !selectedChecklist ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {checklists.map((checklist) => {
            const tasks = JSON.parse(checklist.tasks);
            return (
              <div
                key={checklist.id}
                onClick={() => setSelectedChecklist(checklist)}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{checklist.name}</h3>
                    <p className="text-sm text-slate-600 mt-1">{tasks.length} zadataka</p>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-xs font-medium ${typeColors[checklist.type as keyof typeof typeColors]}`}>
                    {checklist.type}
                  </span>
                </div>

                <div className="space-y-2">
                  {tasks.slice(0, 3).map((task: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                      <Circle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{task.task}</span>
                    </div>
                  ))}
                  {tasks.length > 3 && (
                    <p className="text-sm text-slate-500 pl-6">+{tasks.length - 3} more...</p>
                  )}
                </div>

                <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  Otvori listu
                </button>
              </div>
            );
          })}
        </div>
      ) : !showReports ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{selectedChecklist.name}</h2>
              <p className="text-slate-600 mt-1">{selectedChecklist.frequency}</p>
            </div>
            <button
              onClick={() => setSelectedChecklist(null)}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
            >
              ← Nazad
            </button>
          </div>

          {selectedChecklist.legal_reference && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm font-medium text-amber-900">
                📋 Pravni osnov: {selectedChecklist.legal_reference}
              </p>
            </div>
          )}

          <div className="space-y-4">
            {JSON.parse(selectedChecklist.tasks).map((task: any, idx: number) => (
              <div
                key={idx}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:border-blue-300 transition-all"
              >
                <div className="flex items-start gap-4">
                  <button className="mt-1 flex-shrink-0">
                    <Circle className="w-6 h-6 text-slate-400 hover:text-blue-600 transition-colors" />
                  </button>

                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        {task.time && (
                          <span className="inline-block px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium mb-2">
                            ⏰ {task.time}
                          </span>
                        )}
                        <h4 className="text-lg font-medium text-slate-900">{task.task}</h4>
                        {task.legal && (
                          <p className="text-sm text-amber-700 mt-1">⚖️ {task.legal}</p>
                        )}
                      </div>
                    </div>

                    {task.photo_required && (
                      <div className="mt-4">
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                          <Camera className="w-4 h-4" />
                          {t('checklist.uploadPhoto')}
                        </button>
                      </div>
                    )}

                    {task.ai_validation && (
                      <div className="mt-2 text-sm text-purple-700 bg-purple-50 px-3 py-1 rounded inline-block">
                        🤖 AI validacija: {task.ai_validation}
                      </div>
                    )}

                    {task.input_type === 'temperature' && (
                      <div className="mt-4">
                        <input
                          type="number"
                          placeholder="Temperatura (°C)"
                          className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className="w-full px-6 py-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-bold text-lg shadow-lg">
            <CheckCircle2 className="w-5 h-5 inline mr-2" />
            {t('checklist.complete')}
          </button>
        </div>
      ) : null}
    </div>
  );
}
