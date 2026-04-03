import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

function getSupabaseAdmin() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase admin credentials for webhook processing.');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function readRawBody(req) {
  if (typeof req.body === 'string') return req.body;
  if (Buffer.isBuffer(req.body)) return req.body.toString('utf8');

  return await new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function mapSubscriptionRecord(sessionOrSubscription, statusOverride) {
  const status = statusOverride ?? sessionOrSubscription.status ?? 'active';
  const metadata = sessionOrSubscription.metadata ?? {};
  const periodEndUnix =
    sessionOrSubscription.current_period_end ??
    sessionOrSubscription.expires_at ??
    null;

  return {
    customer_email:
      sessionOrSubscription.customer_details?.email ??
      sessionOrSubscription.customer_email ??
      metadata.customerEmail ??
      null,
    plan_key: metadata.planKey ?? 'unknown',
    status,
    stripe_customer_id:
      typeof sessionOrSubscription.customer === 'string'
        ? sessionOrSubscription.customer
        : sessionOrSubscription.customer?.id ?? null,
    stripe_subscription_id:
      typeof sessionOrSubscription.subscription === 'string'
        ? sessionOrSubscription.subscription
        : sessionOrSubscription.id ?? null,
    price_id:
      sessionOrSubscription.items?.data?.[0]?.price?.id ??
      sessionOrSubscription.line_items?.data?.[0]?.price?.id ??
      null,
    current_period_end: periodEndUnix ? new Date(periodEndUnix * 1000).toISOString() : null,
    updated_at: new Date().toISOString(),
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  if (!stripeSecretKey || !stripeWebhookSecret) {
    res.status(500).json({ error: 'Missing Stripe webhook configuration.' });
    return;
  }

  const stripe = new Stripe(stripeSecretKey);

  try {
    const rawBody = await readRawBody(req);
    const signature = req.headers['stripe-signature'];

    if (typeof signature !== 'string') {
      res.status(400).json({ error: 'Missing Stripe signature.' });
      return;
    }

    const event = stripe.webhooks.constructEvent(rawBody, signature, stripeWebhookSecret);
    const supabaseAdmin = getSupabaseAdmin();

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const record = mapSubscriptionRecord(session, 'active');

      if (record.customer_email) {
        await supabaseAdmin.from('subscriptions').upsert(record, {
          onConflict: 'stripe_subscription_id',
        });
      }
    }

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const customer = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
      let customerEmail = subscription.metadata?.customerEmail ?? null;

      if (!customerEmail && customer) {
        const customerResponse = await stripe.customers.retrieve(customer);
        if (!('deleted' in customerResponse) && customerResponse.email) {
          customerEmail = customerResponse.email.toLowerCase();
        }
      }

      const record = {
        ...mapSubscriptionRecord(
          {
            ...subscription,
            customer_email: customerEmail,
          },
          subscription.status,
        ),
        customer_email: customerEmail,
      };

      if (record.customer_email) {
        await supabaseAdmin.from('subscriptions').upsert(record, {
          onConflict: 'stripe_subscription_id',
        });
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Webhook processing failed.',
    });
  }
}
