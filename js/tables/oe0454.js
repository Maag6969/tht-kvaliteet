/*
 * OE0454 — Oodatav eluiga sünnimomendil ja elada jäänud aastad soo, vanuserühma ja hariduse järgi (TAI), 2017–2025.
 * Lisatud 04.11.2026: HSPA 5-11 „Oodatav eluiga haridustaseme järgi" (RTA).
 * Vanuserühmast filtris 0 ja 65–69 (nagu OE0452/TE754); haridustasemel pole „kokku" → 3 haridustaseme tulp.
 */
(function (TAI) {
  "use strict";

  var YEARS = ["2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025"];

  TAI.registerTable({
    code: "OE0454",
    familyTitle: "Oodatav eluiga",
    siblings: [{ code: "OE0452", label: "Maakonniti" }, { code: "OE0454", label: "Hariduse järgi" }],   // õdetabelid, vt app.js
    taiPath: "01Rahvastik/05Eluiga",
    group: "Eesti statistika",
    country: "Eesti",
    title: "Oodatav eluiga hariduse järgi",
    fullTitle: "Oodatav eluiga ja elada jäänud aastad soo, vanuserühma ja haridustaseme järgi",
    description: "Oodatav eluiga sünnimomendil ja 65–69-aastaselt elada jäänud aastad haridustaseme kaupa, 2017–2025.",
    eyebrow: "TAI tervisestatistika · OE0454",

    years: YEARS,
    yearVar: "Aasta",

    seriesVar: "ContentsCode",
    measureLabel: "Elada jäänud aastate arv",
    unit: "",
    unitLabel: "aastat",
    deltaPhrase: "aastat",
    decimals: 1,

    vars: {
      Aasta: { label: "Aasta", values: YEARS, labels: YEARS },
      ContentsCode: { label: "Mõõdik", values: ["EliminatedValue"], labels: ["Elada jäänud aastad"],
                      valence: ["positive"], responseOnly: true },
      Haridustase: { label: "Haridustase", values: ["0", "1", "2"],
                     labels: ["Põhiharidus või madalam", "Keskharidus", "Kõrgharidus"], defaultValue: "0" },
      Vanuserühm: { label: "Vanus", values: ["0", "14"],
                    labels: ["Sünnimomendil (oodatav eluiga)", "65–69-aastaselt"], defaultValue: "0" },
      Sugu: TAI.sexVar(true)
    },

    filters: ["Haridustase", "Vanuserühm", "Sugu"],
    compare: { Haridustase: "haridus", "Vanuserühm": "vanus", Sugu: "sugu" },

    views: {
      trend: true,
      breakdown: { var: "Haridustase", title: "Haridustasemete võrdlus", inPhrase: "haridustasemete lõikes" }
    },

    queries: function (state) {
      var cfg = TAI.getTable("OE0454");
      return {
        trend: TAI.buildQuery(cfg, TAI.selectionFromState(cfg, state, ["Haridustase", "Vanuserühm", "Sugu"], {})),
        breakdown: TAI.buildQuery(cfg, TAI.selectionFromState(cfg, state, ["Vanuserühm", "Sugu"], {
          Aasta: [TAI.LATEST], Haridustase: cfg.vars.Haridustase.values
        }))
      };
    },

    footnotes: [
      "HSPA indikaator 5-11 „Oodatav eluiga haridustaseme järgi“ (RTA 2020–2030).",
      "Elada jäänud aastad = mitu aastat inimene antud vanuses keskmiselt veel elab, kui suremus ei muutu; " +
        "vanus 0 = oodatav eluiga sünnimomendil. Haridustase: I taseme (põhiharidus või madalam), II taseme " +
        "(keskharidus), III taseme (kõrgharidus).",
      "Sünnimomendi näitaja haridustaseme järgi on kokkuleppeline (haridus on täiskasvanu tunnus) — vt TAI ja " +
        "Statistikaameti metoodikat. Teised vanuserühmad on TAI tabelis endas."
    ]
  });
})(window.TAI);
