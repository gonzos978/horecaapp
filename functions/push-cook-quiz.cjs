const https = require("https");

const API_KEY    = "AIzaSyAbEVmo0BWoRZwAR9bv0Tyf0xP4dOEC1pU";
const PROJECT_ID = "horecaapp-e16cf";
const EMAIL      = process.argv[2];
const PASSWORD   = process.argv[3];

if (!EMAIL || !PASSWORD) {
  console.error("Usage: node push-cook-quiz.cjs <email> <password>");
  process.exit(1);
}

const questions = [
  { question: 'Na kojoj temperaturi mora biti frižider?',                           options: ['Ispod 4°C', 'Ispod 10°C', 'Ispod 0°C'],                                              correct: 0 },
  { question: 'Na kojoj temperaturi mora biti zamrzivač?',                           options: ['Ispod -5°C', 'Ispod -18°C', 'Ispod -10°C'],                                          correct: 1 },
  { question: 'Šta znači FIFO?',                                                     options: ['First In, First Out', 'Food In, Food Out', 'Fast In, Fast Out'],                      correct: 0 },
  { question: 'Da li se sirovo meso i povrće mogu sjeći na istoj dasci?',           options: ['Da', 'Ne', 'Samo ako se opere između'],                                               correct: 1 },
  { question: 'Šta radiš prvo kad uđeš u kuhinju?',                                 options: ['Pripremaš hranu', 'Opereš ruke', 'Provjeriš meni'],                                   correct: 1 },
  { question: 'Koliko dugo treba prati ruke prema standardu?',                       options: ['5 sekundi', 'Minimalno 20 sekundi', '1 minutu'],                                      correct: 1 },
  { question: 'Šta označava "danger zone" za temperaturu hrane?',                   options: ['Zona između 4°C i 60°C', 'Zona ispod 0°C', 'Zona iznad 100°C'],                       correct: 0 },
  { question: 'Ko provjerava temperaturu jela prije serviranja?',                    options: ['Konobar', 'Kuvar', 'Gost'],                                                           correct: 1 },
  { question: 'Šta treba uraditi sa namirnicom čiji je rok istekao?',               options: ['Koristiti je odmah', 'Ukloniti je', 'Sakriti je u zamrzivač'],                        correct: 1 },
  { question: 'Zašto se obilježavaju sosovi datumom?',                               options: ['Estetski razlog', 'Za FIFO praćenje i sigurnost hrane', 'Nije potrebno'],             correct: 1 },
  { question: 'Šta je "mise en place"?',                                             options: ['Čišćenje kuhinje', 'Priprema sastojaka prije servisa', 'Pranje posuđa'],              correct: 1 },
  { question: 'Koja je svrha HACCP loga?',                                           options: ['Dokumentovanje temperatura i sigurnosti hrane', 'Praćenje plata', 'Raspored smjena'], correct: 0 },
  { question: 'Da li se kvar opreme prijavljuje na kraju smjene?',                  options: ['Da', 'Ne, odmah', 'Nikad se ne prijavljuje'],                                         correct: 1 },
  { question: 'Šta provjeravaš kod dnevnih specijala vezano za goste?',             options: ['Boju jela', 'Alergene', 'Cijenu'],                                                    correct: 1 },
  { question: 'Šta znači "clean-as-you-go"?',                                       options: ['Čistiti samo na kraju smjene', 'Čistiti tokom rada, ne čekati kraj', 'Čistiti samo prije otvaranja'], correct: 1 },
  { question: 'Gdje se odlažu organski otpaci ako je propisano?',                   options: ['Sa ostalim otpadom', 'Odvojeno', 'U frižider'],                                       correct: 1 },
  { question: 'Šta se provjerava prije skladištenja viška hrane?',                  options: ['Boja', 'Temperatura', 'Miris samo'],                                                  correct: 1 },
  { question: 'Ko predaje smjenski izvještaj na kraju rada?',                        options: ['Menadžer', 'Kuvar koji završava smjenu', 'Konobar'],                                  correct: 1 },
  { question: 'Zašto se razdvaja sirovo meso od povrća?',                           options: ['Estetski razlog', 'Sprečavanje kontaminacije', 'Nije bitno zašto'],                   correct: 1 },
  { question: 'Šta radiš ako primijetiš da je oprema neispravna tokom servisa?',   options: ['Ignorišeš do kraja smjene', 'Prijaviš menadžeru odmah', 'Sam je popravljaš'],         correct: 1 },
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
      { fieldFilter: { field: { fieldPath: "role" },   op: "EQUAL", value: { stringValue: "cook" } } },
      { fieldFilter: { field: { fieldPath: "source" }, op: "EQUAL", value: { stringValue: "seed" } } },
    ] } }, limit: 1 } },
    idToken
  );

  const payload = { fields: toFSFields({
    title: "Kuvar — Osnovna pitanja",
    role: "cook",
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
    if (r.status === 200) console.log("  ✔ Updated cook quiz successfully");
    else { console.error("  ✗ Patch failed:", r.body); process.exit(1); }
  } else {
    console.log("  No existing doc found — creating…");
    const r = await post(fsBase, colPath, payload, idToken);
    if (r.status === 200) console.log("  ✔ Created cook quiz successfully");
    else { console.error("  ✗ Create failed:", r.body); process.exit(1); }
  }
}

main().catch(err => { console.error(err); process.exit(1); });
