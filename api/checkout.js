import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  if (!stripeSecretKey) {
    res.status(500).json({ error: 'Missing STRIPE_SECRET_KEY.' });
    return;
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const priceId = body?.priceId;
  const customerEmail = typeof body?.customerEmail === 'string' ? body.customerEmail.trim().toLowerCase() : undefined;
  const planKey = typeof body?.planKey === 'string' ? body.planKey.trim().toLowerCase() : undefined;

  if (!priceId) {
    res.status(400).json({ error: 'Missing priceId.' });
    return;
  }

  const stripe = new Stripe(stripeSecretKey);
  const successUrl = process.env.STRIPE_SUCCESS_URL ?? 'http://localhost:5173/?checkout=success';
  const cancelUrl = process.env.STRIPE_CANCEL_URL ?? 'http://localhost:5173/?checkout=cancelled';

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: customerEmail,
      metadata: {
        planKey: planKey ?? '',
        customerEmail: customerEmail ?? '',
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unable to create checkout session.',
    });
  }
}
