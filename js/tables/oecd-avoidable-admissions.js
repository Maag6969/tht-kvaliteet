/*
 * OECD Healthcare Quality and Outcomes (HCQO) — Primary Care (DF_PC) — välditavad hospitaliseerimised.
 * Lisatud 04.11.2026 (viis näitajat filtris, sugu filtrina).
 * Kontrollitud 04.11.2026: Eesti 2014–2023 kõigil viiel (astma ka 2010–2013, aga ühtse perioodi huvides
 * alates 2014); südamepuudulikkus 2014: 325,6 → 2023: 208,3 100 000 elaniku kohta.
 * SDMX võti: REF_AREA.FREQ.MEASURE.UNIT_MEASURE.AGE.SEX.STATISTICAL_OPERATION.INCOME_GROUP.HEALTH_PROF
 * — päring koostatakse filtri valiku järgi (MEASURE, SEX).
 */
(function (TAI) {
  "use strict";

  var YEARS = ["2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023"];

  function url(measure, sex) {
    return "https://sdmx.oecd.org/public/rest/data/OECD.ELS.HD,DSD_HCQO@DF_PC,2.1/" +
      "EST.A." + measure + ".10P5HB.Y_GE15." + sex + ".OBS..?startPeriod=" + YEARS[0] + "&format=jsondata";
  }

  TAI.registerTable({
    code: "OECD-PC",
    group: "Rahvusvaheline statistika",
    country: "Eesti",
    title: "Välditavad hospitaliseerimised",
    fullTitle: "Välditavad hospitaliseerimised krooniliste haiguste tõttu",
    description: "Haiglaravile võtmised astma, kroonilise obstruktiivse kopsuhaiguse, südamepuudulikkuse ja " +
      "diabeedi tõttu 100 000 15-aastase ja vanema elaniku kohta — seisundid, mille ägenemist hea esmatasandi " +
      "arstiabi aitab vältida. Eesti, 2014–2023.",
    eyebrow: "OECD · Primary Care",

    years: YEARS,
    yearVar: "TIME_PERIOD",

    seriesVar: "UNIT_MEASURE",
    measureLabel: "Välditavate hospitaliseerimiste määr",
    unit: "",
    unitLabel: "100 000 elaniku kohta",
    deltaPhrase: "",

    source: {
      label: "OECD",
      longLabel: "OECD",
      url: "https://data-explorer.oecd.org/vis?df[id]=DSD_HCQO%40DF_PC&df[ag]=OECD.ELS.HD&df[vs]=2.1",
      format: "sdmx"
    },

    vars: {
      TIME_PERIOD: { label: "Aasta", values: YEARS, labels: YEARS },
      UNIT_MEASURE: {
        label: "Mõõdik",
        values: ["10P5HB"],
        labels: ["Hospitaliseerimised"],
        valence: ["negative"]     // rohkem välditavaid hospitaliseerimisi = halvem esmatasandi tulemus
      },
      MEASURE: {
        label: "Haigus",
        values: ["ASCOCOMP", "ADMRASTH", "ADMRCOPD", "ADMRCHFL", "ADMRDBUC"],
        labels: ["Astma ja KOK", "Astma", "Krooniline obstruktiivne kopsuhaigus (KOK)", "Südamepuudulikkus", "Diabeet"],
        defaultValue: "ASCOCOMP"
      },
      SEX: { label: "Sugu", values: ["_T", "M", "F"], labels: ["Mehed ja naised", "Mehed", "Naised"], totalValue: "_T" }
    },

    filters: ["MEASURE", "SEX"],
    compare: { SEX: "sugu" },

    views: {
      trend: true,
      breakdown: null
    },

    queries: function (state) {
      var measure = state.MEASURE || "ASCOCOMP";
      // Võrdlusel kaks eraldi päringut: OECD API tagastab võtmele „M+F“ ainult osa andmetest (kontrollitud 06.11.2026)
      return { trend: state.compareSexes ? [url(measure, "M"), url(measure, "F")] : url(measure, state.SEX || "_T") };
    },

    footnotes: [
      "Hospitaliseerimised seisundite tõttu, mille ägenemist ja haiglasse jõudmist saab tõhusa esmatasandi " +
        "arstiabiga (perearst, pereõde, krooniliste haigete jälgimine) suures osas vältida — rahvusvaheline " +
        "esmatasandi kvaliteedi kaudne mõõdik, mitte haiglaravi kvaliteedi näitaja.",
      "Määr 100 000 15-aastase ja vanema elaniku kohta OECD metoodika järgi (vt OECD metaandmeid " +
        "standardimise kohta). Andmed põhinevad haiglaravi väljastusandmetel (registriandmed, mitte küsitlus).",
      "2020.–2021. aasta langust tuleb tõlgendada ettevaatlikult: COVID-19 pandeemia ajal muutus haiglaravi " +
        "kasutamine üldiselt, mitte ainult esmatasandi töö tõttu.",
      "Astma kohta on OECD andmebaasis Eesti andmed ka 2010–2013; diabeedi amputatsioonid ainult 2022–2023 " +
        "(siin ei näidata). OECD API-s pole EL-i ega OECD koondrida, seega rahvusvahelist keskmist ei kuvata."
    ]
  });
})(window.TAI);
