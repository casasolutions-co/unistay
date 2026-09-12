'use client';

import { useCallback, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export interface DocRecord {
  id: string;
  doc_type: string;
  file_name: string;
  size_bytes: number;
  created_at: number;
}

export const DOC_TYPE_OPTIONS = ['Rental agreement', 'Insurance certificate', 'Proof of address', 'Other document'];

export function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function useDocuments() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [token, setToken] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) {
        setToken(null);
        setDocuments([]);
        setLoading(false);
        return;
      }
      setToken(await u.getIdToken());
    });
  }, []);

  const refresh = useCallback(async (t: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/documents', { headers: { Authorization: `Bearer ${t}` } });
      const data = await res.json();
      setDocuments(data.documents ?? []);
    } catch {
      setError('Could not load your documents.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kicks off the fetch once a token is available; refresh sets loading synchronously before its own await
    if (token) refresh(token);
  }, [token, refresh]);

  const upload = useCallback(async (file: File, docType: string) => {
    if (!token) return false;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('docType', docType);
      const res = await fetch('/api/user/documents', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Upload failed. Please try again.');
        return false;
      }
      setDocuments((prev) => [data.document, ...prev]);
      return true;
    } catch {
      setError('Upload failed. Please try again.');
      return false;
    } finally {
      setUploading(false);
    }
  }, [token]);

  const remove = useCallback(async (id: string) => {
    if (!token) return;
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    try {
      await fetch(`/api/user/documents/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // best-effort — a stale row disappears from the list either way
    }
  }, [token]);

  return { user, documents, loading, uploading, error, upload, remove };
}
