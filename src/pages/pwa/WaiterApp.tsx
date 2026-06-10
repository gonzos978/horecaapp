import { useState } from 'react';
import { Clock, TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useChecklists } from '../../hooks/useChecklists';
import ChecklistPanel from '../../components/ChecklistPanel';
import ShiftScoreCard from '../../components/ShiftScoreCard';
import { useChecklistNotifications } from '../../hooks/useChecklistNotifications';

export default function WaiterApp() {
  const { currentUser, user } = useAuth();
  const cl = useChecklists('waiter');
  const [tips] = useState(45.50);

  useChecklistNotifications({
    activeShift: cl.activeShift,
    checklists: cl.checklists,
    submitted: cl.submitted,
    workerId: user?.uid,
    workerName: currentUser?.name,
  });

  const shiftStart = cl.activeShift?.startTime?.toDate
    ? cl.activeShift.startTime.toDate().toLocaleTimeString('bs-BA', { hour: '2-digit', minute: '2-digit' })
    : '—';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="bg-white shadow-md sticky top-0 z-50">
        <div className="p-4 flex items-center gap-4">
          <img src="/smarter_horeca_1.jpg" alt="Smarter HoReCA Logo" className="h-16 w-auto" />
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900">Smarter HoReCA</h1>
            <p className="text-sm text-blue-600 font-semibold">Konobar</p>
            <p className="text-xs text-slate-600">{currentUser?.name}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Shift Info */}
        <div className="bg-white rounded-xl shadow-md p-5">
          <h2 className="text-lg font-bold text-slate-900 mb-3">Moja Smjena</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span className="text-xs text-emerald-700 font-medium">Prijava</span>
              </div>
              <p className="text-xl font-bold text-emerald-900">{shiftStart}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-blue-700 font-medium">Tips danas</span>
              </div>
              <p className="text-xl font-bold text-blue-900">€{tips.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Shift score */}
        <ShiftScoreCard score={cl.score} checklistsCompleted={cl.checklistsCompleted} checklistsTotal={cl.checklistsTotal} />

        {/* Checklists */}
        <ChecklistPanel {...cl} accentColor="blue" emptyMessage="Nema aktivnih lista za konobara." />

        {/* Anonymous Report */}
        <div className="bg-white rounded-xl shadow-md p-5">
          <h2 className="text-lg font-bold text-slate-900 mb-3">Anonimna Prijava</h2>
          <button className="w-full bg-slate-900 text-white rounded-lg py-3 font-semibold hover:bg-slate-800 transition-colors">
            Pošalji Prijavu (Anonimno)
          </button>
          <p className="text-xs text-slate-500 mt-2 text-center">Vaša identitet ostaje sakriven</p>
        </div>
      </div>
    </div>
  );
}
