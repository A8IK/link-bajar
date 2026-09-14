import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import Seo from '@/components/Seo';
import { Upload } from 'lucide-react';

export default function BulkUpload() {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const submit = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post('/listings/bulk', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data.data);
      toast.success(`Imported ${data.data.createdCount}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Seo title="Bulk upload" noindex />
      <PageHeader title="Bulk listing upload" subtitle="Upload up to 500 sites at once via .xlsx" />

      <div className="card p-8">
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-10 text-center">
          <Upload size={32} className="text-slate-400 mx-auto" />
          <p className="text-slate-600 mt-3">{file ? file.name : 'Drop your .xlsx file here'}</p>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <button className="btn-secondary text-sm mt-4" onClick={() => inputRef.current?.click()}>Choose file</button>
        </div>

        <div className="mt-4 text-xs text-slate-500">
          Required columns: <code>siteUrl, placementType, guestPostPrice OR linkInsertPrice</code>.
          Optional: <code>mozDa, ahrefDr, monthlyTraffic, language, tatDays, backlinkType, trafficCountry, spamScore</code>.
        </div>

        <button onClick={submit} disabled={!file || loading} className="btn-primary mt-6">
          {loading ? 'Uploading…' : 'Import'}
        </button>
      </div>

      {result && (
        <section className="card p-5 mt-6">
          <h3 className="font-semibold text-slate-900">Result</h3>
          <p className="text-sm text-slate-600 mt-1">Imported: <strong>{result.createdCount}</strong>. Skipped: <strong>{result.skippedCount}</strong>.</p>
          {result.skipped?.length > 0 && (
            <details className="mt-3 text-xs">
              <summary className="cursor-pointer text-slate-500">Skipped rows</summary>
              <pre className="bg-slate-50 p-3 rounded mt-2 overflow-auto max-h-64">{JSON.stringify(result.skipped, null, 2)}</pre>
            </details>
          )}
        </section>
      )}
    </>
  );
}
