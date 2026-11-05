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
      nl: "Een open dag voor iedereen, ook voor gezinnen. We zamelen geld in voor de kerk, met als doel €60.000. U bent welkom, of u nu gelovig bent of gewoon nieuwsgierig.",
      en: "An open day for everyone, including families. We are raising money for the church, with a goal of €60,000. You are welcome whether you are a believer or simply curious.",
      ar: "يوم مفتوح للجميع، وللعائلات أيضًا. نجمع المال للكنيسة، والهدف ٦٠٬٠٠٠ يورو. أنتم مدعوون، مؤمنين كنتم أو مجرد فضوليين.",
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
          nl: "Iedereen",
          en: "Everyone",
          ar: "الجميع",
        },
      },
    ],
    included: {
      nl: "Inbegrepen: één koffie of thee en één koekje.",
      en: "Included: one coffee or tea and one cookie.",
      ar: "يشمل ذلك قهوة أو شايًا واحدًا وبسكويتة واحدة.",
    },
    extra: {
      nl: "Extra drinken en hapjes betaalt u bij de kraampjes.",
      en: "You pay for extra drinks and bites at the stalls.",
      ar: "تدفعون ثمن المشروبات واللقيمات الإضافية عند الأكشاك.",
    },
    ticket: {
      nl: "Op het kaartje staat een nummer. Daarmee maakt u kans op een van de vijf prijzen.",
      en: "Your ticket has a number. With it you can win one of five prizes.",
      ar: "على التذكرة رقم. به يمكنكم الفوز بإحدى الجوائز الخمس.",
    },
    bingo: {
      nl: "Bingokaart: €1 bij het aanmelden of aan de deur. Vijf winnaars, te beginnen met een kerstcadeau van ongeveer €30.",
      en: "Bingo card: €1 when you sign up, or at the door. Five winners, starting with a Christmas gift of about €30.",
      ar: "بطاقة بنغو: ١ يورو عند التسجيل أو عند الباب. خمسة فائزين، وتبدأ بهدية ميلاد بنحو ٣٠ يورو.",
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
          nl: "Solo-optredens met Nederlandse melodieën, en Amo Ghandi op de piano. Er speelt steeds iemand anders.",
          en: "Solo performances with Dutch melodies, and Amo Ghandi on the piano. Each time someone else plays.",
          ar: "عزف منفرد بألحان هولندية، وآمو غاندي على البيانو. في كل مرة يعزف شخص آخر.",
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
          nl: "Korte presentaties over catechese, de activiteiten, de eucharistie, jongeren, de geschiedenis van kerk en geloof, en het koor. Er is een kraam met kerk- en kerstspullen, en een quiz bij het kerstverhaal: de winnaar krijgt een snoepje. Voor €0,50 hangt u een wens aan de lichtslinger. Tussen de kramen staan stoelen om samen te praten. U kunt ook iets geven voor de kerk. Er worden foto's gemaakt.",
          en: "Short presentations on catechesis, the activities, the Eucharist, youth, the history of the church and the faith, and the choir. There is a stall with church and Christmas goods, and a quiz during the Christmas story: the winner gets a sweet. For €0.50 you hang a wish on the garland of lights. Between the stalls there are chairs where you can sit and talk. You can also give something for the church. Photos will be taken.",
          ar: "عروض قصيرة عن التعليم المسيحي، والأنشطة، والإفخارستيا، والشباب، وتاريخ الكنيسة والإيمان، والجوقة. هناك كشك لأغراض الكنيسة والميلاد، ومسابقة أثناء قصة الميلاد: الفائز يحصل على حلوى. مقابل ٠٫٥٠ يورو تعلّقون أمنية على إكليل الأنوار. بين الأكشاك مقاعد للحديث معًا. يمكنكم أيضًا أن تعطوا للكنيسة. ستُلتقط صور.",
        },
      },
    ],
  },
];
