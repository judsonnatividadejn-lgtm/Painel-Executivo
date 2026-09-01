import { NextResponse } from "next/server";
import { GOOGLE_SCOPES, googleOAuthClient } from "../../../../lib/google";

export async function GET() {
  const url = googleOAuthClient().generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GOOGLE_SCOPES,
    include_granted_scopes: true,
  });
  return NextResponse.redirect(url);
}
