import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import PublicLayout from '@/layouts/PublicLayout';
import DashboardLayout from '@/layouts/DashboardLayout';
import { RequireAuth, RequireRole } from '@/components/RequireAuth';

const Home = lazy(() => import('@/pages/public/Home'));
const Marketplace = lazy(() => import('@/pages/public/Marketplace'));
const Services = lazy(() => import('@/pages/public/Services'));
const Login = lazy(() => import('@/pages/auth/Login'));
const Register = lazy(() => import('@/pages/auth/Register'));
const NotFound = lazy(() => import('@/pages/public/NotFound'));
const ProjectInvite = lazy(() => import('@/pages/shared/ProjectInvite'));

const Checkout = lazy(() => import('@/pages/buyer/Checkout'));
const BuyerDashboard = lazy(() => import('@/pages/buyer/Dashboard'));
const BuyerOrders = lazy(() => import('@/pages/buyer/Orders'));
const BuyerWallet = lazy(() => import('@/pages/buyer/Wallet'));
const BuyerProjects = lazy(() => import('@/pages/buyer/Projects'));
const ProjectDetail = lazy(() => import('@/pages/buyer/ProjectDetail'));
const OrderDetail = lazy(() => import('@/pages/shared/OrderDetail'));
const Profile = lazy(() => import('@/pages/shared/Profile'));

const SellerDashboard = lazy(() => import('@/pages/seller/Dashboard'));
const SellerListings = lazy(() => import('@/pages/seller/Listings'));
const SellerCreateListing = lazy(() => import('@/pages/seller/CreateListing'));
const SellerBulkUpload = lazy(() => import('@/pages/seller/BulkUpload'));
const SellerWallet = lazy(() => import('@/pages/seller/Wallet'));

const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard'));
const AdminUsers = lazy(() => import('@/pages/admin/Users'));
const AdminOrders = lazy(() => import('@/pages/admin/Orders'));
const AdminListings = lazy(() => import('@/pages/admin/Listings'));
const AdminFinance = lazy(() => import('@/pages/admin/Finance'));
const AdminCoupons = lazy(() => import('@/pages/admin/Coupons'));
const AdminWithdrawals = lazy(() => import('@/pages/admin/Withdrawals'));
const AdminReferrals = lazy(() => import('@/pages/admin/Referrals'));
const AdminNiches = lazy(() => import('@/pages/admin/Niches'));

function Loading() {
  return <div className="min-h-[60vh] flex items-center justify-center text-slate-400">Loading…</div>;
}

const buyerRoles = ['buyer', 'agency', 'partnership', 'admin'];

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Public */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/services/:slug" element={<Services />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/projects/invite/:token" element={<RequireAuth><ProjectInvite /></RequireAuth>} />
        </Route>

        {/* Checkout uses public layout but requires auth */}
        <Route element={<PublicLayout />}>
          <Route
            path="/checkout"
            element={
              <RequireAuth>
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  <Checkout />
                </div>
              </RequireAuth>
            }
          />
        </Route>

        {/* Buyer */}
        <Route
          element={
            <RequireAuth>
              <RequireRole roles={buyerRoles}>
                <DashboardLayout role="buyer" />
              </RequireRole>
            </RequireAuth>
          }
        >
          <Route path="/buyer" element={<BuyerDashboard />} />
          <Route path="/buyer/orders" element={<BuyerOrders />} />
          <Route path="/buyer/orders/:id" element={<OrderDetail />} />
          <Route path="/buyer/wallet" element={<BuyerWallet />} />
          <Route path="/buyer/projects" element={<BuyerProjects />} />
          <Route path="/buyer/projects/:id" element={<ProjectDetail />} />
          <Route path="/buyer/profile" element={<Profile />} />
        </Route>

        {/* Seller */}
        <Route
          element={
            <RequireAuth>
              <RequireRole roles={['seller', 'admin']}>
                <DashboardLayout role="seller" />
              </RequireRole>
            </RequireAuth>
          }
        >
          <Route path="/seller" element={<SellerDashboard />} />
          <Route path="/seller/listings" element={<SellerListings />} />
          <Route path="/seller/listings/new" element={<SellerCreateListing />} />
          <Route path="/seller/listings/bulk" element={<SellerBulkUpload />} />
          <Route path="/seller/wallet" element={<SellerWallet />} />
          <Route path="/seller/profile" element={<Profile />} />
        </Route>

        {/* Admin */}
        <Route
          element={
            <RequireAuth>
              <RequireRole roles={['admin']}>
                <DashboardLayout role="admin" />
              </RequireRole>
            </RequireAuth>
          }
        >
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/orders/:id" element={<OrderDetail />} />
          <Route path="/admin/listings" element={<AdminListings />} />
          <Route path="/admin/finance" element={<AdminFinance />} />
          <Route path="/admin/coupons" element={<AdminCoupons />} />
          <Route path="/admin/withdrawals" element={<AdminWithdrawals />} />
          <Route path="/admin/referrals" element={<AdminReferrals />} />
          <Route path="/admin/niches" element={<AdminNiches />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
