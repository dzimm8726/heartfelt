const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICES = {
  single: "price_1TFQXyLy1OBajEep3NdGiR8e",
  monthly: "price_1TFQZKLy1OBajEep4KYXkbB2",
};

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { plan } = req.body;

  if (!plan || !PRICES[plan]) {
    return res.status(400).json({ error: "Invalid plan. Use 'single' or 'monthly'." });
  }

  const priceId = PRICES[plan];
  const isSub = plan === "monthly";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: isSub ? "subscription" : "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${req.headers.origin || "https://writeheartfelt.com"}?paid=${plan}`,
      cancel_url: `${req.headers.origin || "https://writeheartfelt.com"}?canceled=true`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err.message);
    res.status(500).json({ error: "Failed to create checkout session." });
  }
};
