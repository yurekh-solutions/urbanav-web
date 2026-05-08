// ────────────────────────────────────────────────────────────────────────────
// Admin API client — talks to the Express backend at /api/admin/*
// Auth: sends the static `x-admin-token` header (dev) from NEXT_PUBLIC_ADMIN_TOKEN.
// For production, swap to a Bearer JWT flow.
// ────────────────────────────────────────────────────────────────────────────

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3002/api/admin';

const ADMIN_TOKEN =
  process.env.NEXT_PUBLIC_ADMIN_TOKEN || 'urbanav-admin-dev-token';

type QueryParams = Record<string, string | number | boolean | undefined | null>;

function buildQuery(params?: QueryParams): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ''
  );
  if (entries.length === 0) return '';
  const search = new URLSearchParams();
  entries.forEach(([k, v]) => search.append(k, String(v)));
  return `?${search.toString()}`;
}

async function request<T>(
  path: string,
  options: RequestInit & { params?: QueryParams } = {}
): Promise<T> {
  const { params, headers, ...rest } = options;
  const url = `${API_BASE}${path}${buildQuery(params)}`;

  const res = await fetch(url, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': ADMIN_TOKEN,
      ...(headers || {}),
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      message = body?.message || body?.error || message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  return (await res.json()) as T;
}

// ── Types ─────────────────────────────────────────────────────────────────
export interface OverviewStats {
  totalRevenue: number;
  activeOrders: number;
  totalUsers: number;
  equipmentCount: number;
  deltas: {
    revenuePct: number;
    usersPct: number;
    equipmentPct: number;
  };
}

export interface RevenueTrendPoint {
  month: string;
  revenue: number;
  orders: number;
}

export interface CategoryStat {
  category: string;
  revenue: number;
  orders: number;
}

export interface TopSupplier {
  supplierId: string;
  supplierName: string;
  revenue: number;
  orders: number;
  rating: number;
}

export interface KpiStats {
  avgOrderValue: number;
  cancellationRate: number;
  repeatBuyerRate: number;
}

export type ActivityKind = 'order' | 'user' | 'equipment';

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  title: string;
  subtitle: string;
  timestamp: string;
  meta?: Record<string, unknown>;
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  userType: 'buyer' | 'supplier' | 'admin';
  accountStatus: 'active' | 'suspended' | 'pending';
  isVerified: boolean;
  createdAt: string;
}

export interface UserListResponse {
  data: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
  summary: {
    total: number;
    buyers: number;
    suppliers: number;
    suspended: number;
  };
}

export interface AdminEquipment {
  _id: string;
  name: string;
  category: string;
  supplier: { _id: string; name: string } | null;
  pricePerDay: number;
  availability: boolean;
  status: 'active' | 'inactive' | 'pending';
  rating: number;
  totalBookings: number;
  createdAt: string;
}

