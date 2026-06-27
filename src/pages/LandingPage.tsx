import { useState, useEffect } from "react";
import AnaChat from "../components/AnaChat";
import { useNavigate } from "react-router-dom";
import {
    ArrowRight, Play, Check, X, Loader2,
    Hotel, UtensilsCrossed, Coffee, Truck, Moon, PartyPopper,
    TrendingUp, ShieldCheck, Calculator,
} from "lucide-react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../fb/firebase";
import { ROLE } from "../models/role";

// ── Inline i18n (BS only — extend if needed) ──────────────────────────────

const T: Record<string, string> = {
    "nav.features_link": "Funkcije",
    "nav.pricing_link": "Cijene",
    "auth.login": "Prijava",
    "landing.hero_title": "Smarter HoReCa AI Supreme",
    "landing.hero_sub": "AI platforma za upravljanje hotelima, restoranima, kaféima i cateringom. Zaustavite gubitke, povećajte prihod, zadržite goste.",
    "landing.hero_tag": "🚀 Pokrenuto uživo — koriste ga objekti u regiji",
    "landing.cta_start": "Počni besplatno",
    "landing.cta_demo": "Pogledaj demo",
    "landing.cta_calc": "ROI kalkulator",
    "landing.cta_book": "Zakaži prezentaciju",
    "landing.hero_proof": "Bez kreditne kartice · Besplatnih 14 dana · Otkaži kad hoćeš",
    "landing.industries_title": "Za svaki ugostiteljski objekt",
    "landing.pricing_title": "Transparentne cijene",
    "landing.pricing_sub": "Svaki plan uključuje ROI kalkulator koji dokazuje povrat investicije.",
    "landing.most_popular": "Najpopularnije",
    "landing.roi_title": "Procijenjeni ROI / mj.",
    "landing.roi_year": "Godišnje",
    "landing.roi_disclaimer": "ROI procjene su konzervativne i temelje se na prosječnim podacima iz ugostiteljske industrije. Stvarni rezultati se razlikuju.",
    "features.heading": "Sve što trebate, na jednom mjestu",
    "features.sub": "Kliknite na bilo koju funkciju da vidite kako radi u vašem poslovanju.",
    "popup.title": "Spremi se za sljedeći nivo",
    "popup.subtitle": "Pridruži se objektima koji već koriste AI za povećanje prihoda.",
    "hero.langs_world": "🌍 Ana odgovara na SVIM svjetskim jezicima — pitajte je na bilo kojem jeziku",
    "legal.privacy": "Privatnost",
    "legal.terms": "Uvjeti korištenja",
    "legal.gdpr": "GDPR",
    "legal.cookies": "Kolačići",
    "footer.affiliate": "Affiliate program",
    "landing.ind.hotels": "Upravljanje sobama, recepcijom, HACCP procedurama, housekeepingom i osobljem — sve integrisano.",
    "landing.ind.restaurants": "POS uvoz, zalihe, HACCP čekliste, training osoblja i AI upselling preporuke.",
    "landing.ind.cafes": "Brzi onboarding, kasa kontrola i dnevni rezime u 30 sekundi.",
    "landing.ind.catering": "Planiranje događaja, HACCP evidencija i izvještaji za naručioce.",
    "landing.ind.nightclubs": "Bar inventar, osoblje po smjenama, real-time upozorenja i Silent Sentinel zaštita.",
    "landing.ind.foodtrucks": "Mobilni menadžment zaliha, narudžbi i osoblja na jednom uređaju.",
};
const t = (k: string) => T[k] ?? k;

// ── Colour tokens (dark theme matching template) ───────────────────────────
const C = {
    bg:       "bg-[#0b0f14]",
    surface:  "bg-[#111827]",
    card:     "bg-[#131b26]",
    border:   "border-[#1e2a38]",
    accent:   "text-[#00c9a7]",
    accentBg: "bg-[#00c9a7]",
    muted:    "text-slate-400",
    fg:       "text-white",
};

