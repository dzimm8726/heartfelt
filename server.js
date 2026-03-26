require("dotenv").config();
const express = require("express");
const Anthropic = require("@anthropic-ai/sdk").default;
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

app.post("/api/generate", async (req, res) => {
  const { occasion, details, tone } = req.body;

  if (!occasion || !details || !tone) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: `You are a warm, empathetic letter writer. Write a ${tone.toLowerCase()} ${occasion.toLowerCase()} letter based on the details provided.

Rules:
- Write ONLY the letter text. No preamble, no explanation, no markdown.
- Start with a greeting like "Dear [Name],"
- End with a closing (e.g., "With love," or "Sincerely,") then a blank line for signing
- 150-300 words
- Make it genuinely personal using the details given
- Tone: ${tone}
- Avoid cliché or overly flowery language
- Sound like a real, caring person`,
      messages: [
        {
          role: "user",
          content: `Write a ${occasion.toLowerCase()} letter:\n\n${details}\n\nTone: ${tone}`,
        },
      ],
    });

    const text = message.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    res.json({ letter: text });
  } catch (err) {
    console.error("Anthropic API error:", err.message);
    res.status(500).json({ error: "Failed to generate letter. Please try again." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Heartfelt is running at http://localhost:${PORT}`);
});
