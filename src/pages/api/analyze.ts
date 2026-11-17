import { NextApiRequest, NextApiResponse } from "next";

interface AnalyzeRequest {
  location: string;
  aqi: number;
  category: string;
  dominantPollutant: string;
  pollutants: { name: string; value: number; unit: string }[];
}

interface AnalysisResult {
  summary: string;
  healthAdvice: string;
  pollutionSources: string[];
  riskLevel: "low" | "moderate" | "high" | "severe";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnalysisResult | { error: string }>
) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = req.body as AnalyzeRequest;
  const apiKey = process.env.GROQ_API_KEY;

  const systemPrompt = `You are an environmental data analyst. Analyze the air quality data provided and return a JSON object with these exact keys:
{
  "summary": "one-sentence human-readable summary of the air quality",
  "healthAdvice": "concise health recommendations",
  "pollutionSources": ["likely source 1", "likely source 2", "likely source 3"],
  "riskLevel": "low | moderate | high | severe"
}
Only return valid JSON, no markdown.`;

  const userPrompt = `Air quality data for ${body.location}:
- AQI: ${body.aqi} (${body.category})
- Dominant pollutant: ${body.dominantPollutant}
- Pollutants: ${JSON.stringify(body.pollutants)}

Analyze this data.`;

  // Default fallback response
  const defaultResponse: AnalysisResult = {
    summary: `${body.location} currently has an AQI of ${body.aqi}, which is ${body.category.toLowerCase()}. The dominant pollutant is ${body.dominantPollutant}.`,
    healthAdvice:
      body.category.toLowerCase().includes("unhealthy")
        ? "Limit outdoor exertion and keep windows closed."
        : "Air quality is acceptable; normal outdoor activity is fine.",
    pollutionSources: ["Vehicle emissions", "Industrial activity", "Construction dust"],
    riskLevel: body.aqi > 150 ? "severe" : body.aqi > 150 ? "high" : body.aqi > 100 ? "moderate" : "low",
  };

  if (!apiKey) {
    res.status(200).json(defaultResponse);
    return;
  }

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen/qwen3.8-27b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!groqRes.ok) {
      const text = await groqRes.text();
      console.error("Groq API error:", groqRes.status, text);
      res.status(200).json(defaultResponse);
      return;
    }

    const data = await groqRes.json();
    const content = data.choices?.[0]?.message?.content ?? "";
    const cleaned = content
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/, "")
      .replace(/```$/, "")
      .trim();

    try {
      const parsed = JSON.parse(cleaned) as AnalysisResult;
      res.status(200).json(parsed);
    } catch {
      res.status(200).json(defaultResponse);
    }
  } catch (err: any) {
    console.error("Analysis error:", err);
    res.status(200).json(defaultResponse);
  }
}