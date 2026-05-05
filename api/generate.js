const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { input, systemPrompt } = req.body || {};

  if (!input || typeof input !== "string" || input.trim().length === 0) {
    return res.status(400).json({ error: "Missing or empty input" });
  }
  if (!systemPrompt || typeof systemPrompt !== "string") {
    return res.status(400).json({ error: "Missing systemPrompt" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server misconfigured" });
  }

  let geminiRes;
  try {
    geminiRes = await fetch(GEMINI_ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gemini-2.0-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: input.trim() },
        ],
        max_tokens: 1000,
        temperature: 0.3,
      }),
    });
  } catch {
    return res.status(502).json({ error: "Failed to reach Gemini" });
  }

  const data = await geminiRes.json();

  if (!geminiRes.ok) {
    const message =
      data?.error?.message || data?.error || `Request failed (${geminiRes.status})`;
    return res.status(geminiRes.status).json({ error: message });
  }

  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) {
    return res.status(500).json({ error: "Gemini returned no text content" });
  }

  return res.status(200).json({ text });
}
