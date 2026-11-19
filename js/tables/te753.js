/*
 * TE753 — Tervena elada jäänud aastad soo, vanuse ja maakonna järgi (TAI, andmeallikas Statistikaamet).
 * Lisatud 04.11.2026: HSPA 5-1 „Tervena elada jäänud aastad maakondades" (RTA).
 * Aastakoodid "2007".."2025" = kaheaastased perioodid "2006/2007".."2024/2025". Maakond ja Sugu on
 * eliminatsiooniga muutujad (kood "0" = kokku). Mõõdik = ContentsCode "EliminatedValue" → responseOnly.
 */
(function (TAI) {
  "use strict";

  var YEAR_CODES = [], YEARS = [];
  for (var y = 2007; y <= 2025; y++) { YEAR_CODES.push(String(y)); YEARS.push((y - 1) + "/" + y); }

  TAI.registerTable({
    code: "TE753",
    familyTitle: "Tervena elada jäänud aastad",
    siblings: [{ code: "TE753", label: "Maakonniti" }, { code: "TE754", label: "Hariduse järgi" }],   // õdetabelid, vt app.js
    taiPath: "01Rahvastik/06TEaastad",
    group: "Eesti statistika",
    country: "Eesti",
    title: "Tervena elada jäänud aastad maakonniti",
    fullTitle: "Tervena elada jäänud aastad soo, vanuse ja maakonna järgi",
    description: "Mitu aastat elab inimene keskmiselt tervena (sünnimomendil või 65–69-aastaselt), maakondade " +
      "kaupa, kaheaastaste perioodide kaupa 2006/2007–2024/2025.",
    eyebrow: "TAI tervisestatistika · TE753",

    years: YEAR_CODES,
    yearVar: "Aasta",
    periodYears: true,   // kaheaastased perioodid → „perioodil 2024/2025" (module.js TAI.inYear)

    seriesVar: "ContentsCode",
    measureLabel: "Tervena elada jäänud aastate arv",
    unit: "",
    unitLabel: "aastat",
    deltaPhrase: "aastat",
    decimals: 1,

    vars: {
      Aasta: { label: "Periood", values: YEAR_CODES, labels: YEARS },
      ContentsCode: { label: "Mõõdik", values: ["EliminatedValue"], labels: ["Tervena elada jäänud aastad"],
                      valence: ["positive"], responseOnly: true },
      Maakond: TAI.countyVar({ total: "0", elimination: true }),
      Vanus: { label: "Vanus", values: ["0", "1"], labels: ["Sünnimomendil", "65–69-aastaselt"], defaultValue: "0" },
      Sugu: TAI.sexVar(true)
    },

    filters: ["Maakond", "Vanus", "Sugu"],
    compare: { Vanus: "vanus", Sugu: "sugu" },

    views: {
      trend: true,
      breakdown: { var: "Maakond", title: "Maakondade võrdlus", inPhrase: "maakondade lõikes" }
    },

    queries: function (state) {
      var cfg = TAI.getTable("TE753");
      return {
        trend: TAI.buildQuery(cfg, TAI.selectionFromState(cfg, state, ["Maakond", "Vanus", "Sugu"], {})),
        breakdown: TAI.buildQuery(cfg, TAI.selectionFromState(cfg, state, ["Vanus", "Sugu"], {
          Aasta: [TAI.LATEST], Maakond: cfg.vars.Maakond.values
        }))
      };
    },

    footnotes: [
      "HSPA indikaator 5-1 „Tervena elada jäänud aastad maakondades“ (RTA 2020–2030).",
      "Andmeallikas: Statistikaamet (TAI andmebaasis). Periood (nt 2024/2025) — näitaja on arvutatud kahe " +
        "vaatlusaasta andmete põhjal, et väiksemate maakondade näitajad oleksid usaldusväärsemad.",
      "Rahvaarvu alus: 2012. aastast 2011. a rahvaloendus, varem 2000. a rahvaloendus — see mõjutab aegrea võrreldavust.",
      "Maakond = elukoha maakond; Tallinn on Harju maakonna sees."
    ]
  });
})(window.TAI);
