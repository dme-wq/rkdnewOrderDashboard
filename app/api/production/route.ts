import { NextResponse } from "next/server";

const APPS_SCRIPT_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || "";

// Force dynamic rendering to completely disable caching for real-time updates
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  if (!APPS_SCRIPT_URL) {
    return NextResponse.json(
      { success: false, error: "NEXT_PUBLIC_APPS_SCRIPT_URL is not configured." },
      { status: 500 }
    );
  }

  try {
    // Follow redirects (important for Workspace-domain Google Apps Script URLs)
    const res = await fetch(APPS_SCRIPT_URL, {
      cache: "no-store",
      redirect: "follow",
      headers: {
        Accept: "application/json, text/plain, */*",
        "User-Agent": "Mozilla/5.0 (compatible; NextJS-Server/1.0)",
      },
    });

    // Read body as text first to get better error info
    const bodyText = await res.text();

    if (!res.ok) {
      // Return the actual error body for debugging
      return NextResponse.json(
        {
          success: false,
          error: `Apps Script returned HTTP ${res.status}`,
          detail: bodyText.slice(0, 500),
          url: APPS_SCRIPT_URL.slice(0, 80) + "...",
        },
        { status: 502 }
      );
    }

    // Try parsing as JSON
    let data;
    try {
      data = JSON.parse(bodyText);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Apps Script returned non-JSON response",
          detail: bodyText.slice(0, 300),
        },
        { status: 502 }
      );
    }

    // Completely disable caching on CDN/Vercel Edge as well
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        "Surrogate-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message, url: APPS_SCRIPT_URL.slice(0, 80) },
      { status: 500 }
    );
  }
}
