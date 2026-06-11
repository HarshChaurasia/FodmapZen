import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#FAFAF7]">
      {/* Nav */}
      <nav className="border-b border-[#E5E7EB] bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌿</span>
            <span className="font-bold text-[#1A1A1A] text-lg">FodmapZen</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#6B7280]">
            <Link href="#features" className="hover:text-[#2D7A4F]">Features</Link>
            <Link href="#pricing" className="hover:text-[#2D7A4F]">Pricing</Link>
            <Link href="/blog" className="hover:text-[#2D7A4F]">Blog</Link>
            <Link href="/for-dietitians" className="hover:text-[#2D7A4F]">For Dietitians</Link>
          </div>
          <Link
            href="#download"
            className="bg-[#2D7A4F] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#1B5C38] transition-colors"
          >
            Download App
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-24 flex flex-col lg:flex-row items-center gap-16">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 bg-[#E8F5EE] text-[#2D7A4F] text-sm font-semibold px-3 py-1.5 rounded-full mb-6">
            🌿 Dietitian-verified recipes
          </div>
          <h1 className="text-5xl lg:text-6xl font-bold text-[#1A1A1A] leading-tight mb-6">
            Eat well with IBS.{' '}
            <span className="text-[#2D7A4F]">Finally.</span>
          </h1>
          <p className="text-xl text-[#6B7280] mb-8 leading-relaxed max-w-lg">
            Low-FODMAP meal plans, recipes & IBS food guide — offline & always with you.
            200+ dietitian-verified recipes, auto shopping list, and a guided reintroduction tracker. No ads. No internet required.
          </p>

          <div className="flex flex-wrap gap-4 mb-10">
            <a
              href="#download"
              className="flex items-center gap-3 bg-[#1A1A1A] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#333] transition-colors"
            >
              <span className="text-xl">🍎</span>
              Download on App Store
            </a>
            <a
              href="#download"
              className="flex items-center gap-3 bg-[#1A1A1A] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#333] transition-colors"
            >
              <span className="text-xl">▶</span>
              Get on Google Play
            </a>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex">
              {['⭐', '⭐', '⭐', '⭐', '⭐'].map((s, i) => (
                <span key={i} className="text-base">{s}</span>
              ))}
            </div>
            <span className="text-sm text-[#6B7280]">
              <strong className="text-[#1A1A1A]">4.8/5</strong> — 2,400+ reviews
            </span>
          </div>
        </div>

        {/* App mockup placeholder */}
        <div className="flex-shrink-0 w-72 h-[580px] bg-[#2D7A4F] rounded-[48px] shadow-2xl flex items-center justify-center">
          <div className="text-center text-white">
            <div className="text-6xl mb-4">🌿</div>
            <div className="font-bold text-xl mb-2">FodmapZen</div>
            <div className="text-sm opacity-75">App mockup coming soon</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-white py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#1A1A1A] mb-4">
              Everything you need for FODMAP success
            </h2>
            <p className="text-xl text-[#6B7280] max-w-2xl mx-auto">
              The only app that takes you from &ldquo;what is FODMAP?&rdquo; to&ldquo;I know exactly what to eat this week.&rdquo;
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-[#FAFAF7]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#1A1A1A] mb-4">Simple, honest pricing</h2>
            <p className="text-xl text-[#6B7280]">Start free. Upgrade when you&apos;re ready.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <PricingCard
              tier="Free"
              price="$0"
              description="Get started with FODMAP basics"
              features={['500 foods database', '30 offline recipes', 'Basic phase tracking', 'Daily food log']}
              cta="Get Free"
              highlighted={false}
            />
            <PricingCard
              tier="Ad-Free"
              price="$2.99"
              priceNote="one-time"
              description="All free features, no interruptions"
              features={['Everything in Free', 'No ads, ever', '75 offline recipes', '30-day log history']}
              cta="Buy Once"
              highlighted={true}
            />
            <PricingCard
              tier="Premium"
              price="$7.99"
              priceNote="/month · save 38% annually"
              description="The complete FODMAP companion"
              features={[
                '200+ recipes (offline)',
                'Weekly meal planner',
                'Auto shopping list',
                'Reintroduction tracker',
                'Restaurant guide',
                'Cloud sync',
                '14-day free trial',
              ]}
              cta="Start Free Trial"
              highlighted={false}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1A1A1A] text-white py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌿</span>
            <span className="font-bold text-lg">FodmapZen</span>
          </div>
          <div className="flex gap-8 text-sm text-white/60">
            <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white">Terms of Service</Link>
            <Link href="/for-dietitians" className="hover:text-white">For Dietitians</Link>
            <Link href="/blog" className="hover:text-white">Blog</Link>
          </div>
          <p className="text-white/40 text-sm">© 2026 FodmapZen</p>
        </div>
      </footer>
    </main>
  );
}

