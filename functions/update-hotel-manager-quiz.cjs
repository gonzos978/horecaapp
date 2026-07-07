/**
 * Updates (or creates) the hotel_manager quiz in Firestore.
 * Run: node functions/update-hotel-manager-quiz.cjs
 */
const admin = require("firebase-admin");
const serviceAccount = require("./service-account.json");

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const questions = [
  { question: 'Šta je RevPAR?',                                                   options: ['Vrsta sobe', 'Prihod po dostupnoj sobi (Revenue Per Available Room)', 'Vrsta ugovora'],                 correct: 1 },
  { question: 'Šta je ADR?',                                                       options: ['Vrsta ugovora', 'Prosječna dnevna cijena sobe (Average Daily Rate)', 'Vrsta sobe'],                      correct: 1 },
  { question: 'Šta znači "rate parity"?',                                          options: ['Različite cijene na svakom kanalu', 'Usklađene cijene na svim OTA kanalima', 'Najniža moguća cijena'],  correct: 1 },
  { question: 'Šta provjeravaš u channel manageru?',                               options: ['Ništa', 'Dostupnost soba radi sprečavanja overbookinga', 'Boju sobe'],                                  correct: 1 },
  { question: 'Šta je GOP?',                                                       options: ['Vrsta sobe', 'Gross Operating Profit (bruto operativni profit)', 'Vrsta ugovora'],                       correct: 1 },
  { question: 'Šta provjeravaš prvo na početku smjene?',                           options: ['Cijene konkurencije', 'Izvještaj prethodne smjene', 'Meni restorana'],                                  correct: 1 },
  { question: 'Ko koordinira sa housekeeping menadžerom?',                         options: ['Konobar', 'Menadžer hotela', 'Šanker'],                                                                 correct: 1 },
  { question: 'Šta provjeravaš vezano za online recenzije?',                       options: ['Ignorišeš ih', 'Pregledaš i odgovaraš na njih', 'Brišeš negativne'],                                   correct: 1 },
  { question: 'Šta je "no-show"?',                                                 options: ['Gost koji dođe rano', 'Gost koji ne stigne na rezervaciju', 'Gost koji otkaže unaprijed'],              correct: 1 },
  { question: 'Šta provjeravaš vezano za sigurnosne procedure?',                   options: ['Ništa', 'Vatrodojavu i izlaze u slučaju opasnosti', 'Cijenu parkinga'],                                 correct: 1 },
  { question: 'Šta analiziraš vezano za F&B odjel?',                               options: ['Samo cijene menija', 'Food cost % i labor cost %', 'Boju stolnjaka'],                                  correct: 1 },
  { question: 'Ko odobrava zahtjeve za nabavku iznad standardnog limita?',         options: ['Bilo koji radnik', 'Menadžer hotela', 'Konobar'],                                                       correct: 1 },
  { question: 'Šta provjeravaš vezano za lokalne zakone?',                         options: ['Ništa', 'Turističku taksu i prijavu gostiju', 'Cijenu parkinga'],                                       correct: 1 },
  { question: 'Šta predaješ vlasniku na kraju smjene?',                            options: ['Ništa', 'Dnevni izvještaj o prihodu i operativnim problemima', 'Listu gostiju'],                        correct: 1 },
  { question: 'Ko rješava reklamacije gostiju koje recepcija ne može sama riješiti?', options: ['Niko', 'Menadžer hotela', 'Domar'],                                                                  correct: 1 },
  { question: 'Šta provjeravaš na sigurnosnim kamerama?',                          options: ['Ništa', 'Evidencije pristupa za neobične aktivnosti', 'Boju snimka'],                                  correct: 1 },
  { question: 'Šta je "flow-through %"?',                                          options: ['Vrsta rezervacije', 'Mjera koliko dodatnog prihoda postaje profit', 'Brzina check-ina'],               correct: 1 },
  { question: 'Zašto se provjerava raspored osoblja za sljedećih 7 dana?',         options: ['Nije bitno', 'Da se popune praznine u smjenama', 'Radi statistike'],                                   correct: 1 },
  { question: 'Šta provjeravaš prije dolaska VIP gosta?',                          options: ['Ništa posebno', 'Posebne zahtjeve i preferencije', 'Cijenu sobe'],                                     correct: 1 },
  { question: 'Šta predaješ sljedećem menadžeru na kraju smjene?',                options: ['Ništa', 'Smjenski log sa otvorenim pitanjima', 'Ključeve sefa'],                                       correct: 1 },
];

const payload = {
  title: 'Menadžer hotela — Osnovna pitanja',
  role: 'hotel_manager',
  timePerQuestion: 60,
  totalTime: 60 * questions.length,
  questions,
  createdBy: 'system',
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  source: 'seed',
};

async function run() {
  // Find existing hotel_manager quiz
  const snap = await db.collection('quizzes')
    .where('role', '==', 'hotel_manager')
    .where('source', '==', 'seed')
    .limit(1)
    .get();

  if (!snap.empty) {
    const docId = snap.docs[0].id;
    await db.collection('quizzes').doc(docId).set(payload, { merge: true });
    console.log(`Updated existing hotel_manager quiz (${docId})`);
  } else {
    const ref = await db.collection('quizzes').add({
      ...payload,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`Created new hotel_manager quiz (${ref.id})`);
  }

  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
