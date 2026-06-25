const https = require("https");

const API_KEY    = "AIzaSyAbEVmo0BWoRZwAR9bv0Tyf0xP4dOEC1pU";
const PROJECT_ID = "horecaapp-e16cf";
const EMAIL      = process.argv[2];
const PASSWORD   = process.argv[3];

if (!EMAIL || !PASSWORD) {
  console.error("Usage: node push-executive-chef-quiz.cjs <email> <password>");
  process.exit(1);
}

const questions = [
  { question: 'Koja je glavna razlika između glavnog kuvara i kuvara?',       options: ['Nema razlike', 'Glavni kuvar upravlja cijelom kuhinjom i timom', 'Glavni kuvar samo kuha brže'],              correct: 1 },
  { question: 'Šta provjeravaš prvo na početku smjene?',                       options: ['Meni', 'Izvještaj prethodne smjene i HACCP logove', 'Cijene namirnica'],                                       correct: 1 },
  { question: 'Ko vodi jutarnji sastanak sa kuhinjskim timom?',                options: ['Konobar', 'Glavni kuvar', 'Menadžer restorana'],                                                               correct: 1 },
  { question: 'Šta je "food cost %"?',                                         options: ['Cijena jela za gosta', 'Trošak hrane u odnosu na prihod', 'Broj jela na meniju'],                             correct: 1 },
  { question: 'Šta provjeravaš na "pass-u" prije servisa?',                   options: ['Ništa', 'Prezentaciju jela (finalna kontrola kvaliteta)', 'Cijenu jela'],                                      correct: 1 },
  { question: 'Ko rješava konflikte unutar kuhinjskog tima?',                  options: ['Niko, sami se rješavaju', 'Glavni kuvar', 'Konobar'],                                                         correct: 1 },
  { question: 'Šta ažuriraš prema trenutnim troškovima sastojaka?',            options: ['Ništa', 'Recepture/portion control', 'Boju jela'],                                                            correct: 1 },
  { question: 'Ko obučava novo osoblje tokom smjene?',                         options: ['Niko', 'Glavni kuvar demonstrira tehnike', 'Servirka'],                                                        correct: 1 },
  { question: 'Šta provjeravaš vezano za alergensku deklaraciju?',             options: ['Ništa', 'Usklađenost menija sa deklaracijom', 'Cijenu alergena'],                                             correct: 1 },
  { question: 'Šta evaluiraš tokom smjene?',                                   options: ['Ništa', 'Učinak kuvara za buduće ocjenjivanje', 'Boju uniformi'],                                             correct: 1 },
  { question: 'Ko koordinira tempo kuhinje sa restoran menadžerom?',           options: ['Konobar', 'Glavni kuvar', 'Higijeničarka'],                                                                   correct: 1 },
  { question: 'Šta provjeravaš vezano za dostavu robe?',                       options: ['Ništa', 'Kvalitet, količinu i cijenu u odnosu na narudžbu', 'Boju ambalaže'],                                 correct: 1 },
  { question: 'Šta pripremaš za sljedeći dan?',                                options: ['Ništa', 'Plan rada i narudžbe na osnovu potrošnje', 'Novu uniformu'],                                         correct: 1 },
  { question: 'Šta predaješ menadžmentu na kraju smjene?',                    options: ['Ništa', 'Izvještaj o food cost-u i incidentima', 'Listu gostiju'],                                            correct: 1 },
  { question: 'Da li glavni kuvar kuha tokom servisa?',                        options: ['Da, primarno to radi', 'Ne, prvenstveno upravlja i kontroliše', 'Samo desert'],                               correct: 1 },
  { question: 'Šta provjeravaš vezano za veću opremu?',                        options: ['Ništa', 'Stanje hood sistema, walk-in, glavnih šporeta', 'Boju opreme'],                                     correct: 1 },
  { question: 'Ko provjerava da svi kuvari poštuju HACCP standarde?',          options: ['Niko', 'Glavni kuvar', 'Konobar'],                                                                            correct: 1 },
  { question: 'Šta pregledaš vezano za zahtjeve za narudžbu?',                options: ['Ništa', 'Zahtjeve za robu od dobavljača', 'Cijene konkurencije'],                                              correct: 1 },
  { question: 'Šta provjeravaš prije zatvaranja kuhinje?',                     options: ['Ništa', 'Čistoću i sigurnost (završni obilazak)', 'Boju podova'],                                             correct: 1 },
  { question: 'Zašto je bitno pokriti praznine u rasporedu osoblja?',          options: ['Nije bitno', 'Da se osigura nesmetan rad kuhinje', 'Radi statistike'],                                        correct: 1 },
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
      { fieldFilter: { field: { fieldPath: "role" },   op: "EQUAL", value: { stringValue: "executive_chef" } } },
      { fieldFilter: { field: { fieldPath: "source" }, op: "EQUAL", value: { stringValue: "seed" } } },
    ] } }, limit: 1 } },
    idToken
  );

  const payload = { fields: toFSFields({
    title: "Glavni kuvar — Osnovna pitanja",
    role: "executive_chef",
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
    if (r.status === 200) console.log("  ✔ Updated executive_chef quiz successfully");
    else { console.error("  ✗ Patch failed:", r.body); process.exit(1); }
  } else {
    console.log("  No existing doc found — creating…");
    const r = await post(fsBase, colPath, payload, idToken);
    if (r.status === 200) console.log("  ✔ Created executive_chef quiz successfully");
    else { console.error("  ✗ Create failed:", r.body); process.exit(1); }
  }
}

main().catch(err => { console.error(err); process.exit(1); });
