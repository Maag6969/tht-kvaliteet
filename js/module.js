/*
 * Mooduli sisu: andmemudel, KPI-kaardid, automaatne callout, graafikud ja andmetabel.
 * Sõltub core.js-ist.
 */
(function (TAI) {
  "use strict";

  var esc = TAI.escapeHtml;
  var SVG_NS = "http://www.w3.org/2000/svg";

  /* Aastakood → kuvatav aastaarv. Kõikjal, kus API kasutab aasta jaoks järjekorranumbrilist koodi
     (nt PT05: "0".."15", mitte "2001".."2016" — vt README.md „Kinnitatud API-struktuur"), erineb
     query jaoks kasutatav kood kuvatavast sildist. `config.years` hoiab KOODE (query jaoks); see
     abifunktsioon annab vastava sildi (Aasta muutuja `labels`-ist, vt TAI.labelOf). Avalik (mitte
     ainult moodulisisene), sest ka js/app.js peab aastaid kuvama (meta-rida, graafiku pealdis). */
  TAI.yearLabel = function (config, code) { return TAI.labelOf(config, config.yearVar, code); };
  var yl = TAI.yearLabel;

  /* „2025. aastal" / „võrreldes 2024. aastaga" — või config.periodYears korral (kaheaastased perioodid, nt
     TAI TE753/OE0452 „2024/2025") „perioodil 2024/2025" / „võrreldes perioodiga 2023/2024" (04.11.2026). */
  TAI.inYear = function (config, code) {
    return config.periodYears ? "perioodil " + yl(config, code) : yl(config, code) + ". aastal";
  };
  TAI.vsYear = function (config, code) {
    return config.periodYears ? "perioodiga " + yl(config, code) : yl(config, code) + ". aastaga";
  };

  /* "2011–2023" (või "2011", kui üks aasta) — vt allpool, miks mitte iga aastat eraldi loetleda. */
  TAI.yearRangeLabel = function (config) {
    var years = config.years;
    var first = yl(config, years[0]);
    var last = TAI.lastYear(config).label;   // arvestab ka kerget viimase aasta kontrolli (config.latest), vt core.js
    if (years.length <= 1 && last === first) return first;
    return first + "–" + last;
  };

  /*
   * Kas tabeli seeriatel (config.vars[seriesVar].valence) on ÜHINE tähendus, mille põhjal saab
   * öelda "suurem number = parem/halvem tulemus"? Tagastab "positive"/"negative", kui kõik
   * mitte-neutraalsed seeriad jagavad sama valentsi, muidu null (segane või kõik neutraalsed —
   * nt hinnanguskaala, kus mõni seeria on hea, mõni halb; sel juhul näitab seda juba iga seeria
   * enda värv/KPI-noole värv, mitte üks ühine graafikusilt).
   */
  TAI.dominantValence = function (config) {
    var v = config.vars[config.seriesVar];
    var vals = (v.valence || []).filter(function (x) { return x && x !== "neutral"; });
    if (!vals.length) return null;
    var first = vals[0];
    return vals.every(function (x) { return x === first; }) ? first : null;
  };

  /* "↓ väiksem = parem" / "↑ suurem = parem" — ainult siis, kui dominantValence annab selge vastuse. */
  TAI.directionHint = function (config) {
    var dv = TAI.dominantValence(config);
    if (dv === "negative") return "↓ väiksem = parem";
    if (dv === "positive") return "↑ suurem = parem";
    return null;
  };

  /* Varutoonid seeriale, kui tabeli config.vars[seriesVar].colors puudub. Tabelid, kus seeria on
     hinnanguskaala (nt Hinnang, Rahulolu tase), määravad omad, tähendusega sobivad toonid ise. */
  var DEFAULT_PALETTE = ["var(--series-1)", "var(--series-2)"];

  // Üheseerialise tulpdiagrammi värvid (drawBarChart). Puudus M3-s, kuigi drawBarChart neid kasutas —
  // ükski varasem M3 tabel ei jõudnud sellesse harru (PT-tabelitel mitu seeriat, Eurostat/OECD-l
  // breakdown puudub). Taastatud 04.11.2026 THT014 lisamisel samade väärtustega mis vt-startpage'is.
  var COLORS = {
    selected: "var(--som-tumesinine)",
    bar: "var(--som-keskmine-sinine)"
  };

  // ---- andmemudel ---------------------------------------------------

  /**
   * Seeriad: config.seriesVar KÕIK väärtused (nt Hinnang skaala 5 astet, või Distress 2 astet).
   * See on ainus koht, mis "mitu paralleelset joont/tulpa" tähendab — suvaline muutuja, mitte
   * ainult Sugu. Iga väärtus võib vars[]-is kanda oma värvi (`colors`) ja tähendust (`valence`:
   * "positive"/"negative"/"neutral" — mõjutab KPI trendinoole värvi, vt renderKpis).
   */
  function seriesOf(config, state) {
    var v = config.vars[config.seriesVar];
    // Võrdlus: üks joon iga võrreldava rühma kohta. Mitme kategooriaga mõõdikul (nt hinnanguskaala) võrreldakse ühte
    // kategooriat (state[seriesVar], vaikimisi esimene), sest rühmad × kategooriad oleksid loetamatud.
    var cmp = TAI.activeComparison(config, state);
    if (cmp) {
      var mi = Math.max(0, v.values.indexOf(state[config.seriesVar]));
      return cmp.values.map(function (val, i) {
        return {
          code: v.values[mi], cmpVar: cmp.filter, cmpCode: val,
          label: TAI.labelOf(config, cmp.filter, val),
          color: cmp.colors[i],
          valence: (v.valence && v.valence[mi]) || "neutral"
        };
      });
    }
    return v.values.map(function (code, i) {
      return {
        code: code,
        label: v.labels[i],
        color: (v.colors && v.colors[i]) || DEFAULT_PALETTE[i % DEFAULT_PALETTE.length],
        valence: (v.valence && v.valence[i]) || "neutral"
      };
    });
  }

  /**
   * Täielik valik lugeja jaoks: kõik filtrimuutujad (koondkategooria, kui valimata), VÄLJA ARVATUD
   * aasta ja seeriamuutuja ise (need määrab kutsuja iga punkti/seeria jaoks eraldi). Muutujad, millel
   * pole totalValue'd (nt PT05 "Näitaja" — kolm eri küsimust, mida ei saa "kokku" liita), jäetakse
   * vaikimisi valikust välja: kui vastuses on see dimensioon suurusega 1 (päring küsis vaid ühte
   * väärtust, vt queries()-i defaultValue-mehhanismi), loeb lugeja selle ise õigesti.
   * Lugeja ignoreerib võtmeid, mida vastuses pole — nii sobib sama valik nii API vastusele
   * kui ka üleslaaditud täistabelile.
   */
  function baseSelection(config, state, year) {
    var sel = {};
    sel[config.yearVar] = year;
    Object.keys(config.vars).forEach(function (code) {
      if (code === config.yearVar || code === config.seriesVar) return;
      var v = config.vars[code];
      if (v.totalValue == null) return;
      sel[code] = state[code] != null ? state[code] : v.totalValue;
    });
    return sel;
  }

  /** Valik ühe seeria kohta: seeriamuutuja väärtus ja võrdlusel ka rühm. */
  function selectSeries(config, sel, s) {
    sel[config.seriesVar] = s.code;
    if (s.cmpVar) sel[s.cmpVar] = s.cmpCode;
    return sel;
  }

  TAI.buildModel = function (config, data, state) {
    var series = seriesOf(config, state);
    var comparison = TAI.activeComparison(config, state);
    var years = config.years;
    var latest = years[years.length - 1];
    var prev = years.length > 1 ? years[years.length - 2] : null;

    /* Väärtus on juba protsent (TAI tabelid annavad valmis %) — ei arvutata osakaalu, loetakse otse. */
    function valueAt(reader, sel) {
      if (!reader) return null;
      var v = reader.get(sel);
      return v === undefined ? null : v;
    }

    var trend = null;
    if (config.views.trend && data.trend) {
      trend = series.map(function (s) {
        return Object.assign({}, s, {
          points: years.map(function (y) {
            var sel = selectSeries(config, baseSelection(config, state, y), s);
            return { year: y, value: valueAt(data.trend, sel) };
          })
        });
      });
    }

    // KPI-d: trendist, kui see on olemas; muidu jaotuse koondväärtusest.
    // config.connectGaps (04.11.2026, küsitlusandmed, mida ei koguta igal aastal — nt OECD patsiendikogemus):
    // KPI = viimane aasta, mille kohta väärtus on olemas, võrdlus = sellele eelnev olemasolev aasta.
    var kpis = series.map(function (s, i) {
      var value, delta = null, kYear = latest, kPrev = prev;
      if (trend) {
        var pts = trend[i].points;
        if (config.connectGaps) {
          var have = pts.filter(function (p) { return p.value != null; });
          var lastP = have[have.length - 1], prevP = have[have.length - 2];
          value = lastP ? lastP.value : null;
          kYear = lastP ? lastP.year : latest;
          kPrev = prevP ? prevP.year : null;
          if (prevP) delta = TAI.delta(value, prevP.value, (typeof config.deltaPhrase === "function" ? config.deltaPhrase(state) : config.deltaPhrase), TAI.decimalsOf(config, state));
        } else {
          value = pts[pts.length - 1].value;
          if (prev) delta = TAI.delta(value, pts[pts.length - 2].value, (typeof config.deltaPhrase === "function" ? config.deltaPhrase(state) : config.deltaPhrase), TAI.decimalsOf(config, state));
        }
      } else {
        var sel = selectSeries(config, baseSelection(config, state, latest), s);
        var bd0 = config.views.breakdown;
        if (bd0 && config.vars[bd0.var].totalValue != null) sel[bd0.var] = config.vars[bd0.var].totalValue;
        value = valueAt(data.breakdown, sel);
      }
      return { label: s.label, color: s.color, valence: s.valence, year: kYear, prevYear: kPrev, value: value, delta: delta };
    });

    /*
     * KPI-silt = seeria enda kategooria (nt "VÄGA RAHUL"). Varem (18.09.2026) lisandus „, valitud lõige", kui mõni
     * filter erines vaikeväärtusest; alates 05.11.2026 on täpne lõige KPI kastis eraldi real (TAI.sliceParts).
     */
    kpis.forEach(function (k) { k.cardLabel = k.label; });

    /*
     * Võrdlusrida (EL-27 keskmine joone + KPI-kaardina, ainult Eurostati
     * tabelitel). config.reference = { label }, config.queries() annab lisapäringu nimega "reference"
     * (sama tabel, ainult geo=EU27_2020). Loetakse sama valikuga kui Eesti rida — geo on mõlemas
     * vastuses suurusega 1. KPI-kaardile läheb viimane aasta, mille kohta EL-i väärtus on olemas.
     */
    var reference = null;
    // Võrdlusel EL-27 rida pole: koondrea joon ja KPI-rida esimesel kaardil näiks selle rühma võrdlusena
    if (config.reference && !comparison && data.reference && trend) {
      reference = {
        label: config.reference.label,
        points: years.map(function (y) {
          var sel = baseSelection(config, state, y);
          sel[config.seriesVar] = series[0].code;
          return { year: y, value: valueAt(data.reference, sel) };
        })
      };
      var lastRef = reference.points.filter(function (p) { return p.value != null; }).pop();
      reference.latest = lastRef || null;
      if (lastRef) kpis[0].reference = { label: reference.label, year: lastRef.year, value: lastRef.value };
    }

    /*
     * Breakdown-vaate valikulised seaded (04.11.2026):
     *  - groups: massiiv VÕI function(state) → massiiv (nt THT001: valitud ameti rühma alamread);
     *  - sort: "desc" — tulbad suurimast väiksemani (esimese seeria järgi, puuduvad lõppu);
     *  - showTotal: false VÕI function(state) → boolean — koondväärtuse joont ei näidata, kui koond on
     *    tulpade summa (absoluutarvud), mitte võrreldav tase (kordaja) — muidu venib telg ja tulbad kahanevad.
     */
    var breakdown = null;
    var bd = config.views.breakdown;
    // Võrdlusel tulpa ei näidata, kui see võrdleks sama asja, mis jooned, või kui rea kohta tuleks üle kahe tulba
    if (comparison && bd && (comparison.filter === bd.var || comparison.values.length > 2)) bd = null;
    if (bd && data.breakdown) {
      var bVar = config.vars[bd.var];
      var showTotal = typeof bd.showTotal === "function" ? bd.showTotal(state) : bd.showTotal !== false;
      var hasTotal = bVar.totalValue != null && showTotal;
      var groups = (typeof bd.groups === "function" ? bd.groups(state) : bd.groups) || [{
        label: null,
        values: bVar.values.filter(function (v) { return v !== bVar.totalValue; })
      }];
      var valueFor = function (s, code) {
        var sel = selectSeries(config, baseSelection(config, state, latest), s);
        sel[bd.var] = code;
        return valueAt(data.breakdown, sel);
      };
      breakdown = {
        title: bd.title,
        inPhrase: bd.inPhrase,
        varCode: bd.var,
        year: latest,
        limit: bd.limit || 0,     // > 0: tulbas vaikimisi ainult nii mitu esimest (vt TAI.visibleBarGroups)
        showAll: false,
        sorted: bd.sort === "desc",
        selected: state[bd.var] != null && state[bd.var] !== bVar.totalValue ? state[bd.var] : null,
        series: series,
        totals: hasTotal ? series.map(function (s) { return valueFor(s, bVar.totalValue); }) : null,
        groups: groups.map(function (g) {
          var items = g.values.map(function (code) {
            return {
              code: code,
              label: TAI.labelOf(config, bd.var, code),
              values: series.map(function (s) { return valueFor(s, code); })
            };
          });
          if (bd.sort === "desc") {
            items.sort(function (a, c) {
              var av = a.values[0], cv = c.values[0];
              if (av == null) return cv == null ? 0 : 1;
              if (cv == null) return -1;
              return cv - av;
            });
          }
          return { label: g.label, items: items };
        })
      };
    }

    return { config: config, state: state, series: series, latest: latest, prev: prev, trend: trend, kpis: kpis,
             breakdown: breakdown, reference: reference, comparison: comparison };
  };

  // ---- callout ----

  /* Ühik kokkuvõtte lauses (05.11.2026): „%" on juba numbris; muu ühik — üks sõna ilma sulgudeta („58,1 aastat"),
     pikem fraas sulgudes („115,8 (100 000 elaniku kohta)"). */
  function unitPhrase(config, state) {
    if (TAI.unitOf(config, state) !== "") return "";
    var label = config.unitLabel || "";
    if (!label) return "";
    return /\s/.test(label) ? " (" + label + ")" : " " + label;
  }

  function populationSuffix(config, state) {
    var parts = [];
    var cmp = TAI.activeComparison(config, state);
    (config.filters || []).forEach(function (code) {
      if (code === config.seriesVar || (cmp && cmp.filter === code)) return;
      var v = config.vars[code];
      if (state[code] != null && state[code] !== v.totalValue) {
        parts.push(v.label.toLowerCase() + " „" + TAI.labelOf(config, code, state[code]) + "“");
      }
    });
    return parts.length ? " (" + parts.join(", ") + ")" : "";
  }

  /*
   * "better"/"worse"/null — kas suund (delta.direction) on antud valentsi juures hea või halb märk.
   * null flat'i ja neutraalse/puuduva valentsi korral (siis pole "parem/halvem" hinnang mõttekas —
   * nt "Ei oska öelda" kasvamine ei ole iseenesest ei parem ega halvem). Kasutab sama loogikat,
   * mida KPI-kaardi noole värv juba kasutab (vt renderKpis) — callout-tekst ja värv on kooskõlas.
   */
  function judgment(direction, valence) {
    if (direction === "flat" || !valence || valence === "neutral") return null;
    return (direction === "up") === (valence === "negative") ? "worse" : "better";
  }

  /**
   * Positiivsete kategooriate summa (valence: "positive") antud item.values massiivist.
   * null, kui ühtegi positiivset seeriat pole andmetega kaetud.
   */
  function positiveSum(series, values) {
    var sum = 0, any = false;
    series.forEach(function (s, i) {
      if (s.valence === "positive" && values[i] != null) { sum += values[i]; any = true; }
    });
    return any ? sum : null;
  }

  /* Võrdluse lause: ainult kirjeldav, toetub KPI-kaartide arvudele; hinnangut ega uusi arve ei anta. */
  function comparisonSentence(model, valid, fmt, suffix) {
    var config = model.config, state = model.state;
    var sorted = valid.slice().sort(function (a, c) { return c.value - a.value; });
    var hi = sorted[0], lo = sorted[sorted.length - 1];
    var sameYear = valid.every(function (x) { return x.year === valid[0].year; });
    var when = sameYear ? capitalize(TAI.inYear(config, valid[0].year)) : "Viimasel andmeaastal";
    var sv = config.vars[config.seriesVar];
    var what = sv.values.length > 1
      ? "kategooria „" + TAI.labelOf(config, config.seriesVar, model.series[0].code) + "“ osakaal"
      : config.measureLabel.toLowerCase();
    var unit = unitPhrase(config, state);
    if (valid.length === 2) {
      return when + suffix + " oli " + what + " rühmas „" + hi.label + "“ " + fmt(hi.value) + unit +
        " ja rühmas „" + lo.label + "“ " + fmt(lo.value) + unit + ".";
    }
    if (fmt(hi.value) === fmt(lo.value)) return when + suffix + " oli " + what + " kõigis rühmades sama (" + fmt(hi.value) + unit + ").";
    // Ekraanil võrdse väärtusega rühmad nimetatakse kõik
    function groupsAt(value) {
      var names = valid.filter(function (x) { return fmt(x.value) === fmt(value); }).map(function (x) { return "„" + x.label + "“"; });
      return names.length === 1 ? "rühmas " + names[0] : "rühmades " + names.slice(0, -1).join(", ") + " ja " + names[names.length - 1];
    }
    return when + suffix + " oli " + what + " suurim " + groupsAt(hi.value) + " (" + fmt(hi.value) + unit +
      ") ja väikseim " + groupsAt(lo.value) + " (" + fmt(lo.value) + unit + ").";
  }

  TAI.calloutText = function (model) {
    var config = model.config;
    var fmt = TAI.formatterFor(config, model.state);
    var sentences = [];
    var suffix = populationSuffix(config, model.state);
    var k = model.kpis;

    // Esimene lause: kui ainult üks seeria (nt üksik suremuskordaja), lihtne lauseehitus; kui mitu
    // (nt hinnanguskaala astmed), siis milline oli viimasel aastal levinuim.
    var valid = k.filter(function (x) { return x.value != null; });
    if (model.comparison) {
      if (valid.length > 1) sentences.push(comparisonSentence(model, valid, fmt, suffix));
    } else if (valid.length === 1) {
      var only = valid[0];
      // (ut0 / ühik: vt unitPhrase allpool)
      // only.year / only.prevYear == model.latest / model.prev, v.a connectGaps-tabelitel (viimane olemasolev aasta)
      var s0 = capitalize(TAI.inYear(config, only.year)) + suffix + " oli " + config.measureLabel.toLowerCase() +
        " " + fmt(only.value) + unitPhrase(config, model.state);
      if (only.delta) {
        var d0 = only.delta;
        s0 += d0.direction === "flat"
          ? ", mis on praktiliselt sama kui " + TAI.inYear(config, only.prevYear)
          : ", mis on " + d0.text.replace(/^[▲▼→]\s*/, "") + " " +
            (d0.direction === "up" ? "rohkem" : "vähem") + " kui " + TAI.inYear(config, only.prevYear);
        var j0 = judgment(d0.direction, only.valence);
        if (j0) s0 += " — see näitab olukorra " + (j0 === "better" ? "paranemist" : "halvenemist");
      }
      sentences.push(s0 + ".");
      // Võrdlus (EL-27): ainult kirjeldav, hinnangut ei anta.
      var ref = model.reference && model.reference.latest;
      if (ref) {
        sentences.push((ref.year === only.year ? (config.periodYears ? "Samal perioodil oli " : "Samal aastal oli ")
                                               : capitalize(TAI.inYear(config, ref.year)) + " oli ") +
          model.reference.label + " " + fmt(ref.value) + ".");
      }
    } else if (valid.length > 1) {
      var top = valid.slice().sort(function (a, c) { return c.value - a.value; })[0];
      var s = capitalize(TAI.inYear(config, model.latest)) + suffix + " oli enim vastuseid kategoorias „" + top.label +
        "“ (" + fmt(top.value) + ")";
      if (top.delta) {
        var d = top.delta;
        s += d.direction === "flat"
          ? ", mis on praktiliselt sama kui " + TAI.inYear(config, model.prev)
          : ", mis on " + d.text.replace(/^[▲▼→]\s*/, "") + " " +
            (d.direction === "up" ? "rohkem" : "vähem") + " kui " + TAI.inYear(config, model.prev);
        var j = judgment(d.direction, top.valence);
        if (j) s += " — see näitab olukorra " + (j === "better" ? "paranemist" : "halvenemist");
      }
      sentences.push(s + ".");
    }

    // Teine lause: kui breakdown olemas ja seeriatel on positiivne/negatiivne tähendus märgitud,
    // võrdle positiivsete kategooriate koondosakaalu rühmade vahel (nt teemade või sugude lõikes).
    // Võrdlusel seda lauset pole: seeriad on rühmad, mitte hinnanguskaala astmed, ja neid ei tohi kokku liita.
    var b = model.comparison ? null : model.breakdown;
    if (b && model.series.length === 1 && model.series[0].valence !== "neutral" && !config.calloutExtra) {
      // Üks seeria (nt tervena elada jäänud aastad, kindlustusega kaetus): võrdle mõõdikut ennast rühmade vahel —
      // „positiivsete hinnangute osakaal" sobib ainult hinnanguskaaladele (04.11.2026, visuaalse kontrolli leid).
      var one = [];
      b.groups.forEach(function (g) { g.items.forEach(function (it) {
        if (it.values[0] != null) one.push({ label: it.label, v: it.values[0] });
      }); });
      if (one.length > 1) {
        one.sort(function (a, c) { return c.v - a.v; });
        sentences.push(capitalize(b.inPhrase) + " oli " + config.measureLabel.toLowerCase() + " suurim rühmas „" +
          one[0].label + "“ (" + fmt(one[0].v) + ") ja väikseim rühmas „" + one[one.length - 1].label + "“ (" +
          fmt(one[one.length - 1].v) + ").");
      }
    } else if (b && model.series.length > 1) {
      var hasValence = model.series.some(function (s) { return s.valence !== "neutral"; });
      if (hasValence) {
        var rows = [];
        b.groups.forEach(function (g) { g.items.forEach(function (it) {
          var sum = positiveSum(model.series, it.values);
          if (sum != null) rows.push({ label: it.label, sum: sum });
        }); });
        if (rows.length > 1) {
          rows.sort(function (a, c) { return c.sum - a.sum; });
          var hi = rows[0], lo = rows[rows.length - 1];
          sentences.push(capitalize(b.inPhrase) + " oli positiivsete hinnangute osakaal kõrgeim rühmas „" +
            hi.label + "“ (" + fmt(hi.sum) + ") ja madalaim rühmas „" + lo.label + "“ (" + fmt(lo.sum) + ").");
        }
      }
    }
    // config.calloutExtra(model, fmt) → lause või null (04.11.2026): tabelipõhine lisalause, nt EU-SILC
    // sissetulekukvintiilide vahe (HSPA 5-6). Peab tuginema ainult ekraanil olevatele arvudele.
    // calloutExtraInCompare: lause sobib ka võrdlusele (nt kvintiilide vahe); muidu võrdlusel seda ei lisata
    if (typeof config.calloutExtra === "function" && (!model.comparison || config.calloutExtraInCompare)) {
      var extra = config.calloutExtra(model, fmt);
      if (extra) sentences.push(extra);
    }
    (config.calloutCaveats || []).forEach(function (c) {
      if (c.values.indexOf(model.state[c.var]) >= 0) sentences.push(c.text);
    });
    if (hasMissing(model)) sentences.push("Valitud lõike kohta osa andmeid puudub.");
    return sentences.join(" ");
  };

  function hasMissing(model) {
    var missing = model.kpis.some(function (k) { return k.value == null; });
    // connectGaps: küsitlust ei tehta igal aastal — vahelejäänud aasta pole „puuduv andmestik", jalus selgitab
    if (model.trend && !model.config.connectGaps) {
      model.trend.forEach(function (s) { s.points.forEach(function (p) { if (p.value == null) missing = true; }); });
    }
    if (model.breakdown) model.breakdown.groups.forEach(function (g) {
      g.items.forEach(function (it) { it.values.forEach(function (v) { if (v == null) missing = true; }); });
    });
    return missing;
  }

  function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  // ---- valitud lõige (filtrilause) -------------------------------------
  /*
   *  (asendab 18.09.2026 reegli „vaikevalikul lõiget ei näidata"): iga filtriga tabeli
   * KPI kastis ning iga joonise ja andmetabeli pealkirja all on väiksemas kirjas, millise lõike numbrid need on —
   * alati, ka vaikevalikute korral. Filtriteta tabelitel trendi ja KPI juures rida pole (midagi pole valida).
   * NB: tulbale ei kehti tema enda võrdlustelje filter (tulbas on kõik rühmad), seepärast oma lause.
   */
  /* Lõikes on alati filtri nimi + väärtus, nt „Põhjus: Ootejärjekord · Sissetulek: 1. kvintiil (madalaim)"
     (filtri nimi on vajalik detail). `sliceLabels` = lühemad väärtuse nimed lõike jaoks
     (sama järjekord mis values, võib olla lühem massiiv), kui filtri nimi teeb pika väärtuse osaliselt üleliigseks. */
  TAI.sliceParts = function (config, state, exclude) {
    var parts = (config.filters || []).filter(function (code) { return code !== exclude; }).map(function (code) {
      var v = config.vars[code];
      var comp = TAI.activeComparisonFor(config, state, code);
      if (comp) return v.label + ": " + comp.label;
      var val = state[code] != null ? state[code] : v.defaultValue != null ? v.defaultValue : v.totalValue;
      var i = v.values.indexOf(val);
      return v.label + ": " + (v.sliceLabels && v.sliceLabels[i] ? v.sliceLabels[i] : TAI.labelOf(config, code, val));
    });
    // Mitme kategooriaga mõõdiku võrdlus: nähtav, millist kategooriat rühmade vahel võrreldakse
    var sv = config.vars[config.seriesVar];
    if (TAI.activeComparison(config, state) && sv.values.length > 1) {
      var mi = Math.max(0, sv.values.indexOf(state[config.seriesVar]));
      parts.push(sv.label + ": " + sv.labels[mi]);
    }
    return parts;
  };

  TAI.trendSlice = function (model) {
    var parts = TAI.sliceParts(model.config, model.state);
    if (!parts.length) return "";
    if (model.reference) parts.push(model.reference.label + ": sama lõige");
    return parts.join(" · ");
  };

  TAI.breakdownSlice = function (model) {
    var config = model.config, b = model.breakdown, state = model.state;
    var codes = [];
    b.groups.forEach(function (g) { g.items.forEach(function (it) { codes.push(it.code); }); });
    var own = state[b.varCode];
    var ownInBars = own == null || own === config.vars[b.varCode].totalValue || codes.indexOf(own) >= 0;
    var head = (config.periodYears ? "Periood " + yl(config, b.year) : yl(config, b.year) + ". aasta") +
      (b.inPhrase ? ", " + b.inPhrase : "");
    // Võrdlustelje enda valik jääb välja, kui see on tulpade hulgas (siis tõstetakse esile); muidu (nt THT001
    // „Arstid" = rühm, mille alamread on tulbad) on see lõike osa.
    var parts = [head].concat(TAI.sliceParts(config, state, ownInBars ? b.varCode : null));
    if (b.selected && codes.indexOf(b.selected) >= 0) {
      var bv = config.vars[b.varCode], si = bv.values.indexOf(b.selected);
      parts.push("esile tõstetud: " + (bv.sliceLabels && bv.sliceLabels[si] ? bv.sliceLabels[si] : TAI.labelOf(config, b.varCode, b.selected)));
    }
    return parts.join(" · ");
  };

  // ---- HTML-osad -----------------------------------------------------

  TAI.renderKpis = function (model) {
    var config = model.config;
    var fmt = TAI.formatterFor(config, model.state);
    // Suuna-vihje („↑ suurem = parem") esimese KPI-kaardi paremas ülanurgas (oli päise pill)
    var hint = TAI.directionHint(config);
    // Valitud lõige KPI kastis: ühe kaardi puhul kaardi sees sildi all, mitme kaardi puhul üks kord kogu rea kasti
    // ülaosas.
    var slice = TAI.sliceParts(config, model.state).join(" · ");
    var single = model.kpis.length === 1;
    var row = '<div class="kpi-row">' + model.kpis.map(function (k, ki) {
      var deltaHtml = "";
      if (!k.delta && k.prevYear && k.value != null) {
        deltaHtml = '<p class="kpi__delta is-flat">Muutust ei saa arvutada: ' +
          esc(config.periodYears ? "perioodi " + yl(config, k.prevYear) : yl(config, k.prevYear) + ". aasta") + " andmed puuduvad</p>";
      }
      if (k.delta) {
        var j = judgment(k.delta.direction, k.valence);
        var cls = j === "worse" ? "is-worse" : j === "better" ? "is-better" : "is-flat";
        deltaHtml = '<p class="kpi__delta ' + cls + '">' + esc(k.delta.text) +
          ' <span class="kpi__delta-ref">võrreldes ' + esc(TAI.vsYear(config, k.prevYear)) + "</span></p>";
      }
      return '<div class="kpi">' +
        '<div class="kpi__top"><p class="kpi__label">' + esc(k.cardLabel) + " · " + esc(yl(config, k.year)) + "</p>" +
          (ki === 0 && hint ? '<span class="pill kpi__hint">' + esc(hint) + "</span>" : "") + "</div>" +
        (single && slice ? '<p class="slice kpi__slice">' + esc(slice) + "</p>" : "") +
        (k.value == null
          ? '<p class="kpi__value kpi__value--missing">Andmed puuduvad</p>'
          : '<p class="kpi__value">' + fmt(k.value) + "</p>") +
        deltaHtml +
        (k.reference ? '<p class="kpi__note">' + esc(k.reference.label) + " " + esc(yl(config, k.reference.year)) +
          ": " + fmt(k.reference.value) + "</p>" : "") +
        (!k.delta && model.config.kpiNote && k.value != null ? '<p class="kpi__note">' + esc(model.config.kpiNote) + "</p>" : "") +
      "</div>";
    }).join("") + "</div>";
    if (single || !slice) return row;
    return '<div class="kpi-block"><p class="slice kpi-block__slice">' + esc(slice) + "</p>" + row + "</div>";
  };

  // Lõike rida joonise või andmetabeli pealkirja alla (tühi, kui lõiget pole)
  TAI.sliceHtml = function (text, cls) {
    return text ? '<p class="slice ' + (cls || "chart-slice") + '">' + esc(text) + "</p>" : "";
  };

  function captionSlice(text) {
    return text ? '<span class="slice data-table__slice"><span class="visually-hidden"> — </span>' + esc(text) + "</span>" : "";
  }

  /* `reference` (valikuline, model.reference): lisab legendi katkendjoonelise võrdlusrea; siis näidatakse
     legendi ka üheseerialisel tabelil ning seeria sildile lisandub riik (nt „Raviga välditav — Eesti"). */
  TAI.renderLegend = function (series, reference, country) {
    if (series.length < 2 && !reference) return "";
    return '<ul class="legend">' + series.map(function (s) {
      // värv pannakse peale CSSOM-iga (app.js applySwatches), sest CSP ei luba style="…" atribuuti HTML-is
      return '<li><span class="legend__swatch" data-swatch="' + esc(s.color) + '"></span>' +
        esc(s.label + (reference && country ? " — " + country : "")) + "</li>";
    }).join("") +
      (reference ? '<li><span class="legend__swatch legend__swatch--ref" aria-hidden="true"></span>' + esc(reference.label) + "</li>" : "") +
      "</ul>";
  };

  TAI.renderDataTables = function (model) {
    var config = model.config;
    var fmt = TAI.formatterFor(config, model.state);
    var ut = TAI.unitText(config, model.state);
    var unitSuffix = ut ? " (" + ut + ")" : "";
    var html = "";
    var heads = model.series.map(function (s) { return '<th scope="col" class="num">' + esc(s.label) + "</th>"; }).join("");
    var ref = model.reference;

    if (model.trend) {
      html += '<table class="data-table"><caption>' + esc(config.measureLabel) + unitSuffix + " aastate kaupa" + captionSlice(TAI.trendSlice(model)) + "</caption>" +
        '<thead><tr><th scope="col">Aasta</th>' + heads +
        (ref ? '<th scope="col" class="num">' + esc(ref.label) + "</th>" : "") + "</tr></thead><tbody>" +
        config.years.map(function (y, i) {
          return '<tr><th scope="row">' + esc(yl(config, y)) + "</th>" + model.trend.map(function (s) {
            return '<td class="num">' + fmt(s.points[i].value) + "</td>";
          }).join("") + (ref ? '<td class="num">' + fmt(ref.points[i].value) + "</td>" : "") + "</tr>";
        }).join("") + "</tbody></table>";
    }

    var b = model.breakdown;
    if (b) {
      var varLabel = config.vars[b.varCode].label;
      html += '<table class="data-table"><caption>' + esc(b.title) + ", " + esc(yl(config, b.year)) + unitSuffix + captionSlice(TAI.breakdownSlice(model)) + "</caption>" +
        "<thead><tr>" + (b.groups[0].label ? '<th scope="col">Rühm</th>' : "") + '<th scope="col">' + esc(varLabel) + "</th>" + heads + "</tr></thead><tbody>" +
        (b.totals ? '<tr class="is-total">' + (b.groups[0].label ? "<td></td>" : "") + '<th scope="row">Kokku</th>' +
          b.totals.map(function (v) { return '<td class="num">' + fmt(v) + "</td>"; }).join("") + "</tr>" : "") +
        b.groups.map(function (g) {
          return g.items.map(function (it, i) {
            return "<tr>" + (g.label ? "<td>" + (i === 0 ? esc(g.label) : "") + "</td>" : "") +
              '<th scope="row">' + esc(it.label) + "</th>" +
              it.values.map(function (v) { return '<td class="num">' + fmt(v) + "</td>"; }).join("") + "</tr>";
          }).join("");
        }).join("") + "</tbody></table>";
    }

    html += '<p class="data-table__link">' + TAI.externalLink(TAI.sourceUrl(config), "Vaata kogu tabelit " + TAI.sourceLabel(config) + " andmebaasis") + "</p>";
    return html;
  };

  // ---- SVG abi -------------------------------------------------------

  function el(name, attrs, text) {
    var node = document.createElementNS(SVG_NS, name);
    Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    if (text != null) node.textContent = text;
    return node;
  }

  var TICKS = 4;

  /* Telje maksimum, mis jagub TICKS sammuks "kenade" täisarvudega (nt protsentide puhul 4 → 8 →
     12 → 16). Astmestik ulatub piisavalt kõrgele ka mitte-protsentuaalsete suuruste jaoks (nt
     Eurostati suremuskordaja 100 000 elaniku kohta, suurusjärk sajad) — vt README.md. */
  var NICE_STEPS = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 20000, 25000];
  /* `capPct` (04.11.2026): protsentide puhul, kui kõik väärtused on ≤ 100, ei lähe telg üle 100% — muidu
     annaks nt 97,9% → telg 200% (OECD patsiendikogemus, visuaalse kontrolli leid). */
  function niceMax(values, capPct) {
    var max = Math.max.apply(null, values.filter(function (v) { return v != null; }).concat([0]));
    var raw = (max * 1.15) / TICKS;
    var out = NICE_STEPS[NICE_STEPS.length - 1] * TICKS;
    for (var i = 0; i < NICE_STEPS.length; i++) if (NICE_STEPS[i] >= raw) { out = NICE_STEPS[i] * TICKS; break; }
    return capPct && max <= 100 && out > 100 ? 100 : out;
  }
  function isPct(config, state) { var u = TAI.unitOf(config, state); return u == null || u === "%"; }

  /** Lihtne reamurdmine SVG-s: kuni 2 rida, hinnanguline tähelaius. */
  function wrapLabel(text, maxWidth, charWidth) {
    var maxChars = Math.max(6, Math.floor(maxWidth / charWidth));
    if (text.length <= maxChars) return [text];
    var words = text.split(" "), lines = [""];
    words.forEach(function (w) {
      var cur = lines[lines.length - 1];
      if ((cur + " " + w).trim().length <= maxChars || !cur) lines[lines.length - 1] = (cur + " " + w).trim();
      else lines.push(w);
    });
    if (lines.length > 2) lines = [lines[0], lines.slice(1).join(" ")];
    return lines;
  }

  function markAttrs(label, value, fmt) {
    var v = fmt(value);
    return { tabindex: "0", role: "img", "aria-label": label + ": " + v, "data-label": label, "data-value": v, class: "mark" };
  }

  // ---- trendijoonis --------------------------------------------------

  TAI.drawTrendChart = function (svg, model, width) {
    var config = model.config;
    var fmt = TAI.formatterFor(config, model.state);
    var unitNow = TAI.unitOf(config, model.state);
    var axisUnit = unitNow != null ? unitNow : "%";
    var years = config.years;
    var narrow = width < 480;
    var W = Math.max(280, width), H = narrow ? 230 : 260;
    var padL = 44, padR = 16, padT = 24, padB = 34;
    var plotW = W - padL - padR, plotH = H - padT - padB;
    var inset = narrow ? 24 : 40;

    var all = [];
    model.trend.forEach(function (s) { s.points.forEach(function (p) { all.push(p.value); }); });
    if (model.reference) model.reference.points.forEach(function (p) { all.push(p.value); });
    var maxV = niceMax(all, isPct(config, model.state));

    function x(i) { return padL + inset + ((plotW - 2 * inset) * i) / Math.max(1, years.length - 1); }
    function y(v) { return padT + plotH - (plotH * v) / maxV; }

    svg.innerHTML = "";
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    svg.setAttribute("width", W);
    svg.setAttribute("height", H);

    for (var g = 0; g <= TICKS; g++) {
      var gv = (maxV * g) / TICKS;
      svg.appendChild(el("line", { class: g === 0 ? "baseline" : "gridline", x1: padL, x2: W - padR, y1: y(gv), y2: y(gv) }));
      svg.appendChild(el("text", { class: "axis-label", x: padL - 8, y: y(gv) + 4, "text-anchor": "end" }, Math.round(gv) + axisUnit));
    }
    // Aastasildid: kui kõik ei mahu (nt 18 aastat kitsas aknas), näidatakse iga 2./3. aastat — esimene ja
    // viimane alati. Punktid ja vihjed jäävad kõigile aastatele (04.11.2026, visuaalse kontrolli leid).
    var MIN_LABEL_GAP = 38;   // ~ nelja numbri laius 12px kirjaga + vahe
    var gap = (plotW - 2 * inset) / Math.max(1, years.length - 1);
    var every = Math.max(1, Math.ceil(MIN_LABEL_GAP / gap));
    years.forEach(function (yr, i) {
      var isLast = i === years.length - 1;
      if (i % every !== 0 && !isLast) return;
      if (!isLast && every > 1 && years.length - 1 - i < every) return;   // ära pane viimase kõrvale kokku
      svg.appendChild(el("text", { class: "axis-label", x: x(i), y: H - padB + 22, "text-anchor": "middle" }, yl(config, yr)));
    });

    model.trend.forEach(function (s) {
      var pts = s.points.map(function (p, i) { return p.value == null ? null : [x(i), y(p.value)]; });
      var d = "", pen = false;
      pts.forEach(function (p) {
        if (!p) { if (!config.connectGaps) pen = false; return; }   // connectGaps: joon üle küsitluse vaheaastate
        d += (pen ? "L" : "M") + p[0] + "," + p[1] + " ";
        pen = true;
      });
      if (d) svg.appendChild(el("path", { class: "line-series", d: d.trim(), stroke: s.color }));
    });

    // Võrdlusrida (EL-27): hall katkendjoon + väikesed punktid vihje jaoks; arvsilte ei näidata, et need
    // ei kattuks Eesti siltidega — väärtus on KPI-kaardil, calloutis, vihjes ja andmetabelis.
    if (model.reference) {
      var rd = "", rpen = false;
      model.reference.points.forEach(function (p, i) {
        if (p.value == null) { rpen = false; return; }
        rd += (rpen ? "L" : "M") + x(i) + "," + y(p.value) + " ";
        rpen = true;
      });
      if (rd) svg.appendChild(el("path", { class: "line-series line-reference", d: rd.trim() }));
      model.reference.points.forEach(function (p, i) {
        if (p.value == null) return;
        svg.appendChild(el("circle", Object.assign(markAttrs(model.reference.label + " · " + yl(config, p.year), p.value, fmt), {
          cx: x(i), cy: y(p.value), r: 3.5, class: "mark line-dot line-dot--reference"
        })));
      });
    }

    // Iga seeria puhul näidatakse arvsilti ainult algus-, lõpp- ja tipp(kõrgeima väärtuse)aastal —
    // muidu läheb pika ajarea puhul (nt 16 aastat × 5 seeriat) graafik loetamatuks. Punkt (ring) ja
    // hõljatava vihje jäävad siiski KÕIKIDE aastate juurde alles.
    var labelYears = model.trend.map(function (s) {
      var idx = {};
      // algus/lõpp = esimene/viimane aasta, mille kohta väärtus on (mitte tingimata tabeli esimene/viimane aasta)
      var firstI = -1, lastI = -1;
      s.points.forEach(function (p, i) { if (p.value != null) { if (firstI < 0) firstI = i; lastI = i; } });
      if (firstI >= 0) { idx[firstI] = true; idx[lastI] = true; }
      var peak = -1, peakV = null;
      s.points.forEach(function (p, i) {
        if (p.value != null && (peakV == null || p.value > peakV)) { peakV = p.value; peak = i; }
      });
      if (peak >= 0) idx[peak] = true;
      return idx;
    });

    // punktid + sildid; mitme seeria korral kõrgem silt üles, madalam alla
    years.forEach(function (yr, i) {
      var entries = model.trend
        .map(function (s, si) { return { s: s, si: si, v: s.points[i].value }; })
        .filter(function (e) { return e.v != null; })
        .sort(function (a, b) { return b.v - a.v; });
      entries.forEach(function (e, rank) {
        var cx = x(i), cy = y(e.v);
        var below = entries.length > 1 && rank === entries.length - 1;
        // Üle kahe rühma võrdlusel sildid kattuksid: väärtused on KPI-kaartidel, vihjes ja andmetabelis
        if (labelYears[e.si][i] && !(model.comparison && model.trend.length > 2)) {
          svg.appendChild(el("text", {
            class: "mark-label", x: cx, y: below ? cy + 20 : cy - 11, "text-anchor": "middle"
          }, fmt(e.v)));
        }
        var dot = el("circle", Object.assign(markAttrs(e.s.label + " · " + yl(config, yr), e.v, fmt), {
          cx: cx, cy: cy, r: 5, fill: e.s.color, class: "mark line-dot"
        }));
        svg.appendChild(dot);
      });
    });
  };

  // ---- tulpdiagramm --------------------------------------------------

  /* Pikk tulp (nt THT001 44 arstieriala): config.views.breakdown.limit = N → joonisel vaikimisi N esimest
     (sorteeritud tulbas N suurimat) + valitud rida, kui see jääb välja; „Näita kõiki" nupp (app.js) lülitab
     breakdown.showAll. Andmetabel ja kokkuvõtte lause kasutavad alati kõiki ridu. */
  TAI.barItemCount = function (b) {
    return b.groups.reduce(function (n, g) { return n + g.items.length; }, 0);
  };

  TAI.visibleBarGroups = function (b) {
    if (!b.limit || b.showAll || TAI.barItemCount(b) <= b.limit) return b.groups;
    var left = b.limit;
    return b.groups.map(function (g) {
      var items = g.items.filter(function (it, i) { return i < left || it.code === b.selected; });
      left = Math.max(0, left - g.items.length);
      return { label: g.label, items: items };
    }).filter(function (g) { return g.items.length; });
  };

  TAI.drawBarChart = function (svg, model, width) {
    var config = model.config;
    var fmt = TAI.formatterFor(config, model.state);
    var full = model.breakdown;
    var b = Object.assign({}, full, { groups: TAI.visibleBarGroups(full) });
    var nSeries = b.series.length;
    var W = Math.max(280, width);
    var narrow = W < 480;
    var labelW = Math.min(210, Math.round(W * (narrow ? 0.36 : 0.32)));
    var valueW = 52;
    var barX = labelW + 12;
    var plotW = W - barX - valueW;
    var barH = nSeries === 1 ? 20 : 13, barGap = 3, rowGap = 12;
    var rowH = nSeries * barH + (nSeries - 1) * barGap;
    var groupH = 30;
    var headH = model.breakdown.totals ? 18 * nSeries + 8 : 8;

    var all = (b.totals || []).slice();
    b.groups.forEach(function (g) { g.items.forEach(function (it) { all = all.concat(it.values); }); });
    var maxV = niceMax(all, isPct(config, model.state));
    function bx(v) { return barX + (plotW * v) / maxV; }

    // sildid murtakse enne, et kaherealine silt saaks kõrgema rea
    var charW = narrow ? 6.4 : 6.8;
    b.groups.forEach(function (g) {
      g.items.forEach(function (it) {
        it._lines = wrapLabel(it.label, labelW, charW);
        it._rowH = Math.max(rowH, it._lines.length * 14 + 2);
      });
    });

    var H = headH;
    b.groups.forEach(function (g) {
      if (g.label) H += groupH;
      g.items.forEach(function (it) { H += it._rowH + rowGap; });
    });
    H += 8;

    svg.innerHTML = "";
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    svg.setAttribute("width", W);
    svg.setAttribute("height", H);

    var cy = headH;
    var rowsLayer = el("g");
    b.groups.forEach(function (g) {
      if (g.label) {
        rowsLayer.appendChild(el("text", { class: "group-label", x: 0, y: cy + 20 }, g.label));
        cy += groupH;
      }
      g.items.forEach(function (it) {
        var selected = b.selected === it.code;
        var lines = it._lines;
        var rowTop = cy + (it._rowH - rowH) / 2;   // tulbad rea keskele
        var labelY = cy + it._rowH / 2 + 4 - (lines.length - 1) * 7;
        var t = el("text", { class: "bar-label" + (selected ? " is-selected" : ""), x: labelW, y: labelY, "text-anchor": "end" });
        lines.forEach(function (line, li) {
          t.appendChild(el("tspan", { x: labelW, dy: li === 0 ? 0 : 14 }, line));
        });
        rowsLayer.appendChild(t);

        it.values.forEach(function (v, si) {
          var s = b.series[si];
          var y0 = rowTop + si * (barH + barGap);
          if (v == null) {
            rowsLayer.appendChild(el("text", { class: "mark-label", x: barX + 4, y: y0 + barH / 2 + 4 }, "andmed puuduvad"));
            return;
          }
          var fill = nSeries === 1 ? (selected ? COLORS.selected : COLORS.bar) : s.color;
          rowsLayer.appendChild(el("rect", Object.assign(markAttrs(it.label + (nSeries > 1 ? " · " + s.label : ""), v, fmt), {
            x: barX, y: y0, width: Math.max(2, bx(v) - barX), height: barH, rx: 3, fill: fill, class: "mark bar"
          })));
          rowsLayer.appendChild(el("text", { class: "mark-label", x: bx(v) + 6, y: y0 + barH / 2 + 4 }, fmt(v)));
        });
        cy += it._rowH + rowGap;
      });
    });

    // Kokku võrdlusjooned (tulpade taha) — mõnel muutujal (nt küsimustikuteemad) pole koondväärtust
    var refLayer = el("g");
    (b.totals || []).forEach(function (v, si) {
      if (v == null) return;
      var s = b.series[si];
      var rx = bx(v);
      refLayer.appendChild(el("line", {
        class: "ref-line", x1: rx, x2: rx, y1: 18 * si + 14, y2: H - 4,
        stroke: nSeries === 1 ? "var(--som-tumesinine)" : s.color
      }));
      var label = (nSeries > 1 ? s.label + " kokku " : "Kokku ") + fmt(v);
      var anchor = rx > W - 90 ? "end" : rx < barX + 60 ? "start" : "middle";
      refLayer.appendChild(el("text", { class: "ref-label", x: rx, y: 18 * si + 11, "text-anchor": anchor }, label));
    });

    svg.appendChild(refLayer);
    svg.appendChild(rowsLayer);
  };

})(window.TAI);
