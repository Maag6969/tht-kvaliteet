/* PT07 — Rahulolu perearstisüsteemiga, vanuserühma kaupa (2002–2016). */
(function (TAI) {
  "use strict";

  // API annab Aasta koodid "0".."14" (mitte aastaarvud endid) — vt README.md "Kinnitatud API-struktuur".
  var YEAR_CODES = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14"];
  var YEARS = ["2002", "2003", "2004", "2005", "2006", "2007", "2008", "2009",
               "2010", "2011", "2012", "2013", "2014", "2015", "2016"];

  TAI.registerTable({
    code: "PT07",
    group: "Eesti statistika",
    country: "Eesti",
    title: "Rahulolu perearstisüsteemiga vanuse järgi",
    fullTitle: "Rahulolu perearstisüsteemiga vanuse järgi",
    description: "Täiskasvanud elanike rahulolu perearstisüsteemiga, vanuserühma kaupa, 2002–2016.",
    eyebrow: "Eesti terviseuuring · PT07",

    years: YEAR_CODES,
    yearVar: "Aasta",

    seriesVar: "Rahulolu tase",
    measureLabel: "Rahulolu tase",

    vars: {
      Aasta: { label: "Aasta", values: YEAR_CODES, labels: YEARS },
      "Rahulolu tase": {
        label: "Rahulolu tase",
        values: ["0", "1", "2", "3", "4"],
        labels: ["Väga rahul", "Üldiselt rahul", "Üldiselt pole rahul", "Üldse pole rahul", "Ei oska öelda"],
        colors: ["var(--hinnang-hea)", "var(--hinnang-pigem-hea)", "var(--hinnang-pigem-halb)",
                 "var(--hinnang-halb)", "var(--hinnang-eos)"],
        valence: ["positive", "positive", "negative", "negative", "neutral"]
      },
      Vanuserühm: {
        label: "Vanuserühm",
        sliceLabels: ["kokku"],   // kokku-rida lõikes „Vanuserühm: kokku" (teised väärtused nagu labels)
        values: ["0", "1", "2", "3", "4", "5", "6"],
        labels: ["Vanuserühmad kokku", "15-19", "20-29", "30-39", "40-49", "50-59", "60-74"],
        totalValue: "0"
      }
    },

    filters: ["Vanuserühm"],
    compare: { "Vanuserühm": "vanus" },

    views: {
      trend: true,
      breakdown: {
        var: "Vanuserühm",
        title: "Vanuserühmade lõikes",
        inPhrase: "vanuserühmade lõikes"
      }
    },

    /*
     * trend     — kõik aastad, vaikimisi kõik vanuserühmad kokku (kasutaja saab filtrist vahetada)
     * breakdown — viimane aasta, kõik kuus vanuserühma kõrvuti
     */
    queries: function (state) {
      var cfg = TAI.getTable("PT07");
      return {
        trend: TAI.buildQuery(cfg, TAI.selectionFromState(cfg, state, ["Vanuserühm"], {})),
        breakdown: TAI.buildQuery(cfg, TAI.selectionFromState(cfg, state, [], {
          Aasta: [TAI.LATEST],
          Vanuserühm: ["1", "2", "3", "4", "5", "6"]
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
