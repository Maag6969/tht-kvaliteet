/*
 * HSPA-vaate kaardistus.
 *
 * ALLIKAS: HSPA esitluspäeva memo (02.11.2026), lk 3–4 indikaatorite
 * loendid + lk 4 „Strateegiliste eesmärkide põhimõõdikud". Memo on pilt — see transkribeeriti
 * 04.11.2026 käsitsi; kaardistus on kontrollimata.
 *
 * Ülesehitus: strateegiline eesmärk → komponent → alakomponent → indikaator.
 * Üks rida HSPA-vaates = üks indikaator. `table` + `state` = millise näidikulaua tabeli ja filtri valikuga rida
 * avaneb; `table` puudub → rida on hall ja ei avane (staatus näha).
 *
 * Väljad:
 *   code, title   — HSPA kood ja nimi memo järgi
 *   src           — memos märgitud andmeallikas (TAI / Tervisekassa / SoM / Terviseamet)
 *   rta           — memos „RTA 2020–2030" märge (indikaator on rahvastiku tervise arengukavas)
 *   memo          — memo staatusveerg: "A" = arendamist vajav indikaator, "K" = kirjeldus valmis – ootel,
 *                   "" = staatust pole (määratletud indikaator)
 *   table, state  — näidikulaua tabel ja filtri olek (TAI.getTable koodiga sama)
 *   via           — kui näidikulaual on andmed MUUST allikast kui memos (nt OECD/Eurostat vs TAI) — selgitus
 *   plan          — kui andmeid pole: kust võiks tulla (andmepäring, kohalik andmefail, avatud API kandidaat);
 *                   "?" = järeldus, kinnitamata
 *   strategic     — strateegiliste eesmärkide põhimõõdik (memo lk 4)
 *   data          — andmete olemasolu kontroll:
 *                   { status, src, req } — status: "open" = avaandmetes olemas (saab ehitada), "partial" = osaliselt
 *                   (nt ainult mõni aasta / muu lõige), "request" = avaandmetes pole → päring (req = päringu kood),
 *                   "file" = kohalikust failist (veel lisamata); src = leitud allikas ja ulatus.
 *   hasData       — andmed on teadaolevalt olemas, kuigi memo märgib „arendamist vajav" (2-86, 2-90). Ainult
 *                   info: „arendamist vajav" read on ainult HSPA-tulevikuvaates,
 *                   seega hasData nähtavust praegu ei mõjuta (app.js hspaVisible).
 */
