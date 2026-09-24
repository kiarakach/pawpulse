// ============================================================================
// invoke-llm  —  Supabase Edge Function (Deno)
//
// Drop-in replacement for Base44's Core.InvokeLLM, backed by an OPEN-SOURCE
// model (Llama 3.3 70B). Provider-agnostic: works with any OpenAI-compatible
// endpoint (OpenRouter, Groq, Together, Cloudflare, local Ollama, ...).
//
// Request body (same shape the PawPulse app already sends):
//   {
//     prompt: string,                       // required
//     response_json_schema?: object,        // if present -> we return parsed JSON
//     add_context_from_internet?: boolean,  // ignored (Llama can't browse)
//     model?: string                        // ignored (Base44 alias); we use LLM_MODEL
//   }
//
// Response:
//   - with response_json_schema -> the parsed JSON object matching that schema
//   - without a schema          -> a plain text string
//
// Secrets (set via `supabase secrets set`):
//   LLM_API_KEY   (required)  e.g. an OpenRouter key (sk-or-...)
//   LLM_BASE_URL  (optional)  default: https://openrouter.ai/api/v1
//   LLM_MODEL     (optional)  default: meta-llama/llama-3.3-70b-instruct:free
// ============================================================================

const BASE_URL =
  Deno.env.get("LLM_BASE_URL") ?? "https://openrouter.ai/api/v1";
const CHAT_URL = `${BASE_URL.replace(/\/$/, "")}/chat/completions`;

// We try instruct models (which emit JSON directly) in order, skipping any that
// are rate-limited (429) OR return empty content (reasoning models that burn
// their budget "thinking"). LLM_MODEL (if set) is tried first.
const PRIMARY = Deno.env.get("LLM_MODEL") ?? "google/gemma-4-31b-it:free";
// OpenRouter-specific free fallbacks only make sense against OpenRouter. For any
// other provider (e.g. Google's OpenAI-compatible endpoint) just use LLM_MODEL.
const CANDIDATES = BASE_URL.includes("openrouter")
  ? [
      PRIMARY,
      "google/gemma-4-31b-it:free",
      "google/gemma-4-26b-a4b-it:free",
      "qwen/qwen3.8-27b:free",
      "openrouter/free",
    ].filter((m, i, a) => a.indexOf(m) === i)
  : [PRIMARY];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

  const apiKey = Deno.env.get("LLM_API_KEY");
  if (!apiKey) {
    return json({ error: "LLM_API_KEY is not configured" }, 500);
  }

  let payload: {
    prompt?: string;
    response_json_schema?: unknown;
    add_context_from_internet?: boolean;
    model?: string;
  };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { prompt, response_json_schema } = payload;
  if (!prompt || typeof prompt !== "string") {
    return json({ error: "`prompt` is required" }, 400);
  }

  const wantsJson = !!response_json_schema;

  // Build messages. For structured output we instruct the model to return ONLY
  // JSON matching the caller's schema, and use JSON mode to enforce it.
  const messages = [
    {
      role: "system",
      content: wantsJson
        ? "You are a precise JSON API. Respond with ONLY a single valid JSON " +
          "object that conforms exactly to this JSON schema. Do not include " +
          "markdown, code fences, or any prose.\n\nJSON schema:\n" +
          JSON.stringify(response_json_schema)
        : "You are a helpful assistant.",
    },
    { role: "user", content: prompt },
  ];

  // Parse a JSON object out of model text (handles code fences / stray prose).
  const parseJson = (text: string): unknown | null => {
    try { return JSON.parse(text); } catch { /* try extraction */ }
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { /* give up */ }
    }
    return null;
  };

  // Top-level keys the caller's schema expects — used to reject garbage objects
  // like {"":""} that parse fine but don't match the requested shape.
  const schemaProps = (response_json_schema as { properties?: Record<string, unknown> })?.properties;
  const schemaKeys = schemaProps && typeof schemaProps === "object" ? Object.keys(schemaProps) : [];

  // Try each candidate model until one returns usable content. For JSON mode we
  // require the content to actually parse AND match the requested shape (some
  // free models emit safety text, empty replies, or {"":""} — skip those).
  let result: unknown = null;
  let lastDetail = "no models attempted";
  outer:
  for (const model of CANDIDATES) {
    const body: Record<string, unknown> = {
      model,
      messages,
      temperature: 0.7,
      max_tokens: 8192, // large enough for full charts/plans without truncation
    };
    if (wantsJson) body.response_format = { type: "json_object" };

    // Up to 4 tries per model with backoff. Google's free Gemini tier returns
    // transient 503 "high demand" fairly often, so we ride through those spikes.
    for (let attempt = 0; attempt < 4; attempt++) {
      if (attempt > 0) await sleep(700 * attempt); // 0.7s, 1.4s, 2.1s backoff
      let res: Response;
      try {
        res = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://pawpulse.app",
            "X-Title": "PawPulse",
          },
          body: JSON.stringify(body),
        });
      } catch (err) {
        lastDetail = `${model}: ${String(err)}`;
        continue;
      }
      if (!res.ok) {
        lastDetail = `${model} -> ${res.status}: ${(await res.text()).slice(0, 300)}`;
        if (res.status === 429 || res.status >= 500) continue; // retry/next
        break; // hard 4xx (bad key etc.) — stop entirely
      }
      const data = await res.json();
      const c = (data?.choices?.[0]?.message?.content ?? "").trim();
      if (!c) { lastDetail = `${model}: empty content`; break; } // next model
      if (!wantsJson) { result = c; break outer; } // free-text: any content ok
      const parsed = parseJson(c);
      const matchesShape = parsed && typeof parsed === "object" &&
        (schemaKeys.length === 0 ||
          schemaKeys.some((k) => k in (parsed as Record<string, unknown>)));
      if (matchesShape) { result = parsed; break outer; }
      lastDetail = `${model}: bad/mismatched JSON: ${c.slice(0, 120)}`;
      break; // bad JSON from this model — try the next one
    }
  }

  if (result === null) {
    return json({ error: "LLM provider request failed", detail: lastDetail }, 502);
  }
  // Free-text -> plain string; structured -> the parsed object itself.
  return json(result);
});
