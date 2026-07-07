/**
 * One-time script: seed Firestore `quizzes` collection from QUIZ_BANK.
 * Run: node scripts/seed-quizzes.js
 */

const admin = require("firebase-admin");

const serviceAccount = require("./service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// ── Q helper ──────────────────────────────────────────────────────────────
function Q(role, _num, question, a, b, c, correct) {
  return {
    role,
    question,
    options: [a, b, c],
    correct: correct === "a" ? 0 : correct === "b" ? 1 : 2,
  };
}

// ── Quiz bank ─────────────────────────────────────────────────────────────
const QUIZ_BANK = [
  // 1. MENADŽER HOTELA
  Q("hotel_manager",1,"Šta je RevPAR?","Vrsta sobe","Prihod po dostupnoj sobi (Revenue Per Available Room)","Vrsta ugovora","b"),
  Q("hotel_manager",2,"Šta je ADR?","Vrsta ugovora","Prosječna dnevna cijena sobe (Average Daily Rate)","Vrsta sobe","b"),
  Q("hotel_manager",3,"Šta znači \"rate parity\"?","Različite cijene na svakom kanalu","Usklađene cijene na svim OTA kanalima","Najniža moguća cijena","b"),
  Q("hotel_manager",4,"Šta provjeravaš u channel manageru?","Ništa","Dostupnost soba radi sprečavanja overbookinga","Boju sobe","b"),
  Q("hotel_manager",5,"Šta je GOP?","Vrsta sobe","Gross Operating Profit (bruto operativni profit)","Vrsta ugovora","b"),
  Q("hotel_manager",6,"Šta provjeravaš prvo na početku smjene?","Cijene konkurencije","Izvještaj prethodne smjene","Meni restorana","b"),
  Q("hotel_manager",7,"Ko koordinira sa housekeeping menadžerom?","Konobar","Menadžer hotela","Šanker","b"),
  Q("hotel_manager",8,"Šta provjeravaš vezano za online recenzije?","Ignorišeš ih","Pregledaš i odgovaraš na njih","Brišeš negativne","b"),
  Q("hotel_manager",9,"Šta je \"no-show\"?","Gost koji dođe rano","Gost koji ne stigne na rezervaciju","Gost koji otkaže unaprijed","b"),
  Q("hotel_manager",10,"Šta provjeravaš vezano za sigurnosne procedure?","Ništa","Vatrodojavu i izlaze u slučaju opasnosti","Cijenu parkinga","b"),
  Q("hotel_manager",11,"Šta analiziraš vezano za F&B odjel?","Samo cijene menija","Food cost % i labor cost %","Boju stolnjaka","b"),
  Q("hotel_manager",12,"Ko odobrava zahtjeve za nabavku iznad standardnog limita?","Bilo koji radnik","Menadžer hotela","Konobar","b"),
  Q("hotel_manager",13,"Šta provjeravaš vezano za lokalne zakone?","Ništa","Turističku taksu i prijavu gostiju","Cijenu parkinga","b"),
  Q("hotel_manager",14,"Šta predaješ vlasniku na kraju smjene?","Ništa","Dnevni izvještaj o prihodu i operativnim problemima","Listu gostiju","b"),
  Q("hotel_manager",15,"Ko rješava reklamacije gostiju koje recepcija ne može sama riješiti?","Niko","Menadžer hotela","Domar","b"),
  Q("hotel_manager",16,"Šta provjeravaš na sigurnosnim kamerama?","Ništa","Evidencije pristupa za neobične aktivnosti","Boju snimka","b"),
  Q("hotel_manager",17,"Šta je \"flow-through %\"?","Vrsta rezervacije","Mjera koliko dodatnog prihoda postaje profit","Brzina check-ina","b"),
  Q("hotel_manager",18,"Zašto se provjerava raspored osoblja za sljedećih 7 dana?","Nije bitno","Da se popune praznine u smjenama","Radi statistike","b"),
  Q("hotel_manager",19,"Šta provjeravaš prije dolaska VIP gosta?","Ništa posebno","Posebne zahtjeve i preferencije","Cijenu sobe","b"),
  Q("hotel_manager",20,"Šta predaješ sljedećem menadžeru na kraju smjene?","Ništa","Smjenski log sa otvorenim pitanjima","Ključeve sefa","b"),

  // 2. MENADŽER RESTORANA
  Q("restaurant_manager",1,"Šta provjeravaš prvo na početku smjene?","Meni","Izvještaj prethodne smjene","Cijene konkurencije","b"),
  Q("restaurant_manager",2,"Šta je \"food cost %\"?","Cijena jela za gosta","Trošak hrane u odnosu na prihod","Broj jela na meniju","b"),
  Q("restaurant_manager",3,"Šta je \"pour cost\"?","Cijena koktela za gosta","Trošak alkohola u odnosu na prodaju","Broj flaša na šanku","b"),
  Q("restaurant_manager",4,"Ko dodjeljuje sekcije konobarima?","Sami se dogovaraju","Menadžer restorana","Kuvar","b"),
  Q("restaurant_manager",5,"Šta provjeravaš sa glavnim kuvarom prije otvaranja?","Ništa","Temperaturne logove kuhinje","Boju posuđa","b"),
  Q("restaurant_manager",6,"Šta je \"86-lista\"?","Lista popularnih jela","Lista nedostupnih artikala","Lista gostiju","b"),
  Q("restaurant_manager",7,"Ko lično rješava reklamacije koje konobar ne može sam?","Niko","Menadžer restorana","Servirka","b"),
  Q("restaurant_manager",8,"Šta provjeravaš vezano za alkohol?","Ništa","Usklađenost sa zakonom o odgovornom posluživanju","Cijenu pića","b"),
  Q("restaurant_manager",9,"Šta radiš kod konflikta među osobljem?","Ignorišeš","Diskretno rješavaš bez ometanja servisa","Odmah otpustiš radnika","b"),
  Q("restaurant_manager",10,"Šta provjeravaš na kraju smjene vezano za kasu?","Ništa","Uporediš sa POS izvještajem","Boju novčanica","b"),
  Q("restaurant_manager",11,"Ko vodi pre-shift sastanak sa osobljem?","Konobar","Menadžer restorana","Higijeničarka","b"),
  Q("restaurant_manager",12,"Šta provjeravaš vezano za dostavljenu robu?","Ništa","Uporediš sa narudžbom i fakturom","Boju ambalaže","b"),
  Q("restaurant_manager",13,"Šta nadgledaš tokom smjene?","Samo kuhinju","Kvalitet usluge i interakciju osoblja sa gostima","Samo kasu","b"),
  Q("restaurant_manager",14,"Šta pripremaš za sljedeći dan?","Ništa","Narudžbu na osnovu dnevne potrošnje","Novi meni","b"),
  Q("restaurant_manager",15,"Šta osiguravaš prije zatvaranja?","Ništa posebno","Alkohol, vrijedne stavke i sve izlaze","Samo glavna vrata","b"),
  Q("restaurant_manager",16,"Šta predaješ vlasniku/GM-u?","Ništa","Dnevni izvještaj o prihodu i incidentima","Listu zaposlenih","b"),
  Q("restaurant_manager",17,"Šta provjeravaš vezano za higijenu osoblja?","Ništa","Poštovanje standarda higijene i uniforme","Frizuru osoblja","b"),
  Q("restaurant_manager",18,"Šta provjeravaš prije otvaranja restorana?","Samo meni","Da je mise en place kompletan na svim stanicama","Cijenu konkurencije","b"),
  Q("restaurant_manager",19,"Ko odobrava popuste i korekcije računa?","Bilo koji konobar","Menadžer restorana","Gost sam odlučuje","b"),
  Q("restaurant_manager",20,"Zašto se provjerava brzina izlaska jela iz kuhinje?","Nije bitno","Da se osigura kvalitet usluge tokom vršnog opterećenja","Radi statistike kuvara","b"),

  // 3. GLAVNI KUVAR
  Q("executive_chef",1,"Koja je glavna razlika između glavnog kuvara i kuvara?","Nema razlike","Glavni kuvar upravlja cijelom kuhinjom i timom","Glavni kuvar samo kuha brže","b"),
  Q("executive_chef",2,"Šta provjeravaš prvo na početku smjene?","Meni","Izvještaj prethodne smjene i HACCP logove","Cijene namirnica","b"),
  Q("executive_chef",3,"Ko vodi jutarnji sastanak sa kuhinjskim timom?","Konobar","Glavni kuvar","Menadžer restorana","b"),
  Q("executive_chef",4,"Šta je \"food cost %\"?","Cijena jela za gosta","Trošak hrane u odnosu na prihod","Broj jela na meniju","b"),
  Q("executive_chef",5,"Šta provjeravaš na \"pass-u\" prije servisa?","Ništa","Prezentaciju jela (finalna kontrola kvaliteta)","Cijenu jela","b"),
  Q("executive_chef",6,"Ko rješava konflikte unutar kuhinjskog tima?","Niko, sami se rješavaju","Glavni kuvar","Konobar","b"),
  Q("executive_chef",7,"Šta ažuriraš prema trenutnim troškovima sastojaka?","Ništa","Recepture/portion control","Boju jela","b"),
  Q("executive_chef",8,"Ko obučava novo osoblje tokom smjene?","Niko","Glavni kuvar demonstrira tehnike","Servirka","b"),
  Q("executive_chef",9,"Šta provjeravaš vezano za alergensku deklaraciju?","Ništa","Usklađenost menija sa deklaracijom","Cijenu alergena","b"),
  Q("executive_chef",10,"Šta evaluiraš tokom smjene?","Ništa","Učinak kuvara za buduće ocjenjivanje","Boju uniformi","b"),
  Q("executive_chef",11,"Ko koordinira tempo kuhinje sa restoran menadžerom?","Konobar","Glavni kuvar","Higijeničarka","b"),
  Q("executive_chef",12,"Šta provjeravaš vezano za dostavu robe?","Ništa","Kvalitet, količinu i cijenu u odnosu na narudžbu","Boju ambalaže","b"),
  Q("executive_chef",13,"Šta pripremaš za sljedeći dan?","Ništa","Plan rada i narudžbe na osnovu potrošnje","Novu uniformu","b"),
  Q("executive_chef",14,"Šta predaješ menadžmentu na kraju smjene?","Ništa","Izvještaj o food cost-u i incidentima","Listu gostiju","b"),
  Q("executive_chef",15,"Da li glavni kuvar kuha tokom servisa?","Da, primarno to radi","Ne, prvenstveno upravlja i kontroliše","Samo desert","b"),
  Q("executive_chef",16,"Šta provjeravaš vezano za veću opremu?","Ništa","Stanje hood sistema, walk-in, glavnih šporeta","Boju opreme","b"),
  Q("executive_chef",17,"Ko provjerava da svi kuvari poštuju HACCP standarde?","Niko","Glavni kuvar","Konobar","b"),
  Q("executive_chef",18,"Šta pregledaš vezano za zahtjeve za narudžbu?","Ništa","Zahtjeve za robu od dobavljača","Cijene konkurencije","b"),
  Q("executive_chef",19,"Šta provjeravaš prije zatvaranja kuhinje?","Ništa","Čistoću i sigurnost (završni obilazak)","Boju podova","b"),
  Q("executive_chef",20,"Zašto je bitno pokriti praznine u rasporedu osoblja?","Nije bitno","Da se osigura nesmetan rad kuhinje","Radi statistike","b"),

  // 4. KUVAR
  Q("cook",1,"Na kojoj temperaturi mora biti frižider?","Ispod 4°C","Ispod 10°C","Ispod 0°C","a"),
  Q("cook",2,"Na kojoj temperaturi mora biti zamrzivač?","Ispod -5°C","Ispod -18°C","Ispod -10°C","b"),
  Q("cook",3,"Šta znači FIFO?","First In, First Out","Food In, Food Out","Fast In, Fast Out","a"),
  Q("cook",4,"Da li se sirovo meso i povrće mogu sjeći na istoj dasci?","Da","Ne","Samo ako se opere između","b"),
  Q("cook",5,"Šta radiš prvo kad uđeš u kuhinju?","Pripremaš hranu","Opereš ruke","Provjeriš meni","b"),
  Q("cook",6,"Koliko dugo treba prati ruke prema standardu?","5 sekundi","Minimalno 20 sekundi","1 minutu","b"),
  Q("cook",7,"Šta označava \"danger zone\" za temperaturu hrane?","Zona između 4°C i 60°C","Zona ispod 0°C","Zona iznad 100°C","a"),
  Q("cook",8,"Ko provjerava temperaturu jela prije serviranja?","Konobar","Kuvar","Gost","b"),
  Q("cook",9,"Šta treba uraditi sa namirnicom čiji je rok istekao?","Koristiti je odmah","Ukloniti je","Sakriti je u zamrzivač","b"),
  Q("cook",10,"Zašto se obilježavaju sosovi datumom?","Estetski razlog","Za FIFO praćenje i sigurnost hrane","Nije potrebno","b"),
  Q("cook",11,"Šta je \"mise en place\"?","Čišćenje kuhinje","Priprema sastojaka prije servisa","Pranje posuđa","b"),
  Q("cook",12,"Koja je svrha HACCP loga?","Dokumentovanje temperatura i sigurnosti hrane","Praćenje plata","Raspored smjena","a"),
  Q("cook",13,"Da li se kvar opreme prijavljuje na kraju smjene?","Da","Ne, odmah","Nikad se ne prijavljuje","b"),
  Q("cook",14,"Šta provjeravaš kod dnevnih specijala vezano za goste?","Boju jela","Alergene","Cijenu","b"),
  Q("cook",15,"Šta znači \"clean-as-you-go\"?","Čistiti samo na kraju smjene","Čistiti tokom rada, ne čekati kraj","Čistiti samo prije otvaranja","b"),
  Q("cook",16,"Gdje se odlažu organski otpaci ako je propisano?","Sa ostalim otpadom","Odvojeno","U frižider","b"),
  Q("cook",17,"Šta se provjerava prije skladištenja viška hrane?","Boja","Temperatura","Miris samo","b"),
  Q("cook",18,"Ko predaje smjenski izvještaj na kraju rada?","Menadžer","Kuvar koji završava smjenu","Konobar","b"),
  Q("cook",19,"Zašto se razdvaja sirovo meso od povrća?","Estetski razlog","Sprečavanje kontaminacije","Nije bitno zašto","b"),
  Q("cook",20,"Šta radiš ako primijetiš da je oprema neispravna tokom servisa?","Ignorišeš do kraja smjene","Prijaviš menadžeru odmah","Sam je popravljaš","b"),

  // 5. POMOĆNI KUVAR
  Q("sous_cook",1,"Ko organizuje radnu stanicu pomoćnog kuvara?","Sam pomoćni kuvar prema instrukcijama glavnog kuvara","Konobar","Menadžer","a"),
  Q("sous_cook",2,"Šta znači FIFO princip kod skladištenja?","Prvo ušlo, prvo izašlo","Najjeftinije prvo","Nasumičan odabir","a"),
  Q("sous_cook",3,"Da li se daske za rezanje čiste između svake upotrebe?","Ne, samo na kraju dana","Da, između svake upotrebe","Jednom sedmično","b"),
  Q("sous_cook",4,"Šta radiš sa povrćem prije pripreme?","Direktno sječeš","Opereš ga","Stavljaš odmah u tiganj","b"),
  Q("sous_cook",5,"Ko provjerava kvalitet dostavljene robe?","Samo menadžer","Pomoćni kuvar pomaže u provjeri","Konobar","b"),
  Q("sous_cook",6,"Šta je \"temperature danger zone\"?","Opasna zona za rast bakterija (4°C-60°C)","Temperatura zamrzivača","Temperatura rerne","a"),
  Q("sous_cook",7,"Da li pomoćni kuvar pomaže u serviranju tokom peak service-a?","Ne, to nije njegov posao","Da","Samo ako kuvar nije tu","b"),
  Q("sous_cook",8,"Šta radiš sa otpadom u kuhinji?","Ostaviš ga do kraja dana","Iznesi i razdvojiš pravilno","Ostaviš ga kuvaru da riješi","b"),
  Q("sous_cook",9,"Ko prijavljuje problem sa sastojcima ili opremom?","Niko, samostalno se rješava","Pomoćni kuvar prijavljuje glavnom kuvaru odmah","Čeka se kraj smjene","b"),
  Q("sous_cook",10,"Šta znači \"clean-as-you-go\"?","Čišćenje samo na kraju","Pranje posuđa tokom smjene, ne čekati kraj","Čišćenje jednom dnevno","b"),
  Q("sous_cook",11,"Da li se sastojci obilježavaju datumom?","Ne","Da, prema FIFO principu","Samo vikendom","b"),
  Q("sous_cook",12,"Šta provjeravaš na alatu (mikseri, blenderi) prije upotrebe?","Boju","Ispravnost","Cijenu","b"),
  Q("sous_cook",13,"Gdje se skladišti dostavljena roba?","Bilo gdje ima mjesta","Prema FIFO principu i temperaturnim zahtjevima","Na podu","b"),
  Q("sous_cook",14,"Ko pomaže u pripremi garnirunga?","Konobar","Pomoćni kuvar","Higijeničarka","b"),
  Q("sous_cook",15,"Šta radiš ako primijetiš prosutu tečnost na podu?","Ignorišeš ako nisi ti prolio","Odmah očistiš","Sačekaš čišćenje na kraju","b"),
  Q("sous_cook",16,"Da li se rashladni uređaji moraju zatvoriti nakon upotrebe?","Da, uvijek","Nije bitno","Samo noću","a"),
  Q("sous_cook",17,"Šta provjeravaš prije pauze?","Ništa posebno","Čistoću radne stanice","Cijenu hrane","b"),
  Q("sous_cook",18,"Ko asistira u pripremi za banket narudžbe?","Samo glavni kuvar","Pomoćni kuvar pomaže","Servirka","b"),
  Q("sous_cook",19,"Šta predaješ na kraju smjene glavnom kuvaru?","Ništa","Izvještaj o utrošenim sastojcima","Listu gostiju","b"),
  Q("sous_cook",20,"Zašto je bitno razdvojiti sastojke po temperaturnim zahtjevima?","Estetski razlog","Sigurnost hrane","Nije bitno","b"),

  // 6. KOKTEL MAJSTOR
  Q("mixologist",1,"Koja je glavna razlika između koktel majstora i šankera?","Nema razlike","Koktel majstor razvija recepture i kreira signature ponudu","Koktel majstor radi samo noću","b"),
  Q("mixologist",2,"Šta provjeravaš na specijalnim sastojcima?","Ništa","Zalihu i kvalitet (bittersi, sirupi, infuzije)","Cijenu samo","b"),
  Q("mixologist",3,"Šta pripremaš i obilježavaš datumom?","Ništa","Svježe infuzije, sirupe i tinkture","Samo flaše alkohola","b"),
  Q("mixologist",4,"Šta je \"mixing glass\"?","Vrsta čaše za serviranje","Specijalizovani alat za pripremu koktela","Vrsta koktela","b"),
  Q("mixologist",5,"Šta radiš prije otvaranja vezano za signature koktel?","Ništa","Degustiraš i kalibrišeš recepturu","Mijenjaš cijenu","b"),
  Q("mixologist",6,"Šta pratiš vezano za prodaju koktela?","Ništa","Koji se najviše/najmanje traži (podaci za meni)","Boju koktela","b"),
  Q("mixologist",7,"Šta predstavljaš gostu kod signature koktela?","Samo cijenu","Priču/koncept iza koktela","Recepturu u potpunosti","b"),
  Q("mixologist",8,"Šta provjeravaš kod gosta prije serviranja alkohola?","Ništa","Identifikacioni dokument ako postoji sumnja","Broj telefona","b"),
  Q("mixologist",9,"Šta pratiš vezano za premium sastojke?","Ništa","Pour cost (utrošak u odnosu na prodaju)","Boju ambalaže","b"),
  Q("mixologist",10,"Šta radiš tokom slobodnog vremena u smjeni?","Ništa","Razvijaš/testiraš nove recepte za sezonsku ponudu","Čekaš kraj smjene","b"),
  Q("mixologist",11,"Šta provjeravaš na garnirung elementima?","Ništa","Zalihu i svježinu (cvijeće, dehidrirano voće)","Samo cijenu","b"),
  Q("mixologist",12,"Da li koktel majstor prilagođava piće ukusu gosta?","Ne, samo standardna receptura","Da, kreira/prilagođava na zahtjev","Samo ako je VIP gost","b"),
  Q("mixologist",13,"Šta evidentiraš odmah po pripremi koktela?","Ništa","Unos u POS sistem","Samo na kraju smjene","b"),
  Q("mixologist",14,"Šta provjeravaš prije serviranja svakog koktela?","Ništa","Prezentaciju (finalna kontrola)","Cijenu","b"),
  Q("mixologist",15,"Komu komuniciraš dnevnu ponudu pića?","Niko","Osoblju šanka i konobarima","Samo menadžeru","b"),
  Q("mixologist",16,"Šta radiš sa otvorenim specijalnim flašama na kraju smjene?","Ostavljaš ih otvorene","Pravilno skladištiš","Bacaš ih","b"),
  Q("mixologist",17,"Šta predlažeš menadžeru bara?","Ništa","Prijedloge za meni na osnovu utroška","Nove cijene konkurencije","b"),
  Q("mixologist",18,"Da li koktel majstor mora poznavati glavne porodice alkohola?","Ne, nije bitno","Da","Samo viski","b"),
  Q("mixologist",19,"Šta provjeravaš na batch-pripremljenim kokelima?","Ništa","Svježinu i pravilno doziranje sastojaka","Boju samo","b"),
  Q("mixologist",20,"Zašto je precizna kontrola mjera bitna kod serviranja?","Nije bitna","Kontrola pour cost-a i konzistentnost ukusa","Radi brzine","b"),

  // 7. ŠANKER
  Q("bartender",1,"Šta šanker prvo provjerava na početku smjene?","Garnirung","Ključeve bara i sigurnost prostora","Cijene pića","b"),
  Q("bartender",2,"Šta je \"jigger\"?","Vrsta čaše","Alat za mjerenje pour cost-a","Vrsta koktela","b"),
  Q("bartender",3,"Zašto se provjerava POS sistem prije otvaranja?","Nije bitno","Da se osigura tačna evidencija pića","Radi izgleda","b"),
  Q("bartender",4,"Šta znači FIFO kod rotacije zalihe alkohola?","Prvo ušlo, prvo izašlo","Najjeftinije prvo","Najjače prvo","a"),
  Q("bartender",5,"Kada se provjerava identifikacija gosta?","Nikad","Kad postoji sumnja u punoljetnost","Samo vikendom","b"),
  Q("bartender",6,"Šta radiš ako gost pokazuje znakove prekomjerne konzumacije?","Ignorišeš","Pratiš ponašanje i reaguješ odgovorno","Serviraš još jedno piće","b"),
  Q("bartender",7,"Da li se piće evidentira u POS odmah po pripremi?","Ne, na kraju smjene","Da, odmah, bez izuzetka","Samo ako gost traži račun","b"),
  Q("bartender",8,"Šta provjeravaš na pivu na točenju?","Samo ukus","Pritisak, temperaturu, čistoću creva","Boju piva","b"),
  Q("bartender",9,"Zašto se broji gotovina na početku i kraju smjene?","Nije potrebno","Za tačnu finansijsku evidenciju","Radi navike","b"),
  Q("bartender",10,"Šta je \"pour cost\"?","Cijena čaše","Trošak alkohola u odnosu na prodaju","Broj flaša","b"),
  Q("bartender",11,"Da li se sokovi cijede unaprijed i obilježavaju datumom?","Da","Ne, koriste se odmah bez obilježavanja","Samo za koktele","a"),
  Q("bartender",12,"Šta provjeravaš kod vina prije serviranja?","Boju samo","Odgovarajuću temperaturu","Cijenu","b"),
  Q("bartender",13,"Ko zaključava alkoholne zalihe na kraju smjene?","Niko","Šanker","Konobar","b"),
  Q("bartender",14,"Šta radiš sa prljavim čašama tokom smjene?","Ostavljaš na šanku","Šalješ na pranje na vrijeme","Koristiš ih ponovo","b"),
  Q("bartender",15,"Zašto se provjerava rok trajanja flaša?","Estetski razlog","Kvalitet i sigurnost pića","Nije bitno","b"),
  Q("bartender",16,"Šta je \"odgovorno posluživanje alkohola\"?","Servirati bilo kome","Provjera dobi i prepoznavanje znakova prekomjerne konzumacije","Naplata unaprijed","b"),
  Q("bartender",17,"Da li se šank čisti samo na kraju smjene?","Da","Ne, tokom cijele smjene (clean-as-you-go)","Samo ujutro","b"),
  Q("bartender",18,"Šta predaješ menadžeru na kraju smjene?","Ništa","Izvještaj o utrošku i nepravilnostima","Ključeve gosta","b"),
  Q("bartender",19,"Šta provjeravaš na rashladnim vitrinama?","Boju","Temperaturu","Cijenu sadržaja","b"),
  Q("bartender",20,"Zašto je bitno poštovati standardnu recepturu pri serviranju?","Nije bitno","Kontrola pour cost-a i konzistentnost","Radi brzine serviranja","b"),

  // 8. KONOBAR
  Q("waiter",1,"Koliko brzo treba dočekati gosta?","Nije bitno kada","Unutar 1-2 minute","Kad ima vremena","b"),
  Q("waiter",2,"Šta je \"86-lista\"?","Lista popularnih jela","Lista nedostupnih artikala","Lista gostiju","b"),
  Q("waiter",3,"Kada se unosi narudžba u POS?","Na kraju smjene","Odmah, precizno","Kad ima vremena","b"),
  Q("waiter",4,"Koliko nakon serviranja glavnog jela treba provjeriti gosta?","2 minute","30 minuta","Nikad","a"),
  Q("waiter",5,"Šta je \"pre-bus\"?","Naplata unaprijed","Uklanjanje praznih tanjira čim gost završi","Brzo serviranje","b"),
  Q("waiter",6,"Šta provjeravaš prije uzimanja narudžbe hrane?","Cijenu","Alergije i dijetalne zahtjeve","Broj stola samo","b"),
  Q("waiter",7,"Šta radiš odmah nakon odlaska gosta sa stola?","Ostaviš sto kako jeste","Pripremiš sto za sljedećeg gosta (clear & reset)","Čekaš menadžera","b"),
  Q("waiter",8,"Kome prijavljuješ reklamaciju gosta?","Nikom, sam rješavaš","Menadžeru odmah","Kuvaru","b"),
  Q("waiter",9,"Šta provjeravaš na stolovima prije otvaranja?","Boju stolnjaka","Pravilno postavljanje (stolnjaci, pribor, čaše)","Cijenu stola","b"),
  Q("waiter",10,"Da li se račun provjerava prije nego se donese gostu?","Ne","Da, za točnost","Samo ako gost traži","b"),
  Q("waiter",11,"Šta nudiš gostu na kraju obroka?","Ništa","Desert i kafu/čaj","Novi meni","b"),
  Q("waiter",12,"Šta provjeravaš sa kuhinjom prije smjene?","Recepte","Dnevni meni i nedostupne artikle","Plate kuvara","b"),
  Q("waiter",13,"Koliko često dopunjavaš vodu/piće gostu?","Nikad","Tokom obroka, bez da budeš ometajući","Samo na kraju","b"),
  Q("waiter",14,"Šta provjeravaš u toaletu za goste?","Ništa, to nije tvoj posao","Čistoću i potrepštine","Broj posjeta","b"),
  Q("waiter",15,"Kako se zove standardni redoslijed usluživanja gosta?","Steps of service","Random servis","Brzi servis","a"),
  Q("waiter",16,"Šta vraćaš gostu ako plaća gotovinom?","Ništa","Ispravan kusur","Bon za sljedeću posjetu","b"),
  Q("waiter",17,"Šta predstavljaš gostu pri dolasku?","Samo meni","Dnevne specijale","Cijene konkurencije","b"),
  Q("waiter",18,"Šta provjeravaš na servisnoj stanici prije otvaranja?","Ništa","Čistoću i kompletnost (salvete, escajg)","Boju stanice","b"),
  Q("waiter",19,"Šta radiš kad gost završi jelo?","Čekaš da cijeli sto završi","Ukloniš prazne tanjire odmah","Pitaš za napojnicu","b"),
  Q("waiter",20,"Zašto unosiš narudžbu odmah u POS?","Nije bitno kada","Da se izbjegnu greške i kasniji propusti","Radi brzine plaćanja","b"),

  // 9. SERVIRKA
  Q("busser",1,"Šta je glavna razlika između servirke i konobara?","Nema razlike","Servirka ne naplaćuje i ne uzima narudžbe","Servirka radi samo noću","b"),
  Q("busser",2,"Šta provjeravaš prije otvaranja na stolovima?","Ništa","Pravilno postavljanje (stolnjaci, escajg, čaše)","Cijenu stola","b"),
  Q("busser",3,"Šta je \"pre-bus\"?","Naplata unaprijed","Uklanjanje praznih tanjira čim gost završi","Čišćenje prije otvaranja","b"),
  Q("busser",4,"Šta nosiš gostu tokom obroka?","Samo račun","Vodu i hljeb","Novi meni","b"),
  Q("busser",5,"Šta provjeravaš na poslužavniku prije nošenja jela?","Ništa","Da je svaka stavka ispravna prema narudžbi","Boju tanjira","b"),
  Q("busser",6,"Šta radiš odmah nakon odlaska gosta?","Ostaviš sto","Obrišeš i resetuješ sto (clear & reset)","Čekaš konobara","b"),
  Q("busser",7,"Kome prijavljuješ ako gost izgleda nezadovoljan?","Niko, nije tvoj posao","Konobaru ili menadžeru","Kuvaru","b"),
  Q("busser",8,"Šta razdvajaš na stanici za pranje?","Ništa, sve ide zajedno","Staklo, escajg, tanjire","Samo čaše","b"),
  Q("busser",9,"Šta provjeravaš u toaletima za goste?","Ništa","Čistoću i zalihe","Broj posjeta","b"),
  Q("busser",10,"Šta dopunjavaš tokom mirnijih perioda servisa?","Ništa","Servisnu stanicu","Meni","b"),
  Q("busser",11,"Šta pomažeš konobaru da uradi brzo?","Naplatu","Nošenje jela iz kuhinje dok je toplo","Pisanje narudžbe","b"),
  Q("busser",12,"Šta provjeravaš oko stolova tokom smjene?","Ništa","Podove od mrvica i prosute tečnosti","Boju stolica","b"),
  Q("busser",13,"Da li servirka uzima narudžbu hrane od gosta?","Da, uvijek","Ne, to radi konobar","Samo za piće","b"),
  Q("busser",14,"Šta vraćaš nazad u kuhinju nakon servisa?","Ništa","Posuđe, organizovano","Meni","b"),
  Q("busser",15,"Šta pomažeš pripremiti za velike grupe?","Ništa","Stolove prema rasporedu","Cjenovnik","b"),
  Q("busser",16,"Šta provjeravaš na kraju smjene vezano za salu?","Ništa","Urednost (stolice, podovi, osvjetljenje)","Broj gostiju","b"),
  Q("busser",17,"Gdje se vraća sva opremu (poslužavnici, stanice)?","Bilo gdje","Na određeno mjesto","Kuvaru","b"),
  Q("busser",18,"Kome prijavljuješ završetak zaduženja?","Niko","Šef-konobaru/menadžeru","Higijeničarki","b"),
  Q("busser",19,"Šta pripremaš za sljedećeg gosta odmah?","Ništa","Sto (clear & reset)","Novi meni","b"),
  Q("busser",20,"Zašto je brzina bitna kod nošenja hrane?","Nije bitna","Da hrana stigne topla gostu","Radi napojnice","b"),

  // 10. SOBARICA
  Q("housekeeper",1,"Šta radiš prije ulaska u sobu?","Odmah uđeš","Pokucaš i identifikuješ se","Pozoveš recepciju","b"),
  Q("housekeeper",2,"Šta provjeravaš prije početka čišćenja sobe?","Ništa","Status sobe (checkout/stayover/occupied)","Boju vrata","b"),
  Q("housekeeper",3,"Šta provjeravaš u ladicama i ormarima?","Ništa","Zaboravljene predmete gosta","Broj jastuka","b"),
  Q("housekeeper",4,"Na kojoj temperaturi treba biti klima/termostat?","Nije bitno","Funkcionalan i podešen prema standardu","Maksimalna moguća","b"),
  Q("housekeeper",5,"Šta provjeravaš na madracu?","Ništa","Oštećenja ili mrlje","Boju navlake","b"),
  Q("housekeeper",6,"Koliko često se mijenja posteljina?","Nikad","Pri svakom čišćenju/checkout-u","Jednom sedmično","b"),
  Q("housekeeper",7,"Šta dopunjavaš u kupatilu?","Ništa","Sapun, šampon, toalet papir, peškiri","Samo peškire","b"),
  Q("housekeeper",8,"Šta provjeravaš na zavjesama/roletnama?","Boju","Lagano klizanje, bez oštećenja","Cijenu materijala","b"),
  Q("housekeeper",9,"Šta dopunjavaš u minibaru?","Ništa, nije tvoj posao","Proizvode prema standardu, provjeravaš rokove","Samo vodu","b"),
  Q("housekeeper",10,"Šta provjeravaš na sigurnosnim elementima sobe?","Ništa","Bravu, sigurnosni lanac, detektor dima","Boju brave","b"),
  Q("housekeeper",11,"Šta radiš ako primijetiš kvar (slavina, uređaj)?","Ignorišeš","Prijaviš supervizoru/održavanju","Sam popravljaš","b"),
  Q("housekeeper",12,"Šta je finalni korak prije napuštanja sobe?","Ništa posebno","Vizuelna provjera da je soba \"spremna za gosta\"","Zatvaranje prozora","b"),
  Q("housekeeper",13,"Šta provjeravaš vezano za miris u sobi?","Ništa","Neugodne mirise i njihov izvor","Boju zidova","b"),
  Q("housekeeper",14,"Ko preuzima raspored sobnih dodjela?","Sama sobarica odlučuje","Preuzima od supervizora","Pita gosta","b"),
  Q("housekeeper",15,"Šta provjeravaš na kolicima za čišćenje prije početka?","Ništa","Kompletnost sredstava i potrepština","Boju kolica","b"),
  Q("housekeeper",16,"Da li se sijalice koje trepere zamjenjuju?","Ne, nije tvoj posao","Da","Samo ako gost traži","b"),
  Q("housekeeper",17,"Šta predaješ supervizoru na kraju smjene?","Ništa","Izvještaj o završenim sobama i problemima","Ključeve gosta","b"),
  Q("housekeeper",18,"Šta provjeravaš na TV-u i telefonu u sobi?","Ništa","Funkcionalnost","Boju ekrana","b"),
  Q("housekeeper",19,"Zašto se otvaraju prozori na početku čišćenja?","Nije potrebno","Radi cirkulacije vazduha","Radi pogleda","b"),
  Q("housekeeper",20,"Gdje se vraćaju kolica i zalihe na kraju smjene?","Bilo gdje","Na određeno mjesto","U sobu gosta","b"),

  // 11. NOĆNI ČUVAR
  Q("night_security",1,"Šta provjeravaš prvo pri preuzimanju smjene?","Ništa","Log i otvorene zahtjeve od prethodne smjene","Meni restorana","b"),
  Q("night_security",2,"Koliko često se obavlja obilazak objekta tokom noći?","Jednom","Svaka 2 sata","Samo ako se nešto čuje","b"),
  Q("night_security",3,"Šta provjeravaš na alarmnom panelu?","Ništa","Rad sistema za vatrodojavu","Boju panela","b"),
  Q("night_security",4,"Šta provjeravaš na CCTV sistemu?","Ništa","Da li sve kamere snimaju ispravno","Broj kamera","b"),
  Q("night_security",5,"Šta radiš ako gost stigne kasno (kasni check-in)?","Ignorišeš","Pomažeš mu","Pozoveš menadžera obavezno","b"),
  Q("night_security",6,"Šta pripremaš za sutrašnje dolaske?","Ništa","Listu dolazaka i posebne zahtjeve","Cjenovnik","b"),
  Q("night_security",7,"Šta je \"night audit\"?","Čišćenje noću","Usklađivanje dnevnog POS izvještaja sa sistemom","Provjera sigurnosti samo","b"),
  Q("night_security",8,"Šta provjeravaš na izlazima za slučaj opasnosti?","Ništa","Da su slobodni i obilježeni","Boju vrata","b"),
  Q("night_security",9,"Šta evidentiraš tokom noći?","Ništa","Sve incidente i neobične događaje u log","Samo velike probleme","b"),
  Q("night_security",10,"Šta osiguravaš na početku smjene?","Ništa posebno","Kasu i sef za noć","Parking","b"),
  Q("night_security",11,"Šta pripremaš za jutarnji servis?","Ništa","Prostor za doručak (sala, bar, recepcija)","Novi meni","b"),
  Q("night_security",12,"Šta provjeravaš na ulazima objekta?","Ništa","Da su pravilno zaključani/osigurani","Boju vrata","b"),
  Q("night_security",13,"Šta radiš ako primijetiš neobičnu aktivnost?","Ignorišeš","Pratiš i evidentiraš","Odmah intervenišeš fizički","b"),
  Q("night_security",14,"Šta predaješ jutarnjoj smjeni?","Ništa","Detaljan smjenski izvještaj","Ključeve sefa samo","b"),
  Q("night_security",15,"Šta provjeravaš tokom obilaska u javnim toaletima?","Ništa","Čistoću i zalihe","Broj posjeta","b"),
  Q("night_security",16,"Da li noćni čuvar može objediniti i ulogu \"night portera\"?","Ne, nikad","Da, čest slučaj u manjim hotelima","Samo vikendom","b"),
  Q("night_security",17,"Šta provjeravaš vezano za vremensku prognozu?","Ništa","Pripremu objekta za ekstremne uslove","Boju neba","b"),
  Q("night_security",18,"Šta radiš na kraju smjene?","Ništa posebno","Obavljaš posljednji obilazak objekta","Odmah odlaziš","b"),
  Q("night_security",19,"Šta pripremaš za sutrašnje grupne dolaske?","Ništa","Ključeve/kartice ako je potrebno","Cjenovnik","b"),
  Q("night_security",20,"Zašto je dokumentovanje obilazaka bitno?","Nije bitno","Dokaz da je sigurnosna procedura ispoštovana","Radi statistike","b"),

  // 12. HIGIJENIČARKA
  Q("cleaner",1,"Šta nosiš prije rada sa hemikalijama?","Ništa posebno","Zaštitnu opremu (rukavice)","Samo masku","b"),
  Q("cleaner",2,"Šta postavljaš prije mokrog čišćenja?","Ništa","\"Mokar pod\" znakove","Stolice na sto","b"),
  Q("cleaner",3,"Kojim redom čistiš toalete?","Nasumično","Od najprljavijih ka najčistijim površinama","Od najčistijih ka najprljavijim","b"),
  Q("cleaner",4,"Šta dopunjavaš u toaletima?","Ništa","Sapun, papir, peškiri, osvježivač","Samo papir","b"),
  Q("cleaner",5,"Šta koristiš za uklanjanje masnih naslaga sa podova kuhinje?","Običnu vodu","Degreaser","Samo krpu","b"),
  Q("cleaner",6,"Šta provjeravaš na slivnicima?","Ništa","Naslage i neprijatne mirise","Boju slivnika","b"),
  Q("cleaner",7,"Šta čistiš na visokim dodirnim tačkama?","Ništa posebno","Kvake, prekidače, rukohvate","Samo prozore","b"),
  Q("cleaner",8,"Šta radiš ako primijetiš znakove štetočina?","Ignorišeš","Prijaviš odmah","Sam rješavaš problem","b"),
  Q("cleaner",9,"Šta provjeravaš na sredstvima za čišćenje prije upotrebe?","Ništa","Rokove trajanja","Boju ambalaže","b"),
  Q("cleaner",10,"Gdje se odlažu hemikalije za čišćenje?","Bilo gdje","U organizovano, obilježeno skladište","U kuhinju","b"),
  Q("cleaner",11,"Šta provjeravaš na rasvjeti tokom smjene?","Ništa","Pregorjele sijalice, prijaviš ih","Boju svjetla","b"),
  Q("cleaner",12,"Da li se kuhinjske radne površine čiste samo van servisa?","Ne, bilo kada","Da, prema rasporedu sa kuhinjskim timom","Samo ujutro","b"),
  Q("cleaner",13,"Šta predaješ supervizoru na kraju smjene?","Ništa","Izvještaj o obavljenim zadacima","Ključeve skladišta","b"),
  Q("cleaner",14,"Šta provjeravaš vezano za kante za otpad?","Ništa","Dezinfekciju i pravovremeno pražnjenje","Boju kanti","b"),
  Q("cleaner",15,"Šta radiš ako primijetiš kvar (curenje, oštećenje)?","Ignorišeš","Prijaviš nadređenom","Sam popravljaš","b"),
  Q("cleaner",16,"Šta je finalni korak prije kraja smjene?","Ništa posebno","Provjera opšte urednosti prostora","Gašenje svih svjetala","b"),
  Q("cleaner",17,"Šta čistiš na staklenim površinama?","Ostavljaš mrlje","Čistiš bez mrlja i tragova","Samo spolja","b"),
  Q("cleaner",18,"Gdje se vraća opremu za čišćenje na kraju smjene?","Bilo gdje","Na određeno mjesto","Ostaviš je gdje si zadnje koristio","b"),
  Q("cleaner",19,"Šta pomažeš u čišćenju prema sedmičnom planu?","Ništa","Dubinsko čišćenje opreme (hood, walk-in)","Samo prozore","b"),
  Q("cleaner",20,"Zašto je redoslijed čišćenja (od čistog ka prljavom ili obrnuto) bitan?","Nije bitan","Sprečava širenje nečistoće i kontaminacije","Radi brzine","b"),

  // 13. DOMAR
  Q("maintenance",1,"Šta provjeravaš prvo na početku smjene?","Ništa","Log prijavljenih kvarova","Meni restorana","b"),
  Q("maintenance",2,"Šta znači \"P1\" prioritet popravke?","Estetski problem","Sigurnost gosta, najhitnije","Najmanje hitno","b"),
  Q("maintenance",3,"Šta provjeravaš vezano za vatrodojavu?","Ništa","Rad sistema i protupožarnu opremu","Boju aparata","b"),
  Q("maintenance",4,"Šta provjeravaš na liftu?","Ništa","Vrata, signalizaciju, dugme za hitne slučajeve","Boju kabine","b"),
  Q("maintenance",5,"Šta radiš sa filterima za klimu?","Ignorišeš","Mijenjaš prema planu održavanja","Čistiš ih jednom godišnje","b"),
  Q("maintenance",6,"Šta provjeravaš vezano za vodovod?","Ništa","Curenje, začepljenja, neobične mirise","Boju vode","b"),
  Q("maintenance",7,"Šta dokumentuješ nakon popravke?","Ništa","Šta, kada, koji djelovi/materijal su utrošeni","Samo datum","b"),
  Q("maintenance",8,"Koji prioritet ima problem koji utiče na funkcionalnost sobe?","P1","P2","P3","b"),
  Q("maintenance",9,"Šta provjeravaš na sigurnosnim sistemima (CCTV)?","Ništa","Tehničku funkcionalnost","Boju kamera","b"),
  Q("maintenance",10,"Šta provjeravaš vezano za bazen/spa opremu?","Ništa","Pumpe i filtere, ako su u opisu pozicije","Boju vode","b"),
  Q("maintenance",11,"Šta provjeravaš na generatoru?","Ništa","Rad sistema za hitno napajanje","Boju generatora","b"),
  Q("maintenance",12,"Šta provjeravaš prije korištenja alata/opreme?","Ništa","Zalihu i ispravnost zaštitne opreme","Cijenu alata","b"),
  Q("maintenance",13,"Šta pomažeš tehnički pripremiti za posebne događaje?","Ništa","Prostor za banket/konferenciju","Meni","b"),
  Q("maintenance",14,"Šta provjeravaš na vanjskim površinama?","Ništa","Parking, prilazne puteve, rasvjetu","Boju asfalta","b"),
  Q("maintenance",15,"Šta provjeravaš prije zatvaranja popravke kao završene?","Ništa","Da je stvarno riješena, ne samo privremeno sanirana","Da je jeftino riješena","b"),
  Q("maintenance",16,"Šta osiguravaš na kraju smjene?","Ništa","Radionicu/skladište alata i materijala","Parking","b"),
  Q("maintenance",17,"Šta predaješ sljedećoj smjeni/menadžeru?","Ništa","Izvještaj o izvršenim i otvorenim popravkama","Ključeve gosta","b"),
  Q("maintenance",18,"Šta provjeravaš vezano za rezervne djelove?","Ništa","Zalihu, prijaviš nedostatke za narudžbu","Boju djelova","b"),
  Q("maintenance",19,"Šta obavljaš prema mjesečnom/sedmičnom rasporedu?","Ništa","Planiranu preventivnu provjeru opreme","Čišćenje soba","b"),
  Q("maintenance",20,"Zašto je preventivno održavanje bitno?","Nije bitno","Smanjuje troškove i produžava vijek opreme","Radi izgleda","b"),

  // 14. VRTLAR
  Q("groundskeeper",1,"Šta provjeravaš prije upotrebe baštenske opreme?","Ništa","Ispravnost i sigurnost (kosilica, trimer)","Boju opreme","b"),
  Q("groundskeeper",2,"Šta provjeravaš na sistemu za zalijevanje?","Ništa","Ispravnost prskalica i raspored","Cijenu vode","b"),
  Q("groundskeeper",3,"Šta radiš sa opalim lišćem i smećem?","Ostavljaš","Uklanjaš sa terena","Sakupljaš za kasnije","b"),
  Q("groundskeeper",4,"Šta provjeravaš na biljkama?","Ništa","Znakove bolesti ili štetočina","Boju listova samo","b"),
  Q("groundskeeper",5,"Šta radiš sa korovom u cvjetnim lijehama?","Ostavljaš","Uklanjaš","Presađuješ ga","b"),
  Q("groundskeeper",6,"Šta provjeravaš na ukrasnim elementima (fontane, rasvjeta)?","Ništa","Stanje i prijaviš kvarove","Boju elemenata","b"),
  Q("groundskeeper",7,"Šta pripremaš prema sezonskom planu?","Ništa posebno","Sezonsko cvijeće/bilje za sadnju","Novi raspored smjena","b"),
  Q("groundskeeper",8,"Šta provjeravaš na stazama za goste sa invaliditetom?","Ništa","Bezbjednost i da nema prepreka","Boju staza","b"),
  Q("groundskeeper",9,"Šta pripremaš za posebne događaje u vrtu?","Ništa","Vanjski prostor (vjenčanja, banketi)","Meni za događaj","b"),
  Q("groundskeeper",10,"Gdje se skladišti baštenski alat i hemikalije?","Zajedno, bilo gdje","Odvojeno, organizovano i obilježeno","U kuhinji","b"),
  Q("groundskeeper",11,"Šta radiš sa vanjskim pokućstvom (stolovi, stolice)?","Ignorišeš","Provjeravaš i čistiš","Premještaš svaki dan","b"),
  Q("groundskeeper",12,"Šta radiš zimi vezano za snijeg/led?","Ništa","Uklanjaš sa staza i prilaza","Čekaš da se otopi","b"),
  Q("groundskeeper",13,"Šta provjeravaš na ogradama i kapijama?","Ništa","Stanje i ispravnost","Boju ograde","b"),
  Q("groundskeeper",14,"Kome odgovaraš na pitanja gosta o vrtu?","Ignorišeš goste","Ljubazno i profesionalno","Šalješ ih menadžeru uvijek","b"),
  Q("groundskeeper",15,"Šta radiš sa travnjakom prema rasporedu?","Ništa","Kosiš, posebno pažljivo oko ivica","Kosiš samo jednom mjesečno","b"),
  Q("groundskeeper",16,"Šta provjeravaš na vanjskim kantama za otpad?","Ništa","Stanje, prikupljaš otpatke s terena","Boju kanti","b"),
  Q("groundskeeper",17,"Šta prihranjuješ prema sezonskom planu?","Ništa","Biljke i travnjak (gnojidba)","Samo cvijeće u žardinjerama","b"),
  Q("groundskeeper",18,"Šta provjeravaš kao finalni korak prije kraja smjene?","Ništa","Vizuelnu urednost cijelog terena","Cijenu alata","b"),
  Q("groundskeeper",19,"Kome prijavljuješ kvarove (irigacija, rasvjeta)?","Niko","Supervizoru/domaru","Gostu","b"),
  Q("groundskeeper",20,"Zašto je vremenska prognoza bitna za planiranje rada?","Nije bitna","Određuje raspored vanjskih poslova (zalijevanje, košenje)","Radi razgovora s gostima","b"),

  // 15. OSOBLJE ZA SPA
  Q("spa_staff",1,"Koliko često se testira hlor i pH u bazenu/jacuzziju?","Jednom sedmično","Minimalno dva puta dnevno","Jednom mjesečno","b"),
  Q("spa_staff",2,"Šta provjeravaš između svaka dva klijenta?","Ništa","Mijenjaš posteljinu i peškire na tretmanskom stolu","Samo ako je vidljivo prljavo","b"),
  Q("spa_staff",3,"Šta dezinfikuješ nakon svakog tretmana?","Ništa","Masažni stol i sve dodirne površine","Samo ruke","b"),
  Q("spa_staff",4,"Šta provjeravaš prije prvog termina u tretmanskoj sobi?","Ništa","Čistoću i spremnost sobe","Cijenu tretmana","b"),
  Q("spa_staff",5,"Koja je maksimalna preporučena temperatura jacuzzija?","Bez ograničenja","Oko 40°C, prema propisanom standardu","60°C","b"),
  Q("spa_staff",6,"Šta provjeravaš na kozmetičkim proizvodima?","Ništa","Rokove trajanja","Boju ambalaže","b"),
  Q("spa_staff",7,"Šta radiš prije svakog novog tretmana/klijenta?","Ništa","Pereš ruke prema standardu","Pitaš za napojnicu","b"),
  Q("spa_staff",8,"Šta provjeravaš kod gosta prije početka tretmana?","Ništa","Zdravstvene kontraindikacije/alergije","Broj telefona","b"),
  Q("spa_staff",9,"Šta provjeravaš tokom tretmana?","Ništa","Reakciju gosta (komfor, temperatura, pritisak)","Vrijeme samo","b"),
  Q("spa_staff",10,"Šta preporučuješ gostu nakon tretmana?","Ništa","Proizvode za njegu kod kuće (profesionalan upselling)","Novi termin obavezno","b"),
  Q("spa_staff",11,"Šta provjeravaš na alatu za tretmane prije korištenja?","Ništa","Dezinfekciju (kamenje, valjci, alati)","Boju alata","b"),
  Q("spa_staff",12,"Šta provjeravaš u svlačionicama?","Ništa","Čistoću i urednost","Broj ormarića","b"),
  Q("spa_staff",13,"Šta zapisuješ vezano za bazen/hemikalije?","Ništa","Dnevni log korištenja","Samo probleme","b"),
  Q("spa_staff",14,"Šta provjeravaš na opremi za vodenu njegu?","Ništa","Ispravnost (hidromasaža, saune, parna kupatila)","Boju opreme","b"),
  Q("spa_staff",15,"Šta radiš ako je hlor ispod propisanog nivoa?","Ignorišeš i nastavljaš rad","Ne otvaraš/koristiš bazen dok se ne korigira","Dodaš više vode","b"),
  Q("spa_staff",16,"Šta provjeravaš nakon tretmana vezano za gosta?","Ništa","Stanje gosta (hidratacija, mirno ustajanje)","Da li je zadovoljan samo","b"),
  Q("spa_staff",17,"Šta provjeravaš u spa zoni vezano za sigurnost?","Ništa","Telefon za hitne slučajeve, prvu pomoć","Broj gostiju","b"),
  Q("spa_staff",18,"Šta naplaćuješ kroz POS sistem?","Ništa, naplata nije tvoj posao","Uslugu tretmana","Samo proizvode","b"),
  Q("spa_staff",19,"Šta pospremaš na kraju smjene?","Ništa","Tretmanske sobe za sljedeći dan","Samo svoj pribor","b"),
  Q("spa_staff",20,"Zašto su strogi higijenski protokoli između klijenata posebno bitni u spa?","Nisu posebno bitni","Direktan fizički kontakt povećava rizik prenosa infekcije","Radi izgleda prostora","b"),
];

// ── Role labels ────────────────────────────────────────────────────────────
const ROLE_LABELS = {
  hotel_manager:      "Menadžer hotela",
  restaurant_manager: "Menadžer restorana",
  executive_chef:     "Glavni kuvar",
  cook:               "Kuvar",
  sous_cook:          "Pomoćni kuvar",
  mixologist:         "Koktel majstor",
  bartender:          "Šanker",
  waiter:             "Konobar",
  busser:             "Servirka",
  housekeeper:        "Sobarica",
  night_security:     "Noćni čuvar",
  cleaner:            "Higijeničarka",
  maintenance:        "Domar",
  groundskeeper:      "Vrtlar",
  spa_staff:          "Osoblje za SPA",
};

// ── Group by role ──────────────────────────────────────────────────────────
const byRole = {};
for (const q of QUIZ_BANK) {
  if (!byRole[q.role]) byRole[q.role] = [];
  byRole[q.role].push({ question: q.question, options: q.options, correct: q.correct });
}

// ── Write to Firestore ─────────────────────────────────────────────────────
async function seed() {
  const batch = db.batch();
  let count = 0;

  for (const [role, questions] of Object.entries(byRole)) {
    const label = ROLE_LABELS[role] || role;
    const ref = db.collection("quizzes").doc(); // auto-ID
    batch.set(ref, {
      title: `${label} — Osnovna pitanja`,
      role,
      timePerQuestion: 60,
      totalTime: 60 * questions.length,
      questions,
      createdBy: "system",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      source: "seed",
    });
    count++;
    console.log(`  queued: ${label} (${questions.length} questions)`);
  }

  await batch.commit();
  console.log(`\nDone — ${count} quizzes written to Firestore.`);
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