(function (TAI) {
  "use strict";

  var A = "A", K = "K";

  // i(kood, nimi, allikas, rta, memoStaatus, lisad)
  function i(code, title, src, rta, memo, extra) {
    var o = { code: code, title: title, src: src, rta: !!rta, memo: memo || "" };
    Object.keys(extra || {}).forEach(function (k) { o[k] = extra[k]; });
    return o;
  }

  TAI.HSPA = {
    source: "HSPA esitluspäeva memo (02.11.2026), lk 3–4; transkribeeritud 04.11.2026",
    reviewed: false,   // muuda true-ks, kui kasutaja on kaardistuse üle kontrollinud

    memoStatusLabels: { A: "arendamist vajav indikaator", K: "kirjeldus valmis – ootel" },

    goals: [
      { id: "01", title: "Ohutum tervishoid", subtitle: "Välditav kahju tervishoius väheneb" },
      { id: "02", title: "Ühtlasem kvaliteet ja kättesaadavus", subtitle: "Põhjendamatud erinevused ravi kvaliteedis ja kättesaadavuses vähenevad" },
      { id: "03", title: "Inimene keskmes", subtitle: "Inimese kogemus ja patsiendi teekonna järjepidevus paranevad" }
    ],

    // Järjekord = memo järjekord. Iga sektsioon = üks alakomponent (või komponent, kui alakomponenti pole).
    sections: [
      {
        goal: "01", component: "Strateegilised põhimõõdikud", sub: null,
        componentUnknown: true,   // HSPA-tulevikuvaates (komponendi järgi) → „Komponent memos täpsustamata"
        note: "2-20 on memo strateegiliste eesmärkide tabelis (lk 4), aga mitte üheski komponendiloendis — komponent täpsustada.",
        items: [
          i("2-20", "Raviga välditav suremus 100 000 kohta", "HSPA", true /* RTA:  */, "",
            { table: "EUROSTAT-TRT", state: {}, via: "Eurostat (hlth_cd_apr)", strategic: true })
        ]
      },
      {
        goal: "01", component: "Patsiendiohutus ja teenuste kvaliteet", sub: "Patsiendiohutus",
        items: [
          i("2-86", "Elanike hinnangud patsiendiohutusele", "SoM", false, A,
            { plan: "kohalik andmefail (SoM elanikkonnauuring)", strategic: true, hasData: true /* SoM 2025: 6,8 (põhimõõdikute slaid) */ }),
          i("2-87", "Puusa- või põlveliigese vahetamise järgse kopsuemboolia esinemissagedus", "TAI", true, "",
            { plan: "OECD DF_PS (POSTPESP/POSTPESW) — Eesti ridu ei ole (täiskontroll 04.11.2026)",
              data: { status: "request", src: "TAI PxWeb-is pole, OECD-s Eesti ridu pole", req: "P9" } }),
          i("2-88", "Kõhuõõne operatsioonijärgse sepsise esinemissagedus", "TAI", true, "",
            { plan: "OECD DF_PS (POSTSESP/POSTSESW) — Eesti ridu ei ole (täiskontroll 04.11.2026)",
              data: { status: "request", src: "TAI PxWeb-is pole, OECD-s Eesti ridu pole", req: "P9" } }),
          i("2-89", "Sünnitusega seotud massiivse verekaotuse osakaal", "Tervisekassa", false, A, { plan: "P1? (Tervisekassa sünnitusabi indikaator)" }),
          i("2-90", "Sünnitusaegse lahkliharebendi osakaal vaginaalsetest sünnitustest", "TAI", false, A,
            { plan: "AVATUD API OLEMAS: OECD DF_PS OBSTVDWO / OBSTVDWI (obstetric trauma, ilma / instrumendiga), Eesti 2015–2023 — kontrollitud 04.11.2026; ka P1? (Tervisekassa sünnitusabi)", hasData: true }),
          i("2-91", "Enesetappude arv haiglaravis", "TAI", true, "",
            { plan: "Avaandmetes ei leitud (04.11.2026): TAI PxWeb-is ainult kogu rahvastiku suitsiidid (SD35), OECD DF_MH-s haiglaravi-suitsiidi mõõdikut pole — andmed tõenäoliselt TAI-s olemas, vajab päringut",
              data: { status: "request", src: "TAI SD35 = kogu rahvastiku suitsiidid, mitte haiglaravis; surmakoha järgi tabelit pole; VIG12 (tahtlik enesekahjustus toimumise koha järgi) koht ainult kodu/muu/teadmata; psühhiaatria tabelid PKH1–PKH8 ilma suitsiidideta (kontrollitud 04.11.2026)", req: "P9" } }),
          i("2-92", "Haiglanakkuste levimus (% hospitaliseeritutest/hospitaliseerimistest)", "Terviseamet", false, A),
          i("2-93", "Haiglaraviga seotud lamatiste levimus hospitaliseeritute hulgas", "SoM", false, A),
          i("2-94", "Kukkumiste levimus haiglas (% hospitaliseeritutest)", "SoM", false, A)
        ]
      },
      {
        goal: "02", component: "Patsiendiohutus ja teenuste kvaliteet", sub: "Kliiniline tõhusus",
        items: [
          i("2-95", "Välditavad hospitaliseerimised astma tõttu", "TAI", true, "", { table: "OECD-PC", state: { MEASURE: "ADMRASTH" }, via: "OECD (Primary Care)" }),
          i("2-96", "Välditavad hospitaliseerimised diabeedi tõttu", "TAI", true, "", { table: "OECD-PC", state: { MEASURE: "ADMRDBUC" }, via: "OECD (Primary Care)" }),
          i("2-97", "Välditavad hospitaliseerimised kõrgvererõhktõve tõttu", "TAI", true, "",
            { plan: "OECD Primary Care-s Eesti kohta ei leitud",
              data: { status: "request", src: "TAI PxWeb-is defineeritud näitajat pole (ainult haiglaravi põhjuste toorarvud PH1); OECD-s Eesti puudub", req: "P9" } }),
          i("2-98", "Välditavad hospitaliseerimised kroonilise obstruktiivse kopsuhaiguse tõttu", "TAI", false, A, { table: "OECD-PC", state: { MEASURE: "ADMRCOPD" }, via: "OECD (Primary Care)" }),
          i("2-99", "Välditavad hospitaliseerimised südamepuudulikkuse tõttu", "TAI", false, A, { table: "OECD-PC", state: { MEASURE: "ADMRCHFL" }, via: "OECD (Primary Care)" }),
          i("2-100", "Operatsioonijärgselt 30 päeva jooksul erakorralised rehospitaliseerimised – valitud protseduuride/operatsioonide kaupa", "Tervisekassa", false, A, { plan: "P1? (Tervisekassa kirurgia indikaator)", strategic: true }),
          i("2-101", "Riskirühma kuuluvate patsientide sõeluuring kroonilise neeruhaiguse suhtes", "Tervisekassa", false, A, { plan: "P1? (Tervisekassa ravijuhendi seire)" }),
          i("2-102", "Ägeda müokardiinfarkti tõttu hospitaliseeritute kolmekümne päeva järgne suremus", "TAI", true, "", { table: "OECD-AMI", state: {}, via: "OECD (Acute Care)" }),
          i("2-103", "Isheemilise insuldi tõttu hospitaliseeritute kolmekümne päeva järgne suremus", "TAI", true, "", { table: "OECD-STROKE", state: {}, via: "OECD (Acute Care)" }),
          i("2-104", "Hemorraagilise insuldi tõttu hospitaliseeritute kolmekümne päeva järgne suremus", "TAI", false, K, { plan: "OECD Acute Care MORTHSTO (linked), Eesti 2014–2023 — sama muster mis OECD-STROKE",
              data: { status: "open", src: "OECD DF_AC MORTHSTO (haemorrhagic stroke 30 day mortality, linked), Eesti 2014–2023 — kontrollitud 05.11.2026" } }),
          i("2-105", "Operatsioonijärgne 30-päevane suremus – valitud protseduuride/operatsioonide kaupa", "Tervisekassa", false, A, { plan: "P1? (Tervisekassa kirurgia indikaator)" }),
          i("2-106", "Standarditud intensiivravi suremuskordaja", "Tervisekassa", false, A, { plan: "P1? (Tervisekassa intensiivravi indikaator)" }),
          i("2-107", "Keisrilõigete osakaal esmassünnitajate üksiksünnituse korral", "Tervisekassa", true, "",
            { plan: "P1 (Tervisekassa sünnitusabi indikaator, Robson 1+2)",
              data: { status: "partial", src: "TAI SR45: keisrilõigete arv/osakaal kõigist sünnitustest maakonna ja vanuse järgi 1992–; esmassünnitajate üksiksünnituse lõiget (Robson) avaandmetes pole", req: "P1" } }),
          i("2-108", "Antidepressantide tarvitamine täiskasvanute hulgas", "Tervisekassa", false, A),
          i("2-109", "Bensodiasepiinide ja bensodiasepiinisarnaste ainete esmane välja kirjutamine vanemaealistele", "Tervisekassa", false, A, { plan: "P1? (Tervisekassa psühhiaatria indikaator)" }),
          i("2-110", "Bensodiasepiinide ja bensodiasepiinisarnaste ainete esmane pikaajaline tarvitamine", "Tervisekassa", false, A, { plan: "P1? (Tervisekassa psühhiaatria indikaator)" }),
          i("2-111", "Diabeediga inimeste alajäsemete amputatsioonid 100 000 elaniku kohta", "TAI", false, K, { plan: "OECD Primary Care (Eesti ainult 2022–2023)" }),
          i("2-112", "Diabeediga inimeste osakaal, kellele viimase aasta jooksul välja kirjutatud esimese rea ravimid vastavalt ravijuhendile", "Tervisekassa", false, A),
          i("2-113", "Vähipatsientide viie aasta suhteline elumus", "TAI", true, "",
            { data: { status: "request", src: "TAI PxWeb-is ainult haigestumus (PK10–PK40), elumust pole; OECD-s ainult 2014", req: "P9" } }),
          i("2-114", "Kopsuvähi patsientide viie aasta suhteline elumus", "TAI", true, "",
            { data: { status: "request", src: "TAI PxWeb-is ainult haigestumus (PK10–PK40), elumust pole; OECD-s ainult 2014", req: "P9" } }),
          i("2-115", "Jämesoolevähi patsientide viie aasta suhteline elumus", "TAI", false, A),
          i("2-116", "Emakakaelavähi patsientide viie aasta suhteline elumus", "TAI", false, A),
          i("2-117", "Rinnavähi patsientide viie aasta suhteline elumus", "TAI", false, A),
          i("2-118", "Eesnäärmevähi patsientide viie aasta suhteline elumus", "TAI", false, A),
          i("2-119", "Vähihaigete multidistsiplinaarsed konsiiliumid", "TAI", false, A),
          i("2-120", "Antibiootikumide kasutamine elanikkonnas", "Tervisekassa", false, A),
          i("2-121", "Polümedikatsioon 75-aastaste ja vanemate elanike hulgas", "Tervisekassa", false, A)
        ]
      },
      {
        goal: "02", component: "Teenuste kättesaadavus", sub: "Ooteajad",
        items: [
          i("2-67", "Katmata tervishoiuteenuste vajadus pikkade ooteaegade tõttu", "TAI", true, "",
            { table: "EUROSTAT-SILC", state: { reason: "WLIST", quant_inc: "TOTAL" }, via: "Eurostat EU-SILC (hlth_silc_08)" }),
          i("2-68", "Ooteaeg digisaatekirja väljastamisest toimunud vastuvõtuni", "Tervisekassa", false, A, { plan: "P2 (ravijärjekorrad)", strategic: true }),
          i("2-69", "Aegunud digisaatekirjade osakaal kõigist digisaatekirjadest", "Tervisekassa", false, A, { plan: "P2? (ravijärjekorrad)" })
        ]
      },
      {
        goal: "02", component: "Teenuste kättesaadavus", sub: "Õigeaegsus",
        items: [
          i("2-70", "Elanike rahulolu perearstiabi kättesaadavusega", "Tervisekassa", true, "",
            { plan: "Võib olla samas elanikkonnauuringus mis SoM näitajad; vanem lähedane: TAI PT05/PT06 kuni 2016",
              data: { status: "request", src: "Avaandmetes ainult TAI PT05/PT06 kuni 2016", req: "P10" } }),
          i("2-71", "Elanike hinnang perearsti kättesaadavusele väljaspool tööaega", "Tervisekassa", false, A),
          i("2-72", "Aeg esmasest vähikahtlusest vähikeskusesse või vähispetsialisti vastuvõtuni – Rinnavähk", "TAI", false, A),
          i("2-73", "Aeg esmasest vähikahtlusest vähikeskusesse või vähispetsialisti vastuvõtuni – Emakakaelavähk", "TAI", false, A),
          i("2-74", "Aeg esmasest vähikahtlusest vähikeskusesse või vähispetsialisti vastuvõtuni – Jämesoolevähk", "TAI", false, A),
          i("2-75", "Aeg esmasest vähikahtlusest vähikeskusesse või vähispetsialisti vastuvõtuni – Kopsuvähk", "TAI", false, A),
          i("2-76", "Aeg esmasest vähikahtlusest vähikeskusesse või vähispetsialisti vastuvõtuni – Eesnäärmevähk", "TAI", false, A),
          i("2-77", "Isheemilise insuldi juhtude ja patsiente arv, kellele on tehtud revaskularisatsiooni protseduur", "Tervisekassa", false, A, { plan: "P1? (Tervisekassa neuroloogia indikaator)" }),
          i("2-78", "ST segmendi elevatsioonita müokardiinfarkti (NSTEMI) haigete osakaal, kellele tehti koronaarangiograafia 24 tunni jooksul esmasest hospitaliseerimisest", "Tervisekassa", false, A, { plan: "P1? (Tervisekassa kardioloogia indikaator)" }),
          i("2-79", "Reperfusioonravi osakaal ST-segmendi elevatsiooniga müokardiinfarkti (STEMI) haigetel, kellel on tekkinud haiglaeelne viivitus <12 tunni (sümptomite algusest hospitaliseerimiseni)", "Tervisekassa", false, A, { plan: "P1? (Tervisekassa kardioloogia indikaator)" }),
          i("2-80", "Ooteaeg spetsialisti hindamisest kuni puusaliigese vahetuse operatsioonini", "Tervisekassa", false, A),
          i("2-81", "Ooteaeg spetsialisti hindamisest kuni põlveliigese vahetuse operatsioonini", "Tervisekassa", false, A),
          i("2-82", "Ooteaeg spetsialisti hindamisest kuni katarakti operatsioonini", "Tervisekassa", false, A)
        ]
      },
      {
        goal: "02", component: "Teenuste kättesaadavus", sub: "Taskukohasus",
        items: [
          i("2-83", "Rahalistel põhjustel katmata tervishoiuteenuste vajadus", "TAI", true, "",
            { table: "EUROSTAT-SILC", state: { reason: "TXP", quant_inc: "TOTAL" }, via: "Eurostat EU-SILC (hlth_silc_08)" }),
          i("2-84", "Rahalistel põhjustel katmata hambaravi vajadus", "TAI", true, "",
            { table: "EUROSTAT-SILC-DENT", state: { reason: "TXP", quant_inc: "TOTAL" }, via: "Eurostat EU-SILC (hlth_silc_09)",
              data: { status: "open", src: "Eurostat hlth_silc_09 (reason=TXP), Eesti iga-aastane, 2025: 4,3% — sama muster mis EUROSTAT-SILC" } }),
          i("2-85", "Välja ostetud retseptiravimite osakaal kõigist välja kirjutatud retseptidest", "Tervisekassa", false, A)
        ]
      },
      {
        goal: "02", component: "Võrdsus", sub: "Geograafiline piirkond",
        items: [
          i("5-1", "Tervena elada jäänud aastad maakondades", "TAI", true, "",
            { table: "TE753", state: {}, data: { status: "open", src: "TAI TE753 (01Rahvastik/06TEaastad): maakond × sugu, vanus 0 ja 65–69, perioodid 2006/2007–2024/2025" } }),
          i("5-2", "Oodatav eluiga maakondades", "TAI", true, "",
            { table: "OE0452", state: {}, data: { status: "open", src: "TAI OE0452 (01Rahvastik/05Eluiga): maakond × sugu × vanuserühm, perioodid 2006/2007–2024/2025" } }),
          i("5-3", "Oma tervist heaks hindavate täiskasvanute osakaal maakondades", "TAI", true, "",
            { data: { status: "partial", src: "TAI TKU101: maakonniti ainult 2020; TKU04: 5 piirkonda 2004–2024 (iga 2 a); ETU101: piirkonnad 2006/2014/2019", req: "P9" } })
        ]
      },
      {
        goal: "02", component: "Võrdsus", sub: "Sissetulek",
        items: [
          i("5-4", "Ravikindlustusega kaetus", "Tervisekassa", true, "",
            { table: "RA02", state: {}, via: "TAI (andmeallikas Tervisekassa)", data: { status: "open", src: "TAI RA02 (04THressursid/12Ravikindlustatud): ravikindlustatute osatähtsus registreeritud elanikkonnast, maakond × sugu, 2014–2025; sissetuleku järgi ainult ETU505 (2006, 2019)" } }),
          i("5-5", "Pikaajalise terviseprobleemiga elanike osakaal sissetuleku järgi", "TAI", false, K),
          i("5-6", "Katmata tervishoiuteenuste vajadusega elanike osakaal sissetuleku järgi", "TAI", true, "",
            // quant_inc teadlikult mitte: kvintiili valimisel peab 5-6 rida aktiivseks jääma (see ongi mõõdiku sisu)
            { table: "EUROSTAT-SILC", state: { reason: "TXP_TFAR_WLIST" }, via: "Eurostat EU-SILC (hlth_silc_08), kvintiilide tulp + vahe kokkuvõttes", strategic: true }),
          i("5-7", "Oma tervist heaks hindavate täiskasvanute osakaal sissetuleku järgi", "TAI", true, "",
            { table: "EUROSTAT-HEALTH-INC", state: {}, via: "Eurostat EU-SILC (hlth_silc_10)", data: { status: "open", src: "Eurostat hlth_silc_10 (levels=VG_G, kvintiilid), Eesti iga-aastane, 2025: QU1 38,7% vs QU5 77,0%; TAI ETU107 ainult 2006/2019 vaesuspiiri järgi" } }),
          i("5-8", "Katastroofiliste tervishoiukulutustega leibkondade osakaal", "TAI", false, A),
          i("5-9", "Ravimite eest tasumise raskustega leibkondade osakaal", "TAI", false, A)
        ]
      },
      {
        goal: "02", component: "Võrdsus", sub: "Haridus",
        items: [
          i("5-10", "Tervena elada jäänud aastad haridustaseme järgi", "TAI", true, "",
            { table: "TE754", state: {}, data: { status: "open", src: "TAI TE754: haridustase (3) × sugu, vanus 0 ja 65–69, 2017–2025" } }),
          i("5-11", "Oodatav eluiga haridustaseme järgi", "TAI", true, "",
            { table: "OE0454", state: {}, data: { status: "open", src: "TAI OE0454: haridustase (3) × sugu × vanuserühm, 2017–2025" } }),
          i("5-12", "Oma tervist heaks hindavate täiskasvanute osakaal haridustaseme järgi", "TAI", true, "",
            { table: "TKU02", state: {}, data: { status: "open", src: "TAI TKU02 (täiskasvanute tervisekäitumise uuring): haridus (4) × sugu, 1990–2024 iga 2 a; ka Eurostat hlth_silc_02 (iga-aastane)" } })
        ]
      },
      {
        goal: "03", component: "Inimkesksus", sub: "Patsiendi teenusekogemus (PREM)",
        note: "Memos allikas Tervisekassa ja „arendamist vajav“; näidikulaual OECD Eesti andmed kuni 2022 — allikate seos täpsustada HSPA meeskonnaga.",
        items: [
          i("3-18", "Arst pühendab patsiendile piisavalt aega", "Tervisekassa", false, A, { table: "OECD-PE", state: { MEASURE: "HPRTIPAT" }, via: "OECD (Patient Experience)" }),
          i("3-19", "Arst jagab kergesti mõistetavaid selgitusi", "Tervisekassa", false, A, { table: "OECD-PE", state: { MEASURE: "HPREXCLA" }, via: "OECD (Patient Experience)" }),
          i("3-20", "Arst kaasab patsienti hooldust ja ravi puudutavate otsuste tegemisse", "Tervisekassa", false, A, { table: "OECD-PE", state: { MEASURE: "HPRIPDEC" }, via: "OECD (Patient Experience)" }),
          i("3-21", "Arst annab võimaluse esitada küsimusi või tõstatada muresid", "Tervisekassa", false, A, { table: "OECD-PE", state: { MEASURE: "HPRGOASK" }, via: "OECD (Patient Experience)" })
        ]
      },
      {
        goal: "03", component: "Inimkesksus", sub: "Patsiendi hinnang tervisetulemile (PROM)",
        note: "Memos alakomponent on olemas, aga indikaatoreid ei ole loetletud.",
        items: []
      },
      {
        goal: "03", component: "Teenuste integreeritus", sub: null,
        items: [
          i("3-22", "Välditavad spetsialistide vastuvõtud kõrgvererõhktõve tõttu", "Tervisekassa", false, A),
          i("3-23", "Välditavad spetsialistide vastuvõtud diabeedi tõttu", "Tervisekassa", false, A),
          i("3-24", "Perearsti vastuvõtt 30 päeva jooksul pärast hospitaliseerimist ägeda müokardiinfarkti tõttu", "Tervisekassa", true, "",
            { plan: "HSPA 2024: 29% (põhimõõdikute slaid)", strategic: true,
              data: { status: "request", src: "Avaandmetes ei leitud; väärtus on HSPA materjalides (2024: 29%)", req: "P10" } }),
          i("3-25", "Perearsti vastuvõtt 30 päeva jooksul pärast hospitaliseerimist insuldi tõttu", "Tervisekassa", true, "",
            { plan: "HSPA 2024: 19% (põhimõõdikute slaid)", strategic: true,
              data: { status: "request", src: "Avaandmetes ei leitud; väärtus on HSPA materjalides (2024: 19%)", req: "P10" } }),
          i("3-26", "Perearsti vastuvõtt 30 päeva jooksul pärast hospitaliseerimist reieluukaela murru tõttu", "Tervisekassa", false, K),
          i("3-27", "Suremus või rehospitaliseerimine isheemilise insuldi tõttu", "TAI", false, A),
          i("3-28", "Suremus või rehospitaliseerimine südamepuudulikkuse tõttu", "TAI", false, A),
          i("3-29", "Psüühika- ja käitumishäirete tõttu hospitaliseeritute 30 päeva jooksul haiglaravile naasmine", "TAI", false, A, { plan: "P1? (Tervisekassa psühhiaatria indikaator)" }),
          i("3-30", "Vastsündinutele tehtud koduvisiidid", "TAI", false, A),
          i("3-31", "Ägeda müokardiinfarkti puhul statiinide välja kirjutamine haiglast lahkumisel", "Tervisekassa", false, A, { plan: "P1? (Tervisekassa kardioloogia indikaator)" }),
          i("3-32", "Insuldiga patsientide taastusravile suunatute osakaal", "Tervisekassa", false, A, { plan: "P1? (Tervisekassa neuroloogia indikaator)" }),
          i("3-33", "Tööhõives jätkamise ja tööhõivesse naasmise osakaal – valitud krooniliste haiguste puhul", "SoM", false, A)
        ]
      }
    ],

    /* Strateegiliste eesmärkide põhimõõdikud ilma HSPA koodita (memo lk 4, SoM elanikkonnauuring) */
    strategicWithoutCode: [
      { goal: "02", title: "Elanike osakaal, kes peavad kvaliteetset arstiabi võrdselt kättesaadavaks", src: "SoM", plan: "kohalik andmefail (2025: 37%)",
        data: { status: "file", src: "SoM elanikkonnauuring (kohalik fail, veel lisamata)" } },
      { goal: "03", title: "Ravi selgituste arusaadavus ja selged edasised juhised", src: "SoM", plan: "kohalik andmefail (2025: 87% / 85%)",
        data: { status: "file", src: "SoM elanikkonnauuring (kohalik fail, veel lisamata)" } },
      { goal: "03", title: "Patsiendi kaasamine raviotsustesse", src: "SoM", plan: "kohalik andmefail (2025: 69%)",
        data: { status: "file", src: "SoM elanikkonnauuring (kohalik fail, veel lisamata)" } }
    ],

    /* 19.11.2026: kasutuseta. Menüüridade RTA märk tuleb nüüd js/rta.js-ist (RTA põhidokument ja programmid 2026–2029);
       HSPA indikaatorite RTA märge tuleb endiselt nende `rta` väljast. Jäetud ajaloo jaoks (memo märkis selle tabeli RTA-ks). */
    rtaTables: ["EUROSTAT-PRVT"],

    /* Kvaliteediploki koodita tabelid → HSPA-vaate lõppu. Tabel, mida ei ole ei
       ülal ega siin, lisatakse vaates automaatselt rühma „Muud", et uus tabel ei kaoks. */
    other: [
      { label: "Tervisetulemid", tables: ["EUROSTAT-PRVT"] },
      { label: "Kättesaadavus ja taskukohasus (seotud, HSPA koodita)", tables: ["OECD-COST"] },
      { label: "Struktuur: tööjõud", tables: ["THT001", "THT014", "THT022"] },
      { label: "Struktuur: taristu", tables: ["TTO10"] },
      { label: "Varasemad uuringud (kuni 2016)", tables: ["PT01", "PT05", "PT06", "PT07"] }
    ]
  };
})(window.TAI);
