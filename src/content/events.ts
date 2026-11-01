import type { Locale } from "@/i18n/routing";

type Copy = Record<Locale, string>;

export type ChurchEvent = {
  id: string;
  start: string;
  end: string;
  kind: Copy;
  title: Copy;
  summary: Copy;
  date: Copy;
  time: Copy;
  place: Copy;
  goal: Copy;
  prices: Copy[];
  included: Copy;
  extra: Copy;
  ticket: Copy;
  bingo: Copy;
  activities: Copy[];
};

/**
 * Add the next activity here, in Dutch, English, and Arabic.
 * It stays on the page until `end`. After that, visitors see the quiet empty state.
 * Use the Dutch offset: +01:00 in winter, +02:00 in summer.
 */
export const events: ChurchEvent[] = [
  {
    id: "donatiedag-2026-12-06",
    start: "2026-12-06T12:00:00+01:00",
    end: "2026-12-06T16:00:00+01:00",
    kind: {
      nl: "Donatiedag",
      en: "Donation day",
      ar: "يوم التبرعات",
    },
    title: {
      nl: "Een nieuw licht brandt in Duiven",
      en: "A new light burns in Duiven",
      ar: "نور جديد يضيء في دويفن",
    },
    summary: {
      nl: "Een open dag voor iedereen, en voor gezinnen. We komen samen in de kerk, met eten, spel en een warm welkom.",
      en: "An open day for everyone, and for families. We come together in the church, with food, games, and a warm welcome.",
      ar: "يوم مفتوح للجميع وللعائلات. نجتمع في الكنيسة، مع الطعام والألعاب وترحيب حار.",
    },
    date: {
      nl: "zondag 6 december 2026",
      en: "Sunday 6 December 2026",
      ar: "الأحد ٦ كانون الأول ٢٠٢٦",
    },
    time: {
      nl: "van 12.00 tot 16.00 uur",
      en: "from 12:00 to 16:00",
      ar: "من الساعة ١٢:٠٠ حتى ١٦:٠٠",
    },
    place: {
      nl: "H. Remigiuskerk, Remigiusplein, Duiven",
      en: "H. Remigiuskerk, Remigiusplein, Duiven",
      ar: "كنيسة القديس ريميجيوس، Remigiusplein، دويفن",
    },
    goal: {
      nl: "Met deze dag willen we €70.000 bijeenbrengen voor de kerk.",
      en: "With this day we hope to raise €70,000 for the church.",
      ar: "نريد في هذا اليوم جمع ٧٠٬٠٠٠ يورو من أجل الكنيسة.",
    },
    prices: [
      {
        nl: "Kinderen t/m 12 jaar: €5",
        en: "Children up to and including 12 years: €5",
        ar: "الأطفال حتى عمر ١٢ سنة: ٥ يورو",
      },
      {
        nl: "Alle anderen: €10",
        en: "Everyone else: €10",
        ar: "الباقي: ١٠ يورو",
      },
    ],
    included: {
      nl: "Inbegrepen is één koffie of thee en iets kleins te eten.",
      en: "This includes one coffee or tea and something small to eat.",
      ar: "يشمل ذلك مشروبًا واحدًا، قهوة أو شاي، وشيئًا صغيرًا للأكل.",
    },
    extra: {
      nl: "Extra eten en drinken kunt u bij de kraampjes betalen.",
      en: "You can pay for more food and drinks at the stalls.",
      ar: "يمكن دفع ثمن المزيد من الطعام والشراب عند الأكشاك.",
    },
    ticket: {
      nl: "Op het kaartje staat een nummer. Met dat nummer kunt u iets kleins winnen.",
      en: "Your ticket has a number. With that number you can win a small prize.",
      ar: "على التذكرة رقم. بهذا الرقم يمكنكم ربح جائزة صغيرة.",
    },
    bingo: {
      nl: "Een bingokaart kost €7 bij de ingang. Er zijn vijf winnaars.",
      en: "A bingo card costs €7 at the door. There are five winners.",
      ar: "بطاقة البنغو ثمنها ٧ يورو عند الباب. هناك خمسة فائزين.",
    },
    activities: [
      {
        nl: "Kaarsen versieren",
        en: "Decorate a candle",
        ar: "تزيين الشموع",
      },
      {
        nl: "Eten, gemaakt door vrijwilligers",
        en: "Food made by volunteers",
        ar: "طعام يُعدّه المتطوعون",
      },
      {
        nl: "Een kermisspel, zoals blikjes gooien",
        en: "A fair game, such as a can toss",
        ar: "لعبة مهرجان، مثل رمي العلب",
      },
      {
        nl: "Schminken voor kinderen",
        en: "Face painting for children",
        ar: "الرسم على وجوه الأطفال",
      },
      {
        nl: "Tweedehands spullen",
        en: "Second-hand goods",
        ar: "أغراض مستعملة",
      },
      {
        nl: "Kennismaken met de parochie: catechese, het leven van de parochie, de eucharistie, jongeren, het verhaal van de kerk en het geloof, en het koor",
        en: "Meet the parish: catechesis, parish life, the Eucharist, youth, the story of the church and the faith, and the choir",
        ar: "التعرّف إلى الرعية: التعليم المسيحي، حياة الرعية، الإفخارستيا، الشباب، قصة الكنيسة والإيمان، والجوقة",
      },
      {
        nl: "Arcadespellen, Lego en een racesimulator",
        en: "Arcade games, Lego, and a racing simulator",
        ar: "ألعاب أركيد، وليغو، وجهاز سباق",
      },
      {
        nl: "Bordspellen",
        en: "Board games",
        ar: "ألعاب الطاولة",
      },
      {
        nl: "Een beautyhoek, voor haar en een klein advies",
        en: "A beauty corner, for hair and a little advice",
        ar: "ركن تجميل: للشعر ونصيحة بسيطة",
      },
      {
        nl: "Piano met Nederlandse melodieën",
        en: "Piano with Dutch melodies",
        ar: "بيانو بألحان هولندية",
      },
      {
        nl: "Een kerstfilm, met popcorn en warme chocolademelk",
        en: "A Christmas film, with popcorn and hot chocolate",
        ar: "فيلم بمناسبة الميلاد، مع الفشار وشوكولاتة ساخنة",
      },
      {
        nl: "Een korte presentatie in de kerk",
        en: "A short presentation in the church",
        ar: "كلمة قصيرة في الكنيسة",
      },
      {
        nl: "Bingo",
        en: "Bingo",
        ar: "بنغو",
      },
      {
        nl: "Een pot snoep: raad hoeveel erin zit",
        en: "A jar of sweets: guess how many are inside",
        ar: "جرّة حلوى: خمّنوا كم قطعة بداخلها",
      },
      {
        nl: "Collectebussen in de zaal",
        en: "Collection boxes in the hall",
        ar: "صناديق للتبرع في القاعة",
      },
    ],
  },
];
