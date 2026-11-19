/*
 * Eurostat hlth_silc_10 — Self-perceived health by sex, age and income quintile (EU-SILC). Lisatud 04.11.2026
 *: HSPA 5-7 „Oma tervist heaks hindavate täiskasvanute osakaal sissetuleku järgi"
 * (TAI, RTA). Mõõdik = „väga hea või hea" (levels=VG_G). Sissetulekukvintiil filtrina + kvintiilide tulp +
 * EL-27 joon + callout-lause kõrgeima ja madalaima kvintiili vahest.
 * Kontrollitud 04.11.2026: Eesti 2005–2025; 2025 QU1 38,7% vs QU5 77,0%; EL-27 QU1 2025: 57,3%.
 */
(function (TAI) {
  "use strict";

  var YEARS = ["2005", "2006", "2007", "2008", "2009", "2010", "2011", "2012", "2013", "2014", "2015", "2016",
               "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025"];
  var FIXED = "sex=T&age=Y_GE16&unit=PC";   // sugu kokku, vanus 16+, protsent (vt eurostat-silc-common.js)
  TAI.registerTable({
    code: "EUROSTAT-HEALTH-INC",
    group: "Rahvusvaheline statistika",
    country: "Eesti",
    title: "Oma tervist heaks hindavad sissetuleku järgi",
    fullTitle: "Oma tervist heaks või väga heaks hindavad täiskasvanud sissetuleku järgi",
    description: "16-aastaste ja vanemate osakaal, kes hindavad oma tervist heaks või väga heaks, " +
      "sissetulekurühmade kaupa — Eesti, 2005–2025.",
    eyebrow: "Eurostat · hlth_silc_10",

    years: YEARS,
    yearVar: "time",

    seriesVar: "levels",
    measureLabel: "Oma tervist heaks hindavate osakaal",

    source: {
      label: "Eurostat",
      longLabel: "Eurostat (EU-SILC)",
      url: "https://ec.europa.eu/eurostat/databrowser/view/hlth_silc_10/default/table?lang=en"
    },

    vars: {
      time: { label: "Aasta", values: YEARS, labels: YEARS },
      levels: { label: "Hinnang", values: ["VG_G"], labels: ["Hea või väga hea"], valence: ["positive"] },
      quant_inc: TAI.silc.quintileVar()
    },

    filters: ["quant_inc"],
    compare: { quant_inc: "sissetulek" },
    calloutExtraInCompare: true,

    views: {
      trend: true,
      breakdown: { var: "quant_inc", title: "Sissetulekukvintiilide võrdlus", inPhrase: "sissetulekukvintiilide lõikes" }
    },

    queries: function (state) {
      return TAI.silc.queries("hlth_silc_10", FIXED, { levels: "VG_G" }, state);
    },

    reference: { label: "EL-27 keskmine" },

    // HSPA 5-7: kõrgeima ja madalaima kvintiili vahe — kahe tulbas näidatud Eurostati arvu lahutis.
    calloutExtra: function (model, fmt) {
      var g = TAI.silc.gap(model);
      if (!g) return null;
      return "Kõrgeima ja madalaima sissetulekukvintiili vahe oli " + g.year + ". aastal " + g.gapText +
        " (" + fmt(g.hi) + " vs " + fmt(g.lo) + ") — HSPA indikaator 5-7.";
    },

    footnotes: [
      "HSPA indikaator 5-7 „Oma tervist heaks hindavate täiskasvanute osakaal sissetuleku järgi“. Memo järgi " +
        "on allikas TAI; siin Eurostati EU-SILC andmed, sest need on iga-aastased ja kvintiilide kaupa " +
        "(TAI Eesti terviseuuringus ainult 2006 ja 2019 vaesuspiiri järgi, tabel ETU107).",
      TAI.silc.footnotes.reference,
      "Andmed põhinevad küsitlusel (EU-SILC) — vastaja enda hinnang oma tervisele (väga hea või hea).",
      TAI.silc.footnotes.quintile
    ]
  });
})(window.TAI);
