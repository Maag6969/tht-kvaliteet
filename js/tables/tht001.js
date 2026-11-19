/*
 * THT001 — Tervishoiutöötajad ameti/eriala järgi (TAI, andmed 2013–2025). Lisatud 04.11.2026
 * vajaduste loendi rea 12 („Andmed arstide ja õdede arvu kohta erialade lõikes") põhjal.
 * Esimene TAI tabel väljaspool 05Uuringud/04PtR kausta → `taiPath` (vt core.js TAI.apiUrl).
 *
 * Valikud (04.11.2026):
 *  - Amet: API-s 114 väärtust; filtris ainult kokku + arstid (44 eriala) + õed (17 liiki) + ämmaemandad,
 *    sest soov puudutas arste ja õdesid. Koodid ja sildid genereeritud GET-metaandmetest; taandega
 *    („– Kardioloog") ainult rippmenüüs (optionLabels), mujal puhas nimi.
 *  - Seeria: ainult „Töötavad isikud" (üks seeria). Täidetud ametikohad on API-s olemas, aga
 *    mitme seeriaga callout eeldab üksteist välistavaid kategooriaid — isikud vs ametikohad seda ei ole.
 *  - Näitaja (absoluutarv / 100 000 elaniku kohta) on filter; seetõttu unitLabel tühi — valitud näitaja
 *    paistab filtri kokkuvõttest, ja staatiline ühikusilt oleks ühe valiku korral vale.
 *  - Breakdown: valitud rühma alamread (arstid 44 / õed 17 / ülemrühmad 3), suurimast väiksemani —
 *    65 tulpa korraga oleks loetamatu.
 */
