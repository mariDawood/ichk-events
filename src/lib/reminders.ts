import "server-only";
import { events } from "@/content/events";
import { calendarDate, nextCalendarDate } from "@/lib/dates";
import { sendReminderEmail } from "@/lib/email";
import { getTicket, listReminderOrders, markReminderSent } from "@/lib/orders";

export async function sendDueReminders(now = new Date()) {
  const tomorrow = nextCalendarDate(calendarDate(now));
  let sent = 0;

  for (const event of events) {
    if (calendarDate(new Date(event.start)) !== tomorrow) continue;
    const orders = await listReminderOrders(event.id);
    for (const order of orders) {
      const tickets = [];
      for (const number of order.ticketNumbers) {
        const ticket = await getTicket(number);
        if (ticket && !ticket.cancelledAt) tickets.push(ticket);
      }
      if (tickets.length === 0) continue;
      const ok = await sendReminderEmail(order, tickets);
      if (!ok) continue;
      await markReminderSent(order.id);
      sent += 1;
    }
  }

  return sent;
}
