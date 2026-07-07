const https = require("https");

const API_KEY    = "AIzaSyAbEVmo0BWoRZwAR9bv0Tyf0xP4dOEC1pU";
const PROJECT_ID = "horecaapp-e16cf";
const EMAIL      = process.argv[2];
const PASSWORD   = process.argv[3];

if (!EMAIL || !PASSWORD) {
  console.error("Usage: node push-cleaner-quiz.cjs <email> <password>");
  process.exit(1);
}

const questions = [
  { question: 'Šta nosiš prije rada sa hemikalijama?',                               options: ['Ništa posebno', 'Zaštitnu opremu (rukavice)', 'Samo masku'],                                            correct: 1 },
  { question: 'Šta postavljaš prije mokrog čišćenja?',                               options: ['Ništa', '"Mokar pod" znakove', 'Stolice na sto'],                                                        correct: 1 },
  { question: 'Kojim redom čistiš toalete?',                                         options: ['Nasumično', 'Od najprljavijih ka najčistijim površinama', 'Od najčistijih ka najprljavijim'],            correct: 1 },
  { question: 'Šta dopunjavaš u toaletima?',                                         options: ['Ništa', 'Sapun, papir, peškiri, osvježivač', 'Samo papir'],                                             correct: 1 },
  { question: 'Šta koristiš za uklanjanje masnih naslaga sa podova kuhinje?',       options: ['Običnu vodu', 'Degreaser', 'Samo krpu'],                                                                 correct: 1 },
  { question: 'Šta provjeravaš na slivnicima?',                                      options: ['Ništa', 'Naslage i neprijatne mirise', 'Boju slivnika'],                                                 correct: 1 },
  { question: 'Šta čistiš na visokim dodirnim tačkama?',                             options: ['Ništa posebno', 'Kvake, prekidače, rukohvate', 'Samo prozore'],                                         correct: 1 },
  { question: 'Šta radiš ako primijetiš znakove štetočina?',                        options: ['Ignorišeš', 'Prijaviš odmah', 'Sam rješavaš problem'],                                                   correct: 1 },
  { question: 'Šta provjeravaš na sredstvima za čišćenje prije upotrebe?',          options: ['Ništa', 'Rokove trajanja', 'Boju ambalaže'],                                                             correct: 1 },
  { question: 'Gdje se odlažu hemikalije za čišćenje?',                              options: ['Bilo gdje', 'U organizovano, obilježeno skladište', 'U kuhinju'],                                        correct: 1 },
  { question: 'Šta provjeravaš na rasvjeti tokom smjene?',                           options: ['Ništa', 'Pregorjele sijalice, prijaviš ih', 'Boju svjetla'],                                            correct: 1 },
  { question: 'Da li se kuhinjske radne površine čiste samo van servisa?',           options: ['Ne, bilo kada', 'Da, prema rasporedu sa kuhinjskim timom', 'Samo ujutro'],                              correct: 1 },
  { question: 'Šta predaješ supervizoru na kraju smjene?',                           options: ['Ništa', 'Izvještaj o obavljenim zadacima', 'Ključeve skladišta'],                                       correct: 1 },
  { question: 'Šta provjeravaš vezano za kante za otpad?',                           options: ['Ništa', 'Dezinfekciju i pravovremeno pražnjenje', 'Boju kanti'],                                        correct: 1 },
  { question: 'Šta radiš ako primijetiš kvar (curenje, oštećenje)?',                options: ['Ignorišeš', 'Prijaviš nadređenom', 'Sam popravljaš'],                                                   correct: 1 },
  { question: 'Šta je finalni korak prije kraja smjene?',                            options: ['Ništa posebno', 'Provjera opšte urednosti prostora', 'Gašenje svih svjetala'],                         correct: 1 },
  { question: 'Šta čistiš na staklenim površinama?',                                 options: ['Ostavljaš mrlje', 'Čistiš bez mrlja i tragova', 'Samo spolja'],                                         correct: 1 },
  { question: 'Gdje se vraća oprema za čišćenje na kraju smjene?',                  options: ['Bilo gdje', 'Na određeno mjesto', 'Ostaviš je gdje si zadnje koristio'],                               correct: 1 },
  { question: 'Šta pomažeš u čišćenju prema sedmičnom planu?',                      options: ['Ništa', 'Dubinsko čišćenje opreme (hood, walk-in)', 'Samo prozore'],                                   correct: 1 },
  { question: 'Zašto je redoslijed čišćenja (od čistog ka prljavom ili obrnuto) bitan?', options: ['Nije bitan', 'Sprečava širenje nečistoće i kontaminacije', 'Radi brzine'],                         correct: 1 },
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
      { fieldFilter: { field: { fieldPath: "role" },   op: "EQUAL", value: { stringValue: "cleaner" } } },
      { fieldFilter: { field: { fieldPath: "source" }, op: "EQUAL", value: { stringValue: "seed" } } },
    ] } }, limit: 1 } },
    idToken
  );

  const payload = { fields: toFSFields({
    title: "Higijeničarka — Osnovna pitanja",
    role: "cleaner",
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
    if (r.status === 200) console.log("  ✔ Updated cleaner quiz successfully");
    else { console.error("  ✗ Patch failed:", r.body); process.exit(1); }
  } else {
    console.log("  No existing doc found — creating…");
    const r = await post(fsBase, colPath, payload, idToken);
    if (r.status === 200) console.log("  ✔ Created cleaner quiz successfully");
    else { console.error("  ✗ Create failed:", r.body); process.exit(1); }
  }
}

main().catch(err => { console.error(err); process.exit(1); });
