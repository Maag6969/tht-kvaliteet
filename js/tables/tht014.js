/*
 * THT014 — Tervishoiutöötajad ametiala ja maakonna järgi (TAI, 2013–2025). Lisatud 04.11.2026 vajaduste loendi
 * rea 12 jätkuna. Sama kaust ja ülesehitus mis THT001; lisaks maakondade võrdlustulp (breakdown).
 *
 * Valikud (04.11.2026):
 *  - Maakond: ainult 15 maakonda + Eesti kokku. API alamread „..Tallinn" ja „..Tartu" (linn) on välja
 *    jäetud, sest maakondade tulpdiagrammil loeks need Harju/Tartu maakonna sees topelt.
 *  - Seeria, Näitaja-filter ja komakohad nagu THT001-s.
 */
(function (TAI) {
  "use strict";

  var YEARS = ["2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023",
               "2024", "2025"];

  TAI.registerTable({
    code: "THT014",
    taiPath: "04THressursid/05Tootajad",
    group: "Eesti statistika",
    country: "Eesti",
    title: "Arstid ja õed maakonniti",
    fullTitle: "Tervishoiutöötajad ametiala ja maakonna järgi",
    description: "Eesti tervishoiuasutustes töötavad arstid, õed ja teised tervishoiutöötajad maakonna " +
      "kaupa, absoluutarvuna või 100 000 elaniku kohta, 2013–2025.",
    eyebrow: "TAI tervisestatistika · THT014",

    years: YEARS,
    yearVar: "Aasta",

    seriesVar: "Tervishoiutöötajate ja täidetud ametikohtade arv",
    measureLabel: "Töötavate isikute arv",
    unit: "",
    unitLabel: "",
    deltaPhrase: "",
    decimals: function (state) { return state["Näitaja"] === "0" ? 0 : 1; },

    vars: {
      Aasta: { label: "Aasta", values: YEARS, labels: YEARS },
      "Tervishoiutöötajate ja täidetud ametikohtade arv": {
        label: "Mõõdik",
        values: ["0"],
        labels: ["Töötavad isikud"],
        valence: ["neutral"]
      },
      Näitaja: {
        label: "Näitaja",
        values: ["1", "0"],
        labels: ["100 000 elaniku kohta", "Absoluutarv"],
        defaultValue: "1"
      },
      Ametiala: {
        label: "Ametiala",
        values: ["0", "1", "2", "3", "4"],
        labels: ["Tervishoiutöötajad kokku", "Arstid", "Õed ja ämmaemandad", "Õed", "Teised tervishoiutöötajad"],
        optionLabels: ["Tervishoiutöötajad kokku", "Arstid", "Õed ja ämmaemandad", "– Õed", "Teised tervishoiutöötajad"],
        defaultValue: "1"
      },
      Maakond: TAI.countyVar()
    },

    filters: ["Ametiala", "Näitaja", "Maakond"],

    views: {
      trend: true,
      breakdown: {
        var: "Maakond",
        title: "Maakondade võrdlus",
        inPhrase: "maakondade lõikes",
        // Koondjoon ainult kordaja puhul: absoluutarvuna on „Eesti kokku" maakondade summa (telg veniks).
        showTotal: function (state) { return state["Näitaja"] !== "0"; }
      }
    },

    /*
     * trend     — kõik aastad, valitud ametiala/näitaja/maakond (vaikimisi arstid, kordaja, Eesti kokku)
     * breakdown — viimane aasta, Eesti kokku + kõik 15 maakonda
     */
    queries: function (state) {
      var cfg = TAI.getTable("THT014");
      return {
        trend: TAI.buildQuery(cfg, TAI.selectionFromState(cfg, state, ["Ametiala", "Näitaja", "Maakond"], {})),
        breakdown: TAI.buildQuery(cfg, TAI.selectionFromState(cfg, state, ["Ametiala", "Näitaja"], {
          Aasta: [TAI.LATEST],
          Maakond: cfg.vars.Maakond.values
        }))
      };
    },

    footnotes: [
      "Andmed kogutakse aruandega „Tervishoiutöötajad“ kõigilt tervishoiuteenuse osutamise tegevusloaga " +
        "asutustelt (administratiivne statistika, mitte küsitlus), novembrikuu seisuga.",
      "Maakond = tervishoiuasutuse asukoht, mitte töötaja ega patsientide elukoht. Harju ja Tartu maakonna " +
        "kõrge kordaja peegeldab piirkondlike ja keskhaiglate paiknemist — need teenindavad ka teiste " +
        "maakondade elanikke.",
      "Üks isik võib töötada mitmes maakonnas või ametialal ja on siis arvestatud igaühes — maakondade " +
        "summa ei pruugi võrduda „Eesti kokku“ väärtusega.",
      "Tallinna ja Tartu linna eraldi read on TAI tabelis endas; siin on need oma maakonna sees."
    ]
  });
})(window.TAI);
