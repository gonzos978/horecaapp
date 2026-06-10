import { CheckCircle, Circle, ChevronDown, ChevronUp, Send, AlertTriangle, Clock, BadgeCheck, X } from 'lucide-react';
import type { Checklist } from '../hooks/useChecklists';

interface Props {
  checklists: Checklist[];
  loading: boolean;
  openChecklist: string | null;
  setOpenChecklist: (id: string | null) => void;
  toggleItem: (checklistId: string, zoneId: string, itemId: string) => void;
  handleSubmit: (cl: Checklist) => void;
  submitting: string | null;
  submitted: Set<string>;
  submitError: string | null;
  checkBlocked: boolean;
  countdownDisplay: string | null;
  totalItems: (cl: Checklist) => number;
  doneItems: (cl: Checklist) => number;
  activeShift: unknown;
  accentColor?: 'blue' | 'orange' | 'purple' | 'emerald';
  emptyMessage?: string;
  showWarning?: boolean;
  dismissWarning?: () => void;
}

const ACCENT = {
  blue:    { progress: 'from-blue-500 to-emerald-500',     submit: 'bg-blue-600 hover:bg-blue-700',     counter: 'text-blue-600' },
  orange:  { progress: 'from-orange-500 to-red-500',       submit: 'bg-orange-600 hover:bg-orange-700',  counter: 'text-orange-600' },
  purple:  { progress: 'from-purple-500 to-blue-500',      submit: 'bg-purple-600 hover:bg-purple-700',  counter: 'text-purple-600' },
  emerald: { progress: 'from-emerald-500 to-teal-500',     submit: 'bg-emerald-600 hover:bg-emerald-700', counter: 'text-emerald-600' },
};

