const https = require("https");

const API_KEY    = "AIzaSyAbEVmo0BWoRZwAR9bv0Tyf0xP4dOEC1pU";
const PROJECT_ID = "horecaapp-e16cf";
const EMAIL      = process.argv[2];
const PASSWORD   = process.argv[3];

if (!EMAIL || !PASSWORD) {
  console.error("Usage: node push-mixologist-quiz.cjs <email> <password>");
  process.exit(1);
}

const questions = [
  { question: 'Koja je glavna razlika između koktel majstora i šankera?',          options: ['Nema razlike', 'Koktel majstor razvija recepture i kreira signature ponudu', 'Koktel majstor radi samo noću'], correct: 1 },
  { question: 'Šta provjeravaš na specijalnim sastojcima?',                         options: ['Ništa', 'Zalihu i kvalitet (bittersi, sirupi, infuzije)', 'Cijenu samo'],                                    correct: 1 },
  { question: 'Šta pripremaš i obilježavaš datumom?',                               options: ['Ništa', 'Svježe infuzije, sirupe i tinkture', 'Samo flaše alkohola'],                                       correct: 1 },
  { question: 'Šta je "mixing glass"?',                                             options: ['Vrsta čaše za serviranje', 'Specijalizovani alat za pripremu koktela', 'Vrsta koktela'],                    correct: 1 },
  { question: 'Šta radiš prije otvaranja vezano za signature koktel?',              options: ['Ništa', 'Degustiraš i kalibrišeš recepturu', 'Mijenjaš cijenu'],                                            correct: 1 },
  { question: 'Šta pratiš vezano za prodaju koktela?',                              options: ['Ništa', 'Koji se najviše/najmanje traži (podaci za meni)', 'Boju koktela'],                                 correct: 1 },
  { question: 'Šta predstavljaš gostu kod signature koktela?',                      options: ['Samo cijenu', 'Priču/koncept iza koktela', 'Recepturu u potpunosti'],                                       correct: 1 },
  { question: 'Šta provjeravaš kod gosta prije serviranja alkohola?',               options: ['Ništa', 'Identifikacioni dokument ako postoji sumnja', 'Broj telefona'],                                    correct: 1 },
  { question: 'Šta pratiš vezano za premium sastojke?',                             options: ['Ništa', 'Pour cost (utrošak u odnosu na prodaju)', 'Boju ambalaže'],                                        correct: 1 },
  { question: 'Šta radiš tokom slobodnog vremena u smjeni?',                        options: ['Ništa', 'Razvijaš/testiraš nove recepte za sezonsku ponudu', 'Čekaš kraj smjene'],                         correct: 1 },
  { question: 'Šta provjeravaš na garnirung elementima?',                           options: ['Ništa', 'Zalihu i svježinu (cvijeće, dehidrirano voće)', 'Samo cijenu'],                                   correct: 1 },
  { question: 'Da li koktel majstor prilagođava piće ukusu gosta?',                options: ['Ne, samo standardna receptura', 'Da, kreira/prilagođava na zahtjev', 'Samo ako je VIP gost'],               correct: 1 },
  { question: 'Šta evidentiraš odmah po pripremi koktela?',                         options: ['Ništa', 'Unos u POS sistem', 'Samo na kraju smjene'],                                                       correct: 1 },
  { question: 'Šta provjeravaš prije serviranja svakog koktela?',                  options: ['Ništa', 'Prezentaciju (finalna kontrola)', 'Cijenu'],                                                        correct: 1 },
  { question: 'Komu komuniciraš dnevnu ponudu pića?',                               options: ['Niko', 'Osoblju šanka i konobarima', 'Samo menadžeru'],                                                    correct: 1 },
  { question: 'Šta radiš sa otvorenim specijalnim flašama na kraju smjene?',       options: ['Ostavljaš ih otvorene', 'Pravilno skladištiš', 'Bacaš ih'],                                                 correct: 1 },
  { question: 'Šta predlažeš menadžeru bara?',                                      options: ['Ništa', 'Prijedloge za meni na osnovu utroška', 'Nove cijene konkurencije'],                                correct: 1 },
  { question: 'Da li koktel majstor mora poznavati glavne porodice alkohola?',      options: ['Ne, nije bitno', 'Da', 'Samo viski'],                                                                       correct: 1 },
  { question: 'Šta provjeravaš na batch-pripremljenim koktelima?',                 options: ['Ništa', 'Svježinu i pravilno doziranje sastojaka', 'Boju samo'],                                            correct: 1 },
  { question: 'Zašto je precizna kontrola mjera bitna kod serviranja?',             options: ['Nije bitna', 'Kontrola pour cost-a i konzistentnost ukusa', 'Radi brzine'],                                correct: 1 },
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
      { fieldFilter: { field: { fieldPath: "role" },   op: "EQUAL", value: { stringValue: "mixologist" } } },
      { fieldFilter: { field: { fieldPath: "source" }, op: "EQUAL", value: { stringValue: "seed" } } },
    ] } }, limit: 1 } },
    idToken
  );

  const payload = { fields: toFSFields({
    title: "Koktel majstor — Osnovna pitanja",
    role: "mixologist",
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
    if (r.status === 200) console.log("  ✔ Updated mixologist quiz successfully");
    else { console.error("  ✗ Patch failed:", r.body); process.exit(1); }
  } else {
    console.log("  No existing doc found — creating…");
    const r = await post(fsBase, colPath, payload, idToken);
    if (r.status === 200) console.log("  ✔ Created mixologist quiz successfully");
    else { console.error("  ✗ Create failed:", r.body); process.exit(1); }
  }
}

main().catch(err => { console.error(err); process.exit(1); });
