import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserCheck, UserX, Shield, User as UserIcon } from 'lucide-react';
import { usersApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { format } from 'date-fns';

export function UsersPage() {
  const { user: me } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list().then((r) => r.data.data),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      usersApi.updateRole(id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  return (
    <div style={{ padding: '2.5rem', maxWidth: 1000 }} className="animate-fade-in-up">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Team</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          Manage workspace members and their roles
        </p>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 120px', gap: '1rem' }}>
          {['Member', 'Role', 'Last active', 'Actions'].map((h) => (
            <span key={h} style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>
              {h}
            </span>
          ))}
        </div>

        {isLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading...</div>
        ) : (
          <div>
            {Array.isArray(users) && users.map((u: {
              id: string; name: string; email: string; role: string;
              is_active: boolean; last_login_at: string | null;
            }) => (
              <div key={u.id} style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 120px',
                gap: '1rem',
                padding: '1rem 1.5rem',
                borderBottom: '1px solid var(--color-border)',
                alignItems: 'center',
                transition: 'background 0.15s',
              }}>
                {/* Member */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-2))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.8rem', fontWeight: 700, color: '#fff', flexShrink: 0,
                  }}>
                    {u.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                      {u.name}
                      {u.id === me?.id && <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: 'var(--color-accent)', background: 'var(--color-accent-dim)', padding: '0.1rem 0.4rem', borderRadius: 4 }}>You</span>}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{u.email}</p>
                  </div>
                </div>

                {/* Role badge */}
                <div>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                    fontSize: '0.75rem', fontWeight: 500, padding: '0.25rem 0.6rem',
                    borderRadius: 20,
                    background: u.role === 'admin' ? 'rgba(108,99,255,0.12)' : 'rgba(136,136,168,0.1)',
                    color: u.role === 'admin' ? 'var(--color-accent)' : 'var(--color-text-muted)',
                    border: `1px solid ${u.role === 'admin' ? 'rgba(108,99,255,0.3)' : 'var(--color-border)'}`,
                  }}>
                    {u.role === 'admin' ? <Shield size={10} /> : <UserIcon size={10} />}
                    {u.role}
                  </span>
                </div>

                {/* Last active */}
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  {u.last_login_at ? format(new Date(u.last_login_at), 'MMM d, yyyy') : 'Never'}
                </p>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {u.id !== me?.id && me?.role === 'admin' && (
                    <button
                      onClick={() => roleMutation.mutate({ id: u.id, role: u.role === 'admin' ? 'member' : 'admin' })}
                      className="btn-ghost"
                      style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                      disabled={roleMutation.isPending}
                    >
                      {u.role === 'admin' ? <UserX size={12} /> : <UserCheck size={12} />}
                      {u.role === 'admin' ? 'Demote' : 'Promote'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
