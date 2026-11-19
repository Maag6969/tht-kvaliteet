/* AI-analüüsi juhise koostamine: võtab ekraanil juba nähtava aruande (filtrid, KPI-d, tabelid, metaandmed)
 * ja lisab kokkulepitud analüüsijuhise. Lõikelauale kopeerimine + teenuse avamine toimub app.js-is. */
(function () {
  "use strict";

  var TARGETS = [
    { id: "claude", label: "Claude", url: "https://claude.ai/new" },
    { id: "chatgpt", label: "ChatGPT", url: "https://chatgpt.com/" },
    { id: "gemini", label: "Gemini", url: "https://gemini.google.com/app" }
  ];

  var INSTRUCTIONS = [
    "Oled tervishoiu kvaliteedianalüütik. Allpool on Eesti tervishoiuteenuste kvaliteedi näidikulaua üks aruanne koos kasutaja valitud filtritega ja kõigi ekraanil kuvatud andmetega. Kirjuta eesti keeles selge, neutraalse tooniga analüüs järgmises struktuuris:",
    "1. Lühikirjeldus — mida näitaja mõõdab ja milline lõige (filtrid) on praegu valitud.",
    "2. Trendi analüüs — liikumise suund, märgatavad murdepunktid, erinevused gruppide vahel; ütle selgelt, kas olukord on paranenud või halvenenud (arvesta, kumb suund on antud näitaja puhul parem). Nimeta iga trendiväite juures, mitu andmepunkti seda toetab; kui trend põhineb vaid ühel-kahel viimasel punktil, nimeta seda esialgseks märgiks, mitte kindlaks trendiks.",
    "3. Seosed ja võimalikud põhjused — tõlgendus, kus on iga väide selgelt märgitud kas „andmetest tulenev“ või „oletus“. Oletused sõnasta ettevaatlikult („võib olla seotud“, „üks võimalik selgitus“); ära kasuta väljendeid nagu „suure tõenäosusega“, „kindlasti“ või „ilmselt“.",
    "4. Soovitused — jaga kaheks: (a) tervishoiu soovitused ehk võimalikud sammud ja küsimused tervishoiusüsteemile; (b) andmete täiendamise ettepanekud ehk mida näidikulaud või andmestik võiks lisaks sisaldada. Mõlemad ettevaatlikult sõnastatult, ilma kategooriliste väideteta.",
    "5. Rahvusvaheline võrdlus — kui samal teemal on teada võrreldavat statistikat Eurostatist, OECD-st või muust usaldusväärsest avalikust allikast (nt European Social Survey, ülikoolide avalikud uuringud), maini see viidetega ja märgi, et tegemist on võimaliku võrdlusallikaga. Ära väida, et Eesti tulemused on rahvusvaheliselt „hästi võrreldavad“ või kus Eesti teiste riikide suhtes asub, kui sul pole selle kohta allpool antud või kontrollitud andmeid. Viited välisallikatele (nt OECD, Eurostat) on lubatud, kui oled kindel, et leht tegelikult olemas on; ära leiuta numbreid ega linke ja kui ei ole kindel, ütle seda. Lingid kirjuta puhtal kujul, ilma jälgimisparameetriteta (nt ilma „?utm_source=…“ lisandita). Välisallikast ära too sisse numbreid, ainult viide.",
    "Reeglid: kasuta numbritena ainult allpool antud andmeid; ära too sisse väliseid arve (välisallikatele võib viidata, vt osa 5). Eralda alati fakt oletusest ja nimeta andmete piirangud (nt valimi suurus, ajavahemik, metoodika erinevused). See ei ole meditsiiniline nõuanne."
  ].join("\n");

  // Väliste linkide märge („↗ (avaneb uues aknas)“, TAI.externalLink) on ekraanilugeja jaoks, juhises oleks see müra
  function text(el) {
    return el ? el.textContent.replace(/\s*↗?\s*\(avaneb uues aknas\)/g, "").replace(/\s+/g, " ").trim() : "";
  }

  function tableText(table) {
    var lines = [];
    var cap = table.querySelector("caption");
    if (cap) lines.push(text(cap));
    table.querySelectorAll("tr").forEach(function (tr) {
      var cells = Array.prototype.map.call(tr.children, text);
      if (cells.length) lines.push(cells.join(" | "));
    });
    return lines.join("\n");
  }

  TAI.aiTargets = TARGETS;

  TAI.buildAiPrompt = function (config, root) {
    var parts = [INSTRUCTIONS, "", "=== ARUANNE ==="];
    parts.push("Pealkiri: " + config.fullTitle);
    if (config.description) parts.push("Kirjeldus: " + TAI.describe(config));   // aastavahemik andmetest
    parts.push("Allikas: " + TAI.sourceLongLabel(config) + ", tabel " + config.code + " (" + TAI.sourceUrl(config) + ")");

    // Suuna-vihje on alates 04.11.2026 KPI-kaardil (.kpi__hint), mitte päise pillina; arvestame mõlemaga.
    var hint = text(root.querySelector(".kpi__hint")) || text(root.querySelector(".module__meta"));
    if (hint) parts.push("Suund: " + hint);
    var summary = text(root.querySelector(".kpi__slice, .kpi-block__slice"));   // valitud lõige KPI kastis (05.11.2026)
    if (summary) parts.push("Valitud filtrid: " + summary);

    // KPI-kaardi osad eraldi (silt; väärtus; muutus; märkused) — suuna-vihje on juba ülal „Suund:" real
    var kpis = Array.prototype.map.call(root.querySelectorAll(".kpi"), function (k) {
      return Array.prototype.map.call(k.querySelectorAll(".kpi__label, .kpi__value, .kpi__delta, .kpi__note"), text)
        .filter(Boolean).join("; ");
    });
    if (kpis.length) parts.push("", "Võtmenäitajad:", kpis.map(function (k) { return "- " + k; }).join("\n"));

    var callout = text(root.querySelector(".callout"));
    if (callout) parts.push("", "Automaatne kokkuvõte: " + callout);

    root.querySelectorAll(".data-table").forEach(function (t) { parts.push("", tableText(t)); });

    var notes = Array.prototype.map.call(root.querySelectorAll(".module__footnotes p"), text);
    if (notes.length) parts.push("", "Metaandmed:", notes.join("\n"));

    return parts.join("\n");
  };
})();
