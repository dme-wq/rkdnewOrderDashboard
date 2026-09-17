import { NextResponse } from "next/server";

const APPS_SCRIPT_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || "";

// Re-enabled 30-second caching for faster loading while keeping data reasonably fresh
export const revalidate = 30;

export async function GET() {
  if (!APPS_SCRIPT_URL) {
    return NextResponse.json(
      { success: false, error: "NEXT_PUBLIC_APPS_SCRIPT_URL is not configured." },
      { status: 500 }
    );
  }

  try {
    // Append timestamp to bypass Google Apps Script 302 caching
    const targetUrl = new URL(APPS_SCRIPT_URL);
    // Since we want the proxy to cache the response for 30 seconds, we round the timestamp here as well
    targetUrl.searchParams.append("t", Math.floor(Date.now() / 30000).toString());

    // Follow redirects (important for Workspace-domain Google Apps Script URLs)
    const res = await fetch(targetUrl.toString(), {
      next: { revalidate: 30 },
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

    // Enable 30-second caching on Vercel Edge Network
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
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
