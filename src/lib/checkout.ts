const checkoutEndpoint = import.meta.env.VITE_CHECKOUT_API_URL || '/api/checkout';

type CheckoutRequest = {
  priceId?: string;
  customerEmail?: string;
  planKey?: string;
};

export async function subscribeToCheckout({ priceId, customerEmail, planKey }: CheckoutRequest) {
  if (!priceId) {
    throw new Error('Missing Stripe price ID for this subscription tier.');
  }

  const response = await fetch(checkoutEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ priceId, customerEmail, planKey }),
  });

  if (!response.ok) {
    throw new Error('Checkout session creation failed.');
  }

  const payload = (await response.json()) as { url?: string };

  if (!payload.url) {
    throw new Error('Checkout URL missing from server response.');
  }

  window.location.assign(payload.url);
}
