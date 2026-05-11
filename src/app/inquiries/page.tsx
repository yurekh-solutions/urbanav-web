'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { MessageSquare, Eye, CheckCircle, Clock, XCircle, Loader2, DollarSign } from 'lucide-react';
import { Card, Badge, Avatar } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { adminApi, type AdminInquiry, type InquiryListResponse } from '@/lib/api';

type StatusChip = 'all' | 'offered' | 'open' | 'responded' | 'accepted' | 'rejected';

const STATUS_TONE: Record<string, 'success' | 'warning' | 'info' | 'error' | 'muted'> = {
  offered: 'info',
  responded: 'info',
  open: 'warning',
  pending: 'warning',
  accepted: 'success',
  rejected: 'error',
  expired: 'error',
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  open:      <Clock size={11} />,
  pending:   <Clock size={11} />,
  offered:   <DollarSign size={11} />,
  responded: <MessageSquare size={11} />,
  accepted:  <CheckCircle size={11} />,
  rejected:  <XCircle size={11} />,
};

export default function InquiriesPage() {
  const [statusFilter, setStatusFilter] = useState<StatusChip>('all');
  const [data, setData] = useState<InquiryListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await adminApi.inquiries({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        pageSize: 50,
      });
      setData(res);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const inquiries = data?.data ?? [];

  return (
    <div className="p-6 space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Inquiries</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {data?.total ?? 0} total · Buyer → Supplier inquiry threads
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['all', 'offered', 'open', 'responded', 'accepted', 'rejected'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all capitalize ${
              statusFilter === s
                ? 'bg-primary text-primary-foreground border-primary shadow-[var(--shadow-neon)]'
                : 'bg-secondary text-secondary-foreground border-border hover:border-primary/40'
            }`}
          >
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full admin-table">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                <th className="text-left px-6 py-3 font-semibold">ID</th>
                <th className="text-left px-6 py-3 font-semibold">Buyer</th>
                <th className="text-left px-6 py-3 font-semibold hidden md:table-cell">Subject</th>
                <th className="text-left px-6 py-3 font-semibold hidden lg:table-cell">Supplier</th>
                <th className="text-left px-6 py-3 font-semibold">Status</th>
                <th className="text-left px-6 py-3 font-semibold hidden md:table-cell">Offer Price</th>
                <th className="text-left px-6 py-3 font-semibold hidden sm:table-cell">Msgs</th>
                <th className="text-left px-6 py-3 font-semibold hidden lg:table-cell">Date</th>
                <th className="text-right px-6 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    <Loader2 className="animate-spin inline mr-2" size={14} /> Loading inquiries…
                  </td>
                </tr>
              )}
              {!loading && err && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-sm text-red-500">{err}</td>
                </tr>
              )}
              {!loading && !err && inquiries.map((inq: AdminInquiry) => (
                <tr key={inq._id} className="transition-colors">
                  <td className="px-6 py-3.5 text-sm font-mono font-semibold text-primary">
                    {String(inq._id).slice(-6).toUpperCase()}
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2">
                      <Avatar name={inq.buyer?.name ?? 'Guest'} size={28} />
                      <span className="text-sm font-medium text-foreground">
                        {inq.buyer?.name ?? 'Guest'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-muted-foreground hidden md:table-cell truncate max-w-[200px]">
                    {inq.subject}
                  </td>
                  <td className="px-6 py-3.5 text-sm text-muted-foreground hidden lg:table-cell">
                    {inq.supplier?.name ?? '—'}
                  </td>
                  <td className="px-6 py-3.5">
                    <Badge tone={STATUS_TONE[inq.status] ?? 'muted'}>
                      <span className="flex items-center gap-1">
                        {STATUS_ICON[inq.status] ?? <MessageSquare size={11} />} {inq.status}
                      </span>
                    </Badge>
                  </td>
                  <td className="px-6 py-3.5 text-sm hidden md:table-cell">
                    {inq.offerPrice ? (
                      <span className="font-semibold text-primary">
                        ₹{inq.offerPrice.toLocaleString('en-IN')}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-sm text-muted-foreground hidden sm:table-cell">
                    {inq.messageCount}
                  </td>
                  <td className="px-6 py-3.5 text-sm text-muted-foreground hidden lg:table-cell">
                    {formatDate(inq.createdAt)}
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                        <Eye size={14} />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                        <MessageSquare size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && !err && inquiries.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    No inquiries yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-border/50 text-xs text-muted-foreground">
          Showing {inquiries.length} of {data?.total ?? 0}
        </div>
      </Card>
    </div>
  );
}
