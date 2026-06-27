import { useState, useEffect } from 'react';
import {
  Shield, Clock, CheckCircle, AlertTriangle, Send,
  ChevronDown, ChevronUp, RefreshCw, FileText, Loader2, Lock
} from 'lucide-react';
import {
  collection, addDoc, getDocs, query, where,
  orderBy, serverTimestamp, updateDoc, doc, Timestamp
} from 'firebase/firestore';
import { db } from '../fb/firebase';
import { useAuth } from '../contexts/AuthContext';
import WorkerHeader from '../components/WorkerHeader';
import { useWorkerEligibility } from '../hooks/useWorkerEligibility';

// ─── Types ────────────────────────────────────────────────────────────────────

type ReportStatus = 'pending' | 'investigating' | 'resolved' | 'dismissed';
type ReportType   = 'harassment' | 'guest_complaint' | 'safety_hazard' | 'theft' | 'other';

interface AnonReport {
  id: string;
  type: ReportType;
  description: string;
  status: ReportStatus;
  customerId: string;
  customerName: string;
  workerId: string;       // stored for self-lookup; never shown to admins
  createdAt: Timestamp;
  adminNote?: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const REPORT_TYPES: { value: ReportType; label: string }[] = [
  { value: 'harassment',      label: 'Uznemiravanje / mobing' },
  { value: 'guest_complaint', label: 'Pritužba gosta' },
  { value: 'safety_hazard',   label: 'Sigurnosni rizik' },
  { value: 'theft',           label: 'Krađa / prevara' },
  { value: 'other',           label: 'Ostalo' },
];

const STATUS_CFG: Record<ReportStatus, { label: string; color: string }> = {
  pending:      { label: 'Na čekanju',    color: 'bg-amber-100 text-amber-800' },
  investigating:{ label: 'U istrazi',     color: 'bg-blue-100 text-blue-800' },
  resolved:     { label: 'Riješeno',      color: 'bg-emerald-100 text-emerald-800' },
  dismissed:    { label: 'Odbačeno',      color: 'bg-slate-100 text-slate-600' },
};

const TYPE_LABEL: Record<ReportType, string> = {
  harassment:      'Uznemiravanje',
  guest_complaint: 'Pritužba gosta',
  safety_hazard:   'Sigurnosni rizik',
  theft:           'Krađa / prevara',
  other:           'Ostalo',
};

// ─── Shared helpers ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ReportStatus }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.pending;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function fmtDate(ts: Timestamp | undefined) {
  if (!ts?.toDate) return '—';
  return ts.toDate().toLocaleString('bs-BA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── Worker view ──────────────────────────────────────────────────────────────

function WorkerView() {
  const { user, currentUser } = useAuth();
  const eligibility = useWorkerEligibility(currentUser?.email);

  const [type, setType]           = useState<ReportType>('harassment');
  const [description, setDesc]    = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]     = useState(false);
  const [error, setError]         = useState('');

  const [myReports, setMyReports] = useState<AnonReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadMyReports = async () => {
    if (!user?.uid) return;
    setLoadingReports(true);
    try {
      const snap = await getDocs(
        query(
          collection(db, 'anonymous_reports'),
          where('workerId', '==', user.uid),
          orderBy('createdAt', 'desc')
        )
      );
      setMyReports(snap.docs.map(d => ({ id: d.id, ...d.data() } as AnonReport)));
    } catch (e) {
      console.error('loadMyReports:', e);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => { loadMyReports(); }, [user?.uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) { setError('Opis je obavezan.'); return; }
    if (!user?.uid || !currentUser) { setError('Nisi prijavljen.'); return; }

    setSubmitting(true);
    setError('');
    try {
      await addDoc(collection(db, 'anonymous_reports'), {
        type,
        description: description.trim(),
        status: 'pending' as ReportStatus,
        customerId: currentUser.customerId ?? '',
        customerName: currentUser.customerName ?? '',
        workerId: user.uid,
        createdAt: serverTimestamp(),
        adminNote: '',
      });
      setSuccess(true);
      setDesc('');
      setType('harassment');
      await loadMyReports();
      setTimeout(() => setSuccess(false), 4000);
    } catch (e: any) {
      setError(e?.message ?? 'Greška pri slanju.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <WorkerHeader />

      {/* Submit form — gated by eligibility */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${eligibility.eligible ? 'bg-slate-100' : 'bg-slate-100'}`}>
            {eligibility.eligible
              ? <Shield className="w-5 h-5 text-slate-600" />
              : <Lock className="w-5 h-5 text-slate-400" />
            }
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Anonimna prijava</h2>
            <p className="text-xs text-slate-500">Tvoj identitet neće biti otkriven menadžmentu</p>
          </div>
        </div>

        {eligibility.loading ? (
          <div className="flex items-center justify-center py-8 text-slate-400 text-sm gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Provjera uslova...
          </div>
        ) : !eligibility.eligible ? (
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <p className="text-sm font-semibold text-slate-700 mb-3">Zaključano — uslovi nisu ispunjeni:</p>
              <div className="space-y-2">
                <EligibilityRow
                  label="Minimalno smjena"
                  current={eligibility.shiftsCount}
                  required={15}
                  unit="smjena"
                  met={eligibility.shiftsNeeded === 0}
                />
                <EligibilityRow
                  label="Prosječan score"
                  current={eligibility.overallScore}
                  required={70}
                  unit="%"
                  met={eligibility.scoreNeeded === 0}
                />
              </div>
            </div>
            <button disabled className="w-full bg-slate-200 text-slate-400 rounded-xl py-3 font-semibold cursor-not-allowed">
              Pošalji anonimno
            </button>
            <p className="text-xs text-slate-400 text-center">Dostupno nakon 15 smjena i prosječnog scorea ≥ 70%</p>
          </div>
        ) : (
          <>
            {success && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4 text-emerald-700 text-sm font-medium">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                Prijava je uspješno poslana!
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Vrsta prijave</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as ReportType)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 bg-slate-50"
                >
                  {REPORT_TYPES.map(rt => (
                    <option key={rt.value} value={rt.value}>{rt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Opis</label>
                <textarea
                  value={description}
                  onChange={e => setDesc(e.target.value)}
                  rows={5}
                  placeholder="Opiši incident što detaljnije..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-300 bg-slate-50"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {submitting ? 'Slanje...' : 'Pošalji anonimno'}
              </button>
            </form>
          </>
        )}
      </div>

      {/* My reports */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-900">Moje prijave</h2>
          <button onClick={loadMyReports} className="p-2 hover:bg-slate-100 rounded-lg transition">
            <RefreshCw className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {loadingReports ? (
          <div className="text-center py-8 text-slate-400 text-sm">Učitavanje...</div>
        ) : myReports.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">Nemaš još nijedne prijave.</div>
        ) : (
          <div className="space-y-3">
            {myReports.map(r => (
              <div key={r.id} className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{TYPE_LABEL[r.type]}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{fmtDate(r.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={r.status} />
                    {expandedId === r.id
                      ? <ChevronUp className="w-4 h-4 text-slate-400" />
                      : <ChevronDown className="w-4 h-4 text-slate-400" />
                    }
                  </div>
                </button>
                {expandedId === r.id && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-100 space-y-2">
                    <p className="text-sm text-slate-700">{r.description}</p>
                    {r.adminNote && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs font-semibold text-blue-800 mb-0.5">Odgovor menadžmenta:</p>
                        <p className="text-sm text-blue-900">{r.adminNote}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Admin / Manager view ─────────────────────────────────────────────────────

function AdminView() {
  const { currentUser } = useAuth();
  const [reports, setReports]     = useState<AnonReport[]>([]);
  const [loading, setLoading]     = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState<Record<string, string>>({});

  const loadReports = async () => {
    setLoading(true);
    try {
      const q = currentUser?.customerId
        ? query(
            collection(db, 'anonymous_reports'),
            where('customerId', '==', currentUser.customerId)
          )
        : query(collection(db, 'anonymous_reports'));

      const snap = await getDocs(q);
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as AnonReport));
      docs.sort((a, b) => {
        const at = a.createdAt?.seconds ?? 0;
        const bt = b.createdAt?.seconds ?? 0;
        return bt - at;
      });
      setReports(docs);
    } catch (e) {
      console.error('AdminView loadReports:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReports(); }, [currentUser?.customerId]);

  const updateStatus = async (reportId: string, status: ReportStatus) => {
    setUpdatingId(reportId);
    try {
      await updateDoc(doc(db, 'anonymous_reports', reportId), { status });
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));
    } finally {
      setUpdatingId(null);
    }
  };

  const saveNote = async (reportId: string) => {
    const note = noteInput[reportId] ?? '';
    setUpdatingId(reportId);
    try {
      await updateDoc(doc(db, 'anonymous_reports', reportId), { adminNote: note });
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, adminNote: note } : r));
    } finally {
      setUpdatingId(null);
    }
  };

  const statusCounts = (Object.keys(STATUS_CFG) as ReportStatus[]).map(s => ({
    status: s,
    count: reports.filter(r => r.status === s).length,
    ...STATUS_CFG[s],
  }));

  return (
    <div className="space-y-6">
      <WorkerHeader />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statusCounts.map(s => (
          <div key={s.status} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <p className="text-sm text-slate-500 font-medium">{s.label}</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{s.count}</p>
            <div className={`mt-2 inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${s.color}`}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Reports list */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Sve prijave</h2>
          <button onClick={loadReports} className="p-2 hover:bg-slate-100 rounded-lg transition">
            <RefreshCw className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">Učitavanje prijava...</div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">Nema prijava.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reports.map(r => (
              <div key={r.id}>
                {/* Row header */}
                <button
                  onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                  className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-slate-50 transition"
                >
                  <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 truncate">{TYPE_LABEL[r.type]}</p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{r.description.slice(0, 60)}...</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      {fmtDate(r.createdAt)}
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                  {expandedId === r.id
                    ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  }
                </button>

                {/* Expanded detail */}
                {expandedId === r.id && (
                  <div className="px-6 pb-6 pt-2 bg-slate-50 border-t border-slate-100 space-y-4">
                    <p className="text-sm text-slate-700 leading-relaxed">{r.description}</p>

                    {/* Status change */}
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Promijeni status</p>
                      <div className="flex flex-wrap gap-2">
                        {(Object.keys(STATUS_CFG) as ReportStatus[]).map(s => (
                          <button
                            key={s}
                            disabled={r.status === s || updatingId === r.id}
                            onClick={() => updateStatus(r.id, s)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                              r.status === s
                                ? `${STATUS_CFG[s].color} border-transparent cursor-default`
                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
                            } disabled:opacity-50`}
                          >
                            {updatingId === r.id && r.status !== s
                              ? <Loader2 className="w-3 h-3 animate-spin inline" />
                              : STATUS_CFG[s].label
                            }
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Admin note */}
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Odgovor / napomena</p>
                      <textarea
                        rows={2}
                        placeholder="Upiši odgovor koji će biti vidljiv podnosiocu..."
                        value={noteInput[r.id] ?? r.adminNote ?? ''}
                        onChange={e => setNoteInput(prev => ({ ...prev, [r.id]: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white"
                      />
                      <button
                        onClick={() => saveNote(r.id)}
                        disabled={updatingId === r.id}
                        className="mt-2 flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50"
                      >
                        {updatingId === r.id
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <CheckCircle className="w-3 h-3" />
                        }
                        Sačuvaj napomenu
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Eligibility row ──────────────────────────────────────────────────────────

function EligibilityRow({ label, current, required, unit, met }: {
  label: string; current: number; required: number; unit: string; met: boolean;
}) {
  const pct = Math.min(100, Math.round((current / required) * 100));
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-slate-600">{label}</span>
        <span className={`font-semibold ${met ? 'text-emerald-600' : 'text-slate-500'}`}>
          {current}/{required} {unit} {met ? '✓' : ''}
        </span>
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${met ? 'bg-emerald-500' : 'bg-slate-400'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function AnonymousReports() {
  const { currentUser } = useAuth();
  const isWorker = currentUser?.role?.toLowerCase() === 'worker';
  return isWorker ? <WorkerView /> : <AdminView />;
}
