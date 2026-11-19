/*
 * TE754 — Tervena elada jäänud aastad soo, vanuse ja hariduse järgi (TAI, andmeallikas Statistikaamet), 2017–2025.
 * Lisatud 04.11.2026: HSPA 5-10 „Tervena elada jäänud aastad haridustaseme järgi" (RTA).
 * Haridustasemel pole „kokku" väärtust → filter vaikimisi madalaim haridustase + 3 haridustaseme tulp.
 */
(function (TAI) {
  "use strict";

  var YEARS = ["2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025"];

  TAI.registerTable({
    code: "TE754",
    familyTitle: "Tervena elada jäänud aastad",
    siblings: [{ code: "TE753", label: "Maakonniti" }, { code: "TE754", label: "Hariduse järgi" }],   // õdetabelid, vt app.js
    taiPath: "01Rahvastik/06TEaastad",
    group: "Eesti statistika",
    country: "Eesti",
    title: "Tervena elada jäänud aastad hariduse järgi",
    fullTitle: "Tervena elada jäänud aastad soo, vanuse ja haridustaseme järgi",
    description: "Mitu aastat elab inimene keskmiselt tervena (sünnimomendil või 65–69-aastaselt), " +
      "haridustaseme kaupa, 2017–2025.",
    eyebrow: "TAI tervisestatistika · TE754",

    years: YEARS,
    yearVar: "Aasta",

    seriesVar: "ContentsCode",
    measureLabel: "Tervena elada jäänud aastate arv",
    unit: "",
    unitLabel: "aastat",
    deltaPhrase: "aastat",
    decimals: 1,

    vars: {
      Aasta: { label: "Aasta", values: YEARS, labels: YEARS },
      ContentsCode: { label: "Mõõdik", values: ["EliminatedValue"], labels: ["Tervena elada jäänud aastad"],
                      valence: ["positive"], responseOnly: true },
      Haridustase: { label: "Haridustase", values: ["0", "1", "2"],
                     labels: ["Põhiharidus või madalam", "Keskharidus", "Kõrgharidus"], defaultValue: "0" },
      Vanus: { label: "Vanus", values: ["0", "1"], labels: ["Sünnimomendil", "65–69-aastaselt"], defaultValue: "0" },
      Sugu: TAI.sexVar(true)
    },

    filters: ["Haridustase", "Vanus", "Sugu"],
    compare: { Haridustase: "haridus", Vanus: "vanus", Sugu: "sugu" },

    views: {
      trend: true,
      breakdown: { var: "Haridustase", title: "Haridustasemete võrdlus", inPhrase: "haridustasemete lõikes" }
    },

    queries: function (state) {
      var cfg = TAI.getTable("TE754");
      return {
        trend: TAI.buildQuery(cfg, TAI.selectionFromState(cfg, state, ["Haridustase", "Vanus", "Sugu"], {})),
        breakdown: TAI.buildQuery(cfg, TAI.selectionFromState(cfg, state, ["Vanus", "Sugu"], {
          Aasta: [TAI.LATEST], Haridustase: cfg.vars.Haridustase.values
        }))
      };
    },

    footnotes: [
      "HSPA indikaator 5-10 „Tervena elada jäänud aastad haridustaseme järgi“ (RTA 2020–2030).",
      "Andmeallikas: Statistikaamet (TAI andmebaasis). Haridustase: I taseme (põhiharidus või madalam), " +
        "II taseme (keskharidus), III taseme (kõrgharidus).",
      "Sünnimomendi näitaja haridustaseme järgi on kokkuleppeline (haridus on täiskasvanu tunnus) — vt TAI ja " +
        "Statistikaameti metoodikat."
    ]
  });
})(window.TAI);
