const https = require("https");

const API_KEY    = "AIzaSyAbEVmo0BWoRZwAR9bv0Tyf0xP4dOEC1pU";
const PROJECT_ID = "horecaapp-e16cf";
const EMAIL      = process.argv[2];
const PASSWORD   = process.argv[3];

if (!EMAIL || !PASSWORD) {
  console.error("Usage: node push-restaurant-manager-quiz.cjs <email> <password>");
  process.exit(1);
}

const questions = [
  { question: 'Šta provjeravaš prvo na početku smjene?',                              options: ['Meni', 'Izvještaj prethodne smjene', 'Cijene konkurencije'],                           correct: 1 },
  { question: 'Šta je "food cost %"?',                                                 options: ['Cijena jela za gosta', 'Trošak hrane u odnosu na prihod', 'Broj jela na meniju'],     correct: 1 },
  { question: 'Šta je "pour cost"?',                                                   options: ['Cijena koktela za gosta', 'Trošak alkohola u odnosu na prodaju', 'Broj flaša na šanku'], correct: 1 },
  { question: 'Ko dodjeljuje sekcije konobarima?',                                    options: ['Sami se dogovaraju', 'Menadžer restorana', 'Kuvar'],                                   correct: 1 },
  { question: 'Šta provjeravaš sa glavnim kuvarom prije otvaranja?',                  options: ['Ništa', 'Temperaturne logove kuhinje', 'Boju posuđa'],                                 correct: 1 },
  { question: 'Šta je "86-lista"?',                                                    options: ['Lista popularnih jela', 'Lista nedostupnih artikala', 'Lista gostiju'],                correct: 1 },
  { question: 'Ko lično rješava reklamacije koje konobar ne može sam?',               options: ['Niko', 'Menadžer restorana', 'Servirka'],                                              correct: 1 },
  { question: 'Šta provjeravaš vezano za alkohol?',                                   options: ['Ništa', 'Usklađenost sa zakonom o odgovornom posluživanju', 'Cijenu pića'],            correct: 1 },
  { question: 'Šta radiš kod konflikta među osobljem?',                               options: ['Ignorišeš', 'Diskretno rješavaš bez ometanja servisa', 'Odmah otpustiš radnika'],      correct: 1 },
  { question: 'Šta provjeravaš na kraju smjene vezano za kasu?',                      options: ['Ništa', 'Uporediš sa POS izvještajem', 'Boju novčanica'],                             correct: 1 },
  { question: 'Ko vodi pre-shift sastanak sa osobljem?',                              options: ['Konobar', 'Menadžer restorana', 'Higijeničarka'],                                     correct: 1 },
  { question: 'Šta provjeravaš vezano za dostavljenu robu?',                          options: ['Ništa', 'Uporediš sa narudžbom i fakturom', 'Boju ambalaže'],                         correct: 1 },
  { question: 'Šta nadgledaš tokom smjene?',                                          options: ['Samo kuhinju', 'Kvalitet usluge i interakciju osoblja sa gostima', 'Samo kasu'],       correct: 1 },
  { question: 'Šta pripremaš za sljedeći dan?',                                       options: ['Ništa', 'Narudžbu na osnovu dnevne potrošnje', 'Novi meni'],                           correct: 1 },
  { question: 'Šta osiguravaš prije zatvaranja?',                                     options: ['Ništa posebno', 'Alkohol, vrijedne stavke i sve izlaze', 'Samo glavna vrata'],         correct: 1 },
  { question: 'Šta predaješ vlasniku/GM-u?',                                          options: ['Ništa', 'Dnevni izvještaj o prihodu i incidentima', 'Listu zaposlenih'],               correct: 1 },
  { question: 'Šta provjeravaš vezano za higijenu osoblja?',                          options: ['Ništa', 'Poštovanje standarda higijene i uniforme', 'Frizuru osoblja'],                correct: 1 },
  { question: 'Šta provjeravaš prije otvaranja restorana?',                           options: ['Samo meni', 'Da je mise en place kompletan na svim stanicama', 'Cijenu konkurencije'], correct: 1 },
  { question: 'Ko odobrava popuste i korekcije računa?',                              options: ['Bilo koji konobar', 'Menadžer restorana', 'Gost sam odlučuje'],                        correct: 1 },
  { question: 'Zašto se provjerava brzina izlaska jela iz kuhinje?',                 options: ['Nije bitno', 'Da se osigura kvalitet usluge tokom vršnog opterećenja', 'Radi statistike kuvara'], correct: 1 },
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
      { fieldFilter: { field: { fieldPath: "role" },   op: "EQUAL", value: { stringValue: "restaurant_manager" } } },
      { fieldFilter: { field: { fieldPath: "source" }, op: "EQUAL", value: { stringValue: "seed" } } },
    ] } }, limit: 1 } },
    idToken
  );

  const payload = { fields: toFSFields({
    title: "Menadžer restorana — Osnovna pitanja",
    role: "restaurant_manager",
    timePerQuestion: 60,
    totalTime: 60 * questions.length,
    questions,
    createdBy: "system",
    source: "seed",
  }) };

  const existing = queryRes.body?.[0]?.document;
  if (existing) {
    const docPath = existing.name;
    console.log(`  Found existing doc — updating…`);
    const r = await patch(fsBase, `/v1/${docPath}`, payload, idToken);
    if (r.status === 200) console.log("  ✔ Updated restaurant_manager quiz successfully");
    else { console.error("  ✗ Patch failed:", r.body); process.exit(1); }
  } else {
    console.log("  No existing doc found — creating…");
    const r = await post(fsBase, colPath, payload, idToken);
    if (r.status === 200) console.log("  ✔ Created restaurant_manager quiz successfully");
    else { console.error("  ✗ Create failed:", r.body); process.exit(1); }
  }
}

main().catch(err => { console.error(err); process.exit(1); });
