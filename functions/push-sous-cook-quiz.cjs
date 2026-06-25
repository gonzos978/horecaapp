const https = require("https");

const API_KEY    = "AIzaSyAbEVmo0BWoRZwAR9bv0Tyf0xP4dOEC1pU";
const PROJECT_ID = "horecaapp-e16cf";
const EMAIL      = process.argv[2];
const PASSWORD   = process.argv[3];

if (!EMAIL || !PASSWORD) {
  console.error("Usage: node push-sous-cook-quiz.cjs <email> <password>");
  process.exit(1);
}

const questions = [
  { question: 'Ko organizuje radnu stanicu pomoćnog kuvara?',                       options: ['Sam pomoćni kuvar prema instrukcijama glavnog kuvara', 'Konobar', 'Menadžer'],                              correct: 0 },
  { question: 'Šta znači FIFO princip kod skladištenja?',                            options: ['Prvo ušlo, prvo izašlo', 'Najjeftinije prvo', 'Nasumičan odabir'],                                          correct: 0 },
  { question: 'Da li se daske za rezanje čiste između svake upotrebe?',             options: ['Ne, samo na kraju dana', 'Da, između svake upotrebe', 'Jednom sedmično'],                                   correct: 1 },
  { question: 'Šta radiš sa povrćem prije pripreme?',                               options: ['Direktno sječeš', 'Opereš ga', 'Stavljaš odmah u tiganj'],                                                  correct: 1 },
  { question: 'Ko provjerava kvalitet dostavljene robe?',                            options: ['Samo menadžer', 'Pomoćni kuvar pomaže u provjeri', 'Konobar'],                                              correct: 1 },
  { question: 'Šta je "temperature danger zone"?',                                  options: ['Opasna zona za rast bakterija (4°C-60°C)', 'Temperatura zamrzivača', 'Temperatura rerne'],                  correct: 0 },
  { question: 'Da li pomoćni kuvar pomaže u serviranju tokom peak service-a?',      options: ['Ne, to nije njegov posao', 'Da', 'Samo ako kuvar nije tu'],                                                 correct: 1 },
  { question: 'Šta radiš sa otpadom u kuhinji?',                                    options: ['Ostaviš ga do kraja dana', 'Iznesi i razdvojiš pravilno', 'Ostaviš ga kuvaru da riješi'],                   correct: 1 },
  { question: 'Ko prijavljuje problem sa sastojcima ili opremom?',                  options: ['Niko, samostalno se rješava', 'Pomoćni kuvar prijavljuje glavnom kuvaru odmah', 'Čeka se kraj smjene'],      correct: 1 },
  { question: 'Šta znači "clean-as-you-go"?',                                       options: ['Čišćenje samo na kraju', 'Pranje posuđa tokom smjene, ne čekati kraj', 'Čišćenje jednom dnevno'],           correct: 1 },
  { question: 'Da li se sastojci obilježavaju datumom?',                            options: ['Ne', 'Da, prema FIFO principu', 'Samo vikendom'],                                                           correct: 1 },
  { question: 'Šta provjeravaš na alatu (mikseri, blenderi) prije upotrebe?',      options: ['Boju', 'Ispravnost', 'Cijenu'],                                                                             correct: 1 },
  { question: 'Gdje se skladišti dostavljena roba?',                                options: ['Bilo gdje ima mjesta', 'Prema FIFO principu i temperaturnim zahtjevima', 'Na podu'],                        correct: 1 },
  { question: 'Ko pomaže u pripremi garnirunga?',                                   options: ['Konobar', 'Pomoćni kuvar', 'Higijeničarka'],                                                                correct: 1 },
  { question: 'Šta radiš ako primijetiš prosutu tečnost na podu?',                 options: ['Ignorišeš ako nisi ti prolio', 'Odmah očistiš', 'Sačekaš čišćenje na kraju'],                               correct: 1 },
  { question: 'Da li se rashladni uređaji moraju zatvoriti nakon upotrebe?',        options: ['Da, uvijek', 'Nije bitno', 'Samo noću'],                                                                    correct: 0 },
  { question: 'Šta provjeravaš prije pauze?',                                       options: ['Ništa posebno', 'Čistoću radne stanice', 'Cijenu hrane'],                                                   correct: 1 },
  { question: 'Ko asistira u pripremi za banket narudžbe?',                         options: ['Samo glavni kuvar', 'Pomoćni kuvar pomaže', 'Servirka'],                                                    correct: 1 },
  { question: 'Šta predaješ na kraju smjene glavnom kuvaru?',                       options: ['Ništa', 'Izvještaj o utrošenim sastojcima', 'Listu gostiju'],                                               correct: 1 },
  { question: 'Zašto je bitno razdvojiti sastojke po temperaturnim zahtjevima?',    options: ['Estetski razlog', 'Sigurnost hrane', 'Nije bitno'],                                                         correct: 1 },
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
      { fieldFilter: { field: { fieldPath: "role" },   op: "EQUAL", value: { stringValue: "sous_cook" } } },
      { fieldFilter: { field: { fieldPath: "source" }, op: "EQUAL", value: { stringValue: "seed" } } },
    ] } }, limit: 1 } },
    idToken
  );

  const payload = { fields: toFSFields({
    title: "Pomoćni kuvar — Osnovna pitanja",
    role: "sous_cook",
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
    if (r.status === 200) console.log("  ✔ Updated sous_cook quiz successfully");
    else { console.error("  ✗ Patch failed:", r.body); process.exit(1); }
  } else {
    console.log("  No existing doc found — creating…");
    const r = await post(fsBase, colPath, payload, idToken);
    if (r.status === 200) console.log("  ✔ Created sous_cook quiz successfully");
    else { console.error("  ✗ Create failed:", r.body); process.exit(1); }
  }
}

main().catch(err => { console.error(err); process.exit(1); });
