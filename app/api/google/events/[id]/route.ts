import { google } from "googleapis";
import { googleOAuthClient } from "../../../../../lib/google";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    if (!refreshToken) return Response.json({ error: "Google não conectado" }, { status: 503 });
    const { id } = await context.params;
    const body = await request.json();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date) || !/^\d{2}:\d{2}$/.test(body.time)) return Response.json({ error: "Data ou horário inválido" }, { status: 400 });
    const auth = googleOAuthClient(); auth.setCredentials({ refresh_token: refreshToken });
    const calendar = google.calendar({ version: "v3", auth });
    const current = await calendar.events.get({ calendarId: "primary", eventId: id });
    const oldStart = new Date(current.data.start?.dateTime || current.data.start?.date || "");
    const oldEnd = new Date(current.data.end?.dateTime || current.data.end?.date || "");
    const difference = oldEnd.getTime() - oldStart.getTime();
    const duration = Number.isFinite(difference) && difference > 0 ? difference : 60 * 60 * 1000;
    const start = new Date(`${body.date}T${body.time}:00-03:00`);
    const end = new Date(start.getTime() + duration);
    const updated = await calendar.events.patch({ calendarId: "primary", eventId: id, sendUpdates: "all", requestBody: { start: { dateTime: start.toISOString(), timeZone: "America/Bahia" }, end: { dateTime: end.toISOString(), timeZone: "America/Bahia" } } });
    return Response.json({ ok: true, event: { id: updated.data.id, start: updated.data.start, end: updated.data.end } });
  } catch (error) {
    console.error("Calendar reschedule failed", error);
    return Response.json({ error: "Falha ao remarcar evento" }, { status: 502 });
  }
}
