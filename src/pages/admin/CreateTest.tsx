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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Sparkles,
    Loader2,
    FileQuestion,
    AlertCircle,
    CheckCircle2,
    Save,
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

export default function CreateTest() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [role, setRole] = useState("");
    const [pdfPath, setPdfPath] = useState("");
    const [qCount, setQCount] = useState(5);
    const [questions, setQuestions] = useState<any[]>([]);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState("basic");
    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState("");
    const [error, setError] = useState("");
    const [documents, setDocuments] = useState<{ path: string; name: string }[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(false);

    // Load PDFs from Firebase Storage for the current user.
    // Layout: documents/{uid}/{timestamp}_{file}
    useEffect(() => {
        if (!user) return;
        const loadDocuments = async () => {
            setLoadingDocs(true);
            try {
                const rootRef = ref(storage, `documents/${user.uid}`);
                const root = await listAll(rootRef);
                const docs = root.items.map(item => ({
                    path: item.fullPath,
                    // Strip the "{timestamp}_" prefix added on upload for a cleaner label.
                    name: item.name.replace(/^\d+_/, ""),
                }));

                setDocuments(docs);
            } catch (err) {
                console.error("Failed to list documents:", err);
            } finally {
                setLoadingDocs(false);
            }
        };
        loadDocuments();
    }, [user]);

    const generateQuestions = async () => {
        if (!role) return setError("Select a role first.");
        if (!pdfPath) return setError("Select a training document.");
        setGenerating(true);
        setError("");

        try {
            // The Cloud Function downloads the PDF, extracts text, and
            // asks Gemini for questions — all server-side.
            setStatus("Generating questions with Gemini…");
            const generate = httpsCallable(functions, "generateQuestions");
            const result = await generate({
                role,
                roleContext: ROLE_CONTEXT[role],
                pdfPath,
                count: qCount,
            });

            const data = result.data as { questions: any[] };
            const raw = data.questions ?? [];

            // Client-side safety net: drop any question missing required fields
            const generated = raw.filter(
                (q) =>
                    q &&
                    typeof q.question === "string" &&
                    Array.isArray(q.options) &&
                    q.options.length === 4 &&
                    typeof q.correct === "number" &&
                    typeof q.explanation === "string"
            );

            if (generated.length === 0) {
                setError("No valid questions were returned. Please try again.");
                return;
            }

            setQuestions(generated);

            if (!title) {
                const name = pdfPath.split("/").pop()!.replace(/\.pdf$/i, "").replace(/[-_]/g, " ");
                setTitle(`${role.charAt(0).toUpperCase() + role.slice(1)} — ${name} Test`);
            }
            setStatus(`${generated.length} questions ready ✔`);
        } catch (err: any) {
            console.error("Generate error:", err);
            setError(err?.message || "Failed to generate. Try again.");
        } finally {
            setGenerating(false);
        }
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!title.trim()) return setError("Title is required.");
        if (!role) return setError("Select a role.");
        if (!questions.length) return setError("Generate questions first.");

        setSaving(true);
        try {
            // Firestore path: tests → {role} → "test questions and answers" → auto-doc
            const colRef = collection(db, "tests", role, "test questions and answers");
            await addDoc(colRef, {
                title,
                description,
                type,
                role,
                pdfSource: pdfPath,
                createdAt: serverTimestamp(),
                questions: questions.map((q, i) => ({
                    id: i + 1,
                    question: q.question,
                    options: q.options,
                    correct: q.correct,
                    explanation: q.explanation ?? "",
                })),
            });
            navigate("/admin/tests");
        } catch (err) {
            setError("Failed to save. Check Firestore rules.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-32 pt-6 px-4">
            <div className="flex items-center gap-2 mb-2">
                <FileQuestion className="text-primary" />
                <h1 className="text-2xl font-bold">Create Test</h1>
            </div>

            {/* Generation Source */}
            <Card className="border-t-4 border-t-primary">
                <CardHeader>
                    <CardTitle>Generate from Document</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Role</label>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ROLES.map(r => (
                                        <SelectItem key={r.id} value={r.id}>
                                            {r.icon} {r.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Number of Questions</label>
                            <Input
                                type="number"
                                min={1}
                                max={50}
                                value={qCount}
                                onChange={e => setQCount(Number(e.target.value))}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Training Document (PDF)</label>
                        <Select value={pdfPath} onValueChange={setPdfPath} disabled={loadingDocs}>
                            <SelectTrigger>
                                <SelectValue
                                    placeholder={
                                        loadingDocs
                                            ? "Loading documents…"
                                            : documents.length
                                                ? "Select a training document"
                                                : "No training documents found"
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {documents.map(d => (
                                    <SelectItem key={d.path} value={d.path}>
                                        {d.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        onClick={generateQuestions}
                        disabled={generating}
                        className="gap-2"
                    >
                        {generating ? (
                            <>
                                <Loader2 size={16} className="animate-spin" /> Generating…
                            </>
                        ) : (
                            <>
                                <Sparkles size={16} /> Generate Questions
                            </>
                        )}
                    </Button>

                    {status && (
                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                            {!generating && <CheckCircle2 size={16} className="text-green-600" />}
                            {status}
                        </p>
                    )}
                    {error && (
                        <p className="flex items-center gap-2 text-sm text-destructive">
                            <AlertCircle size={16} /> {error}
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Test Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Test Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Title</label>
                        <Input
                            placeholder="Test title"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Description (Optional)</label>
                        <Input
                            placeholder="Short description"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Type</label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="basic">Basic</SelectItem>
                                <SelectItem value="advanced">Advanced</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Questions Preview */}
            {questions.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold italic text-muted-foreground">
                        Questions ({questions.length})
                    </h3>
                    {questions.map((q, i) => (
                        <Card key={i}>
                            <CardContent className="pt-6 space-y-2">
                                <p className="font-medium">
                                    {i + 1}. {q.question}
                                </p>
                                <ul className="space-y-1">
                                    {(q.options ?? []).map((opt: string, oi: number) => (
                                        <li
                                            key={oi}
                                            className={`text-sm pl-3 ${
                                                oi === q.correct
                                                    ? "text-green-600 font-semibold"
                                                    : "text-muted-foreground"
                                            }`}
                                        >
                                            {String.fromCharCode(65 + oi)}. {opt}
                                            {oi === q.correct && " ✔"}
                                        </li>
                                    ))}
                                </ul>
                                {q.explanation && (
                                    <p className="text-xs text-muted-foreground italic">
                                        {q.explanation}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Sticky Save Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t p-4 z-50">
                <div className="max-w-4xl mx-auto flex gap-4">
                    <Button
                        className="flex-1 h-12 text-lg font-semibold shadow-lg gap-2"
                        onClick={handleSubmit}
                        disabled={saving || questions.length === 0}
                    >
                        {saving ? (
                            <>
                                <Loader2 size={18} className="animate-spin" /> Saving…
                            </>
                        ) : (
                            <>
                                <Save size={18} /> Save Test
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}