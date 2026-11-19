/*
 * OECD Healthcare Quality and Outcomes (HCQO) — Acute Care — Ischaemic stroke
 * 30-day mortality (in- and out of hospital, linked data). C rühm, näitaja 2.
 * SDMX-JSON API (mitte JSON-stat) — vt TAI.readSdmxJson core.js-is.
 */
(function (TAI) {
  "use strict";

  var YEARS = ["2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023"];

  var API_URL = "https://sdmx.oecd.org/public/rest/data/OECD.ELS.HD,DSD_HCQO@DF_AC,2.1/" +
    "EST.A.MORTISTO.10P2PAT.Y_GE45._T.OBS..?startPeriod=2014&format=jsondata";

  TAI.registerTable({
    code: "OECD-STROKE",
    group: "Rahvusvaheline statistika",
    country: "Eesti",
    title: "Isheemilise insuldi 30-päeva suremus",
    fullTitle: "Isheemilise insuldi 30-päeva suremus (haiglaravi järgselt)",
    description: "Osakaal 45-aastastest ja vanematest patsientidest, kes surid 30 päeva jooksul " +
      "pärast isheemilise insuldiga haiglaravile jõudmist (vanuse-soo standarditud, hõlmab nii " +
      "haiglas kui haiglast väljas toimunud surmasid) — Eesti, 2014–2023.",
    eyebrow: "OECD · Acute Care · MORTISTO",

    years: YEARS,
    yearVar: "TIME_PERIOD",

    seriesVar: "MEASURE",
    measureLabel: "Isheemilise insuldi 30-päeva suremus",
    unit: "%",

    source: {
      label: "OECD",
      longLabel: "OECD",
      url: "https://data-explorer.oecd.org/vis?df[id]=DSD_HCQO%40DF_AC&df[ag]=OECD.ELS.HD&df[vs]=2.1&dq=EST.A.MORTISTO.10P2PAT.Y_GE45._T.OBS..",
      format: "sdmx"
    },

    vars: {
      TIME_PERIOD: { label: "Aasta", values: YEARS, labels: YEARS },
      MEASURE: {
        label: "Näitaja",
        values: ["MORTISTO"],
        labels: ["Isheemilise insuldi 30-päeva suremus"],
        valence: ["negative"]
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
      "OECD andmestikus algavad Eesti isheemilise insuldi andmed 2014. aastast (müokardiinfarktil " +
        "on olemas ka 2012–2013)."
    ]
  });
})(window.TAI);
