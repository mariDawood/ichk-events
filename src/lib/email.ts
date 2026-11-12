import "server-only";
import { getEvent } from "@/lib/events";
import { formatEuro } from "@/lib/money";
import { markEmailSent, type Order, type Ticket } from "@/lib/orders";
import { localePath, requestOrigin } from "@/lib/site";

const copy = {
  nl: {
    subject: (title: string) => `Uw codes voor ${title}`,
    hello: "U bent aangemeld.",
    paid: "Bingokaarten:",
    free: "De toegang is gratis.",
    numbers: "Uw codes",
    bingo: "met bingokaart",
    plain: "zonder bingokaart",
    age: (age: number) => `${age} jaar`,
    cancel:
      "Kunt u niet komen, meld u dan af op de website of antwoord op deze mail. Daar is geen termijn voor.",
    refund:
      "De euro voor een bingokaart storten we niet vanzelf terug. Antwoord op deze mail als u die terug wilt.",
    link: "Open uw pagina en vul daar de code in. U ziet dan de streepjescode. Heeft u een bingokaart, dan ziet u die ook, samen met de nummers die worden omgeroepen.",
    open: "Naar mijn code",
    profile: "Mijn aanmeldingen",
    reminderSubject: (title: string) => `Morgen: ${title}`,
    reminderHello: "Morgen is de activiteit waar u voor bent aangemeld.",
    cancelSubject: (title: string) => `Afgemeld voor ${title}`,
    cancelHello: "We hebben de afmelding ontvangen.",
    cancelWho: "Afgemeld",
  },
  en: {
    subject: (title: string) => `Your codes for ${title}`,
    hello: "You are signed up.",
    paid: "Bingo cards:",
    free: "Entrance is free.",
    numbers: "Your codes",
    bingo: "with a bingo card",
    plain: "without a bingo card",
    age: (age: number) => `${age} years`,
    cancel:
      "If you cannot come, cancel on the website or reply to this email. There is no deadline.",
    refund: "The euro for a bingo card is not returned automatically. Reply to this email if you want it back.",
    link: "Open your page and enter the code. You will see the barcode. If you have a bingo card, you will see that too, together with the numbers that are called.",
    open: "Open my code",
    profile: "My signups",
    reminderSubject: (title: string) => `Tomorrow: ${title}`,
    reminderHello: "Tomorrow is the activity you signed up for.",
    cancelSubject: (title: string) => `Cancelled for ${title}`,
    cancelHello: "We have received the cancellation.",
    cancelWho: "Cancelled",
  },
  ar: {
    subject: (title: string) => `رموزكم لـ ${title}`,
    hello: "تم تسجيلكم.",
    paid: "بطاقات البنغو:",
    free: "الدخول مجاني.",
    numbers: "رموزكم",
    bingo: "مع بطاقة بنغو",
    plain: "بدون بطاقة بنغو",
    age: (age: number) => `${age} سنة`,
    cancel: "إذا لم تستطيعوا الحضور، ألغوا التسجيل في الموقع أو ردّوا على هذه الرسالة. لا يوجد موعد نهائي.",
    refund: "لا نعيد يورو بطاقة البنغو تلقائيًا. ردّوا على هذه الرسالة إذا أردتم استرداده.",
    link: "افتحوا صفحتكم واكتبوا الرمز. سيظهر الرمز الشريطي. إذا كانت لديكم بطاقة بنغو فستظهر أيضًا، مع الأرقام التي تُنادى.",
    open: "إلى رمزي",
    profile: "تسجيلاتي",
    reminderSubject: (title: string) => `غدًا: ${title}`,
    reminderHello: "غدًا النشاط الذي سجّلتم له.",
    cancelSubject: (title: string) => `تم إلغاء التسجيل لـ ${title}`,
    cancelHello: "استلمنا إلغاء التسجيل.",
    cancelWho: "أُلغي",
  },
} as const;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function shell(body: string) {
  return `
    <div style="font-family:Georgia,serif;color:#1c1915;background:#f4efe6;padding:24px;">
      <div style="max-width:560px;margin:0 auto;background:#fbf7f0;border-radius:24px;padding:28px;">
        <p style="margin:0;color:#8c7340;font-size:18px;">H. Remigiuskerk</p>
        ${body}
      </div>
    </div>
  `;
}

