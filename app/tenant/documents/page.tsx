'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import { FileText, Upload, Lock, Download, X, Loader2 } from 'lucide-react';

const DOC_TYPES = ['agreement', 'aadhaar', 'receipt', 'other'] as const;
const TYPE_LABEL: Record<string, string> = { agreement: '📄 Agreement', aadhaar: '🪪 Aadhaar', receipt: '🧾 Receipt', other: '📁 Other' };

export default function TenantDocumentsPage() {
  const [docs, setDocs] = useState<any[]>([]);
  const [tenancyId, setTenancyId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState<string>('agreement');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: t } = await supabase.from('tenancies').select('id').eq('tenant_id', user.id).eq('status', 'active').maybeSingle();
      if (!t) return;
      setTenancyId(t.id);
      loadDocs(t.id);
    };
    load();
  }, []);

  const loadDocs = async (tid: string) => {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('tenancy_id', tid);
      
    if (error) {
      console.error("Docs load error:", error);
      setError("Failed to load documents: " + error.message);
    }
    setDocs(data ?? []);
  };

  const handleUpload = async () => {
    if (!file || !tenancyId) return;
    if (file.size > 5 * 1024 * 1024) { setError('File must be under 5MB.'); return; }
    setUploading(true); setError(null);

    // Get signed upload URL
    const res = await fetch(`/api/documents/upload?tenancy_id=${tenancyId}&doc_type=${docType}&file_name=${encodeURIComponent(file.name)}`, { method: 'POST' });
    if (!res.ok) { setError('Failed to get upload URL.'); setUploading(false); return; }
    const { signedUrl, token, path } = await res.json();

    // Upload file
    const uploadRes = await supabase.storage.from('documents').uploadToSignedUrl(path, token, file, {
      contentType: file.type,
    });
    if (uploadRes.error) { setError(uploadRes.error.message); setUploading(false); return; }

    // Get public URL
    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path);
    const { data: { user } } = await supabase.auth.getUser();

    const { error: dbError } = await supabase.from('documents').insert({
      tenancy_id: tenancyId,
      uploaded_by: user!.id,
      doc_type: docType,
      file_url: urlData.publicUrl,
      file_name: file.name,
    });

    if (dbError) {
      console.error('DB Insert Error:', dbError);
      setError('Database error: ' + dbError.message);
      setUploading(false);
      return;
    }

    await loadDocs(tenancyId);
    setFile(null); setUploading(false);
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Document Vault</h1>
        <p className="text-slate-500 mt-1 text-sm flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-emerald-500" /> Encrypted · Supabase Storage
        </p>
      </div>

      {/* Upload area */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-700">Upload Document</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 block mb-1.5">Type</label>
            <select value={docType} onChange={e => setDocType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {DOC_TYPES.map(t => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 block mb-1.5">File (PDF/JPG/PNG, max 5MB)</label>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:text-xs file:font-semibold hover:file:bg-blue-700 cursor-pointer" />
          </div>
        </div>
        {error && <p className="text-xs text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">{error}</p>}
        <button onClick={handleUpload} disabled={!file || uploading}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40 shadow-sm shadow-blue-200">
          {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <><Upload className="w-4 h-4" /> Upload</>}
        </button>
      </div>

      {/* Document list */}
      {docs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <FileText className="w-12 h-12 mb-3 text-slate-700" />
          <p className="text-sm">No documents uploaded.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map(doc => (
            <div key={doc.id} className="bg-white border border-slate-200 rounded-xl px-5 py-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{doc.file_name ?? 'Document'}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-blue-400 font-semibold">{TYPE_LABEL[doc.doc_type]}</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-xs text-slate-500">{doc.profiles?.name ?? 'You'}</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-xs text-slate-500">{formatDate(doc.created_at)}</span>
                </div>
              </div>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(doc.file_url);
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = doc.file_name ?? 'document';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  } catch {
                    window.open(doc.file_url, '_blank');
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shrink-0">
                <Download className="w-3.5 h-3.5" /> Download
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
