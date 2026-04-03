const productLines = [
  {
    name: 'Athlete App',
    goal: 'Exposure, development, and highlights',
    phase: 'Phase 1',
    action: 'Generate Highlight',
    pricing: 'Free / Pro $9–$19',
    items: ['Latest Highlights', 'Performance Score', 'Recent Stats', 'Shareable recruiting profile'],
  },
  {
    name: 'Team / Coach Platform',
    goal: 'Win games and automate scouting',
    phase: 'Phase 2',
    action: 'View Game Plan',
    pricing: 'Starter $49–$99 • Pro $149–$299 • Elite $499+',
    items: ['Team Analytics', 'Opponent Scouting', 'Game Plan', 'Live Mode + voice alerts'],
  },
  {
    name: 'Recruiter Network',
    goal: 'Find and compare talent fast',
    phase: 'Phase 3',
    action: 'Find Players',
    pricing: 'Free / Premium $99–$299',
    items: ['Athlete search filters', 'Top ranked players', 'Saved prospects', 'Side-by-side comparisons'],
  },
];

export default function ProductPlatformPanel() {
  return (
    <section className="rounded-3xl border border-fuchsia-400/20 bg-slate-950/80 p-5 shadow-2xl shadow-slate-950/30 backdrop-blur">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.35em] text-fuchsia-200">Platform architecture</p>
          <h2 className="text-2xl font-semibold text-white">Three connected products, one intelligence loop</h2>
          <p className="max-w-3xl text-sm text-slate-300">
            Athletes generate data, coaches convert it into winning decisions, and recruiters use it to discover talent.
            The UI now frames the product as a connected platform instead of a single feature bundle.
          </p>
        </div>
        <div className="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/10 px-4 py-3 text-sm text-fuchsia-100">
          Positioning: AI-powered athlete intelligence + recruiting platform.
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        {productLines.map((line) => (
          <article key={line.name} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-slate-400">{line.phase}</p>
                <h3 className="text-xl font-semibold text-white">{line.name}</h3>
              </div>
              <span className="rounded-full bg-fuchsia-400/15 px-3 py-1 text-xs font-medium text-fuchsia-100">
                {line.action}
              </span>
            </div>

            <p className="mt-3 text-sm text-slate-300">{line.goal}</p>
            <p className="mt-2 text-sm font-medium text-white">{line.pricing}</p>

            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-300">
              {line.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