const FEATURES = [
  {
    icon: '🍽️',
    title: '200+ Offline Recipes',
    description: 'Real, complete recipes stored on your device. No links out. Works without internet.',
  },
  {
    icon: '📅',
    title: 'Weekly Meal Planner',
    description: 'Auto-generate a full week of balanced, FODMAP-safe meals in one tap.',
  },
  {
    icon: '🛒',
    title: 'Auto Shopping List',
    description: 'Your weekly plan becomes a grouped shopping list. Check items off as you shop.',
  },
  {
    icon: '🔬',
    title: 'Reintroduction Tracker',
    description: 'Guided 3-day testing protocol. Log reactions, get verdicts, export a report for your dietitian.',
  },
  {
    icon: '🍽',
    title: 'Restaurant Guide',
    description: '15 cuisines. Safe dishes, ordering tips, and what to avoid at every type of restaurant.',
  },
  {
    icon: '🌿',
    title: 'Phase Tracking',
    description: 'Elimination, reintroduction, and maintenance — guided from day one to long-term management.',
  },
];

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-[#FAFAF7] rounded-2xl p-6 border border-[#E5E7EB]">
      <div className="bg-[#E8F5EE] w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4">
        {icon}
      </div>
      <h3 className="font-bold text-[#1A1A1A] text-lg mb-2">{title}</h3>
      <p className="text-[#6B7280] text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function PricingCard({
  tier, price, priceNote, description, features, cta, highlighted,
}: {
  tier: string;
  price: string;
  priceNote?: string;
  description: string;
  features: string[];
  cta: string;
  highlighted: boolean;
}) {
  return (
    <div className={`rounded-2xl p-6 border ${
      highlighted
        ? 'bg-[#2D7A4F] text-white border-[#2D7A4F]'
        : 'bg-white border-[#E5E7EB]'
    }`}>
      {highlighted && (
        <div className="text-xs font-bold bg-white/20 text-white px-2 py-1 rounded-full inline-block mb-3">
          MOST POPULAR
        </div>
      )}
      <div className={`text-sm font-semibold mb-1 ${highlighted ? 'text-white/70' : 'text-[#6B7280]'}`}>
        {tier}
      </div>
      <div className="flex items-end gap-1 mb-1">
        <span className={`text-4xl font-bold ${highlighted ? 'text-white' : 'text-[#1A1A1A]'}`}>
          {price}
        </span>
      </div>
      {priceNote && (
        <p className={`text-xs mb-3 ${highlighted ? 'text-white/60' : 'text-[#9CA3AF]'}`}>{priceNote}</p>
      )}
      <p className={`text-sm mb-5 ${highlighted ? 'text-white/80' : 'text-[#6B7280]'}`}>{description}</p>
      <ul className="space-y-2 mb-6">
        {features.map((f) => (
          <li key={f} className={`flex items-start gap-2 text-sm ${highlighted ? 'text-white' : 'text-[#1A1A1A]'}`}>
            <span className="text-base leading-5">✓</span>
            {f}
          </li>
        ))}
      </ul>
      <button className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ${
        highlighted
          ? 'bg-white text-[#2D7A4F] hover:bg-[#E8F5EE]'
          : 'bg-[#2D7A4F] text-white hover:bg-[#1B5C38]'
      }`}>
        {cta}
      </button>
    </div>
  );
}
