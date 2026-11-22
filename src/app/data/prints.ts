export type Lang = 'bs' | 'en';

export interface ArtPrint {
  index: number;
  title: string;
  artist: string;
  year: number;
  location: string;
  descriptionBs: string;
  descriptionEn: string;
  imageUrl: string;
  width: number;
  height: number;
}

export const PRINTS: readonly ArtPrint[] = [
  {
    index: 0,
    title: 'ONL Sanski Most 1981/82',
    artist: 'FK Podgrmeč · Stadion',
    year: 1981,
    location: 'Sanski Most',
    descriptionBs:
      'Momčad okupljena pred drvenom tribinom gradskog stadiona FK Podgrmeč u Sanskom Mostu u sezoni Opštinske nogometne lige 1981/82.',
    descriptionEn:
      'Team gathered in front of the wooden grandstand at FK Podgrmeč stadium in Sanski Most during the 1981/82 Municipal Football League season.',
    imageUrl: '/assets/aistudio/ONL_Sanski_Most_1981_82_7d9692a6.jpg',
    width: 1166,
    height: 895,
  },
  {
    index: 1,
    title: 'FK Radnički Zdena',
    artist: 'Zdena, Sanski Most',
    year: 1979,
    location: 'Zdena',
    descriptionBs:
      'Zajednička fotografija ekipe NK Radnički Zdena u plavim dresovima, snimljena 4. maja 1979. godine na domaćem terenu.',
    descriptionEn:
      'Team portrait of NK Radnički Zdena in blue kits, photographed on May 4, 1979 on their home pitch.',
    imageUrl: '/assets/aistudio/FK_Radni_ki_Zdena_cce85fd8.jpg',
    width: 1406,
    height: 905,
  },
  {
    index: 2,
    title: 'FK Jedinstvo Tomina',
    artist: 'Tomina, Sanski Most',
    year: 1981,
    location: 'Tomina',
    descriptionBs:
      'Postava FK Jedinstvo Tomina na travnjaku u plavim dresovima i bijelim šorcevima, rival za sam vrh opštinske lige.',
    descriptionEn:
      'Lineup of FK Jedinstvo Tomina on the pitch in blue jerseys and white shorts, contenders for the top of the municipal league.',
    imageUrl: '/assets/aistudio/FK_Jedinstvo_Tomina_b67f48b2.jpg',
    width: 1491,
    height: 1055,
  },
  {
    index: 3,
    title: 'FK Rudar Kamengrad',
    artist: 'Kamengrad, Sanski Most',
    year: 1981,
    location: 'Kamengrad',
    descriptionBs:
      'Timska fotografija FK Rudar Kamengrad u maslinasto-crnim dresovima sa golmanima i tri lopte pred početak susreta.',
    descriptionEn:
      'Team photograph of FK Rudar Kamengrad in olive-and-black kits with goalkeepers before kickoff.',
    imageUrl: '/assets/aistudio/FK_Rudar_Kamengrad_183c8ed9.jpg',
    width: 2048,
    height: 1370,
  },
  {
    index: 4,
    title: 'FK Trnova',
    artist: 'Trnova, Sanski Most',
    year: 1981,
    location: 'Trnova',
    descriptionBs:
      'Igrači i stručni štab FK Trnova okupljeni ispod prečke gola u bordo-bijelim dresovima na seoskom igralištu.',
    descriptionEn:
      'Players and coaching staff of FK Trnova gathered beneath the crossbar in burgundy-and-white kits.',
    imageUrl: '/assets/aistudio/FK_Trnova_Trnova_7562f711.jpg',
    width: 948,
    height: 646,
  },
  {
    index: 5,
    title: 'FK Polet Šehovci',
    artist: 'Šehovci, Sanski Most',
    year: 1981,
    location: 'Šehovci',
    descriptionBs:
      'Ekipa FK Polet Šehovci u crveno-bijelim prugastim dresovima sa klupskim grbom ispred mreže domaćeg gola.',
    descriptionEn:
      'Squad of FK Polet Šehovci wearing red-and-white striped shirts with the club crest in front of the goal net.',
    imageUrl: '/assets/aistudio/FK_Polet__ehovci_3a4c8d3c.jpg',
    width: 1376,
    height: 783,
  },
  {
    index: 6,
    title: 'FK Zadrugar Oštra Luka',
    artist: 'Oštra Luka',
    year: 1981,
    location: 'Oštra Luka',
    descriptionBs:
      'Fudbaleri FK Zadrugar Oštra Luka u bijelo-plavoj opremi sa dvojicom trenera pred utakmicu u dolini Sane.',
    descriptionEn:
      'Players of FK Zadrugar Oštra Luka in white-and-blue strips alongside two coaches before a match.',
    imageUrl: '/assets/aistudio/FK_ZadrugarO_tra_Luka_0d515858.jpg',
    width: 1248,
    height: 862,
  },
  {
    index: 7,
    title: 'FK Borac Podlug',
    artist: 'Podlug, Sanski Most',
    year: 1981,
    location: 'Podlug',
    descriptionBs:
      'Jedanaest igrača FK Borac Podlug u plavo-bordo garnituri postrojenih za ekipni portret na travnatom terenu.',
    descriptionEn:
      'Starting eleven of FK Borac Podlug in blue-and-maroon kits lined up for a team portrait on the grass pitch.',
    imageUrl: '/assets/aistudio/FK_Borac_Podlug_919b336d.jpg',
    width: 1195,
    height: 896,
  },
  {
    index: 8,
    title: 'OFK Sloboda Mahala',
    artist: 'Mahala, Sanski Most',
    year: 1981,
    location: 'Mahala',
    descriptionBs:
      'Postava OFK Sloboda-Mahala iz Sanskog Mosta u plavim dresovima pored bijele stative i mreže gola.',
    descriptionEn:
      'Squad of OFK Sloboda-Mahala from Sanski Most in blue jerseys beside the white goalpost.',
    imageUrl: '/assets/aistudio/OFK_Sloboda-Mahala-Sanski_Mos_9401e7f8.jpg',
    width: 1258,
    height: 832,
  },
  {
    index: 9,
    title: 'FK Mladost Lipnik',
    artist: 'Lipnik, Sanski Most',
    year: 1981,
    location: 'Lipnik',
    descriptionBs:
      'Svečano postrojavanje obje ekipe i sudijske trojke na centru igrališta u Lipniku pred početak prvenstvenog duela.',
    descriptionEn:
      'Both squads and match officials lined up at the center circle in Lipnik prior to kickoff.',
    imageUrl: '/assets/aistudio/FK_Mladost_Lipnik_67ac6b19.jpg',
    width: 1267,
    height: 832,
  },
  {
    index: 10,
    title: 'FK Famos Pobriježje',
    artist: 'Pobriježje, Sanski Most',
    year: 1981,
    location: 'Pobriježje',
    descriptionBs:
      'Ekipa FK Famos Pobriježje u plavim dresovima sa prepoznatljivim bijelim natpisom Famos u zimskom kolu.',
    descriptionEn:
      'FK Famos Pobriježje squad wearing blue shirts emblazoned with the white Famos emblem during a winter fixture.',
    imageUrl: '/assets/aistudio/FK_Famos_Pobrije_je_012e85cf.jpg',
    width: 1394,
    height: 752,
  },
  {
    index: 11,
    title: 'FK Sana Krkojevci',
    artist: 'Krkojevci, Sanski Most',
    year: 1981,
    location: 'Krkojevci',
    descriptionBs:
      'Zajednička slika aktera susreta u Krkojevcima sa igračima FK Sana u plavim dresovima i protivnikom u žuto-crnom.',
    descriptionEn:
      'Joint matchday photograph in Krkojevci featuring FK Sana players in blue alongside opponents in amber-and-black.',
    imageUrl: '/assets/aistudio/FK_Sana_Krkojevci_-igra_i_u_plavim_6652eba5.jpg',
    width: 2048,
    height: 1116,
  },
  {
    index: 12,
    title: 'FK Bratstvo Stari Majdan',
    artist: 'Stari Majdan',
    year: 1981,
    location: 'Stari Majdan',
    descriptionBs:
      'Igrači i klupsko rukovodstvo FK Bratstvo Stari Majdan pod obroncima šume sa kožnom loptom u prvom planu.',
    descriptionEn:
      'Players and club officials of FK Bratstvo Stari Majdan beneath wooded hills with a classic leather match ball.',
    imageUrl: '/assets/aistudio/FK_Brastvo_Stari_Majdan_22bbebe1.jpg',
    width: 1280,
    height: 816,
  },
  {
    index: 13,
    title: 'FK Kiseljak Koprivna',
    artist: 'Koprivna',
    year: 1981,
    location: 'Koprivna',
    descriptionBs:
      'Brojni sastav prvotimaca i podmlatka FK Kiseljak Koprivna u svijetloplavim trenerkama pred klupskom kućicom.',
    descriptionEn:
      'Senior squad and youth players of FK Kiseljak Koprivna in sky-blue tracksuits before the clubhouse.',
    imageUrl: '/assets/aistudio/FK_Kiseljak_Koprivna_6655dba6.jpg',
    width: 1440,
    height: 876,
  },
  {
    index: 14,
    title: 'FK Grmeč Lušci Palanka',
    artist: 'Lušci Palanka',
    year: 1981,
    location: 'Lušci Palanka',
    descriptionBs:
      'Ekipa FK Grmeč Lušci Palanka u crveno-bijelim dresovima na zelenom terenu uoči prvenstvene utakmice.',
    descriptionEn:
      'Team portrait of FK Grmeč Lušci Palanka in red-and-white kits on the pitch ahead of a league match.',
    imageUrl: '/assets/aistudio/FK_Grme__Lu_ci_Palanka_51658b3c.jpg',
    width: 887,
    height: 589,
  },
  {
    index: 15,
    title: 'Svaki zaposleni član kluba',
    artist: 'Sport · Novinski isječak',
    year: 1979,
    location: 'Zdena / Sanski Most',
    descriptionBs:
      'Arhivski novinski članak o FK Radnički Zdena — miljeniku kolektiva ŠIPAD „Sana” i mjesne zajednice, uz osvrt na osnivanje kluba 1952. i uspjehe 1979. godine.',
    descriptionEn:
      'Archival newspaper feature on FK Radnički Zdena, documenting its 1952 founding and 1979 Municipal League campaign.',
    imageUrl: '/assets/aistudio/fudbal_novine_2dcb275e.jpg',
    width: 662,
    height: 1292,
  },
];

