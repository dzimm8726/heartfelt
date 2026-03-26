# Heartfelt — AI Letter Writer

A beautiful web app that helps people write heartfelt letters for any occasion.
Built with Express.js + the Anthropic API.

## Quick Start

### 1. Install dependencies
```bash
cd heartfelt
npm install
```

### 2. Add your API key
```bash
cp .env.example .env
```
Then edit `.env` and add your Anthropic API key from https://console.anthropic.com/

### 3. Run it
```bash
npm run dev
```
Open http://localhost:3000

## Deploy to Vercel (Free)

### Option A: Vercel CLI
```bash
npm i -g vercel
vercel
```

### Option B: GitHub → Vercel
1. Push this folder to a GitHub repo
2. Go to https://vercel.com/new
3. Import your repo
4. Add environment variable: `ANTHROPIC_API_KEY` = your key
5. Deploy

**Note for Vercel:** You'll need to convert `server.js` to a serverless function.
Create `api/generate.js`:

```js
const Anthropic = require("@anthropic-ai/sdk").default;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { occasion, details, tone } = req.body;
  if (!occasion || !details || !tone) return res.status(400).json({ error: "Missing fields" });

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: `You are a warm, empathetic letter writer. Write a ${tone.toLowerCase()} ${occasion.toLowerCase()} letter. Write ONLY the letter text, 150-300 words, personal, no clichés.`,
      messages: [{ role: "user", content: `Write a ${occasion.toLowerCase()} letter:\n\n${details}\n\nTone: ${tone}` }],
    });

    const text = message.content.filter(b => b.type === "text").map(b => b.text).join("\n").trim();
    res.json({ letter: text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate letter" });
  }
};
```

## Project Structure
```
heartfelt/
├── server.js          # Express server + API route
├── public/
│   └── index.html     # Complete frontend (single file)
├── .env.example       # Environment template
├── package.json
└── README.md
```

## Costs
- **Hosting**: Free (Vercel free tier)
- **API**: ~$0.01-0.05 per letter (Claude Sonnet)
- **Domain**: ~$12/year

## Next Steps
- [ ] Add Stripe for payments ($2.99/letter or $7.99/mo)
- [ ] Add email delivery option
- [ ] Add printable stationery templates
- [ ] Set up Facebook ad campaign
- [ ] Add analytics (Plausible or PostHog)