(function (TAI) {
  "use strict";

  // API metaandmed loetlevad aastaid 2004–2025, aga 2004–2012 väärtused on tühjad (kontrollitud 04.11.2026:
  // nii arstid kokku kui üksikerialad, nii absoluutarv kui kordaja). Seega alates 2013.
  var YEARS = ["2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023",
               "2024", "2025"];

  // Rippmenüü sildid hierarhia-taandega (genereeritud GET-metaandmetest, ".." → "– "); mujal puhtad sildid.
  var AMET_OPTION_LABELS = ["Tervishoiutöötajad kokku", "Arstid", "– Arst-resident", "– Allergoloog-immunoloog või allergoloog",
          "– Anestesioloogia ja intensiivravi arst", "– Dermatoveneroloog", "– Endokrinoloog",
          "– Erakorralise meditsiini arst", "– Erialase spetsialiseerumiseta arst", "– Gastroenteroloog",
          "– Günekoloog", "– Hematoloog", "– Infektsioonhaiguste arst", "– Kardiokirurg", "– Kardioloog",
          "– Kardiovaskulaarkirurg", "– Kliiniline mikrobioloog", "– Kohtuarst-ekspert", "– Kooliarst",
          "– Laboriarst", "– Laste- ja noorukitepsühhiaater", "– Lastekirurg", "– Meditsiinigeneetik",
          "– Muu eriarst", "– Nefroloog", "– Neurokirurg", "– Neuroloog", "– Oftalmoloog",
          "– Onkoloog (kiiritus- ja keemiaravi)", "– Ortopeed", "– Otorinolarüngoloog", "– Patoloog",
          "– Pediaater", "– Perearst", "– Plastikakirurg", "– Psühhiaater", "– Pulmonoloog", "– Radioloog",
          "– Reumatoloog", "– Sisehaiguste arst", "– Taastusarst", "– Torakaalkirurg", "– Töötervishoiuarst",
          "– Uroloog", "– Vaskulaarkirurg", "– Üldkirurg", "Õed", "– Anesteesia-intensiivraviõde",
          "– Diabeediõde", "– Erakorralise meditsiini õde", "– Geriaatriaõde", "– Koduõde", "– Kooliõde",
          "– Lasteõde", "– Muu õenduse tippspetsialist", "– Nakkustõrjeõde", "– Onkoloogiaõde",
          "– Operatsiooniõde", "– Pereõde", "– Psühhiaatriaõde", "– Pulmonoloogiaõde", "– Taastusraviõde",
          "– Töötervishoiuõde", "– Õde (üldõde)", "Ämmaemandad"];

  /*
   * Tulpdiagrammi rühmad (Amet-koodid TAI metaandmetest, 04.11.2026):
   *  - „Arstid" (1) või mõni arstieriala (2–45) → 44 arstieriala;
   *  - „Õed" (55) või mõni õe liik (56–72) → 17 õe liiki;
   *  - „Tervishoiutöötajad kokku" (0) või „Ämmaemandad" (74, alamridu pole) → ülemrühmad arstid/õed/ämmaemandad.
   * Valitud üksik eriala tõstetakse tulbas esile (module.js breakdown.selected).
   */
  function codeRange(from, to) {
    var out = [];
    for (var i = from; i <= to; i++) out.push(String(i));
    return out;
  }
  var DOCTOR_SPECIALTIES = codeRange(2, 45);
  var NURSE_TYPES = codeRange(56, 72);
  var TOP_GROUPS = ["1", "55", "74"];

  function siblingCodes(amet) {
    if (amet === "1" || DOCTOR_SPECIALTIES.indexOf(amet) >= 0) return DOCTOR_SPECIALTIES;
    if (amet === "55" || NURSE_TYPES.indexOf(amet) >= 0) return NURSE_TYPES;
    return TOP_GROUPS;
  }

  TAI.registerTable({
    code: "THT001",
    taiPath: "04THressursid/05Tootajad",
    group: "Eesti statistika",
    country: "Eesti",
    title: "Arstid ja õed eriala järgi",
    fullTitle: "Tervishoiutöötajad ameti ja eriala järgi",
    description: "Eesti tervishoiuasutustes töötavad arstid, õed ja ämmaemandad ameti/eriala kaupa, " +
      "absoluutarvuna või 100 000 elaniku kohta, 2013–2025.",
    eyebrow: "TAI tervisestatistika · THT001",

    years: YEARS,
    yearVar: "Aasta",

    seriesVar: "Tervishoiutöötajate ja täidetud ametikohtade arv",
    measureLabel: "Töötavate isikute arv",
    unit: "",
    unitLabel: "",
    deltaPhrase: "",
    // Absoluutarv (Näitaja "0") on täisarv → 0 komakohta; kordaja 100 000 elaniku kohta → 1 komakoht.
    decimals: function (state) { return state["Näitaja"] === "0" ? 0 : 1; },

    vars: {
      Aasta: { label: "Aasta", values: YEARS, labels: YEARS },
      "Tervishoiutöötajate ja täidetud ametikohtade arv": {
        label: "Mõõdik",
        values: ["0"],
        labels: ["Töötavad isikud"],
        valence: ["neutral"]      // rohkem töötajaid pole iseenesest „parem" ega „halvem"
      },
      Näitaja: {
        label: "Näitaja",
        values: ["1", "0"],
        labels: ["100 000 elaniku kohta", "Absoluutarv"],
        defaultValue: "1"
      },
      Amet: {
        label: "Amet / eriala",
        values: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17",
                 "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33",
                 "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "55", "56", "57", "58",
                 "59", "60", "61", "62", "63", "64", "65", "66", "67", "68", "69", "70", "71", "72", "74"],
        optionLabels: AMET_OPTION_LABELS,
        labels: AMET_OPTION_LABELS.map(function (s) { return s.replace(/^– /, ""); }),
        defaultValue: "1"
      }
    },

    filters: ["Amet", "Näitaja"],

    views: {
      trend: true,
      // tulbas valitud rühma alamread (vt siblingCodes), suurimast väiksemani.
      breakdown: {
        var: "Amet",
        title: "Võrdlus sama rühma sees",
        inPhrase: "sama rühma sees",
        groups: function (state) { return [{ label: null, values: siblingCodes(state.Amet) }]; },
        sort: "desc",
        limit: 15          // 44 arstieriala → vaikimisi 15 suurimat + „Näita kõiki" (ülevaatus 05.11.2026, p 12)
      }
    },

    queries: function (state) {
      var cfg = TAI.getTable("THT001");
      return {
        trend: TAI.buildQuery(cfg, TAI.selectionFromState(cfg, state, ["Amet", "Näitaja"], {})),
        breakdown: TAI.buildQuery(cfg, TAI.selectionFromState(cfg, state, ["Näitaja"], {
          Aasta: [TAI.LATEST],
          Amet: siblingCodes(state.Amet)
        }))
      };
    },

    footnotes: [
      "Andmed kogutakse aruandega „Tervishoiutöötajad“ kõigilt tervishoiuteenuse osutamise tegevusloaga " +
        "asutustelt (administratiivne statistika, mitte küsitlus).",
      "Andmed on novembrikuu seisuga. Varasemad aastad (detsembri lõpu seisuga, kuni 2012) on TAI " +
        "tabelites THT040–THT045 — teistsugune kogumisaeg, seega ühte ritta neid ei panda.",
      "Üks isik võib töötada mitmel ametialal ja on siis arvestatud igaühel neist — eriala- või ametiridade " +
        "summa ei võrdu rea „Tervishoiutöötajad kokku“ väärtusega.",
      "„Muu eriarst“ sisaldab alates 2023. aastast töövõimet hindavaid ekspertarste.",
      "Filtris on ainult arstid, õed ja ämmaemandad; hambaarstid, hooldajad jt on TAI tabelis endas."
    ]
  });
})(window.TAI);
