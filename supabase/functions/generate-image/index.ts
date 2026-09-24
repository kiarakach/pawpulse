// ============================================================================
// generate-image  —  Supabase Edge Function (Deno)
//
// Drop-in replacement for Base44's Core.GenerateImage. Generates an image from
// a text prompt using Pollinations (free, no API key), then stores it in our
// own `uploads` storage bucket so the app owns the asset (no reliance on a
// third-party URL staying alive).
//
// Request body (shape the app sends from StatCardModal):
//   { prompt: string, existing_image_urls?: string[] }
//     - existing_image_urls is accepted but not used (Pollinations text-to-image).
//
// Response:  { url: string }   // public URL of the stored image
// ============================================================================

const POLLINATIONS = "https://image.pollinations.ai/prompt/";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BUCKET = "uploads";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let payload: { prompt?: string; existing_image_urls?: string[] };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const prompt = (payload?.prompt ?? "").trim();
  if (!prompt) return json({ error: "`prompt` is required" }, 400);

  // 1. Generate the image with Pollinations. 9:16 portrait suits the app's
  //    Instagram-story stat card; a random seed avoids stale cached results.
  const seed = Math.floor(Math.random() * 1_000_000);
  const url =
    POLLINATIONS +
    encodeURIComponent(prompt) +
    `?width=720&height=1280&model=flux&nologo=true&seed=${seed}`;

  let bytes: ArrayBuffer;
  let contentType = "image/jpeg";
  try {
    const res = await fetch(url);
    if (!res.ok) {
      return json(
        { error: "Image provider failed", detail: `${res.status}: ${(await res.text()).slice(0, 200)}` },
        502,
      );
    }
    contentType = res.headers.get("content-type") || contentType;
    bytes = await res.arrayBuffer();
  } catch (err) {
    return json({ error: "Image provider request failed", detail: String(err) }, 502);
  }

  if (!bytes.byteLength) {
    return json({ error: "Image provider returned empty image" }, 502);
  }

  // 2. Store it in our own bucket (service role bypasses RLS; we control the path).
  const ext = contentType.includes("png") ? "png" : "jpg";
  const objectPath = `generated/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  try {
    const up = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${objectPath}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SERVICE_ROLE}`,
          apikey: SERVICE_ROLE,
          "Content-Type": contentType,
          "x-upsert": "false",
        },
        body: bytes,
      },
    );
    if (!up.ok) {
      return json(
        { error: "Storage upload failed", detail: `${up.status}: ${(await up.text()).slice(0, 200)}` },
        502,
      );
    }
  } catch (err) {
    return json({ error: "Storage upload request failed", detail: String(err) }, 502);
  }

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${objectPath}`;
  return json({ url: publicUrl });
});
