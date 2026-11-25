/*
 * OECD HCQO — Patient Experience (DF_PE) — kulu tõttu ära jäänud arstivisiit / retseptiravim.
 * Lisatud 04.11.2026 (OECD-PE paariline; eraldi tabel, sest suund on vastupidine —
 * suurem osakaal = halvem — ja ühik on % rahvastikust, mitte % patsientidest).
 * Kontrollitud 04.11.2026: arstivisiit 2006–2022 (2022: 12,9%), ravim 2009–2016 + 2019 (2019: 4,1%).
 * Võti erineb OECD-PE omast: AGE "_Z", INCOME_GROUP "_T".
 */
(function (TAI) {
  "use strict";

  var YEARS = ["2006", "2007", "2008", "2009", "2010", "2011", "2012", "2013", "2014", "2015", "2016",
               "2017", "2018", "2019", "2020", "2021", "2022"];

  function url(measure, sex) {
    return "https://sdmx.oecd.org/public/rest/data/OECD.ELS.HD,DSD_HCQO@DF_PE,2.1/" +
      "EST.A." + measure + ".PT_POP._Z." + sex + ".VALUEW._T.?startPeriod=" + YEARS[0] + "&format=jsondata";
  }

  TAI.registerTable({
    code: "OECD-COST",
    group: "Rahvusvaheline statistika",
    country: "Eesti",
    title: "Kulu tõttu ära jäänud arstiabi",
    fullTitle: "Kulu tõttu ära jäänud arstivisiit või retseptiravim",
    description: "Osakaal rahvastikust, kelle arstivisiit jäi viimase 12 kuu jooksul kulu tõttu ära või kes " +
      "jättis kulu tõttu välja kirjutatud ravimi välja ostmata — Eesti, 2006–2022.",
    eyebrow: "OECD · Patient Experience",

    years: YEARS,
    yearVar: "TIME_PERIOD",
    connectGaps: true,

    seriesVar: "UNIT_MEASURE",
    measureLabel: "Kulu tõttu ära jäänud arstiabi osakaal",
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
        values: ["PT_POP"],
        labels: ["Kulu tõttu ära jäänud"],
        valence: ["negative"]     // suurem osakaal = halvem kättesaadavus
      },
      MEASURE: {
        label: "Liik",
        values: ["COSKCOST", "PMSKCOST"],
        labels: ["Arstivisiit", "Retseptiravim"],
        defaultValue: "COSKCOST"
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
      var measure = state.MEASURE || "COSKCOST";
      // Võrdlusel kaks eraldi päringut: OECD API tagastab võtmele „M+F“ ainult osa andmetest (kontrollitud 06.11.2026)
      return { trend: state.compareSexes ? [url(measure, "M"), url(measure, "F")] : url(measure, state.SEX || "_T") };
    },

    footnotes: [
      "Andmed põhinevad küsitlusel (riigi poolt OECD-le esitatud andmed) — vastaja enda hinnang; osakaal on " +
        "arvutatud kogu rahvastikust, mitte ainult arstiabi vajanutest.",
      "Retseptiravimi andmed on Eesti kohta 2009–2016 ja 2019; joon on tõmmatud üle puuduvate aastate ja " +
        "KPI-kaart näitab viimast aastat, mille kohta andmed on.",
      "Sarnane, kuid eri metoodikaga näitaja on Eurostati EU-SILC tabel „Rahuldamata arstiabi vajadus“ " +
        "(põhjus „Liiga kallis“) — numbrid ei pea kattuma.",
      "Väärtus on kaalutud osakaal; OECD avaldab ka usalduspiirid, mida siin ei näidata. OECD API-s pole EL-i " +
        "ega OECD koondrida."
    ]
  });
})(window.TAI);
