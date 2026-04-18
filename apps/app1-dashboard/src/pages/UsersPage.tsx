import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserCheck, UserX, Shield, User as UserIcon, Plus } from 'lucide-react';
import { usersApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UserRow {
  id: string; name: string; email: string; role: string;
  is_active: boolean; last_login_at?: string; created_at: string;
}

export function UsersPage() {
  const { user: me } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list().then((r) => r.data.data),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => usersApi.updateRole(id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const ROLE_LABELS: Record<string, string> = {
    admin:  'Administrador',
    member: 'Membro',
  };

  return (
    <div style={{ padding: '2.5rem', maxWidth: 1000 }} className="animate-fade-in-up">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '.25rem' }}>Usuários</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '.875rem' }}>
            Gerencie os membros do workspace e suas permissões
          </p>
        </div>
        <a href="/checkout.html" style={{ textDecoration: 'none' }}>
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '.375rem' }}>
            <Plus size={14} /> Adicionar usuário
          </button>
        </a>
      </div>

      {isLoading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Carregando...</div>
      ) : !users?.length ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <UserIcon size={32} style={{ opacity: .3, marginBottom: '1rem' }} />
          <p>Nenhum usuário ainda.</p>
          <p style={{ fontSize: '.85rem', marginTop: '.375rem' }}>Crie usuários pela página <strong>Compras PIX</strong> após aprovar um pagamento.</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Usuário', 'Função', 'Último acesso', 'Criado em', 'Ações'].map(h => (
                  <th key={h} style={{ padding: '.75rem 1rem', textAlign: 'left', fontSize: '.78rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(users as UserRow[]).map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '.875rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--color-accent)' }}>
                          {u.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p style={{ fontWeight: 500, fontSize: '.9rem' }}>{u.name}</p>
                        <p style={{ fontSize: '.78rem', color: 'var(--color-text-muted)' }}>{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '.875rem 1rem' }}>
                    <span style={{
                      fontSize: '.75rem', fontWeight: 600, padding: '.2rem .625rem', borderRadius: 20,
                      background: u.role === 'admin' ? 'rgba(108,99,255,.12)' : 'rgba(136,136,168,.1)',
                      color: u.role === 'admin' ? 'var(--color-accent)' : 'var(--color-text-muted)',
                      display: 'inline-flex', alignItems: 'center', gap: '.3rem',
                    }}>
                      <Shield size={11} />
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </td>
                  <td style={{ padding: '.875rem 1rem', fontSize: '.82rem', color: 'var(--color-text-muted)' }}>
                    {u.last_login_at
                      ? format(new Date(u.last_login_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR })
                      : 'Nunca'}
                  </td>
                  <td style={{ padding: '.875rem 1rem', fontSize: '.82rem', color: 'var(--color-text-muted)' }}>
                    {format(new Date(u.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </td>
                  <td style={{ padding: '.875rem 1rem' }}>
                    {u.id !== me?.id && (
                      <button
                        className="btn-ghost"
                        style={{ fontSize: '.78rem', padding: '.3rem .75rem', display: 'inline-flex', alignItems: 'center', gap: '.3rem' }}
                        onClick={() => roleMutation.mutate({ id: u.id, role: u.role === 'admin' ? 'member' : 'admin' })}
                        disabled={roleMutation.isPending}
                        title={u.role === 'admin' ? 'Rebaixar para Membro' : 'Promover a Admin'}
                      >
                        {u.role === 'admin' ? <><UserX size={12} /> Remover admin</> : <><UserCheck size={12} /> Tornar admin</>}
                      </button>
                    )}
                    {u.id === me?.id && (
                      <span style={{ fontSize: '.78rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>você</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: '1.5rem', padding: '1rem 1.25rem', borderRadius: 10, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', fontSize: '.82rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
        💡 Para adicionar novos usuários, use a página <strong style={{ color: 'var(--color-text)' }}>Compras PIX</strong> após aprovar um pagamento, ou crie diretamente com "Criar usuário".
      </div>
    </div>
  );
}
