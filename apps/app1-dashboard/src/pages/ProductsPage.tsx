import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Plus, Edit2, ToggleLeft, ToggleRight, Check, X } from 'lucide-react';
import { api } from '../services/api';

interface Product {
  id: string;
  name: string;
  description?: string;
  price_cents: number;
  license_type: 'perpetual' | 'yearly' | 'monthly';
  duration_days?: number;
  max_activations: number;
  is_active: boolean;
}

function formatBRL(cents: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

const LICENSE_TYPE_LABELS: Record<string, string> = {
  perpetual: 'Vitalícia',
  yearly:    'Anual',
  monthly:   'Mensal',
};

function ProductForm({
  initial,
  onSave,
  onCancel,
  isSaving,
}: {
  initial?: Partial<Product>;
  onSave: (data: Partial<Product>) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState({
    name:            initial?.name || '',
    description:     initial?.description || '',
    price_cents:     initial?.price_cents ? (initial.price_cents / 100).toFixed(2) : '',
    license_type:    initial?.license_type || 'perpetual',
    duration_days:   initial?.duration_days?.toString() || '',
    max_activations: initial?.max_activations?.toString() || '1',
  });

  const handleSave = () => {
    const price = parseFloat(form.price_cents.replace(',', '.'));
    onSave({
      name:            form.name,
      description:     form.description || undefined,
      price_cents:     Math.round(price * 100),
      license_type:    form.license_type as Product['license_type'],
      duration_days:   form.license_type !== 'perpetual' && form.duration_days
                         ? parseInt(form.duration_days)
                         : undefined,
      max_activations: parseInt(form.max_activations) || 1,
    });
  };

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.375rem', fontWeight: 500 }}>Nome do produto *</label>
          <input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Meu Software Pro" />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.375rem', fontWeight: 500 }}>Preço (R$) *</label>
          <input className="input-field" value={form.price_cents} onChange={e => setForm({ ...form, price_cents: e.target.value })} placeholder="97.00" type="number" min="0" step="0.01" />
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.375rem', fontWeight: 500 }}>Descrição</label>
        <input className="input-field" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Licença vitalícia para 1 computador" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.375rem', fontWeight: 500 }}>Tipo de licença</label>
          <select className="input-field" value={form.license_type} onChange={e => setForm({ ...form, license_type: e.target.value })}>
            <option value="perpetual">Vitalícia</option>
            <option value="yearly">Anual</option>
            <option value="monthly">Mensal</option>
          </select>
        </div>
        {form.license_type !== 'perpetual' && (
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.375rem', fontWeight: 500 }}>Duração (dias)</label>
            <input className="input-field" value={form.duration_days} onChange={e => setForm({ ...form, duration_days: e.target.value })} placeholder="365" type="number" min="1" />
          </div>
        )}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.375rem', fontWeight: 500 }}>Máx. ativações</label>
          <input className="input-field" value={form.max_activations} onChange={e => setForm({ ...form, max_activations: e.target.value })} placeholder="1" type="number" min="1" />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
        <button onClick={onCancel} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <X size={13} /> Cancelar
        </button>
        <button onClick={handleSave} className="btn-primary" disabled={isSaving || !form.name || !form.price_cents} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <Check size={13} /> {isSaving ? 'Salvando...' : 'Salvar Produto'}
        </button>
      </div>
    </div>
  );
}

export function ProductsPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['admin-products'],
    queryFn: () => api.get('/admin/products').then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Product>) => api.post('/admin/products', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-products'] }); setCreating(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) =>
      api.patch(`/admin/products/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-products'] }); setEditing(null); },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      api.patch(`/admin/products/${id}`, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-products'] }),
  });

  return (
    <div style={{ padding: '2.5rem', maxWidth: 1000 }} className="animate-fade-in-up">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <Package size={20} color="var(--color-accent)" /> Produtos
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Gerencie o que você vende e os preços
          </p>
        </div>
        <button onClick={() => setCreating(true)} className="btn-primary">
          <Plus size={14} /> Novo Produto
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.25rem', borderColor: 'var(--color-accent)' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem' }}>Novo Produto</h3>
          <ProductForm
            onSave={(data) => createMutation.mutate(data)}
            onCancel={() => setCreating(false)}
            isSaving={createMutation.isPending}
          />
        </div>
      )}

      {/* Products list */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>Carregando...</div>
      ) : products.length === 0 && !creating ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <Package size={32} style={{ opacity: 0.3, marginBottom: '0.75rem', display: 'block', margin: '0 auto 0.75rem' }} />
          <p style={{ marginBottom: '1rem' }}>Nenhum produto criado ainda</p>
          <button onClick={() => setCreating(true)} className="btn-primary" style={{ margin: '0 auto', display: 'inline-flex' }}>
            <Plus size={14} /> Criar primeiro produto
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {products.map((product) => (
            <div key={product.id} className="card" style={{ padding: '1.5rem', opacity: product.is_active ? 1 : 0.6 }}>
              {editing === product.id ? (
                <>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem' }}>Editando: {product.name}</h3>
                  <ProductForm
                    initial={product}
                    onSave={(data) => updateMutation.mutate({ id: product.id, data })}
                    onCancel={() => setEditing(null)}
                    isSaving={updateMutation.isPending}
                  />
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.375rem' }}>
                      <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{product.name}</p>
                      <span style={{
                        fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: 20, fontWeight: 600,
                        background: product.is_active ? 'rgba(0,212,170,0.1)' : 'rgba(136,136,168,0.1)',
                        color: product.is_active ? 'var(--color-success)' : 'var(--color-text-muted)',
                        border: `1px solid ${product.is_active ? 'rgba(0,212,170,0.3)' : 'var(--color-border)'}`,
                      }}>
                        {product.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    {product.description && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>{product.description}</p>
                    )}
                    <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        🏷 {LICENSE_TYPE_LABELS[product.license_type]}
                        {product.duration_days ? ` (${product.duration_days} dias)` : ''}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        💻 {product.max_activations} ativação(ões)
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <p style={{ fontSize: '1.375rem', fontWeight: 800 }}>{formatBRL(product.price_cents)}</p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => setEditing(product.id)}
                        className="btn-ghost"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                      >
                        <Edit2 size={13} /> Editar
                      </button>
                      <button
                        onClick={() => toggleMutation.mutate({ id: product.id, is_active: !product.is_active })}
                        style={{
                          background: 'none', border: '1px solid var(--color-border)',
                          borderRadius: 8, cursor: 'pointer',
                          color: product.is_active ? 'var(--color-success)' : 'var(--color-text-muted)',
                          padding: '0.4rem 0.75rem', fontSize: '0.8rem',
                          display: 'flex', alignItems: 'center', gap: '0.375rem',
                        }}
                      >
                        {product.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                        {product.is_active ? 'Desativar' : 'Ativar'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
