// src/dev/services-smoke-test.ts
import * as svc from "@/services/api";
import { supabase, api as apiDb } from "@/services/supabase";

declare global {
  interface Window {
    __PROJO_SVC__?: unknown;
    svc?: unknown;
    supabase?: unknown;
    apiDb?: unknown;
  }
}

window.__PROJO_SVC__ = svc;
window.svc = svc;

// attach clients for console-only dev diagnostics
window.supabase = supabase as unknown;
window.apiDb = apiDb as unknown;

console.log("[SMOKE TEST] loaded");
console.log("[SMOKE TEST] root keys:", Object.keys(svc));
console.log("[SMOKE TEST] assignments keys:", Object.keys((svc as any).assignments || {}));
console.log("[SMOKE TEST] supabase attached:", !!window.supabase);
console.log("[SMOKE TEST] apiDb attached:", !!window.apiDb);