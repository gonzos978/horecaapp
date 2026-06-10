import { useState } from 'react';
import { CheckCircle, Home, Award, Star } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useChecklists } from '../../hooks/useChecklists';
import ChecklistPanel from '../../components/ChecklistPanel';
import ShiftScoreCard from '../../components/ShiftScoreCard';
import { useChecklistNotifications } from '../../hooks/useChecklistNotifications';

export default function HousekeeperApp() {
  const { currentUser, user } = useAuth();
  const cl = useChecklists('housekeeping');
  useChecklistNotifications({
    activeShift: cl.activeShift,
    checklists: cl.checklists,
    submitted: cl.submitted,
    workerId: user?.uid,
    workerName: currentUser?.name,
  });

  const [rooms] = useState([
    { number: '201', status: 'pending', time: '25 min' },
    { number: '203', status: 'pending', time: '28 min' },
    { number: '205', status: 'completed', time: '15 min' },
    { number: '207', status: 'pending', time: '30 min' },
  ]);

  const roomsCompleted = rooms.filter((r) => r.status === 'completed').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="bg-white shadow-md sticky top-0 z-50">
        <div className="p-4 flex items-center gap-4">
          <img src="/smarter_horeca_1.jpg" alt="Smarter HoReCA Logo" className="h-16 w-auto" />
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900">Smarter HoReCA</h1>
            <p className="text-sm text-purple-600 font-semibold">Sobarica</p>
            <p className="text-xs text-slate-600">{currentUser?.name}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Rooms */}
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
                className={`border-2 rounded-lg p-3 ${room.status === 'completed' ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-2xl font-bold text-slate-900">{room.number}</span>
                  {room.status === 'completed' && <CheckCircle className="w-5 h-5 text-emerald-600" />}
                </div>
                <p className="text-sm text-slate-600">{room.time}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Shift score */}
        <ShiftScoreCard score={cl.score} checklistsCompleted={cl.checklistsCompleted} checklistsTotal={cl.checklistsTotal} />

        {/* Checklists from Firestore */}
        <ChecklistPanel {...cl} accentColor="purple" emptyMessage="Nema aktivnih lista za sobaricu." />

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
        </div>
      </div>
    </div>
  );
}
