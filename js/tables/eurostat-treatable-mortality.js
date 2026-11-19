/*
 * Eurostat hlth_cd_apr — Treatable and preventable mortality of residents by cause and sex.
 * C rühm, näitaja 3: "Raviga välditav suremus 100 000 elaniku kohta".
 * Esimene mitte-TAI andmeallikas — GET+query-string API (mitte PxWeb POST), aga JSON-stat v1
 * vorming on TAI.readJsonStat2-ga otse ühilduv (kontrollitud 17.09.2026, vt README.md).
 */
(function (TAI) {
  "use strict";

  // Eurostati time-koodid ON aastaarvud endid (erinevalt TAI PT-tabelitest) — kood == silt.
  var YEARS = ["2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023"];

  var API_URL = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/hlth_cd_apr" +
    "?format=JSON&lang=en&geo=EE&sex=T&icd10=TOTAL&unit=RT&mortalit=TRT";
  // EL-27 võrdlusrida — sama päring, ainult geo.
  var EU_URL = API_URL.replace("geo=EE", "geo=EU27_2020");

  TAI.registerTable({
    code: "EUROSTAT-TRT",
    group: "Rahvusvaheline statistika",
    country: "Eesti",
    title: "Raviga välditav suremus",
    fullTitle: "Raviga välditav suremus, 100 000 elaniku kohta",
    description: "Selliste haiguste ja seisundite tõttu surnute arv 100 000 elaniku kohta, mida " +
      "õigeaegse ja tulemusliku raviga oleks pidanud saama ära hoida — Eesti, 2011–2023.",
    eyebrow: "Eurostat · hlth_cd_apr",

    years: YEARS,
    yearVar: "time",

    seriesVar: "mortalit",
    measureLabel: "Raviga välditav suremus",
    unit: "",                          // pole protsent — number ise ilma sufiksita
    unitLabel: "100 000 elaniku kohta", // pikk ühikukirjeldus päise meta-plaadil (vt TAI.unitText)
    deltaPhrase: "",       // "protsendipunkti" ei sobi määrale; jäta deltatekst ilma ühikusõnata

    source: {
      label: "Eurostat",
      longLabel: "Eurostat",
      url: "https://ec.europa.eu/eurostat/databrowser/view/hlth_cd_apr/default/table?lang=en"
    },

    vars: {
      time: { label: "Aasta", values: YEARS, labels: YEARS },
      // Ainult "Raviga välditav" (TRT) — Eurostat annab samas tabelis ka "Kokku" ja "Ennetatav",
      // aga näidikulauale on valitud ainult see näitaja, mitte kõik kolm korraga.
      mortalit: {
        label: "Suremuse liik",
        values: ["TRT"],
        labels: ["Raviga välditav"],
        valence: ["negative"]      // suurem väärtus = halvem (KPI-noole värvi jaoks)
      }
    },

    filters: [],

    views: {
      trend: true,
      breakdown: null
    },

    // Üks GET-URL kõigi aastate jaoks korraga (Eurostat ei vaja PxWeb-laadset POST-päringu koostamist).
    queries: function () {
      return { trend: API_URL, reference: EU_URL };
    },

    reference: { label: "EL-27 keskmine" },

    footnotes: [
      "EL-27 keskmine = Eurostati koondnäitaja EU27_2020 (praegused 27 liikmesriiki kogu perioodi ulatuses), " +
        "hall katkendjoon graafikul.",
      "Andmed põhinevad surmapõhjuste registril (mitte küsitlusel) — Statistikaameti/Eurostati " +
        "poolt RHK-10 (ICD-10) järgi kodeeritud surma esmase põhjuse alusel.",
      "Ennetatav suremus (samast Eurostati tabelist hlth_cd_apr) on näidikulaual eraldi rida; " +
        "kaks näitajat kokku annavad kogu välditava suremuse.",
      "Metoodika: WHO/OECD/Eurostati kokkulepitud põhjuste nimekiri (vt Eurostati metoodikadokumente)."
    ]
  });
})(window.TAI);