// ── Feature cards ──────────────────────────────────────────────────────────
type FC = { id: string; icon: string; pill: string; title: string; hook: string; body: string };

const FEATURE_CARDS: FC[] = [
    { id: "ana",      icon: "🤖", pill: "🤖 Ana AI",    title: "Ana — AI HoReCa Asistent",           hook: "Kao da imate veterana s 20 godina iskustva dostupnog 24/7 — na svakom jeziku.",                 body: "Ana je vaš AI asistent specijalizovan isključivo za ugostiteljsku industriju. Zna HACCP standarde, formule za food cost, tehnike upsellinga, zakone o radu, recepte i upravljanje reklamacijama. Odgovara glasom ili tekstom, na svim svjetskim jezicima, u sekundi." },
    { id: "dash",     icon: "📊", pill: "📊 Dashboard", title: "Dashboard u realnom vremenu",         hook: "Vidite gdje odlazi novac — u sekundi, ne sljedećeg mjeseca kad je već kasno.",                   body: "Živi KPI dashboard prikazuje prihod, nepravilnosti, otpad, narudžbe i učinak svakog radnika — ažurirano u realnom vremenu. AI automatski ukršta POS podatke sa zalihama i ističe anomalije čim se pojave." },
    { id: "sentinel", icon: "🎤", pill: "🎤 Sentinel",  title: "Silent Sentinel — AI Monitoring",    hook: "Platforma čuje šta vi ne možete i upozorava vas u sekundi.",                                    body: "PWA aplikacija u pozadini osluškuje ključne fraze vezane za krađu i prijevaru. Kada AI prepozna rizičnu frazu, vlasnik dobija alert za manje od 10 sekundi. Monitoring radi tiho — osoblje ne vidi da je alert poslan." },
    { id: "staff",    icon: "👥", pill: "👥 Osoblje",   title: "Osoblje, Geofence i Rang Lista",     hook: "Bez rasprava 'bio sam na poslu' — geolokacija dokazuje, bodovanje motiviše.",                  body: "Svaki radnik se prijavljuje putem PWA aplikacije prilagođene svojoj ulozi. Geofence prijava potvrđuje fizičku prisutnost unutar definiranog radijusa. Javna rang lista stvara zdravu kompeticiju." },
    { id: "inv",      icon: "📦", pill: "📦 Zalihe",    title: "Pametna Zaliha s AI Detekcijom",     hook: "AI ukršta svaki gram s POS-om — i zna tačno ko je, kada i na kojoj smjeni.",                  body: "Svaka stavka zalihe prati se u realnom vremenu. AI ukršta utrošak s POS narudžbama. Kada razlika premaši prag, sistem generiše alert s oznakom tačne smjene, lokacije i radnika koji su bili prisutni." },
    { id: "haccp",    icon: "✅", pill: "✅ HACCP",     title: "HACCP Čekliste s AI Foto Verificacijom", hook: "Inspekcija može doći bilo kada — vaše fotografije su dokaz koji AI već verificirao.",       body: "Svaka HACCP čeklista je digitalna i pohranjena u oblaku. AI nasumično bira minimum 3 zadatka i zahtijeva fotografiju u realnom vremenu. Gemini Vision API analizira i potvrđuje svaku fotografiju." },
    { id: "training", icon: "🎓", pill: "🎓 Treninzi", title: "Treninzi i Obuka po Poziciji",       hook: "Nov radnik za 5 dana, ne 3 sedmice — sa certifikatom koji AI verificira.",                    body: "Platforma sadrži module obuke za 15 HoReCa pozicija. Svaki modul kombinuje video, kvizove i interaktivne provjere znanja. AI prati napredak i upozorava menadžera na stagnaciju." },
    { id: "reports",  icon: "📢", pill: "📢 Prijave",   title: "Anonimne Prijave Osoblja",           hook: "Vaši radnici znaju više nego što vam govore — ovo im daje siguran kanal.",                    body: "Anonimni kanal prijava omogućava osoblju da prijavi nepravilnosti bez straha od odmazde. Svaka prijava stiže menadžmentu kao anonimna, s mogućnošću odgovora koji radnik vidi bez otkrivanja identiteta." },
    { id: "lang",     icon: "🌍", pill: "🌍 Jezici",   title: "5 Jezika Sučelja + Ana Govori Sve",  hook: "Vaš gost pita na japanskom — Ana odgovara za 3 sekunde, ispravno.",                           body: "Sučelje platforme dostupno je na srpskom, hrvatskom, bosanskom, engleskom i njemačkom. Ana razumije i odgovara na svim svjetskim jezicima, uključujući regionalne dijalekte." },
];

