const https = require("https");

const API_KEY    = "AIzaSyAbEVmo0BWoRZwAR9bv0Tyf0xP4dOEC1pU";
const PROJECT_ID = "horecaapp-e16cf";
const EMAIL      = process.argv[2];
const PASSWORD   = process.argv[3];

if (!EMAIL || !PASSWORD) {
  console.error("Usage: node push-waiter-quiz.cjs <email> <password>");
  process.exit(1);
}

const questions = [
  { question: 'Koliko brzo treba dočekati gosta?',                                  options: ['Nije bitno kada', 'Unutar 1-2 minute', 'Kad ima vremena'],                                                 correct: 1 },
  { question: 'Šta je "86-lista"?',                                                 options: ['Lista popularnih jela', 'Lista nedostupnih artikala', 'Lista gostiju'],                                    correct: 1 },
  { question: 'Kada se unosi narudžba u POS?',                                      options: ['Na kraju smjene', 'Odmah, precizno', 'Kad ima vremena'],                                                   correct: 1 },
  { question: 'Koliko nakon serviranja glavnog jela treba provjeriti gosta?',        options: ['2 minute', '30 minuta', 'Nikad'],                                                                         correct: 0 },
  { question: 'Šta je "pre-bus"?',                                                  options: ['Naplata unaprijed', 'Uklanjanje praznih tanjira čim gost završi', 'Brzo serviranje'],                     correct: 1 },
  { question: 'Šta provjeravaš prije uzimanja narudžbe hrane?',                     options: ['Cijenu', 'Alergije i dijetalne zahtjeve', 'Broj stola samo'],                                             correct: 1 },
  { question: 'Šta radiš odmah nakon odlaska gosta sa stola?',                      options: ['Ostaviš sto kako jeste', 'Pripremiš sto za sljedećeg gosta (clear & reset)', 'Čekaš menadžera'],          correct: 1 },
  { question: 'Kome prijavljuješ reklamaciju gosta?',                               options: ['Nikom, sam rješavaš', 'Menadžeru odmah', 'Kuvaru'],                                                       correct: 1 },
  { question: 'Šta provjeravaš na stolovima prije otvaranja?',                      options: ['Boju stolnjaka', 'Pravilno postavljanje (stolnjaci, pribor, čaše)', 'Cijenu stola'],                       correct: 1 },
  { question: 'Da li se račun provjerava prije nego se donese gostu?',              options: ['Ne', 'Da, za točnost', 'Samo ako gost traži'],                                                             correct: 1 },
  { question: 'Šta nudiš gostu na kraju obroka?',                                   options: ['Ništa', 'Desert i kafu/čaj', 'Novi meni'],                                                                correct: 1 },
  { question: 'Šta provjeravaš sa kuhinjom prije smjene?',                          options: ['Recepte', 'Dnevni meni i nedostupne artikle', 'Plate kuvara'],                                            correct: 1 },
  { question: 'Koliko često dopunjavaš vodu/piće gostu?',                           options: ['Nikad', 'Tokom obroka, bez da budeš ometajući', 'Samo na kraju'],                                         correct: 1 },
  { question: 'Šta provjeravaš u toaletu za goste?',                                options: ['Ništa, to nije tvoj posao', 'Čistoću i potrepštine', 'Broj posjeta'],                                     correct: 1 },
  { question: 'Kako se zove standardni redoslijed usluživanja gosta?',              options: ['Steps of service', 'Random servis', 'Brzi servis'],                                                       correct: 0 },
  { question: 'Šta vraćaš gostu ako plaća gotovinom?',                              options: ['Ništa', 'Ispravan kusur', 'Bon za sljedeću posjetu'],                                                     correct: 1 },
  { question: 'Šta predstavljaš gostu pri dolasku?',                                options: ['Samo meni', 'Dnevne specijale', 'Cijene konkurencije'],                                                   correct: 1 },
  { question: 'Šta provjeravaš na servisnoj stanici prije otvaranja?',              options: ['Ništa', 'Čistoću i kompletnost (salvete, escajg)', 'Boju stanice'],                                       correct: 1 },
  { question: 'Šta radiš kad gost završi jelo?',                                    options: ['Čekaš da cijeli sto završi', 'Ukloniš prazne tanjire odmah', 'Pitaš za napojnicu'],                       correct: 1 },
  { question: 'Zašto unosiš narudžbu odmah u POS?',                                options: ['Nije bitno kada', 'Da se izbjegnu greške i kasniji propusti', 'Radi brzine plaćanja'],                    correct: 1 },
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
      { fieldFilter: { field: { fieldPath: "role" },   op: "EQUAL", value: { stringValue: "waiter" } } },
      { fieldFilter: { field: { fieldPath: "source" }, op: "EQUAL", value: { stringValue: "seed" } } },
    ] } }, limit: 1 } },
    idToken
  );

  const payload = { fields: toFSFields({
    title: "Konobar — Osnovna pitanja",
    role: "waiter",
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
    if (r.status === 200) console.log("  ✔ Updated waiter quiz successfully");
    else { console.error("  ✗ Patch failed:", r.body); process.exit(1); }
  } else {
    console.log("  No existing doc found — creating…");
    const r = await post(fsBase, colPath, payload, idToken);
    if (r.status === 200) console.log("  ✔ Created waiter quiz successfully");
    else { console.error("  ✗ Create failed:", r.body); process.exit(1); }
  }
}

main().catch(err => { console.error(err); process.exit(1); });
