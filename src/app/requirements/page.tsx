'use client';
import React, { useEffect, useState, useCallback } from 'react';
import {
  ClipboardList,
  Eye,
  MapPin,
  Calendar,
  Clock,
  Wallet,
  Loader2,
  Search,
  X,
  Tag,
} from 'lucide-react';
import { Card, Badge, Avatar } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import {
  adminApi,
  type AdminRequirement,
  type RequirementListResponse,
  type RequirementOffer,
} from '@/lib/api';

type StatusChip = 'all' | 'open' | 'offered' | 'matched' | 'booked' | 'cancelled';

const STATUS_TONE: Record<string, 'success' | 'warning' | 'info' | 'error' | 'muted'> = {
  open: 'warning',
  offered: 'info',
  matched: 'info',
  booked: 'success',
  cancelled: 'error',
};

export default function RequirementsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusChip>('all');
  const [searchText, setSearchText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [data, setData] = useState<RequirementListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminRequirement | null>(null);
  const [offers, setOffers] = useState<RequirementOffer[]>([]);
  const [offersLoading, setOffersLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await adminApi.requirements({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined,
        pageSize: 100,
      });
      setData(res);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load requirements');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm]);

  useEffect(() => { load(); }, [load]);

  // Debounce search text → searchTerm
  useEffect(() => {
    const t = setTimeout(() => setSearchTerm(searchText.trim()), 300);
    return () => clearTimeout(t);
  }, [searchText]);

  const requirements = data?.data ?? [];

  const openDetail = useCallback(async (r: AdminRequirement) => {
    setSelected(r);
    if ((r.offersCount ?? 0) > 0) {
      setOffersLoading(true);
      try {
        const res = await adminApi.requirementOffers(r._id);
        setOffers(res.offers ?? []);
      } catch {
        setOffers([]);
      } finally {
        setOffersLoading(false);
      }
    } else {
      setOffers([]);
    }
  }, []);

  return (
    <div className="p-6 space-y-6 animate-fade-in-up">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList size={22} className="text-primary" /> Requirements
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data?.total ?? 0} total · Buyer posts awaiting matches
          </p>
        </div>

        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search buyer, city, event, items…"
            className="pl-9 pr-8 py-2 text-sm rounded-lg bg-secondary border border-border
                       focus:border-primary focus:outline-none transition-colors w-72"
          />
          {searchText && (
            <button
              onClick={() => setSearchText('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['all', 'open', 'offered', 'matched', 'booked', 'cancelled'] as const).map((s) => (
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
                <th className="text-left px-6 py-3 font-semibold hidden md:table-cell">Event</th>
                <th className="text-left px-6 py-3 font-semibold hidden lg:table-cell">City</th>
                <th className="text-left px-6 py-3 font-semibold hidden xl:table-cell">Date</th>
                <th className="text-left px-6 py-3 font-semibold hidden lg:table-cell">Budget</th>
                <th className="text-left px-6 py-3 font-semibold">Status</th>
                <th className="text-left px-6 py-3 font-semibold hidden sm:table-cell">Offers</th>
                <th className="text-left px-6 py-3 font-semibold hidden sm:table-cell">Inquiries</th>
                <th className="text-right px-6 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading && (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    <Loader2 className="animate-spin inline mr-2" size={14} /> Loading requirements…
                  </td>
                </tr>
              )}
              {!loading && err && (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-sm text-red-500">{err}</td>
                </tr>
              )}
              {!loading && !err && requirements.map((r) => (
                <tr key={r._id} className="transition-colors hover:bg-secondary/40">
                  <td className="px-6 py-3.5 text-sm font-mono font-semibold text-primary">
                    {String(r._id).slice(-6).toUpperCase()}
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2">
                      <Avatar name={r.buyer?.name ?? 'Guest'} size={28} />
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {r.buyer?.name ?? 'Guest'}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {r.buyer?.email ?? ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-foreground hidden md:table-cell">
                    {r.eventType}
                  </td>
                  <td className="px-6 py-3.5 text-sm text-muted-foreground hidden lg:table-cell">
                    {r.city || '—'}
                  </td>
                  <td className="px-6 py-3.5 text-sm text-muted-foreground hidden xl:table-cell">
                    {r.date || '—'}
                  </td>
                  <td className="px-6 py-3.5 text-sm text-muted-foreground hidden lg:table-cell">
                    {r.budget || '—'}
                  </td>
                  <td className="px-6 py-3.5">
                    <Badge tone={STATUS_TONE[r.status] ?? 'muted'}>
                      {r.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-3.5 hidden sm:table-cell">
                    {(r.offersCount ?? 0) > 0 ? (
                      <Badge tone="info">
                        <span className="flex items-center gap-1">
                          <Tag size={10} /> {r.offersCount} offer{r.offersCount !== 1 ? 's' : ''}
                        </span>
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-sm text-muted-foreground hidden sm:table-cell">
                    {r.inquiryCount}
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openDetail(r)}
                        className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                        title="View details"
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && !err && requirements.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    No requirements posted yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-border/50 text-xs text-muted-foreground">
          Showing {requirements.length} of {data?.total ?? 0}
        </div>
      </Card>

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl p-6 m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {selected.eventType} Requirement
                </h2>
                <p className="text-xs text-muted-foreground font-mono">
                  #{String(selected._id).slice(-8).toUpperCase()}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Avatar name={selected.buyer?.name ?? 'Guest'} size={32} />
                <div>
                  <div className="font-semibold text-foreground">
                    {selected.buyer?.name ?? 'Guest'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {selected.buyer?.email ?? ''}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin size={14} className="mt-0.5 shrink-0" />
                <span className="text-foreground">
                  {selected.address}{selected.city ? `, ${selected.city}` : ''}
                </span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar size={14} className="shrink-0" />
                <span className="text-foreground">{selected.date || '—'}</span>
                {(selected.startTime || selected.endTime) && (
                  <>
                    <Clock size={14} className="ml-2 shrink-0" />
                    <span className="text-foreground">
                      {selected.startTime || '—'}{selected.endTime ? ` – ${selected.endTime}` : ''}
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <Wallet size={14} className="shrink-0" />
                <span className="text-foreground">{selected.budget || 'Flexible'}</span>
              </div>

              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Equipment needed
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selected.items.map((it) => (
                    <span
                      key={it}
                      className="px-2.5 py-1 text-xs rounded-full bg-secondary border border-border text-foreground"
                    >
                      {it}
                    </span>
                  ))}
                </div>
              </div>

              {selected.notes && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Notes
                  </div>
                  <p className="text-foreground">{selected.notes}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <Badge tone={STATUS_TONE[selected.status] ?? 'muted'}>
                  {selected.status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {selected.inquiryCount} inquiries · {formatDate(selected.createdAt)}
                </span>
              </div>

              {/* Offers section */}
              {(selected.offersCount ?? 0) > 0 && (
                <div className="pt-3 border-t border-border">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Tag size={12} /> Competitive Offers ({selected.offersCount})
                  </div>
                  {offersLoading ? (
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Loader2 className="animate-spin" size={12} /> Loading offers…
                    </div>
                  ) : offers.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {offers.map((offer) => (
                        <div
                          key={offer._id}
                          className={`p-2.5 rounded-lg border ${
                            offer.isSelected
                              ? 'border-primary/60 bg-primary/5'
                              : 'border-border bg-secondary/30'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">
                              {offer.supplier?.name ?? 'Unknown Supplier'}
                            </span>
                            <span className="text-sm font-bold text-primary">
                              ₹{offer.offerPrice?.toLocaleString('en-IN')}
                            </span>
                          </div>
                          {offer.offerNote && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {offer.offerNote}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge tone={
                              offer.isSelected ? 'success' :
                              offer.status === 'offered' ? 'info' :
                              offer.status === 'rejected' ? 'error' : 'muted'
                            }>
                              {offer.isSelected ? 'accepted' : offer.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {selected.offersCount} offer{selected.offersCount !== 1 ? 's' : ''} received
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
