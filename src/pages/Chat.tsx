import { useState, useEffect, useRef, useCallback } from "react";
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    serverTimestamp,
    orderBy,
    getDocs,
    doc,
    setDoc,
    getDoc,
} from "firebase/firestore";
import { db } from "../fb/firebase";
import { useAuth } from "../contexts/AuthContext";
import { MessageSquare, Send, Users, ChevronLeft, Plus, X, Check } from "lucide-react";

interface Message {
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    createdAt: any;
}

interface ChatMeta {
    id: string;
    type: "group" | "dm" | "custom_group";
    name: string;
    memberIds?: string[];
}

interface ColleagueUser {
    id: string;
    name: string;
    role: string;
}

interface GroupDoc {
    id: string;
    name: string;
    memberIds: string[];
    customerId: string;
}

export default function Chat() {
    const { user, currentUser } = useAuth();
    const [activeChat, setActiveChat] = useState<ChatMeta | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [text, setText] = useState("");
    const [colleagues, setColleagues] = useState<ColleagueUser[]>([]);
    const [customGroups, setCustomGroups] = useState<GroupDoc[]>([]);
    const [sending, setSending] = useState(false);

    // New group modal state
    const [showNewGroup, setShowNewGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");
    const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
    const [creatingGroup, setCreatingGroup] = useState(false);

    const bottomRef = useRef<HTMLDivElement>(null);
    const knownMsgIds = useRef<Set<string>>(new Set());
    const isFirstLoad = useRef(true);

    const playPing = useCallback(() => {
        try {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = "sine";
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.35);
            osc.onended = () => ctx.close();
        } catch {}
    }, []);

    const customerId = currentUser?.customerId;
    const myUid = user?.uid;
    const myName = currentUser?.name || user?.email || "Korisnik";

    // Load colleagues from same company
    useEffect(() => {
        if (!customerId) return;
        const q = query(collection(db, "users"), where("customerId", "==", customerId));
        getDocs(q).then(snap => {
            const list: ColleagueUser[] = snap.docs
                .filter(d => d.id !== myUid)
                .map(d => ({ id: d.id, name: d.data().name || d.data().email, role: d.data().role }));
            setColleagues(list);
        });
    }, [customerId, myUid]);

    // Listen to custom groups for this company that include me
    useEffect(() => {
        if (!customerId || !myUid) return;
        const q = query(
            collection(db, "chat_groups"),
            where("customerId", "==", customerId),
            where("memberIds", "array-contains", myUid)
        );
        const unsub = onSnapshot(q, snap => {
            setCustomGroups(snap.docs.map(d => ({ id: d.id, ...d.data() } as GroupDoc)));
        });
        return () => unsub();
    }, [customerId, myUid]);

    // Listen to messages for active chat
    useEffect(() => {
        if (!activeChat) return;
        const q = query(
            collection(db, "chats", activeChat.id, "messages"),
            orderBy("createdAt", "asc")
        );
        isFirstLoad.current = true;
        knownMsgIds.current = new Set();

        const unsub = onSnapshot(q, snap => {
            const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Message));
            setMessages(msgs);

            if (isFirstLoad.current) {
                msgs.forEach(m => knownMsgIds.current.add(m.id));
                isFirstLoad.current = false;
            } else {
                msgs.forEach(m => {
                    if (!knownMsgIds.current.has(m.id)) {
                        knownMsgIds.current.add(m.id);
                        if (m.senderId !== myUid) playPing();
                    }
                });
            }
        });
        return () => unsub();
    }, [activeChat?.id]);

    // Scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const openGroupChat = async () => {
        if (!customerId) return;
        const chatId = `group_${customerId}`;
        const chatRef = doc(db, "chats", chatId);
        const snap = await getDoc(chatRef);
        if (!snap.exists()) {
            await setDoc(chatRef, {
                type: "group",
                customerId,
                name: currentUser?.customerName || "Grupni Chat",
                createdAt: serverTimestamp(),
            });
        }
        setActiveChat({ id: chatId, type: "group", name: snap.data()?.name || currentUser?.customerName || "Grupni Chat" });
    };

    const openDM = async (colleague: ColleagueUser) => {
        if (!myUid) return;
        const ids = [myUid, colleague.id].sort();
        const chatId = ids.join("_");
        const chatRef = doc(db, "chats", chatId);
        const snap = await getDoc(chatRef);
        if (!snap.exists()) {
            await setDoc(chatRef, {
                type: "dm",
                participantIds: ids,
                customerId,
                createdAt: serverTimestamp(),
            });
        }
        setActiveChat({ id: chatId, type: "dm", name: colleague.name, memberIds: ids });
    };

    const openCustomGroup = (g: GroupDoc) => {
        setActiveChat({ id: `cg_${g.id}`, type: "custom_group", name: g.name, memberIds: g.memberIds });
    };

    const createGroup = async () => {
        if (!newGroupName.trim() || selectedMembers.size === 0 || !customerId || !myUid) return;
        setCreatingGroup(true);
        try {
            const members = [myUid, ...Array.from(selectedMembers)];
            const groupRef = await addDoc(collection(db, "chat_groups"), {
                name: newGroupName.trim(),
                customerId,
                memberIds: members,
                createdBy: myUid,
                createdAt: serverTimestamp(),
            });
            // Create the chat doc
            const chatId = `cg_${groupRef.id}`;
            await setDoc(doc(db, "chats", chatId), {
                type: "custom_group",
                groupId: groupRef.id,
                customerId,
                name: newGroupName.trim(),
                memberIds: members,
                createdAt: serverTimestamp(),
            });
            setShowNewGroup(false);
            setNewGroupName("");
            setSelectedMembers(new Set());
            setActiveChat({ id: chatId, type: "custom_group", name: newGroupName.trim(), memberIds: members });
        } finally {
            setCreatingGroup(false);
        }
    };

    const toggleMember = (id: string) => {
        setSelectedMembers(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const sendMessage = async () => {
        if (!text.trim() || !activeChat || sending) return;
        setSending(true);
        try {
            await addDoc(collection(db, "chats", activeChat.id, "messages"), {
                senderId: myUid,
                senderName: myName,
                text: text.trim(),
                createdAt: serverTimestamp(),
            });
            setText("");
        } finally {
            setSending(false);
        }
    };

    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const activeChatIsGroup = activeChat?.type === "group";
    const activeChatIsCustom = activeChat?.type === "custom_group";
    const canCreateGroup = ["customer", "CUSTOMER", "manager", "MANAGER"].includes(currentUser?.role ?? "");

    return (
        <div className="flex h-[calc(100vh-80px)] sm:h-[calc(100vh-140px)] gap-0 rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
            {/* Sidebar */}
            <div className={`w-full sm:w-72 shrink-0 border-r border-slate-200 flex flex-col ${activeChat ? "hidden md:flex" : "flex"}`}>
                <div className="p-4 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                        Chat
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                    {/* All-company group */}
                    <p className="text-xs font-semibold text-slate-400 uppercase px-2 pt-2 pb-1">Opći chat</p>
                    <button
                        onClick={openGroupChat}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition ${
                            activeChatIsGroup ? "bg-blue-600 text-white" : "hover:bg-slate-100 text-slate-700"
                        }`}
                    >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${activeChatIsGroup ? "bg-white/20" : "bg-blue-100"}`}>
                            <Users className={`w-4 h-4 ${activeChatIsGroup ? "text-white" : "text-blue-600"}`} />
                        </div>
                        <div>
                            <p className="font-semibold text-sm">{currentUser?.customerName || "Tim"}</p>
                            <p className={`text-xs ${activeChatIsGroup ? "text-white/70" : "text-slate-400"}`}>Svi zaposleni</p>
                        </div>
                    </button>

                    {/* Custom groups */}
                    <div className="flex items-center justify-between px-2 pt-4 pb-1">
                        <p className="text-xs font-semibold text-slate-400 uppercase">Grupe</p>
                        {canCreateGroup && (
                            <button
                                onClick={() => setShowNewGroup(true)}
                                className="w-5 h-5 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 flex items-center justify-center transition"
                                title="Nova grupa"
                            >
                                <Plus className="w-3 h-3" />
                            </button>
                        )}
                    </div>

                    {customGroups.length === 0 && (
                        <p className="text-xs text-slate-400 px-3 pb-1">Nema grupa. Klikni + da kreiraš.</p>
                    )}
                    {customGroups.map(g => {
                        const isActive = activeChat?.id === `cg_${g.id}`;
                        return (
                            <button
                                key={g.id}
                                onClick={() => openCustomGroup(g)}
                                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition ${
                                    isActive ? "bg-violet-600 text-white" : "hover:bg-slate-100 text-slate-700"
                                }`}
                            >
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isActive ? "bg-white/20" : "bg-violet-100"}`}>
                                    <Users className={`w-4 h-4 ${isActive ? "text-white" : "text-violet-600"}`} />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm truncate max-w-[130px]">{g.name}</p>
                                    <p className={`text-xs ${isActive ? "text-white/70" : "text-slate-400"}`}>{g.memberIds.length} članova</p>
                                </div>
                            </button>
                        );
                    })}

                    {/* DMs */}
                    {colleagues.length > 0 && (
                        <>
                            <p className="text-xs font-semibold text-slate-400 uppercase px-2 pt-4 pb-1">Direktne poruke</p>
                            {colleagues.map(c => {
                                const dmId = myUid ? [myUid, c.id].sort().join("_") : "";
                                const isActive = activeChat?.id === dmId;
                                return (
                                    <button
                                        key={c.id}
                                        onClick={() => openDM(c)}
                                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition ${
                                            isActive ? "bg-blue-600 text-white" : "hover:bg-slate-100 text-slate-700"
                                        }`}
                                    >
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                                            {(c.name || "?")[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm truncate max-w-[140px]">{c.name}</p>
                                            <p className={`text-xs capitalize ${isActive ? "text-white/70" : "text-slate-400"}`}>{c.role}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </>
                    )}
                </div>
            </div>

            {/* Message area */}
            <div className={`flex-1 flex flex-col ${!activeChat ? "hidden md:flex" : "flex"}`}>
                {!activeChat ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
                        <MessageSquare className="w-12 h-12 opacity-30" />
                        <p className="font-medium">Odaberi razgovor</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
                            <button onClick={() => setActiveChat(null)} className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                activeChatIsCustom ? "bg-violet-100" : activeChatIsGroup ? "bg-blue-100" : "bg-slate-100"
                            }`}>
                                {activeChat.type !== "dm"
                                    ? <Users className={`w-4 h-4 ${activeChatIsCustom ? "text-violet-600" : "text-blue-600"}`} />
                                    : <span className="font-bold text-sm text-slate-600">{activeChat.name[0].toUpperCase()}</span>
                                }
                            </div>
                            <div>
                                <p className="font-semibold text-slate-800">{activeChat.name}</p>
                                <p className="text-xs text-slate-400">
                                    {activeChatIsGroup ? "Svi zaposleni" : activeChatIsCustom ? `Grupa · ${activeChat.memberIds?.length ?? 0} članova` : "Direktna poruka"}
                                </p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {messages.length === 0 && (
                                <p className="text-center text-slate-400 text-sm mt-8">Još nema poruka. Pošalji prvu!</p>
                            )}
                            {messages.map(m => {
                                const isMe = m.senderId === myUid;
                                return (
                                    <div key={m.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                        {!isMe && <span className="text-xs text-slate-400 px-1 mb-1">{m.senderName}</span>}
                                        <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                                            isMe ? "bg-blue-600 text-white rounded-br-sm" : "bg-slate-100 text-slate-800 rounded-bl-sm"
                                        }`}>
                                            {m.text}
                                        </div>
                                        <span className="text-[10px] text-slate-300 px-1 mt-1">
                                            {m.createdAt?.toDate
                                                ? m.createdAt.toDate().toLocaleTimeString("bs-BA", { hour: "2-digit", minute: "2-digit" })
                                                : ""}
                                        </span>
                                    </div>
                                );
                            })}
                            <div ref={bottomRef} />
                        </div>

                        <div className="p-4 border-t border-slate-100 flex gap-2">
                            <textarea
                                rows={1}
                                value={text}
                                onChange={e => setText(e.target.value)}
                                onKeyDown={handleKey}
                                placeholder="Napiši poruku... (Enter za slanje)"
                                className="flex-1 resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50"
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!text.trim() || sending}
                                className="w-11 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition disabled:opacity-40 shrink-0"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* New group modal */}
            {showNewGroup && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between p-5 border-b border-slate-100">
                            <h3 className="font-bold text-slate-800 text-lg">Nova grupa</h3>
                            <button onClick={() => { setShowNewGroup(false); setNewGroupName(""); setSelectedMembers(new Set()); }}
                                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 block">Naziv grupe</label>
                                <input
                                    type="text"
                                    value={newGroupName}
                                    onChange={e => setNewGroupName(e.target.value)}
                                    placeholder="npr. Konobari, Kuhinja..."
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 block">
                                    Odaberi članove ({selectedMembers.size} odabrano)
                                </label>
                                <div className="space-y-1 max-h-56 overflow-y-auto">
                                    {colleagues.map(c => {
                                        const sel = selectedMembers.has(c.id);
                                        return (
                                            <button
                                                key={c.id}
                                                onClick={() => toggleMember(c.id)}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition ${
                                                    sel ? "bg-blue-50 border border-blue-200" : "hover:bg-slate-50 border border-transparent"
                                                }`}
                                            >
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${sel ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                                                    {sel ? <Check className="w-4 h-4" /> : (c.name || "?")[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm text-slate-800">{c.name}</p>
                                                    <p className="text-xs text-slate-400 capitalize">{c.role}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="p-5 border-t border-slate-100">
                            <button
                                onClick={createGroup}
                                disabled={!newGroupName.trim() || selectedMembers.size === 0 || creatingGroup}
                                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition disabled:opacity-40 flex items-center justify-center gap-2"
                            >
                                {creatingGroup
                                    ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    : <Plus className="w-4 h-4" />
                                }
                                Kreiraj grupu
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
