import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Globe, Zap } from 'lucide-react';
import Seo from '@/components/Seo';

export default function Home() {
  return (
    <>
      <Seo
        title="Buy & Sell Guest Posts and Backlinks"
        description="Link Bajar is the marketplace for guest posts, link insertions, HARO and PR. Vetted publishers worldwide."
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Link Bajar',
          url: 'https://linkbajar.com',
        }}
      />

      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-3xl">
            <span className="badge bg-brand-100 text-brand-700">Trusted by 10,000+ marketers</span>
            <h1 className="mt-4 text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900">
              The marketplace for SEO links and guest posts.
            </h1>
            <p className="mt-6 text-lg md:text-xl text-slate-600 leading-relaxed">
              Buy from vetted publishers, sell your inventory, manage every order in one place.
              Built for agencies, in-house SEOs and freelancers.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/marketplace" className="btn-primary text-base px-5 py-3">
                Browse Marketplace <ArrowRight size={18} />
              </Link>
              <Link to="/register" className="btn-secondary text-base px-5 py-3">
                Become a Seller
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Feature
            icon={ShieldCheck}
            title="Verified publishers"
            text="Every site is manually reviewed. No PBNs, no spam, no surprises."
          />
          <Feature
            icon={Globe}
            title="Global reach"
            text="Multi-language inventory across 80+ countries — find the right traffic country."
          />
          <Feature
            icon={Zap}
            title="Fast turnaround"
            text="See TAT before you buy. Most orders delivered within 5–10 days."
          />
        </div>
      </section>
    </>
  );
}

function Feature({ icon: Icon, title, text }) {
  return (
    <div className="card p-6">
      <div className="w-11 h-11 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
        <Icon size={22} />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-slate-600 text-sm leading-relaxed">{text}</p>
    </div>
  );
}
