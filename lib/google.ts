import { google } from "googleapis";

export const GOOGLE_REDIRECT_URI = "https://jeta-performance-painel-executivo.vercel.app/api/auth/google/callback";
export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/calendar.events",
];

export function googleOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Credenciais OAuth do Google não configuradas.");
  return new google.auth.OAuth2(clientId, clientSecret, GOOGLE_REDIRECT_URI);
}
