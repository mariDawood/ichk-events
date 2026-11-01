import type { Locale } from "@/i18n/routing";

type Copy = Record<Locale, string>;

export type Price = {
  amount: string;
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
    start: "2026-12-06T12:00:00+01:00",
    end: "2026-12-06T16:00:00+01:00",
    title: {
      nl: "Een nieuw licht brandt in Duiven",
      en: "A new light burns in Duiven",
      ar: "نور جديد يضيء في دويفن",
    },
    summary: {
      nl: "Een open dag voor iedereen die een beetje licht kan gebruiken! We komen samen in de kerk, met eten, gezelligheid en een warm welkom.",
      en: "An open day for everyone who can use a little light! We come together in the church, with food, fun games, and a warm welcome.",
      ar: "يوم مفتوح للجميع الذين يمكنهم استخدام الضوء القليل! نجتمع في الكنيسة، مع الطعام والتواصل وترحيب حار.",
    },
    date: {
      nl: "zondag 6 december 2026",
      en: "Sunday 6 December 2026",
      ar: "الأحد ٦ كانون الأول ٢٠٢٦",
    },
    time: {
      nl: "12.00 tot 16.00 uur",
      en: "12:00 to 16:00",
      ar: "١٢:٠٠ حتى ١٦:٠٠",
    },
    place: {
      nl: "H. Remigiuskerk\nRemigiusplein, Duiven",
      en: "H. Remigiuskerk\nRemigiusplein, Duiven",
      ar: "كنيسة القديس ريميجيوس\nRemigiusplein، دويفن",
    },
    prices: [
      {
        amount: "€5",
        who: {
          nl: "Kinderen t/m 12 jaar",
          en: "Children up to and including 12 years",
          ar: "الأطفال حتى عمر ١٢ سنة",
        },
      },
      {
        amount: "€10",
        who: {
          nl: "Alle anderen",
          en: "Everyone else",
          ar: "الباقي",
        },
      },
    ],
    included: {
      nl: "Inbegrepen: één koffie of thee en iets kleins te eten.",
      en: "Included: one coffee or tea and something small to eat.",
      ar: "يشمل ذلك مشروبًا واحدًا، قهوة أو شاي، وشيئًا صغيرًا للأكل.",
    },
    extra: {
      nl: "Extra eten en drinken betaalt u bij de kraampjes.",
      en: "You can pay for more food and drinks at the stalls.",
      ar: "يمكن دفع ثمن المزيد من الطعام والشراب عند الأكشاك.",
    },
    ticket: {
      nl: "Op het kaartje staat een nummer. Daarmee kunt u iets winnen.",
      en: "Your ticket has a number. With it you can win a prize.",
      ar: "على التذكرة رقم. به يمكنكم ربح جائزة.",
    },
    bingo: {
      nl: "Bingo: €7 bij de ingang. Vijf winnaars.",
      en: "Bingo: €7 at the door. Five winners.",
      ar: "بنغو: ٧ يورو عند الباب. خمسة فائزين.",
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
          nl: "Versier zelf een kaars, met lint en bloemen.",
          en: "Decorate a candle yourself, with ribbon and flowers.",
          ar: "زيّنوا شمعة بأيديكم، بشريط وزهور.",
        },
      },
      {
        image: "table",
        title: {
          nl: "Samen eten",
          en: "Eat together",
          ar: "الأكل معًا",
        },
        text: {
          nl: "Eten gemaakt door vrijwilligers, met koffie en thee.",
          en: "Food made by volunteers, with coffee and tea.",
          ar: "طعام يُعدّه المتطوعون، مع القهوة والشاي.",
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
          nl: "Een kermisspel, bordspellen, arcade, Lego en een racesimulator. Kinderen kunnen zich laten schminken, en er is een beautyhoek.",
          en: "A fair game, board games, arcade, Lego, and a racing simulator. Children can have their faces painted, and there is a beauty corner.",
          ar: "لعبة مهرجان، وألعاب طاولة، وأركيد، وليغو، وجهاز سباق. يمكن رسم وجوه الأطفال، وهناك ركن تجميل.",
        },
      },
      {
        image: "music",
        title: {
          nl: "Piano en film",
          en: "Piano and a film",
          ar: "بيانو وفيلم",
        },
        text: {
          nl: "Piano met mooie melodieën, en een kerstfilm met popcorn en warme chocolademelk.",
          en: "Piano with nice melodies, and a Christmas film with popcorn and hot chocolate.",
          ar: "بيانو بألحان جميلة، وفيلم بمناسبة الميلاد مع الفشار وشوكولاتة ساخنة.",
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
          nl: "Maak kennis met de parochie: catechese, de eucharistie, jongeren, het koor en het verhaal van de kerk en het geloof. Er zullen korte presentaties gegeven worden, de mogelijkheid om onze kringloophoek te bezoeken en samen met elkaar in gesprek te gaan.",
          en: "Meet the parish: catechesis, the Eucharist, youth, the choir, and the story of the church and the faith. There will be short presentations, the possibility to visit our second-hand goods corner, and to converse together.",
          ar: "تعرّفوا إلى الرعية: التعليم المسيحي، الإفخارستيا، الشباب، الجوقة، وقصة الكنيسة والإيمان. هناك محاضرات قصيرة، والميلاد بأغراض مستعملة، والتحدث مع بعضنا البعض.",
        },
      },
    ],
  },
];
