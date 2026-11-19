/*
 * TKU02 — Hinnang oma käesoleva aja tervisele soo ja hariduse järgi (TAI, Eesti täiskasvanud rahvastiku
 * tervisekäitumise uuring), 1990–2024 iga 2 aasta järel. Lisatud 04.11.2026:
 * HSPA 5-12 „Oma tervist heaks hindavate täiskasvanute osakaal haridustaseme järgi" (RTA).
 * Seeriad = hinnangu kolm astet (nagu PT-tabelitel); haridus filtrina + haridustasemete tulp; „Andmete liik"
 * fikseeritud kaalutud andmetele.
 */
(function (TAI) {
  "use strict";

  var YEARS = ["1990", "1992", "1994", "1996", "1998", "2000", "2002", "2004", "2006", "2008", "2010", "2012",
               "2014", "2016", "2018", "2020", "2022", "2024"];

  TAI.registerTable({
    code: "TKU02",
    taiPath: "05Uuringud/02TKU/01Tervis",
    group: "Eesti statistika",
    country: "Eesti",
    title: "Tervise enesehinnang hariduse järgi",
    fullTitle: "Hinnang oma käesoleva aja tervisele soo ja hariduse järgi",
    description: "Täiskasvanute hinnang oma tervisele (hea või väga hea / keskmine / halb või väga halb) " +
      "haridustaseme kaupa, 1990–2024 iga kahe aasta järel.",
    eyebrow: "TAI tervisekäitumise uuring · TKU02",

    years: YEARS,
    yearVar: "Aasta",

    seriesVar: "Tervise enesehinnang",
    measureLabel: "Tervise enesehinnang",

    vars: {
      Aasta: { label: "Aasta", values: YEARS, labels: YEARS },
      "Tervise enesehinnang": {
        label: "Tervise enesehinnang",
        values: ["0", "1", "2"],
        labels: ["Hea või väga hea", "Keskmine", "Halb või väga halb"],
        colors: ["var(--hinnang-hea)", "var(--hinnang-eos)", "var(--hinnang-halb)"],
        valence: ["positive", "neutral", "negative"]
      },
      "Andmete liik": { label: "Andmete liik", values: ["0"], labels: ["Kaalutud"], defaultValue: "0" },
      Haridus: { label: "Haridus", values: ["0", "1", "2", "3"],
                 labels: ["Kõrgharidus", "Keskharidus", "Keskeriharidus", "Põhiharidus või madalam"], defaultValue: "3" },
      Sugu: TAI.sexVar(false)
    },

    filters: ["Haridus", "Sugu"],
    // haridustasemed madalamast kõrgemani; põhi-, kesk- ja kõrgharidusel sama värv mis TE754-s ja OE0454-s
    compare: {
      Haridus: { kind: "haridus", values: ["3", "1", "2", "0"], colors: ["var(--age-1)", "var(--age-2)", "var(--age-4)", "var(--age-3)"] },
      Sugu: "sugu"
    },

    views: {
      trend: true,
      breakdown: { var: "Haridus", title: "Haridustasemete võrdlus", inPhrase: "haridustasemete lõikes" }
    },

    queries: function (state) {
      var cfg = TAI.getTable("TKU02");
      return {
        trend: TAI.buildQuery(cfg, TAI.selectionFromState(cfg, state, ["Haridus", "Sugu"], {})),
        breakdown: TAI.buildQuery(cfg, TAI.selectionFromState(cfg, state, ["Sugu"], {
          Aasta: [TAI.LATEST], Haridus: cfg.vars.Haridus.values
        }))
      };
    },

    footnotes: [
      "HSPA indikaator 5-12 „Oma tervist heaks hindavate täiskasvanute osakaal haridustaseme järgi“ (RTA 2020–2030) " +
        "= kategooria „Hea või väga hea“.",
      "Andmeallikas: Eesti täiskasvanud rahvastiku tervisekäitumise uuring (küsitlus, iga 2 aasta järel); andmeid " +
        "koondab, analüüsib ja avaldab Tervise Arengu Instituut. Kasutatud on kaalutud andmeid.",
      "Sama näitaja iga-aastaselt ja EL-iga võrreldavalt on ka Eurostatis (EU-SILC, hlth_silc_02) — numbrid ei " +
        "pea kattuma, sest uuringud ja vanuserühmad erinevad."
    ]
  });
})(window.TAI);
