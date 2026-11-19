/*
 * Eurostat hlth_silc_08 — Self-reported unmet needs for medical examination by sex, age, main reason
 * declared and income quintile (EU-SILC). Lisatud 04.11.2026: HSPA kandidaat; seob ka
 * „Ravijärjekord" vajadust. Põhjus filtrina (kokku / ootejärjekord / kulu / kaugus)
 * + EL-27 keskmise joon nagu teistel Eurostati tabelitel.
 *
 * 04.11.2026(strateegiline mõõdik HSPA 5-6 „Katmata tervishoiuteenuste vajadusega elanike
 * osakaal sissetuleku järgi"): lisatud sissetulekukvintiil filtrina + kvintiilide tulp + callout-lause
 * madalaima ja kõrgeima kvintiili vahest. Kontrollitud: 2025 QU1 8,3% − QU5 7,2% = 1,1 pp, sama mis
 * kasutaja slaidil. Kõik ekraanil olevad arvud on Eurostati omad; vahe on ainult kahe näidatud arvu lahutis.
 *
 * Päring sõltub filtritest (reason, quant_inc), seega URL koostatakse queries(state)-s. Muud dimensioonid on
 * fikseeritud (sugu kokku, vanus 16+) → vastuses suurusega 1.
 * Kontrollitud 04.11.2026: Eesti 2008–2025; EL-27 alates 2010; ootejärjekord Eestis 2018: 15,0%, 2025: 6,9%.
 */
(function (TAI) {
  "use strict";

  var YEARS = ["2008", "2009", "2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018",
               "2019", "2020", "2021", "2022", "2023", "2024", "2025"];
  var FIXED = "sex=T&age=Y_GE16&unit=PC";   // sugu kokku, vanus 16+, protsent (vt eurostat-silc-common.js)
  TAI.registerTable({
    code: "EUROSTAT-SILC",
    group: "Rahvusvaheline statistika",
    country: "Eesti",
    title: "Rahuldamata arstiabi vajadus",
    fullTitle: "Rahuldamata arstiabi vajadus põhjuse ja sissetuleku järgi",
    description: "16-aastaste ja vanemate osakaal, kes ütlesid, et neil jäi viimase 12 kuu jooksul vajalik " +
      "arstlik läbivaatus või ravi saamata kulu, kauguse või ootejärjekorra tõttu, sissetulekurühmade kaupa — " +
      "Eesti, 2008–2025.",
    eyebrow: "Eurostat · hlth_silc_08",

    years: YEARS,
    yearVar: "time",

    seriesVar: "unit",
    measureLabel: "Rahuldamata arstiabi vajadus",

    source: {
      label: "Eurostat",
      longLabel: "Eurostat (EU-SILC)",
      url: "https://ec.europa.eu/eurostat/databrowser/view/hlth_silc_08/default/table?lang=en"
    },

    vars: {
      time: { label: "Aasta", values: YEARS, labels: YEARS },
      unit: {
        label: "Mõõdik",
        values: ["PC"],
        labels: ["Rahuldamata vajadus"],
        valence: ["negative"]     // suurem osakaal = halvem
      },
      reason: {
        label: "Põhjus",
        values: ["TXP_TFAR_WLIST", "WLIST", "TXP", "TFAR"],
        labels: ["Kulu, kaugus või ootejärjekord kokku", "Ootejärjekord", "Liiga kallis", "Liiga kaugel"],
        defaultValue: "TXP_TFAR_WLIST"
      },
      quant_inc: TAI.silc.quintileVar()
    },

    filters: ["reason", "quant_inc"],
    compare: { quant_inc: "sissetulek" },
    calloutExtraInCompare: true,
    calloutNote: function (model) { return TAI.silc.smallValueNote(model); },

    views: {
      trend: true,
      breakdown: {
        var: "quant_inc",
        title: "Sissetulekukvintiilide võrdlus",
        inPhrase: "sissetulekukvintiilide lõikes"
        // koondjoon („Kokku") jääb: kõigi rühmade osakaal on võrreldav tase, mitte kvintiilide summa
      }
    },

    queries: function (state) {
      var reason = state.reason || "TXP_TFAR_WLIST";
      return TAI.silc.queries("hlth_silc_08", FIXED, { reason: reason }, state);
    },

    reference: { label: "EL-27 keskmine" },

    /* HSPA 5-6: madalaima (QU1) ja kõrgeima (QU5) sissetulekukvintiili vahe viimasel aastal. Ainult kahe
       ekraanil (tulbas) näidatud Eurostati arvu lahutis; HSPA koodi märgitakse ainult põhjuse „Kokku" korral,
       sest strateegiline mõõdik on defineeritud selle järgi (kontrollitud kasutaja slaidi väärtusega 1,1 pp). */
    calloutExtra: function (model, fmt) {
      var g = TAI.silc.gap(model);
      if (!g) return null;
      var isHspa = (model.state.reason || "TXP_TFAR_WLIST") === "TXP_TFAR_WLIST";
      return "Madalaima ja kõrgeima sissetulekukvintiili vahe oli " + g.year + ". aastal " + g.gapText +
        " (" + fmt(g.lo) + " vs " + fmt(g.hi) +
        (g.gap < 0 ? "; kõrgema sissetulekuga rühmas oli osakaal suurem" : "") + ")" +
        (isHspa ? " — strateegiline mõõdik HSPA 5-6, siht 2030: vahe 0." : ".");
    },

    footnotes: [
      "EL-27 keskmine = Eurostati koondnäitaja EU27_2020, hall katkendjoon graafikul (andmed alates 2010); " +
        "sissetulekukvintiili valimisel sama kvintiili EL-27 keskmine. Sissetulekurühmade võrdluse ajal seda ei näidata.",
      "Andmed põhinevad küsitlusel (EU-SILC, leibkonna sissetulekute ja elamistingimuste uuring) — vastaja enda " +
        "hinnang, mitte ravijärjekorra registriandmed.",
      "Osakaal on arvutatud kõigist 16-aastastest ja vanematest, mitte ainult arstiabi vajanutest.",
      "Põhjus = vastaja nimetatud peamine põhjus. „Kulu, kaugus või ootejärjekord kokku“ on Eurostati standardnäitaja, " +
        "mida kasutatakse ka EL-i sotsiaalõiguste samba tulemustabelis.",
      "Sissetulekukvintiil = leibkonna ekvivalentnetosissetuleku viiendik (1. = madalaim 20%, 5. = kõrgeim 20%). " +
        "Kvintiilide vahe (HSPA strateegiline mõõdik 5-6) = 1. kvintiili osakaal miinus 5. kvintiili osakaal; " +
        "vahe on arvutatud kahest siin näidatud Eurostati arvust.",
      "Ainult arstlik läbivaatus/ravi; hambaravi rahuldamata vajadus on Eurostatis eraldi tabelis (hlth_silc_09)."
    ]
  });
})(window.TAI);
