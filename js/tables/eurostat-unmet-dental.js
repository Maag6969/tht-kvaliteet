/*
 * Eurostat hlth_silc_09 — Self-reported unmet needs for dental examination by sex, age, main reason declared
 * and income quintile (EU-SILC). Lisatud 04.11.2026: HSPA 2-84 „Rahalistel
 * põhjustel katmata hambaravi vajadus" (TAI, RTA). Sama ülesehitus mis eurostat-unmet-needs.js (põhjus ja
 * sissetulekukvintiil filtrina, kvintiilide tulp, EL-27 joon). Vaikimisi põhjus „Liiga kallis" = HSPA 2-84.
 * Kontrollitud 04.11.2026: Eesti 2008–2025, TXP 2025: 4,3%.
 */
(function (TAI) {
  "use strict";

  var YEARS = ["2008", "2009", "2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018",
               "2019", "2020", "2021", "2022", "2023", "2024", "2025"];
  var FIXED = "sex=T&age=Y_GE16&unit=PC";   // sugu kokku, vanus 16+, protsent (vt eurostat-silc-common.js)
  TAI.registerTable({
    code: "EUROSTAT-SILC-DENT",
    group: "Rahvusvaheline statistika",
    country: "Eesti",
    title: "Rahuldamata hambaravi vajadus",
    fullTitle: "Rahuldamata hambaravi vajadus põhjuse ja sissetuleku järgi",
    description: "16-aastaste ja vanemate osakaal, kellel jäi viimase 12 kuu jooksul vajalik hambaravi saamata " +
      "kulu, kauguse või ootejärjekorra tõttu, sissetulekurühmade kaupa — Eesti, 2008–2025.",
    eyebrow: "Eurostat · hlth_silc_09",

    years: YEARS,
    yearVar: "time",

    seriesVar: "unit",
    measureLabel: "Rahuldamata hambaravi vajadus",

    source: {
      label: "Eurostat",
      longLabel: "Eurostat (EU-SILC)",
      url: "https://ec.europa.eu/eurostat/databrowser/view/hlth_silc_09/default/table?lang=en"
    },

    vars: {
      time: { label: "Aasta", values: YEARS, labels: YEARS },
      unit: { label: "Mõõdik", values: ["PC"], labels: ["Rahuldamata vajadus"], valence: ["negative"] },
      reason: {
        label: "Põhjus",
        values: ["TXP", "TXP_TFAR_WLIST", "WLIST", "TFAR"],
        labels: ["Liiga kallis", "Kulu, kaugus või ootejärjekord kokku", "Ootejärjekord", "Liiga kaugel"],
        defaultValue: "TXP"
      },
      quant_inc: TAI.silc.quintileVar()
    },

    filters: ["reason", "quant_inc"],
    compare: { quant_inc: "sissetulek" },
    calloutExtraInCompare: true,
    calloutNote: function (model) { return TAI.silc.smallValueNote(model); },

    views: {
      trend: true,
      breakdown: { var: "quant_inc", title: "Sissetulekukvintiilide võrdlus", inPhrase: "sissetulekukvintiilide lõikes" }
    },

    queries: function (state) {
      var reason = state.reason || "TXP";
      return TAI.silc.queries("hlth_silc_09", FIXED, { reason: reason }, state);
    },

    reference: { label: "EL-27 keskmine" },

    // Madalaima ja kõrgeima kvintiili vahe — ainult kahe tulbas näidatud Eurostati arvu lahutis.
    calloutExtra: function (model, fmt) {
      var g = TAI.silc.gap(model);
      if (!g) return null;
      return "Madalaima ja kõrgeima sissetulekukvintiili vahe oli " + g.year + ". aastal " + g.gapText +
        " (" + fmt(g.lo) + " vs " + fmt(g.hi) + (g.gap < 0 ? "; kõrgema sissetulekuga rühmas oli osakaal suurem" : "") + ").";
    },

    footnotes: [
      "HSPA indikaator 2-84 „Rahalistel põhjustel katmata hambaravi vajadus“ = põhjus „Liiga kallis“, kõik " +
        "sissetulekurühmad (vaikimisi valik).",
      TAI.silc.footnotes.reference,
      "Andmed põhinevad küsitlusel (EU-SILC) — vastaja enda hinnang; osakaal on arvutatud kõigist 16-aastastest ja " +
        "vanematest, mitte ainult hambaravi vajanutest.",
      TAI.silc.footnotes.quintile
    ]
  });
})(window.TAI);
