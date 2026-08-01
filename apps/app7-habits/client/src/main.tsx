import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { DS, burstConfetti, countUp } from '../../../../shared/design-system';
import '../../../../shared/design-system/tokens.css';
import '../../../../shared/design-system/glass.css';
import { AppIcon, setAppTheme, getAppMeta, type IconName } from '../../../../shared/design-system/icons';

setAppTheme('app7');
const APP = getAppMeta('app7');

// ── Types ──────────────────────────────────────────────────
interface Habit {
  id: string; title: string; description?: string;
  icon: string; color: string; streak: number;
  completedToday: boolean;
  history: { date: string; done: boolean }[];
  totalDone: number; created_at: string;
}
interface Stats {
  totalHabits: number; doneToday: number;
  totalCompletions: number; bestStreak: number;
  weekChart: { day: string; date: string; done: number; total: number }[];
}

// ── Design tokens (alias para compatibilidade) ─────────────
const C = {
  bg: DS.bg, sur: DS.surface, sur2: DS.surface2, brd: DS.border, brd2: DS.border2,
  txt: DS.text, mut: DS.muted, acc: DS.accent, ok: DS.ok,
  err: DS.err, wrn: DS.wrn,
};

const PRESET_ICONS = ['💧','🏃','📚','🧘','🥗','💊','🎯','🛏️','🚴','✍️','🎸','🧹','💪','🌿','😴','🍎','🙏','🎨','💻','🤸'];
const PRESET_COLORS = ['#6c63ff','#00d4aa','#ff7eb3','#ffb347','#4ecdc4','#ff6b6b','#a8ff78','#f7971e','#38ef7d','#c471ed'];

// ── API ────────────────────────────────────────────────────
function getToken(): string {
  try {
    const r = localStorage.getItem('saas-auth');
    if (r) { const s = JSON.parse(r); return s?.state?.accessToken || s?.accessToken || ''; }
  } catch { /* */ }
  return '';
}

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const r = await fetch('/api/habits' + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...(opts?.headers || {}) },
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || 'Erro');
  return j.data ?? j;
}

// ── Streak fire badge ──────────────────────────────────────
function StreakBadge({ n, size = 'md' }: { n: number; size?: 'sm' | 'md' | 'lg' }) {
  if (n === 0) return null;
  const emoji = n >= 30 ? '🔥🔥🔥' : n >= 14 ? '🔥🔥' : '🔥';
  const fs = size === 'sm' ? '.68rem' : size === 'lg' ? '1rem' : '.78rem';
  const fire = n >= 30; // efeito festa
  const hot = n >= 7;   // borda flamejante
  return (
    <span className={fire ? 'ds-pop-in' : ''} style={{
      display:'inline-flex', alignItems:'center', gap:2, fontWeight:700, fontSize:fs,
      color:'#ff7043',
      background: hot ? 'linear-gradient(135deg, rgba(255,112,67,.18), rgba(255,51,51,.12))' : 'rgba(255,112,67,.12)',
      padding:'2px 8px', borderRadius:20,
      border:`1px solid ${hot ? 'rgba(255,112,67,.45)' : 'rgba(255,112,67,.25)'}`,
      boxShadow: hot ? `0 0 10px rgba(255,112,67,${fire ? 0.4 : 0.2})` : 'none',
      animation: fire ? 'ds-fire-glow 1.2s ease-in-out infinite' : 'none',
      transition:'all .3s',
    }}>
      {emoji} {n}
    </span>
  );
}

// ── 21-day history dots ────────────────────────────────────
function HistoryDots({ history, color }: { history: { date: string; done: boolean }[]; color: string }) {
  return (
    <div style={{ display:'flex', gap:3, flexWrap:'wrap' as const, maxWidth:180 }}>
      {history.slice(-21).map((h, i) => (
        <div key={i} title={h.date} style={{
          width:9, height:9, borderRadius:3,
          background: h.done ? color : C.brd2,
          opacity: h.done ? 1 : 0.5,
        }} />
      ))}
    </div>
  );
}

