import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, listAll } from "firebase/storage";
import { httpsCallable } from "firebase/functions";
import { db, storage, functions } from "../../fb/firebase.ts";
import { useAuth } from "../../contexts/AuthContext";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Sparkles, Loader2, FileQuestion, AlertCircle, CheckCircle2,
    Save, Plus, Trash2, ChevronDown, ChevronUp, Crown,
} from "lucide-react";

const ROLES = [
    { id: "waiter",       label: "Waiter",       icon: "🍽️" },
    { id: "receptionist", label: "Receptionist", icon: "📞" },
    { id: "chef",         label: "Chef",          icon: "👨‍🍳" },
    { id: "maid",         label: "Maid",          icon: "🏠" },
    { id: "barman",       label: "Barman",        icon: "🍸" },
    { id: "manager",      label: "Manager",       icon: "💼" },
];

const ROLE_CONTEXT: Record<string, string> = {
    waiter:       "serving guests, table service, menu knowledge, order taking, upselling",
    receptionist: "guest check-in/out, reservations, phone handling, complaints",
    chef:         "food preparation, kitchen hygiene, HACCP, recipes, plating standards",
    maid:         "room cleaning procedures, linen handling, hygiene, lost & found",
    barman:       "cocktail preparation, alcohol service, hygiene, stock management",
    manager:      "team management, KPIs, conflict resolution, reporting",
};

interface ManualAnswer { text: string; correct: boolean; }
interface ManualQuestion { text: string; answers: ManualAnswer[]; expanded: boolean; }

function emptyManualQ(): ManualQuestion {
    return { text: "", expanded: true, answers: [{ text: "", correct: true }] };
}

