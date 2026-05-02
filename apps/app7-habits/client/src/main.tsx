import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom/client';

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

// ── Design tokens ──────────────────────────────────────────
const C = {
  bg: '#0a0a0f', sur: '#111118', sur2: '#1a1a24', brd: '#2a2a38', brd2: '#3a3a4e',
  txt: '#e8e8f0', mut: '#8888a8', acc: '#6c63ff', ok: '#00d4aa',
  err: '#ff4d6a', wrn: '#ffb347',
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
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:2, fontWeight:700, fontSize:fs, color:'#ff7043', background:'rgba(255,112,67,.12)', padding:'2px 8px', borderRadius:20, border:'1px solid rgba(255,112,67,.25)' }}>
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
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false); }
    if (showMenu) document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [showMenu]);

  const done = habit.completedToday;

  return (
    <div style={{
      background: C.sur, border: `1px solid ${done ? habit.color + '55' : C.brd}`,
      borderRadius:14, padding:'1.125rem', transition:'all .2s',
      boxShadow: done ? `0 0 0 1px ${habit.color}33, inset 0 0 40px ${habit.color}08` : 'none',
      position:'relative',
    }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:'1rem' }}>

        {/* Check button */}
        <button
          onClick={() => !loading && onToggle(habit.id)}
          disabled={loading}
          title={done ? 'Desmarcar' : 'Marcar como feito hoje'}
          style={{
            width:44, height:44, borderRadius:'50%', border:`2px solid ${done ? habit.color : C.brd2}`,
            background: done ? habit.color : 'transparent',
            cursor: loading ? 'wait' : 'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'1.2rem', flexShrink:0, transition:'all .25s',
            transform: done ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          {done ? '✓' : habit.icon}
        </button>

        {/* Content */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'.5rem', marginBottom:'.25rem', flexWrap:'wrap' }}>
            <span style={{ fontWeight:600, fontSize:'1rem', color: done ? habit.color : C.txt }}>{habit.title}</span>
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
          <button onClick={() => setShowMenu(v => !v)} style={{ background:'none', border:'none', cursor:'pointer', color:C.mut, padding:'.25rem .4rem', borderRadius:6, fontSize:'1rem' }}>
            ···
          </button>
          {showMenu && (
            <div style={{ position:'absolute', right:0, top:'100%', background:C.sur2, border:`1px solid ${C.brd2}`, borderRadius:10, overflow:'hidden', zIndex:50, minWidth:140, boxShadow:'0 8px 24px rgba(0,0,0,.4)' }}>
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
      {done && (
        <div style={{ position:'absolute', top:10, right:44, fontSize:'.72rem', color:habit.color, fontWeight:600, opacity:.8 }}>
          ✓ feito hoje
        </div>
      )}
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
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:'1rem' }}>
      <div style={{ background:C.sur, border:`1px solid ${C.brd}`, borderRadius:14, width:'100%', maxWidth:440, padding:'1.75rem' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
          <h2 style={{ fontWeight:700, fontSize:'1.05rem' }}>{habit?.id ? 'Editar hábito' : 'Novo hábito'}</h2>
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

  return (
    <div style={{ background:C.sur, border:`1px solid ${C.brd}`, borderRadius:14, padding:'1.25rem', marginBottom:'1.25rem' }}>
      <div style={{ display:'flex', gap:'1.5rem', flexWrap:'wrap' as const, marginBottom:'1rem' }}>
        {[
          { label:'Hoje', value:`${stats.doneToday}/${total}`, color:allDone?C.ok:C.acc },
          { label:'Maior streak', value:`${stats.bestStreak}🔥`, color:'#ff7043' },
          { label:'Total feitos', value:stats.totalCompletions.toString(), color:C.mut },
        ].map(s => (
          <div key={s.label} style={{ textAlign:'center' as const, flex:1, minWidth:70 }}>
            <div style={{ fontSize:'1.375rem', fontWeight:700, color:s.color, lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:'.72rem', color:C.mut, marginTop:'.25rem', textTransform:'uppercase' as const, letterSpacing:'.04em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ background:C.brd2, borderRadius:20, height:8, overflow:'hidden' }}>
        <div style={{
          height:'100%', borderRadius:20,
          background: allDone ? `linear-gradient(90deg,${C.ok},#38ef7d)` : `linear-gradient(90deg,${C.acc},#a78bfa)`,
          width:`${pct}%`, transition:'width .5s ease',
          boxShadow: allDone ? `0 0 8px ${C.ok}88` : 'none',
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
      <div style={{ background:C.sur, borderBottom:`1px solid ${C.brd}`, padding:'.875rem 1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'.75rem' }}>
          <div style={{ width:34, height:34, borderRadius:9, background:'linear-gradient(135deg,#6c63ff,#a78bfa)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem' }}>
            🔥
          </div>
          <div>
            <span style={{ fontWeight:700, fontSize:'.9rem' }}>Hábitos</span>
            <span style={{ fontFamily:'monospace', fontSize:'.7rem', color:C.mut, marginLeft:6 }}>/app7</span>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'.75rem' }}>
          {/* View toggle */}
          <div style={{ display:'flex', background:C.sur2, border:`1px solid ${C.brd}`, borderRadius:8, overflow:'hidden' }}>
            {(['today','stats'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                style={{ padding:'.35rem .875rem', border:'none', cursor:'pointer', fontSize:'.8rem', fontWeight:view===v?600:400, background:view===v?C.acc:'transparent', color:view===v?'#fff':C.mut, transition:'all .15s' }}>
                {v === 'today' ? 'Hoje' : 'Progresso'}
              </button>
            ))}
          </div>
          <button onClick={() => { setEditHabit(undefined); setShowForm(true); }}
            style={{ background:C.acc, border:'none', borderRadius:8, color:'#fff', padding:'.4rem 1rem', fontSize:'.85rem', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
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
              <div style={{ textAlign:'center' as const, padding:'3rem', color:C.mut }}>
                <div style={{ fontSize:'2rem', marginBottom:'.75rem' }}>⏳</div>
                Carregando hábitos...
              </div>
            ) : habits.length === 0 ? (
              <div style={{ textAlign:'center' as const, padding:'3rem 1.5rem', background:C.sur, borderRadius:14, border:`1px dashed ${C.brd2}` }}>
                <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🌱</div>
                <h2 style={{ fontSize:'1.1rem', marginBottom:'.625rem' }}>Comece o seu primeiro hábito</h2>
                <p style={{ color:C.mut, fontSize:'.875rem', marginBottom:'1.5rem', lineHeight:1.6 }}>
                  Pequenas ações diárias constroem grandes resultados.<br/>Adicione um hábito simples para começar.
                </p>
                <div style={{ display:'flex', gap:'.625rem', justifyContent:'center', flexWrap:'wrap' as const, marginBottom:'1.5rem' }}>
                  {[['💧','Beber água'],['🏃','Exercitar'],['📚','Ler'],['🧘','Meditar'],['🛏️','Dormir cedo']].map(([icon,title]) => (
                    <button key={title} onClick={async () => { await apiFetch('/', { method:'POST', body: JSON.stringify({ title, icon, color:'#6c63ff' }) }); load(); }}
                      style={{ padding:'.5rem 1rem', borderRadius:20, background:C.sur2, border:`1px solid ${C.brd}`, color:C.txt, cursor:'pointer', fontSize:'.85rem', display:'flex', alignItems:'center', gap:.4 }}>
                      {icon} {title}
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowForm(true)} style={{ background:C.acc, border:'none', borderRadius:10, color:'#fff', padding:'.75rem 1.5rem', fontWeight:600, cursor:'pointer' }}>
                  + Criar meu primeiro hábito
                </button>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column' as const, gap:'.875rem' }}>
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
            <h1 style={{ fontSize:'1.5rem', fontWeight:700, marginBottom:'1.5rem' }}>Seu progresso</h1>

            {/* Summary cards */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.875rem', marginBottom:'1.5rem' }}>
              {[
                { label:'Hábitos ativos', value:stats.totalHabits, icon:'📋', color:C.acc },
                { label:'Concluídos hoje', value:stats.doneToday, icon:'✅', color:C.ok },
                { label:'Total concluídos', value:stats.totalCompletions, icon:'🏆', color:'#ffb347' },
                { label:'Melhor sequência', value:`${stats.bestStreak} dias`, icon:'🔥', color:'#ff7043' },
              ].map(s => (
                <div key={s.label} style={{ background:C.sur, border:`1px solid ${C.brd}`, borderRadius:12, padding:'1.125rem' }}>
                  <div style={{ fontSize:'1.5rem', marginBottom:'.375rem' }}>{s.icon}</div>
                  <div style={{ fontSize:'1.5rem', fontWeight:700, color:s.color, lineHeight:1 }}>{s.value}</div>
                  <div style={{ fontSize:'.75rem', color:C.mut, marginTop:'.25rem' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Week chart */}
            <div style={{ background:C.sur, border:`1px solid ${C.brd}`, borderRadius:14, padding:'1.375rem', marginBottom:'1.5rem' }}>
              <h3 style={{ fontSize:'.9rem', fontWeight:600, marginBottom:'1.125rem', color:C.mut, textTransform:'uppercase' as const, letterSpacing:'.05em' }}>Últimos 7 dias</h3>
              <div style={{ display:'flex', gap:'.5rem', alignItems:'flex-end', height:80 }}>
                {stats.weekChart.map((d, i) => {
                  const pct = d.total > 0 ? d.done / d.total : 0;
                  const isToday = i === stats.weekChart.length - 1;
                  return (
                    <div key={d.date} style={{ flex:1, display:'flex', flexDirection:'column' as const, alignItems:'center', gap:'.25rem' }}>
                      <div style={{ width:'100%', background:C.brd2, borderRadius:4, height:60, display:'flex', alignItems:'flex-end', overflow:'hidden' }}>
                        <div style={{ width:'100%', height:`${Math.max(pct*100, pct>0?8:0)}%`, background: isToday ? `linear-gradient(180deg,${C.acc},#a78bfa)` : C.acc+'77', borderRadius:4, transition:'height .4s ease', boxShadow: isToday&&pct>0 ? `0 0 8px ${C.acc}66` : 'none' }} />
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
        body{-webkit-font-smoothing:antialiased}
        input:focus{border-color:${C.acc}!important;outline:none;box-shadow:0 0 0 3px rgba(108,99,255,.2)}
        button:hover:not(:disabled){opacity:.88}
        @media(max-width:480px){h1{font-size:1.25rem!important}}
      `}</style>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
