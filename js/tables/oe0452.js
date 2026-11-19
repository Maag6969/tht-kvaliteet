/*
 * OE0452 — Oodatav eluiga sünnimomendil ja elada jäänud aastad soo, vanuserühma ja maakonna järgi (TAI).
 * Lisatud 04.11.2026: HSPA 5-2 „Oodatav eluiga maakondades" (RTA).
 * Kaheaastased perioodid "2006/2007".."2024/2025" (koodid "2007".."2025"). Vanuserühmast on filtris ainult
 * 0 (= oodatav eluiga sünnimomendil) ja 65–69, et tabel vastaks TE753-le; ülejäänud vanused on TAI tabelis.
 * Maakond: „..Tallinn" (784) välja, et maakondade tulbas poleks topelt.
 */
(function (TAI) {
  "use strict";

  var YEAR_CODES = [], YEARS = [];
  for (var y = 2007; y <= 2025; y++) { YEAR_CODES.push(String(y)); YEARS.push((y - 1) + "/" + y); }

  TAI.registerTable({
    code: "OE0452",
    familyTitle: "Oodatav eluiga",
    siblings: [{ code: "OE0452", label: "Maakonniti" }, { code: "OE0454", label: "Hariduse järgi" }],   // õdetabelid, vt app.js
    taiPath: "01Rahvastik/05Eluiga",
    group: "Eesti statistika",
    country: "Eesti",
    title: "Oodatav eluiga maakonniti",
    fullTitle: "Oodatav eluiga ja elada jäänud aastad soo, vanuserühma ja maakonna järgi",
    description: "Oodatav eluiga sünnimomendil ja 65–69-aastaselt elada jäänud aastad maakondade kaupa, " +
      "kaheaastaste perioodide kaupa 2006/2007–2024/2025.",
    eyebrow: "TAI tervisestatistika · OE0452",

    years: YEAR_CODES,
    yearVar: "Aasta",
    periodYears: true,   // kaheaastased perioodid → „perioodil 2024/2025" (module.js TAI.inYear)

    seriesVar: "ContentsCode",
    measureLabel: "Elada jäänud aastate arv",
    unit: "",
    unitLabel: "aastat",
    deltaPhrase: "aastat",
    decimals: 1,

    vars: {
      Aasta: { label: "Periood", values: YEAR_CODES, labels: YEARS },
      ContentsCode: { label: "Mõõdik", values: ["EliminatedValue"], labels: ["Elada jäänud aastad"],
                      valence: ["positive"], responseOnly: true },
      Maakond: TAI.countyVar(),
      Vanuserühm: { label: "Vanus", values: ["0", "14"],
                    labels: ["Sünnimomendil (oodatav eluiga)", "65–69-aastaselt"], defaultValue: "0" },
      Sugu: TAI.sexVar(true)
    },

    filters: ["Maakond", "Vanuserühm", "Sugu"],
    // Vanuse võrdlust pole: TAI-s puudub 65–69-aastaste väärtus „Eesti kokku“ real (kontrollitud 06.11.2026), maakondadel on see olemas
    compare: { Sugu: "sugu" },

    views: {
      trend: true,
      breakdown: { var: "Maakond", title: "Maakondade võrdlus", inPhrase: "maakondade lõikes" }
    },

    queries: function (state) {
      var cfg = TAI.getTable("OE0452");
      return {
        trend: TAI.buildQuery(cfg, TAI.selectionFromState(cfg, state, ["Maakond", "Vanuserühm", "Sugu"], {})),
        breakdown: TAI.buildQuery(cfg, TAI.selectionFromState(cfg, state, ["Vanuserühm", "Sugu"], {
          Aasta: [TAI.LATEST], Maakond: cfg.vars.Maakond.values
        }))
      };
    },

    footnotes: [
      "HSPA indikaator 5-2 „Oodatav eluiga maakondades“ (RTA 2020–2030).",
      "Elada jäänud aastad = mitu aastat inimene antud vanuses keskmiselt veel elab, kui suremus ei muutu; " +
        "vanus 0 = oodatav eluiga sünnimomendil. Arvutatud kahe viimase vaatlusaasta surmade ja keskmise " +
        "rahvaarvu põhjal (periood, nt 2024/2025), et väiksemate rühmade näitajad oleksid usaldusväärsed.",
      "Elukoha määratlus muutus: kuni 2015 ütlus- või registripõhine, 2015–2021 rahvastikuregistri järgi, alates " +
        "2022 partnerlus- ja paiknemisindeksi alusel — see mõjutab perioodide võrreldavust.",
      "Tallinn on Harju maakonna sees; eraldi rida ja teised vanuserühmad on TAI tabelis endas."
    ]
  });
})(window.TAI);
