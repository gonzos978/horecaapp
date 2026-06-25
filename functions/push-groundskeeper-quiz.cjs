const https = require("https");

const API_KEY    = "AIzaSyAbEVmo0BWoRZwAR9bv0Tyf0xP4dOEC1pU";
const PROJECT_ID = "horecaapp-e16cf";
const EMAIL      = process.argv[2];
const PASSWORD   = process.argv[3];

if (!EMAIL || !PASSWORD) {
  console.error("Usage: node push-groundskeeper-quiz.cjs <email> <password>");
  process.exit(1);
}

const questions = [
  { question: 'Šta provjeravaš prije upotrebe baštenske opreme?',                   options: ['Ništa', 'Ispravnost i sigurnost (kosilica, trimer)', 'Boju opreme'],                                    correct: 1 },
  { question: 'Šta provjeravaš na sistemu za zalijevanje?',                          options: ['Ništa', 'Ispravnost prskalica i raspored', 'Cijenu vode'],                                              correct: 1 },
  { question: 'Šta radiš sa opalim lišćem i smećem?',                               options: ['Ostavljaš', 'Uklanjaš sa terena', 'Sakupljaš za kasnije'],                                              correct: 1 },
  { question: 'Šta provjeravaš na biljkama?',                                        options: ['Ništa', 'Znakove bolesti ili štetočina', 'Boju listova samo'],                                          correct: 1 },
  { question: 'Šta radiš sa korovom u cvjetnim lijehama?',                          options: ['Ostavljaš', 'Uklanjaš', 'Presađuješ ga'],                                                               correct: 1 },
  { question: 'Šta provjeravaš na ukrasnim elementima (fontane, rasvjeta)?',        options: ['Ništa', 'Stanje i prijaviš kvarove', 'Boju elemenata'],                                                 correct: 1 },
  { question: 'Šta pripremaš prema sezonskom planu?',                               options: ['Ništa posebno', 'Sezonsko cvijeće/bilje za sadnju', 'Novi raspored smjena'],                            correct: 1 },
  { question: 'Šta provjeravaš na stazama za goste sa invaliditetom?',              options: ['Ništa', 'Bezbjednost i da nema prepreka', 'Boju staza'],                                               correct: 1 },
  { question: 'Šta pripremaš za posebne događaje u vrtu?',                          options: ['Ništa', 'Vanjski prostor (vjenčanja, banketi)', 'Meni za događaj'],                                    correct: 1 },
  { question: 'Gdje se skladišti baštenski alat i hemikalije?',                     options: ['Zajedno, bilo gdje', 'Odvojeno, organizovano i obilježeno', 'U kuhinji'],                               correct: 1 },
  { question: 'Šta radiš sa vanjskim pokućstvom (stolovi, stolice)?',               options: ['Ignorišeš', 'Provjeravaš i čistiš', 'Premještaš svaki dan'],                                           correct: 1 },
  { question: 'Šta radiš zimi vezano za snijeg/led?',                               options: ['Ništa', 'Uklanjaš sa staza i prilaza', 'Čekaš da se otopi'],                                           correct: 1 },
  { question: 'Šta provjeravaš na ogradama i kapijama?',                            options: ['Ništa', 'Stanje i ispravnost', 'Boju ograde'],                                                         correct: 1 },
  { question: 'Kome odgovaraš na pitanja gosta o vrtu?',                            options: ['Ignorišeš goste', 'Ljubazno i profesionalno', 'Šalješ ih menadžeru uvijek'],                           correct: 1 },
  { question: 'Šta radiš sa travnjakom prema rasporedu?',                           options: ['Ništa', 'Kosiš, posebno pažljivo oko ivica', 'Kosiš samo jednom mjesečno'],                            correct: 1 },
  { question: 'Šta provjeravaš na vanjskim kantama za otpad?',                      options: ['Ništa', 'Stanje, prikupljaš otpatke s terena', 'Boju kanti'],                                          correct: 1 },
  { question: 'Šta prihranjuješ prema sezonskom planu?',                            options: ['Ništa', 'Biljke i travnjak (gnojidba)', 'Samo cvijeće u žardinjerama'],                                correct: 1 },
  { question: 'Šta provjeravaš kao finalni korak prije kraja smjene?',              options: ['Ništa', 'Vizuelnu urednost cijelog terena', 'Cijenu alata'],                                           correct: 1 },
  { question: 'Kome prijavljuješ kvarove (irigacija, rasvjeta)?',                  options: ['Niko', 'Supervizoru/domaru', 'Gostu'],                                                                  correct: 1 },
  { question: 'Zašto je vremenska prognoza bitna za planiranje rada?',              options: ['Nije bitna', 'Određuje raspored vanjskih poslova (zalijevanje, košenje)', 'Radi razgovora s gostima'],  correct: 1 },
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
      { fieldFilter: { field: { fieldPath: "role" },   op: "EQUAL", value: { stringValue: "groundskeeper" } } },
      { fieldFilter: { field: { fieldPath: "source" }, op: "EQUAL", value: { stringValue: "seed" } } },
    ] } }, limit: 1 } },
    idToken
  );

  const payload = { fields: toFSFields({
    title: "Vrtlar — Osnovna pitanja",
    role: "groundskeeper",
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
    if (r.status === 200) console.log("  ✔ Updated groundskeeper quiz successfully");
    else { console.error("  ✗ Patch failed:", r.body); process.exit(1); }
  } else {
    console.log("  No existing doc found — creating…");
    const r = await post(fsBase, colPath, payload, idToken);
    if (r.status === 200) console.log("  ✔ Created groundskeeper quiz successfully");
    else { console.error("  ✗ Create failed:", r.body); process.exit(1); }
  }
}

main().catch(err => { console.error(err); process.exit(1); });
