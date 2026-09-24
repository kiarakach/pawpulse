// send-push — send a push notification to a user's registered devices.
//
// Contract (POST JSON):
//   { user_id: string, title: string, body: string, data?: Record<string,string> }
//   -> { sent: number, failed: number, results: [...] }
//
// Looks up device_tokens for the user and dispatches:
//   • iOS   -> Apple Push Notification service (APNs) over HTTP/2, JWT (ES256) auth
//   • android-> Firebase Cloud Messaging (FCM) HTTP v1, OAuth2 (service account)
//
// Required Edge Function secrets (set with `supabase secrets set`):
//   APNS_KEY_ID        — 10-char key id of the .p8 APNs auth key
//   APNS_TEAM_ID       — your Apple Developer Team ID
//   APNS_PRIVATE_KEY   — contents of the .p8 file (PEM, incl. BEGIN/END lines)
//   APNS_BUNDLE_ID     — app bundle id / APNs topic (e.g. com.pawpulse.app)
//   APNS_ENV           — "sandbox" (TestFlight/dev) or "production"
//   FCM_SERVICE_ACCOUNT— (optional, Android) service-account JSON string
//   FCM_PROJECT_ID     — (optional, Android) Firebase project id
// SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are auto-injected.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

// ---- APNs JWT (ES256) ----
function b64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function pemToPkcs8(pem: string): Uint8Array {
  const body = pem.replace(/-----BEGIN [^-]+-----/g, "").replace(/-----END [^-]+-----/g, "").replace(/\s+/g, "");
  const bin = atob(body);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}
async function apnsJwt(keyId: string, teamId: string, privateKeyPem: string): Promise<string> {
  const header = b64url(new TextEncoder().encode(JSON.stringify({ alg: "ES256", kid: keyId })));
  const claims = b64url(new TextEncoder().encode(JSON.stringify({ iss: teamId, iat: Math.floor(Date.now() / 1000) })));
  const signingInput = `${header}.${claims}`;
  const key = await crypto.subtle.importKey(
    "pkcs8", pemToPkcs8(privateKeyPem),
    { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"],
  );
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(signingInput)));
  return `${signingInput}.${b64url(sig)}`;
}

async function sendApns(token: string, title: string, body: string, data: Record<string, string>) {
  const keyId = Deno.env.get("APNS_KEY_ID");
  const teamId = Deno.env.get("APNS_TEAM_ID");
  const pem = Deno.env.get("APNS_PRIVATE_KEY");
  const topic = Deno.env.get("APNS_BUNDLE_ID");
  const env = Deno.env.get("APNS_ENV") ?? "sandbox";
  if (!keyId || !teamId || !pem || !topic) throw new Error("APNs secrets not configured");
  const jwt = await apnsJwt(keyId, teamId, pem);
  const host = env === "production" ? "https://api.push.apple.com" : "https://api.sandbox.push.apple.com";
  const res = await fetch(`${host}/3/device/${token}`, {
    method: "POST",
    headers: { authorization: `bearer ${jwt}`, "apns-topic": topic, "apns-push-type": "alert" },
    body: JSON.stringify({ aps: { alert: { title, body }, sound: "default" }, ...data }),
  });
  return { ok: res.ok, status: res.status, detail: res.ok ? "" : await res.text() };
}

// ---- FCM HTTP v1 (Android) ----
async function fcmAccessToken(sa: Record<string, string>): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(new TextEncoder().encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const claim = b64url(new TextEncoder().encode(JSON.stringify({
    iss: sa.client_email, scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600,
  })));
  const key = await crypto.subtle.importKey("pkcs8", pemToPkcs8(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${header}.${claim}`)));
  const assertion = `${header}.${claim}.${b64url(sig)}`;
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${assertion}`,
  });
  return (await r.json()).access_token;
}
async function sendFcm(token: string, title: string, body: string, data: Record<string, string>) {
  const saRaw = Deno.env.get("FCM_SERVICE_ACCOUNT");
  const projectId = Deno.env.get("FCM_PROJECT_ID");
  if (!saRaw || !projectId) throw new Error("FCM secrets not configured");
  const sa = JSON.parse(saRaw);
  const accessToken = await fcmAccessToken(sa);
  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
    method: "POST",
    headers: { authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ message: { token, notification: { title, body }, data } }),
  });
  return { ok: res.ok, status: res.status, detail: res.ok ? "" : await res.text() };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  // Server-to-server only: require a shared secret so arbitrary clients can't
  // send pushes to other users. Cron/backend passes header x-push-secret.
  const guard = Deno.env.get("PUSH_SECRET");
  if (!guard || req.headers.get("x-push-secret") !== guard) return json({ error: "unauthorized" }, 401);
  try {
    const { user_id, title, body, data = {} } = await req.json();
    if (!user_id || !title || !body) return json({ error: "user_id, title, body required" }, 400);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: tokens, error } = await supabase.from("device_tokens").select("token, platform").eq("user_id", user_id);
    if (error) return json({ error: error.message }, 500);
    if (!tokens?.length) return json({ sent: 0, failed: 0, results: [], note: "no devices registered" });

    const results = [];
    for (const t of tokens) {
      try {
        const r = t.platform === "android" ? await sendFcm(t.token, title, body, data) : await sendApns(t.token, title, body, data);
        results.push({ platform: t.platform, ...r });
      } catch (e) {
        results.push({ platform: t.platform, ok: false, status: 0, detail: String(e) });
      }
    }
    return json({ sent: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length, results });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