export default function ChecklistPanel({
  checklists,
  loading,
  openChecklist,
  setOpenChecklist,
  toggleItem,
  handleSubmit,
  submitting,
  submitted,
  submitError,
  checkBlocked,
  countdownDisplay,
  totalItems,
  doneItems,
  activeShift,
  accentColor = 'blue',
  emptyMessage = 'Nema aktivnih lista.',
  showWarning = false,
  dismissWarning,
}: Props) {
  const accent = ACCENT[accentColor];

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 text-center text-slate-500">
        Učitavanje lista...
      </div>
    );
  }

  if (checklists.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 text-center text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      {/* Countdown banner — visible across all checklists when blocked */}
      {checkBlocked && countdownDisplay && (
        <div className="flex items-center gap-3 bg-amber-50 border-2 border-amber-300 rounded-xl p-4 shadow-sm">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-900">Sačekaj prije sljedeće provjere</p>
            <p className="text-xs text-amber-700">Minimalni razmak između provjera je 3 minute</p>
          </div>
          <span className="text-2xl font-bold text-amber-700 tabular-nums">{countdownDisplay}</span>
        </div>
      )}

      {/* Warning popup — too soon since last check */}
      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 mb-1">Sačekaj malo!</h3>
              <p className="text-slate-600 text-sm">
                Između dvije provjere mora proći najmanje <span className="font-bold text-amber-600">3 minute</span>.
              </p>
              {countdownDisplay && (
                <p className="mt-3 text-3xl font-black tabular-nums text-amber-600">{countdownDisplay}</p>
              )}
              <p className="text-xs text-slate-400 mt-1">preostalo</p>
            </div>
            <button
              onClick={dismissWarning}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-700 text-white font-semibold py-3 rounded-xl transition"
            >
              <X className="w-4 h-4" />
              Zatvori
            </button>
          </div>
        </div>
      )}

      {checklists.map((cl) => {
        const done       = doneItems(cl);
        const total      = totalItems(cl);
        const pct        = total > 0 ? (done / total) * 100 : 0;
        const isOpen     = openChecklist === cl.id;
        const isSubmitted = submitted.has(cl.id);

        return (
          <div
            key={cl.id}
            className={`rounded-xl shadow-md overflow-hidden border-2 transition-colors ${
              isSubmitted ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-transparent'
            }`}
          >
            {/* Header */}
            <button
              onClick={() => setOpenChecklist(isOpen ? null : cl.id)}
              className="w-full flex items-center justify-between p-5 text-left"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {isSubmitted && <BadgeCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />}
                  <p className={`font-bold truncate ${isSubmitted ? 'text-emerald-900' : 'text-slate-900'}`}>
                    {cl.title}
                  </p>
                </div>
                {cl.timePeriod && (
                  <p className={`text-xs mt-0.5 ${isSubmitted ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {cl.timePeriod}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 ml-3">
                {isSubmitted ? (
                  <span className="text-xs font-semibold bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full">
                    Završeno
                  </span>
                ) : (
                  <span className={`text-sm font-semibold ${done === total && total > 0 ? 'text-emerald-600' : accent.counter}`}>
                    {done}/{total}
                  </span>
                )}
                {isOpen
                  ? <ChevronUp className={`w-4 h-4 ${isSubmitted ? 'text-emerald-500' : 'text-slate-400'}`} />
                  : <ChevronDown className={`w-4 h-4 ${isSubmitted ? 'text-emerald-500' : 'text-slate-400'}`} />
                }
              </div>
            </button>

            {/* Progress bar */}
            <div className="px-5 pb-1">
              <div className={`h-1.5 rounded-full overflow-hidden ${isSubmitted ? 'bg-emerald-200' : 'bg-slate-100'}`}>
                <div
                  className={`h-full bg-gradient-to-r ${isSubmitted ? 'from-emerald-400 to-emerald-500' : accent.progress} transition-all duration-300`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {/* Zones + items */}
            {isOpen && (
              <div className="p-5 pt-4 space-y-5">
                {cl.zones.map((zone) => (
                  <div key={zone.id}>
                    {zone.title && (
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        {zone.title}
                      </p>
                    )}
                    <div className="space-y-2">
                      {zone.items.map((item) => {
                        // Already completed items can always be unchecked; uncompleted items are locked during countdown
                        const isLocked = !item.completed && checkBlocked;

                        return (
                          <button
                            key={item.id}
                            onClick={() => !isLocked && toggleItem(cl.id, zone.id, item.id)}
                            disabled={isLocked}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                              item.completed
                                ? 'bg-emerald-50 border-emerald-300'
                                : isLocked
                                  ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
                                  : 'bg-slate-50 border-slate-200 hover:border-blue-300 cursor-pointer'
                            }`}
                          >
                            {item.completed
                              ? <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                              : isLocked
                                ? <Clock className="w-5 h-5 text-slate-300 flex-shrink-0" />
                                : <Circle className="w-5 h-5 text-slate-400 flex-shrink-0" />
                            }
                            <span className={`text-sm font-medium text-left ${
                              item.completed ? 'text-emerald-900 line-through' : isLocked ? 'text-slate-400' : 'text-slate-900'
                            }`}>
                              {item.text}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {submitted.has(cl.id) ? (
                  <div className="bg-emerald-100 border border-emerald-300 rounded-lg p-3 text-center">
                    <p className="text-emerald-900 font-bold text-sm">✓ Lista potvrđena i sačuvana!</p>
                  </div>
                ) : !activeShift ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center flex items-center justify-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <p className="text-amber-700 text-sm font-medium">Pokreni smjenu da bi potvrdio listu</p>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleSubmit(cl)}
                      disabled={!!submitting}
                      className={`w-full flex items-center justify-center gap-2 ${accent.submit} disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all`}
                    >
                      <Send className="w-4 h-4" />
                      {submitting === cl.id ? 'Snimanje...' : 'Potvrdi listu'}
                    </button>
                    {submitError && (
                      <p className="text-red-600 text-xs text-center">{submitError}</p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
