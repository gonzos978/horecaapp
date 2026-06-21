import { useState } from 'react';
import { Flame, AlertTriangle, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useChecklists } from '../../hooks/useChecklists';
import ChecklistPanel from '../../components/ChecklistPanel';
import ShiftScoreCard from '../../components/ShiftScoreCard';
import { useChecklistNotifications } from '../../hooks/useChecklistNotifications';

export default function CookApp() {
  const { currentUser, user, logout } = useAuth();
  const cl = useChecklists('cook');
  useChecklistNotifications({
    activeShift: cl.activeShift,
    checklists: cl.checklists,
    submitted: cl.submitted,
    workerId: user?.uid,
    workerName: currentUser?.name,
  });

  const [orders] = useState([
    { id: 1, table: '5', items: '2x Šnicla, Pomfrit', time: '12:34', urgent: true },
    { id: 2, table: '3', items: 'Pizza Margherita, Caesar', time: '12:35', urgent: false },
    { id: 3, table: '8', items: 'Ćevapi, Šopska', time: '12:38', urgent: false },
  ]);

  const [artikli] = useState([
    { name: 'Piletina', qty: 18.5, unit: 'kg', low: false },
    { name: 'Pomfrit', qty: 3.2, unit: 'kg', low: true },
    { name: 'Vino', qty: 8, unit: 'kom', low: false },
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="bg-white shadow-md sticky top-0 z-50">
        <div className="p-4 flex items-center gap-4">
          <img src="/smarter_horeca_1.jpg" alt="Smarter HoReCA Logo" className="h-16 w-auto" />
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900">Smarter HoReCA</h1>
            <p className="text-sm text-orange-600 font-semibold">Kuvar</p>
            <p className="text-xs text-slate-600">{currentUser?.name}</p>
          </div>
          <button onClick={logout} className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Odjava">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Live Orders */}
        <div className="bg-white rounded-xl shadow-md p-5">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-bold text-slate-900">Porudžbine u Toku</h2>
            <span className="ml-auto bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-bold">
              {orders.length}
            </span>
          </div>
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className={`border-2 rounded-lg p-3 ${order.urgent ? 'bg-red-50 border-red-300' : 'bg-slate-50 border-slate-200'}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className={`text-2xl font-bold ${order.urgent ? 'text-red-600' : 'text-slate-900'}`}>
                      Sto {order.table}
                    </span>
                    {order.urgent && (
                      <span className="ml-2 bg-red-600 text-white px-2 py-0.5 rounded text-xs font-bold">HITNO</span>
                    )}
                  </div>
                  <span className="text-sm text-slate-600">{order.time}</span>
                </div>
                <p className="text-slate-800 font-medium">{order.items}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Artikli u upotrebi */}
        <div className="bg-white rounded-xl shadow-md p-5">
          <h2 className="text-lg font-bold text-slate-900 mb-3">Artikli u Upotrebi</h2>
          <div className="space-y-2">
            {artikli.map((item, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-3 rounded-lg ${item.low ? 'bg-amber-50 border border-amber-300' : 'bg-slate-50'}`}
              >
                <div>
                  <p className="font-medium text-slate-900">{item.name}</p>
                  {item.low && (
                    <p className="text-xs text-amber-700 font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Nisko stanje!
                    </p>
                  )}
                </div>
                <p className="text-lg font-bold text-slate-900">{item.qty} {item.unit}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Shift score */}
        <ShiftScoreCard score={cl.score} checklistsCompleted={cl.checklistsCompleted} checklistsTotal={cl.checklistsTotal} />

        {/* Checklists from Firestore */}
        <ChecklistPanel {...cl} accentColor="orange" emptyMessage="Nema aktivnih lista za kuvara." />
      </div>
    </div>
  );
}