const INDUSTRIES = [
    { icon: Hotel,           label: "Hoteli",       k: "landing.ind.hotels" },
    { icon: UtensilsCrossed, label: "Restorani",    k: "landing.ind.restaurants" },
    { icon: Coffee,          label: "Kafići",       k: "landing.ind.cafes" },
    { icon: PartyPopper,     label: "Catering",     k: "landing.ind.catering" },
    { icon: Moon,            label: "Noćni klubovi",k: "landing.ind.nightclubs" },
    { icon: Truck,           label: "Food Trucks",  k: "landing.ind.foodtrucks" },
];

type Tier = { name: string; price: string; priceNum: number; annual: string; saving: string; popular: boolean; features: string[]; roi: { theft: number; revenue: number; ratings: number; procurement: number } };

const TIERS: Tier[] = [
    { name: "Caffé Starter",           price: "€49",  priceNum: 49,  annual: "€490",    saving: "€98",  popular: false, features: ["1 lokacija", "2 korisnika", "AI Chatbot (Ana)", "Dashboard", "Osnovna upozorenja"], roi: { theft: 250, revenue: 400, ratings: 150, procurement: 200 } },
    { name: "Restaurant Professional", price: "€149", priceNum: 149, annual: "€1.490",  saving: "€298", popular: true,  features: ["1 lokacija", "10 korisnika", "AI Chatbot (Ana)", "Čekliste & HACCP", "Sve funkcije"], roi: { theft: 900, revenue: 1600, ratings: 700, procurement: 800 } },
    { name: "Hotel Pro",               price: "€295", priceNum: 295, annual: "€2.950",  saving: "€590", popular: false, features: ["1 lokacija", "25 korisnika", "AI Chatbot (Ana)", "Sve funkcije", "Custom obuka", "AI upozorenja", "Prioritetna podrška"], roi: { theft: 2200, revenue: 4500, ratings: 1800, procurement: 1700 } },
];

