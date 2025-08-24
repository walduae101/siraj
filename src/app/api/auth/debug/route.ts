import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "~/server/firebase/admin-lazy";
import { getConfig } from "~/server/config/loader";

export async function GET(req: NextRequest) {
  try {
    // Get auth header
    const authHeader = req.headers.get("authorization");
    
    // Get config
    const config = await getConfig();
    
    // Basic info (safe to expose)
    const debugInfo: any = {
      hasAuthHeader: !!authHeader,
      authHeaderFormat: authHeader ? authHeader.substring(0, 7) : null,
      configLoaded: !!config,
      projectId: config?.firebase?.projectId || "NOT_SET",
      hasServiceAccount: !!config?.firebase?.serviceAccountJson,
    };

    // If auth header present, try to verify
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      try {
        const auth = await getAdminAuth();
        const decodedToken = await auth.verifyIdToken(token);
        debugInfo.tokenValid = true;
        debugInfo.tokenUid = decodedToken.uid;
        debugInfo.tokenProject = decodedToken.firebase?.sign_in_provider;
      } catch (error) {
        debugInfo.tokenValid = false;
        debugInfo.tokenError = error instanceof Error ? error.message : "Unknown error";
      }
    }

    return NextResponse.json(debugInfo);
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
