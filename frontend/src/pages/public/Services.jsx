import { useParams, Navigate } from 'react-router-dom';
import Seo from '@/components/Seo';

const SERVICES = {
  'guest-post': { title: 'Guest Post', redirect: '/marketplace?type=guest_post' },
  'link-insertion': { title: 'Link Insertion', redirect: '/marketplace?type=link_insert' },
  'haro': { title: 'HARO Outreach', content: 'High-authority placements via journalist requests.' },
  '301': { title: '301 Redirections', content: 'Acquire expired-domain redirects.' },
  'pr': { title: 'Press Releases', content: 'Distribute to top-tier news outlets.' },
  'seo-packages': { title: 'SEO Packages', content: 'Done-for-you monthly link building.' },
  'web-development': { title: 'Web Development', content: 'Sites optimized for SEO from day one.' },
};

export default function Services() {
  const { slug } = useParams();
  const svc = SERVICES[slug];
  if (!svc) return <Navigate to="/" replace />;
  if (svc.redirect) return <Navigate to={svc.redirect} replace />;

  return (
    <>
      <Seo title={svc.title} path={`/services/${slug}`} description={svc.content} />
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-extrabold text-slate-900">{svc.title}</h1>
        <p className="mt-4 text-lg text-slate-600">{svc.content}</p>
        <div className="mt-10 card p-8 text-center">
          <div className="text-slate-500">Pricing & packages coming soon.</div>
        </div>
      </div>
    </>
  );
}
