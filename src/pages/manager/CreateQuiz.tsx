import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { collection, addDoc, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../fb/firebase";
import { useAuth } from "../../contexts/AuthContext";
import { Plus, Trash2, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Clock, Loader2 } from "lucide-react";
import Header from "../../components/Header";

const ROLES = [
  { value: "waiter",       label: "Konobar",   icon: "🍽️" },
  { value: "cook",         label: "Kuvar",     icon: "👨‍🍳" },
  { value: "housekeeping", label: "Sobarica",  icon: "🏠" },
  { value: "manager",      label: "Menadžer",  icon: "💼" },
  { value: "barman",       label: "Šanker",    icon: "🍸" },
];

interface Answer { text: string; correct: boolean; }
interface Question { text: string; answers: Answer[]; expanded: boolean; }

function emptyQuestion(): Question {
  return {
    text: "",
    expanded: true,
    answers: [{ text: "", correct: true }],
  };
}

export default function CreateQuiz() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");
  const { currentUser } = useAuth();

  const [title, setTitle] = useState("");
  const [role, setRole] = useState("");
  const [timePerQuestion, setTimePerQuestion] = useState(60);
  const [questions, setQuestions] = useState<Question[]>([emptyQuestion()]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(!!editId);
  const [error, setError] = useState("");

  // ── Load existing quiz when editing ──────────────────────
  useEffect(() => {
    if (!editId) return;
    getDoc(doc(db, "quizzes", editId)).then((snap) => {
      if (!snap.exists()) { setError("Kviz nije pronađen."); setLoadingQuiz(false); return; }
      const data = snap.data();
      setTitle(data.title ?? "");
      setRole(data.role ?? "");
      setTimePerQuestion(data.timePerQuestion ?? 60);
      // Convert stored format back to editable format
      const loadedQuestions: Question[] = (data.questions ?? []).map((q: any) => ({
        text: q.question ?? "",
        expanded: false,
        answers: (q.options ?? []).map((opt: string, i: number) => ({
          text: opt,
          correct: i === q.correct,
        })),
      }));
      setQuestions(loadedQuestions.length ? loadedQuestions : [emptyQuestion()]);
      setLoadingQuiz(false);
    }).catch(() => { setError("Greška pri učitavanju kviza."); setLoadingQuiz(false); });
  }, [editId]);

  // ── Question helpers ──────────────────────────────────────
  const addQuestion = () => setQuestions(p => [...p, emptyQuestion()]);
  const removeQuestion = (qi: number) => setQuestions(p => p.filter((_, i) => i !== qi));
  const toggleExpanded = (qi: number) => setQuestions(p => p.map((q, i) => i === qi ? { ...q, expanded: !q.expanded } : q));
  const setQuestionText = (qi: number, text: string) => setQuestions(p => p.map((q, i) => i === qi ? { ...q, text } : q));
  const setAnswerText = (qi: number, ai: number, text: string) =>
    setQuestions(p => p.map((q, i) => i !== qi ? q : { ...q, answers: q.answers.map((a, j) => j === ai ? { ...a, text } : a) }));
  const setCorrect = (qi: number, ai: number) =>
    setQuestions(p => p.map((q, i) => i !== qi ? q : { ...q, answers: q.answers.map((a, j) => ({ ...a, correct: j === ai })) }));

  const addAnswer = (qi: number) =>
    setQuestions(p => p.map((q, i) => i !== qi || q.answers.length >= 4 ? q : { ...q, answers: [...q.answers, { text: "", correct: false }] }));

  const removeAnswer = (qi: number, ai: number) =>
    setQuestions(p => p.map((q, i) => {
      if (i !== qi || q.answers.length <= 1) return q;
      const next = q.answers.filter((_, j) => j !== ai);
      // if we removed the correct one, mark first as correct
      const hasCorrect = next.some(a => a.correct);
      return { ...q, answers: hasCorrect ? next : next.map((a, j) => ({ ...a, correct: j === 0 })) };
    }));

  // ── Validation ────────────────────────────────────────────
  const validate = (): string | null => {
    if (!title.trim()) return "Unesite naziv kviza.";
    if (!role) return "Odaberite tip radnika.";
    if (questions.length === 0) return "Dodajte barem jedno pitanje.";
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) return `Pitanje ${i + 1}: unesite tekst pitanja.`;
      if (q.answers.length < 2) return `Pitanje ${i + 1}: dodajte barem 2 odgovora.`;
      if (q.answers.some(a => !a.text.trim())) return `Pitanje ${i + 1}: popunite sve odgovore.`;
      if (!q.answers.some(a => a.correct)) return `Pitanje ${i + 1}: označite tačan odgovor.`;
    }
    return null;
  };

  // ── Save ──────────────────────────────────────────────────
  const handleSave = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        role,
        timePerQuestion,
        totalTime: timePerQuestion * questions.length,
        questions: questions.map(q => ({
          question: q.text.trim(),
          options: q.answers.map(a => a.text.trim()),
          correct: q.answers.findIndex(a => a.correct),
        })),
        createdBy: currentUser?.email ?? null,
        customerId: currentUser?.customerId ?? null,
        customerName: currentUser?.customerName ?? null,
        updatedAt: serverTimestamp(),
      };

      if (editId) {
        // Update existing — preserve createdAt
        await setDoc(doc(db, "quizzes", editId), payload, { merge: true });
      } else {
        await addDoc(collection(db, "quizzes"), { ...payload, createdAt: serverTimestamp() });
      }

      setSaved(true);
      setTimeout(() => navigate("/app/training"), 1200);
    } catch (e: any) {
      setError(e?.message ?? "Greška pri snimanju.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingQuiz) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Header
        title={editId ? "Uredi Kviz" : "Kreiraj Kviz"}
        subtitle={editId ? "Izmijeni pitanja i odgovore" : "Ručno kreiranje pitanja i odgovora"}
      />

      {/* Meta */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Naziv kviza *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="npr. HACCP osnove, Posluživanje vina..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tip radnika *</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="">Odaberi poziciju...</option>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.icon} {r.label}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Clock className="w-4 h-4 text-slate-500" />
          <label className="text-sm font-medium text-slate-700">Vrijeme po pitanju:</label>
          <div className="flex items-center gap-2">
            {[30, 60, 90, 120].map(s => (
              <button
                key={s}
                onClick={() => setTimePerQuestion(s)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${timePerQuestion === s ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                {s}s
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-500 ml-1">
            Ukupno: ~{Math.round((timePerQuestion * questions.length) / 60)} min za {questions.length} pitanje{questions.length !== 1 ? "a" : ""}
          </span>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-3">
        {questions.map((q, qi) => (
          <div key={qi} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50" onClick={() => toggleExpanded(qi)}>
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                {qi + 1}
              </span>
              <span className="flex-1 text-sm font-medium text-slate-700 truncate">
                {q.text || "Novo pitanje..."}
              </span>
              <div className="flex items-center gap-2">
                {questions.length > 1 && (
                  <button
                    onClick={e => { e.stopPropagation(); removeQuestion(qi); }}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                {q.expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </div>

            {q.expanded && (
              <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
                <textarea
                  value={q.text}
                  onChange={e => setQuestionText(qi, e.target.value)}
                  placeholder="Unesite tekst pitanja..."
                  rows={2}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Odgovori — kliknite krug za tačan odgovor</p>
                    <span className="text-xs text-slate-400">{q.answers.length}/4</span>
                  </div>
                  {q.answers.map((a, ai) => (
                    <div key={ai} className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${a.correct ? "border-emerald-300 bg-emerald-50" : "border-slate-200"}`}>
                      <button
                        onClick={() => setCorrect(qi, ai)}
                        className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${a.correct ? "border-emerald-500 bg-emerald-500" : "border-slate-300 hover:border-emerald-400"}`}
                      >
                        {a.correct && <span className="block w-2 h-2 rounded-full bg-white" />}
                      </button>
                      <input
                        value={a.text}
                        onChange={e => setAnswerText(qi, ai, e.target.value)}
                        placeholder={`Odgovor ${ai + 1}...`}
                        className="flex-1 text-sm border-0 bg-transparent focus:outline-none"
                      />
                      {a.correct && <span className="text-xs font-semibold text-emerald-600 flex-shrink-0">✓ Tačno</span>}
                      {q.answers.length > 1 && (
                        <button
                          onClick={() => removeAnswer(qi, ai)}
                          className="p-1 text-slate-300 hover:text-red-400 transition-colors flex-shrink-0"
                          title="Ukloni odgovor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  {q.answers.length < 4 && (
                    <button
                      onClick={() => addAnswer(qi)}
                      className="w-full flex items-center justify-center gap-1.5 border border-dashed border-slate-300 rounded-lg py-2 text-xs text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Dodaj odgovor {q.answers.length < 4 ? `(${q.answers.length}/4)` : ""}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add question */}
      <button
        onClick={addQuestion}
        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-xl py-4 text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
      >
        <Plus className="w-5 h-5" />
        Dodaj pitanje
      </button>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-emerald-700 text-sm">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          Kviz {editId ? "ažuriran" : "snimljen"}! Preusmjeravanje...
        </div>
      )}

      <div className="flex justify-between items-center pb-6">
        <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-sm">
          Otkaži
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">{questions.length} pitanje{questions.length !== 1 ? "a" : ""}</span>
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 text-sm flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "Snimanje..." : editId ? "Sačuvaj izmjene" : "Snimi kviz"}
          </button>
        </div>
      </div>
    </div>
  );
}
