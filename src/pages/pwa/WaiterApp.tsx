import { useState, useEffect } from 'react';
import { CheckCircle, Circle, Clock, TrendingUp, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from '../../fb/firebase';
import { useWorkerShift } from '../../hooks/useWorkerShift';
import { useAuth } from '../../contexts/AuthContext';

// ── types ────────────────────────────────────────────────
interface CheckItem {
  id: string;
  text: string;
  order: number;
  completed: boolean;
}

interface Zone {
  id: string;
  title: string;
  items: CheckItem[];
}

interface Checklist {
  id: string;
  title: string;
  timePeriod: string;
  zones: Zone[];
}

// Sort checklists by time-of-day logic
const TIME_ORDER: Record<string, number> = {
  'start shift': 0,
  'during shift': 1,
  'end shift': 2,
};
function timePeriodOrder(tp: string) {
  return TIME_ORDER[tp?.toLowerCase()] ?? 99;
}

// ── component ────────────────────────────────────────────
export default function WaiterApp() {
  const { currentUser } = useAuth();
  const { activeShift, logAction, submitChecklist } = useWorkerShift();
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<Set<string>>(new Set());
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [openChecklist, setOpenChecklist] = useState<string | null>(null);
  const [tips] = useState(45.50);

  const shiftStart = activeShift?.startTime?.toDate
    ? activeShift.startTime.toDate().toLocaleTimeString('bs-BA', { hour: '2-digit', minute: '2-digit' })
    : '—';

  // ── fetch checklists for waiter role ─────────────────
  useEffect(() => {
    const fetchChecklists = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'checklists'),
          where('role', '==', 'waiter')
        );
        const snap = await getDocs(q);

        const lists: Checklist[] = await Promise.all(
          snap.docs.map(async (checkDoc) => {
            const data = checkDoc.data();

            // fetch zones
            const zonesSnap = await getDocs(
              collection(db, 'checklists', checkDoc.id, 'zones')
            );

            const zones: Zone[] = await Promise.all(
              zonesSnap.docs.map(async (zoneDoc) => {
                // fetch items sorted by order
                const itemsSnap = await getDocs(
                  query(
                    collection(db, 'checklists', checkDoc.id, 'zones', zoneDoc.id, 'items'),
                    orderBy('order', 'asc')
                  )
                );
                const items: CheckItem[] = itemsSnap.docs.map((iDoc) => ({
                  id: iDoc.id,
                  text: iDoc.data().text,
                  order: iDoc.data().order,
                  completed: false,
                }));
                return { id: zoneDoc.id, title: zoneDoc.data().title, items };
              })
            );

            return {
              id: checkDoc.id,
              title: data.title,
              timePeriod: data.timePeriod ?? '',
              zones,
            };
          })
        );

        // Sort by timePeriod then title
        lists.sort((a, b) =>
          timePeriodOrder(a.timePeriod) - timePeriodOrder(b.timePeriod) ||
          a.title.localeCompare(b.title)
        );

        setChecklists(lists);
        if (lists.length > 0) setOpenChecklist(lists[0].id);
      } catch (err) {
        console.error('WaiterApp fetchChecklists:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChecklists();
  }, []);

  // ── toggle an item ───────────────────────────────────
  const toggleItem = (checklistId: string, zoneId: string, itemId: string) => {
    setChecklists(prev =>
      prev.map(cl => {
        if (cl.id !== checklistId) return cl;
        return {
          ...cl,
          zones: cl.zones.map(z => {
            if (z.id !== zoneId) return z;
            return {
              ...z,
              items: z.items.map(item => {
                if (item.id !== itemId) return item;
                const updated = { ...item, completed: !item.completed };
                logAction('checklist_item', {
                  checklistId,
                  checklistTitle: cl.title,
                  zoneId,
                  zoneTitle: z.title,
                  itemId: item.id,
                  text: item.text,
                  completed: updated.completed,
                });
                return updated;
              }),
            };
          }),
        };
      })
    );
  };

  // ── submit checklist ─────────────────────────────────
  const handleSubmit = async (cl: Checklist) => {
    if (!activeShift) return;
    setSubmitting(cl.id);
    setSubmitError(null);
    try {
      const allItems = cl.zones.flatMap(z =>
        z.items.map(item => ({ itemId: item.id, text: item.text, completed: item.completed }))
      );
      await submitChecklist({
        checklistId: cl.id,
        checklistTitle: cl.title,
        timePeriod: cl.timePeriod,
        items: allItems,
      });
      setSubmitted(prev => new Set(prev).add(cl.id));
    } catch (err: any) {
      console.error('handleSubmit checklist:', err);
      setSubmitError(err?.message ?? 'Greška pri snimanju. Pokušaj ponovo.');
    } finally {
      setSubmitting(null);
    }
  };

  // ── progress helpers ─────────────────────────────────
  const totalItems = (cl: Checklist) => cl.zones.flatMap(z => z.items).length;
  const doneItems  = (cl: Checklist) => cl.zones.flatMap(z => z.items).filter(i => i.completed).length;

  // ── render ───────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Header */}
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

        {/* Checklists */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-md p-6 text-center text-slate-500">
            Učitavanje lista...
          </div>
        ) : checklists.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-6 text-center text-slate-500">
            Nema aktivnih lista za konobara.
          </div>
        ) : (
          checklists.map(cl => {
            const done  = doneItems(cl);
            const total = totalItems(cl);
            const pct   = total > 0 ? (done / total) * 100 : 0;
            const isOpen = openChecklist === cl.id;

            return (
              <div key={cl.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                {/* Checklist header — tap to expand/collapse */}
                <button
                  onClick={() => setOpenChecklist(isOpen ? null : cl.id)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">{cl.title}</p>
                    {cl.timePeriod && (
                      <p className="text-xs text-slate-400 mt-0.5">{cl.timePeriod}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 ml-3">
                    <span className={`text-sm font-semibold ${done === total && total > 0 ? 'text-emerald-600' : 'text-blue-600'}`}>
                      {done}/{total}
                    </span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>

                {/* Progress bar */}
                <div className="px-5 pb-1">
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Zones + items */}
                {isOpen && (
                  <div className="p-5 pt-4 space-y-5">
                    {cl.zones.map(zone => (
                      <div key={zone.id}>
                        {zone.title && (
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                            {zone.title}
                          </p>
                        )}
                        <div className="space-y-2">
                          {zone.items.map(item => (
                            <button
                              key={item.id}
                              onClick={() => toggleItem(cl.id, zone.id, item.id)}
                              className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                                item.completed
                                  ? 'bg-emerald-50 border-emerald-300'
                                  : 'bg-slate-50 border-slate-200 hover:border-blue-300'
                              }`}
                            >
                              {item.completed
                                ? <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                : <Circle className="w-5 h-5 text-slate-400 flex-shrink-0" />
                              }
                              <span className={`text-sm font-medium text-left ${
                                item.completed ? 'text-emerald-900 line-through' : 'text-slate-900'
                              }`}>
                                {item.text}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}

                    {submitted.has(cl.id) ? (
                      <div className="bg-emerald-100 border border-emerald-300 rounded-lg p-3 text-center">
                        <p className="text-emerald-900 font-bold text-sm">✓ Lista potvrđena i sačuvana!</p>
                      </div>
                    ) : !activeShift ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                        <p className="text-amber-700 text-sm font-medium">Pokreni smjenu da bi potvrdio listu</p>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleSubmit(cl)}
                          disabled={!!submitting}
                          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all"
                        >
                          <Send className="w-4 h-4" />
                          {submitting === cl.id ? 'Snimanje...' : 'Potvrdi listu'}
                        </button>
                        {submitError && (
                          <p className="text-red-600 text-xs text-center mt-2">{submitError}</p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}

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
