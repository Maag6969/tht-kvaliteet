/*
 * Rahvastiku tervise arengukava (RTA) vastavus menüüs (19.11.2026).
 *
 * Üldvaate menüüreal on RTA märk ainult siis, kui aruanne on TÄPSELT sama näitaja kui RTA põhidokumendi näitaja või
 * programmi 2026–2029 mõõdik („RTA · <programm>, <periood>“). Lähedased ja teemalised seosed menüüsse ei lähe.
 * HSPA-vaate RTA märk tuleb endiselt HSPA memost (js/hspa.js väli `rta`) ja seda see fail ei muuda.
 *
 * Allikad (loetud 19.11.2026): Rahvastiku tervise arengukava 2020–2030 (näitajad 1–9) ja Sotsiaalministeeriumi heaolu ja
 * tervise tulemusvaldkonna programmid 2026–2029 (kinnitatud 15.01.2026, lisad 4–6). Programmid uuenevad igal aastal:
 * vaata see fail üle kord aastas (always_webcheck.md jaotis H) ja muuda PERIOD ning mõõdikud.
 * Võti on menüürea (peamise õe) kood.
 */
(function (TAI) {
  "use strict";

  var PERIOD = "2026–2029";
  var PROGRAMS = {
    V: { short: "Tervist toetavad valikud", full: "Tervist toetavate valikute programm " + PERIOD },
    K: { short: "Tervist toetav keskkond", full: "Tervist toetava keskkonna programm " + PERIOD },
    T: { short: "Inimkeskne tervishoid", full: "Inimkeskse tervishoiu programm " + PERIOD },
    Y: { short: "üldeesmärk", full: "Rahvastiku tervise arengukava 2020–2030 üldeesmärk" }
  };

  var TABLES = {
    "EUROSTAT-PRVT": { p: "V", m: "programmi mõõdik „Ennetusega välditav suremus 100 000 elaniku kohta“" },
    "EUROSTAT-SILC": { p: "T", m: "programmi mõõdik „Katmata tervishoiuteenuste vajadus“ (RTA näitaja 8)" },
    "EUROSTAT-TRT": { p: "T", m: "tegevus 3 „Tervishoiuteenuste kvaliteedi tagamine“, mõõdik „Raviga välditav suremus 100 000 elaniku kohta“" },
    "OECD-AMI": { p: "T", m: "tegevus 3 „Tervishoiuteenuste kvaliteedi tagamine“, mõõdik „Ägedasse müokardiinfarkti haigestunute 30 päeva järgne suremus“" },
    "OECD-STROKE": { p: "T", m: "tegevus 3 „Tervishoiuteenuste kvaliteedi tagamine“, mõõdik „Isheemilisse insulti haigestunute 30 päeva järgne suremus“" },
    "THT001": { p: "T", m: "tegevus 4 „Tervishoiu tööjõu tagamine“, mõõdikud „Arstide arv 100 000 elaniku kohta“ ja „Õdede arv 100 000 elaniku kohta“" },
    "OE0452": { p: "Y", m: "RTA näitajad 1 „Oodatav eluiga“, 4 „Tervise ebavõrdsus maakondades“ ja 5 „Tervise ebavõrdsus haridustasemete vahel“" },
    "TE753": { p: "Y", m: "RTA näitajad 2 „Tervena elada jäänud aastad“, 4 „Tervise ebavõrdsus maakondades“ ja 5 „Tervise ebavõrdsus haridustasemete vahel“" }
  };

  /** { short, hint } või null. hint = hiirevihje rida. */
  TAI.rtaOf = function (code) {
    var r = TABLES[code];
    if (!r) return null;
    var prog = PROGRAMS[r.p];
    return { short: prog.short, hint: "RTA: " + prog.full + " — " + r.m + "." };
  };
})(window.TAI);
