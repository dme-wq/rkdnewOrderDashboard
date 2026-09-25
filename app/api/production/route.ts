import { NextResponse } from "next/server";

// Fallback URL — updated to latest deployment
const FALLBACK_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyxcAZoMwtGC_ZuAXv10sVM_4K6ZCposdnscifYgXHJnLpeQE1ZmdffQwesO28Ya4NQJQ/exec";

const APPS_SCRIPT_URL = (process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || FALLBACK_APPS_SCRIPT_URL).trim();

// No caching — always fetch fresh data from Google Apps Script
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  if (!APPS_SCRIPT_URL) {
    return NextResponse.json(
      { success: false, error: "NEXT_PUBLIC_APPS_SCRIPT_URL is not configured and no fallback available." },
      { status: 500 }
    );
  }

  try {
    // Use timestamp + random nonce to bypass ALL caches (CDN, ISP, Apps Script)
    const targetUrl = new URL(APPS_SCRIPT_URL);
    targetUrl.searchParams.append("t", Date.now().toString());
    targetUrl.searchParams.append("r", Math.random().toString(36).slice(2));

    // Follow redirects (important for Workspace-domain Google Apps Script URLs)
    const res = await fetch(targetUrl.toString(), {
      cache: "no-store",
      redirect: "follow",
      headers: {
        Accept: "application/json, text/plain, */*",
        "User-Agent": "Mozilla/5.0 (compatible; NextJS-Server/1.0)",
        "Cache-Control": "no-cache, no-store",
        "Pragma": "no-cache",
      },
    });

    // Read body as text first to get better error info
    const bodyText = await res.text();

    if (!res.ok) {
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

    // No caching — tell Vercel CDN and browser to never cache this response
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
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