export interface EquipmentListResponse {
  data: AdminEquipment[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminOrder {
  _id: string;
  orderNumber: string;
  buyer: { _id: string; name: string } | null;
  supplier: { _id: string; name: string } | null;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

export interface OrderListResponse {
  data: AdminOrder[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminInquiry {
  _id: string;
  buyer: { _id: string; name: string } | null;
  supplier: { _id: string; name: string } | null;
  equipment: { _id: string; name: string } | null;
  subject: string;
  status: string;
  messageCount: number;
  createdAt: string;
}

export interface InquiryListResponse {
  data: AdminInquiry[];
  total: number;
  page: number;
  pageSize: number;
}

// ── Requirement types ─────────────────────────────────────────────────────
export interface AdminRequirement {
  _id: string;
  buyer: { _id: string; name: string; email: string } | null;
  eventType: string;
  city: string;
  address: string;
  date: string;
  startTime: string;
  endTime: string;
  items: string[];
  budget: string;
  notes: string;
  status: 'open' | 'matched' | 'booked' | 'cancelled';
  inquiryCount: number;
  createdAt: string;
}

export interface RequirementListResponse {
  data: AdminRequirement[];
  total: number;
  page: number;
  pageSize: number;
}

// ── Vendor types ─────────────────────────────────────────────────────────
export interface KycDocumentSlot {
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  uploadedAt?: string;
}

export interface VendorDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  businessDescription?: string;
  productsOffered?: string[];
  yearsInBusiness?: number;
  gstNumber: string;
  panNumber: string;
  serviceArea: { city: string; state: string; pincode: string; fullAddress: string };
  bankDetails?: { accountNumber: string; ifsc: string; bankName: string; accountHolderName: string };
  rating: number;
  isVerified: boolean;
  kycStatus: 'pending' | 'submitted' | 'approved' | 'rejected';
  accountStatus: 'pending' | 'active' | 'suspended' | 'rejected';
  isFeatured: boolean;
  commissionRate: number;
  isFraudFlagged: boolean;
  fraudNotes?: string;
  fraudFlaggedAt?: string;
  kycSubmittedAt?: string;
  kycApprovedAt?: string;
  kycRejectedAt?: string;
  kycRejectionReason?: string;
  kycDocument?: KycDocumentSlot | null;
  kycDocuments?: {
    pan?: KycDocumentSlot | null;
    aadhaar?: KycDocumentSlot | null;
    bankProof?: KycDocumentSlot | null;
    gst?: KycDocumentSlot | null;
  } | null;
  totalOrders: number;
  totalEarnings: number;
  equipmentCount?: number;
  activeOrders?: number;
  createdAt: string;
}

export interface VendorListResponse {
  vendors: VendorDetail[];
  total: number;
  page: number;
  pageSize: number;
}

// ── Dispute types ─────────────────────────────────────────────────────────
export interface DisputeDetail {
  id: string;
  orderId: string;
  buyer: { id: string; name: string; email: string; phone?: string } | null;
  supplier: { id: string; name: string; email: string; phone?: string; businessName?: string } | null;
  equipment: { id: string; name: string; image?: string } | null;
  totalAmount: number;
  disputeFlag: boolean;
  disputeStatus: 'open' | 'resolved';
  disputeReason: string;
  resolution: string;
  createdAt: string;
  updatedAt: string;
}

export interface DisputeListResponse {
  disputes: DisputeDetail[];
  total: number;
  page: number;
  pageSize: number;
}

// ── API surface ───────────────────────────────────────────────────────────
export const adminApi = {
  // stats
  overview: () => request<OverviewStats>('/stats/overview'),
  revenueTrend: (months = 6) =>
    request<RevenueTrendPoint[]>('/stats/revenue-trend', { params: { months } }),
  categories: () => request<CategoryStat[]>('/stats/categories'),
  topSuppliers: (limit = 5) =>
    request<TopSupplier[]>('/stats/top-suppliers', { params: { limit } }),
  kpis: () => request<KpiStats>('/stats/kpis'),
  activity: (limit = 10) =>
    request<ActivityItem[]>('/stats/activity', { params: { limit } }),

  // users
  users: (params?: QueryParams) =>
    request<UserListResponse>('/users', { params }),
  setUserStatus: (id: string, accountStatus: 'active' | 'suspended' | 'pending') =>
    request<AdminUser>(`/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ accountStatus }),
    }),

  // equipment
  equipment: (params?: QueryParams) =>
    request<EquipmentListResponse>('/equipment', { params }),
  setEquipmentAvailability: (id: string, availability: boolean) =>
    request<AdminEquipment>(`/equipment/${id}/availability`, {
      method: 'PUT',
      body: JSON.stringify({ availability }),
    }),
  setEquipmentFeatured: (id: string, featured: boolean) =>
    request<AdminEquipment>(`/equipment/${id}/featured`, {
      method: 'PUT',
      body: JSON.stringify({ featured }),
    }),

  // orders
  orders: (params?: QueryParams) =>
    request<OrderListResponse>('/orders', { params }),

  // inquiries
  inquiries: (params?: QueryParams) =>
    request<InquiryListResponse>('/inquiries', { params }),

  // requirements (buyer posts)
  requirements: (params?: QueryParams) =>
    request<RequirementListResponse>('/requirements', { params }),

  // vendors
  vendors: (params?: QueryParams) =>
    request<VendorListResponse>('/vendors', { params }),
  getVendor: (id: string) =>
    request<VendorDetail>(`/vendors/${id}`),
  approveVendor: (id: string) =>
    request<{ success: boolean; message: string; vendor: VendorDetail }>(`/vendors/${id}/approve`, { method: 'PUT' }),
  rejectVendor: (id: string, reason: string) =>
    request<{ success: boolean; message: string; vendor: VendorDetail }>(`/vendors/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    }),
  suspendVendor: (id: string) =>
    request<{ success: boolean; message: string; vendor: VendorDetail }>(`/vendors/${id}/suspend`, { method: 'PUT' }),
  reactivateVendor: (id: string) =>
    request<{ success: boolean; message: string; vendor: VendorDetail }>(`/vendors/${id}/reactivate`, { method: 'PUT' }),
  updateVendorCommission: (id: string, rate: number) =>
    request<{ success: boolean; message: string; vendor: VendorDetail }>(`/vendors/${id}/commission`, {
      method: 'PUT',
      body: JSON.stringify({ rate }),
    }),
  toggleVendorFeatured: (id: string, featured: boolean) =>
    request<{ success: boolean; message: string; vendor: VendorDetail }>(`/vendors/${id}/featured`, {
      method: 'PUT',
      body: JSON.stringify({ featured }),
    }),
  flagVendorFraud: (id: string, notes: string) =>
    request<{ success: boolean; message: string; vendor: VendorDetail }>(`/vendors/${id}/fraud-flag`, {
      method: 'PUT',
      body: JSON.stringify({ notes }),
    }),
  unflagVendorFraud: (id: string) =>
    request<{ success: boolean; message: string; vendor: VendorDetail }>(`/vendors/${id}/fraud-unflag`, { method: 'PUT' }),

  // disputes
  disputes: (params?: QueryParams) =>
    request<DisputeListResponse>('/disputes', { params }),
  resolveDispute: (id: string, action: string, resolution?: string) =>
    request<{ success: boolean; message: string }>(`/disputes/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ action, resolution }),
    }),
};
