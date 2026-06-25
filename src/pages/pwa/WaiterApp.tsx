import { useState } from 'react';
import { Clock, TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useChecklists } from '../../hooks/useChecklists';
import ChecklistPanel from '../../components/ChecklistPanel';
import ShiftScoreCard from '../../components/ShiftScoreCard';
import { useChecklistNotifications } from '../../hooks/useChecklistNotifications';
import WorkerHeader from '../../components/WorkerHeader';

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
      <WorkerHeader />

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

      </div>
    </div>
  );
}