function button(href: string, label: string) {
  return `<p style="margin-top:24px;"><a href="${escapeHtml(href)}" style="display:inline-block;background:#1b2744;color:#fbf7f0;text-decoration:none;border-radius:999px;padding:14px 22px;font-size:20px;">${escapeHtml(label)}</a></p>`;
}

function ticketRows(tickets: Ticket[], locale: Order["locale"]) {
  const text = copy[locale];
  return tickets
    .map((ticket) => {
      const name = ticket.name ? `${escapeHtml(ticket.name)} · ` : "";
      return `<li style="margin:0 0 12px;font-size:22px;">${name}${escapeHtml(ticket.number)} · ${escapeHtml(text.age(ticket.age))} · ${escapeHtml(ticket.bingoCard ? text.bingo : text.plain)}</li>`;
    })
    .join("");
}

function replyAddress(from: string) {
  const wrapped = from.match(/<([^>]+)>/);
  if (wrapped?.[1]?.includes("@")) return wrapped[1];
  if (from.includes("@")) return from.trim();
  return undefined;
}

async function postEmail(input: { to: string; subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    if (process.env.NODE_ENV === "development") {
      console.info(`Email not sent to ${input.to}. Subject: ${input.subject}`);
    }
    return false;
  }

  const reply = replyAddress(from);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      ...(reply ? { reply_to: reply } : {}),
    }),
  });

  return response.ok;
}

export function mailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function buildOrderEmail(order: Order, tickets: Ticket[]) {
  const event = getEvent(order.eventId);
  const text = copy[order.locale];
  const title = event?.title[order.locale] ?? order.eventId;
  const origin = await requestOrigin();
  const link = `${origin}${localePath(order.locale, `/ticket/${order.accessToken}`)}`;
  const profile = `${origin}${localePath(order.locale, "/account")}`;
  const cost =
    order.totalCents > 0
      ? `<p style="font-size:20px;">${escapeHtml(text.paid)} ${escapeHtml(formatEuro(order.totalCents, order.locale))}</p>`
      : `<p style="font-size:20px;">${escapeHtml(text.free)}</p>`;
  const refund = tickets.some((ticket) => ticket.bingoCard)
    ? `<p style="font-size:20px;line-height:1.5;">${escapeHtml(text.refund)}</p>`
    : "";

  const html = shell(`
    <h1 style="font-size:36px;line-height:1.15;margin:12px 0;">${escapeHtml(text.hello)}</h1>
    <p style="font-size:20px;line-height:1.5;">${escapeHtml(title)}</p>
    ${cost}
    <h2 style="font-size:24px;margin-bottom:8px;">${escapeHtml(text.numbers)}</h2>
    <ul style="padding-left:20px;">${ticketRows(tickets, order.locale)}</ul>
    <p style="font-size:20px;line-height:1.5;">${escapeHtml(text.link)}</p>
    <p style="font-size:20px;line-height:1.5;">${escapeHtml(text.cancel)}</p>
    ${refund}
    ${button(link, text.open)}
    ${button(profile, text.profile)}
  `);

  return { subject: text.subject(title), html, link };
}

export async function sendOrderEmail(order: Order, tickets: Ticket[], force = false) {
  const active = tickets.filter((ticket) => !ticket.cancelledAt);
  if (!order.email) return false;
  if (order.emailSent && !force) return true;
  if (order.status !== "paid" || active.length === 0) return false;

  const { subject, html, link } = await buildOrderEmail(order, active);
  if (!mailConfigured()) {
    if (process.env.NODE_ENV === "development") {
      console.info(`Ticket email not sent. Page: ${link}`);
    }
    return false;
  }

  const sent = await postEmail({ to: order.email, subject, html });
  if (!sent) return false;
  await markEmailSent(order.id);
  return true;
}

