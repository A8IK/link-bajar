import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import Seo from '@/components/Seo';

const STEPS = ['Basic info', 'Pricing & services'];

export default function CreateListing() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    siteUrl: '',
    siteEmail: '',
    mozDa: '',
    ahrefDr: '',
    monthlyTraffic: '',
    tatDays: '',
    backlinkType: 'do_follow',
    language: 'en',
    placementType: 'guest_post',
    guestPostPrice: '',
    linkInsertPrice: '',
    sampleUrl: '',
    premiumEnabled: false,
    premiumNiches: [],
    premiumExtraPrice: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const update = (k) => (e) =>
    setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/listings', form);
      toast.success('Listing submitted for review.');
      navigate('/seller/listings');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Seo title="Add listing" noindex />
      <PageHeader title="Add a new listing" subtitle="Tell us about your site." />

      <div className="flex gap-3 mb-6">
        {STEPS.map((s, i) => (
          <div key={s} className={`flex-1 h-2 rounded-full ${i <= step ? 'bg-brand-600' : 'bg-slate-200'}`} />
        ))}
      </div>

      <form onSubmit={submit} className="card p-6 space-y-5">
        {step === 0 && (
          <>
            <Two>
              <Input label="Site URL *" value={form.siteUrl} onChange={update('siteUrl')} placeholder="https://example.com" required />
              <Input label="Site email" value={form.siteEmail} onChange={update('siteEmail')} placeholder="contact@example.com" />
            </Two>
            <Two>
              <Input label="Domain Authority" type="number" value={form.mozDa} onChange={update('mozDa')} />
              <Input label="Domain Rating" type="number" value={form.ahrefDr} onChange={update('ahrefDr')} />
            </Two>
            <Two>
              <Input label="Monthly traffic" type="number" value={form.monthlyTraffic} onChange={update('monthlyTraffic')} />
              <Input label="TAT (days)" type="number" value={form.tatDays} onChange={update('tatDays')} />
            </Two>
            <Two>
              <Select label="Backlink type" value={form.backlinkType} onChange={update('backlinkType')}
                options={[['do_follow', 'Do Follow'], ['no_follow', 'No Follow'], ['both', 'Both']]} />
              <Input label="Language" value={form.language} onChange={update('language')} />
            </Two>
          </>
        )}

        {step === 1 && (
          <>
            <Select label="Placement type" value={form.placementType} onChange={update('placementType')}
              options={[['guest_post', 'Guest post'], ['link_insert', 'Link insertion'], ['both', 'Both']]} />
            {(form.placementType === 'guest_post' || form.placementType === 'both') && (
              <Input label="Guest post price (USD) *" type="number" value={form.guestPostPrice} onChange={update('guestPostPrice')} required />
            )}
            {(form.placementType === 'link_insert' || form.placementType === 'both') && (
              <Input label="Link insertion price (USD) *" type="number" value={form.linkInsertPrice} onChange={update('linkInsertPrice')} required />
            )}
            <Input label="Sample URL (optional)" value={form.sampleUrl} onChange={update('sampleUrl')} />

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.premiumEnabled} onChange={update('premiumEnabled')} />
              Accept premium / sensitive niches
            </label>

            {form.premiumEnabled && (
              <>
                <div className="flex flex-wrap gap-2">
                  {['cbd', 'drug', 'casino', 'crypto', 'supplement', 'adult'].map((n) => (
                    <label key={n} className="badge bg-slate-100 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.premiumNiches.includes(n)}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...form.premiumNiches, n]
                            : form.premiumNiches.filter((x) => x !== n);
                          setForm({ ...form, premiumNiches: next });
                        }}
                      />
                      {n.toUpperCase()}
                    </label>
                  ))}
                </div>
                <Input label="Additional price for premium niches" type="number" value={form.premiumExtraPrice} onChange={update('premiumExtraPrice')} />
              </>
            )}
          </>
        )}

        <div className="flex justify-between pt-4">
          {step > 0 ? (
            <button type="button" onClick={() => setStep(step - 1)} className="btn-secondary text-sm">Back</button>
          ) : <span />}
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={() => setStep(step + 1)} className="btn-primary text-sm">Next</button>
          ) : (
            <button type="submit" disabled={loading} className="btn-primary text-sm">
              {loading ? 'Submitting…' : 'Submit for review'}
            </button>
          )}
        </div>
      </form>
    </>
  );
}

const Two = ({ children }) => <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;

const Input = ({ label, ...props }) => (
  <div>
    <label className="label">{label}</label>
    <input className="input" {...props} />
  </div>
);

const Select = ({ label, options, ...props }) => (
  <div>
    <label className="label">{label}</label>
    <select className="input" {...props}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  </div>
);
