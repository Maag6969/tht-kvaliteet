/*
 * OECD Healthcare Quality and Outcomes (HCQO) — Acute Care — Acute myocardial infarction
 * 30-day mortality (in- and out of hospital, linked data). C rühm, näitaja 1.
 * SDMX-JSON API (mitte JSON-stat) — vt TAI.readSdmxJson core.js-is.
 */
(function (TAI) {
  "use strict";

  // OECD SDMX time-koodid ON aastaarvud endid (nagu Eurostatil, erinevalt TAI PT-tabelitest).
  var YEARS = ["2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023"];

  var API_URL = "https://sdmx.oecd.org/public/rest/data/OECD.ELS.HD,DSD_HCQO@DF_AC,2.1/" +
    "EST.A.MORTAMIO.10P2PAT.Y_GE45._T.OBS..?startPeriod=2012&format=jsondata";

  TAI.registerTable({
    code: "OECD-AMI",
    group: "Rahvusvaheline statistika",
    country: "Eesti",
    title: "Müokardiinfarkti 30-päeva suremus",
    fullTitle: "Ägeda müokardiinfarkti 30-päeva suremus (haiglaravi järgselt)",
    description: "Osakaal 45-aastastest ja vanematest patsientidest, kes surid 30 päeva jooksul " +
      "pärast ägeda müokardiinfarktiga haiglaravile jõudmist (vanuse-soo standarditud, hõlmab nii " +
      "haiglas kui haiglast väljas toimunud surmasid) — Eesti, 2012–2023.",
    eyebrow: "OECD · Acute Care · MORTAMIO",

    years: YEARS,
    yearVar: "TIME_PERIOD",

    seriesVar: "MEASURE",
    measureLabel: "Ägeda müokardiinfarkti 30-päeva suremus",
    unit: "%",   // OECD "per 100 patients" == protsent

    source: {
      label: "OECD",
      longLabel: "OECD",
      url: "https://data-explorer.oecd.org/vis?df[id]=DSD_HCQO%40DF_AC&df[ag]=OECD.ELS.HD&df[vs]=2.1&dq=EST.A.MORTAMIO.10P2PAT.Y_GE45._T.OBS..",
      format: "sdmx"
    },

    // Kõik muutujad peale MEASURE/TIME_PERIOD on päringus fikseeritud ühele väärtusele — vt
    // README.md "C rühm" täpsemat API dokumentatsiooni valikute (vanuserühm, ühik) kohta.
    vars: {
      TIME_PERIOD: { label: "Aasta", values: YEARS, labels: YEARS },
      MEASURE: {
        label: "Näitaja",
        values: ["MORTAMIO"],
        labels: ["Ägeda müokardiinfarkti 30-päeva suremus"],
        valence: ["negative"]   // suurem suremus = halvem tulemus
      },
      REF_AREA: { label: "Riik", values: ["EST"], labels: ["Eesti"], totalValue: "EST" },
      FREQ: { label: "Sagedus", values: ["A"], labels: ["Aastane"], totalValue: "A" },
      UNIT_MEASURE: { label: "Ühik", values: ["10P2PAT"], labels: ["100 patsiendi kohta"], totalValue: "10P2PAT" },
      AGE: { label: "Vanuserühm", values: ["Y_GE45"], labels: ["45 ja vanemad"], totalValue: "Y_GE45" },
      SEX: { label: "Sugu", values: ["_T"], labels: ["Kokku"], totalValue: "_T" },
      STATISTICAL_OPERATION: { label: "Andmetüüp", values: ["OBS"], labels: ["Vaadeldud"], totalValue: "OBS" }
    },

    filters: [],

    views: {
      trend: true,
      breakdown: null
    },

    queries: function () {
      return { trend: API_URL };
    },

    footnotes: [
      "Andmed põhinevad haigla väljastusandmetel (registriandmed, mitte küsitlus), seotud " +
        "rahvastikuregistri surmaandmetega, et hõlmata ka haiglast väljas toimunud surmad.",
      "Vanuse-soo standarditud näitaja — võimaldab võrdlust teiste OECD riikidega, kus rahvastiku " +
        "vanuseline koosseis erineb.",
      "Sama OECD andmestik (Acute Care) sisaldab ka „unlinked“ (ainult haigla enda andmetel " +
        "põhinevat, ilma väliste surmadeta) versiooni ja 24-tunni suremust — vaata otse OECD " +
        "andmebaasist, kui vaja võrdlust."
    ]
  });
})(window.TAI);
