/*
 * THT022 — Tervishoiutöötajate riiklikus registris registreeritud tervishoiutöötajad kutse, soo ja
 * vanuserühma järgi (TAI, 2014–2025). Lisatud 04.11.2026: vanuserühmade jaotus — tulp = viimase aasta vanuserühmad, trend = valitud vanuserühm;
 * filtrid kutse ja sugu). Ainult TAI arvud, midagi ei arvutata ise.
 *
 * Mõõdikumuutujat pole (ContentsCode "EliminatedValue") → `responseOnly`, nagu TTO10-s.
 */
(function (TAI) {
  "use strict";

  var YEARS = ["2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025"];

  TAI.registerTable({
    code: "THT022",
    taiPath: "04THressursid/05Tootajad",
    group: "Eesti statistika",
    country: "Eesti",
    title: "Arstid ja õed vanuserühma järgi",
    fullTitle: "Registreeritud tervishoiutöötajad kutse, soo ja vanuserühma järgi",
    description: "Tervishoiutöötajate registris olevad arstid, hambaarstid, õed, ämmaemandad, proviisorid ja " +
      "farmatseudid vanuserühma ja soo kaupa, 31. detsembri seisuga, 2014–2025.",
    eyebrow: "TAI tervisestatistika · THT022",

    years: YEARS,
    yearVar: "Aasta",

    seriesVar: "ContentsCode",
    measureLabel: "Registreeritud tervishoiutöötajate arv",
    unit: "",
    unitLabel: "",
    deltaPhrase: "",
    decimals: 0,

    vars: {
      Aasta: { label: "Aasta", values: YEARS, labels: YEARS },
      ContentsCode: {
        label: "Mõõdik",
        values: ["EliminatedValue"],
        labels: ["Registreeritud tervishoiutöötajad"],
        valence: ["neutral"],
        responseOnly: true
      },
      Kutse: {
        label: "Kutse",
        values: ["0", "1", "2", "3", "4", "5"],
        labels: ["Arst", "Hambaarst", "Õde", "Ämmaemand", "Proviisor", "Farmatseut"],
        defaultValue: "0"
      },
      Sugu: TAI.sexVar(false),
      Vanuserühm: {
        label: "Vanuserühm",
        sliceLabels: ["kokku (20 ja vanemad)"],   // kokku-rida lõikes (teised väärtused nagu labels)
        values: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
        labels: ["Vanuserühmad kokku (20 ja vanemad)", "20–24", "25–29", "30–34", "35–39", "40–44", "45–49",
                 "50–54", "55–59", "60–64", "65 ja vanemad"],
        totalValue: "0"
      }
    },

    filters: ["Kutse", "Sugu", "Vanuserühm"],
    compare: { Sugu: "sugu" },   // vanuserühmi on 10: jooned oleksid loetamatud, need on tulpdiagrammil

    views: {
      trend: true,
      breakdown: {
        var: "Vanuserühm",
        title: "Vanuserühmade jaotus",
        inPhrase: "vanuserühmade lõikes",
        showTotal: false     // kõik vanuserühmad = tulpade summa
      }
    },

    queries: function (state) {
      var cfg = TAI.getTable("THT022");
      return {
        trend: TAI.buildQuery(cfg, TAI.selectionFromState(cfg, state, ["Kutse", "Sugu", "Vanuserühm"], {})),
        breakdown: TAI.buildQuery(cfg, TAI.selectionFromState(cfg, state, ["Kutse", "Sugu"], {
          Aasta: [TAI.LATEST],
          Vanuserühm: cfg.vars.Vanuserühm.values
        }))
      };
    },

    footnotes: [
      "NB: registreeritud ≠ töötavad. Registris on kõik kutse omandanud ja registreeritud isikud, sh need, " +
        "kes ei tööta praegu Eesti tervishoius. Töötavate arv eriala järgi on tabelis THT001.",
      "Andmed 31. detsembri seisuga. Andmeallikas: kuni 2022 tervishoiutöötajate riiklik register, alates " +
        "2022 Tervishoiukorralduse infosüsteem (Terviseamet).",
      "Vanuserühmad on TAI tabelis toodud viieaastaste rühmadena; 65 ja vanemad on üks rühm."
    ]
  });
})(window.TAI);
