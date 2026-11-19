/* PT06 — Rahulolu perearstisüsteemiga, soo kaupa (2002–2016). */
(function (TAI) {
  "use strict";

  // API annab Aasta koodid "0".."14" (mitte aastaarvud endid) — vt README.md "Kinnitatud API-struktuur".
  var YEAR_CODES = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14"];
  var YEARS = ["2002", "2003", "2004", "2005", "2006", "2007", "2008", "2009",
               "2010", "2011", "2012", "2013", "2014", "2015", "2016"];

  TAI.registerTable({
    code: "PT06",
    group: "Eesti statistika",
    country: "Eesti",
    title: "Rahulolu perearstisüsteemiga",
    fullTitle: "Rahulolu perearstisüsteemiga soo järgi",
    description: "Täiskasvanud elanike rahulolu perearstisüsteemiga, soo kaupa, 2002–2016.",
    eyebrow: "Eesti terviseuuring · PT06",

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
      Sugu: TAI.sexVar(false)
    },

    filters: ["Sugu"],
    compare: { Sugu: "sugu" },

    views: {
      trend: true,
      breakdown: {
        var: "Sugu",
        title: "Soo lõikes",
        inPhrase: "soo lõikes"
      }
    },

    /*
     * trend     — kõik aastad, vaikimisi "Mehed ja naised" kokku (kasutaja saab filtrist vahetada)
     * breakdown — viimane aasta, mehed ja naised kõrvuti
     */
    queries: function (state) {
      var cfg = TAI.getTable("PT06");
      return {
        trend: TAI.buildQuery(cfg, TAI.selectionFromState(cfg, state, ["Sugu"], {})),
        breakdown: TAI.buildQuery(cfg, TAI.selectionFromState(cfg, state, [], {
          Aasta: [TAI.LATEST],
          Sugu: ["1", "2"]
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
