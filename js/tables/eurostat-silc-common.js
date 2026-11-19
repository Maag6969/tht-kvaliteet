/*
 * Ühised abifunktsioonid kolmele Eurostati EU-SILC tabelile (hlth_silc_08, hlth_silc_09, hlth_silc_10):
 * sissetulekukvintiili muutuja, päringu URL ja kvintiilide vahe arvutus callout-lause jaoks. Lisatud
 * 05.11.2026 (ülevaatuse punkt 6), et kolm tabelit ei kordaks sama koodi. Laadida index.html-is enne neid.
 */
(function (TAI) {
  "use strict";

  var QUINTILES = ["QU1", "QU2", "QU3", "QU4", "QU5"];

  TAI.silc = {
    QUINTILES: QUINTILES,

    // Sissetulekukvintiili muutuja (filter + tulba rühmad). Iga kord uus objekt, et tabelid ei jagaks massiive.
    quintileVar: function () {
      return {
        label: "Sissetulek",
        values: ["TOTAL"].concat(QUINTILES),
        labels: ["Kõik sissetulekurühmad", "1. kvintiil (madalaim sissetulek)", "2. kvintiil", "3. kvintiil",
                 "4. kvintiil", "5. kvintiil (kõrgeim sissetulek)"],
        totalValue: "TOTAL",
        // valitud lõikes „Sissetulek: 1. kvintiil (madalaim)"
        sliceLabels: ["kõik rühmad", "1. kvintiil (madalaim)", "2. kvintiil", "3. kvintiil", "4. kvintiil",
                      "5. kvintiil (kõrgeim)"]
      };
    },

    // Eurostati päringu URL: dataset + fikseeritud parameetrid (nt "sex=T&age=Y_GE16&unit=PC"), riik,
    // lisaparameetrid objektina (nt { reason: "TXP" }) ja kvintiilide loend.
    url: function (dataset, fixed, geo, params, quants) {
      var u = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/" + dataset +
        "?format=JSON&lang=en&" + fixed + "&geo=" + geo;
      Object.keys(params || {}).forEach(function (k) { u += "&" + k + "=" + params[k]; });
      return u + (quants || []).map(function (q) { return "&quant_inc=" + q; }).join("");
    },

    // Kolm päringut, mida iga EU-SILC tabel teeb: Eesti trend, EL-27 joon, Eesti kvintiilide tulp.
    // Sissetulekurühmade võrdlusel (state.compareInc): trend kõigi kvintiilide kohta, EL-27 joont ei näidata.
    queries: function (dataset, fixed, params, state) {
      var u = TAI.silc.url;
      if (state.compareInc) {
        return {
          trend: u(dataset, fixed, "EE", params, QUINTILES),
          breakdown: u(dataset, fixed, "EE", params, ["TOTAL"].concat(QUINTILES))
        };
      }
      var quant = state.quant_inc || "TOTAL";
      return {
        trend: u(dataset, fixed, "EE", params, [quant]),
        reference: u(dataset, fixed, "EU27_2020", params, [quant]),
        breakdown: u(dataset, fixed, "EE", params, ["TOTAL"].concat(QUINTILES))
      };
    },

    /*
     * Madalaima (QU1) ja kõrgeima (QU5) kvintiili väärtused viimaselt aastalt: tulbast või võrdlusel (kus tulpa pole) KPI-kaartidelt.
     * Tagastab { lo, hi, gap: lo − hi, gapText: "x,x protsendipunkti", year: "2025" } või null, kui andmeid pole.
     * Vahe on ainult kahe ekraanil näidatud Eurostati arvu lahutis — uut arvu ei tuletata.
     */
    gap: function (model) {
      var lo, hi, year;
      if (model.comparison) {
        var valueOf = function (code) {
          var i = model.series.map(function (s) { return s.cmpCode; }).indexOf(code);
          return i >= 0 ? model.kpis[i].value : null;
        };
        lo = valueOf("QU1"); hi = valueOf("QU5"); year = model.latest;
      } else {
        var b = model.breakdown;
        if (!b) return null;
        var pick = function (code) {
          var it = b.groups[0].items.filter(function (x) { return x.code === code; })[0];
          return it ? it.values[0] : null;
        };
        lo = pick("QU1"); hi = pick("QU5"); year = b.year;
      }
      if (lo == null || hi == null) return null;
      var gap = lo - hi;
      return {
        lo: lo, hi: hi, gap: gap,
        gapText: TAI.formatValue(Math.abs(gap), "", 1) + " protsendipunkti",
        year: TAI.yearLabel(model.config, year)
      };
    },

    /*
     * Väikeses kirjas märkus kokkuvõtte kastis: kui mõni ekraanil olev viimase aasta väärtus (KPI või tulp)
     * on alla 1%, ei tasu küsitlusandmete nii väikestele erinevustele palju tähendust anda. Muidu märkust pole.
     */
    smallValueNote: function (model) {
      var values = model.kpis.map(function (k) { return k.value; });
      if (model.breakdown) {
        model.breakdown.groups.forEach(function (g) {
          g.items.forEach(function (it) { values = values.concat(it.values); });
        });
      }
      var small = values.some(function (v) { return v != null && v < 1; });
      return small ? "Märkus: osa väärtusi on väga väikesed (alla 1%). Arvud tulevad küsitlusest, seega ei tasu nii väikestele " +
        "erinevustele rühmade või aastate vahel palju tähendust anda." : null;
    },

    footnotes: {
      reference: "EL-27 keskmine = Eurostati koondnäitaja EU27_2020, hall katkendjoon graafikul; " +
        "sissetulekukvintiili valimisel sama kvintiili EL-27 keskmine. Sissetulekurühmade võrdluse ajal seda ei näidata.",
      quintile: "Sissetulekukvintiil = leibkonna ekvivalentnetosissetuleku viiendik (1. = madalaim 20%, " +
        "5. = kõrgeim 20%)."
    }
  };
})(window.TAI);
