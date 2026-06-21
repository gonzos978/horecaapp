/**
 * Writes hotel_manager quiz to Firestore using REST API (no service account needed).
 * Signs in via Firebase Auth REST API, then writes via Firestore REST API.
 *
 * Run: node functions/push-hotel-manager-quiz.cjs <email> <password>
 * Example: node functions/push-hotel-manager-quiz.cjs horecaapp2025@gmail.com MyPassword
 */

const https = require("https");

const API_KEY     = "AIzaSyAbEVmo0BWoRZwAR9bv0Tyf0xP4dOEC1pU";
const PROJECT_ID  = "horecaapp-e16cf";
const EMAIL       = process.argv[2];
const PASSWORD    = process.argv[3];

if (!EMAIL || !PASSWORD) {
  console.error("Usage: node push-hotel-manager-quiz.cjs <email> <password>");
  process.exit(1);
}

// ── questions ──────────────────────────────────────────────────────────────
const questions = [
  { question: 'Šta je RevPAR?',                                                      options: ['Vrsta sobe', 'Prihod po dostupnoj sobi (Revenue Per Available Room)', 'Vrsta ugovora'],                 correct: 1 },
  { question: 'Šta je ADR?',                                                          options: ['Vrsta ugovora', 'Prosječna dnevna cijena sobe (Average Daily Rate)', 'Vrsta sobe'],                      correct: 1 },
  { question: 'Šta znači "rate parity"?',                                             options: ['Različite cijene na svakom kanalu', 'Usklađene cijene na svim OTA kanalima', 'Najniža moguća cijena'],  correct: 1 },
  { question: 'Šta provjeravaš u channel manageru?',                                  options: ['Ništa', 'Dostupnost soba radi sprečavanja overbookinga', 'Boju sobe'],                                  correct: 1 },
  { question: 'Šta je GOP?',                                                          options: ['Vrsta sobe', 'Gross Operating Profit (bruto operativni profit)', 'Vrsta ugovora'],                       correct: 1 },
  { question: 'Šta provjeravaš prvo na početku smjene?',                              options: ['Cijene konkurencije', 'Izvještaj prethodne smjene', 'Meni restorana'],                                  correct: 1 },
  { question: 'Ko koordinira sa housekeeping menadžerom?',                            options: ['Konobar', 'Menadžer hotela', 'Šanker'],                                                                 correct: 1 },
  { question: 'Šta provjeravaš vezano za online recenzije?',                          options: ['Ignorišeš ih', 'Pregledaš i odgovaraš na njih', 'Brišeš negativne'],                                   correct: 1 },
  { question: 'Šta je "no-show"?',                                                    options: ['Gost koji dođe rano', 'Gost koji ne stigne na rezervaciju', 'Gost koji otkaže unaprijed'],              correct: 1 },
  { question: 'Šta provjeravaš vezano za sigurnosne procedure?',                      options: ['Ništa', 'Vatrodojavu i izlaze u slučaju opasnosti', 'Cijenu parkinga'],                                 correct: 1 },
  { question: 'Šta analiziraš vezano za F&B odjel?',                                 options: ['Samo cijene menija', 'Food cost % i labor cost %', 'Boju stolnjaka'],                                  correct: 1 },
  { question: 'Ko odobrava zahtjeve za nabavku iznad standardnog limita?',            options: ['Bilo koji radnik', 'Menadžer hotela', 'Konobar'],                                                       correct: 1 },
  { question: 'Šta provjeravaš vezano za lokalne zakone?',                            options: ['Ništa', 'Turističku taksu i prijavu gostiju', 'Cijenu parkinga'],                                       correct: 1 },
  { question: 'Šta predaješ vlasniku na kraju smjene?',                               options: ['Ništa', 'Dnevni izvještaj o prihodu i operativnim problemima', 'Listu gostiju'],                        correct: 1 },
  { question: 'Ko rješava reklamacije gostiju koje recepcija ne može sama riješiti?', options: ['Niko', 'Menadžer hotela', 'Domar'],                                                                     correct: 1 },
  { question: 'Šta provjeravaš na sigurnosnim kamerama?',                             options: ['Ništa', 'Evidencije pristupa za neobične aktivnosti', 'Boju snimka'],                                  correct: 1 },
  { question: 'Šta je "flow-through %"?',                                             options: ['Vrsta rezervacije', 'Mjera koliko dodatnog prihoda postaje profit', 'Brzina check-ina'],               correct: 1 },
  { question: 'Zašto se provjerava raspored osoblja za sljedećih 7 dana?',            options: ['Nije bitno', 'Da se popune praznine u smjenama', 'Radi statistike'],                                   correct: 1 },
  { question: 'Šta provjeravaš prije dolaska VIP gosta?',                             options: ['Ništa posebno', 'Posebne zahtjeve i preferencije', 'Cijenu sobe'],                                     correct: 1 },
  { question: 'Šta predaješ sljedećem menadžeru na kraju smjene?',                   options: ['Ništa', 'Smjenski log sa otvorenim pitanjima', 'Ključeve sefa'],                                       correct: 1 },
];

