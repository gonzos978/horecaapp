const https = require("https");

const API_KEY    = "AIzaSyAbEVmo0BWoRZwAR9bv0Tyf0xP4dOEC1pU";
const PROJECT_ID = "horecaapp-e16cf";
const EMAIL      = process.argv[2];
const PASSWORD   = process.argv[3];

if (!EMAIL || !PASSWORD) {
  console.error("Usage: node push-maintenance-quiz.cjs <email> <password>");
  process.exit(1);
}

const questions = [
  { question: 'Šta provjeravaš prvo na početku smjene?',                             options: ['Ništa', 'Log prijavljenih kvarova', 'Meni restorana'],                                                   correct: 1 },
  { question: 'Šta znači "P1" prioritet popravke?',                                 options: ['Estetski problem', 'Sigurnost gosta, najhitnije', 'Najmanje hitno'],                                     correct: 1 },
  { question: 'Šta provjeravaš vezano za vatrodojavu?',                              options: ['Ništa', 'Rad sistema i protupožarnu opremu', 'Boju aparata'],                                            correct: 1 },
  { question: 'Šta provjeravaš na liftu?',                                           options: ['Ništa', 'Vrata, signalizaciju, dugme za hitne slučajeve', 'Boju kabine'],                                correct: 1 },
  { question: 'Šta radiš sa filterima za klimu?',                                   options: ['Ignorišeš', 'Mijenjaš prema planu održavanja', 'Čistiš ih jednom godišnje'],                             correct: 1 },
  { question: 'Šta provjeravaš vezano za vodovod?',                                  options: ['Ništa', 'Curenje, začepljenja, neobične mirise', 'Boju vode'],                                          correct: 1 },
  { question: 'Šta dokumentuješ nakon popravke?',                                    options: ['Ništa', 'Šta, kada, koji djelovi/materijal su utrošeni', 'Samo datum'],                                  correct: 1 },
  { question: 'Koji prioritet ima problem koji utiče na funkcionalnost sobe?',       options: ['P1', 'P2', 'P3'],                                                                                        correct: 1 },
  { question: 'Šta provjeravaš na sigurnosnim sistemima (CCTV)?',                   options: ['Ništa', 'Tehničku funkcionalnost', 'Boju kamera'],                                                       correct: 1 },
  { question: 'Šta provjeravaš vezano za bazen/spa opremu?',                         options: ['Ništa', 'Pumpe i filtere, ako su u opisu pozicije', 'Boju vode'],                                       correct: 1 },
  { question: 'Šta provjeravaš na generatoru?',                                      options: ['Ništa', 'Rad sistema za hitno napajanje', 'Boju generatora'],                                            correct: 1 },
  { question: 'Šta provjeravaš prije korištenja alata/opreme?',                     options: ['Ništa', 'Zalihu i ispravnost zaštitne opreme', 'Cijenu alata'],                                         correct: 1 },
  { question: 'Šta pomažeš tehnički pripremiti za posebne događaje?',               options: ['Ništa', 'Prostor za banket/konferenciju', 'Meni'],                                                       correct: 1 },
  { question: 'Šta provjeravaš na vanjskim površinama?',                             options: ['Ništa', 'Parking, prilazne puteve, rasvjetu', 'Boju asfalta'],                                         correct: 1 },
  { question: 'Šta provjeravaš prije zatvaranja popravke kao završene?',             options: ['Ništa', 'Da je stvarno riješena, ne samo privremeno sanirana', 'Da je jeftino riješena'],               correct: 1 },
  { question: 'Šta osiguravaš na kraju smjene?',                                    options: ['Ništa', 'Radionicu/skladište alata i materijala', 'Parking'],                                            correct: 1 },
  { question: 'Šta predaješ sljedećoj smjeni/menadžeru?',                           options: ['Ništa', 'Izvještaj o izvršenim i otvorenim popravkama', 'Ključeve gosta'],                               correct: 1 },
  { question: 'Šta provjeravaš vezano za rezervne djelove?',                         options: ['Ništa', 'Zalihu, prijaviš nedostatke za narudžbu', 'Boju djelova'],                                    correct: 1 },
  { question: 'Šta obavljaš prema mjesečnom/sedmičnom rasporedu?',                  options: ['Ništa', 'Planiranu preventivnu provjeru opreme', 'Čišćenje soba'],                                      correct: 1 },
  { question: 'Zašto je preventivno održavanje bitno?',                              options: ['Nije bitno', 'Smanjuje troškove i produžava vijek opreme', 'Radi izgleda'],                             correct: 1 },
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
      { fieldFilter: { field: { fieldPath: "role" },   op: "EQUAL", value: { stringValue: "maintenance" } } },
      { fieldFilter: { field: { fieldPath: "source" }, op: "EQUAL", value: { stringValue: "seed" } } },
    ] } }, limit: 1 } },
    idToken
  );

  const payload = { fields: toFSFields({
    title: "Domar — Osnovna pitanja",
    role: "maintenance",
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
    if (r.status === 200) console.log("  ✔ Updated maintenance quiz successfully");
    else { console.error("  ✗ Patch failed:", r.body); process.exit(1); }
  } else {
    console.log("  No existing doc found — creating…");
    const r = await post(fsBase, colPath, payload, idToken);
    if (r.status === 200) console.log("  ✔ Created maintenance quiz successfully");
    else { console.error("  ✗ Create failed:", r.body); process.exit(1); }
  }
}

main().catch(err => { console.error(err); process.exit(1); });
