/*
 * TTO10 — Iseseisvad tervishoiuasutused omaniku liigi, asutuse liigi ja maakonna järgi (TAI, 2005–2025).
 * Lisatud 04.11.2026 vajaduste loendi rea 13 („Tegevuslubade arv ja muutused ajas") ASENDUSNÄITAJANA —
 * tegevuslubade arvu avaandmeid ei leitud. liik filtrina +
 * maakondade tulp, selge silt „asutused, mitte tegevusload".
 *
 * Tabelil pole eraldi mõõdikumuutujat: ainus sisudimensioon on ContentsCode "EliminatedValue", mida
 * päringus ei saa küsida → `responseOnly` (vt core.js TAI.buildQuery).
 * Maakond: 15 maakonda + Eesti; „..Tallinn", „..Tartu" (linn) ja „Eesti Kaitsevägi" on välja jäetud —
 * NB: TTO10 maakonnakoodid erinevad THT014 omadest (nt Ida-Viru 44 vs 45), võetud selle tabeli metaandmetest.
 */
(function (TAI) {
  "use strict";

  var YEARS = ["2005", "2006", "2007", "2008", "2009", "2010", "2011", "2012", "2013", "2014", "2015",
               "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025"];

  // TTO10 maakonnakoodid erinevad teistest TAI tabelitest (vt päis), järjekord sama mis TAI.COUNTY_LABELS
  var COUNTIES = ["37", "39", "44", "49", "51", "57", "59", "65", "67", "70", "74", "78", "82", "84", "86"];

  TAI.registerTable({
    code: "TTO10",
    taiPath: "04THressursid/01TTosutajad",
    group: "Eesti statistika",
    country: "Eesti",
    title: "Tervishoiuasutused liigi järgi",
    fullTitle: "Iseseisvad tervishoiuasutused liigi, omaniku ja maakonna järgi",
    description: "Eestis tegutsevate iseseisvate tervishoiuasutuste arv asutuse liigi, omaniku ja maakonna " +
      "kaupa, 2005–2025. NB: asutuste, mitte tegevuslubade arv.",
    eyebrow: "TAI tervisestatistika · TTO10",

    years: YEARS,
    yearVar: "Aasta",

    seriesVar: "ContentsCode",
    measureLabel: "Tervishoiuasutuste arv",
    unit: "",
    unitLabel: "",
    deltaPhrase: "",
    decimals: 0,

    vars: {
      Aasta: { label: "Aasta", values: YEARS, labels: YEARS },
      ContentsCode: {
        label: "Mõõdik",
        values: ["EliminatedValue"],
        labels: ["Tervishoiuasutused"],
        valence: ["neutral"],
        responseOnly: true
      },
      "Tervishoiuteenuse osutaja liik": {
        label: "Asutuse liik",
        values: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
        labels: ["Tervishoiuasutused kokku", "Haigla", "Perearstiabiasutus", "Eriarstiabiasutus",
                 "Hambaraviasutus", "Kiirabiasutus", "Taastusraviasutus", "Diagnostikaasutus",
                 "Õendusabiasutus", "Iseseisva tugiteenuse asutus", "Muu asutus"],
        totalValue: "0"
      },
      "Omaniku liik": {
        label: "Omanik",
        values: ["0", "1", "2"],
        labels: ["Avalik ja erasektor kokku", "Avalik sektor", "Erasektor"],
        totalValue: "0"
      },
      Maakond: TAI.countyVar({ codes: COUNTIES })
    },

    filters: ["Tervishoiuteenuse osutaja liik", "Omaniku liik", "Maakond"],

    views: {
      trend: true,
      breakdown: {
        var: "Maakond",
        title: "Maakondade võrdlus",
        inPhrase: "maakondade lõikes",
        showTotal: false     // Eesti kokku = maakondade summa, mitte võrreldav tase
      }
    },

    queries: function (state) {
      var cfg = TAI.getTable("TTO10");
      var own = ["Tervishoiuteenuse osutaja liik", "Omaniku liik"];
      return {
        trend: TAI.buildQuery(cfg, TAI.selectionFromState(cfg, state, own.concat(["Maakond"]), {})),
        breakdown: TAI.buildQuery(cfg, TAI.selectionFromState(cfg, state, own, {
          Aasta: [TAI.LATEST],
          Maakond: cfg.vars.Maakond.values
        }))
      };
    },

    footnotes: [
      "NB: see on tervishoiuasutuste, mitte tegevuslubade arv — üks asutus võib omada mitut tegevusluba " +
        "(nt eriarstiabi ja õendusabi). Tegevuslubade arvu kohta tuleb teha päring Terviseametile.",
      "Andmed 31. detsembri seisuga. Maakond = tegevuskoha maakond.",
      "„Eesti kokku“ sisaldab ka Eesti Kaitseväe asutusi, mida maakondade võrdluses pole; Tallinna ja Tartu " +
        "linna eraldi read on TAI tabelis endas.",
      "Iseseisva tugiteenuse asutused (logopeedid, kliinilised psühholoogid, füsioterapeudid) on Terviseametis " +
        "registreeritud alates 1. oktoobrist 2023 — sellest tulenev kasv ei ole uute asutuste teke."
    ]
  });
})(window.TAI);
