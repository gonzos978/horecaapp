const https = require("https");

const API_KEY    = "AIzaSyAbEVmo0BWoRZwAR9bv0Tyf0xP4dOEC1pU";
const PROJECT_ID = "horecaapp-e16cf";
const EMAIL      = process.argv[2];
const PASSWORD   = process.argv[3];

if (!EMAIL || !PASSWORD) {
  console.error("Usage: node push-housekeeper-quiz.cjs <email> <password>");
  process.exit(1);
}

const questions = [
  { question: 'Šta radiš prije ulaska u sobu?',                                     options: ['Odmah uđeš', 'Pokucaš i identifikuješ se', 'Pozoveš recepciju'],                                         correct: 1 },
  { question: 'Šta provjeravaš prije početka čišćenja sobe?',                        options: ['Ništa', 'Status sobe (checkout/stayover/occupied)', 'Boju vrata'],                                       correct: 1 },
  { question: 'Šta provjeravaš u ladicama i ormarima?',                              options: ['Ništa', 'Zaboravljene predmete gosta', 'Broj jastuka'],                                                   correct: 1 },
  { question: 'Na kojoj temperaturi treba biti klima/termostat?',                    options: ['Nije bitno', 'Funkcionalan i podešen prema standardu', 'Maksimalna moguća'],                              correct: 1 },
  { question: 'Šta provjeravaš na madracu?',                                         options: ['Ništa', 'Oštećenja ili mrlje', 'Boju navlake'],                                                           correct: 1 },
  { question: 'Koliko često se mijenja posteljina?',                                 options: ['Nikad', 'Pri svakom čišćenju/checkout-u', 'Jednom sedmično'],                                            correct: 1 },
  { question: 'Šta dopunjavaš u kupatilu?',                                          options: ['Ništa', 'Sapun, šampon, toalet papir, peškiri', 'Samo peškire'],                                         correct: 1 },
  { question: 'Šta provjeravaš na zavjesama/roletnama?',                             options: ['Boju', 'Lagano klizanje, bez oštećenja', 'Cijenu materijala'],                                           correct: 1 },
  { question: 'Šta dopunjavaš u minibaru?',                                          options: ['Ništa, nije tvoj posao', 'Proizvode prema standardu, provjeravaš rokove', 'Samo vodu'],                  correct: 1 },
  { question: 'Šta provjeravaš na sigurnosnim elementima sobe?',                     options: ['Ništa', 'Bravu, sigurnosni lanac, detektor dima', 'Boju brave'],                                         correct: 1 },
  { question: 'Šta radiš ako primijetiš kvar (slavina, uređaj)?',                   options: ['Ignorišeš', 'Prijaviš supervizoru/održavanju', 'Sam popravljaš'],                                        correct: 1 },
  { question: 'Šta je finalni korak prije napuštanja sobe?',                         options: ['Ništa posebno', 'Vizuelna provjera da je soba "spremna za gosta"', 'Zatvaranje prozora'],               correct: 1 },
  { question: 'Šta provjeravaš vezano za miris u sobi?',                             options: ['Ništa', 'Neugodne mirise i njihov izvor', 'Boju zidova'],                                               correct: 1 },
  { question: 'Ko preuzima raspored sobnih dodjela?',                                options: ['Sama sobarica odlučuje', 'Preuzima od supervizora', 'Pita gosta'],                                        correct: 1 },
  { question: 'Šta provjeravaš na kolicima za čišćenje prije početka?',             options: ['Ništa', 'Kompletnost sredstava i potrepština', 'Boju kolica'],                                           correct: 1 },
  { question: 'Da li se sijalice koje trepere zamjenjuju?',                          options: ['Ne, nije tvoj posao', 'Da', 'Samo ako gost traži'],                                                      correct: 1 },
  { question: 'Šta predaješ supervizoru na kraju smjene?',                           options: ['Ništa', 'Izvještaj o završenim sobama i problemima', 'Ključeve gosta'],                                  correct: 1 },
  { question: 'Šta provjeravaš na TV-u i telefonu u sobi?',                         options: ['Ništa', 'Funkcionalnost', 'Boju ekrana'],                                                                 correct: 1 },
  { question: 'Zašto se otvaraju prozori na početku čišćenja?',                     options: ['Nije potrebno', 'Radi cirkulacije vazduha', 'Radi pogleda'],                                             correct: 1 },
  { question: 'Gdje se vraćaju kolica i zalihe na kraju smjene?',                   options: ['Bilo gdje', 'Na određeno mjesto', 'U sobu gosta'],                                                        correct: 1 },
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
      { fieldFilter: { field: { fieldPath: "role" },   op: "EQUAL", value: { stringValue: "housekeeper" } } },
      { fieldFilter: { field: { fieldPath: "source" }, op: "EQUAL", value: { stringValue: "seed" } } },
    ] } }, limit: 1 } },
    idToken
  );

  const payload = { fields: toFSFields({
    title: "Sobarica — Osnovna pitanja",
    role: "housekeeper",
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
    if (r.status === 200) console.log("  ✔ Updated housekeeper quiz successfully");
    else { console.error("  ✗ Patch failed:", r.body); process.exit(1); }
  } else {
    console.log("  No existing doc found — creating…");
    const r = await post(fsBase, colPath, payload, idToken);
    if (r.status === 200) console.log("  ✔ Created housekeeper quiz successfully");
    else { console.error("  ✗ Create failed:", r.body); process.exit(1); }
  }
}

main().catch(err => { console.error(err); process.exit(1); });
