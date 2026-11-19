/* PT01 — Rahulolu kasutatud tervishoiuteenusega, teenuseliigi kaupa (2001–2016). */
(function (TAI) {
  "use strict";

  // API annab Aasta koodid "0".."15" (mitte aastaarvud endid) — vt README.md "Kinnitatud API-struktuur".
  var YEAR_CODES = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15"];
  var YEARS = ["2001", "2002", "2003", "2004", "2005", "2006", "2007", "2008",
               "2009", "2010", "2011", "2012", "2013", "2014", "2015", "2016"];

  TAI.registerTable({
    code: "PT01",
    group: "Eesti statistika",
    country: "Eesti",
    title: "Rahulolu tervishoiuteenustega",
    fullTitle: "Rahulolu kasutatud tervishoiuteenusega",
    description: "Täiskasvanud elanike rahulolu viimati kasutatud tervishoiuteenusega, " +
      "teenuseliigi kaupa, 2001–2016.",
    eyebrow: "Eesti terviseuuring · PT01",

    years: YEAR_CODES,
    yearVar: "Aasta",

    seriesVar: "Rahulolu tase",
    measureLabel: "Rahulolu tase",

    vars: {
      Aasta: { label: "Aasta", values: YEAR_CODES, labels: YEARS },
      "Rahulolu tase": {
        label: "Rahulolu tase",
        values: ["0", "1", "2", "3", "4"],
        labels: ["Väga rahul", "Üldiselt rahul", "Üldiselt ei jäänud rahule", "Üldse ei jäänud rahule", "Ei oska öelda"],
        colors: ["var(--hinnang-hea)", "var(--hinnang-pigem-hea)", "var(--hinnang-pigem-halb)",
                 "var(--hinnang-halb)", "var(--hinnang-eos)"],
        valence: ["positive", "positive", "negative", "negative", "neutral"]
      },
      // Kaheksa eri teenust ühes tabelis — ei saa "kokku" liita, seega totalValue puudub.
      // Trendivaates näidatakse vaikimisi "Perearst" (defaultValue), kasutaja saab filtrist vahetada.
      Teenus: {
        label: "Teenus",
        values: ["0", "1", "2", "3", "4", "5", "6", "7"],
        labels: ["Perearst", "Pereõde", "Eriarst", "Hambaarst", "Haigekassa", "Haigla",
                 "Kiirabibrigaad", "Häirekeskuse operaator"],
        defaultValue: "0"
      }
    },

    filters: ["Teenus"],

    views: {
      trend: true,
      breakdown: {
        var: "Teenus",
        title: "Teenuseliikide võrdlus",
        inPhrase: "teenuseliikide lõikes"
      }
    },

    /*
     * trend     — kõik aastad, üks valitud Teenus väärtus (vaikimisi "Perearst")
     * breakdown — viimane aasta, kõik kaheksa Teenus väärtust kõrvuti
     */
    queries: function (state) {
      var cfg = TAI.getTable("PT01");
      return {
        trend: TAI.buildQuery(cfg, TAI.selectionFromState(cfg, state, ["Teenus"], {})),
        breakdown: TAI.buildQuery(cfg, TAI.selectionFromState(cfg, state, [], {
          Aasta: [TAI.LATEST],
          Teenus: cfg.vars.Teenus.values
        }))
      };
    },

    footnotes: [
      "Andmed põhinevad küsitlusuuringul (Eesti terviseuuring) — tegemist on vastajate enda " +
        "hinnanguga, mitte administratiivse ega kliinilise registriandmega.",
      "Uuring on peatunud — viimased andmed on 2016. aastast, tabelit enam ei uuendata.",
      "Arvestatud on kõiki küsimusele vastanuid, mittevastanud on välja jäetud."
    ]
  });
})(window.TAI);
