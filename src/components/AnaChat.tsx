import { useEffect, useRef, useState } from "react";
import { Send, X, Maximize2 } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `Ti si Ana, AI asistent za Smarter HoReCa platformu — vodeće rješenje za upravljanje hotelima, restoranima, kaféima i cateringom u regiji.
Pomažeš menadžerima i vlasnicima ugostiteljskih objekata sa: upravljanjem osobljem, smjenama, godišnjim odmorima, obukama, inventarom, menijima i anonimnim prijavama.
Uvijek odgovaraj ljubazno, profesionalno i kratko. Odgovaraj na istom jeziku kojim ti se korisnik obraća.`;

const genAI = new GoogleGenerativeAI("AIzaSyAuweguPGysCbQFhctYt5UI8YAzxaYzdtI");

interface Message {
    id: string;
    role: "user" | "assistant";
    text: string;
}

export default function AnaChat() {
    const [open, setOpen] = useState(false);
    const [bubbleVisible, setBubbleVisible] = useState(true);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [showPhoto, setShowPhoto] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const chatRef = useRef<any>(null);

    useEffect(() => {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            systemInstruction: SYSTEM_PROMPT,
        });
        chatRef.current = model.startChat({
            history: [],
            generationConfig: { maxOutputTokens: 1024 },
        });
    }, []);

    useEffect(() => {
        if (open) return;
        const hide = setTimeout(() => setBubbleVisible(false), 8000);
        const show = setInterval(() => setBubbleVisible(true), 30000);
        return () => { clearTimeout(hide); clearInterval(show); };
    }, [open]);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, [messages, loading]);

    const send = async (text: string) => {
        const v = text.trim();
        if (!v || loading || !chatRef.current) return;
        setInput("");
        setBubbleVisible(false);

        const userMsg: Message = { id: Date.now().toString(), role: "user", text: v };
        const updated = [...messages, userMsg];
        setMessages(updated);
        setLoading(true);

        try {
            const result = await chatRef.current.sendMessage(v);
            const reply = result.response.text();
            setMessages([...updated, { id: Date.now().toString() + "a", role: "assistant", text: reply }]);
        } catch (err: any) {
            console.error("AnaChat error:", err);
            setMessages([...updated, { id: Date.now().toString() + "e", role: "assistant", text: "Žao mi je, desila se greška. Pokušajte ponovo." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {!open && bubbleVisible && (
                <div className="fixed bottom-24 right-5 z-[140] max-w-[260px] rounded-2xl rounded-br-sm border border-[#00c9a7]/30 bg-[#111827] px-4 py-3 text-sm shadow-2xl text-white">
                    <button onClick={() => setBubbleVisible(false)} className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-[#0b0f14] text-slate-400 hover:text-white">
                        <X className="h-3 w-3" />
                    </button>
                    <p className="leading-snug text-slate-300">Zdravo! Ja sam Ana, vaš HoReCa AI asistent. Mogu li vam pomoći?</p>
                    <button onClick={() => setOpen(true)} className="mt-2 text-xs font-bold text-[#00c9a7] hover:underline">
                        Započni razgovor →
                    </button>
                </div>
            )}

            <button
                onClick={() => setOpen(o => !o)}
                aria-label="Ana AI asistent"
                className="fixed bottom-5 right-5 z-[150] h-16 w-16 overflow-hidden rounded-full border-2 border-[#00c9a7] shadow-[0_10px_40px_-5px_rgba(0,201,167,0.6)] transition-transform hover:scale-110"
            >
                {open ? (
                    <span className="grid h-full w-full place-items-center bg-[#0b0f14] text-[#00c9a7]">
                        <X className="h-6 w-6" />
                    </span>
                ) : (
                    <img src="/ana.jpg" alt="Ana" className="h-full w-full object-cover" />
                )}
            </button>

            {open && (
                <div className="fixed bottom-24 right-5 z-[150] flex h-[520px] w-[360px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111827] shadow-2xl">
                    <div className="flex items-center gap-3 border-b border-white/10 bg-[#0b0f14]/80 px-4 py-3">
                        <button onClick={() => setShowPhoto(true)} className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-[#00c9a7] hover:ring-4 transition">
                            <img src="/ana.jpg" alt="Ana" className="h-full w-full object-cover" />
                            <span className="absolute inset-0 grid place-items-center bg-black/0 opacity-0 hover:bg-black/40 hover:opacity-100 transition">
                                <Maximize2 className="h-4 w-4 text-white" />
                            </span>
                        </button>
                        <div className="flex-1 leading-tight">
                            <div className="text-sm font-semibold text-white">Ana</div>
                            <div className="text-[11px] text-[#00c9a7]">HoReCa AI Asistent</div>
                        </div>
                        <button onClick={() => setOpen(false)} className="rounded p-1 text-slate-400 hover:text-white">
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-3 text-sm">
                        {messages.length === 0 && (
                            <div className="rounded-2xl rounded-tl-sm bg-white/10 p-3 text-white/90">
                                Zdravo! Ja sam Ana 👋 Vaš AI asistent za HoReCa menadžment. Kako vam mogu pomoći danas?
                            </div>
                        )}
                        {messages.map(m => (
                            <div key={m.id} className={m.role === "user"
                                ? "ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-[#00c9a7] px-3 py-2 text-[#0b0f14] font-medium"
                                : "max-w-[90%] rounded-2xl rounded-tl-sm bg-white/10 px-3 py-2 text-white/90 whitespace-pre-wrap"
                            }>
                                {m.text}
                            </div>
                        ))}
                        {loading && (
                            <div className="flex items-center gap-1">
                                <span className="h-2 w-2 animate-bounce rounded-full bg-[#00c9a7]" />
                                <span className="h-2 w-2 animate-bounce rounded-full bg-[#00c9a7] [animation-delay:120ms]" />
                                <span className="h-2 w-2 animate-bounce rounded-full bg-[#00c9a7] [animation-delay:240ms]" />
                            </div>
                        )}
                    </div>

                    <form onSubmit={e => { e.preventDefault(); send(input); }}
                        className="flex items-center gap-2 border-t border-white/10 bg-[#0b0f14]/80 p-2">
                        <input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Pitajte Anu nešto..."
                            className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-sm text-white placeholder-slate-400 outline-none ring-1 ring-white/10 focus:ring-[#00c9a7]"
                        />
                        <button type="submit" disabled={loading || !input.trim()}
                            className="grid h-9 w-9 place-items-center rounded-lg bg-[#00c9a7] text-[#0b0f14] transition hover:opacity-90 disabled:opacity-40">
                            <Send className="h-4 w-4" />
                        </button>
                    </form>
                </div>
            )}

            {showPhoto && (
                <div onClick={() => setShowPhoto(false)} className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-6 backdrop-blur">
                    <div className="relative max-h-[90vh] max-w-sm overflow-hidden rounded-3xl border-2 border-[#00c9a7] shadow-2xl">
                        <img src="/ana.jpg" alt="Ana" className="h-full w-full object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent px-5 py-4">
                            <div className="text-lg font-bold text-white">Ana</div>
                            <div className="text-xs text-[#00c9a7]">HoReCa AI Asistent · Govori sve jezike</div>
                        </div>
                        <button onClick={e => { e.stopPropagation(); setShowPhoto(false); }}
                            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/70 text-white hover:bg-black">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
