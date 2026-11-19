/*
 * Eurostat hlth_cd_apr — ennetatav suremus (mortalit=PRVT). Lisatud 04.11.2026, vajaduste loendi rea 9
 * („Raviga (ja ennetusega) välditav suremus") põhjal. Sama tabel ja sama ülesehitus
 * mis eurostat-treatable-mortality.js; eraldi rida, et kummalgi näitajal oleks oma KPI ja hinnang.
 * Lehel viidatud Eurostat SDG_03_42 sisaldab samu andmeid (kontrollitud 04.11.2026).
 */
(function (TAI) {
  "use strict";

  var YEARS = ["2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023"];

  var API_URL = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/hlth_cd_apr" +
    "?format=JSON&lang=en&geo=EE&sex=T&icd10=TOTAL&unit=RT&mortalit=PRVT";
  // EL-27 võrdlusrida — sama päring, ainult geo.
  var EU_URL = API_URL.replace("geo=EE", "geo=EU27_2020");

  TAI.registerTable({
    code: "EUROSTAT-PRVT",
    group: "Rahvusvaheline statistika",
    country: "Eesti",
    title: "Ennetatav suremus",
    fullTitle: "Ennetatav suremus, 100 000 elaniku kohta",
    description: "Selliste põhjuste tõttu surnute arv 100 000 elaniku kohta, mida oleks saanud " +
      "tõhusa rahvatervise- ja ennetustegevusega ära hoida — Eesti, 2011–2023.",
    eyebrow: "Eurostat · hlth_cd_apr",

    years: YEARS,
    yearVar: "time",

    seriesVar: "mortalit",
    measureLabel: "Ennetatav suremus",
    unit: "",
    unitLabel: "100 000 elaniku kohta",
    deltaPhrase: "",

    source: {
      label: "Eurostat",
      longLabel: "Eurostat",
      url: "https://ec.europa.eu/eurostat/databrowser/view/hlth_cd_apr/default/table?lang=en"
    },

    vars: {
      time: { label: "Aasta", values: YEARS, labels: YEARS },
      mortalit: {
        label: "Suremuse liik",
        values: ["PRVT"],
        labels: ["Ennetatav"],
        valence: ["negative"]
      }
    },

    filters: [],

    views: {
      trend: true,
      breakdown: null
    },

    queries: function () {
      return { trend: API_URL, reference: EU_URL };
    },

    reference: { label: "EL-27 keskmine" },

    footnotes: [
      "EL-27 keskmine = Eurostati koondnäitaja EU27_2020 (praegused 27 liikmesriiki kogu perioodi ulatuses), " +
        "hall katkendjoon graafikul.",
      "Andmed põhinevad surmapõhjuste registril (mitte küsitlusel) — RHK-10 (ICD-10) järgi kodeeritud " +
        "surma esmase põhjuse alusel, vanusstandarditud määr.",
      "Ennetatav suremus = surmad, mida saaks vältida eelkõige rahvatervise ja esmase ennetusega (nt " +
        "alkoholi- ja tubakaga seotud haigused, õnnetused). Raviga välditav suremus on näidikulaual eraldi rida.",
      "Osa surmapõhjusi on kokkuleppeliselt jagatud pooleks ennetatava ja raviga välditava vahel, seega " +
        "kaks näitajat kokku annavad kogu välditava suremuse.",
      "Metoodika: OECD/Eurostati 2019. aasta välditava suremuse põhjuste nimekiri."
    ]
  });
})(window.TAI);