export async function sendCancellationEmail(order: Order, tickets: Ticket[]) {
  if (!order.email || tickets.length === 0) return false;
  const event = getEvent(order.eventId);
  const text = copy[order.locale];
  const title = event?.title[order.locale] ?? order.eventId;
  const origin = await requestOrigin();
  const profile = `${origin}${localePath(order.locale, "/account")}`;
  const refund = tickets.some((ticket) => ticket.bingoCard)
    ? `<p style="font-size:20px;line-height:1.5;">${escapeHtml(text.refund)}</p>`
    : "";
  const html = shell(`
    <h1 style="font-size:36px;line-height:1.15;margin:12px 0;">${escapeHtml(text.cancelHello)}</h1>
    <p style="font-size:20px;line-height:1.5;">${escapeHtml(title)}</p>
    <h2 style="font-size:24px;margin-bottom:8px;">${escapeHtml(text.cancelWho)}</h2>
    <ul style="padding-left:20px;">${ticketRows(tickets, order.locale)}</ul>
    <p style="font-size:20px;line-height:1.5;">${escapeHtml(text.cancel)}</p>
    ${refund}
    ${button(profile, text.profile)}
  `);
  return postEmail({ to: order.email, subject: text.cancelSubject(title), html });
}

export async function sendReminderEmail(order: Order, tickets: Ticket[]) {
  if (!order.email || tickets.length === 0) return false;
  const event = getEvent(order.eventId);
  const text = copy[order.locale];
  const title = event?.title[order.locale] ?? order.eventId;
  const origin = await requestOrigin();
  const profile = `${origin}${localePath(order.locale, "/account")}`;
  const link = `${origin}${localePath(order.locale, `/ticket/${order.accessToken}`)}`;
  const html = shell(`
    <h1 style="font-size:36px;line-height:1.15;margin:12px 0;">${escapeHtml(text.reminderHello)}</h1>
    <p style="font-size:20px;line-height:1.5;">${escapeHtml(title)}</p>
    <h2 style="font-size:24px;margin-bottom:8px;">${escapeHtml(text.numbers)}</h2>
    <ul style="padding-left:20px;">${ticketRows(tickets, order.locale)}</ul>
    <p style="font-size:20px;line-height:1.5;">${escapeHtml(text.cancel)}</p>
    ${button(link, text.open)}
    ${button(profile, text.profile)}
  `);
  return postEmail({ to: order.email, subject: text.reminderSubject(title), html });
}

export async function sendPasswordResetEmail(input: {
  email: string;
  locale: Order["locale"];
  link: string;
}) {
  const text = {
    nl: {
      subject: "Nieuw wachtwoord",
      hello: "Kies een nieuw wachtwoord.",
      body: "Deze link werkt een uur. Heeft u hier niet om gevraagd, dan kunt u deze mail laten liggen.",
      open: "Nieuw wachtwoord",
    },
    en: {
      subject: "New password",
      hello: "Choose a new password.",
      body: "This link works for one hour. If you did not ask for it, you can ignore this email.",
      open: "New password",
    },
    ar: {
      subject: "كلمة مرور جديدة",
      hello: "اختاروا كلمة مرور جديدة.",
      body: "يعمل هذا الرابط لمدة ساعة. إذا لم تطلبوه، يمكنكم تجاهل الرسالة.",
      open: "كلمة مرور جديدة",
    },
  }[input.locale];

  const html = shell(`
    <h1 style="font-size:36px;line-height:1.15;margin:12px 0;">${escapeHtml(text.hello)}</h1>
    <p style="font-size:20px;line-height:1.5;">${escapeHtml(text.body)}</p>
    ${button(input.link, text.open)}
  `);
  if (process.env.NODE_ENV === "development" && !mailConfigured()) {
    console.info(`Password reset not sent. Link: ${input.link}`);
  }
  return postEmail({ to: input.email, subject: text.subject, html });
}

export async function sendAdminMessage(emails: string[], subject: string, message: string) {
  const paragraphs = escapeHtml(message)
    .split(/\n{2,}/)
    .map((part) => `<p style="font-size:20px;line-height:1.5;">${part.replaceAll("\n", "<br>")}</p>`)
    .join("");
  const html = shell(`
    <h1 style="font-size:36px;line-height:1.15;margin:12px 0;">${escapeHtml(subject)}</h1>
    ${paragraphs}
  `);

  let sent = 0;
  for (const email of emails) {
    if (await postEmail({ to: email, subject, html })) sent += 1;
  }
  return sent;
}
