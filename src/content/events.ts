import type { Locale } from "@/i18n/routing";

type Copy = Record<Locale, string>;

export type Price = {
  amount: Copy;
  who: Copy;
};

export type Activity = {
  image: "candles" | "table" | "play" | "music" | "welcome";
  title: Copy;
  text: Copy;
};

export type ChurchEvent = {
  id: string;
  start: string;
  end: string;
  title: Copy;
  summary: Copy;
  date: Copy;
  time: Copy;
  place: Copy;
  prices: Price[];
  included: Copy;
  extra: Copy;
  ticket: Copy;
  bingo: Copy;
  activities: Activity[];
};

/**
 * Add the next activity here, in Dutch, English, and Arabic.
 * It stays on the page until `end`. After that, visitors see the quiet empty state.
 * Use the Dutch offset: +01:00 in winter, +02:00 in summer.
 */
export const events: ChurchEvent[] = [
  {
    id: "nieuw-licht-2026-12-06",
    start: "2026-12-06T13:00:00+01:00",
    end: "2026-12-06T16:00:00+01:00",
    title: {
      nl: "Het vredeslicht in Duiven",
      en: "The peace light in Duiven",
      ar: "نور السلام في دويفن",
    },
    summary: {
      nl: "Een open dag voor iedereen. Er is van alles te doen voor jong en oud, en u kunt elkaar ontmoeten en spreken.",
      en: "An open day for everyone. There is something to do for young and old, and a chance to meet and talk with one another.",
      ar: "يوم مفتوح للجميع. هناك ما يُفعل للصغار والكبار، وفرصة للقاء بعضكم والتحدث.",
    },
    date: {
      nl: "zondag 6 december 2026",
      en: "Sunday 6 December 2026",
      ar: "الأحد ٦ كانون الأول ٢٠٢٦",
    },
    time: {
      nl: "13.00 tot 16.00 uur",
      en: "13:00 to 16:00",
      ar: "١٣:٠٠ حتى ١٦:٠٠",
    },
    place: {
      nl: "H. Remigiuskerk\nRemigiusplein, Duiven",
      en: "H. Remigiuskerk\nRemigiusplein, Duiven",
      ar: "كنيسة القديس ريميجيوس\nRemigiusplein، دويفن",
    },
    prices: [
      {
        amount: {
          nl: "€2,50",
          en: "€2.50",
          ar: "€2,50",
        },
        who: {
          nl: "p.p.",
          en: "p.p.",
          ar: "p.p.",
        },
      },
    ],
    included: {
      nl: "Gratis inbegrepen: een lekker warm kopje koffie of thee, of een drankje voor de kinderen, en een hapje.",
      en: "Free and included: a nice warm cup of coffee or tea, or a delicious drink for the children, and a bite to eat.",
      ar: "مجاني ومشمول: فنجان دافئ من القهوة أو الشاي، أو مشروب لذيذ للأطفال، ولقيمة.",
    },
    extra: {
      nl: "Proef nieuwe gerechten en ontdek zelfgemaakte hapjes.",
      en: "Taste new dishes and discover homemade bites.",
      ar: "تذوقوا أطباقًا جديدة واكتشفوا لقيمات منزلية الصنع.",
    },
    ticket: {
      nl: "",
      en: "",
      ar: "",
    },
    bingo: {
      nl: "Doe mee met de bingo. Een bingokaart kost €1, en u maakt kans op een kerstcadeau.",
      en: "Join the bingo. A card costs €1, and you can win a Christmas gift.",
      ar: "شاركوا في البنغو. بطاقة البنغو بيورو واحد، ويمكنكم الفوز بهدية بمناسبة الميلاد.",
    },
    activities: [
      {
        image: "candles",
        title: {
          nl: "Kaarsen versieren",
          en: "Decorate a candle",
          ar: "تزيين الشموع",
        },
        text: {
          nl: "Versier zelf een kaars.",
          en: "Decorate a candle yourself.",
          ar: "زيّنوا شمعة بأيديكم.",
        },
      },
      {
        image: "table",
        title: {
          nl: "Eten en drinken",
          en: "Food and drinks",
          ar: "الطعام والشراب",
        },
        text: {
          nl: "Eten gemaakt door vrijwilligers, en een chocoladefontein. In de andere zalen zijn popcorn en warme chocolademelk met slagroom.",
          en: "Food made by volunteers, and a chocolate fountain. In the other rooms there is popcorn and hot chocolate with whipped cream.",
          ar: "طعام يعدّه المتطوعون، ونافورة شوكولاتة. في القاعات الأخرى فشار وشوكولاتة ساخنة مع كريمة.",
        },
      },
      {
        image: "play",
        title: {
          nl: "Spelen",
          en: "Play",
          ar: "اللعب",
        },
        text: {
          nl: "Kermisspellen, bordspellen, puzzels en tweedehands speelgoed. Er is een Legotafel, buiten tafeltennis, en een racesimulator met PlayStation en Atari op een groot scherm. In de beautyhoek kunt u haar, nagels en make-up laten doen.",
          en: "Fair games, board games, puzzles, and second-hand toys. There is a Lego table, table tennis outside, and a racing simulator with PlayStation and Atari on a large screen. In the beauty corner you can have your hair, nails, and makeup done.",
          ar: "ألعاب مهرجان، وألعاب طاولة، وألغاز، وألعاب مستعملة. هناك طاولة ليغو، وتنس طاولة في الخارج، وجهاز سباق مع بلايستيشن وأتاري على شاشة كبيرة. في ركن التجميل يمكن تصفيف الشعر وطلاء الأظافر والمكياج.",
        },
      },
      {
        image: "music",
        title: {
          nl: "Piano",
          en: "Piano",
          ar: "بيانو",
        },
        text: {
          nl: "Solo-optredens met mooie melodieën worden opgevoerd, voor iedereen om mee te genieten.",
          en: "Solo performances with beautiful melodies, for everyone to enjoy.",
          ar: "عزف منفرد بألحان جميلة، ليستمتع به الجميع.",
        },
      },
      {
        image: "welcome",
        title: {
          nl: "Kom binnen",
          en: "Come inside",
          ar: "ادخلوا",
        },
        text: {
          nl: "Er worden korte presentaties gegeven over alle activiteiten die worden georganiseerd, en waar iedereen van harte welkom is. Er is een leuke interactieve kerstquiz. We hebben een wensslinger met lichtjes.",
          en: "There are short presentations about all the activities that are organised, and everyone is warmly welcome. There is a fun interactive Christmas quiz. We have a garland of lights for wishes.",
          ar: "تُقدَّم عروض قصيرة عن كل الأنشطة التي تُنظَّم، والجميع مرحَّب بهم من القلب. هناك مسابقة ميلاد تفاعلية ممتعة. ولدينا إكليل أنوار للأمنيات.",
        },
      },
    ],
  },
];