export default function CreateTest() {
    const navigate = useNavigate();
    const { user } = useAuth();

    // AI generation state
    const [role, setRole] = useState("");
    const [pdfPath, setPdfPath] = useState("");
    const [qCount, setQCount] = useState(5);
    const [aiQuestions, setAiQuestions] = useState<any[]>([]);
    const [generating, setGenerating] = useState(false);
    const [genStatus, setGenStatus] = useState("");

    // Manual questions state
    const [manualQuestions, setManualQuestions] = useState<ManualQuestion[]>([]);

    // Test meta
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [timePerQuestion, setTimePerQuestion] = useState(60);

    // UI state
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");
    const [documents, setDocuments] = useState<{ path: string; name: string }[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(false);

    const totalQuestions = aiQuestions.length + manualQuestions.length;

    // Load PDFs from Storage
    useEffect(() => {
        if (!user) return;
        setLoadingDocs(true);
        const rootRef = ref(storage, `documents/${user.uid}`);
        listAll(rootRef)
            .then(root => setDocuments(root.items.map(item => ({
                path: item.fullPath,
                name: item.name.replace(/^\d+_/, ""),
            }))))
            .catch(err => console.error("Failed to list documents:", err))
            .finally(() => setLoadingDocs(false));
    }, [user]);

    // ── AI Generation ──────────────────────────────────────
    const generateQuestions = async () => {
        if (!role) return setError("Select a role first.");
        if (!pdfPath) return setError("Select a training document.");
        setGenerating(true);
        setError("");
        setGenStatus("Generating questions with Gemini…");
        try {
            const generate = httpsCallable(functions, "generateQuestions");
            const result = await generate({ role, roleContext: ROLE_CONTEXT[role], pdfPath, count: qCount });
            const data = result.data as { questions: any[] };
            const generated = (data.questions ?? []).filter(
                q => q && typeof q.question === "string" && Array.isArray(q.options) &&
                     q.options.length === 4 && typeof q.correct === "number" && typeof q.explanation === "string"
            );
            if (generated.length === 0) { setError("No valid questions returned. Try again."); return; }
            setAiQuestions(generated);
            if (!title) {
                const name = pdfPath.split("/").pop()!.replace(/\.pdf$/i, "").replace(/[-_]/g, " ");
                setTitle(`${role.charAt(0).toUpperCase() + role.slice(1)} — ${name} Ultimate Test`);
            }
            setGenStatus(`${generated.length} AI questions ready ✔`);
        } catch (err: any) {
            setError(err?.message || "Failed to generate. Try again.");
        } finally {
            setGenerating(false);
        }
    };

    // ── Manual question helpers ────────────────────────────
    const addManualQ = () => setManualQuestions(p => [...p, emptyManualQ()]);
    const removeManualQ = (qi: number) => setManualQuestions(p => p.filter((_, i) => i !== qi));
    const toggleManualQ = (qi: number) => setManualQuestions(p => p.map((q, i) => i === qi ? { ...q, expanded: !q.expanded } : q));
    const setMQText = (qi: number, text: string) => setManualQuestions(p => p.map((q, i) => i === qi ? { ...q, text } : q));
    const setAnsText = (qi: number, ai: number, text: string) =>
        setManualQuestions(p => p.map((q, i) => i !== qi ? q : { ...q, answers: q.answers.map((a, j) => j === ai ? { ...a, text } : a) }));
    const setCorrect = (qi: number, ai: number) =>
        setManualQuestions(p => p.map((q, i) => i !== qi ? q : { ...q, answers: q.answers.map((a, j) => ({ ...a, correct: j === ai })) }));
    const addAnswer = (qi: number) =>
        setManualQuestions(p => p.map((q, i) => i !== qi || q.answers.length >= 4 ? q : { ...q, answers: [...q.answers, { text: "", correct: false }] }));
    const removeAnswer = (qi: number, ai: number) =>
        setManualQuestions(p => p.map((q, i) => {
            if (i !== qi || q.answers.length <= 1) return q;
            const next = q.answers.filter((_, j) => j !== ai);
            const hasCorrect = next.some(a => a.correct);
            return { ...q, answers: hasCorrect ? next : next.map((a, j) => ({ ...a, correct: j === 0 })) };
        }));

    // ── Save ──────────────────────────────────────────────
    const handleSave = async () => {
        if (!title.trim()) return setError("Title is required.");
        if (!role) return setError("Select a role.");
        if (totalQuestions === 0) return setError("Add at least one question.");

        // Validate manual questions
        for (let i = 0; i < manualQuestions.length; i++) {
            const q = manualQuestions[i];
            if (!q.text.trim()) return setError(`Manual question ${i + 1}: enter question text.`);
            if (q.answers.length < 2) return setError(`Manual question ${i + 1}: add at least 2 answers.`);
            if (q.answers.some(a => !a.text.trim())) return setError(`Manual question ${i + 1}: fill all answers.`);
            if (!q.answers.some(a => a.correct)) return setError(`Manual question ${i + 1}: mark the correct answer.`);
        }

        setError("");
        setSaving(true);
        try {
            // Convert AI questions to unified format
            const aiFormatted = aiQuestions.map((q, i) => ({
                id: i + 1,
                question: q.question,
                options: q.options,
                correct: q.correct,
                explanation: q.explanation ?? "",
                source: "ai",
            }));

            // Convert manual questions to same format
            const manualFormatted = manualQuestions.map((q, i) => ({
                id: aiQuestions.length + i + 1,
                question: q.text.trim(),
                options: q.answers.map(a => a.text.trim()),
                correct: q.answers.findIndex(a => a.correct),
                explanation: "",
                source: "manual",
            }));

            await addDoc(collection(db, "ultimate_tests"), {
                title: title.trim(),
                description,
                role,
                pdfSource: pdfPath || null,
                timePerQuestion,
                totalTime: timePerQuestion * totalQuestions,
                questions: [...aiFormatted, ...manualFormatted],
                aiQuestionsCount: aiQuestions.length,
                manualQuestionsCount: manualQuestions.length,
                createdBy: user?.uid ?? null,
                createdAt: serverTimestamp(),
                source: "ultimate",
            });

            setSaved(true);
            setTimeout(() => navigate("/admin/create-test"), 1500);
        } catch (err: any) {
            setError(err?.message || "Failed to save. Check Firestore rules.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-32 pt-6 px-4">
            <div className="flex items-center gap-2 mb-2">
                <Crown className="text-amber-500 w-6 h-6" />
                <h1 className="text-2xl font-bold">Create Ultimate Test</h1>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">SuperAdmin</span>
            </div>

            {/* Generation Source */}
            <Card className="border-t-4 border-t-amber-400">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" /> AI Generation from Document
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Role</label>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
                                <SelectContent>
                                    {ROLES.map(r => <SelectItem key={r.id} value={r.id}>{r.icon} {r.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Number of AI Questions</label>
                            <Input type="number" min={1} max={50} value={qCount} onChange={e => setQCount(Number(e.target.value))} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Training Document (PDF)</label>
                        <Select value={pdfPath} onValueChange={setPdfPath} disabled={loadingDocs}>
                            <SelectTrigger>
                                <SelectValue placeholder={loadingDocs ? "Loading…" : documents.length ? "Select document" : "No documents found"} />
                            </SelectTrigger>
                            <SelectContent>
                                {documents.map(d => <SelectItem key={d.path} value={d.path}>{d.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button onClick={generateQuestions} disabled={generating} className="gap-2">
                        {generating ? <><Loader2 size={16} className="animate-spin" /> Generating…</> : <><Sparkles size={16} /> Generate AI Questions</>}
                    </Button>

                    {genStatus && !generating && (
                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 size={16} className="text-green-600" />{genStatus}
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* AI Questions Preview */}
            {aiQuestions.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-base font-semibold text-slate-700 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" /> AI Questions ({aiQuestions.length})
                    </h3>
                    {aiQuestions.map((q, i) => (
                        <Card key={i} className="border-amber-100">
                            <CardContent className="pt-4 space-y-2">
                                <p className="font-medium text-sm">{i + 1}. {q.question}</p>
                                <ul className="space-y-1">
                                    {q.options.map((opt: string, oi: number) => (
                                        <li key={oi} className={`text-sm pl-3 ${oi === q.correct ? "text-green-600 font-semibold" : "text-muted-foreground"}`}>
                                            {String.fromCharCode(65 + oi)}. {opt}{oi === q.correct && " ✔"}
                                        </li>
                                    ))}
                                </ul>
                                {q.explanation && <p className="text-xs text-muted-foreground italic">{q.explanation}</p>}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Manual Questions */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-slate-700 flex items-center gap-2">
                        <FileQuestion className="w-4 h-4 text-blue-500" /> Manual Questions ({manualQuestions.length})
                    </h3>
                    <button
                        onClick={addManualQ}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Add Question
                    </button>
                </div>

                {manualQuestions.length === 0 && (
                    <div
                        onClick={addManualQ}
                        className="border-2 border-dashed border-slate-200 rounded-xl py-8 text-center text-slate-400 cursor-pointer hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                    >
                        <Plus className="w-6 h-6 mx-auto mb-1" />
                        <p className="text-sm">Click to add a manual question</p>
                    </div>
                )}

                {manualQuestions.map((q, qi) => (
                    <div key={qi} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50" onClick={() => toggleManualQ(qi)}>
                            <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                                {aiQuestions.length + qi + 1}
                            </span>
                            <span className="flex-1 text-sm font-medium text-slate-700 truncate">{q.text || "New question..."}</span>
                            <div className="flex items-center gap-2">
                                <button onClick={e => { e.stopPropagation(); removeManualQ(qi); }} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                {q.expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                            </div>
                        </div>

                        {q.expanded && (
                            <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
                                <textarea
                                    value={q.text}
                                    onChange={e => setMQText(qi, e.target.value)}
                                    placeholder="Enter question text..."
                                    rows={2}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                                />
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Answers — click circle for correct</p>
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
                                                onChange={e => setAnsText(qi, ai, e.target.value)}
                                                placeholder={`Answer ${ai + 1}...`}
                                                className="flex-1 text-sm border-0 bg-transparent focus:outline-none"
                                            />
                                            {a.correct && <span className="text-xs font-semibold text-emerald-600 flex-shrink-0">✓ Correct</span>}
                                            {q.answers.length > 1 && (
                                                <button onClick={() => removeAnswer(qi, ai)} className="p-1 text-slate-300 hover:text-red-400 transition-colors flex-shrink-0">
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
                                            <Plus className="w-3.5 h-3.5" /> Add answer ({q.answers.length}/4)
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Test Details */}
            <Card>
                <CardHeader><CardTitle>Test Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Title *</label>
                        <Input placeholder="Test title" value={title} onChange={e => setTitle(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Description (optional)</label>
                        <Input placeholder="Short description" value={description} onChange={e => setDescription(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Time per question</label>
                        <div className="flex gap-2">
                            {[30, 60, 90, 120].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setTimePerQuestion(s)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${timePerQuestion === s ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                                >
                                    {s}s
                                </button>
                            ))}
                        </div>
                        {totalQuestions > 0 && (
                            <p className="text-xs text-slate-500">Total: ~{Math.round((timePerQuestion * totalQuestions) / 60)} min for {totalQuestions} questions ({aiQuestions.length} AI + {manualQuestions.length} manual)</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {error && (
                <p className="flex items-center gap-2 text-sm text-destructive bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                    <AlertCircle size={16} /> {error}
                </p>
            )}
            {saved && (
                <p className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
                    <CheckCircle2 size={16} /> Ultimate test saved!
                </p>
            )}

            {/* Sticky Save Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t p-4 z-50">
                <div className="max-w-4xl mx-auto flex gap-4 items-center">
                    <span className="text-sm text-slate-500">{totalQuestions} questions total</span>
                    <Button
                        className="flex-1 h-12 text-lg font-semibold shadow-lg gap-2 bg-amber-500 hover:bg-amber-600"
                        onClick={handleSave}
                        disabled={saving || saved || totalQuestions === 0}
                    >
                        {saving ? <><Loader2 size={18} className="animate-spin" /> Saving…</> : <><Crown size={18} /> Save Ultimate Test</>}
                    </Button>
                </div>
            </div>
        </div>
    );
}
