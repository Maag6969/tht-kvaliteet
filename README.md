# Tervishoiuteenuste kvaliteedi näidikulaud

Avalik veebileht, mis koondab Eesti tervishoiuteenuste kvaliteedi ja tervisesüsteemi tulemuslikkuse näitajad ühte
kohta. Vasakus menüüs on näitajate loend, paremal avaneb valitud näitaja aruanne: KPI, kirjeldav kokkuvõtte lause,
trendijoonis, võrdlustulp, andmetabel ja allikaviited. Andmed tulevad iga avamisel **otse avalikust API-st** (TAI,
Eurostat, OECD); repos andmeid ei hoita.

**Lehe aadress:** https://maag6969.github.io/tht-kvaliteet/

**Testversioon:** leht on arendamisel. HSPA-vaate indikaatorite kaardistus on käsitsi koostatud ja kontrollimata.

## Menüü kolm vaadet

- **Üldvaade:** kõik näitajad allika järgi (rahvusvaheline ja Eesti statistika).
- **Strateegiavaade:** strateegiliste eesmärkide põhimõõdikud.
- **HSPA-vaade:** tervishoiusüsteemi tulemuslikkuse hindamise raamistiku (HSPA) indikaatorid; näidikulaual olevad avanevad.

## Käivitamine

Ehitusetappi pole: tavaline HTML + JavaScript, toimib ka `file://` kaudu avatuna. Kohalik server (nt `python -m http.server`
või mõni muu staatiline server) ja aadress `http://localhost:8000/`. Aadressiriba hoiab valitud näitajat ja filtreid
(nt `#RA02?näitaja=0`), nii et vaate saab linkida.

## Ülesehitus

| Fail | Roll |
|---|---|
| `index.html` | Lehe raam; `<script>` read määravad tabelite järjekorra |
| `js/core.js` | Mootor: päringute koostamine (PxWeb, Eurostat, OECD), JSON-stat ja SDMX-JSON lugejad |
| `js/module.js` | Andmemudel ja joonistamine: KPI-d, kokkuvõtte lause, graafikud, andmetabel |
| `js/app.js` | Kasutajaliides: menüü, filtrid, aadressiriba, AI-nupud |
| `js/hspa.js` | HSPA raamistiku kaardistus ja seos näidikulaua tabelitega |
| `js/ai-prompt.js` | AI-analüüsi juhise koostamine ekraanil olevast aruandest |
| `js/usage.js` | Vaatamiste loendur (Abacus) |
| `js/tables/*.js` | Üks fail = üks andmestik (konfiguratsioon) |
| `css/styles.css`, `fonts/` | Stiil ja ise hostitud Roboto font |

## Litsentsid ja andmete kasutustingimused

**Lehe kood** (HTML, CSS, JavaScript) on avaldatud [MIT litsentsiga](LICENSE). See litsents **ei kehti andmetele
ega fontidele**: neile kehtivad allikate endi tingimused allpool.

| Osa | Omanik | Tingimused (seisuga 19.11.2026) |
|---|---|---|
| TAI tabelid (PT, THT, TTO, TE, OE, RA, TKU) | Tervise Arengu Instituut | Andmebaasi kasutamine on tasuta ja TAI palub andmete kasutamisel viidata allikale: kõigepealt algallikas, siis avaldamiskanal (TAI tervisestatistika andmebaas) ja kasutamise kuupäev ([andmebaasi info](https://statistika.tai.ee/Resources/Info/TSTUA.html)). Eraldi nimelist litsentsi TAI ei ole välja toonud. Lehel on igal vaatel allikaviide ja andmete laadimise kuupäev. |
| Eurostati andmed (`hlth_cd_apr`, `hlth_silc_08`–`10`) | Euroopa Liit, Eurostat | Taaskasutus on lubatud allikale viidates ([Eurostati autoriõiguse teade](https://ec.europa.eu/eurostat/en/help/copyright-notice), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)). Lehel on andmeid töödeldud (valitud riigid ja rühmad, eestikeelsed nimetused, joonised, kokkuvõttelaused); Eurostat ei vastuta selle lehe ega andmete töötlemise eest. Märge on iga Eurostati aruande metaandmetes. |
| OECD andmed | OECD | Andmeid võib kasutada mis tahes otstarbel, ka äriliselt, kui viidatakse OECD-le (allikas, andmestik, kasutamise kuupäev). Mõni andmestik võib olla kolmandate osapoolte omanduses ([OECD kasutustingimused](https://www.oecd.org/en/about/terms-conditions.html), jaotis „Data“; kontrollitud 19.11.2026). OECD API-sid võib kasutada „as is“ ja OECD võib IP-aadressi päringuid piirata. Lehel on andmeid töödeldud; OECD ei vastuta selle lehe ega andmete töötlemise eest. |
| Font Roboto (`fonts/`) | The Roboto Project Authors | [SIL Open Font License 1.1](fonts/OFL.txt) |

Näidikulaud ei ole ühegi andmeallika ametlik väljaanne. Ametlikud arvud ja metoodika on allikate endi lehtedel.

## Privaatsus ja turvalisus

- **Lehel ei ole isiklikke võtmeid, tokeneid ega kontosid.** Kõik andmepäringud teeb külastaja brauser otse
  avalikku, autentimist mittevajavasse teenusesse.
- **Vaatamiste loendur:** leht loendab ligikaudselt vaatamisi ja nupuvajutusi avaliku teenusega
  [Abacus](https://abacus.jasoncameron.dev) (`js/usage.js`). Teenus näeb külastaja IP-aadressi ja loenduri nime;
  lehe omanik IP-aadresse ei näe. Küpsiseid ei kasutata. Sama teade on lehe jaluses.
- **Brauseri salvestus:** viimase andmeaasta kontrolli tulemus (tabeli kood, aasta, aeg) jääb 12 tunniks brauseri
  `localStorage`'isse ja märge „juba loendatud“ `sessionStorage`'isse. Isikuandmeid ei salvestata.
- **AI-nupud** lehe päises (Claude, ChatGPT, Gemini; üks komplekt kogu lehele, nad analüüsivad parajasti avatud aruannet) kopeerivad vaate andmed (valitud filtreid arvestades) koos
  ettevalmistatud analüüsi prompt'iga külastaja lõikelauale ja avavad valitud AI-teenuse külastaja enda brauseris,
  lahti seotuna näidikulaua aknast (`window.opener = null`). Seal kehtivad selle teenuse tingimused külastaja konto
  võimaluste järgi ning analüüsi kvaliteet sõltub valitud AI-mudelist (tasuta teenus võib anda väga halva tulemuse).
  AI poolt genereeritud kirjeldav analüüs on seega eraldiseisev tegevus, mille tulemuse kvaliteet ega õigsus ei ole seotud
  siinsete näidikulaudadega ega siin kasutatud andmeallikatega. AI-ga loodud sisu eest vastutab selle sisu genereerinud ja
  seda sisu kasutav isik. Sama teade on lehe jaluses.
- **Sisupoliitika (CSP)** `index.html`-is: skriptid, stiilid ja fondid ainult lehelt endalt; päringud ainult
  andmeallikatele (TAI, Eurostat, OECD) ja loendurile. Väliseid skripte ega Google Fonts'i ei kasutata.
