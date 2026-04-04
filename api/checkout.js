import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : undefined;
}

function getSupabaseAdmin() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function resolveProfileIdentifiers({ userId, customerEmail }) {
  const supabaseAdmin = getSupabaseAdmin();

  if (!supabaseAdmin) {
    return {
      userId,
      customerEmail,
    };
  }

  if (userId) {
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('id', userId)
      .maybeSingle();

    if (data) {
      return {
        userId: data.id,
        customerEmail: normalizeEmail(data.email) ?? customerEmail,
      };
    }
  }

  if (customerEmail) {
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('email', customerEmail)
      .maybeSingle();

    if (data) {
      return {
        userId: data.id,
        customerEmail: normalizeEmail(data.email) ?? customerEmail,
      };
    }
  }

  return {
    userId,
    customerEmail,
  };
}

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
  const userId = typeof body?.userId === 'string' ? body.userId.trim() : undefined;
  const customerEmail = normalizeEmail(body?.customerEmail);
  const planKey = typeof body?.planKey === 'string' ? body.planKey.trim().toLowerCase() : undefined;

  if (!priceId) {
    res.status(400).json({ error: 'Missing priceId.' });
    return;
  }

  const stripe = new Stripe(stripeSecretKey);
  const successUrl = process.env.STRIPE_SUCCESS_URL ?? 'http://localhost:5173/?checkout=success';
  const cancelUrl = process.env.STRIPE_CANCEL_URL ?? 'http://localhost:5173/?checkout=cancelled';

  try {
    const resolvedProfile = await resolveProfileIdentifiers({ userId, customerEmail });

    if (!resolvedProfile.customerEmail) {
      res.status(400).json({ error: 'Unable to determine customer email for checkout.' });
      return;
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: resolvedProfile.userId,
      customer_email: resolvedProfile.customerEmail,
      metadata: {
        planKey: planKey ?? '',
        customerEmail: resolvedProfile.customerEmail ?? '',
        userId: resolvedProfile.userId ?? '',
      },
      subscription_data: {
        metadata: {
          planKey: planKey ?? '',
          customerEmail: resolvedProfile.customerEmail ?? '',
          userId: resolvedProfile.userId ?? '',
        },
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
