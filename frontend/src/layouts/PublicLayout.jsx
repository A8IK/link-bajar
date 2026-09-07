import { Outlet, Link, NavLink } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { Menu, X, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

const nav = [
  { to: '/marketplace', label: 'Marketplace' },
  { to: '/services/guest-post', label: 'Guest Post' },
  { to: '/services/link-insertion', label: 'Link Insertion' },
  { to: '/services/haro', label: 'HARO' },
  { to: '/services/pr', label: 'PR' },
];

export default function PublicLayout() {
  const { user } = useAuthStore();
  const cartCount = useCartStore((s) => s.items.length);
  const [open, setOpen] = useState(false);

  const dashHref =
    user?.role === 'admin' ? '/admin' : user?.role === 'seller' ? '/seller' : '/buyer';

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-100">
        <div className="container-x flex items-center h-16">
          <Link to="/" className="font-extrabold text-xl text-brand-700">Link Bajar</Link>

          <nav className="hidden md:flex items-center gap-1 ml-10">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  clsx(
                    'px-3 py-2 rounded-md text-sm font-medium transition',
                    isActive ? 'text-brand-700 bg-brand-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50',
                  )
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link to="/checkout" className="relative btn-ghost p-2" aria-label="Cart">
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            {user ? (
              <Link to={dashHref} className="btn-primary text-sm">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="btn-ghost text-sm hidden sm:inline-flex">Sign in</Link>
                <Link to="/register" className="btn-primary text-sm">Get started</Link>
              </>
            )}
            <button
              type="button"
              className="md:hidden btn-ghost p-2"
              onClick={() => setOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden border-t border-slate-100 bg-white">
            <div className="container-x py-3 flex flex-col gap-1">
              {nav.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      'px-3 py-2 rounded-md text-sm font-medium',
                      isActive ? 'text-brand-700 bg-brand-50' : 'text-slate-700 hover:bg-slate-50',
                    )
                  }
                >
                  {n.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-slate-100 bg-white">
        <div className="container-x py-10 grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">
          <div>
            <div className="font-extrabold text-brand-700 text-lg">Link Bajar</div>
            <p className="text-slate-500 mt-2">SEO marketplace built for agencies, in-house teams and publishers.</p>
          </div>
          <FooterCol title="Services" items={['Guest Post', 'Link Insertion', 'HARO', 'PR', 'SEO Packages']} />
          <FooterCol title="Company" items={['About', 'Contact', 'Blog']} />
          <FooterCol title="Legal" items={['Terms', 'Privacy', 'Refunds']} />
        </div>
        <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Link Bajar. All rights reserved.
        </div>
      </footer>

      <style>{`.container-x { max-width: 1200px; margin-left: auto; margin-right: auto; padding-left: 1rem; padding-right: 1rem; } @media (min-width: 768px) { .container-x { padding-left: 1.5rem; padding-right: 1.5rem; } }`}</style>
    </div>
  );
}

function FooterCol({ title, items }) {
  return (
    <div>
      <div className="font-semibold text-slate-900">{title}</div>
      <ul className="mt-2 space-y-1 text-slate-500">
        {items.map((i) => <li key={i}>{i}</li>)}
      </ul>
    </div>
  );
}
