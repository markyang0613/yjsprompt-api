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

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server misconfigured" });
  }

  let openaiRes;
  try {
    openaiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_output_tokens: 1000,
        temperature: 0.3,
        instructions: systemPrompt,
        input: input.trim(),
      }),
    });
  } catch {
    return res.status(502).json({ error: "Failed to reach OpenAI" });
  }

  const data = await openaiRes.json();
  return res.status(openaiRes.status).json(data);
}
