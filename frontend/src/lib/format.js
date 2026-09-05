export const money = (n, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(n || 0));

export const fmtNumber = (n) => {
  if (n == null) return '—';
  const v = Number(n);
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v;
};

export const date = (d) => (d ? new Date(d).toLocaleDateString() : '—');
export const dateTime = (d) => (d ? new Date(d).toLocaleString() : '—');
