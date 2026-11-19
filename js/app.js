/*
 * Master-leht: vasak andmestike loend + parem kuvamisala
 * ja valitud tabeli moodul: filtrid, KPI-d, callout, graafikud, andmetabel.
 * Sõltub core.js-ist, tabelikonfiguratsioonidest ja module.js-ist.
 */
(function (TAI) {
  "use strict";

  var esc = TAI.escapeHtml;
  var MOBILE_QUERY = window.matchMedia("(max-width: 767px)");

  var listEl = document.getElementById("dataset-list");
  var contentEl = document.getElementById("content");

  var current = null;      // valitud tabeli kood
  var requestId = 0;       // vanemate päringute tulemused jäetakse kõrvale
  var states = {};         // filtrivalikud tabeli kaupa (säilivad tabelite vahel liikudes)
  var view = null;         // { config, data, source } — praegu kuvatud moodul

  var BASE_TITLE = document.title;
  var REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)");

  var dateFmt = new Intl.DateTimeFormat("et-EE", { day: "2-digit", month: "2-digit", year: "numeric" });
  var timeFmt = new Intl.DateTimeFormat("et-EE", { hour: "2-digit", minute: "2-digit" });

  // ---- loend ----------------------------------------------------------

  var pendingScroll = false;

  /* Loendireal: mitte täiskirjeldus (see on juba aruande enda pealkirja
     all paremal), vaid lühike "riik, periood" — nt "Eesti, 2011–2023". Kirjeldus jääb ekraanilugeja
     jaoks siiski aria-describedby kaudu kättesaadavaks (title'i atribuudina, mitte nähtava tekstina). */
  /* Vanade andmete silt: kui viimane andmeaasta on üle STALE_YEARS aasta
     vana, lisandub loendireale „· uuring lõppenud" (või tabeli oma config.staleLabel). */
  var STALE_YEARS = 5;
  function staleSuffix(t) {
    var age = new Date().getFullYear() - lastYear(t);
    return age > STALE_YEARS ? " · " + (t.staleLabel || "uuring lõppenud") : "";
  }

  /* RTA-ga seotud aruanne: vähemalt üks RTA indikaator (js/hspa.js `rta`) viitab sellele tabelile või
     selle õdetabelile (õdetabelid on Üldvaates üks rida) või tabel on loendis TAI.HSPA.rtaTables. Näidatakse sama pastelse pillina
     mis HSPA-vaates. */
  var rtaFamilies = null;
  function isRtaTable(t) {
    if (!rtaFamilies) {
      rtaFamilies = {};
      ((TAI.HSPA && TAI.HSPA.rtaTables) || []).forEach(function (code) { if (TAI.getTable(code)) rtaFamilies[primaryOf(code)] = true; });
      ((TAI.HSPA && TAI.HSPA.sections) || []).forEach(function (s) {
        s.items.forEach(function (it) { if (it.rta && it.table && TAI.getTable(it.table)) rtaFamilies[primaryOf(it.table)] = true; });
      });
    }
    return !!rtaFamilies[primaryOf(t.code)];
  }

  /* Periood omaette <span>-is, et viimase aasta kontroll (TAI.checkLatestYears, core.js) saaks ainult selle teksti
     uuendada, loendit uuesti joonistamata. */
  function periodHtml(t) {
    return '<span class="dataset__years">' + esc(TAI.yearRangeLabel(t) + staleSuffix(t)) + "</span>";
  }

  function datasetRow(t) {
    var rtaMark = isRtaTable(t) ? ' · <span class="hspa-rta">RTA</span>' : "";
    return (
      '<li class="dataset" data-code="' + esc(t.code) + '">' +
        '<button type="button" class="dataset__button" aria-controls="content" title="' + esc(TAI.describe(t)) + '" ' +
            'aria-labelledby="ds-title-' + esc(t.code) + '" aria-describedby="ds-desc-' + esc(t.code) + '">' +
          '<span class="dataset__title" id="ds-title-' + esc(t.code) + '">' + esc(t.familyTitle || t.title) + "</span>" +
          '<span class="dataset__desc" id="ds-desc-' + esc(t.code) + '">' + esc(t.country ? t.country + ", " : "") + periodHtml(t) + rtaMark + "</span>" +
          '<span class="dataset__chevron" aria-hidden="true">›</span>' +
        "</button>" +
        '<div class="dataset__footer">' +
          '<a href="' + esc(TAI.sourceUrl(t)) + '" target="_blank" rel="noopener">Allikas: ' + esc(TAI.sourceLabel(t)) + " " + esc(t.code) +
            ' <span aria-hidden="true">↗</span><span class="visually-hidden">(avaneb uues aknas)</span></a>' +
          '<span class="dataset__views" hidden></span>' +
          '<span class="dataset__status" role="status"></span>' +
        "</div>" +
      "</li>"
    );
  }

  /* Rühmad, mille sees järjestatakse värskuse järgi: viimane andmeaasta
     kahanevalt, sama aasta korral pealkiri A→Ü (eesti tähestik). Teistes rühmades jääb <script> järjekord. */
  var SORTED_GROUPS = ["Eesti statistika"];
  var titleCollator = new Intl.Collator("et", { sensitivity: "base" });

  /* Viimane andmeaasta numbrina — aastakoodid võivad olla järjekorranumbrid (PT-tabelid), seega silt. */
  function lastYear(t) {
    // TAI.lastYear arvestab ka kerget viimase aasta kontrolli (core.js); perioodi silt „2024/2025" → viimane aasta (2025), mitte esimene
    var years = String(TAI.lastYear(t).label).match(/\d{4}/g);
    var n = years ? parseInt(years[years.length - 1], 10) : NaN;
    return isNaN(n) ? -Infinity : n;
  }

  function byFreshnessThenTitle(a, b) {
    return (lastYear(b) - lastYear(a)) || titleCollator.compare(a.familyTitle || a.title, b.familyTitle || b.title);
  }

  /* Rühmitab tabelid config.group järgi (registreerimisjärjekorras, vt index.html <script> järjekord
     — rühma piir tekib, kui group muutub); rühma nimeta tabelid (group puudub) jäävad ilma pealkirjata.
     SORTED_GROUPS rühmade sees järjestatakse ümber (vt ülal). */
  /* Õdetabelid: üks aruanne, mille lõiget (nt maakonniti / hariduse järgi) vahetab
     aruande päises lüliti — iga lõige on eraldi TAI tabel, sest TAI ei avalda maakonda ja haridust koos.
     config.siblings = [{ code, label }, …] (esimene = peamine, mis on Üldvaate loendis), config.familyTitle =
     loendirea pealkiri. Mitte-peamised õed Üldvaate loendis ei paista; HSPA-vaates viitavad koodid otse õele. */
  function primaryOf(code) {
    var t = TAI.getTable(code);
    return t && t.siblings ? t.siblings[0].code : code;
  }
  function isSecondarySibling(t) { return !!t.siblings && t.siblings[0].code !== t.code; }

  function siblingSwitchHtml(config) {
    if (!config.siblings) return "";
    return '<div class="sibling-switch" role="group" aria-label="Lõige"><span class="ai-box__label">Lõige:</span>' +
      config.siblings.map(function (s) {
        var on = s.code === config.code;
        return '<button type="button" class="view-toggle' + (on ? " is-active" : "") + '" data-sibling="' + esc(s.code) +
          '" aria-pressed="' + (on ? "true" : "false") + '">' + esc(s.label) + "</button>";
      }).join("") + "</div>";
  }

  /* Üldvaade — allika järgi rühmitatud loend. See vaade peab alati säilima
     („Üldvaade"); HSPA-vaade on lisavaade, mitte asendus. */
  function generalListHtml() {
    var groups = [];
    TAI.getTables().filter(function (t) { return !isSecondarySibling(t); }).forEach(function (t) {
      var name = t.group || "";
      var g = groups[groups.length - 1];
      if (!g || g.name !== name) { g = { name: name, items: [] }; groups.push(g); }
      g.items.push(t);
    });
    groups.forEach(function (g) {
      if (SORTED_GROUPS.indexOf(g.name) >= 0) g.items.sort(byFreshnessThenTitle);
    });
    return groups.map(function (g) {
      return (g.name ? '<h3 class="dataset-group-heading">' + esc(g.name) + "</h3>" : "") +
        '<ul class="dataset-list">' + g.items.map(datasetRow).join("") + "</ul>";
    }).join("");
  }

  /* ---- HSPA-vaade -----------------------------
     Rühmitus: strateegiline eesmärk → komponent › alakomponent; üks rida = üks HSPA indikaator (js/hspa.js).
     Näidikulaual olev indikaator avab tabeli koos filtriga (data-state); puuduv on hall koos staatusega.
     Kaardistuse sisemised märkused (plan: „P1?" jms) jäävad ainult js/hspa.js-i, avalikule lehele ei lähe. */
  /* Rea alumise rea osad: { t: tekst, flag: true } → tumedam oranž (:
     „pole veel näidikulaual" ja „arendamist vajav" peavad silma torkama). Strateegiline = punane süda. */
  var STRATEGIC = { t: "❤️ strateegiline põhimõõdik", cls: "hspa-strategic" };   // helesinisel taustal
  function hspaMarks(H, it) {
    var marks = [];
    if (it.strategic) marks.push(STRATEGIC);
    if (it.rta) marks.push({ t: "RTA", cls: "hspa-rta" });   // pastelsel ümmargusel taustal
    if (it.memo) marks.push({ t: H.memoStatusLabels[it.memo], cls: it.memo === "A" ? "hspa-flag" : null });
    return marks;
  }
  // Halli rea esimene märge (oranž kaldkiri). Strateegiavaates „pole veel näidikulaual"; HSPA-tulevikuvaates
  // „andmete olemasolu vajab kontrollimist".
  var NOT_ON_DASHBOARD = { t: "pole veel näidikulaual", cls: "hspa-flag" };
  var NEEDS_CHECK = { t: "andmete olemasolu vajab kontrollimist", cls: "hspa-flag" };

  /* HSPA-vaates: kui andmete olemasolu on kontrollitud (js/hspa.js `data`), näidatakse tulemust; muidu üldine
     „andmete olemasolu vajab kontrollimist" (05.11.2026). Sisemised päringukoodid (P1, P9 …) lehele ei lähe. */
  function dataCheckFlag(it) {
    var d = it.data;
    if (!d) return NEEDS_CHECK;
    if (d.status === "request") return { t: "andmed vaja pärida andmeomanikult (" + it.src + ")", cls: "hspa-flag" };
    if (d.status === "partial") return { t: "andmed osaliselt avaandmetes", cls: "hspa-flag" };
    if (d.status === "open") return { t: "andmed avaandmetes olemas, ootab lisamist", cls: "hspa-flag" };
    if (d.status === "file") return { t: "andmed failist, ootab lisamist", cls: "hspa-flag" };
    return NEEDS_CHECK;
  }

  function descHtml(parts) {
    return parts.map(function (p) {
      if (p.h != null) return p.h;   // valmis HTML (nt periood omaette span-is, vt periodHtml)
      return p.cls ? '<span class="' + p.cls + '">' + esc(p.t) + "</span>" : esc(p.t);
    }).join(" · ");
  }

  function hspaMissingRow(title, marks, flag) {
    return '<li class="dataset dataset--missing"><div class="dataset__static">' +
      '<span class="dataset__title">' + esc(title) + "</span>" +
      '<span class="dataset__desc">' + descHtml([flag || NOT_ON_DASHBOARD].concat(marks)) + "</span>" +
      "</div></li>";
  }

  function hspaRow(H, it, missingFlag) {
    var cfg = it.table && TAI.getTable(it.table);
    var title = it.code + " " + it.title;
    if (!cfg) return hspaMissingRow(title, hspaMarks(H, it), missingFlag === NEEDS_CHECK ? dataCheckFlag(it) : missingFlag);
    var id = "hspa-" + it.code;
    var desc = descHtml([{ h: esc(TAI.sourceLabel(cfg) + " · " + (cfg.country ? cfg.country + ", " : "")) + periodHtml(cfg) }]
      .concat(hspaMarks(H, it)));
    return (
      '<li class="dataset dataset--hspa" data-code="' + esc(cfg.code) + '" data-state="' + esc(JSON.stringify(it.state || {})) + '">' +
        '<button type="button" class="dataset__button" aria-controls="content" title="' + esc(TAI.describe(cfg)) + '" ' +
            'aria-labelledby="' + id + '-t" aria-describedby="' + id + '-d">' +
          '<span class="dataset__title" id="' + id + '-t">' + esc(title) + "</span>" +
          '<span class="dataset__desc" id="' + id + '-d">' + desc + "</span>" +
          '<span class="dataset__chevron" aria-hidden="true">›</span>' +
        "</button>" +
        '<div class="dataset__footer">' +
          '<span class="dataset__views" hidden></span>' +
          '<span class="dataset__status" role="status"></span>' +
        "</div>" +
      "</li>"
    );
  }

  /* Vaated:
     "strat"  = Strateegiavaade — AINULT strateegiliste eesmärkide põhimõõdikud (memo slaid „Strateegiliste eesmärkide
                põhimõõdikud": strategic-märkega koodid + koodita SoM mõõdikud); rühmitus strateegiline eesmärk →
                komponent › alakomponent; „Muud" rühma pole.
     "future" = HSPA-tulevikuvaade — KÕIK HSPA indikaatorid HSPA enda struktuuris „Komponent → Alakomponent";
                näidikulaual puuduval real „andmete olemasolu vajab kontrollimist", „arendamist vajav" jääb; lõpus
                koodita tabelid („Muud näitajad").
     (Varasem „HSPA-vaade" memo staatuse reegliga on asendatud Strateegiavaatega.) */
  function hspaListHtml(mode) {
    var H = TAI.HSPA;
    if (!H) return '<p class="list-note">HSPA kaardistust ei leitud.</p>';
    return mode === "strat" ? strategyListHtml(H) : futureListHtml(H);
  }

  function strategyListHtml(H) {
    var html = '<p class="list-note">Strateegiliste eesmärkide põhimõõdikud (täiendamisel).</p>';
    H.goals.forEach(function (goal) {
      var goalHtml = "";
      H.sections.filter(function (s) { return s.goal === goal.id; }).forEach(function (s) {
        var items = s.items.filter(function (it) { return it.strategic; });
        if (!items.length) return;
        goalHtml += '<h4 class="dataset-subheading">' + esc(s.component + (s.sub ? " › " + s.sub : "")) + "</h4>" +
          '<ul class="dataset-list">' + items.map(function (it) { return hspaRow(H, it); }).join("") + "</ul>";
      });
      var extra = (H.strategicWithoutCode || []).filter(function (x) { return x.goal === goal.id; });
      if (extra.length) {
        goalHtml += '<h4 class="dataset-subheading">Strateegilised põhimõõdikud (HSPA koodita)</h4><ul class="dataset-list">' +
          extra.map(function (x) { return hspaMissingRow(x.title, [STRATEGIC]); }).join("") + "</ul>";
      }
      if (goalHtml) html += '<h3 class="dataset-group-heading">' + esc(goal.id + " " + goal.title) + "</h3>" + goalHtml;
    });
    return html;
  }

  function futureListHtml(H) {
    var html = '<p class="list-note">Kõik HSPA indikaatorid HSPA komponentide ja alakomponentide kaupa, ' +
      "tervikliku ülevaate eesmärgil ka arendamist vajavad.</p>";
    // Komponendid memo järjekorras (esimese esinemise järgi); komponendita sektsioon (2-20) lõppu
    var order = [], byComp = {};
    H.sections.forEach(function (s) {
      var name = s.componentUnknown ? "Komponent memos täpsustamata" : s.component;
      if (!byComp[name]) { byComp[name] = []; order.push(name); }
      byComp[name].push(s);
    });
    order.sort(function (a, b) {
      return (a === "Komponent memos täpsustamata") - (b === "Komponent memos täpsustamata");
    });
    order.forEach(function (name) {
      html += '<h3 class="dataset-group-heading">' + esc(name === "Komponent memos täpsustamata" ? name : "Komponent: " + name) + "</h3>";
      byComp[name].forEach(function (s) {
        if (s.sub) html += '<h4 class="dataset-subheading">Alakomponent: ' + esc(s.sub) + "</h4>";
        html += '<ul class="dataset-list">' +
          (s.items.length
            ? s.items.map(function (it) { return hspaRow(H, it, NEEDS_CHECK); }).join("")
            : '<li class="dataset dataset--missing"><div class="dataset__static"><span class="dataset__desc">' +
              "Indikaatoreid veel määratud ei ole.</span></div></li>") +
          "</ul>";
      });
    });
    return html + otherTablesHtml(H);
  }

  // Koodita tabelid lõppu (HSPA-tulevikuvaade). Kaardistatud tabelid ei lähe siia; tabel, mida pole ei koodi ega
  // „other" all, läheb automaatselt rühma „Muud", et uus tabel kaduma ei läheks.
  function otherTablesHtml(H) {
    var html = "";
    var placed = {};
    H.sections.forEach(function (s) { s.items.forEach(function (it) { if (it.table) placed[it.table] = true; }); });
    var otherGroups = (H.other || []).map(function (g) {
      var tables = g.tables.map(TAI.getTable).filter(Boolean);
      tables.forEach(function (t) { placed[t.code] = true; });
      return { label: g.label, tables: tables };
    });
    var rest = TAI.getTables().filter(function (t) { return !placed[t.code]; });
    if (rest.length) otherGroups.push({ label: "Muud", tables: rest });
    html += '<h3 class="dataset-group-heading">Muud näitajad (HSPA kvaliteediplokist väljas)</h3>';
    otherGroups.forEach(function (g) {
      if (!g.tables.length) return;
      html += '<h4 class="dataset-subheading">' + esc(g.label) + '</h4><ul class="dataset-list">' +
        g.tables.map(datasetRow).join("") + "</ul>";
    });
    return html;
  }

  // Vaade: "yld" (Üldvaade) | "strat" (Strateegiavaade) | "future" (HSPA-tulevikuvaade) — kolm nuppu loendi kohal
  //. Alati avaneb Üldvaade, valikut ei jäeta meelde.
  var listMode = "yld";
  var toolbarEl = document.getElementById("view-toolbar");

  function renderList() {
    listEl.innerHTML = listMode === "yld" ? generalListHtml() : hspaListHtml(listMode);
    if (toolbarEl) {
      Array.prototype.forEach.call(toolbarEl.querySelectorAll(".view-toggle"), function (b) {
        var on = b.getAttribute("data-mode") === listMode;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }
    setActiveRow(current);
    Object.keys(rowCounts).forEach(function (code) { showRowCount(code, rowCounts[code]); });
    checkLatestYears();
  }

  /* Viimase andmeaasta taustakontroll (19.11.2026, vt core.js TAI.checkLatestYears): loendis praegu nähtavate tabelite
     viimane aasta küsitakse taustal ja rea periood uuendatakse; vaate vahetusel (Üldvaade / Strateegiavaade / HSPA-vaade)
     lähevad uue vaate tabelid järjekorras ettepoole. Juba kontrollitud tabeleid uuesti ei küsita. Ei sõltu vaatest:
     loeb tabelid joonistatud loendist. */
  function checkLatestYears() {
    var configs = [];
    Array.prototype.forEach.call(listEl.querySelectorAll("li.dataset[data-code]"), function (li) {
      var t = TAI.getTable(li.getAttribute("data-code"));
      if (t && configs.indexOf(t) < 0) configs.push(t);
    });
    TAI.checkLatestYears(configs);
  }

  /* Tabeli viimane aasta selgus: uuenda ainult rea periood ja tööriistavihje (mitte kogu loendit — muidu läheks
     kerimine ja klaviatuurifookus kaduma). Järjekord („Eesti statistika" värskuse järgi) uueneb järgmisel joonistamisel. */
  TAI.onLatestYear = function (t) {
    Array.prototype.forEach.call(listEl.querySelectorAll("li.dataset[data-code]"), function (li) {
      if (li.getAttribute("data-code") !== t.code) return;
      var y = li.querySelector(".dataset__years");
      if (y) y.textContent = TAI.yearRangeLabel(t) + staleSuffix(t);
      var btn = li.querySelector(".dataset__button");
      if (btn) btn.title = TAI.describe(t);
    });
  };

  if (toolbarEl) {
    toolbarEl.addEventListener("click", function (evt) {
      var b = evt.target.closest(".view-toggle");
      if (!b || b.getAttribute("data-mode") === listMode) return;
      listMode = b.getAttribute("data-mode");
      renderList();
    });
  }

  // Üks kuulaja kogu eluea jooksul (loend joonistatakse vaate vahetamisel uuesti).
  listEl.addEventListener("click", function (evt) {
    var btn = evt.target.closest(".dataset__button");
    if (!btn) return;
    var row = btn.closest(".dataset");
    var config = TAI.getTable(row.getAttribute("data-code"));
    var preset = row.getAttribute("data-state");
    // HSPA-rida: tabeli praegune olek + rea filtrid (nt MEASURE=ADMRASTH); muud valikud (sugu) jäävad.
    // Kui rida määrab võrreldava filtri väärtuse, lülitub selle võrdlus välja.
    var target = hashFor(config);
    if (preset) {
      var presetState = Object.assign({}, stateOf(config), JSON.parse(preset));
      TAI.comparisonsOf(config).forEach(function (c) {
        if (JSON.parse(preset)[c.filter] != null) presetState[c.flag] = false;
      });
      target = hashFor(config, presetState);
    }
    if (location.hash === target) {
      select(config.code, { scroll: true }); // sama vaade uuesti → laadi uuesti
    } else {
      pendingScroll = true;
      location.hash = target;                // hashchange → select()
    }
  });

  // ---- aadress: #KOOD?taustatunnus=3&vanus=2&sugu=vordlus ------------

  var PARAM_NAMES = { Taustatunnus: "taustatunnus", "Vanuserühm": "vanus", Sugu: "sugu" };
  var SEX_PARAM = { "1": "mehed", "2": "naised" };

  function paramName(code) { return PARAM_NAMES[code] || code.toLowerCase(); }

  function parseHash() {
    var raw = location.hash.replace(/^#/, "");
    // Vigane % jada (nt #%E0%A4%A) viskaks URIError'i ja jätaks lehe tühjaks; jääb toorena ja kood on siis tundmatu (tühi olek).
    try { raw = decodeURIComponent(raw); } catch (e) { /* kasuta toorest aadressi */ }
    var q = raw.indexOf("?");
    var params = {};
    (q >= 0 ? raw.slice(q + 1) : "").split("&").forEach(function (pair) {
      if (!pair) return;
      var eq = pair.indexOf("=");
      params[eq >= 0 ? pair.slice(0, eq) : pair] = eq >= 0 ? pair.slice(eq + 1) : "";
    });
    return { code: q >= 0 ? raw.slice(0, q) : raw, params: params };
  }

  function defaultState(config) {
    var state = {};
    (config.filters || []).forEach(function (v) { state[v] = TAI.filterDefault(config.vars[v]); });
    return state;
  }

  /** Mitme kategooriaga mõõdiku võrdlusel on lisafilter (mis kategooriat rühmade vahel võrreldakse); muidu null. */
  function comparedMeasureVar(config, state) {
    if (!TAI.activeComparison(config, state)) return null;
    var v = config.vars[config.seriesVar];
    return v.values.length > 1 ? v : null;
  }

  /** Aadressi parameetritest olek; tundmatud või vigased väärtused jäetakse vaikimisi. */
  function stateFromParams(config, params) {
    var state = defaultState(config);
    (config.filters || []).forEach(function (code) {
      var val = params[paramName(code)];
      if (val == null) return;
      var comp = TAI.comparisonsFor(config, code).filter(function (c) { return c.param === val; })[0];
      if (comp) {
        // korraga üks võrdlus; soo võrdlus on tähtsam, kui aadressis on mitu
        if (comp.kind === "sugu" || !TAI.activeComparison(config, state)) {
          TAI.comparisonsOf(config).forEach(function (c) { state[c.flag] = false; });
          state[comp.flag] = true;
        }
      } else if (code === "Sugu") {
        if (val === SEX_PARAM["1"]) state.Sugu = "1";
        else if (val === SEX_PARAM["2"]) state.Sugu = "2";
      } else if (config.vars[code].values.indexOf(val) >= 0) {
        state[code] = val;
      }
    });
    var active = TAI.activeComparison(config, state);
    if (active) state[active.filter] = TAI.filterDefault(config.vars[active.filter]);
    var mv = comparedMeasureVar(config, state);
    var measure = mv && params[paramName(config.seriesVar)];
    if (measure && mv.values.indexOf(measure) >= 0) state[config.seriesVar] = measure;
    return state;
  }

  function hashFor(config, stateOverride) {
    var state = stateOverride || states[config.code] || defaultState(config);
    var parts = [];
    (config.filters || []).forEach(function (code) {
      var name = paramName(code);
      var comp = TAI.activeComparisonFor(config, state, code);
      if (comp) {
        parts.push(name + "=" + comp.param);
      } else if (code === "Sugu") {
        if (SEX_PARAM[state.Sugu]) parts.push(name + "=" + SEX_PARAM[state.Sugu]);
      } else if (state[code] != null && state[code] !== config.vars[code].totalValue) {
        parts.push(name + "=" + encodeURIComponent(state[code]));
      }
    });
    if (comparedMeasureVar(config, state) && state[config.seriesVar] != null) {
      parts.push(paramName(config.seriesVar) + "=" + encodeURIComponent(state[config.seriesVar]));
    }
    return "#" + config.code + (parts.length ? "?" + parts.join("&") : "");
  }

  // HSPA-vaates võib üks tabel olla mitmel real → kõik read.
  function rowsOf(code) { return listEl.querySelectorAll('.dataset[data-code="' + code + '"]'); }

  /* Aktiivne rida: Üldvaates tabeli kood; HSPA-vaates kood JA rea filtrid (data-state) peavad vastama tabeli
     praegusele olekule — nt OECD-PC-s „KOK" valides liigub esiletõst reale 2-98. */
  function setActiveRow(code) {
    var st = code ? states[code] || {} : {};
    var primary = code ? primaryOf(code) : code;
    Array.prototype.forEach.call(listEl.querySelectorAll(".dataset[data-code]"), function (row) {
      var preset = row.getAttribute("data-state");
      // Üldvaate rida (ilma data-state'ita) esindab kogu õdede peret → aktiivne ka siis, kui avatud on õde
      var active = preset ? row.getAttribute("data-code") === code : row.getAttribute("data-code") === primary;
      if (active && preset) {
        var p = JSON.parse(preset);
        active = Object.keys(p).every(function (k) { return st[k] === p[k]; });
      }
      row.classList.toggle("is-active", active);
      var btn = row.querySelector(".dataset__button");
      if (active) btn.setAttribute("aria-current", "true"); else btn.removeAttribute("aria-current");
    });
  }

  function setRowStatus(code, kind) {
    // + Üldvaate peamise õe rida, kui laaditakse mitte-peamist õde
    var rows = Array.prototype.slice.call(rowsOf(code));
    if (primaryOf(code) !== code) {
      Array.prototype.forEach.call(rowsOf(primaryOf(code)), function (r) { if (!r.getAttribute("data-state")) rows.push(r); });
    }
    rows.forEach(function (row) {
      var el = row.querySelector(".dataset__status");
      if (!el) return;
      el.classList.toggle("is-error", kind === "error");
      el.innerHTML =
        kind === "loading" ? '<span class="spinner" aria-hidden="true"></span>Laadin…' :
        kind === "error" ? "Laadimine ebaõnnestus" : "";
    });
  }

  /* Lehe jalus: allikate rida ja privaatsusteade. */
  function renderFooter() {
    var footer = document.getElementById("site-footer");
    if (!footer) return;
    footer.innerHTML = "<p>Andmed: avalikud terviseandmebaasid (" +
      TAI.externalLink("https://statistika.tai.ee", "TAI") + ", " +
      TAI.externalLink("https://ec.europa.eu/eurostat", "Eurostat") + ", " +
      TAI.externalLink("https://data-explorer.oecd.org", "OECD") +
      ") — allikaviide iga andmestiku juures. Näidikulaud ei ole ühegi andmeallika ametlik väljaanne.</p>" + privacyNoteHtml();
  }

  /* Privaatsusteade: mis andmed lehelt kuhu liiguvad. Muuda koos js/usage.js ja TAI.checkLatestYears (core.js) muutmisega. */
  function privacyNoteHtml() {
    return '<p class="site-footer__privacy"><strong>Privaatsus.</strong> Leht loendab ligikaudselt vaatamisi ja ' +
      "nupuvajutusi (nt filtri valik, AI-nupp) välise teenusega " +
      TAI.externalLink("https://abacus.jasoncameron.dev", "Abacus") + ". " +
      "Loendamisel näeb see teenus sinu IP-aadressi ja loenduri nime (nt andmestiku kood RA02); " +
      "lehe omanik IP-aadresse ei näe. " +
      "Andmed loetakse otse Tervise Arengu Instituudi, Eurostati ja OECD andmebaasist (ka need näevad sinu IP-aadressi); " +
      "lehe avamisel küsitakse sealt iga andmestiku viimast aastat ja sinu brauser jätab selle 12 tunniks meelde. " +
      "Isikuandmeid ei salvestata ja küpsiseid ei kasutata.</p>" +
      // eraldi lõik rasvases kirjas: AI-analüüs on eraldiseisev teenus, mitte osa näidikulauast
      '<p class="site-footer__ai"><strong>AI-nupud aruande päises (Claude, ChatGPT, Gemini) kopeerivad lehe andmed ' +
      "(sh valitud filtreid arvestades) koos ettevalmistatud analüüsi prompt'iga sinu lõikelauale ja avavad valitud " +
      "AI-teenuse sinu enda brauseris. Seal kehtivad selle teenuse tingimused vastavalt sinu enda konto võimalustele " +
      "ning saadava analüüsi kvaliteet võib oluliselt sõltuda ka valitud AI-mudelist: paremad mudelid annavad parema " +
      "kvaliteediga analüüsi, tasuta teenus võib anda väga halva tulemuse. AI poolne kirjeldav analüüs on eraldiseisev " +
      "teenus, mille tulemus ei ole seotud siinsete näidikulaudadega.</strong></p>";
  }

  /* Allika taaskasutustingimuste märge aruande metaandmetes: Eurostat (CC BY 4.0) nõuab töötlemise märget ja lauset,
     et allikas ei vastuta; sama märge on OECD andmetel. */
  function sourceNoticeHtml(config) {
    var label = TAI.sourceLabel(config);
    if (label !== "Eurostat" && label !== "OECD") return "";
    return "<p>Sellel lehel on " + esc(label) + " andmeid töödeldud: valitud on riigid ja näitajad, nimetused on eesti keeles ning " +
      "joonised ja kokkuvõttelaused on lehe koostatud. " + esc(label) + " ei vastuta selle lehe ega andmete töötlemise eest.</p>";
  }

  // ---- kuvamisala olekud ---------------------------------------------

  function renderEmpty() {
    view = null;
    document.title = BASE_TITLE;
    contentEl.innerHTML =
      '<div class="empty-state">' +
        '<h2>Vali <span class="only-wide">vasakult</span><span class="only-narrow">ülalt</span> andmestik</h2>' +
        "<p>Näidikulaud koondab Eesti tervishoiuteenuste kvaliteedi ja kättesaadavuse näitajad " +
        "Tervise Arengu Instituudi, Eurostati ja OECD avaandmetest.</p>" +
        "<p>Loendit saad vaadata kolmel viisil:</p>" +
        "<ol>" +
          "<li>Üldvaade rühmitab andmestikud allika järgi,</li>" +
          "<li>Strateegiavaade näitab strateegiliste eesmärkide põhimõõdikuid ja</li>" +
          "<li>HSPA-vaade tervishoiusüsteemi toimivuse hindamise indikaatoreid.</li>" +
        "</ol>" +
        "<p>Andmed laaditakse valimisel otse allika andmebaasist, " +
        "seega näed alati avaldatud värskeimaid numbreid.</p>" +
      "</div>";
  }

  function backLink() {
    return '<a class="back-link" href="#dataset-list">↑ Tagasi andmestike juurde</a>';
  }

  /* Mooduli oma pealkirja kohal olev staatusrida (kulmu asemel): laadimine / õnnestunud / ebaõnnestunud.
     Vana kulmu sisu (nt tabelikood) liigub siia viitena samale reale. */
  function statusLineHtml(config, kind, updatedText) {
    var link = TAI.externalLink(TAI.sourceUrl(config), config.eyebrow);
    if (kind === "loading") return '<p class="module__status">Laen andmeid — ' + link + "</p>";
    if (kind === "error") return '<p class="module__status module__status--error">Andmeid ei õnnestunud laadida! — ' + link + "</p>";
    if (kind !== "loaded") return '<p class="module__status"></p>';
    var now = new Date();
    return '<p class="module__status">Andmed laaditud ' + esc(TAI.sourceLabel(config)) + " andmebaasist · " +
      esc(dateFmt.format(now) + " " + timeFmt.format(now)) + " — " + link +
      (updatedText ? " · " + esc(updatedText) : "") + "</p>";
  }

  /* Tabeli enda uuendusaeg (API vastuse "updated" väli) — kuvatakse staatusreal, allikaviite järel. */
  function tableUpdatedText(data) {
    var anyReader = data[Object.keys(data)[0]];
    var updated = anyReader && anyReader.raw.updated ? new Date(anyReader.raw.updated) : null;
    return updated && !isNaN(updated) ? "Andmed uuendatud " + dateFmt.format(updated) : null;
  }

  /* Filtrimuutusel (reload()) uuendatakse ainult juba ekraanil oleva mooduli staatusrida, mitte kogu päist. */
  function setStatus(config, kind, updatedText) {
    var el = contentEl.querySelector(".module__status");
    if (el) el.outerHTML = statusLineHtml(config, kind, updatedText);
  }

  function renderLoading(config) {
    view = null;
    contentEl.setAttribute("aria-busy", "true");
    contentEl.innerHTML =
      backLink() +
      '<header class="module__head">' +
        statusLineHtml(config, "loading") +
        '<h2 tabindex="-1">' + esc(config.fullTitle) + "</h2>" +
      "</header>" +
      '<div class="skeleton" aria-label="Laadin andmestikku ' + esc(config.title) + '">' +
        '<div class="skeleton__bar skeleton__bar--short"></div>' +
        '<div class="skeleton__bar skeleton__bar--title"></div>' +
        '<div class="skeleton__bar"></div>' +
        '<div class="skeleton__block"></div>' +
      "</div>";
  }

  function renderError(config, err) {
    view = null;
    var info = TAI.describeError(err, config);
    contentEl.setAttribute("aria-busy", "false");
    contentEl.innerHTML =
      backLink() +
      '<header class="module__head">' +
        statusLineHtml(config, "error") +
        '<h2 tabindex="-1">' + esc(config.fullTitle) + "</h2>" +
        '<p class="module__subtitle">' + esc(TAI.describe(config)) + "</p>" +
      "</header>" +
      '<div class="error-box" role="alert">' +
        "<h3>" + esc(info.title) + "</h3>" +
        "<p>" + esc(info.text) + "</p>" +
        '<button type="button" class="btn" data-action="retry">Proovi uuesti</button>' +
        (info.offerUpload ?
          '<div class="error-box__upload">' +
            '<label for="upload-file">Või lae andmed failina üles</label>' +
            '<p class="muted">Ava ' + TAI.externalLink(TAI.sourceUrl(config), "tabel " + config.code + " " + TAI.sourceLabel(config) + " andmebaasis") +
              ", vali kõik väärtused ja salvesta vormingus JSON-stat2.</p>" +
            '<input type="file" id="upload-file" accept=".json,application/json">' +
          "</div>" : "") +
      "</div>";

    contentEl.querySelector('[data-action="retry"]').addEventListener("click", function () { select(config.code); });
    var input = contentEl.querySelector("#upload-file");
    if (input) {
      input.addEventListener("change", function () {
        var file = input.files && input.files[0];
        if (!file) return;
        TAI.readUploadedFile(file, config).then(function (reader) {
          // Üleslaaditud fail sisaldab kogu tabelit → sama lugeja teenindab kõiki vaateid ja filtreid.
          var data = {};
          Object.keys(config.queries(stateOf(config))).forEach(function (name) { data[name] = reader; });
          setRowStatus(config.code, null);
          renderModule(config, data, { source: "file", fileName: file.name });
          usage.track(usage.keyAction(config.code, "fail"));
        }).catch(function (e) {
          renderError(config, e);
        });
      });
    }
  }

  // ---- moodul ---------------------------------------------------------

  function stateOf(config) {
    if (!states[config.code]) states[config.code] = defaultState(config);
    return states[config.code];
  }

  /*
   * Filtrid kahes reas: pealmises rippmenüüd, sh Sugu, igaühe all selle filtri
   * võrdlusnupp, kui aruanne võrdlust toetab. Kui võrdlus on sees, näitab menüü võrdluse rida; väärtuse valimine lülitab selle välja.
   */
  function renderFilters(config, state) {
    var html = '<div class="filters" role="group" aria-label="Filtrid">';
    (config.filters || []).forEach(function (code) {
      var v = config.vars[code];
      var id = "filter-" + code;
      var active = TAI.activeComparisonFor(config, state, code);
      var comparing = !!active;
      // optionLabels (valikuline): rippmenüü sildid hierarhia-taandega (nt "– Kardioloog"); mujal
      // (callout, filtrikokkuvõte, graafikud) kasutatakse puhtaid labels'eid (04.11.2026).
      var optLabels = v.optionLabels || v.labels;
      html += '<div class="field"><label for="' + esc(id) + '">' + esc(v.label) + "</label>" +
        '<select id="' + esc(id) + '" data-filter="' + esc(code) + '">' +
        v.values.map(function (val, i) {
          return '<option value="' + esc(val) + '"' + (!comparing && state[code] === val ? " selected" : "") + ">" + esc(optLabels[i]) + "</option>";
        }).join("") +
        (comparing ? '<option value="compare" selected disabled>' + esc(active.label) + "</option>" : "") +
        "</select>" +
        TAI.comparisonsFor(config, code).map(function (c) {
          return '<button type="button" class="compare-btn" id="' + c.buttonId + '" data-action="toggle-compare" data-compare="' + c.flag +
            '" aria-pressed="' + (state[c.flag] ? "true" : "false") + '">' + esc(c.buttonLabel) + "</button>";
        }).join("") +
        "</div>";
    });
    // Mitme kategooriaga mõõdiku võrdlus: lisamenüü, millist kategooriat rühmade vahel võrreldakse (nt „Väga rahul“)
    var mv = comparedMeasureVar(config, state);
    if (mv) {
      var mvId = "filter-" + config.seriesVar;
      var mvCurrent = state[config.seriesVar] != null ? state[config.seriesVar] : mv.values[0];
      html += '<div class="field"><label for="' + esc(mvId) + '">' + esc(mv.label) + "</label>" +
        '<select id="' + esc(mvId) + '" data-filter="' + esc(config.seriesVar) + '">' +
        mv.values.map(function (val, i) {
          return '<option value="' + esc(val) + '"' + (mvCurrent === val ? " selected" : "") + ">" + esc(mv.labels[i]) + "</option>";
        }).join("") + "</select></div>";
    }
    return html + "</div>";
  }

  /* Filtrite uuesti joonistamine kohapeal (nupp ja menüü peavad olema kooskõlas); fookus jääb samale elemendile. */
  function refreshFilters() {
    var block = contentEl.querySelector(".filters");
    if (!block || !view) return;
    var activeId = block.contains(document.activeElement) ? document.activeElement.id : "";
    block.outerHTML = renderFilters(view.config, stateOf(view.config));
    if (activeId) {
      var el = document.getElementById(activeId);
      if (el) el.focus({ preventScroll: true });
    }
  }

  /* Mooduli karkass: eyebrow, pealkiri, alapealkiri, meta, filtrid, sisu, jalus. */
  function renderModule(config, data, source) {
    var state = stateOf(config);
    view = { config: config, data: data, source: source };

    /*
     * ühik peab olema läbivalt nähtav ja selge, kas suurem number
     * on parem või halvem — see jääb kehtima, aga alates 18.09.2026 õhtusest tagasisidest ei kordu
     * mõõdik/uuringuaastad enam eraldi päise pillidena (need on juba trendi/tabeli sees nähtavad);
     * Suuna-vihje (parem/halvem) on alates 04.11.2026 KPI-kaardi paremas ülanurgas (vt module.js
     * renderKpis) — päises on pill ainult siis, kui andmed on käsitsi üles laaditud failist.
     */
    var meta = [];
    if (source.source === "file") meta.push("Allikas: fail " + source.fileName);

    document.title = config.title + " · " + BASE_TITLE;
    contentEl.setAttribute("aria-busy", "false");
    contentEl.innerHTML =
      backLink() +
      '<article class="module">' +
        '<header class="module__head">' +
          // Ülemine rida: staatusrida väiksemas kirjas + AI-nupud selle järel samal real
          '<div class="module__topbar">' +
            statusLineHtml(config, source.source === "api" ? "loaded" : "none", tableUpdatedText(data)) +
            '<div class="ai-box"><span class="ai-box__label">Analüüsi kuvatud andmeid AI-ga:</span>' +
              TAI.aiTargets.map(function (t) {
                return '<button type="button" class="ai-box__btn" data-ai="' + t.id + '">' + esc(t.label) + "</button>";
              }).join("") +
              '<p class="ai-box__msg" role="status" aria-live="polite"></p>' +
            "</div>" +
          "</div>" +
          '<h2 tabindex="-1">' + esc(config.fullTitle) + "</h2>" +
          '<p class="module__subtitle">' + esc(TAI.describe(config)) + "</p>" +
          (meta.length ? '<ul class="module__meta">' + meta.map(function (m) { return '<li class="pill">' + esc(m) + "</li>"; }).join("") + "</ul>" : "") +
        "</header>" +
        siblingSwitchHtml(config) +
        renderFilters(config, state) +
        '<div class="module__body" aria-live="polite"></div>' +
        '<footer class="module__footnotes">' +
          '<h3 class="module__footnotes-heading">Metaandmed</h3>' +
          config.footnotes.map(function (f) { return "<p>" + esc(f) + "</p>"; }).join("") +
          "<p>Allikas: " + esc(TAI.sourceLongLabel(config)) + ", " + TAI.externalLink(TAI.sourceUrl(config), "tabel " + config.code) + ".</p>" +
          sourceNoticeHtml(config) +
        "</footer>" +
      "</article>";

    renderBody();
  }

  /* Legendi värvilapid: värv tuleb data-swatch atribuudist CSSOM-iga (CSP ei luba style="…" atribuuti HTML-is). */
  function applySwatches(root) {
    Array.prototype.forEach.call(root.querySelectorAll("[data-swatch]"), function (s) {
      s.style.background = s.getAttribute("data-swatch");
    });
  }

  function renderBody() {
    if (!view) return;
    var body = contentEl.querySelector(".module__body");
    if (!body) return;
    clearAiNotice();
    var config = view.config;
    var model = TAI.buildModel(config, view.data, stateOf(config));
    var callout = TAI.calloutText(model);

    // Valitud lõige on KPI kastis ning iga joonise ja tabeli pealkirja all (module.js TAI.sliceParts, 05.11.2026)
    var html = TAI.renderKpis(model);
    // config.calloutNote(model) → tekst või null: väikeses kirjas märkus kokkuvõtte kastis (nt väga väikeste väärtuste hoiatus)
    var calloutNote = typeof config.calloutNote === "function" ? config.calloutNote(model) : null;
    if (callout) {
      html += '<p class="callout">' + esc(callout) +
        (calloutNote ? ' <small class="callout__note">' + esc(calloutNote) + "</small>" : "") + "</p>";
    }

    // Mõõdik, ühik, suund ja aastavahemik on juba päise meta-plaatidel (vt renderModule) — siin
    // ei korrata neid, ainult graafikuspetsiifiline info (nt breakdown-vaate konkreetne aasta).
    if (model.trend) {
      html += '<section class="chart-section" aria-labelledby="h-trend">' +
        '<h3 id="h-trend">Trend aastate lõikes</h3>' + TAI.sliceHtml(TAI.trendSlice(model)) +
        TAI.renderLegend(model.series, model.reference, config.country) +
        '<div class="chart-holder"><svg class="chart" id="chart-trend" role="group" aria-label="Trendijoonis"></svg>' +
        '<div class="tooltip" aria-hidden="true"></div></div>' +
        (config.trendNote ? '<p class="chart-note chart-note--after">' + esc(config.trendNote) + "</p>" : "") +
        "</section>";
    }
    if (model.breakdown) {
      html += '<section class="chart-section" aria-labelledby="h-breakdown">' +
        '<h3 id="h-breakdown">' + esc(model.breakdown.title) + "</h3>" +
        TAI.sliceHtml(TAI.breakdownSlice(model)) +
        (model.breakdown.totals ? '<p class="chart-note">Katkendjoon näitab koondväärtust.</p>' : "") +
        TAI.renderLegend(model.series) +
        '<div class="chart-holder"><svg class="chart" id="chart-breakdown" role="group" aria-label="Tulpdiagramm"></svg>' +
        '<div class="tooltip" aria-hidden="true"></div></div>' + barMoreHtml(model.breakdown) + "</section>";
    }
    html += '<details class="data-details"><summary>Näita andmeid tabelina</summary>' + TAI.renderDataTables(model) + "</details>";

    body.innerHTML = html;
    applySwatches(body);
    body.classList.remove("is-loading");
    body.removeAttribute("aria-busy");
    body._model = model;
    var more = body.querySelector(".bar-more");
    if (more) more.addEventListener("click", function () {
      model.breakdown.showAll = !model.breakdown.showAll;
      more.setAttribute("aria-expanded", String(model.breakdown.showAll));
      more.textContent = barMoreText(model.breakdown);
      drawCharts();
    });
    drawCharts();
  }

  // Pika tulba lüliti (config.views.breakdown.limit, vt module.js TAI.visibleBarGroups)
  function barMoreText(b) {
    return b.showAll ? "Näita " + b.limit + (b.sorted ? " suurimat" : " esimest")
                     : "Näita kõiki (" + TAI.barItemCount(b) + ")";
  }

  function barMoreHtml(b) {
    if (!b.limit || TAI.barItemCount(b) <= b.limit) return "";
    return '<button type="button" class="view-toggle bar-more" aria-expanded="' + b.showAll + '" ' +
      'aria-controls="chart-breakdown">' + esc(barMoreText(b)) + "</button>";
  }

  var lastChartWidth = 0;

  function drawCharts() {
    var body = contentEl.querySelector(".module__body");
    if (!body || !body._model) return;
    var model = body._model;
    var trendSvg = body.querySelector("#chart-trend");
    var barSvg = body.querySelector("#chart-breakdown");
    var holder = body.querySelector(".chart-holder");
    if (!holder) return;
    var width = Math.floor(holder.clientWidth);
    lastChartWidth = width;
    if (trendSvg) {
      TAI.drawTrendChart(trendSvg, model, width);
      attachTooltipOnce(trendSvg);
    }
    if (barSvg) {
      TAI.drawBarChart(barSvg, model, width);
      attachTooltipOnce(barSvg);
    }
  }

  // ümberjoonistamisel (resize) sama SVG element jääb alles → kuulajaid mitte dubleerida
  function attachTooltipOnce(svg) {
    if (svg._hasTooltip) return;
    TAI.attachTooltip(svg, svg.nextElementSibling);
    svg._hasTooltip = true;
  }

  // execCommand("copy") ei küsi brauseri lõikelaua-luba (Clipboard API küsib näiteks file:// alt avades)
  function copyViaTextarea(str) {
    var ta = document.createElement("textarea");
    ta.value = str;
    ta.setAttribute("readonly", "");
    // 16 px: iOS ei suumi lehte; setSelectionRange: iOS-is select() üksi ei vali kirjutuskaitstud teksti
    ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;font-size:16px";
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, str.length);
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  // Alati ekraani vasakus servas (AI-aken avaneb paremale), et popup seda ei kataks
  function showAiToast(text) {
    var el = document.getElementById("ai-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "ai-toast";
      el.className = "ai-toast";
      el.setAttribute("role", "status");
      el.innerHTML = '<p class="ai-toast__text"></p><button type="button" class="ai-toast__close" aria-label="Sulge">Selge</button>';
      el.querySelector("button").addEventListener("click", function () { el.hidden = true; });
      document.body.appendChild(el);
    }
    el.querySelector("p").textContent = text;
    el.hidden = false;
  }

  /*
   * Teise saidi (AI) lehele ei saa meie lehelt midagi kuvada. Chrome/Edge "Document Picture-in-Picture"
   * annab aga alati-peal-ujuva väikese akna meie enda HTML-iga — see jääb AI akna peale. Muudes
   * brauserites (või kui avamine ebaõnnestub) kuvatakse sama teade vasakus alanurgas (showAiToast).
   * Peab käivituma kasutaja klõpsu käigus, seega kutsutakse enne window.open'i.
   */
  function showAiNotice(text, aiWindow) {
    var dpip = window.documentPictureInPicture;
    if (!dpip || !dpip.requestWindow) { showAiToast(text); return; }
    dpip.requestWindow({ width: 380, height: 200 }).then(function (pip) {
      var d = pip.document;
      d.head.innerHTML = '<meta charset="utf-8"><title>Juhis</title><style>' +
        "body{margin:0;padding:16px;font:500 16px/1.4 Roboto,system-ui,sans-serif;color:#0e0f21;background:#F0F8FF;border-left:6px solid #4B7DFF;box-sizing:border-box;height:100vh}" +
        "p{margin:0 0 12px}button{font:inherit;font-size:14px;font-weight:500;cursor:pointer;padding:5px 18px;border:0;border-radius:999px;background:#4B7DFF;color:#fff}" +
        "</style>";
      d.body.innerHTML = "<p></p><button type=\"button\">Sulge</button>";
      d.body.querySelector("p").textContent = text;
      d.body.querySelector("button").addEventListener("click", function () {
        // PiP sulgemisel läheb fookus näidikulaua aknale ja AI-aken jääb selle taha → toome AI-akna tagasi ette
        pip.addEventListener("pagehide", function () { try { if (aiWindow && !aiWindow.closed) aiWindow.focus(); } catch (e) { /* teine päritolu, fookus ei õnnestunud */ } });
        try { if (aiWindow && !aiWindow.closed) aiWindow.focus(); } catch (e) { /* ignoreeri */ }
        pip.close();
      });
    }).catch(function () { showAiToast(text); });
  }

  // Filtri muutes kuvatud lõige muutub, aga lõikelaual on eelmise lõike andmed → vana teade, käsitsi kopeerimise
  // tekstikast, alanurga teade ja Picture-in-Picture aken eemaldatakse (renderBody alguses).
  function clearAiNotice() {
    var box = contentEl.querySelector(".ai-box");
    if (box) {
      box.classList.remove("is-active");
      var msg = box.querySelector(".ai-box__msg");
      if (msg) msg.textContent = "";
      var ta = box.querySelector(".ai-box__text");
      if (ta) ta.parentNode.removeChild(ta);
    }
    var toast = document.getElementById("ai-toast");
    if (toast) toast.hidden = true;
    var dpip = window.documentPictureInPicture;
    if (dpip && dpip.window) { try { dpip.window.close(); } catch (e) { /* juba suletud */ } }
  }

  // Puuteekraaniga seadmel (telefon, tahvel) pole Ctrl+V-d ja aken ei avane kõrvale, vaid uuel vahelehel või rakenduses
  function isTouchDevice() { return window.matchMedia("(pointer: coarse)").matches; }

  function aiCopiedText() {
    return "Näidikulaua andmed on kopeeritud lõikelauale. " + (isTouchDevice()
      ? "Hoia AI vestlusaknas sõrme tekstikastil, vali „Kleebi“ ja saada."
      : "Vajuta AI vestlusaknas Ctrl+V, et sisestada need analüüsiks, ja seejärel Enter.");
  }

  function aiManualCopyText() {
    return "Automaatne kopeerimine ei õnnestunud. Kopeeri tekst siit käsitsi " + (isTouchDevice()
      ? "(hoia sõrme tekstil, vali kõik ja kopeeri)"
      : "(Ctrl+A, Ctrl+C)") + " ja kleebi avanenud vestlusaknasse:";
  }

  // Arvutis: popup parempoolsesse pooleekraani; puuteseadmel ilma akna mõõtudeta (need ei kehti)
  function openAiService(url) {
    if (isTouchDevice()) return window.open(url, "tai-ai-analysis");
    var w = Math.round(screen.availWidth * 0.5), h = screen.availHeight - 40;
    var left = (screen.availLeft || 0) + screen.availWidth - w, top = screen.availTop || 0;
    return window.open(url, "tai-ai-analysis", "popup=yes,width=" + w + ",height=" + h + ",left=" + left + ",top=" + top);
  }

  contentEl.addEventListener("click", function (evt) {
    var btn = evt.target.closest("button[data-ai]");
    if (!btn || !view) return;
    var target = TAI.aiTargets.filter(function (t) { return t.id === btn.getAttribute("data-ai"); })[0];
    var box = btn.closest(".ai-box");
    var msg = box.querySelector(".ai-box__msg");
    var prompt = TAI.buildAiPrompt(view.config, contentEl);
    // kopeerimine PEAB toimuma enne uue akna avamist: pärast seda ei ole leht enam fookuses ja brauser küsiks luba
    var copied = copyViaTextarea(prompt);
    box.classList.add("is-active");
    // Kopeerimise õnnestumise teade on ainult ujuvas aknas või alanurgas (mitte topelt).
    // Nupukasti jääb tekst ainult siis, kui kopeerimine ebaõnnestus, sest see juhendab sealset tekstikasti.
    if (copied) {
      msg.textContent = "";
      var oldTa = box.querySelector("textarea");
      if (oldTa) oldTa.parentNode.removeChild(oldTa);
    } else {
      msg.textContent = aiManualCopyText();
      var ta = box.querySelector("textarea");
      if (!ta) { ta = document.createElement("textarea"); ta.className = "ai-box__text"; ta.readOnly = true; ta.rows = 8; box.appendChild(ta); }
      ta.value = prompt;
    }
    // AI-aken avatakse ENNE teate akent: PiP-akna loomine kulutab kasutaja klõpsu ja brauser blokeeriks siis window.open'i
    var opened = openAiService(target.url);
    if (!opened) opened = window.open(target.url, "_blank");
    // uus aken ei saa viidata tagasi näidikulauale (window.opener)
    if (opened) opened.opener = null;
    showAiNotice(copied ? aiCopiedText() : msg.textContent, opened);

    usage.track(usage.keyAction(view.config.code, "ai-" + target.id));
  });

  // filtrid: muutmine laadib andmed kohe (API) või arvutab failist uuesti
  // Õdetabeli lõike vahetus: ühised filtrid (nt Sugu, Vanus), mille väärtus sobib ka õele, võetakse kaasa.
  contentEl.addEventListener("click", function (evt) {
    var b = evt.target.closest("[data-sibling]");
    if (!b || !view) return;
    var target = TAI.getTable(b.getAttribute("data-sibling"));
    if (!target || target === view.config) return;
    var from = stateOf(view.config), to = stateOf(target);
    (target.filters || []).forEach(function (code) {
      var v = target.vars[code];
      if (from[code] != null && v && v.values.indexOf(from[code]) >= 0) to[code] = from[code];
    });
    location.hash = hashFor(target);   // hashchange → select()
  });

  contentEl.addEventListener("change", function (evt) {
    if (!view) return;
    var t = evt.target;
    var state = stateOf(view.config);
    if (t.matches("select[data-filter]")) {
      state[t.getAttribute("data-filter")] = t.value;
      // võrdluse kategooria lisamenüül loendurit pole (see pole aruande filter)
      if ((view.config.filters || []).indexOf(t.getAttribute("data-filter")) >= 0) {
        usage.track(usage.keyFilter(view.config.code, t.getAttribute("data-filter"), t.value));
      }
      // väärtuse valimine menüüst lülitab selle filtri võrdluse välja; menüü kaotab seejärel võrdluse rea
      var comp = TAI.activeComparisonFor(view.config, state, t.getAttribute("data-filter"));
      if (comp) {
        state[comp.flag] = false;
        refreshFilters();
      }
    } else {
      return;
    }
    // aadress kajastab vaadet; replaceState ei tekita hashchange'i ega uut ajaloo kirjet
    history.replaceState(null, "", hashFor(view.config));
    setActiveRow(view.config.code);   // HSPA-vaates võib aktiivne rida filtriga muutuda
    reload();
  });

  // Võrdlusnupp: sisse/välja, korraga üks võrdlus. Mõlemal juhul läheb selle filtri väärtus vaikevalikule.
  contentEl.addEventListener("click", function (evt) {
    var btn = evt.target.closest('[data-action="toggle-compare"]');
    if (!btn || !view) return;
    var config = view.config;
    var state = stateOf(config);
    var comp = TAI.comparisonsOf(config).filter(function (c) { return c.flag === btn.getAttribute("data-compare"); })[0];
    if (!comp) return;
    var turnOn = !state[comp.flag];
    TAI.comparisonsOf(config).forEach(function (c) { state[c.flag] = false; });
    state[comp.flag] = turnOn;
    state[comp.filter] = TAI.filterDefault(config.vars[comp.filter]);
    if (!turnOn) delete state[config.seriesVar];   // võrdluse kategooria valik ei jää alles
    usage.track(usage.keyFilter(config.code, comp.filter, turnOn ? comp.usageOn : comp.usageOff));
    history.replaceState(null, "", hashFor(config));
    refreshFilters();
    setActiveRow(config.code);
    reload();
  });

  async function reload() {
    var config = view.config;
    if (view.source.source === "file") { renderBody(); return; }

    var body = contentEl.querySelector(".module__body");
    var myRequest = ++requestId;
    body.classList.add("is-loading");
    body.setAttribute("aria-busy", "true");
    setRowStatus(config.code, "loading");
    setStatus(config, "loading");
    try {
      var yearsBefore = config.years.length;
      var data = await TAI.loadTable(config, stateOf(config));
      if (config.years.length !== yearsBefore) renderList();   // uus aasta API-st → loendirea periood ajakohaseks
      if (myRequest !== requestId || !view || view.config !== config) return;
      view.data = data;
      setRowStatus(config.code, null);
      renderBody();
      setStatus(config, "loaded", tableUpdatedText(data));
    } catch (err) {
      if (myRequest !== requestId) return;
      console.error(err);
      setRowStatus(config.code, "error");
      renderError(config, err);
    }
  }

  var resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      var holder = contentEl.querySelector(".chart-holder");
      if (holder && Math.floor(holder.clientWidth) !== lastChartWidth) drawCharts();
    }, 150);
  });

  // ---- valimine -------------------------------------------------------

  async function select(code, opts) {
    opts = opts || {};
    var config = TAI.getTable(code);
    if (!config) { current = null; setActiveRow(null); renderEmpty(); return; }

    current = code;
    var myRequest = ++requestId;
    setActiveRow(code);
    TAI.getTables().forEach(function (t) { if (t.code !== code) setRowStatus(t.code, null); });
    setRowStatus(code, "loading");
    renderLoading(config);
    if (opts.scroll) scrollToContent();

    try {
      var yearsBefore = config.years.length;
      var data = await TAI.loadTable(config, stateOf(config));
      if (config.years.length !== yearsBefore) renderList();   // uus aasta API-st → loendirea periood ajakohaseks
      if (myRequest !== requestId) return;
      setRowStatus(code, null);
      renderModule(config, data, { source: "api" });
      usage.track(usage.keyDataset(code)).then(function (v) { showRowCount(code, v); });
      if (opts.scroll) { scrollToContent(); focusHeading(); }
    } catch (err) {
      if (myRequest !== requestId) return;
      console.error(err);
      setRowStatus(code, "error");
      renderError(config, err);
      // sisu vahetus katkestab laadimise ajal alanud sujuva kerimise → keri uuesti
      if (opts.scroll) scrollToContent();
    }
  }

  function scrollBehavior() { return REDUCED_MOTION.matches ? "auto" : "smooth"; }

  /* Sujuv kerimine; kui see ei hakka üldse liikuma (nt mõnes iframe'is, kus brauser animatsiooni ei käivita),
     hüpatakse kohale. Kui leht on hakanud liikuma (animatsioon või kasutaja ise), ei sekkuta. */
  function smoothScrollTo(el) {
    var startY = window.scrollY;
    el.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
    setTimeout(function () {
      if (window.scrollY === startY && Math.abs(el.getBoundingClientRect().top) > 2) {
        el.scrollIntoView({ behavior: "instant", block: "start" });
      }
    }, 400);
  }

  /* Uue aruande avamisel algab see ülevalt. Kitsas ekraanil on loend aruande kohal, seega
     keritakse alati; laial ekraanil ainult siis, kui leht on kerinud aruande algusest mööda (nt lugenud pikka
     aruannet ja valib kleepuvast loendist teise), muidu algaks uus aruanne keskelt. */
  function scrollToContent() {
    if (MOBILE_QUERY.matches) {
      smoothScrollTo(contentEl);
    } else if (contentEl.getBoundingClientRect().top < 0) {
      // laial ekraanil kohe (mitte sujuvalt): sisu vahetub ja kasvab kerimise ajal, sujuv kerimine katkeks
      contentEl.scrollIntoView({ behavior: "instant", block: "start" });
    }
  }

  function focusHeading() {
    if (!MOBILE_QUERY.matches) return;
    var h = contentEl.querySelector(".module__head h2");
    if (h) h.focus({ preventScroll: true });
  }

  function onHashChange() {
    var parsed = parseHash();
    var config = TAI.getTable(parsed.code);
    var scroll = pendingScroll;
    pendingScroll = false;
    if (!config) {
      if (current) { current = null; setActiveRow(null); renderEmpty(); }
      return;
    }
    var before = JSON.stringify(states[config.code] || null);
    states[config.code] = stateFromParams(config, parsed.params);
    var filtersChanged = before !== JSON.stringify(states[config.code]);

    if (config.code !== current || scroll) {
      select(config.code, { scroll: scroll });
    } else if (filtersChanged) {
      // sama tabel, teised filtrid (nt brauseri „tagasi“ või käsitsi muudetud aadress)
      if (view && view.config === config) { renderModule(config, view.data, view.source); if (view.source.source !== "file") reload(); }
      else select(config.code);
    }
  }

  // ---- käivitus -------------------------------------------------------

  // „↑ Tagasi andmestike juurde“: keri loendini, aadressi (valitud tabelit) mitte muuta
  contentEl.addEventListener("click", function (evt) {
    var link = evt.target.closest(".back-link");
    if (!link) return;
    evt.preventDefault();
    smoothScrollTo(listEl);
    var activeBtn = listEl.querySelector(".dataset.is-active .dataset__button");
    if (activeBtn) activeBtn.focus({ preventScroll: true });
  });

  // ---- kasutusstatistika (js/usage.js) --------------------
  // Kui teenus ei vasta, arve lihtsalt ei kuvata — leht töötab edasi.

  var usage = TAI.usage;
  var numberFmt = new Intl.NumberFormat("et-EE");

  // „ligikaudu“: avalikku loendurit saab suurendada ka väljastpoolt lehte
  function viewsText(n) { return "ligikaudu " + numberFmt.format(n) + (n === 1 ? " vaatamine" : " vaatamist"); }

  function showCount(el, value) {
    if (!el || value == null) return;
    el.textContent = viewsText(value);
    el.hidden = false;
  }

  // Vaatamiste arvud jäetakse meelde, et vaate vahetamisel (loendi uuesti joonistamisel) need ei kaoks.
  var rowCounts = {};
  function showRowCount(code, value) {
    if (value == null) return;
    rowCounts[code] = value;
    Array.prototype.forEach.call(rowsOf(code), function (row) { showCount(row.querySelector(".dataset__views"), value); });
  }

  /* Loendurite lugemine: avaleht esimesena, siis andmestike arvud järjekorras (3 korraga, ajutise tõrke korral üks kordus),
     sest loenduriteenus vastab vahel veaga, kui talle tuleb korraga kümneid päringuid. */
  function loadViewCount() {
    usage.track(usage.HOME_KEY, { everyTime: true }).then(function (v) {
      if (v !== undefined) return v;
      // ajutine tõrge: loe arv hiljem uuesti (ilma suurendamata, et avamist mitte topelt lugeda)
      return new Promise(function (resolve) { setTimeout(resolve, 1500); }).then(function () { return usage.get(usage.HOME_KEY); });
    }).then(function (v) { showCount(document.getElementById("view-count"), v); });
    var queue = TAI.getTables().slice(), WORKERS = 3;
    function readCount(t, retry) {
      return usage.get(usage.keyDataset(t.code)).then(function (v) {
        if (v === undefined && retry) {
          return new Promise(function (resolve) { setTimeout(resolve, 1500); }).then(function () { return readCount(t, false); });
        }
        showRowCount(t.code, v);
      });
    }
    function worker() {
      var t = queue.shift();
      if (!t) return Promise.resolve();
      return readCount(t, true).then(worker);
    }
    for (var i = 0; i < WORKERS; i++) worker();
  }

  // andmetabeli avamine (toggle ei mullitu → capture)
  contentEl.addEventListener("toggle", function (evt) {
    if (view && evt.target.matches && evt.target.matches("details.data-details") && evt.target.open) {
      usage.track(usage.keyAction(view.config.code, "andmetabel"));
    }
  }, true);

  // TAI allikalingi klõps (loendis või moodulis; ka keskmise nupuga uude kaardi avamine)
  function onSourceClick(evt) {
    var link = evt.target.closest && evt.target.closest('a[href*="statistika.tai.ee/pxweb"], a[href*="ec.europa.eu/eurostat"]');
    if (!link) return;
    var row = link.closest(".dataset");
    var code = row ? row.getAttribute("data-code") : (contentEl.contains(link) && view ? view.config.code : null);
    if (code) usage.track(usage.keyAction(code, "allikas"));
  }
  document.addEventListener("click", onSourceClick);
  document.addEventListener("auxclick", onSourceClick);

  // printimine: andmetabel avatakse, pärast taastatakse kasutaja valik
  var reopened = [];
  window.addEventListener("beforeprint", function () {
    if (view) usage.track(usage.keyAction(view.config.code, "prindi"));
    reopened = Array.prototype.filter.call(contentEl.querySelectorAll("details.data-details"), function (d) { return !d.open; });
    reopened.forEach(function (d) { d.open = true; });
  });
  window.addEventListener("afterprint", function () {
    reopened.forEach(function (d) { d.open = false; });
    reopened = [];
  });

  renderList();
  renderFooter();
  loadViewCount();
  window.addEventListener("hashchange", onHashChange);
  if (TAI.getTable(parseHash().code)) {
    onHashChange();
  } else {
    renderEmpty();
  }
})(window.TAI);
