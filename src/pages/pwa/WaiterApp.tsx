import { useState, useEffect } from 'react';
import { CheckCircle, Circle, Clock, TrendingUp, Mic } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function WaiterApp() {
  const [checklistItems, setChecklistItems] = useState([
    { id: 1, task: 'Pozdrav gosta u 30 sek', completed: false },
    { id: 2, task: 'Napravi eye contact', completed: false },
    { id: 3, task: 'Ponudi meni', completed: false },
    { id: 4, task: 'Proveri alergene', completed: false },
    { id: 5, task: 'Završi postavljanje stola', completed: false }
  ]);
  const [shiftStart, setShiftStart] = useState('06:00');
  const [tips, setTips] = useState(45.50);

  const toggleTask = (id: number) => {
    setChecklistItems(items =>
      items.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const completedCount = checklistItems.filter(item => item.completed).length;
  const progressPercent = (completedCount / checklistItems.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Header with Logo */}
      <div className="bg-white shadow-md sticky top-0 z-50">
        <div className="p-4 flex items-center gap-4">
          <img src="/smarter_horeca_1.jpg" alt="Smarter HoReCA Logo" className="h-16 w-auto" />
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900">Smarter HoReCA</h1>
            <p className="text-sm text-blue-600 font-semibold">Konobar</p>
            <p className="text-xs text-slate-600">Marko Petrović - W034</p>
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

        {/* Voice Order */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-5 text-white">
          <h2 className="text-lg font-bold mb-3">Glasovna Porudžbina</h2>
          <button className="w-full bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-xl p-4 hover:bg-white/30 transition-all">
            <Mic className="w-8 h-8 mx-auto mb-2" />
            <p className="font-semibold">Pritisni za snimanje</p>
          </button>
          <div className="mt-3 space-y-2">
            <p className="text-xs text-purple-100">Poslednje 3 porudžbine:</p>
            <div className="bg-white/10 rounded-lg p-2 text-sm">Sto 5: 2x Šnicla, Pomfrit</div>
            <div className="bg-white/10 rounded-lg p-2 text-sm">Sto 3: Pizza, 2x Kafa</div>
            <div className="bg-white/10 rounded-lg p-2 text-sm">Sto 8: Ćevapi, Pivo</div>
          </div>
        </div>

        {/* Check Lista */}
        <div className="bg-white rounded-xl shadow-md p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Check Lista - Opening</h2>
            <span className="text-sm font-semibold text-blue-600">
              {completedCount}/{checklistItems.length}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Tasks */}
          <div className="space-y-3">
            {checklistItems.map((item) => (
              <button
                key={item.id}
                onClick={() => toggleTask(item.id)}
                className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                  item.completed
                    ? 'bg-emerald-50 border-emerald-300'
                    : 'bg-slate-50 border-slate-200 hover:border-blue-300'
                }`}
              >
                {item.completed ? (
                  <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                ) : (
                  <Circle className="w-6 h-6 text-slate-400 flex-shrink-0" />
                )}
                <span className={`font-medium text-left ${
                  item.completed ? 'text-emerald-900 line-through' : 'text-slate-900'
                }`}>
                  {item.task}
                </span>
              </button>
            ))}
          </div>

          {completedCount === checklistItems.length && (
            <div className="mt-4 bg-emerald-100 border border-emerald-300 rounded-lg p-3 text-center">
              <p className="text-emerald-900 font-bold">✓ Check lista završena!</p>
            </div>
          )}
        </div>

        {/* Anonymous Report */}
        <div className="bg-white rounded-xl shadow-md p-5">
          <h2 className="text-lg font-bold text-slate-900 mb-3">Anonimna Prijava</h2>
          <button className="w-full bg-slate-900 text-white rounded-lg py-3 font-semibold hover:bg-slate-800 transition-colors">
            Pošalji Prijavu (Anonimno)
          </button>
          <p className="text-xs text-slate-500 mt-2 text-center">
            Vaša identitet ostaje sakriven
          </p>
        </div>
      </div>
    </div>
  );
}
