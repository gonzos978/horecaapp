import { useState } from 'react';
import { CheckCircle, Users, TrendingUp, AlertTriangle, Brain, CloudSun, Sparkles, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useChecklists } from '../../hooks/useChecklists';
import ChecklistPanel from '../../components/ChecklistPanel';
import ShiftScoreCard from '../../components/ShiftScoreCard';
import { useChecklistNotifications } from '../../hooks/useChecklistNotifications';
import WorkerHeader from '../../components/WorkerHeader';

export default function ManagerApp() {
  const { currentUser, user } = useAuth();
  const cl = useChecklists('manager');
  useChecklistNotifications({
    activeShift: cl.activeShift,
    checklists: cl.checklists,
    submitted: cl.submitted,
    workerId: user?.uid,
    workerName: currentUser?.name,
  });

  const [staffAlerts] = useState([
    { id: 1, worker: 'Ana Kovačević (Sobarica W012)', message: 'Nije popunila check listu za sobu 207', severity: 'high', time: '14:23' },
    { id: 2, worker: 'Marko Petrović (Konobar W034)', message: 'Check lista završena - 5/5 aktivnosti', severity: 'success', time: '12:45' },
    { id: 3, worker: 'Mirko Jovanović (Kuvar K001)', message: 'Check lista završena - HACCP izvještaj poslan', severity: 'success', time: '11:20' },
    { id: 4, worker: 'Jovana Nikolić (Konobar W028)', message: 'Kasni 15 minuta na smjenu', severity: 'medium', time: '09:15' },
  ]);

  const [aiShiftSuggestions] = useState([
    { day: 'Petak 12.07', shift: 'Večera', suggestion: 'Dodaj 2 konobara - Očekuje se veliko opterećenje', reason: 'Sunčan dan + Start vikenda', confidence: 87 },
    { day: 'Subota 13.07', shift: 'Ručak', suggestion: 'Dodatni kuvar na grilu', reason: 'Bašta puna + 32°C prognoza', confidence: 92 },
  ]);

  const [weatherPredictions] = useState([
    { date: 'Petak 12.07', weather: 'Sunčano', temp: '28°C', visitPrediction: 'Visoka gužva', capacity: 85, event: 'Start vikenda' },
    { date: 'Subota 13.07', weather: 'Sunčano', temp: '32°C', visitPrediction: 'Ekstremno velika gužva', capacity: 95, event: 'Lokalni koncert u 20h' },
    { date: 'Nedjelja 14.07', weather: 'Djelimično oblačno', temp: '26°C', visitPrediction: 'Umjerena gužva', capacity: 65, event: null },
  ]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-50 border-red-300 text-red-900';
      case 'medium': return 'bg-amber-50 border-amber-300 text-amber-900';
      case 'success': return 'bg-emerald-50 border-emerald-300 text-emerald-900';
      default: return 'bg-slate-50 border-slate-300 text-slate-900';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      default: return <Clock className="w-5 h-5 text-amber-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <WorkerHeader />

      <div className="p-4 space-y-4">
        {/* AI Assistant banner */}
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center gap-3 mb-3">
            <Brain className="w-6 h-6" />
            <h2 className="text-lg font-bold">AI Asistent</h2>
          </div>
          <p className="text-sm text-indigo-100">
            Sistem automatski prati performanse, predviđa gužve i optimizuje raspored.
          </p>
        </div>

        {/* Staff alerts */}
        <div className="bg-white rounded-xl shadow-md p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-bold text-slate-900">Obavještenja o Osoblju</h2>
            <span className="ml-auto bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-bold">
              {staffAlerts.filter((a) => a.severity === 'high').length}
            </span>
          </div>
          <div className="space-y-3">
            {staffAlerts.map((alert) => (
              <div key={alert.id} className={`border-2 rounded-lg p-4 ${getSeverityColor(alert.severity)}`}>
                <div className="flex items-start gap-3">
                  {getSeverityIcon(alert.severity)}
                  <div className="flex-1">
                    <p className="font-bold text-sm mb-1">{alert.worker}</p>
                    <p className="text-sm">{alert.message}</p>
                    <p className="text-xs opacity-70 mt-2">{alert.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weather predictions */}
        <div className="bg-white rounded-xl shadow-md p-5">
          <div className="flex items-center gap-2 mb-4">
            <CloudSun className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">AI Predikcija Posjeta</h2>
          </div>
          <div className="space-y-3">
            {weatherPredictions.map((pred, idx) => (
              <div key={idx} className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-bold text-slate-900">{pred.date}</p>
                    <p className="text-sm text-slate-600">{pred.weather} - {pred.temp}</p>
                  </div>
                  <CloudSun className="w-8 h-8 text-blue-500" />
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">Predviđena posjeta:</span>
                    <span className={`text-sm font-bold ${pred.capacity > 80 ? 'text-red-600' : pred.capacity > 60 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {pred.visitPrediction}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${pred.capacity > 80 ? 'bg-red-500' : pred.capacity > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${pred.capacity}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-600">Kapacitet: {pred.capacity}%</p>
                  {pred.event && (
                    <div className="mt-2 bg-indigo-100 border border-indigo-300 rounded-lg p-2">
                      <p className="text-xs text-indigo-900 font-medium flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Događaj: {pred.event}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shift suggestions */}
        <div className="bg-white rounded-xl shadow-md p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">AI Organizator Smjena</h2>
          </div>
          <div className="space-y-3">
            {aiShiftSuggestions.map((suggestion, idx) => (
              <div key={idx} className="bg-indigo-50 border-2 border-indigo-300 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-indigo-900">{suggestion.day}</p>
                    <p className="text-sm text-indigo-700">{suggestion.shift}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-indigo-600">AI Confidence</p>
                    <p className="text-lg font-bold text-indigo-900">{suggestion.confidence}%</p>
                  </div>
                </div>
                <div className="mt-3 bg-white rounded-lg p-3">
                  <p className="text-sm font-bold text-slate-900 mb-1">💡 Preporuka: {suggestion.suggestion}</p>
                  <p className="text-xs text-slate-600">Razlog: {suggestion.reason}</p>
                </div>
                <button className="mt-3 w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
                  Primijeni Preporuku
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Shift score */}
        <ShiftScoreCard score={cl.score} checklistsCompleted={cl.checklistsCompleted} checklistsTotal={cl.checklistsTotal} />

        {/* Manager checklists from Firestore */}
        <ChecklistPanel {...cl} accentColor="emerald" emptyMessage="Nema aktivnih lista za menadžera." />

        {/* Daily overview */}
        <div className="bg-white rounded-xl shadow-md p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">Dnevni Pregled</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 rounded-lg p-4 text-center">
              <p className="text-xs text-emerald-700 font-medium mb-2">Prihod Danas</p>
              <p className="text-2xl font-bold text-emerald-900">€3,245</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-xs text-blue-700 font-medium mb-2">Check Liste OK</p>
              <p className="text-2xl font-bold text-blue-900">2/3</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-4 text-center">
              <p className="text-xs text-amber-700 font-medium mb-2">Troškovi</p>
              <p className="text-2xl font-bold text-amber-900">€1,120</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <p className="text-xs text-purple-700 font-medium mb-2">Staff Aktivan</p>
              <p className="text-2xl font-bold text-purple-900">12/14</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
