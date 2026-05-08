'use client';
import React, { useEffect, useState } from 'react';
import { ArrowLeft, FileText, ExternalLink, Download, CheckCircle, XCircle, Calendar, HardDrive, User, Mail, Phone, Building2, MapPin, AlertCircle } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { Card, Badge, Button } from '@/components/ui';
import { adminApi, type VendorDetail } from '@/lib/api';

type DocSlot = {
  key: string;
  label: string;
  requirement: 'required' | 'optional' | 'recommended';
  doc?: {
    url: string;
    filename: string;
    mimeType: string;
    size: number;
    uploadedAt?: string;
  } | null;
};

export default function VendorDocumentsPage() {
  const router = useRouter();
  const params = useParams();
  const vendorId = params?.id as string;

  const [vendor, setVendor] = useState<VendorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  const loadVendor = async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await adminApi.getVendor(vendorId);
      setVendor(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load vendor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vendorId) loadVendor();
  }, [vendorId]);

  const handleApprove = async () => {
    if (!vendor) return;
    setMutating(true);
    try {
      await adminApi.approveVendor(vendor.id);
      await loadVendor();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to approve');
    } finally {
      setMutating(false);
    }
  };

  const handleReject = async () => {
    if (!vendor) return;
    if (!rejectReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    setMutating(true);
    try {
      await adminApi.rejectVendor(vendor.id, rejectReason);
      setShowRejectModal(false);
      setRejectReason('');
      await loadVendor();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to reject');
    } finally {
      setMutating(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const documents: DocSlot[] = vendor
    ? [
        {
          key: 'pan',
          label: 'PAN Card',
          requirement: 'required',
          doc: (vendor.kycDocuments?.pan && vendor.kycDocuments.pan.url)
            ? vendor.kycDocuments.pan
            : vendor.kycDocument || null,
        },
        {
          key: 'aadhaar',
          label: 'Aadhaar Card',
          requirement: 'optional',
          doc: vendor.kycDocuments?.aadhaar || null,
        },
        {
          key: 'bankProof',
          label: 'Bank Proof',
          requirement: 'required',
          doc: vendor.kycDocuments?.bankProof || null,
        },
        {
          key: 'gst',
          label: 'GST / Business License',
          requirement: 'recommended',
          doc: vendor.kycDocuments?.gst || null,
        },
      ]
    : [];

  const uploadedCount = documents.filter(d => d.doc?.url).length;
  const requiredDocsUploaded = documents.filter(d => d.requirement === 'required' && d.doc?.url).length;
  const canApprove = vendor?.kycStatus !== 'approved' && requiredDocsUploaded >= 2;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading vendor details...</p>
        </div>
      </div>
    );
  }

  if (err || !vendor) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle size={48} className="mx-auto mb-4 text-destructive" />
          <h2 className="text-xl font-bold text-foreground mb-2">Error Loading Vendor</h2>
          <p className="text-muted-foreground mb-4">{err || 'Vendor not found'}</p>
          <Button onClick={() => router.push('/vendors')}>Back to Vendors</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-lg border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/vendors')}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <ArrowLeft size={20} className="text-foreground" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                  {vendor.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">{vendor.name}</h1>
                  <p className="text-sm text-muted-foreground">{vendor.businessName}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge 
                tone={vendor.kycStatus === 'approved' ? 'success' : vendor.kycStatus === 'rejected' ? 'error' : 'warning'}
                className="text-sm px-3 py-1"
              >
                KYC: {vendor.kycStatus}
              </Badge>
              <Badge 
                tone={vendor.accountStatus === 'active' ? 'success' : 'warning'}
                className="text-sm px-3 py-1"
              >
                Account: {vendor.accountStatus}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Vendor Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                <Mail size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Email</p>
                <p className="text-sm font-semibold text-foreground truncate">{vendor.email}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                <Phone size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Phone</p>
                <p className="text-sm font-semibold text-foreground">{vendor.phone || '—'}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                <Building2 size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Business</p>
                <p className="text-sm font-semibold text-foreground">{vendor.businessName}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Business Details */}
        {vendor.businessDescription && (
          <Card className="p-4 mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-2">Business Description</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{vendor.businessDescription}</p>
          </Card>
        )}

        {/* Documents Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">
              KYC Documents ({uploadedCount}/4)
            </h2>
            <div className="flex items-center gap-2">
              {requiredDocsUploaded < 2 && (
                <Badge tone="error" className="text-xs">
                  Missing required documents
                </Badge>
              )}
              {requiredDocsUploaded >= 2 && vendor.kycStatus !== 'approved' && (
                <Badge tone="success" className="text-xs">
                  Ready for review
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc) => {
              const hasFile = !!(doc.doc?.url);
              const isImage = doc.doc?.mimeType?.startsWith('image/');
              
              return (
                <Card key={doc.key} className={`overflow-hidden ${!hasFile ? 'opacity-60' : ''}`}>
                  {/* Document Header */}
                  <div className="p-4 border-b border-border bg-secondary/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          hasFile ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground'
                        }`}>
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{doc.label}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              doc.requirement === 'required'
                                ? 'bg-red-100 text-red-700 border border-red-200'
                                : doc.requirement === 'optional'
                                ? 'bg-secondary text-muted-foreground border border-border'
                                : 'bg-green-100 text-green-700 border border-green-200'
                            }`}>
                              {doc.requirement}
                            </span>
                          </div>
                        </div>
                      </div>
                      {hasFile && (
                        <div className="flex items-center gap-2">
                          <a
                            href={doc.doc!.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                            title="Open in new tab"
                          >
                            <ExternalLink size={18} />
                          </a>
                          <a
                            href={doc.doc!.url}
                            download={doc.doc!.filename}
                            className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                            title="Download"
                          >
                            <Download size={18} />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Document Preview */}
                  {hasFile ? (
                    <div>
                      {/* File Info */}
                      <div className="px-4 py-2 bg-secondary/20 flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 truncate max-w-[150px]">
                          <FileText size={12} />
                          {doc.doc!.filename}
                        </span>
                        <span className="flex items-center gap-1 shrink-0">
                          <HardDrive size={12} />
                          {formatBytes(doc.doc!.size)}
                        </span>
                        <span className="flex items-center gap-1 shrink-0">
                          <Calendar size={12} />
                          {formatDate(doc.doc!.uploadedAt)}
                        </span>
                      </div>
                      
                      {/* Preview Area - Show embedded viewer for all docs */}
                      <div className="bg-white min-h-[300px] max-h-[400px] overflow-hidden">
                        {isImage ? (
                          <img
                            src={doc.doc!.url}
                            alt={doc.label}
                            className="w-full h-full object-contain"
                            style={{ maxHeight: '400px' }}
                          />
                        ) : (
                          <iframe
                            src={doc.doc!.url}
                            className="w-full h-full border-0"
                            style={{ height: '400px' }}
                            title={`${doc.label} Preview`}
                          />
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="min-h-[200px] flex items-center justify-center bg-secondary/10">
                      <div className="text-center">
                        <FileText size={40} className="mx-auto mb-2 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">No document uploaded</p>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        {vendor.kycStatus !== 'approved' && (
          <Card className="p-6 bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground mb-1">
                  Review Decision
                </h3>
                <p className="text-sm text-muted-foreground">
                  {requiredDocsUploaded >= 2
                    ? 'Required documents are uploaded. You can approve or reject this vendor.'
                    : 'Missing required documents. Please ask vendor to upload PAN and Bank Proof.'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  className="h-12 px-6"
                  onClick={() => setShowRejectModal(true)}
                  disabled={mutating || vendor.kycStatus === 'rejected'}
                >
                  <XCircle size={18} className="mr-2" />
                  Reject
                </Button>
                <Button
                  className="h-12 px-6 bg-green-600 hover:bg-green-700"
                  onClick={handleApprove}
                  disabled={mutating || !canApprove}
                >
                  <CheckCircle size={18} className="mr-2" />
                  Approve Vendor
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Rejection Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <Card className="w-full max-w-lg p-6">
              <h3 className="text-lg font-bold text-foreground mb-2">Reject Vendor</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Please provide a reason for rejection. The vendor will be notified via email and in-app notification.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g., PAN card is illegible. Please upload a clearer copy."
                className="w-full h-32 px-3 py-2 text-sm bg-card border border-input rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-ring mb-4"
              />
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleReject}
                  disabled={mutating}
                >
                  {mutating ? 'Rejecting...' : 'Confirm Rejection'}
                </Button>
              </div>
            </Card>
          </div>
        )}
        {/* Debug: raw vendor data */}
        {showDebug && (
          <Card className="p-4 mt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-foreground">Raw KYC Data</h3>
              <button onClick={() => setShowDebug(false)} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
            </div>
            <pre className="text-xs bg-secondary p-3 rounded-lg overflow-auto max-h-96 whitespace-pre-wrap">
              {JSON.stringify(vendor, null, 2)}
            </pre>
          </Card>
        )}

        {/* Debug toggle button */}
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="fixed bottom-4 right-4 px-3 py-2 bg-secondary text-xs text-muted-foreground rounded-lg hover:bg-secondary/80"
        >
          {showDebug ? 'Hide Debug' : 'Show Debug'}
        </button>
      </div>
    </div>
  );
}