export interface AccordionItem {
  titleBs: string;
  titleEn: string;
  bodyBs: string;
  bodyEn: string;
}

export const ACCORDIONS: readonly AccordionItem[] = [
  {
    titleBs: 'Historijski kontekst',
    titleEn: 'Historical Context',
    bodyBs:
      'Opštinska nogometna liga Sanski Most okupljala je krajem sedamdesetih i početkom osamdesetih godina preko petnaest mjesnih i radničkih klubova iz grada i okolnih sela.',
    bodyEn:
      'During the late 1970s and early 1980s, the Sanski Most Municipal Football League brought together over fifteen town and village clubs across the Sana valley.',
  },
  {
    titleBs: 'Očuvanje arhiva',
    titleEn: 'Archive Preservation',
    bodyBs:
      'Fotografije potiču iz porodičnih albuma, klupskih vitrina i lokalne štampe, digitalizirane kako bi sačuvale uspomenu na generacije sanskih sportista.',
    bodyEn:
      'These photographs originate from family albums, clubrooms, and regional newspapers, digitized to preserve the memory of Sanski Most football.',
  },
  {
    titleBs: 'Navigacija kroz hodnik',
    titleEn: 'Gallery Navigation',
    bodyBs:
      'Koristite točkić miša, prevlačenje ili tipke sa strelicama za kretanje kroz kružni hodnik. Kliknite na fotografiju da joj priđete, a zatim ponovo za detalje.',
    bodyEn:
      'Use scroll, drag, or arrow keys to walk the curved corridor. Click any photograph to step closer, then click again to open its record.',
  },
];

