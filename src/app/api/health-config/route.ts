import { NextResponse } from "next/server";
import { getServerConfig } from "../../../lib/config.server";

export async function GET() {
  try {
    const config = await getServerConfig();
    
    // Check if required secrets have values (not empty strings)
    const firebase = !!(
      config.public.firebase.apiKey &&
      config.public.firebase.projectId &&
      config.public.firebase.authDomain
    );
    
    const paynow = !!(
      config.secrets.PAYNOW_API_KEY &&
      config.secrets.PAYNOW_WEBHOOK_SECRET
    );
    
    const openai = !!config.secrets.OPENAI_API_KEY;
    
    return NextResponse.json({
      ok: true,
      firebase,
      paynow,
      openai,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: "Configuration check failed",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
