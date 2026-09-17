import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Suspense, useState } from 'react';
import clsx from 'clsx';
import {
  LayoutDashboard,
  ShoppingBag,
  Wallet,
  Users,
  Tag,
  FileText,
  Banknote,
  Plus,
  FolderKanban,
  UserCircle,
  Menu,
  X,
  LogOut,
  Upload,
  Gift,
  Tags,
  CreditCard,
} from 'lucide-react';

const navByRole = {
  admin: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
    { to: '/admin/listings', label: 'Listings', icon: FileText },
    { to: '/admin/finance', label: 'Finance', icon: Banknote },
    { to: '/admin/withdrawals', label: 'Withdrawals', icon: CreditCard },
    { to: '/admin/coupons', label: 'Coupons', icon: Tag },
    { to: '/admin/referrals', label: 'Referrals', icon: Gift },
    { to: '/admin/niches', label: 'Niches', icon: Tags },
  ],
  buyer: [
    { to: '/buyer', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/buyer/orders', label: 'My Orders', icon: ShoppingBag },
    { to: '/marketplace', label: 'Marketplace', icon: FileText },
    { to: '/buyer/wallet', label: 'Wallet', icon: Wallet },
    { to: '/buyer/projects', label: 'Projects', icon: FolderKanban },
    { to: '/buyer/profile', label: 'Profile', icon: UserCircle },
  ],
  seller: [
    { to: '/seller', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/seller/listings', label: 'My Listings', icon: FileText },
    { to: '/seller/listings/new', label: 'Add Listing', icon: Plus },
    { to: '/seller/listings/bulk', label: 'Bulk Upload', icon: Upload },
    { to: '/seller/wallet', label: 'Wallet', icon: Wallet },
    { to: '/seller/profile', label: 'Profile', icon: UserCircle },
  ],
};

export default function DashboardLayout({ role }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const items = navByRole[role] || [];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-100 transition-transform duration-200 lg:translate-x-0 lg:static',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
          <Link to="/" className="font-extrabold text-brand-700 text-lg">Link Bajar</Link>
          <button onClick={() => setOpen(false)} className="lg:hidden btn-ghost p-1" aria-label="Close sidebar">
            <X size={20} />
          </button>
        </div>

        <div className="px-3 py-4 flex flex-col h-[calc(100vh-4rem)]">
          <div className="px-2 mb-3 text-xs uppercase tracking-wider text-slate-400 font-semibold">
            {role}
          </div>
          <nav className="flex-1 space-y-1">
            {items.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition',
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                  )
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-slate-100 pt-3 mt-3">
            <div className="px-3 py-2">
              <div className="text-sm font-medium text-slate-900 truncate">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-xs text-slate-500 truncate">{user?.email}</div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-red-600"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-white border-b border-slate-100 h-16 flex items-center px-4 lg:px-6">
          <button
            onClick={() => setOpen(true)}
            className="lg:hidden btn-ghost p-2"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="ml-auto flex items-center gap-3 text-sm text-slate-600">
            <span className="hidden sm:inline">Welcome,</span>
            <span className="font-medium text-slate-900">{user?.firstName || 'there'}</span>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">
          <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center text-slate-400">Loading…</div>}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
