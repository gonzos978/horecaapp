const https = require("https");

const API_KEY    = "AIzaSyAbEVmo0BWoRZwAR9bv0Tyf0xP4dOEC1pU";
const PROJECT_ID = "horecaapp-e16cf";
const EMAIL      = process.argv[2];
const PASSWORD   = process.argv[3];

if (!EMAIL || !PASSWORD) {
  console.error("Usage: node push-night-security-quiz.cjs <email> <password>");
  process.exit(1);
}

const questions = [
  { question: 'Šta provjeravaš prvo pri preuzimanju smjene?',                       options: ['Ništa', 'Log i otvorene zahtjeve od prethodne smjene', 'Meni restorana'],                                correct: 1 },
  { question: 'Koliko često se obavlja obilazak objekta tokom noći?',               options: ['Jednom', 'Svaka 2 sata', 'Samo ako se nešto čuje'],                                                       correct: 1 },
  { question: 'Šta provjeravaš na alarmnom panelu?',                                options: ['Ništa', 'Rad sistema za vatrodojavu', 'Boju panela'],                                                     correct: 1 },
  { question: 'Šta provjeravaš na CCTV sistemu?',                                   options: ['Ništa', 'Da li sve kamere snimaju ispravno', 'Broj kamera'],                                              correct: 1 },
  { question: 'Šta radiš ako gost stigne kasno (kasni check-in)?',                  options: ['Ignorišeš', 'Pomažeš mu', 'Pozoveš menadžera obavezno'],                                                  correct: 1 },
  { question: 'Šta pripremaš za sutrašnje dolaske?',                                options: ['Ništa', 'Listu dolazaka i posebne zahtjeve', 'Cjenovnik'],                                               correct: 1 },
  { question: 'Šta je "night audit"?',                                              options: ['Čišćenje noću', 'Usklađivanje dnevnog POS izvještaja sa sistemom', 'Provjera sigurnosti samo'],          correct: 1 },
  { question: 'Šta provjeravaš na izlazima za slučaj opasnosti?',                  options: ['Ništa', 'Da su slobodni i obilježeni', 'Boju vrata'],                                                     correct: 1 },
  { question: 'Šta evidentiraš tokom noći?',                                        options: ['Ništa', 'Sve incidente i neobične događaje u log', 'Samo velike probleme'],                               correct: 1 },
  { question: 'Šta osiguravaš na početku smjene?',                                  options: ['Ništa posebno', 'Kasu i sef za noć', 'Parking'],                                                         correct: 1 },
  { question: 'Šta pripremaš za jutarnji servis?',                                  options: ['Ništa', 'Prostor za doručak (sala, bar, recepcija)', 'Novi meni'],                                       correct: 1 },
  { question: 'Šta provjeravaš na ulazima objekta?',                                options: ['Ništa', 'Da su pravilno zaključani/osigurani', 'Boju vrata'],                                            correct: 1 },
  { question: 'Šta radiš ako primijetiš neobičnu aktivnost?',                       options: ['Ignorišeš', 'Pratiš i evidentiraš', 'Odmah intervenišeš fizički'],                                       correct: 1 },
  { question: 'Šta predaješ jutarnjoj smjeni?',                                     options: ['Ništa', 'Detaljan smjenski izvještaj', 'Ključeve sefa samo'],                                            correct: 1 },
  { question: 'Šta provjeravaš tokom obilaska u javnim toaletima?',                 options: ['Ništa', 'Čistoću i zalihe', 'Broj posjeta'],                                                             correct: 1 },
  { question: 'Da li noćni čuvar može objediniti i ulogu "night portera"?',        options: ['Ne, nikad', 'Da, čest slučaj u manjim hotelima', 'Samo vikendom'],                                       correct: 1 },
  { question: 'Šta provjeravaš vezano za vremensku prognozu?',                      options: ['Ništa', 'Pripremu objekta za ekstremne uslove', 'Boju neba'],                                            correct: 1 },
  { question: 'Šta radiš na kraju smjene?',                                         options: ['Ništa posebno', 'Obavljaš posljednji obilazak objekta', 'Odmah odlaziš'],                                correct: 1 },
  { question: 'Šta pripremaš za sutrašnje grupne dolaske?',                         options: ['Ništa', 'Ključeve/kartice ako je potrebno', 'Cjenovnik'],                                               correct: 1 },
  { question: 'Zašto je dokumentovanje obilazaka bitno?',                            options: ['Nije bitno', 'Dokaz da je sigurnosna procedura ispoštovana', 'Radi statistike'],                         correct: 1 },
];

function post(hostname, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const headers = { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const req = https.request({ hostname, path, method: "POST", headers }, res => {
      let raw = "";
      res.on("data", c => raw += c);
      res.on("end", () => { try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); } catch { resolve({ status: res.statusCode, body: raw }); } });
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function patch(hostname, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const headers = { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data), "Authorization": `Bearer ${token}` };
    const req = https.request({ hostname, path, method: "PATCH", headers }, res => {
      let raw = "";
      res.on("data", c => raw += c);
      res.on("end", () => { try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); } catch { resolve({ status: res.statusCode, body: raw }); } });
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function toFSValue(v) {
  if (v === null)             return { nullValue: null };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number")  return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === "string")  return { stringValue: v };
  if (Array.isArray(v))       return { arrayValue: { values: v.map(toFSValue) } };
  if (typeof v === "object")  return { mapValue: { fields: toFSFields(v) } };
}
function toFSFields(obj) {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, toFSValue(v)]));
}

async function main() {
  console.log(`Signing in as ${EMAIL}…`);
  const authRes = await post("identitytoolkit.googleapis.com",
    `/v1/accounts:signInWithPassword?key=${API_KEY}`,
    { email: EMAIL, password: PASSWORD, returnSecureToken: true }
  );
  if (authRes.status !== 200) { console.error("Auth failed:", authRes.body?.error?.message); process.exit(1); }
  const idToken = authRes.body.idToken;
  console.log("  ✔ Signed in");

  const fsBase  = "firestore.googleapis.com";
  const colPath = `/v1/projects/${PROJECT_ID}/databases/(default)/documents/quizzes`;

  const queryRes = await post(fsBase,
    `/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`,
    { structuredQuery: { from: [{ collectionId: "quizzes" }], where: { compositeFilter: { op: "AND", filters: [
      { fieldFilter: { field: { fieldPath: "role" },   op: "EQUAL", value: { stringValue: "night_security" } } },
      { fieldFilter: { field: { fieldPath: "source" }, op: "EQUAL", value: { stringValue: "seed" } } },
    ] } }, limit: 1 } },
    idToken
  );

  const payload = { fields: toFSFields({
    title: "Noćni čuvar — Osnovna pitanja",
    role: "night_security",
    timePerQuestion: 60,
    totalTime: 60 * questions.length,
    questions,
    createdBy: "system",
    source: "seed",
  }) };

  const existing = queryRes.body?.[0]?.document;
  if (existing) {
    console.log(`  Found existing doc — updating…`);
    const r = await patch(fsBase, `/v1/${existing.name}`, payload, idToken);
    if (r.status === 200) console.log("  ✔ Updated night_security quiz successfully");
    else { console.error("  ✗ Patch failed:", r.body); process.exit(1); }
  } else {
    console.log("  No existing doc found — creating…");
    const r = await post(fsBase, colPath, payload, idToken);
    if (r.status === 200) console.log("  ✔ Created night_security quiz successfully");
    else { console.error("  ✗ Create failed:", r.body); process.exit(1); }
  }
}

main().catch(err => { console.error(err); process.exit(1); });
