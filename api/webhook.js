import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { ACTIVE_SUBSCRIPTION_STATUSES } from '../shared/subscriptionStatuses.js';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : null;
}

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
    user_id:
      typeof metadata.userId === 'string' && metadata.userId.trim()
        ? metadata.userId.trim()
        : typeof sessionOrSubscription.client_reference_id === 'string' && sessionOrSubscription.client_reference_id.trim()
          ? sessionOrSubscription.client_reference_id.trim()
          : null,
    customer_email:
      normalizeEmail(sessionOrSubscription.customer_details?.email) ??
      normalizeEmail(sessionOrSubscription.customer_email) ??
      normalizeEmail(metadata.customerEmail) ??
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

async function resolveProfileIdentifiers(supabaseAdmin, {
  userId,
  customerEmail,
}) {
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

  return { userId: userId ?? null, customerEmail };
}

async function syncProfileSubscription(supabaseAdmin, userId, record) {
  if (!userId) {
    return;
  }

  const subscriptionValue = getProfileSubscriptionValue(record);

  await supabaseAdmin
    .from('profiles')
    .update({
      subscription: subscriptionValue,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
}

function getProfileSubscriptionValue(record) {
  return ACTIVE_SUBSCRIPTION_STATUSES.includes(record.status) ? record.plan_key : null;
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
    const signatureHeader = req.headers['stripe-signature'];
    const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;

    if (typeof signature !== 'string') {
      res.status(400).json({ error: 'Missing Stripe signature.' });
      return;
    }

    const event = stripe.webhooks.constructEvent(rawBody, signature, stripeWebhookSecret);
    const supabaseAdmin = getSupabaseAdmin();

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const mappedRecord = mapSubscriptionRecord(session, 'active');
      const profileIdentifiers = await resolveProfileIdentifiers(supabaseAdmin, {
        userId: mappedRecord.user_id,
        customerEmail: mappedRecord.customer_email,
      });
      const record = {
        ...mappedRecord,
        user_id: profileIdentifiers.userId,
        customer_email: profileIdentifiers.customerEmail,
      };

      if (record.customer_email) {
        await supabaseAdmin.from('subscriptions').upsert(record, {
          onConflict: 'stripe_subscription_id',
        });
      }

      await syncProfileSubscription(supabaseAdmin, record.user_id, record);
    }

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const customer = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
      let customerEmail = normalizeEmail(subscription.metadata?.customerEmail);

      if (!customerEmail && customer) {
        const customerResponse = await stripe.customers.retrieve(customer);
        if (!('deleted' in customerResponse) && customerResponse.email) {
          customerEmail = normalizeEmail(customerResponse.email);
        }
      }

      const mappedRecord = mapSubscriptionRecord(
        {
          ...subscription,
          customer_email: customerEmail,
        },
        subscription.status,
      );
      const profileIdentifiers = await resolveProfileIdentifiers(supabaseAdmin, {
        userId: mappedRecord.user_id,
        customerEmail: customerEmail,
      });
      const record = {
        ...mappedRecord,
        user_id: profileIdentifiers.userId,
        customer_email: profileIdentifiers.customerEmail,
      };

      if (record.customer_email) {
        await supabaseAdmin.from('subscriptions').upsert(record, {
          onConflict: 'stripe_subscription_id',
        });
      }

      await syncProfileSubscription(supabaseAdmin, record.user_id, record);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Webhook processing failed.',
    });
  }
}
