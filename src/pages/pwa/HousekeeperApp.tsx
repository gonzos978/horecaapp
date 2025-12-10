import { useState } from 'react';
import { CheckCircle, Circle, Home, Camera, Star, Award } from 'lucide-react';

export default function HousekeeperApp() {
  const [checklistItems, setChecklistItems] = useState([
    { id: 1, task: 'Promijeni posteljinu', completed: false },
    { id: 2, task: 'Očisti kupaonicu', completed: false, photoRequired: true },
    { id: 3, task: 'Usisaj tepih', completed: false },
    { id: 4, task: 'Provjeri mini-bar', completed: false },
    { id: 5, task: 'Ostavi welcome note', completed: false }
  ]);

  const [rooms, setRooms] = useState([
    { number: '201', status: 'pending', time: '25 min' },
    { number: '203', status: 'pending', time: '28 min' },
    { number: '205', status: 'completed', time: '15 min' },
    { number: '207', status: 'pending', time: '30 min' }
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
  const roomsCompleted = rooms.filter(r => r.status === 'completed').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header with Logo */}
      <div className="bg-white shadow-md sticky top-0 z-50">
        <div className="p-4 flex items-center gap-4">
          <img src="/smarter_horeca_1.jpg" alt="Smarter HoReCA Logo" className="h-16 w-auto" />
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900">Smarter HoReCA</h1>
            <p className="text-sm text-purple-600 font-semibold">Sobarica</p>
            <p className="text-xs text-slate-600">Ana Kovačević - W012</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Rooms for Today */}
        <div className="bg-white rounded-xl shadow-md p-5">
          <div className="flex items-center gap-2 mb-4">
            <Home className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-bold text-slate-900">Sobe za Danas</h2>
            <span className="ml-auto bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-bold">
              {roomsCompleted}/{rooms.length}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {rooms.map((room) => (
              <div
                key={room.number}
                className={`border-2 rounded-lg p-3 ${
                  room.status === 'completed'
                    ? 'bg-emerald-50 border-emerald-300'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-2xl font-bold text-slate-900">
                    {room.number}
                  </span>
                  {room.status === 'completed' && (
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  )}
                </div>
                <p className="text-sm text-slate-600">{room.time}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Current Room Checklist */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold">Trenutna Soba: 201</h2>
          </div>
          <p className="text-sm text-purple-100">Procenjeno vreme: 25 min</p>
        </div>

        {/* Check Lista po Sobi */}
        <div className="bg-white rounded-xl shadow-md p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Check Lista - Soba 201</h2>
            <span className="text-sm font-semibold text-purple-600">
              {completedCount}/{checklistItems.length}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-300"
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
                      : 'bg-slate-50 border-slate-200 hover:border-purple-300'
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
                </button>

                {item.photoRequired && !item.completed && (
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors">
                    <Camera className="w-4 h-4" />
                    Dodaj Fotografiju
                  </button>
                )}
              </div>
            ))}
          </div>

          {completedCount === checklistItems.length && (
            <div className="mt-4 space-y-3">
              <div className="bg-emerald-100 border border-emerald-300 rounded-lg p-3 text-center">
                <p className="text-emerald-900 font-bold">✓ Soba 201 završena!</p>
              </div>
              <button className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 transition-colors">
                Prijavi kao Gotovo
              </button>
            </div>
          )}
        </div>

        {/* Performance Score */}
        <div className="bg-white rounded-xl shadow-md p-5">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold text-slate-900">Moj Score</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-amber-50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <span className="text-xs text-amber-700 font-medium">Performance</span>
              </div>
              <p className="text-3xl font-bold text-amber-900">62</p>
              <p className="text-xs text-amber-600 mt-1">Score</p>
            </div>

            <div className="bg-emerald-50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Award className="w-5 h-5 text-emerald-600" />
                <span className="text-xs text-emerald-700 font-medium">Bonus</span>
              </div>
              <p className="text-3xl font-bold text-emerald-900">€125</p>
              <p className="text-xs text-emerald-600 mt-1">Ovaj mesec</p>
            </div>
          </div>

          <div className="mt-4 bg-amber-50 border border-amber-300 rounded-lg p-3">
            <p className="text-sm text-amber-900">
              💡 <span className="font-bold">Savjet:</span> Poboljšaj score završavajući više soba na vreme!
            </p>
          </div>
        </div>

        {/* Training Status */}
        <div className="bg-white rounded-xl shadow-md p-5">
          <h2 className="text-lg font-bold text-slate-900 mb-3">Status Obuke</h2>
          <div className="bg-red-50 border border-red-300 rounded-lg p-4">
            <p className="text-red-900 font-bold mb-1">Test: Higijena soba</p>
            <p className="text-sm text-red-700">Score: 58/100 - FAILED</p>
            <p className="text-xs text-red-600 mt-2">
              Retest zakazan: 18.07.2025
            </p>
            <button className="mt-3 w-full bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors">
              Pripremi se za Test
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