// ── Login Modal ───────────────────────────────────────────────────────────
function LoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const navigate = useNavigate();
    const [email,    setEmail]    = useState("");
    const [password, setPassword] = useState("");
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState("");
    const [resetMsg, setResetMsg] = useState("");

    const redirect = (role: string) => {
        onClose();
        if (role === ROLE.ADMIN) navigate("/admin/dashboard", { replace: true });
        else navigate("/app/home", { replace: true });
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(""); setResetMsg(""); setLoading(true);
        try {
            const cred = await signInWithEmailAndPassword(auth, email, password);
            const snap = await getDocs(query(collection(db, "users"), where("email", "==", cred.user.email)));
            if (snap.empty) { setError("Korisnički profil nije pronađen."); return; }
            const data = snap.docs[0].data();
            if ((Object.values(ROLE) as string[]).includes(data.role)) redirect(data.role);
            else setError("Korisnička uloga nije prepoznata.");
        } catch (err: any) {
            setError(err.code === "auth/wrong-password" || err.code === "auth/user-not-found"
                ? "Pogrešan email ili lozinka."
                : err.message || "Prijava nije uspjela.");
        } finally { setLoading(false); }
    };


    const handleForgot = async () => {
        setError(""); setResetMsg("");
        if (!email) { setResetMsg("Unesite email adresu."); return; }
        try {
            await sendPasswordResetEmail(auth, email);
            setResetMsg("Link za resetiranje lozinke je poslan!");
        } catch (err: any) { setResetMsg(err.message || "Slanje nije uspjelo."); }
    };

    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ background: "radial-gradient(ellipse at top, rgba(0,201,167,0.15), transparent 60%), rgba(11,15,20,0.92)" }}
            onClick={onClose}
        >
            <div className="w-full max-w-md rounded-2xl border border-[#1e2a38] bg-[#111827]/90 p-8 shadow-2xl backdrop-blur-md relative"
                onClick={e => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute right-4 top-4 w-8 h-8 rounded-full bg-[#1e2a38] flex items-center justify-center text-slate-400 hover:text-white transition">
                    <X size={15} />
                </button>

                <div className="mb-6 flex justify-center">
                    <img src="/smarter_horeca_1.jpg" alt="Smarter HoReCa" className="h-16 w-auto rounded-xl" />
                </div>

                <h1 className="text-2xl font-bold text-white">Dobrodošli nazad</h1>
                <p className="mt-1 text-sm text-slate-400">Prijavite se na vaš račun</p>

                <form onSubmit={handleLogin} className="mt-6 space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-slate-400">Email</label>
                        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} disabled={loading}
                            placeholder="you@business.com"
                            className="mt-1 w-full rounded-lg border border-[#1e2a38] bg-[#0b0f14] px-3 py-2.5 text-sm text-white outline-none focus:border-[#00c9a7] placeholder:text-slate-600 transition" />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-400">Lozinka</label>
                        <input type="password" required value={password} onChange={e => setPassword(e.target.value)} disabled={loading}
                            placeholder="••••••••"
                            className="mt-1 w-full rounded-lg border border-[#1e2a38] bg-[#0b0f14] px-3 py-2.5 text-sm text-white outline-none focus:border-[#00c9a7] transition" />
                    </div>

                    <button type="button" onClick={handleForgot}
                        className="block text-right text-xs text-[#00c9a7] hover:underline w-full">
                        Zaboravili ste lozinku?
                    </button>

                    {error    && <p className="text-xs text-red-400 font-semibold">{error}</p>}
                    {resetMsg && <p className="text-xs text-[#00c9a7] font-semibold">{resetMsg}</p>}

                    <button type="submit" disabled={loading}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#00c9a7] py-3 text-sm font-bold text-[#0b0f14] transition hover:opacity-90 disabled:opacity-50">
                        {loading ? <Loader2 size={16} className="animate-spin" /> : "Prijava"}
                    </button>
                </form>

            </div>
        </div>
    );
}

// ── Demo Video Modal ───────────────────────────────────────────────────────
function DemoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="relative w-full max-w-3xl rounded-2xl border border-[#00c9a7]/30 bg-[#111827] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute right-3 top-3 z-10 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black">
                    <X size={16} />
                </button>
                <div className="aspect-video bg-gradient-to-br from-[#0b0f14] to-[#111827] flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-6xl mb-4">🎬</div>
                        <p className="text-white font-bold text-xl mb-2">Smarter HoReCa AI Supreme</p>
                        <p className="text-slate-400 text-sm">Ana, Silent Sentinel, HACCP foto verifikacija i POS uvoz.</p>
                    </div>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-[#1e2a38] bg-[#0b0f14]/60 p-4">
                    <p className="text-xs text-slate-400">Otvorite besplatan probni period za potpunu interakciju.</p>
                </div>
            </div>
        </div>
    );
}

