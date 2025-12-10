import { useState } from 'react';
import { CheckCircle, Circle, Flame, AlertTriangle, Camera, ThermometerSnowflake } from 'lucide-react';

export default function CookApp() {
  const [checklistItems, setChecklistItems] = useState([
    { id: 1, task: 'Provjeri temp frižidera #1', completed: false, hasInput: true, temp: '' },
    { id: 2, task: 'Provjeri temp frižidera #2', completed: false, hasInput: true, temp: '' },
    { id: 3, task: 'Očisti radnu površinu', completed: false, photoRequired: true },
    { id: 4, task: 'Dezinfekcija', completed: false, photoRequired: true },
    { id: 5, task: 'Pripremi sastojke za dan', completed: false }
  ]);

  const [orders, setOrders] = useState([
    { id: 1, table: '5', items: '2x Šnicla, Pomfrit', time: '12:34', urgent: true },
    { id: 2, table: '3', items: 'Pizza Margherita, Caesar', time: '12:35', urgent: false },
    { id: 3, table: '8', items: 'Ćevapi, Šopska', time: '12:38', urgent: false }
  ]);

  const [artikli, setArtikli] = useState([
    { name: 'Piletina', qty: 18.5, unit: 'kg', low: false },
    { name: 'Pomfrit', qty: 3.2, unit: 'kg', low: true },
    { name: 'Vino', qty: 8, unit: 'kom', low: false }
  ]);

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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header with Logo */}
      <div className="bg-white shadow-md sticky top-0 z-50">
        <div className="p-4 flex items-center gap-4">
          <img src="/smarter_horeca_1.jpg" alt="Smarter HoReCA Logo" className="h-16 w-auto" />
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900">Smarter HoReCA</h1>
            <p className="text-sm text-orange-600 font-semibold">Kuvar</p>
            <p className="text-xs text-slate-600">Mirko Jovanović - K001</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Live Orders - KDS */}
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
                className={`border-2 rounded-lg p-3 ${
                  order.urgent
                    ? 'bg-red-50 border-red-300'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className={`text-2xl font-bold ${
                      order.urgent ? 'text-red-600' : 'text-slate-900'
                    }`}>
                      Sto {order.table}
                    </span>
                    {order.urgent && (
                      <span className="ml-2 bg-red-600 text-white px-2 py-0.5 rounded text-xs font-bold">
                        HITNO
                      </span>
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
                className={`flex items-center justify-between p-3 rounded-lg ${
                  item.low ? 'bg-amber-50 border border-amber-300' : 'bg-slate-50'
                }`}
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
                <p className="text-lg font-bold text-slate-900">
                  {item.qty} {item.unit}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* HACCP Check Lista */}
        <div className="bg-white rounded-xl shadow-md p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">HACCP & Sigurnost</h2>
            <span className="text-sm font-semibold text-blue-600">
              {completedCount}/{checklistItems.length}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Tasks */}
          <div className="space-y-3">
            {checklistItems.map((item) => (
              <div key={item.id} className="space-y-2">
                <button
                  onClick={() => toggleTask(item.id)}
                  className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                    item.completed
                      ? 'bg-emerald-50 border-emerald-300'
                      : 'bg-slate-50 border-slate-200 hover:border-orange-300'
                  }`}
                >
                  {item.completed ? (
                    <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <Circle className="w-6 h-6 text-slate-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 text-left">
                    <span className={`font-medium ${
                      item.completed ? 'text-emerald-900 line-through' : 'text-slate-900'
                    }`}>
                      {item.task}
                    </span>
                    {item.photoRequired && (
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <Camera className="w-3 h-3" />
                        Fotografija obavezna
                      </p>
                    )}
                  </div>
                  {item.hasInput && (
                    <ThermometerSnowflake className="w-5 h-5 text-blue-500" />
                  )}
                </button>

                {item.hasInput && !item.completed && (
                  <input
                    type="number"
                    placeholder="Temperatura (°C)"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                )}

                {item.photoRequired && !item.completed && (
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                    <Camera className="w-4 h-4" />
                    Dodaj Fotografiju
                  </button>
                )}
              </div>
            ))}
          </div>

          {completedCount === checklistItems.length && (
            <div className="mt-4 bg-emerald-100 border border-emerald-300 rounded-lg p-3 text-center">
              <p className="text-emerald-900 font-bold">✓ HACCP provera završena!</p>
            </div>
          )}
        </div>

        {/* Moja Obuka */}
        <div className="bg-white rounded-xl shadow-md p-5">
          <h2 className="text-lg font-bold text-slate-900 mb-3">Moja Obuka</h2>
          <div className="bg-red-50 border border-red-300 rounded-lg p-4">
            <p className="text-red-900 font-bold mb-1">⚠️ HACCP Test: FAILED</p>
            <p className="text-sm text-red-700">Score: 42/100</p>
            <p className="text-xs text-red-600 mt-2">
              Status: Suspendovan sa linije hrane
            </p>
            <button className="mt-3 w-full bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors">
              Ponovi Test (20.07.2025)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