// ── Color picker ───────────────────────────────────────────
function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div style={{ display:'flex', gap:6, flexWrap:'wrap' as const }}>
      {PRESET_COLORS.map(c => (
        <button key={c} onClick={() => onChange(c)} style={{
          width:24, height:24, borderRadius:6, background:c, border:`2px solid ${value===c ? '#fff' : 'transparent'}`,
          cursor:'pointer', outline:'none', padding:0, boxSizing:'border-box',
          boxShadow: value===c ? `0 0 0 2px ${c}` : 'none',
        }} />
      ))}
    </div>
  );
}

// ── Habit card ─────────────────────────────────────────────
function HabitCard({ habit, onToggle, onEdit, onDelete, loading }: {
  habit: Habit;
  onToggle: (id: string) => void;
  onEdit: (h: Habit) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false); }
    if (showMenu) document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [showMenu]);

  const done = habit.completedToday;

  // Confetti ao completar (não ao desmarcar)
  function handleToggle() {
    if (loading) return;
    if (!done && cardRef.current) {
      burstConfetti(cardRef.current, {
        colors: [habit.color, DS.ok, DS.accent, '#fff'],
        x: 30, y: 30,
      });
    }
    onToggle(habit.id);
  }

  return (
    <div ref={cardRef} style={{
      position:'relative',
      background: done ? `linear-gradient(135deg, ${habit.color}18, transparent 45%), var(--ds-glass-bg)` : 'var(--ds-glass-bg)',
      backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)',
      border: `1px solid ${done ? habit.color + '66' : 'var(--ds-glass-border)'}`,
      borderRadius:14, padding:'1.125rem',
      transition:'all .3s var(--ds-ease-smooth)',
      boxShadow: done ? `0 8px 32px rgba(0,0,0,.35), 0 0 0 1px ${habit.color}22, inset 0 0 40px ${habit.color}10` : 'var(--ds-glass-shadow)',
      overflow:'visible',
    }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:'1rem' }}>

        {/* Check button */}
        <button
          onClick={handleToggle}
          disabled={loading}
          title={done ? 'Desmarcar' : 'Marcar como feito hoje'}
          style={{
            width:46, height:46, borderRadius:'50%',
            border:`2px solid ${done ? habit.color : C.brd2}`,
            background: done ? habit.color : 'transparent',
            cursor: loading ? 'wait' : 'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'1.2rem', flexShrink:0,
            transition:'all .3s var(--ds-ease-spring)',
            transform: done ? 'scale(1.08)' : 'scale(1)',
            boxShadow: done ? `0 0 16px ${habit.color}66` : 'none',
          }}
        >
          {done ? '✓' : habit.icon}
        </button>

        {/* Content */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'.5rem', marginBottom:'.25rem', flexWrap:'wrap' }}>
            <span style={{ fontWeight:600, fontSize:'1rem', color: done ? habit.color : C.txt, transition:'color .2s' }}>{habit.title}</span>
            <StreakBadge n={habit.streak} />
          </div>
          {habit.description && (
            <p style={{ fontSize:'.8rem', color:C.mut, margin:'0 0 .5rem', lineHeight:1.4 }}>{habit.description}</p>
          )}
          <HistoryDots history={habit.history} color={habit.color} />
          <p style={{ fontSize:'.7rem', color:C.mut, marginTop:'.375rem' }}>
            {habit.totalDone} {habit.totalDone === 1 ? 'vez' : 'vezes'} no total
          </p>
        </div>

        {/* Menu */}
        <div ref={menuRef} style={{ position:'relative' }}>
          <button onClick={() => setShowMenu(v => !v)} style={{ background:'none', border:'none', cursor:'pointer', color:C.mut, padding:'.25rem .4rem', borderRadius:6, fontSize:'1rem', transition:'color .15s' }}>
            ···
          </button>
          {showMenu && (
            <div style={{ position:'absolute', right:0, top:'100%', background:'var(--ds-glass-bg-strong)', backdropFilter:'blur(16px)', border:`1px solid ${C.brd2}`, borderRadius:10, overflow:'hidden', zIndex:50, minWidth:140, boxShadow:'0 8px 24px rgba(0,0,0,.4)' }}>
              <button onClick={() => { onEdit(habit); setShowMenu(false); }}
                style={{ width:'100%', padding:'.625rem 1rem', background:'none', border:'none', color:C.txt, cursor:'pointer', fontSize:'.85rem', textAlign:'left' as const }}>
                ✏️ Editar
              </button>
              <button onClick={() => { onDelete(habit.id); setShowMenu(false); }}
                style={{ width:'100%', padding:'.625rem 1rem', background:'none', border:'none', color:C.err, cursor:'pointer', fontSize:'.85rem', textAlign:'left' as const }}>
                🗑️ Arquivar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Done overlay flash */}
      <div style={{
        position:'absolute', top:10, right:44, fontSize:'.72rem', color:habit.color, fontWeight:600,
        opacity: done ? 1 : 0, transform: done ? 'translateX(0)' : 'translateX(6px)',
        transition:'opacity .3s, transform .3s',
      }}>
        ✓ feito hoje
      </div>
    </div>
  );
}

