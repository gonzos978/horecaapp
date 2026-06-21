import { useState } from 'react';
import { Clock, TrendingUp, Lock, ShieldCheck, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useChecklists } from '../../hooks/useChecklists';
import ChecklistPanel from '../../components/ChecklistPanel';
import ShiftScoreCard from '../../components/ShiftScoreCard';
import { useChecklistNotifications } from '../../hooks/useChecklistNotifications';
import { useWorkerEligibility } from '../../hooks/useWorkerEligibility';

export default function WaiterApp() {
  const { currentUser, user, logout } = useAuth();
  const cl = useChecklists('waiter');
  const eligibility = useWorkerEligibility(currentUser?.email);
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
          <button onClick={logout} className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Odjava">
            <LogOut className="w-5 h-5" />
          </button>
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
        <AnonymousReportCard eligibility={eligibility} />
      </div>
    </div>
  );
}

function AnonymousReportCard({ eligibility }: { eligibility: ReturnType<typeof useWorkerEligibility> }) {
  if (eligibility.loading) return null;

  if (eligibility.eligible) {
    return (
      <div className="bg-white rounded-xl shadow-md p-5">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-5 h-5 text-slate-700" />
          <h2 className="text-lg font-bold text-slate-900">Anonimna Prijava</h2>
        </div>
        <button className="w-full bg-slate-900 text-white rounded-lg py-3 font-semibold hover:bg-slate-800 transition-colors">
          Pošalji Prijavu (Anonimno)
        </button>
        <p className="text-xs text-slate-500 mt-2 text-center">Vaša identitet ostaje sakriven</p>
      </div>
    );
  }

  // Build a clear explanation of what's missing
  const reasons: string[] = [];
  if (eligibility.shiftsNeeded > 0)
    reasons.push(`još ${eligibility.shiftsNeeded} smjen${eligibility.shiftsNeeded === 1 ? 'e' : 'a'} (${eligibility.shiftsCount}/30)`);
  if (eligibility.scoreNeeded > 0)
    reasons.push(`prosječan score ≥ 70% (trenutno ${eligibility.overallScore}%)`);

  return (
    <div className="bg-white rounded-xl shadow-md p-5 opacity-75">
      <div className="flex items-center gap-2 mb-3">
        <Lock className="w-5 h-5 text-slate-400" />
        <h2 className="text-lg font-bold text-slate-500">Anonimna Prijava</h2>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
        <p className="text-sm font-semibold text-slate-700">Zaključano — uslovi nisu ispunjeni:</p>
        {reasons.map((r, i) => (
          <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
            {r}
          </div>
        ))}
      </div>

      <button disabled className="mt-3 w-full bg-slate-200 text-slate-400 rounded-lg py-3 font-semibold cursor-not-allowed">
        Pošalji Prijavu (Anonimno)
      </button>
      <p className="text-xs text-slate-400 mt-2 text-center">
        Dostupno nakon 30 smjena i prosječnog scorea ≥ 70%
      </p>
    </div>
  );
}
