require("dotenv").config();
const express = require("express");
const Anthropic = require("@anthropic-ai/sdk").default;
const Stripe = require("stripe");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICES = {
  single: "price_1TFQXyLy1OBajEep3NdGiR8e",
  monthly: "price_1TFQZKLy1OBajEep4KYXkbB2",
};

/* ── Generate Letter ── */
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

/* ── Stripe Checkout ── */
app.post("/api/checkout", async (req, res) => {
  const { plan } = req.body;

  if (!plan || !PRICES[plan]) {
    return res.status(400).json({ error: "Invalid plan." });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: plan === "monthly" ? "subscription" : "payment",
      payment_method_types: ["card"],
      line_items: [{ price: PRICES[plan], quantity: 1 }],
      success_url: `${req.headers.origin || "http://localhost:3000"}?paid=${plan}`,
      cancel_url: `${req.headers.origin || "http://localhost:3000"}?canceled=true`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err.message);
    res.status(500).json({ error: "Failed to create checkout session." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Heartfelt is running at http://localhost:${PORT}`);
});
