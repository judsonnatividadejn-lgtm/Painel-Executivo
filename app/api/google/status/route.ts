import { google } from "googleapis";
import { googleOAuthClient } from "../../../../lib/google";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    if (!refreshToken) return Response.json({ connected: false, error: "missing_refresh_token" }, { status: 503 });
    const auth = googleOAuthClient();
    auth.setCredentials({ refresh_token: refreshToken });

    const gmail = google.gmail({ version: "v1", auth });
    const calendar = google.calendar({ version: "v3", auth });
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    const [messages, events] = await Promise.all([
      gmail.users.messages.list({ userId: "me", q: "is:unread in:inbox", maxResults: 20 }),
      calendar.events.list({ calendarId: "primary", timeMin: now.toISOString(), timeMax: end.toISOString(), singleEvents: true, orderBy: "startTime", maxResults: 20 }),
    ]);

    const emailDetails = await Promise.all((messages.data.messages ?? []).slice(0, 10).map(async ({ id }) => {
      if (!id) return null;
      const message = await gmail.users.messages.get({ userId: "me", id, format: "metadata", metadataHeaders: ["From", "Subject", "Date"] });
      const headers = message.data.payload?.headers ?? [];
      const header = (name: string) => headers.find((item) => item.name?.toLowerCase() === name.toLowerCase())?.value ?? "";
      return { id, sender: header("From"), subject: header("Subject") || "Sem assunto", date: header("Date"), snippet: message.data.snippet ?? "" };
    }));

    const calendarEvents = (events.data.items ?? []).map((event) => ({
      id: event.id,
      title: event.summary || "Evento sem título",
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      location: event.location || "",
    }));

    return Response.json({
      connected: true,
      gmail: { unreadInbox: messages.data.resultSizeEstimate ?? 0, messages: emailDetails.filter(Boolean) },
      calendar: { remainingToday: calendarEvents.length, events: calendarEvents },
      checkedAt: new Date().toISOString(),
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("Google connection check failed", error);
    return Response.json({ connected: false, error: "google_api_error" }, { status: 502 });
  }
}
