import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import Seo from '@/components/Seo';
import { money, dateTime } from '@/lib/format';
import { Send, Download } from 'lucide-react';

const ADMIN_STATUSES = ['pending', 'approved', 'in_progress', 'delivered', 'rejected', 'cancelled'];

export default function OrderDetail() {
  const { id } = useParams();
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => (await api.get(`/orders/${id}`)).data.data,
  });

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [liveLink, setLiveLink] = useState('');
  const [status, setStatus] = useState('');
  const chatEnd = useRef(null);

  useEffect(() => {
    if (order) {
      setMessages(order.messages || []);
      setLiveLink(order.liveLink || '');
      setStatus(order.status);
    }
  }, [order]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !id) return;
    socket.emit('order:join', id);
    const onMsg = (m) => setMessages((prev) => [...prev, m]);
    socket.on('order:message', onMsg);
    return () => {
      socket.emit('order:leave', id);
      socket.off('order:message', onMsg);
    };
  }, [id]);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const send = async () => {
    if (!text.trim()) return;
    try {
      await api.post(`/orders/${id}/messages`, { message: text });
      setText('');
    } catch {
      toast.error('Failed to send');
    }
  };

  const adminUpdate = async () => {
    try {
      await api.patch(`/orders/${id}/status`, { status, liveLink: status === 'delivered' ? liveLink : undefined });
      toast.success('Updated');
      qc.invalidateQueries({ queryKey: ['order', id] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  if (isLoading || !order) return <div className="text-slate-400">Loading…</div>;

  const isAdmin = user?.role === 'admin';

  return (
    <>
      <Seo title={`Order ${order.orderNumber}`} noindex />
      <PageHeader
        title={`Order ${order.orderNumber}`}
        subtitle={<StatusBadge status={order.status} />}
        action={
          <a
            href={`${import.meta.env.VITE_API_URL || ''}/api/v1/orders/${id}/invoice`}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary text-sm"
          >
            <Download size={16} /> Invoice
          </a>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="card p-5 space-y-3 lg:col-span-2">
          <h2 className="font-semibold text-slate-900">Order information</h2>
          <Grid>
            <Info label="Site" value={order.orderedSite} />
            <Info label="Type" value={order.orderType?.replace('_', ' ')} />
            <Info label="Amount" value={money(order.amount)} />
            <Info label="Payment" value={`${order.paymentStatus} (${order.paymentMethod || '—'})`} />
            <Info label="Ordered" value={dateTime(order.createdAt)} />
            <Info label="Delivered" value={order.deliveredAt ? dateTime(order.deliveredAt) : '—'} />
            <Info label="Target site" value={order.targetSite || '—'} />
            <Info label="Anchor text" value={order.anchorText || '—'} />
            <Info label="Landing page" value={order.landingPage || '—'} />
            <Info label="Article doc" value={order.articleDocLink || '—'} />
            <Info label="Live link" value={order.liveLink || '—'} />
          </Grid>
          {order.contentRequirements && (
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400">Content requirements</div>
              <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{order.contentRequirements}</p>
            </div>
          )}

          {isAdmin && (
            <div className="border-t border-slate-100 pt-4 mt-4">
              <h3 className="font-semibold text-slate-900">Admin actions</h3>
              <div className="mt-3 flex flex-wrap items-end gap-3">
                <div>
                  <label className="label">Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="input">
                    {ADMIN_STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
                {status === 'delivered' && (
                  <div className="flex-1 min-w-[240px]">
                    <label className="label">Live link</label>
                    <input className="input" value={liveLink} onChange={(e) => setLiveLink(e.target.value)} />
                  </div>
                )}
                <button onClick={adminUpdate} className="btn-primary text-sm">Update</button>
              </div>
            </div>
          )}
        </section>

        <section className="card p-5 flex flex-col h-[600px]">
          <h2 className="font-semibold text-slate-900">Chat</h2>
          <div className="flex-1 overflow-y-auto space-y-3 mt-3 pr-1">
            {messages.length === 0 ? (
              <div className="text-sm text-slate-400 text-center py-10">No messages yet.</div>
            ) : (
              messages.map((m) => (
                <div key={m.id || `${m.senderId}-${m.createdAt}`} className={`flex ${m.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${m.senderId === user.id ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
                    <div className="text-[11px] opacity-75 mb-0.5">
                      {m.sender?.firstName || m.senderRole} · {dateTime(m.createdAt)}
                    </div>
                    {m.message}
                  </div>
                </div>
              ))
            )}
            <div ref={chatEnd} />
          </div>
          <div className="flex gap-2 mt-3">
            <input
              className="input"
              placeholder="Type a message"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
            />
            <button onClick={send} className="btn-primary"><Send size={16} /></button>
          </div>
        </section>
      </div>
    </>
  );
}

const Grid = ({ children }) => <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">{children}</div>;
const Info = ({ label, value }) => (
  <div>
    <div className="text-xs uppercase tracking-wider text-slate-400">{label}</div>
    <div className="text-slate-900 font-medium mt-0.5 break-all">{value}</div>
  </div>
);
