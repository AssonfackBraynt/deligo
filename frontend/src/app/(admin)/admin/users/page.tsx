'use client';

import { useEffect, useState } from 'react';
import { Search, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { listAdminUsers, updateUserStatus, type AdminUser } from '@/features/admin/admin-api';
import { AdminNav } from '@/components/layout/admin-nav';

const STATUS_TONES: Record<string, 'success' | 'warning' | 'neutral'> = {
  active: 'success',
  suspended: 'warning',
  deactivated: 'neutral',
};

export default function AdminUsersPage() {
  const [items, setItems] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  async function load(p = 1) {
    setLoading(true);
    try {
      const res = await listAdminUsers({ page: p, limit: 20, search: search || undefined });
      setItems(res.items);
      setTotal(res.total);
      setPage(p);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(1); }, []);

  async function handleStatusChange(userId: string, status: 'active' | 'suspended' | 'deactivated') {
    setUpdating(userId);
    try {
      await updateUserStatus(userId, status);
      setItems((prev) => prev.map((u) => u.id === userId ? { ...u, accountStatus: status } : u));
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNav active="users" />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-foreground">Users</h1>
          <span className="text-sm text-muted-foreground">{total} total</span>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void load(1)}
              placeholder="Search by name, phone or email…"
              className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <Button size="sm" onClick={() => void load(1)}>Search</Button>
        </div>

        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}</div>
        ) : items.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No users found.</CardContent></Card>
        ) : (
          <>
            <div className="space-y-3">
              {items.map((u) => (
                <Card key={u.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">{u.fullName}</p>
                        <Badge tone={STATUS_TONES[u.accountStatus] ?? 'neutral'}>{u.accountStatus}</Badge>
                        {u.roles.map((r) => (
                          <Badge key={r} tone={r === 'admin' ? 'primary' : 'neutral'}>
                            {r === 'admin' && <ShieldCheck size={11} />}
                            {r}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {u.phone}{u.email ? ` · ${u.email}` : ''}
                      </p>
                      {u.providerProfile && (
                        <p className="text-xs text-muted-foreground">Provider: {u.providerProfile.displayName}</p>
                      )}
                    </div>

                    {!u.roles.includes('admin') && (
                      <div className="flex gap-2">
                        {u.accountStatus !== 'active' && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updating === u.id}
                            onClick={() => void handleStatusChange(u.id, 'active')}
                          >
                            Activate
                          </Button>
                        )}
                        {u.accountStatus === 'active' && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updating === u.id}
                            onClick={() => void handleStatusChange(u.id, 'suspended')}
                          >
                            Suspend
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {total > 20 && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button size="sm" variant="outline" disabled={page === 1} onClick={() => void load(page - 1)}>Previous</Button>
                <span className="text-sm text-muted-foreground">Page {page} of {Math.ceil(total / 20)}</span>
                <Button size="sm" variant="outline" disabled={page * 20 >= total} onClick={() => void load(page + 1)}>Next</Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
