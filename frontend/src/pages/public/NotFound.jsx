import { Link } from 'react-router-dom';
import Seo from '@/components/Seo';

export default function NotFound() {
  return (
    <>
      <Seo title="Not found" noindex />
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-7xl font-extrabold text-brand-600">404</div>
        <p className="mt-3 text-slate-600">This page could not be found.</p>
        <Link to="/" className="btn-primary mt-6">Back home</Link>
      </div>
    </>
  );
}
