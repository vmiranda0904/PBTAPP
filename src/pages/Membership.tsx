import { CheckCircle, Crown, Zap, Shield } from 'lucide-react';
import PageHeader from '../components/PageHeader';

// ─── Plan data ────────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started with a small team.',
    icon: Zap,
    color: 'slate',
    buttonLabel: 'Current Plan',
    buttonDisabled: true,
    features: [
      'Up to 10 players',
      'Basic player stats',
      'Event calendar',
      'Team communication',
      'iOS & Android PWA',
    ],
    missing: [
      'Points & rankings system',
      'Heat map analytics',
      'Live stream viewer',
      'Priority support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$9.99',
    period: 'per month',
    description: 'Everything your team needs to compete at the next level.',
    icon: Crown,
    color: 'blue',
    buttonLabel: 'Upgrade to Pro',
    buttonDisabled: false,
    featured: true,
    features: [
      'Unlimited players',
      'Full stats & analytics',
      'Points & rankings system',
      'Heat map analytics',
      'Live stream viewer',
      'Event calendar',
      'Team communication',
      'iOS & Android PWA',
      'Priority email support',
    ],
    missing: [],
  },
  {
    id: 'team',
    name: 'Team',
    price: '$24.99',
    period: 'per month',
    description: 'For clubs and organizations managing multiple teams.',
    icon: Shield,
    color: 'amber',
    buttonLabel: 'Contact Us',
    buttonDisabled: false,
    features: [
      'Everything in Pro',
      'Multiple team management',
      'Custom branding & logo',
      'Dedicated account manager',
      'Bulk player import',
      'Advanced reporting',
      'API access',
      'Phone & email support',
    ],
    missing: [],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Membership() {
  function handleUpgrade(planId: string) {
    if (planId === 'pro') {
      window.location.href = 'mailto:primebeachtraining@gmail.com?subject=PBT%20Sports%20Pro%20Upgrade&body=Hi%2C%20I%27d%20like%20to%20upgrade%20to%20the%20Pro%20plan.';
    } else if (planId === 'team') {
      window.location.href = 'mailto:primebeachtraining@gmail.com?subject=PBT%20Sports%20Team%20Plan&body=Hi%2C%20I%27d%20like%20to%20learn%20more%20about%20the%20Team%20plan.';
    }
  }

  return (
    <div>
      <PageHeader
        title="Membership"
        subtitle="Choose the plan that's right for your team"
      />

      {/* Pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {PLANS.map(plan => {
          const Icon = plan.icon;
          const isFeatured = !!plan.featured;

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border p-6 ${
                isFeatured
                  ? 'bg-blue-600/10 border-blue-500 shadow-lg shadow-blue-500/10'
                  : 'bg-slate-900 border-slate-700'
              }`}
            >
              {isFeatured && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isFeatured
                      ? 'bg-blue-500/20 text-blue-400'
                      : plan.color === 'amber'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  <Icon size={20} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg leading-none">{plan.name}</h3>
                  <p className="text-slate-400 text-xs mt-0.5">{plan.description}</p>
                </div>
              </div>

              {/* Price */}
              <div className="mb-6">
                <span className="text-white text-4xl font-extrabold">{plan.price}</span>
                <span className="text-slate-400 text-sm ml-2">{plan.period}</span>
              </div>

              {/* CTA button */}
              <button
                disabled={plan.buttonDisabled}
                onClick={() => handleUpgrade(plan.id)}
                className={`w-full py-2.5 rounded-lg text-sm font-semibold mb-6 transition-colors ${
                  plan.buttonDisabled
                    ? 'bg-slate-700 text-slate-400 cursor-default'
                    : isFeatured
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : plan.color === 'amber'
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-white'
                }`}
              >
                {plan.buttonLabel}
              </button>

              {/* Feature list */}
              <ul className="space-y-2 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                    <CheckCircle size={15} className="text-green-400 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
                {plan.missing.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600 line-through">
                    <CheckCircle size={15} className="text-slate-700 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* FAQ / note */}
      <div className="mt-8 bg-slate-900 rounded-xl border border-slate-700 p-6">
        <h3 className="text-white font-semibold mb-3">Frequently Asked Questions</h3>
        <div className="space-y-4 text-sm text-slate-400">
          <div>
            <p className="text-slate-200 font-medium mb-1">How do I upgrade?</p>
            <p>Click the <strong className="text-white">Upgrade to Pro</strong> button and send us an email. We'll get you set up within 24 hours.</p>
          </div>
          <div>
            <p className="text-slate-200 font-medium mb-1">Can I cancel at any time?</p>
            <p>Yes — email <a href="mailto:primebeachtraining@gmail.com" className="text-blue-400 hover:text-blue-300">primebeachtraining@gmail.com</a> to cancel your subscription at any time. No long-term contracts.</p>
          </div>
          <div>
            <p className="text-slate-200 font-medium mb-1">What payment methods do you accept?</p>
            <p>We accept all major credit cards, debit cards, and PayPal. Contact us for invoicing options.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
