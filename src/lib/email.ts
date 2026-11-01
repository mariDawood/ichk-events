import "server-only";
import { getEvent } from "@/lib/events";
import { formatEuro } from "@/lib/money";
import { markEmailSent, type Order, type Ticket } from "@/lib/orders";
import { localePath, requestOrigin } from "@/lib/site";

const copy = {
  nl: {
    subject: (title: string) => `Uw kaartjes voor ${title}`,
    hello: "Uw kaartjes zijn klaar.",
    paid: "U heeft betaald:",
    numbers: "Uw kaartnummers",
    bingo: "met bingokaart",
    plain: "zonder bingokaart",
    age: (age: number) => `${age} jaar`,
    link: "Open uw pagina en vul daar het kaartnummer in. U ziet dan de streepjescode. Heeft u een bingokaart, dan ziet u die ook, samen met de nummers die worden omgeroepen.",
    open: "Naar mijn kaartje",
  },
  en: {
    subject: (title: string) => `Your tickets for ${title}`,
    hello: "Your tickets are ready.",
    paid: "You paid:",
    numbers: "Your ticket numbers",
    bingo: "with a bingo card",
    plain: "without a bingo card",
    age: (age: number) => `${age} years`,
    link: "Open your page and enter the ticket number. You will see the barcode. If you have a bingo card, you will see that too, together with the numbers that are called.",
    open: "Open my ticket",
  },
  ar: {
    subject: (title: string) => `تذاكركم لـ ${title}`,
    hello: "تذاكركم جاهزة.",
    paid: "المبلغ المدفوع:",
    numbers: "أرقام التذاكر",
    bingo: "مع بطاقة بنغو",
    plain: "بدون بطاقة بنغو",
    age: (age: number) => `${age} سنة`,
    link: "افتحوا صفحتكم واكتبوا رقم التذكرة. ستظهر الرمز الشريطي. إذا اشتريتم بطاقة بنغو فستظهر أيضًا، مع الأرقام التي تُنادى.",
    open: "إلى تذكرتي",
  },
} as const;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function buildOrderEmail(order: Order, tickets: Ticket[]) {
  const event = getEvent(order.eventId);
  const text = copy[order.locale];
  const title = event?.title[order.locale] ?? order.eventId;
  const origin = await requestOrigin();
  const link = `${origin}${localePath(order.locale, `/ticket/${order.accessToken}`)}`;
  const rows = tickets
    .map(
      (ticket) =>
        `<li style="margin:0 0 12px;font-size:22px;">${escapeHtml(ticket.number)} · ${escapeHtml(text.age(ticket.age))} · ${escapeHtml(ticket.bingoCard ? text.bingo : text.plain)}</li>`,
    )
    .join("");

  const html = `
    <div style="font-family:Georgia,serif;color:#1c1915;background:#f4efe6;padding:24px;">
      <div style="max-width:560px;margin:0 auto;background:#fbf7f0;border-radius:24px;padding:28px;">
        <p style="margin:0;color:#8c7340;font-size:18px;">H. Remigiuskerk</p>
        <h1 style="font-size:36px;line-height:1.15;margin:12px 0;">${escapeHtml(text.hello)}</h1>
        <p style="font-size:20px;line-height:1.5;">${escapeHtml(title)}</p>
        <p style="font-size:20px;">${escapeHtml(text.paid)} ${escapeHtml(formatEuro(order.totalCents, order.locale))}</p>
        <h2 style="font-size:24px;margin-bottom:8px;">${escapeHtml(text.numbers)}</h2>
        <ul style="padding-left:20px;">${rows}</ul>
        <p style="font-size:20px;line-height:1.5;">${escapeHtml(text.link)}</p>
        <p style="margin-top:24px;">
          <a href="${escapeHtml(link)}" style="display:inline-block;background:#1b2744;color:#fbf7f0;text-decoration:none;border-radius:999px;padding:14px 22px;font-size:20px;">${escapeHtml(text.open)}</a>
        </p>
      </div>
    </div>
  `;

  return { subject: text.subject(title), html, link };
}

export async function sendOrderEmail(order: Order, tickets: Ticket[], force = false) {
  if (order.emailSent && !force) return true;
  if (order.status !== "paid" || tickets.length === 0) return false;

  const { subject, html, link } = await buildOrderEmail(order, tickets);

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    if (process.env.NODE_ENV === "development") {
      console.info(`Ticket email not sent. Page: ${link}`);
    }
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [order.email],
      subject,
      html,
    }),
  });

  if (!response.ok) return false;
  await markEmailSent(order.id);
  return true;
}
