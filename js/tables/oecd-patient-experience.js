/*
 * OECD HCQO — Patient Experience (DF_PE) — arsti suhtlemine (variant „arst üldiselt", HPR*).
 * Lisatud 04.11.2026 (kaks tabelit — suhtlemine ↑ parem ja kulu tõttu ärajäänud ↓ parem;
 * „arst üldiselt", mitte „oma arst"; sugu filtrina). Värskem kui TAI PT-tabelid (mis lõppesid 2016).
 * Kontrollitud 04.11.2026: küsitlust pole igal aastal (2017, 2018, 2020 puudu) ja osa näitajaid lõpeb 2019
 * → `connectGaps` (joon üle vaheaastate, KPI = viimane olemasolev aasta, vt module.js).
 * Väärtus = STATISTICAL_OPERATION "VALUEW" (kaalutud väärtus); usalduspiirid on OECD-s eraldi ridadena.
 */
(function (TAI) {
  "use strict";

  var YEARS = ["2008", "2009", "2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018",
               "2019", "2020", "2021", "2022"];

  function url(measure, sex) {
    return "https://sdmx.oecd.org/public/rest/data/OECD.ELS.HD,DSD_HCQO@DF_PE,2.1/" +
      "EST.A." + measure + ".PT_PAT.Y_GE16." + sex + ".VALUEW..?startPeriod=" + YEARS[0] + "&format=jsondata";
  }

  TAI.registerTable({
    code: "OECD-PE",
    group: "Rahvusvaheline statistika",
    country: "Eesti",
    title: "Patsiendikogemus: arsti suhtlemine",
    fullTitle: "Patsiendikogemus: arsti suhtlemine vastuvõtul",
    description: "Osakaal 16-aastastest ja vanematest patsientidest, kes hindasid arsti suhtlemist vastuvõtul " +
      "positiivselt (selgitused, aeg, küsimiste võimalus, kaasamine otsustesse) — Eesti, 2008–2022.",
    eyebrow: "OECD · Patient Experience",

    years: YEARS,
    yearVar: "TIME_PERIOD",
    connectGaps: true,

    seriesVar: "UNIT_MEASURE",
    measureLabel: "Positiivse hinnangu andnud patsientide osakaal",
    unit: "%",

    source: {
      label: "OECD",
      longLabel: "OECD",
      url: "https://data-explorer.oecd.org/vis?df[id]=DSD_HCQO%40DF_PE&df[ag]=OECD.ELS.HD&df[vs]=2.1",
      format: "sdmx"
    },

    vars: {
      TIME_PERIOD: { label: "Aasta", values: YEARS, labels: YEARS },
      UNIT_MEASURE: {
        label: "Mõõdik",
        values: ["PT_PAT"],
        labels: ["Positiivne hinnang"],
        valence: ["positive"]     // suurem osakaal = parem kogemus
      },
      MEASURE: {
        label: "Küsimus",
        values: ["HPREXCLA", "HPRTIPAT", "HPRGOASK", "HPRIPDEC"],
        labels: ["Arst selgitas arusaadavalt", "Arst pühendas piisavalt aega", "Arst andis võimaluse küsida",
                 "Arst kaasas raviotsustesse"],
        defaultValue: "HPREXCLA"
      },
      SEX: { label: "Sugu", values: ["_T", "M", "F"], labels: ["Kokku", "Mehed", "Naised"], totalValue: "_T" }
    },

    filters: ["MEASURE", "SEX"],
    compare: { SEX: "sugu" },

    views: {
      trend: true,
      breakdown: null
    },

    queries: function (state) {
      var measure = state.MEASURE || "HPREXCLA";
      // Võrdlusel kaks eraldi päringut: OECD API tagastab võtmele „M+F“ ainult osa andmetest (kontrollitud 06.11.2026)
      return { trend: state.compareSexes ? [url(measure, "M"), url(measure, "F")] : url(measure, state.SEX || "_T") };
    },

    footnotes: [
      "Andmed põhinevad küsitlusel (riigi poolt OECD-le esitatud patsiendikogemuse andmed) — vastaja enda " +
        "hinnang viimati külastatud arsti kohta, mitte registriandmed.",
      "Küsitlust ei ole tehtud igal aastal (Eesti andmetes puuduvad nt 2017, 2018 ja 2020) ning osa küsimuste " +
        "andmed lõpevad 2019. Joon on tõmmatud üle vaheaastate; punktid näitavad ainult tegelikke andmeaastaid. " +
        "KPI-kaart näitab viimast aastat, mille kohta andmed on.",
      "Väärtus on kaalutud osakaal; OECD avaldab ka usalduspiirid, mida siin ei näidata.",
      "Variant „oma arst / perearst“ on OECD andmebaasis eraldi (Eesti andmed kuni 2019). OECD API-s pole " +
        "EL-i ega OECD koondrida."
    ]
  });
})(window.TAI);
