import { NextResponse } from "next/server";

const FALLBACK_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyxcAZoMwtGC_ZuAXv10sVM_4K6ZCposdnscifYgXHJnLpeQE1ZmdffQwesO28Ya4NQJQ/exec";

const APPS_SCRIPT_URL = (
  process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || FALLBACK_APPS_SCRIPT_URL
).trim();

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ── Server-side in-memory cache (survives across requests in same process) ──
// Stale-While-Revalidate: serve cached data instantly, refresh in background.
const FRESH_TTL_MS  = 90_000;   // 90s  → serve immediately, no background fetch
const STALE_TTL_MS  = 300_000;  // 5min → serve stale + trigger background refresh
// After 5min without a successful fetch, allow a real blocking fetch again.

interface CacheEntry {
  data: unknown;
  fetchedAt: number;
  isRefreshing: boolean;
}

// Module-level cache (Node.js process memory — resets on cold start)
let cache: CacheEntry | null = null;

async function fetchFromAppsScript(): Promise<unknown> {
  const targetUrl = new URL(APPS_SCRIPT_URL);
  targetUrl.searchParams.append("t", Date.now().toString());

  const res = await fetch(targetUrl.toString(), {
    cache: "no-store",
    redirect: "follow",
    // 55s server-side timeout — Vercel functions have 60s limit
    signal: AbortSignal.timeout(55_000),
    headers: {
      Accept: "application/json, text/plain, */*",
      "User-Agent": "Mozilla/5.0 (compatible; NextJS-Server/1.0)",
      "Cache-Control": "no-cache, no-store",
      Pragma: "no-cache",
    },
  });

  const bodyText = await res.text();

  if (!res.ok) {
    throw new Error(`Apps Script returned HTTP ${res.status}: ${bodyText.slice(0, 200)}`);
  }

  let data: unknown;
  try {
    data = JSON.parse(bodyText);
  } catch {
    throw new Error(`Apps Script returned non-JSON: ${bodyText.slice(0, 200)}`);
  }

  return data;
}

export async function GET() {
  if (!APPS_SCRIPT_URL) {
    return NextResponse.json(
      { success: false, error: "NEXT_PUBLIC_APPS_SCRIPT_URL is not configured." },
      { status: 500 }
    );
  }

  const now = Date.now();
  const age = cache ? now - cache.fetchedAt : Infinity;

  // ── FRESH: return immediately, no fetch needed ──────────────────────────────
  if (cache && age < FRESH_TTL_MS) {
    return NextResponse.json(cache.data, {
      headers: {
        "Cache-Control": "no-store",
        "X-Cache": "HIT-FRESH",
        "X-Cache-Age": String(Math.round(age / 1000)) + "s",
      },
    });
  }

  // ── STALE: return old data immediately + refresh in background ──────────────
  if (cache && age < STALE_TTL_MS) {
    if (!cache.isRefreshing) {
      cache.isRefreshing = true;
      // Fire-and-forget background refresh
      fetchFromAppsScript()
        .then((freshData) => {
          cache = { data: freshData, fetchedAt: Date.now(), isRefreshing: false };
        })
        .catch(() => {
          if (cache) cache.isRefreshing = false;
        });
    }
    return NextResponse.json(cache.data, {
      headers: {
        "Cache-Control": "no-store",
        "X-Cache": "HIT-STALE",
        "X-Cache-Age": String(Math.round(age / 1000)) + "s",
      },
    });
  }

  // ── COLD / EXPIRED: blocking fetch (first load or cache expired > 5min) ─────
  try {
    const data = await fetchFromAppsScript();
    cache = { data, fetchedAt: Date.now(), isRefreshing: false };

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store",
        "X-Cache": "MISS",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";

    // If we have ANY stale cached data, return it with a warning rather than erroring
    if (cache) {
      return NextResponse.json(
        { ...(cache.data as object), _stale: true, _staleReason: message },
        {
          headers: {
            "Cache-Control": "no-store",
            "X-Cache": "STALE-ON-ERROR",
          },
        }
      );
    }

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