// ── helpers ────────────────────────────────────────────────────────────────
function post(hostname, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const headers = { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const req = https.request({ hostname, path, method: "POST", headers }, res => {
      let raw = "";
      res.on("data", c => raw += c);
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function patch(hostname, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const headers = {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(data),
      "Authorization": `Bearer ${token}`,
    };
    const req = https.request({ hostname, path, method: "PATCH", headers }, res => {
      let raw = "";
      res.on("data", c => raw += c);
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function get(hostname, path, token) {
  return new Promise((resolve, reject) => {
    const headers = { "Authorization": `Bearer ${token}` };
    https.get({ hostname, path, headers }, res => {
      let raw = "";
      res.on("data", c => raw += c);
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    }).on("error", reject);
  });
}

// Convert JS value to Firestore REST value
function toFSValue(v) {
  if (v === null)              return { nullValue: null };
  if (typeof v === "boolean")  return { booleanValue: v };
  if (typeof v === "number")   return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === "string")   return { stringValue: v };
  if (Array.isArray(v))        return { arrayValue: { values: v.map(toFSValue) } };
  if (typeof v === "object")   return { mapValue: { fields: toFSFields(v) } };
}
function toFSFields(obj) {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, toFSValue(v)]));
}

// ── main ───────────────────────────────────────────────────────────────────
async function main() {
  // 1. Sign in
  console.log(`Signing in as ${EMAIL}…`);
  const authRes = await post("identitytoolkit.googleapis.com",
    `/v1/accounts:signInWithPassword?key=${API_KEY}`,
    { email: EMAIL, password: PASSWORD, returnSecureToken: true }
  );

  if (authRes.status !== 200) {
    console.error("Auth failed:", authRes.body?.error?.message ?? authRes.body);
    process.exit(1);
  }
  const idToken = authRes.body.idToken;
  console.log("  ✔ Signed in");

  // 2. Check for existing hotel_manager quiz
  const fsBase = "firestore.googleapis.com";
  const colPath = `/v1/projects/${PROJECT_ID}/databases/(default)/documents/quizzes`;

  // Run a structured query to find existing doc
  const queryBody = {
    structuredQuery: {
      from: [{ collectionId: "quizzes" }],
      where: {
        compositeFilter: {
          op: "AND",
          filters: [
            { fieldFilter: { field: { fieldPath: "role" },   op: "EQUAL", value: { stringValue: "hotel_manager" } } },
            { fieldFilter: { field: { fieldPath: "source" }, op: "EQUAL", value: { stringValue: "seed" } } },
          ],
        },
      },
      limit: 1,
    },
  };

  const queryRes = await post(fsBase,
    `/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`,
    queryBody, idToken
  );

  const payload = {
    fields: toFSFields({
      title: "Menadžer hotela — Osnovna pitanja",
      role: "hotel_manager",
      timePerQuestion: 60,
      totalTime: 60 * questions.length,
      questions,
      createdBy: "system",
      source: "seed",
    }),
  };

  const existing = queryRes.body?.[0]?.document;

  if (existing) {
    // 3a. Update existing doc
    const docPath = existing.name; // full resource path
    const shortPath = docPath.replace(`projects/${PROJECT_ID}/databases/(default)/documents/`, "");
    console.log(`  Found existing doc: ${shortPath} — updating…`);
    const patchRes = await patch(fsBase, `/v1/${docPath}`, payload, idToken);
    if (patchRes.status === 200) {
      console.log("  ✔ Updated hotel_manager quiz successfully");
    } else {
      console.error("  ✗ Patch failed:", patchRes.body);
      process.exit(1);
    }
  } else {
    // 3b. Create new doc
    console.log("  No existing doc found — creating…");
    const createRes = await post(fsBase, colPath, payload, idToken);
    if (createRes.status === 200) {
      console.log("  ✔ Created hotel_manager quiz successfully");
    } else {
      console.error("  ✗ Create failed:", createRes.body);
      process.exit(1);
    }
  }
}

main().catch(err => { console.error(err); process.exit(1); });
