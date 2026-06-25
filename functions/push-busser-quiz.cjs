const https = require("https");

const API_KEY    = "AIzaSyAbEVmo0BWoRZwAR9bv0Tyf0xP4dOEC1pU";
const PROJECT_ID = "horecaapp-e16cf";
const EMAIL      = process.argv[2];
const PASSWORD   = process.argv[3];

if (!EMAIL || !PASSWORD) {
  console.error("Usage: node push-busser-quiz.cjs <email> <password>");
  process.exit(1);
}

const questions = [
  { question: 'Šta je glavna razlika između servirke i konobara?',                  options: ['Nema razlike', 'Servirka ne naplaćuje i ne uzima narudžbe', 'Servirka radi samo noću'],                  correct: 1 },
  { question: 'Šta provjeravaš prije otvaranja na stolovima?',                       options: ['Ništa', 'Pravilno postavljanje (stolnjaci, escajg, čaše)', 'Cijenu stola'],                               correct: 1 },
  { question: 'Šta je "pre-bus"?',                                                  options: ['Naplata unaprijed', 'Uklanjanje praznih tanjira čim gost završi', 'Čišćenje prije otvaranja'],             correct: 1 },
  { question: 'Šta nosiš gostu tokom obroka?',                                      options: ['Samo račun', 'Vodu i hljeb', 'Novi meni'],                                                                 correct: 1 },
  { question: 'Šta provjeravaš na poslužavniku prije nošenja jela?',                options: ['Ništa', 'Da je svaka stavka ispravna prema narudžbi', 'Boju tanjira'],                                    correct: 1 },
  { question: 'Šta radiš odmah nakon odlaska gosta?',                               options: ['Ostaviš sto', 'Obrišeš i resetuješ sto (clear & reset)', 'Čekaš konobara'],                               correct: 1 },
  { question: 'Kome prijavljuješ ako gost izgleda nezadovoljan?',                   options: ['Niko, nije tvoj posao', 'Konobaru ili menadžeru', 'Kuvaru'],                                               correct: 1 },
  { question: 'Šta razdvajaš na stanici za pranje?',                                options: ['Ništa, sve ide zajedno', 'Staklo, escajg, tanjire', 'Samo čaše'],                                         correct: 1 },
  { question: 'Šta provjeravaš u toaletima za goste?',                              options: ['Ništa', 'Čistoću i zalihe', 'Broj posjeta'],                                                              correct: 1 },
  { question: 'Šta dopunjavaš tokom mirnijih perioda servisa?',                     options: ['Ništa', 'Servisnu stanicu', 'Meni'],                                                                       correct: 1 },
  { question: 'Šta pomažeš konobaru da uradi brzo?',                                options: ['Naplatu', 'Nošenje jela iz kuhinje dok je toplo', 'Pisanje narudžbe'],                                    correct: 1 },
  { question: 'Šta provjeravaš oko stolova tokom smjene?',                          options: ['Ništa', 'Podove od mrvica i prosute tečnosti', 'Boju stolica'],                                           correct: 1 },
  { question: 'Da li servirka uzima narudžbu hrane od gosta?',                      options: ['Da, uvijek', 'Ne, to radi konobar', 'Samo za piće'],                                                      correct: 1 },
  { question: 'Šta vraćaš nazad u kuhinju nakon servisa?',                          options: ['Ništa', 'Posuđe, organizovano', 'Meni'],                                                                  correct: 1 },
  { question: 'Šta pomažeš pripremiti za velike grupe?',                            options: ['Ništa', 'Stolove prema rasporedu', 'Cjenovnik'],                                                          correct: 1 },
  { question: 'Šta provjeravaš na kraju smjene vezano za salu?',                    options: ['Ništa', 'Urednost (stolice, podovi, osvjetljenje)', 'Broj gostiju'],                                      correct: 1 },
  { question: 'Gdje se vraća sva oprema (poslužavnici, stanice)?',                  options: ['Bilo gdje', 'Na određeno mjesto', 'Kuvaru'],                                                              correct: 1 },
  { question: 'Kome prijavljuješ završetak zaduženja?',                             options: ['Niko', 'Šef-konobaru/menadžeru', 'Higijeničarki'],                                                        correct: 1 },
  { question: 'Šta pripremaš za sljedećeg gosta odmah?',                            options: ['Ništa', 'Sto (clear & reset)', 'Novi meni'],                                                              correct: 1 },
  { question: 'Zašto je brzina bitna kod nošenja hrane?',                           options: ['Nije bitna', 'Da hrana stigne topla gostu', 'Radi napojnice'],                                            correct: 1 },
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
      { fieldFilter: { field: { fieldPath: "role" },   op: "EQUAL", value: { stringValue: "busser" } } },
      { fieldFilter: { field: { fieldPath: "source" }, op: "EQUAL", value: { stringValue: "seed" } } },
    ] } }, limit: 1 } },
    idToken
  );

  const payload = { fields: toFSFields({
    title: "Servirka — Osnovna pitanja",
    role: "busser",
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
    if (r.status === 200) console.log("  ✔ Updated busser quiz successfully");
    else { console.error("  ✗ Patch failed:", r.body); process.exit(1); }
  } else {
    console.log("  No existing doc found — creating…");
    const r = await post(fsBase, colPath, payload, idToken);
    if (r.status === 200) console.log("  ✔ Created busser quiz successfully");
    else { console.error("  ✗ Create failed:", r.body); process.exit(1); }
  }
}

main().catch(err => { console.error(err); process.exit(1); });