// ── Main Landing Component ─────────────────────────────────────────────────
export default function LandingPage() {
    const [loginOpen, setLoginOpen] = useState(false);
    const [demoOpen,  setDemoOpen]  = useState(false);
    const [expanded,  setExpanded]  = useState<string | null>(null);

    const goLogin  = () => setLoginOpen(true);

    const jumpTo = (id: string) => {
        setExpanded(id);
        requestAnimationFrame(() => {
            document.getElementById(`fc-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        });
    };

    // Exit-intent popup (simple version)
    useEffect(() => {
        const seen = sessionStorage.getItem("lp.exit");
        if (seen) return;
        const onLeave = (e: MouseEvent) => {
            if (e.clientY <= 0 && !sessionStorage.getItem("lp.exit")) {
                sessionStorage.setItem("lp.exit", "1");
            }
        };
        document.addEventListener("mouseleave", onLeave);
        return () => document.removeEventListener("mouseleave", onLeave);
    }, []);

    return (
        <div className={`min-h-screen ${C.bg} text-white`}>

            {/* ── HERO ── */}
            <section className="relative isolate overflow-hidden">
                {/* Background video */}
                <video
                    autoPlay muted loop playsInline
                    className="absolute inset-0 -z-20 h-full w-full object-cover"
                    src="/bg-video.mp4"
                />
                {/* Dark overlay so text stays readable */}
                <div className="absolute inset-0 -z-10 bg-[#0b0f14]/75" />
                <div className="absolute inset-0 -z-10" style={{ background: "radial-gradient(ellipse at top, rgba(0,201,167,0.10), transparent 60%)" }} />

                {/* Nav */}
                <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
                    <div className="flex items-center gap-3">
                        <img src="/smarter_horeca_1.jpg" alt="Smarter HoReCa" className="h-10 w-auto rounded-lg" />
                        <span className="text-sm font-bold tracking-tight">Smarter HoReCa</span>
                    </div>
                    <nav className="hidden items-center gap-6 text-sm text-slate-400 md:flex">
                        <a href="#features" className="hover:text-white transition">{t("nav.features_link")}</a>
                        <a href="#industries" className="hover:text-white transition">HoReCa Tool</a>
                        <a href="#pricing" className="hover:text-white transition">{t("nav.pricing_link")}</a>
                        <button onClick={goLogin} className="hover:text-white transition">{t("auth.login")}</button>
                    </nav>
                    <button
                        onClick={goLogin}
                        className="rounded-lg border border-[#1e2a38] px-3 py-1.5 text-sm hover:bg-[#111827] transition"
                    >
                        {t("auth.login")}
                    </button>
                </header>

                {/* Hero body */}
                <div className="mx-auto max-w-5xl px-6 pt-12 pb-32 text-center md:pt-20 md:pb-44">
                    <div className="mx-auto mb-10 inline-block rounded-3xl bg-white/5 p-6 backdrop-blur-sm border border-white/10">
                        <img src="/smarter_horeca_1.jpg" alt="Smarter HoReCa AI Supreme" className="mx-auto h-auto rounded-xl" style={{ maxWidth: 320 }} />
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">
                        {t("landing.hero_title").split(" AI Supreme")[0]}{" "}
                        <span className="text-[#00c9a7]" style={{ textShadow: "0 0 40px rgba(0,201,167,0.5)" }}>AI Supreme</span>
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-base text-slate-400 md:text-lg">{t("landing.hero_sub")}</p>
                    <p className="mt-3 text-sm font-semibold text-[#00c9a7]">{t("landing.hero_tag")}</p>
                    <div className="mx-auto mt-4 inline-flex max-w-2xl items-center gap-2 rounded-full border border-[#00c9a7]/30 bg-[#00c9a7]/10 px-4 py-1.5 text-xs font-semibold text-[#00c9a7]">
                        {t("hero.langs_world")}
                    </div>
                    <div className="mt-10 flex flex-wrap justify-center gap-3">
                        <button
                            onClick={goLogin}
                            className="inline-flex items-center gap-2 rounded-lg bg-[#00c9a7] px-6 py-3.5 text-sm font-bold text-[#0b0f14] transition hover:scale-105 hover:shadow-[0_10px_40px_-5px_rgba(0,201,167,0.6)]"
                        >
                            {t("landing.cta_start")} <ArrowRight size={16} />
                        </button>
                        <button
                            onClick={() => setDemoOpen(true)}
                            className="inline-flex items-center gap-2 rounded-lg border-2 border-[#00c9a7] bg-transparent px-6 py-3.5 text-sm font-bold text-[#00c9a7] hover:bg-[#00c9a7]/10 transition"
                        >
                            <Play size={16} /> {t("landing.cta_demo")}
                        </button>
                        <a
                            href="#pricing"
                            className="inline-flex items-center gap-2 rounded-lg border border-[#1e2a38] bg-[#111827]/60 px-6 py-3.5 text-sm font-bold text-white backdrop-blur hover:bg-[#111827] transition"
                        >
                            <Calculator size={16} /> {t("landing.cta_calc")}
                        </a>
                        <button
                            onClick={goLogin}
                            className="inline-flex items-center gap-2 rounded-lg border border-[#1e2a38] bg-[#111827]/60 px-6 py-3.5 text-sm font-bold text-white backdrop-blur hover:bg-[#111827] transition"
                        >
                            {t("landing.cta_book")}
                        </button>
                    </div>
                    <p className="mt-6 text-xs text-slate-500">{t("landing.hero_proof")}</p>
                </div>
            </section>

            {/* ── FEATURES ── */}
            <section id="features" className="mx-auto max-w-6xl px-6 py-20">
                <h2 className="text-center text-3xl font-bold md:text-4xl">{t("features.heading")}</h2>
                <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-slate-400">{t("features.sub")}</p>

                {/* Filter pills */}
                <div className="mt-8 -mx-6 overflow-x-auto px-6 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <div className="flex w-max gap-2">
                        {FEATURE_CARDS.map(c => (
                            <button
                                key={c.id}
                                onClick={() => jumpTo(c.id)}
                                className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                                    expanded === c.id
                                        ? "border-[#00c9a7] bg-[#00c9a7] text-[#0b0f14]"
                                        : "border-[#1e2a38] bg-[#111827]/60 text-slate-400 hover:border-[#00c9a7]/50 hover:text-white"
                                }`}
                            >
                                {c.pill}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Cards grid */}
                <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {FEATURE_CARDS.map(c => {
                        const open = expanded === c.id;
                        return (
                            <div
                                key={c.id}
                                id={`fc-${c.id}`}
                                className={`flex flex-col rounded-2xl border ${C.card} p-6 transition duration-150 hover:-translate-y-0.5 ${
                                    open ? "border-[#00c9a7] border-l-[3px] shadow-[0_0_40px_-10px_rgba(0,201,167,0.5)]" : "border-[#1e2a38] hover:border-[#00c9a7]/60"
                                }`}
                            >
                                <div className="mb-3 text-3xl leading-none">{c.icon}</div>
                                <h3 className="text-lg font-bold text-white">{c.title}</h3>
                                <p className="mt-1.5 text-sm italic text-[#00c9a7]">{c.hook}</p>
                                <div
                                    className="grid transition-all duration-300 ease-in-out"
                                    style={{ gridTemplateRows: open ? "1fr" : "0fr", opacity: open ? 1 : 0, marginTop: open ? "1rem" : 0 }}
                                >
                                    <div className="overflow-hidden">
                                        <p className="text-sm leading-relaxed text-slate-300">{c.body}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setExpanded(p => p === c.id ? null : c.id)}
                                    className="mt-4 inline-flex items-center gap-1 self-start text-[13px] font-bold text-[#00c9a7] hover:underline"
                                >
                                    {open ? "Zatvori ↑" : "Pročitaj više ↓"}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* ── LEAD CAPTURE ── */}
            <section className="border-y border-[#1e2a38] bg-[#111827]/30 py-14">
                <div className="mx-auto grid max-w-6xl gap-6 px-6 md:grid-cols-[1fr_420px] md:items-center">
                    <div>
                        <h2 className="text-2xl font-extrabold md:text-3xl">Ostavite email za HoReCa AI uvide</h2>
                        <p className="mt-2 max-w-2xl text-sm text-slate-400">Dobijte insajderske trendove i poziv na demo bez spama.</p>
                    </div>
                    <form className="flex flex-col gap-2 sm:flex-row" onSubmit={e => { e.preventDefault(); }}>
                        <input type="email" required placeholder="ime@hotel.com"
                            className="min-h-11 flex-1 rounded-lg border border-[#1e2a38] bg-[#0b0f14] px-3 text-sm outline-none focus:border-[#00c9a7] text-white placeholder:text-slate-500" />
                        <button type="submit" className="rounded-lg bg-[#00c9a7] px-5 py-3 text-sm font-bold text-[#0b0f14] hover:opacity-90">Pošalji</button>
                    </form>
                </div>
            </section>

            {/* ── INDUSTRIES ── */}
            <section id="industries" className="border-y border-[#1e2a38] bg-[#111827]/40 py-16">
                <div className="mx-auto max-w-6xl px-6">
                    <h2 className="text-center text-3xl font-bold md:text-4xl">{t("landing.industries_title")}</h2>
                    <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                        {INDUSTRIES.map(i => {
                            const Icon = i.icon;
                            return (
                                <div key={i.label} className={`rounded-2xl border ${C.border} ${C.card} p-6`}>
                                    <div className="mb-3 flex items-center gap-3">
                                        <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#00c9a7]/15 text-[#00c9a7]">
                                            <Icon size={20} />
                                        </div>
                                        <h3 className="text-base font-bold">{i.label}</h3>
                                    </div>
                                    <p className="text-sm text-slate-400">{t(i.k)}</p>
                                    <button onClick={goLogin} className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#00c9a7] hover:underline">
                                        {t("landing.cta_start")} <ArrowRight size={12} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── PRICING ── */}
            <section id="pricing" className="mx-auto max-w-6xl px-6 py-20">
                <h2 className="text-center text-3xl font-bold md:text-4xl">{t("landing.pricing_title")}</h2>
                <p className="mx-auto mt-3 max-w-xl text-center text-sm text-slate-400">{t("landing.pricing_sub")}</p>
                <div className="mt-12 grid gap-5 md:grid-cols-3">
                    {TIERS.map(tier => {
                        const totalMonthly = tier.roi.theft + tier.roi.revenue + tier.roi.ratings + tier.roi.procurement;
                        const totalYear = totalMonthly * 12;
                        const roiX = Math.round(totalMonthly / tier.priceNum);
                        return (
                            <div key={tier.name} className={`relative rounded-2xl border ${C.card} p-6 ${
                                tier.popular ? "border-[#00c9a7] shadow-[0_0_40px_-10px_rgba(0,201,167,0.5)]" : "border-[#1e2a38]"
                            }`}>
                                {tier.popular && (
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#00c9a7] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#0b0f14]">
                                        ⭐ {t("landing.most_popular")}
                                    </span>
                                )}
                                <h3 className="text-xl font-bold">{tier.name}</h3>
                                <div className="mt-3 text-4xl font-extrabold">
                                    {tier.price}<span className="text-sm font-medium text-slate-400">/mj.</span>
                                </div>
                                <div className="mt-2 rounded-lg border border-[#00c9a7]/30 bg-[#00c9a7]/5 px-3 py-2 text-xs">
                                    <div className="font-semibold text-[#00c9a7]">Godišnje: {tier.annual}</div>
                                    <div className="text-slate-400">Uštedite {tier.saving} — 2 mjeseca gratis</div>
                                </div>
                                <div className="mt-4 rounded-xl border border-[#1e2a38] bg-[#0b0f14]/40 p-3">
                                    <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#00c9a7]">
                                        <TrendingUp size={12} /> {t("landing.roi_title")}
                                    </div>
                                    <ul className="space-y-1 text-xs text-slate-400">
                                        <li className="flex justify-between"><span>🛡️ Prevencija krađe</span><span className="text-white">+€{tier.roi.theft}</span></li>
                                        <li className="flex justify-between"><span>📈 Extra prihod</span><span className="text-white">+€{tier.roi.revenue}</span></li>
                                        <li className="flex justify-between"><span>⭐ Viši guest ratings</span><span className="text-white">+€{tier.roi.ratings}</span></li>
                                        <li className="flex justify-between"><span>📦 Pametna nabavka</span><span className="text-white">+€{tier.roi.procurement}</span></li>
                                    </ul>
                                    <div className="mt-2 border-t border-[#1e2a38] pt-2 text-xs">
                                        <div className="flex justify-between font-bold"><span>Mjesečno</span><span className="text-[#00c9a7]">≈ €{totalMonthly.toLocaleString()}</span></div>
                                        <div className="flex justify-between text-slate-400"><span>{t("landing.roi_year")}</span><span>≈ €{totalYear.toLocaleString()}</span></div>
                                        <div className="mt-1 flex items-center justify-between rounded bg-[#00c9a7]/10 px-2 py-1 text-[11px]">
                                            <span className="flex items-center gap-1 font-semibold text-[#00c9a7]"><ShieldCheck size={12} /> ROI</span>
                                            <span className="font-extrabold text-[#00c9a7]">{roiX}×</span>
                                        </div>
                                    </div>
                                </div>
                                <ul className="mt-5 space-y-2.5 text-sm">
                                    {tier.features.map(f => (
                                        <li key={f} className="flex items-center gap-2 text-slate-400">
                                            <Check size={16} className="text-[#00c9a7]" /> {f}
                                        </li>
                                    ))}
                                </ul>
                                <button
                                    onClick={goLogin}
                                    className={`mt-6 w-full rounded-lg py-3 text-center text-sm font-bold transition ${
                                        tier.popular ? "bg-[#00c9a7] text-[#0b0f14] hover:opacity-90" : "border border-[#1e2a38] hover:bg-[#111827]"
                                    }`}
                                >
                                    {t("landing.cta_start")}
                                </button>
                            </div>
                        );
                    })}
                </div>
                <p className="mx-auto mt-6 max-w-3xl text-center text-xs text-slate-500">{t("landing.roi_disclaimer")}</p>
            </section>

            {/* ── FINAL CTA ── */}
            <section className="bg-gradient-to-r from-[#00c9a7]/20 via-[#00c9a7]/10 to-transparent py-14">
                <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-center md:flex-row md:text-left">
                    <div>
                        <h3 className="text-2xl font-extrabold">{t("popup.title")}</h3>
                        <p className="text-sm text-slate-400">{t("popup.subtitle")}</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button onClick={goLogin} className="rounded-lg bg-[#00c9a7] px-6 py-3 text-sm font-bold text-[#0b0f14] hover:opacity-90">
                            {t("landing.cta_start")}
                        </button>
                        <button onClick={goLogin} className="rounded-lg border border-[#1e2a38] bg-[#111827] px-6 py-3 text-sm font-bold hover:bg-[#1e2a38] transition">
                            {t("landing.cta_book")}
                        </button>
                    </div>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer className="border-t border-[#1e2a38] bg-[#111827]/40">
                <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-slate-400">
                    <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                        <div className="flex items-center gap-3">
                            <img src="/smarter_horeca_1.jpg" alt="Smarter HoReCa" className="h-10 w-auto rounded-lg" />
                            <div>
                                <div className="font-bold text-white">Smarter HoReCa AI Supreme</div>
                                <div className="text-xs">© CB INTERACTIVE — All rights reserved</div>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
                            <span className="hover:text-white cursor-pointer">{t("legal.privacy")}</span>
                            <span className="hover:text-white cursor-pointer">{t("legal.terms")}</span>
                            <span className="hover:text-white cursor-pointer">{t("legal.gdpr")}</span>
                            <span className="hover:text-white cursor-pointer">{t("legal.cookies")}</span>
                            <a href="mailto:info@smarter-horeca.com" className="hover:text-white">info@smarter-horeca.com</a>
                        </div>
                    </div>
                    <div className="mt-6 text-xs">© 2025 Smarter HoReCa AI Supreme. All rights reserved.</div>
                </div>
            </footer>

            <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} />
            <AnaChat />
            <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
        </div>
    );
}
