/*
 * RA02 — Ravikindlustatute arv ja osatähtsus registreeritud elanikkonnast soo ja maakonna järgi (TAI, andmeallikas
 * Tervisekassa), 2014–2025. Lisatud 04.11.2026: HSPA 5-4 „Ravikindlustusega kaetus" (RTA).
 * Näitaja filtrina (osatähtsus % vaikimisi / arv); koondjoon maakondade tulbas ainult osatähtsuse puhul.
 * Maakond: „..Tallinn" (784), „..Tartu" (793) ja „Maakond teadmata / Eesti aadressita" (999) on välja jäetud.
 */
(function (TAI) {
  "use strict";

  var YEARS = ["2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025"];

  TAI.registerTable({
    code: "RA02",
    taiPath: "04THressursid/12Ravikindlustatud",
    group: "Eesti statistika",
    country: "Eesti",
    title: "Ravikindlustusega kaetus maakonniti",
    fullTitle: "Ravikindlustatute arv ja osatähtsus registreeritud elanikkonnast soo ja maakonna järgi",
    description: "Kui suur osa registreeritud elanikkonnast (sh lapsed ja vanemaealised) on ravikindlustatud, " +
      "maakondade kaupa, aasta lõpu seisuga 2014–2025.",
    eyebrow: "TAI tervisestatistika · RA02",

    years: YEARS,
    yearVar: "Aasta",

    seriesVar: "ContentsCode",
    measureLabel: "Ravikindlustusega kaetus",
    unit: function (state) { return state["Näitaja"] === "0" ? "" : "%"; },   // osatähtsus %, arv ilma ühikuta
    unitLabel: "",
    deltaPhrase: function (state) { return state["Näitaja"] === "0" ? "" : "protsendipunkti"; },
    // osatähtsus (%) 1 komakoht, arv täisarvuna
    decimals: function (state) { return state["Näitaja"] === "0" ? 0 : 1; },

    vars: {
      Aasta: { label: "Aasta", values: YEARS, labels: YEARS },
      ContentsCode: { label: "Mõõdik", values: ["EliminatedValue"], labels: ["Ravikindlustatud"],
                      valence: ["positive"], responseOnly: true },
      Näitaja: { label: "Näitaja", values: ["1", "0"],
                 labels: ["Osatähtsus registreeritud elanikkonnast, %", "Ravikindlustatute arv"], defaultValue: "1" },
      Maakond: TAI.countyVar(),
      Sugu: TAI.sexVar(false)
    },

    filters: ["Näitaja", "Maakond", "Sugu"],
    compare: { Sugu: "sugu" },

    views: {
      trend: true,
      breakdown: {
        var: "Maakond", title: "Maakondade võrdlus", inPhrase: "maakondade lõikes",
        showTotal: function (state) { return state["Näitaja"] !== "0"; }   // arvude puhul on koond = summa
      }
    },

    queries: function (state) {
      var cfg = TAI.getTable("RA02");
      return {
        trend: TAI.buildQuery(cfg, TAI.selectionFromState(cfg, state, ["Näitaja", "Maakond", "Sugu"], {})),
        breakdown: TAI.buildQuery(cfg, TAI.selectionFromState(cfg, state, ["Näitaja", "Sugu"], {
          Aasta: [TAI.LATEST], Maakond: cfg.vars.Maakond.values
        }))
      };
    },

    footnotes: [
      "HSPA indikaator 5-4 „Ravikindlustusega kaetus“ (RTA 2020–2030). Memos on see alakomponendis „Sissetulek“, " +
        "kuid sissetuleku järgi on TAI-s ainult Eesti terviseuuringu küsitlusandmed 2006 ja 2019 (tabel ETU505); " +
        "siin registriandmed maakondade kaupa.",
      "Andmeallikas: Tervisekassa; osatähtsus on arvutatud rahvastikuregistri rahvaarvu põhjal (kogu elanikkond, " +
        "sh lapsed ja vanemaealised), aasta lõpu seisuga.",
      "Kuni 2016 enne haldusreformi kehtinud, alates 2017 uue haldusjaotuse alusel. TAI uuendas 12.02.2026 aastate " +
        "2021–2024 andmeid.",
      "Tallinna ja Tartu linna read ning „Maakond teadmata / Eesti aadressita“ on TAI tabelis endas."
    ]
  });
})(window.TAI);
