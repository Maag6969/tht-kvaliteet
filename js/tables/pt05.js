/* PT05 — Hinnang arstiabi kättesaadavusele ja kvaliteedile ning tervishoiukorraldusele (2001–2016). */
(function (TAI) {
  "use strict";

  // API annab Aasta koodid "0".."15" (mitte aastaarvud endid) — vt README.md "Kinnitatud API-struktuur".
  var YEAR_CODES = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15"];
  var YEARS = ["2001", "2002", "2003", "2004", "2005", "2006", "2007", "2008",
               "2009", "2010", "2011", "2012", "2013", "2014", "2015", "2016"];

  TAI.registerTable({
    code: "PT05",
    group: "Eesti statistika",
    country: "Eesti",
    title: "Hinnang arstiabile ja tervishoiukorraldusele",
    fullTitle: "Hinnang arstiabi kättesaadavusele ja kvaliteedile ning tervishoiukorraldusele",
    description: "Täiskasvanud elanike hinnang arstiabi kättesaadavusele, kvaliteedile ja " +
      "tervishoiu korraldusele, 2001–2016.",
    eyebrow: "Eesti terviseuuring · PT05",

    years: YEAR_CODES,
    yearVar: "Aasta",

    seriesVar: "Hinnang",
    measureLabel: "Hinnang",

    vars: {
      Aasta: { label: "Aasta", values: YEAR_CODES, labels: YEARS },
      Hinnang: {
        label: "Hinnang",
        values: ["0", "1", "2", "3", "4"],
        labels: ["Hea", "Pigem hea", "Pigem halb", "Halb", "Ei oska öelda"],
        colors: ["var(--hinnang-hea)", "var(--hinnang-pigem-hea)", "var(--hinnang-pigem-halb)",
                 "var(--hinnang-halb)", "var(--hinnang-eos)"],
        valence: ["positive", "positive", "negative", "negative", "neutral"]
      },
      // Kolm eri küsimust ühes tabelis — ei saa "kokku" liita, seega totalValue puudub.
      // Trendivaates näidatakse vaikimisi "Kvaliteet" (defaultValue), kasutaja saab filtrist vahetada.
      Näitaja: {
        label: "Näitaja",
        values: ["0", "1", "2"],
        labels: ["Arstiabi kättesaadavus", "Arstiabi kvaliteet", "Tervishoiukorraldus"],
        defaultValue: "1"
      }
    },

    filters: ["Näitaja"],

    views: {
      trend: true,
      breakdown: {
        var: "Näitaja",
        title: "Kättesaadavuse, kvaliteedi ja korralduse võrdlus",
        inPhrase: "teemade lõikes"
      }
    },

    /*
     * trend     — kõik aastad, üks valitud Näitaja väärtus (vaikimisi "Kvaliteet")
     * breakdown — viimane aasta, kõik kolm Näitaja väärtust kõrvuti
     */
    queries: function (state) {
      var cfg = TAI.getTable("PT05");
      return {
        trend: TAI.buildQuery(cfg, TAI.selectionFromState(cfg, state, ["Näitaja"], {})),
        breakdown: TAI.buildQuery(cfg, TAI.selectionFromState(cfg, state, [], {
          Aasta: [TAI.LATEST],
          Näitaja: cfg.vars.Näitaja.values
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
