import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Seo from '@/components/Seo';
import { Heart, ShoppingCart, Search } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { fmtNumber, money } from '@/lib/format';

export default function Marketplace() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', placementType: '', language: '', minDa: '', maxPrice: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['listings', page, filters],
    queryFn: async () =>
      (await api.get('/listings', { params: { page, limit: 20, ...stripEmpty(filters) } })).data.data,
  });

  return (
    <>
      <Seo title="Marketplace" path="/marketplace" description="Browse vetted publishers offering guest posts and link insertions." />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Marketplace</h1>
            <p className="text-slate-500 mt-1">{data?.total ?? 0} approved listings.</p>
          </div>
          <Link to="/checkout" className="btn-secondary text-sm">Open cart</Link>
        </header>

        <Filters value={filters} onChange={(v) => { setFilters(v); setPage(1); }} />

        {isLoading ? (
          <div className="text-slate-400 mt-8">Loading…</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
              {data?.items?.map((l) => <ListingCard key={l.id} listing={l} />)}
            </div>
            {data && data.total > data.limit && (
              <Pagination page={page} setPage={setPage} total={data.total} limit={data.limit} />
            )}
          </>
        )}
      </div>
    </>
  );
}

function Filters({ value, onChange }) {
  return (
    <div className="card p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
      <div className="relative md:col-span-2">
        <Search size={16} className="absolute left-3 top-3 text-slate-400" />
        <input
          className="input pl-9"
          placeholder="Search by URL"
          value={value.search}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
        />
      </div>
      <select className="input" value={value.placementType} onChange={(e) => onChange({ ...value, placementType: e.target.value })}>
        <option value="">All types</option>
        <option value="guest_post">Guest post</option>
        <option value="link_insert">Link insertion</option>
        <option value="both">Both</option>
      </select>
      <input className="input" placeholder="Min DA" type="number" value={value.minDa} onChange={(e) => onChange({ ...value, minDa: e.target.value })} />
      <input className="input" placeholder="Max price" type="number" value={value.maxPrice} onChange={(e) => onChange({ ...value, maxPrice: e.target.value })} />
    </div>
  );
}

function ListingCard({ listing }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const add = useCartStore((s) => s.add);
  const [sensitive, setSensitive] = useState(false);

  const base = listing.placementType === 'link_insert'
    ? Number(listing.linkInsertPrice || 0)
    : Number(listing.guestPostPrice || 0);
  const price = base + (sensitive && listing.premiumEnabled ? Number(listing.premiumExtraPrice || 0) : 0);

  const orderType = listing.placementType === 'link_insert' ? 'link_insert' : 'guest_post';

  const handleAdd = (buyNow = false) => {
    if (!user) {
      toast.error('Please sign in to buy');
      return navigate('/login');
    }
    add({
      listingId: listing.id,
      siteUrl: listing.siteUrl,
      orderType,
      amount: price,
      sensitiveNiche: sensitive,
    });
    toast.success('Added to cart');
    if (buyNow) navigate('/checkout');
  };

  const toggleWishlist = async () => {
    if (!user) return navigate('/login');
    try {
      await api.post(`/listings/${listing.id}/wishlist`);
      toast.success('Saved to wishlist');
    } catch {
      toast.error('Could not save');
    }
  };

  return (
    <div className="card p-5 flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-semibold text-slate-900 truncate">{listing.siteUrl}</div>
          <div className="text-xs text-slate-500 mt-0.5 uppercase">
            {listing.language || 'EN'} · TAT {listing.tatDays || '—'}d · {listing.placementType?.replace('_', ' ')}
          </div>
        </div>
        <button className="text-slate-400 hover:text-red-500" aria-label="Wishlist" onClick={toggleWishlist}>
          <Heart size={18} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4 text-center text-xs">
        <Stat label="DA" value={listing.mozDa} />
        <Stat label="DR" value={listing.ahrefDr} />
        <Stat label="Traffic" value={fmtNumber(listing.monthlyTraffic)} />
      </div>

      {listing.premiumEnabled && (
        <label className="mt-4 flex items-center gap-2 text-xs text-slate-600">
          <input type="checkbox" checked={sensitive} onChange={(e) => setSensitive(e.target.checked)} />
          Sensitive niche (+{money(listing.premiumExtraPrice || 0)})
        </label>
      )}

      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="text-xl font-bold text-slate-900">{money(price)}</div>
        <div className="flex gap-2">
          <button className="btn-secondary text-sm py-2" onClick={() => handleAdd(false)}>
            <ShoppingCart size={16} />
          </button>
          <button className="btn-primary text-sm py-2" onClick={() => handleAdd(true)}>Buy now</button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-md py-2">
      <div className="text-slate-400 text-[10px] uppercase">{label}</div>
      <div className="font-semibold text-slate-900">{value ?? '—'}</div>
    </div>
  );
}

function Pagination({ page, setPage, total, limit }) {
  const pages = Math.ceil(total / limit);
  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn-secondary text-sm disabled:opacity-50">Prev</button>
      <span className="text-sm text-slate-500">Page {page} of {pages}</span>
      <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="btn-secondary text-sm disabled:opacity-50">Next</button>
    </div>
  );
}

const stripEmpty = (o) => Object.fromEntries(Object.entries(o).filter(([_, v]) => v !== '' && v != null));