// ── Habit form modal ───────────────────────────────────────
function HabitModal({ habit, onSave, onClose }: {
  habit?: Partial<Habit>;
  onSave: (data: Partial<Habit>) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    title:       habit?.title       || '',
    description: habit?.description || '',
    icon:        habit?.icon        || '✅',
    color:       habit?.color       || '#6c63ff',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  async function handleSave() {
    if (!form.title.trim()) { setErr('Dê um nome ao hábito'); return; }
    setSaving(true);
    try { await onSave(form); onClose(); }
    catch (e) { setErr((e as Error).message); setSaving(false); }
  }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:'1rem' }}>
      <div className="glass-strong ds-spring-in" style={{ width:'100%', maxWidth:440, padding:'1.75rem' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
          <h2 style={{ fontWeight:700, fontSize:'1.05rem', color:'var(--ds-text)' }}>{habit?.id ? 'Editar hábito' : 'Novo hábito'}</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', color:C.mut, cursor:'pointer', fontSize:'1.2rem' }}>×</button>
        </div>

        {err && <p style={{ color:C.err, fontSize:'.85rem', marginBottom:'.75rem', background:'rgba(255,77,106,.08)', padding:'.5rem .75rem', borderRadius:8 }}>{err}</p>}

        {/* Icon picker */}
        <label style={{ display:'block', fontSize:'.78rem', color:C.mut, marginBottom:'.375rem', fontWeight:500 }}>Ícone</label>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' as const, marginBottom:'1rem' }}>
          {PRESET_ICONS.map(icon => (
            <button key={icon} onClick={() => setForm(f => ({...f, icon}))}
              style={{ width:36, height:36, borderRadius:8, fontSize:'1.1rem', border:`2px solid ${form.icon===icon ? form.color : C.brd}`, background:form.icon===icon ? form.color+'22' : C.sur2, cursor:'pointer', transition:'all .15s' }}>
              {icon}
            </button>
          ))}
        </div>

        {/* Title */}
        <label style={{ display:'block', fontSize:'.78rem', color:C.mut, marginBottom:'.3rem', fontWeight:500 }}>Nome do hábito *</label>
        <input value={form.title} onChange={e => setForm(f => ({...f, title:e.target.value}))}
          placeholder="ex: Beber 2L de água"
          style={{ width:'100%', background:C.sur2, border:`1px solid ${C.brd}`, borderRadius:8, color:C.txt, padding:'.625rem .875rem', fontSize:'.9rem', fontFamily:'inherit', outline:'none', marginBottom:'.875rem', boxSizing:'border-box' as const }} />

        {/* Description */}
        <label style={{ display:'block', fontSize:'.78rem', color:C.mut, marginBottom:'.3rem', fontWeight:500 }}>Descrição (opcional)</label>
        <input value={form.description} onChange={e => setForm(f => ({...f, description:e.target.value}))}
          placeholder="ex: 8 copos por dia"
          style={{ width:'100%', background:C.sur2, border:`1px solid ${C.brd}`, borderRadius:8, color:C.txt, padding:'.625rem .875rem', fontSize:'.9rem', fontFamily:'inherit', outline:'none', marginBottom:'.875rem', boxSizing:'border-box' as const }} />

        {/* Color */}
        <label style={{ display:'block', fontSize:'.78rem', color:C.mut, marginBottom:'.375rem', fontWeight:500 }}>Cor</label>
        <div style={{ marginBottom:'1.25rem' }}>
          <ColorPicker value={form.color} onChange={color => setForm(f => ({...f, color}))} />
        </div>

        {/* Preview */}
        <div style={{ padding:'.75rem 1rem', borderRadius:10, background:C.sur2, border:`1px solid ${form.color}55`, display:'flex', alignItems:'center', gap:'.75rem', marginBottom:'1.25rem' }}>
          <div style={{ width:36, height:36, borderRadius:'50%', background:form.color+'33', border:`2px solid ${form.color}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem' }}>
            {form.icon}
          </div>
          <div>
            <p style={{ fontWeight:600, fontSize:'.9rem', color:C.txt }}>{form.title || 'Nome do hábito'}</p>
            {form.description && <p style={{ fontSize:'.75rem', color:C.mut }}>{form.description}</p>}
          </div>
        </div>

        <div style={{ display:'flex', gap:'.75rem' }}>
          <button onClick={handleSave} disabled={saving}
            style={{ flex:1, padding:'.75rem', borderRadius:10, border:'none', background:form.color, color:'#fff', fontWeight:600, cursor:saving?'wait':'pointer', fontSize:'.9rem', opacity:saving?.7:1 }}>
            {saving ? 'Salvando...' : habit?.id ? '✓ Salvar' : '+ Criar hábito'}
          </button>
          <button onClick={onClose}
            style={{ padding:'.75rem 1.25rem', borderRadius:10, border:`1px solid ${C.brd}`, background:'transparent', color:C.mut, cursor:'pointer', fontSize:'.9rem' }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Stats bar ──────────────────────────────────────────────
function StatsBar({ stats, total }: { stats: Stats; total: number }) {
  const pct = total > 0 ? Math.round((stats.doneToday / total) * 100) : 0;
  const allDone = stats.doneToday === total && total > 0;
  const bestRef = useRef<HTMLDivElement>(null);
  const totalRef = useRef<HTMLDivElement>(null);

  // Contagem animada quando stats mudam
  useEffect(() => {
    if (bestRef.current) countUp(bestRef.current, stats.bestStreak, { suffix: ' 🔥' });
    if (totalRef.current) countUp(totalRef.current, stats.totalCompletions);
  }, [stats.bestStreak, stats.totalCompletions]);

  return (
    <div style={{
      background:'var(--ds-glass-bg)',
      backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)',
      border:'1px solid var(--ds-glass-border)',
      borderRadius:14, padding:'1.25rem', marginBottom:'1.25rem',
      boxShadow:'var(--ds-glass-shadow)',
    }}>
      <div style={{ display:'flex', gap:'1.5rem', flexWrap:'wrap' as const, marginBottom:'1rem' }}>
        <div style={{ textAlign:'center' as const, flex:1, minWidth:70 }}>
          <div className={allDone ? 'ds-pop-in' : ''} style={{ fontSize:'1.375rem', fontWeight:700, color:allDone?C.ok:C.acc, lineHeight:1, textShadow: allDone ? `0 0 16px ${C.ok}66` : 'none' }}>{stats.doneToday}/{total}</div>
          <div style={{ fontSize:'.72rem', color:C.mut, marginTop:'.25rem', textTransform:'uppercase' as const, letterSpacing:'.04em' }}>Hoje</div>
        </div>
        <div style={{ textAlign:'center' as const, flex:1, minWidth:70 }}>
          <div ref={bestRef} style={{ fontSize:'1.375rem', fontWeight:700, color:'#ff7043', lineHeight:1 }}>0</div>
          <div style={{ fontSize:'.72rem', color:C.mut, marginTop:'.25rem', textTransform:'uppercase' as const, letterSpacing:'.04em' }}>Maior streak</div>
        </div>
        <div style={{ textAlign:'center' as const, flex:1, minWidth:70 }}>
          <div ref={totalRef} style={{ fontSize:'1.375rem', fontWeight:700, color:C.mut, lineHeight:1 }}>0</div>
          <div style={{ fontSize:'.72rem', color:C.mut, marginTop:'.25rem', textTransform:'uppercase' as const, letterSpacing:'.04em' }}>Total feitos</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ background:C.brd2, borderRadius:20, height:8, overflow:'hidden' }}>
        <div style={{
          height:'100%', borderRadius:20,
          background: allDone ? `linear-gradient(90deg,${C.ok},#38ef7d)` : `linear-gradient(90deg,${C.acc},#a78bfa)`,
          width:`${pct}%`, transition:'width .5s ease',
          boxShadow: allDone ? `0 0 8px ${C.ok}88` : `0 0 8px ${C.acc}44`,
        }} />
      </div>
      <p style={{ textAlign:'center' as const, fontSize:'.75rem', color:C.mut, marginTop:'.375rem' }}>
        {allDone ? '🎉 Todos os hábitos de hoje concluídos!' : `${pct}% do dia concluído`}
      </p>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────
function App() {
  const [habits, setHabits]     = useState<Habit[]>([]);
  const [stats, setStats]       = useState<Stats | null>(null);
  const [loading, setLoading]   = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editHabit, setEditHabit] = useState<Habit | undefined>(undefined);
  const [error, setError]       = useState('');
  const [view, setView]         = useState<'today' | 'stats'>('today');

  const today = new Date().toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long' });

  const load = useCallback(async () => {
    try {
      const [h, s] = await Promise.all([
        apiFetch<Habit[]>('/'),
        apiFetch<Stats>('/stats'),
      ]);
      setHabits(Array.isArray(h) ? h : []);
      setStats(s);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggle(id: string) {
    setToggling(id);
    try {
      const res = await apiFetch<{ completedToday: boolean; streak: number }>(`/${id}/complete`, { method:'POST', body: JSON.stringify({}) });
      setHabits(prev => prev.map(h =>
        h.id === id ? { ...h, completedToday: res.completedToday, streak: res.streak } : h
      ));
      // Refresh stats
      const s = await apiFetch<Stats>('/stats');
      setStats(s);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setToggling(null);
    }
  }

  async function saveHabit(data: Partial<Habit>) {
    if (editHabit?.id) {
      await apiFetch(`/${editHabit.id}`, { method:'PATCH', body: JSON.stringify(data) });
    } else {
      await apiFetch('/', { method:'POST', body: JSON.stringify(data) });
    }
    setEditHabit(undefined);
    await load();
  }

  async function deleteHabit(id: string) {
    if (!confirm('Arquivar este hábito?')) return;
    await apiFetch(`/${id}`, { method:'DELETE' });
    await load();
  }

  const donePct = habits.length > 0 ? Math.round((habits.filter(h => h.completedToday).length / habits.length) * 100) : 0;

  return (
    <div style={{ minHeight:'100vh', background:C.bg, color:C.txt, fontFamily:'Inter,system-ui,sans-serif' }}>
      {/* Header */}
      <div className="ds-app-header">
        <div className="ds-app-icon" style={{ background: APP.gradient }}>
          <AppIcon name="flame" size={16} color="#fff" />
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
          <span className="ds-app-title">Hábitos</span>
          <span className="ds-app-tag">/app7</span>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'.75rem' }}>
          {/* View toggle */}
          <div style={{ display:'flex', background:'var(--ds-surface-2)', border:'1px solid var(--ds-border)', borderRadius:8, overflow:'hidden', padding:2 }}>
            {(['today','stats'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                style={{ padding:'.35rem .875rem', border:'none', cursor:'pointer', fontSize:'.8rem', fontWeight:view===v?600:400, background:view===v?'var(--ds-accent)':'transparent', color:view===v?'#fff':'var(--ds-muted)', borderRadius:6, transition:'all .2s var(--ds-ease-smooth)' }}>
                {v === 'today' ? 'Hoje' : 'Progresso'}
              </button>
            ))}
          </div>
          <button onClick={() => { setEditHabit(undefined); setShowForm(true); }}
            style={{ background:'var(--ds-accent)', border:'none', borderRadius:8, color:'#fff', padding:'.45rem 1rem', fontSize:'.85rem', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:4, boxShadow:'0 4px 12px rgba(108,99,255,.35)', transition:'all .2s' }}>
            + Novo
          </button>
        </div>
      </div>

      <div style={{ maxWidth:640, margin:'0 auto', padding:'1.5rem 1rem' }}>
        {error && (
          <div style={{ padding:'.75rem 1rem', background:'rgba(255,77,106,.08)', border:`1px solid rgba(255,77,106,.3)`, borderRadius:10, color:C.err, fontSize:'.85rem', marginBottom:'1rem', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            {error.includes('401') || error.includes('token') ? '🔒 Faça login no App1 para usar os hábitos' : error}
            <button onClick={() => setError('')} style={{ background:'none', border:'none', color:C.err, cursor:'pointer' }}>×</button>
          </div>
        )}

        {view === 'today' && (
          <>
            {/* Date + progress */}
            <div style={{ marginBottom:'1.25rem' }}>
              <p style={{ fontSize:'.85rem', color:C.mut, textTransform:'capitalize' as const }}>{today}</p>
              <h1 style={{ fontSize:'1.5rem', fontWeight:700, marginTop:'.125rem' }}>
                {loading ? 'Carregando...' : habits.length === 0 ? 'Nenhum hábito ainda' :
                  donePct === 100 ? '🎉 Dia perfeito!' :
                  donePct >= 50 ? '💪 Mais da metade feito!' :
                  'O que você vai fazer hoje?'}
              </h1>
            </div>

            {stats && habits.length > 0 && <StatsBar stats={stats} total={habits.length} />}

            {/* Habits list */}
            {loading ? (
              <div className="ds-stagger" style={{ display:'flex', flexDirection:'column' as const, gap:'.875rem' }}>
                {[1,2,3].map(i => (
                  <div key={i} style={{ padding:'1.125rem', display:'flex', gap:'1rem', alignItems:'center' }}>
                    <div className="skeleton" style={{ width:46, height:46, borderRadius:'50%', flexShrink:0 }} />
                    <div style={{ flex:1 }}>
                      <div className="skeleton" style={{ height:14, width:'55%', marginBottom:8 }} />
                      <div className="skeleton" style={{ height:10, width:'80%' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : habits.length === 0 ? (
              <div className="ds-fade-up" style={{ textAlign:'center' as const, padding:'3rem 1.5rem', background:'var(--ds-glass-bg)', backdropFilter:'blur(16px)', borderRadius:14, border:'1px dashed var(--ds-border-2)', boxShadow:'var(--ds-glass-shadow)' }}>
                <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🌱</div>
                <h2 style={{ fontSize:'1.1rem', marginBottom:'.625rem' }}>Comece o seu primeiro hábito</h2>
                <p style={{ color:C.mut, fontSize:'.875rem', marginBottom:'1.5rem', lineHeight:1.6 }}>
                  Pequenas ações diárias constroem grandes resultados.<br/>Adicione um hábito simples para começar.
                </p>
                <div style={{ display:'flex', gap:'.625rem', justifyContent:'center', flexWrap:'wrap' as const, marginBottom:'1.5rem' }}>
                  {[['💧','Beber água'],['🏃','Exercitar'],['📚','Ler'],['🧘','Meditar'],['🛏️','Dormir cedo']].map(([icon,title]) => (
                    <button key={title} onClick={async () => { await apiFetch('/', { method:'POST', body: JSON.stringify({ title, icon, color:'#6c63ff' }) }); load(); }}
                      style={{ padding:'.5rem 1rem', borderRadius:20, background:'var(--ds-surface-2)', border:'1px solid var(--ds-border)', color:C.txt, cursor:'pointer', fontSize:'.85rem', display:'flex', alignItems:'center', gap:.4, transition:'all .2s' }}>
                      {icon} {title}
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowForm(true)} style={{ background:'var(--ds-accent)', border:'none', borderRadius:10, color:'#fff', padding:'.75rem 1.5rem', fontWeight:600, cursor:'pointer', boxShadow:'0 4px 16px rgba(108,99,255,.4)' }}>
                  + Criar meu primeiro hábito
                </button>
              </div>
            ) : (
              <div className="ds-stagger" style={{ display:'flex', flexDirection:'column' as const, gap:'.875rem' }}>
                {/* Not done first, then done */}
                {[...habits].sort((a,b) => Number(a.completedToday) - Number(b.completedToday)).map(h => (
                  <HabitCard key={h.id} habit={h}
                    onToggle={toggle} onEdit={h => { setEditHabit(h); setShowForm(true); }}
                    onDelete={deleteHabit} loading={toggling === h.id} />
                ))}
              </div>
            )}
          </>
        )}

        {view === 'stats' && stats && (
          <>
            <h1 className="ds-fade-up" style={{ fontSize:'1.5rem', fontWeight:700, marginBottom:'1.5rem' }}>Seu progresso</h1>

            {/* Summary cards */}
            <div className="ds-stagger" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.875rem', marginBottom:'1.5rem' }}>
              {[
                { label:'Hábitos ativos', value:stats.totalHabits, icon:'layers' as IconName, color:C.acc },
                { label:'Concluídos hoje', value:stats.doneToday, icon:'check' as IconName, color:C.ok },
                { label:'Total concluídos', value:stats.totalCompletions, icon:'award' as IconName, color:'#ffb347' },
                { label:'Melhor sequência', value:`${stats.bestStreak} dias`, icon:'flame' as IconName, color:'#ff7043' },
              ].map(s => (
                <div key={s.label} className="glass-card glass-card-hover" style={{ padding:'1.125rem' }}>
                  <div style={{ marginBottom:'.375rem' }}><AppIcon name={s.icon} size={24} color={s.color} /></div>
                  <div style={{ fontSize:'1.5rem', fontWeight:700, color:s.color, lineHeight:1, textShadow: s.color === C.ok ? `0 0 20px ${C.ok}55` : 'none' }}>{s.value}</div>
                  <div style={{ fontSize:'.75rem', color:C.mut, marginTop:'.25rem' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Week chart */}
            <div className="glass-card" style={{ padding:'1.375rem', marginBottom:'1.5rem' }}>
              <h3 style={{ fontSize:'.9rem', fontWeight:600, marginBottom:'1.125rem', color:C.mut, textTransform:'uppercase' as const, letterSpacing:'.05em' }}>Últimos 7 dias</h3>
              <div style={{ display:'flex', gap:'.5rem', alignItems:'flex-end', height:80 }}>
                {stats.weekChart.map((d, i) => {
                  const pct = d.total > 0 ? d.done / d.total : 0;
                  const isToday = i === stats.weekChart.length - 1;
                  return (
                    <div key={d.date} style={{ flex:1, display:'flex', flexDirection:'column' as const, alignItems:'center', gap:'.25rem' }}>
                      <div style={{ width:'100%', background:C.brd2, borderRadius:4, height:60, display:'flex', alignItems:'flex-end', overflow:'hidden' }}>
                        <div style={{ width:'100%', height:`${Math.max(pct*100, pct>0?8:0)}%`, background: isToday ? `linear-gradient(180deg,${C.acc},#a78bfa)` : C.acc+'77', borderRadius:4, transition:'height .6s ease', boxShadow: isToday&&pct>0 ? `0 0 8px ${C.acc}66` : 'none' }} />
                      </div>
                      <span style={{ fontSize:'.68rem', color: isToday ? C.acc : C.mut, fontWeight: isToday ? 600 : 400 }}>{d.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Habits streaks table */}
            {habits.length > 0 && (
              <div style={{ background:C.sur, border:`1px solid ${C.brd}`, borderRadius:14, overflow:'hidden' }}>
                <div style={{ padding:'1rem 1.375rem', borderBottom:`1px solid ${C.brd}`, fontSize:'.82rem', fontWeight:600, color:C.mut, textTransform:'uppercase' as const, letterSpacing:'.05em' }}>
                  Hábitos e sequências
                </div>
                {[...habits].sort((a,b) => b.streak - a.streak).map((h, i) => (
                  <div key={h.id} style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'1rem 1.375rem', borderBottom: i < habits.length-1 ? `1px solid ${C.brd}` : 'none' }}>
                    <span style={{ fontSize:'1.25rem', width:32, textAlign:'center' as const }}>{h.icon}</span>
                    <div style={{ flex:1 }}>
                      <p style={{ fontWeight:500, fontSize:'.9rem' }}>{h.title}</p>
                      <HistoryDots history={h.history.slice(-14)} color={h.color} />
                    </div>
                    <StreakBadge n={h.streak} size="md" />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <HabitModal habit={editHabit} onSave={saveHabit} onClose={() => { setShowForm(false); setEditHabit(undefined); }} />
      )}

      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{-webkit-font-smoothing:antialiased;font-family:'Inter',system-ui,sans-serif}
        input:focus{border-color:${C.acc}!important;outline:none;box-shadow:0 0 0 3px rgba(108,99,255,.2)}
        button:hover:not(:disabled){opacity:.88}
        @media(max-width:480px){h1{font-size:1.25rem!important}}
        @keyframes ds-fire-glow{
          0%,100%{box-shadow:0 0 8px rgba(255,112,67,.2)}
          50%{box-shadow:0 0 18px rgba(255,112,67,.5)}
        }
      `}</style>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
