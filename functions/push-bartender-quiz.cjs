const https = require("https");

const API_KEY    = "AIzaSyAbEVmo0BWoRZwAR9bv0Tyf0xP4dOEC1pU";
const PROJECT_ID = "horecaapp-e16cf";
const EMAIL      = process.argv[2];
const PASSWORD   = process.argv[3];

if (!EMAIL || !PASSWORD) {
  console.error("Usage: node push-bartender-quiz.cjs <email> <password>");
  process.exit(1);
}

const questions = [
  { question: 'Šta šanker prvo provjerava na početku smjene?',                      options: ['Garnirung', 'Ključeve bara i sigurnost prostora', 'Cijene pića'],                                          correct: 1 },
  { question: 'Šta je "jigger"?',                                                   options: ['Vrsta čaše', 'Alat za mjerenje pour cost-a', 'Vrsta koktela'],                                             correct: 1 },
  { question: 'Zašto se provjerava POS sistem prije otvaranja?',                    options: ['Nije bitno', 'Da se osigura tačna evidencija pića', 'Radi izgleda'],                                       correct: 1 },
  { question: 'Šta znači FIFO kod rotacije zalihe alkohola?',                       options: ['Prvo ušlo, prvo izašlo', 'Najjeftinije prvo', 'Najjače prvo'],                                             correct: 0 },
  { question: 'Kada se provjerava identifikacija gosta?',                            options: ['Nikad', 'Kad postoji sumnja u punoljetnost', 'Samo vikendom'],                                             correct: 1 },
  { question: 'Šta radiš ako gost pokazuje znakove prekomjerne konzumacije?',       options: ['Ignorišeš', 'Pratiš ponašanje i reaguješ odgovorno', 'Serviraš još jedno piće'],                           correct: 1 },
  { question: 'Da li se piće evidentira u POS odmah po pripremi?',                 options: ['Ne, na kraju smjene', 'Da, odmah, bez izuzetka', 'Samo ako gost traži račun'],                             correct: 1 },
  { question: 'Šta provjeravaš na pivu na točenju?',                                options: ['Samo ukus', 'Pritisak, temperaturu, čistoću creva', 'Boju piva'],                                          correct: 1 },
  { question: 'Zašto se broji gotovina na početku i kraju smjene?',                options: ['Nije potrebno', 'Za tačnu finansijsku evidenciju', 'Radi navike'],                                          correct: 1 },
  { question: 'Šta je "pour cost"?',                                                options: ['Cijena čaše', 'Trošak alkohola u odnosu na prodaju', 'Broj flaša'],                                        correct: 1 },
  { question: 'Da li se sokovi cijede unaprijed i obilježavaju datumom?',           options: ['Da', 'Ne, koriste se odmah bez obilježavanja', 'Samo za koktele'],                                         correct: 0 },
  { question: 'Šta provjeravaš kod vina prije serviranja?',                         options: ['Boju samo', 'Odgovarajuću temperaturu', 'Cijenu'],                                                         correct: 1 },
  { question: 'Ko zaključava alkoholne zalihe na kraju smjene?',                    options: ['Niko', 'Šanker', 'Konobar'],                                                                               correct: 1 },
  { question: 'Šta radiš sa prljavim čašama tokom smjene?',                        options: ['Ostavljaš na šanku', 'Šalješ na pranje na vrijeme', 'Koristiš ih ponovo'],                                 correct: 1 },
  { question: 'Zašto se provjerava rok trajanja flaša?',                            options: ['Estetski razlog', 'Kvalitet i sigurnost pića', 'Nije bitno'],                                              correct: 1 },
  { question: 'Šta je "odgovorno posluživanje alkohola"?',                          options: ['Servirati bilo kome', 'Provjera dobi i prepoznavanje znakova prekomjerne konzumacije', 'Naplata unaprijed'], correct: 1 },
  { question: 'Da li se šank čisti samo na kraju smjene?',                          options: ['Da', 'Ne, tokom cijele smjene (clean-as-you-go)', 'Samo ujutro'],                                          correct: 1 },
  { question: 'Šta predaješ menadžeru na kraju smjene?',                            options: ['Ništa', 'Izvještaj o utrošku i nepravilnostima', 'Ključeve gosta'],                                        correct: 1 },
  { question: 'Šta provjeravaš na rashladnim vitrinama?',                           options: ['Boju', 'Temperaturu', 'Cijenu sadržaja'],                                                                  correct: 1 },
  { question: 'Zašto je bitno poštovati standardnu recepturu pri serviranju?',      options: ['Nije bitno', 'Kontrola pour cost-a i konzistentnost', 'Radi brzine serviranja'],                           correct: 1 },
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
      { fieldFilter: { field: { fieldPath: "role" },   op: "EQUAL", value: { stringValue: "bartender" } } },
      { fieldFilter: { field: { fieldPath: "source" }, op: "EQUAL", value: { stringValue: "seed" } } },
    ] } }, limit: 1 } },
    idToken
  );

  const payload = { fields: toFSFields({
    title: "Šanker — Osnovna pitanja",
    role: "bartender",
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
    if (r.status === 200) console.log("  ✔ Updated bartender quiz successfully");
    else { console.error("  ✗ Patch failed:", r.body); process.exit(1); }
  } else {
    console.log("  No existing doc found — creating…");
    const r = await post(fsBase, colPath, payload, idToken);
    if (r.status === 200) console.log("  ✔ Created bartender quiz successfully");
    else { console.error("  ✗ Create failed:", r.body); process.exit(1); }
  }
}

main().catch(err => { console.error(err); process.exit(1); });
