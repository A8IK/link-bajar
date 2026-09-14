import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import Seo from '@/components/Seo';
import PageHeader from '@/components/PageHeader';
import { money } from '@/lib/format';
import { Trash2 } from 'lucide-react';

export default function Checkout() {
  const items = useCartStore((s) => s.items);
  const update = useCartStore((s) => s.update);
  const remove = useCartStore((s) => s.remove);
  const clear = useCartStore((s) => s.clear);
  const subtotal = useCartStore((s) => s.subtotal());

  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const applyCoupon = async () => {
    if (!couponCode) return;
    try {
      const { data } = await api.post('/coupons/validate', { code: couponCode, orderAmount: subtotal });
      setDiscount(data.data.discount);
      toast.success(`Coupon applied: -${money(data.data.discount)}`);
    } catch (err) {
      setDiscount(0);
      toast.error(err.response?.data?.message || 'Invalid coupon');
    }
  };

  const checkout = async () => {
    if (!items.length) return;
    setLoading(true);
    try {
      const { data } = await api.post('/orders/checkout', {
        items,
        paymentMethod,
        couponCode: discount > 0 ? couponCode : undefined,
      });
      toast.success(`Created ${data.data.length} order(s)`);
      clear();
      navigate('/buyer/orders');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  const total = Math.max(0, subtotal - discount);

  return (
    <>
      <Seo title="Checkout" noindex />
      <PageHeader title="Checkout" subtitle={`${items.length} item(s) in your cart.`} />

      {items.length === 0 ? (
        <div className="card p-10 text-center text-slate-400">Your cart is empty.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {items.map((it) => (
              <CartLine key={it.listingId} item={it} onChange={(p) => update(it.listingId, p)} onRemove={() => remove(it.listingId)} />
            ))}
          </div>

          <aside className="card p-5 h-fit space-y-4">
            <h2 className="font-semibold text-slate-900">Summary</h2>
            <Row label="Subtotal" value={money(subtotal)} />
            {discount > 0 && <Row label="Discount" value={`-${money(discount)}`} positive />}
            <hr />
            <Row label="Total" value={money(total)} bold />

            <div>
              <label className="label">Coupon</label>
              <div className="flex gap-2">
                <input className="input" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="Enter code" />
                <button onClick={applyCoupon} className="btn-secondary text-sm">Apply</button>
              </div>
            </div>

            <div>
              <label className="label">Payment method</label>
              <select className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="wallet">Wallet</option>
                <option value="sslcommerz">SSL Commerz</option>
                <option value="payoneer">Payoneer</option>
              </select>
            </div>

            <button onClick={checkout} disabled={loading} className="btn-primary w-full">
              {loading ? 'Processing…' : `Pay ${money(total)}`}
            </button>
          </aside>
        </div>
      )}
    </>
  );
}

function CartLine({ item, onChange, onRemove }) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-slate-900">{item.siteUrl}</div>
          <div className="text-xs text-slate-500 mt-0.5 uppercase">{item.orderType?.replace('_', ' ')}</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="font-bold text-slate-900">{money(item.amount)}</div>
          <button onClick={onRemove} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
        <Field label="Target URL" value={item.targetSite} onChange={(v) => onChange({ targetSite: v })} />
        <Field label="Anchor text" value={item.anchorText} onChange={(v) => onChange({ anchorText: v })} />
        <Field label="Landing page" value={item.landingPage} onChange={(v) => onChange({ landingPage: v })} />
        <Field label="Article doc link" value={item.articleDocLink} onChange={(v) => onChange({ articleDocLink: v })} />
        <div className="md:col-span-2">
          <label className="label">Content requirements</label>
          <textarea className="input" rows={2} value={item.contentRequirements || ''} onChange={(e) => onChange({ contentRequirements: e.target.value })} />
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" value={value || ''} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Row({ label, value, bold, positive }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={bold ? 'font-semibold text-slate-900' : 'text-slate-500'}>{label}</span>
      <span className={`${bold ? 'text-lg font-bold text-slate-900' : ''} ${positive ? 'text-emerald-600' : ''}`}>{value}</span>
    </div>
  );
}
