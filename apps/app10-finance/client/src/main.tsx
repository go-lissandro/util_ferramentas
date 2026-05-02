import React, { useState, useMemo } from 'react';
import ReactDOM from 'react-dom/client';

const C = {
  bg: '#0a0a0f', sur: '#111118', sur2: '#1a1a24', brd: '#2a2a38', brd2: '#3a3a4e',
  txt: '#e8e8f0', mut: '#8888a8', acc: '#6c63ff', ok: '#00d4aa', err: '#ff4d6a', wrn: '#ffb347',
};

type Calc = 'compound' | 'loan' | 'retirement' | 'emergency' | 'savings_goal' | 'inflation';

const CALCS: { key: Calc; icon: string; label: string; desc: string }[] = [
  { key: 'compound',    icon: '📈', label: 'Juros Compostos',     desc: 'Veja seu dinheiro crescer' },
  { key: 'loan',        icon: '🏦', label: 'Simulador de Parcela', desc: 'Empréstimos e financiamentos' },
  { key: 'retirement',  icon: '🏖️', label: 'Aposentadoria',       desc: 'Quanto poupar por mês' },
  { key: 'emergency',   icon: '🛡️', label: 'Reserva de Emergência', desc: 'Quanto você precisa' },
  { key: 'savings_goal',icon: '🎯', label: 'Meta de Poupança',     desc: 'Prazo para atingir um objetivo' },
  { key: 'inflation',   icon: '📉', label: 'Impacto da Inflação',  desc: 'Poder de compra ao longo do tempo' },
];

const fmt = (v: number, prefix = 'R$') =>
  `${prefix} ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtInt = (v: number) => v.toLocaleString('pt-BR');

function inp(extra?: React.CSSProperties): React.CSSProperties {
  return {
    width: '100%', background: C.sur2, border: `1px solid ${C.brd}`,
    borderRadius: 8, color: C.txt, padding: '.6rem .875rem',
    fontSize: '.9rem', fontFamily: 'inherit', outline: 'none',
    boxSizing: 'border-box' as const, ...extra,
  };
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ marginBottom: '.875rem' }}>
      <label style={{ display: 'block', fontSize: '.8rem', color: C.mut, fontWeight: 500, marginBottom: '.3rem' }}>{label}</label>
      {children}
      {hint && <p style={{ fontSize: '.72rem', color: C.mut, marginTop: '.25rem' }}>{hint}</p>}
    </div>
  );
}

function ResultCard({ label, value, highlight, sub }: { label: string; value: string; highlight?: boolean; sub?: string }) {
  return (
    <div style={{ background: highlight ? 'rgba(108,99,255,.08)' : C.sur2, border: `1px solid ${highlight ? 'rgba(108,99,255,.3)' : C.brd}`, borderRadius: 10, padding: '1rem', textAlign: 'center' as const }}>
      <div style={{ fontSize: '.72rem', color: C.mut, textTransform: 'uppercase' as const, letterSpacing: '.05em', marginBottom: '.375rem' }}>{label}</div>
      <div style={{ fontSize: highlight ? '1.5rem' : '1.25rem', fontWeight: 700, color: highlight ? C.acc : C.txt }}>{value}</div>
      {sub && <div style={{ fontSize: '.72rem', color: C.mut, marginTop: '.2rem' }}>{sub}</div>}
    </div>
  );
}

// ── Compound Interest ─────────────────────────────────────
function CompoundCalc() {
  const [principal, setPrincipal] = useState(10000);
  const [monthly,   setMonthly]   = useState(500);
  const [rate,      setRate]      = useState(12);
  const [years,     setYears]     = useState(10);

  const result = useMemo(() => {
    const r  = rate / 100 / 12;
    const n  = years * 12;
    const fv = principal * Math.pow(1+r, n) + monthly * ((Math.pow(1+r,n)-1)/r);
    const invested = principal + monthly * n;
    const interest = fv - invested;
    // Build chart data (yearly)
    const chart: { year: number; total: number; invested: number }[] = [];
    for (let y = 0; y <= years; y++) {
      const m = y * 12;
      const t = principal * Math.pow(1+r,m) + (r > 0 ? monthly * ((Math.pow(1+r,m)-1)/r) : monthly*m);
      chart.push({ year: y, total: t, invested: principal + monthly * m });
    }
    return { fv, invested, interest, chart };
  }, [principal, monthly, rate, years]);

  const maxVal = result.chart[result.chart.length - 1]?.total || 1;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
        <Field label="Investimento inicial (R$)">
          <input style={inp()} type="number" value={principal} min={0} onChange={e => setPrincipal(Number(e.target.value))} />
        </Field>
        <Field label="Aporte mensal (R$)">
          <input style={inp()} type="number" value={monthly} min={0} onChange={e => setMonthly(Number(e.target.value))} />
        </Field>
        <Field label="Taxa de juros anual (%)" hint="CDI atual ≈ 10.5% | Tesouro Selic ≈ 10.65%">
          <input style={inp()} type="number" value={rate} step={0.1} min={0.1} onChange={e => setRate(Number(e.target.value))} />
        </Field>
        <Field label="Período (anos)">
          <input style={{ ...inp(), padding: ".5rem 0" }} type="range" min={1} max={40} value={years} onChange={e => setYears(Number(e.target.value))} />
          <p style={{ fontSize: '.8rem', color: C.txt, marginTop: '.25rem', fontWeight: 600 }}>{years} anos</p>
        </Field>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '.75rem', marginBottom: '1.25rem' }}>
        <ResultCard label="Total acumulado" value={fmt(result.fv)} highlight />
        <ResultCard label="Valor investido" value={fmt(result.invested)} />
        <ResultCard label="Juros ganhos" value={fmt(result.interest)} sub={`${Math.round(result.interest/result.invested*100)}% do investido`} />
      </div>

      {/* Simple bar chart */}
      <div style={{ background: C.sur2, borderRadius: 10, padding: '1rem' }}>
        <p style={{ fontSize: '.78rem', color: C.mut, marginBottom: '.75rem', fontWeight: 600 }}>Evolução do patrimônio</p>
        <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 100 }}>
          {result.chart.filter((_,i) => i % Math.max(1, Math.floor(result.chart.length/12)) === 0).map((d, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, gap: 2 }}>
              <div style={{ width: '100%', height: Math.round(d.total/maxVal*90), background: `linear-gradient(180deg,${C.acc},#a78bfa)`, borderRadius: '3px 3px 0 0', minHeight: 2 }} />
              <div style={{ width: '100%', height: Math.round(d.invested/maxVal*90), background: C.brd2, borderRadius: '3px 3px 0 0', minHeight: 2, marginTop: -Math.round(d.invested/maxVal*90)-2 }} />
              <span style={{ fontSize: '.62rem', color: C.mut, textAlign: 'center' as const }}>{d.year}a</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '.5rem' }}>
          <span style={{ fontSize: '.72rem', color: C.mut, display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, background: C.acc, borderRadius: 2, display: 'inline-block' }} />Total</span>
          <span style={{ fontSize: '.72rem', color: C.mut, display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, background: C.brd2, borderRadius: 2, display: 'inline-block' }} />Investido</span>
        </div>
      </div>
    </div>
  );
}

// ── Loan Calculator ───────────────────────────────────────
function LoanCalc() {
  const [amount,  setAmount]  = useState(50000);
  const [rate,    setRate]    = useState(1.5);
  const [months,  setMonths]  = useState(48);

  const result = useMemo(() => {
    const r = rate / 100;
    const pmt = r === 0 ? amount / months : amount * r * Math.pow(1+r, months) / (Math.pow(1+r,months)-1);
    const total = pmt * months;
    const interest = total - amount;
    const table = Array.from({ length: Math.min(months, 12) }, (_, i) => {
      const bal = amount * Math.pow(1+r, i+1) - pmt * ((Math.pow(1+r,i+1)-1)/r);
      return { month: i+1, pmt, interest: amount * r * Math.pow(1+r,i) - pmt * (Math.pow(1+r,i)-1), balance: Math.max(0, bal) };
    });
    return { pmt, total, interest, table };
  }, [amount, rate, months]);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
        <Field label="Valor do empréstimo (R$)">
          <input style={inp()} type="number" value={amount} min={100} onChange={e => setAmount(Number(e.target.value))} />
        </Field>
        <Field label="Taxa de juros mensal (%)" hint="Banco ≈ 1.5–4% | Crédito consignado ≈ 1.5–2%">
          <input style={inp()} type="number" value={rate} step={0.1} min={0.1} onChange={e => setRate(Number(e.target.value))} />
        </Field>
        <Field label="Prazo (meses)">
          <input style={{ ...inp(), padding: ".5rem 0" }} type="range" min={6} max={360} value={months} onChange={e => setMonths(Number(e.target.value))} />
          <p style={{ fontSize: '.8rem', color: C.txt, marginTop: '.25rem', fontWeight: 600 }}>{months} meses ({(months/12).toFixed(1)} anos)</p>
        </Field>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '.75rem', marginBottom: '1.25rem' }}>
        <ResultCard label="Parcela mensal" value={fmt(result.pmt)} highlight />
        <ResultCard label="Total a pagar" value={fmt(result.total)} />
        <ResultCard label="Total em juros" value={fmt(result.interest)} sub={`${Math.round(result.interest/amount*100)}% do empréstimo`} />
      </div>

      <div style={{ background: 'rgba(255,77,106,.07)', border: `1px solid rgba(255,77,106,.2)`, borderRadius: 10, padding: '.875rem 1rem', fontSize: '.82rem', color: C.mut, lineHeight: 1.6 }}>
        ⚠️ Você pagará <strong style={{ color: C.err }}>{fmt(result.interest)}</strong> a mais do que pegou emprestado. Considere antecipar parcelas quando possível.
      </div>
    </div>
  );
}

// ── Retirement ────────────────────────────────────────────
function RetirementCalc() {
  const [currentAge, setCurrentAge] = useState(30);
  const [retireAge,  setRetireAge]  = useState(65);
  const [monthly,    setMonthly]    = useState(5000);
  const [saved,      setSaved]      = useState(20000);
  const [rate,       setRate]       = useState(8);

  const result = useMemo(() => {
    const years = retireAge - currentAge;
    const r     = rate / 100 / 12;
    const n     = years * 12;
    // How much we need at retirement (25x annual expenses — 4% rule)
    const needed = monthly * 12 * 25;
    // Current savings grown
    const savedGrown = saved * Math.pow(1+r, n);
    // Gap to fill with monthly contributions
    const gap = Math.max(0, needed - savedGrown);
    const contribution = r > 0 ? gap * r / (Math.pow(1+r,n)-1) : gap/n;
    // With current savings only
    const finalWithSaved = savedGrown;
    return { needed, savedGrown, gap, contribution, years, finalWithSaved };
  }, [currentAge, retireAge, monthly, saved, rate]);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
        <Field label="Sua idade atual"><input style={inp()} type="number" value={currentAge} min={18} max={80} onChange={e => setCurrentAge(Number(e.target.value))} /></Field>
        <Field label="Idade de aposentadoria"><input style={inp()} type="number" value={retireAge} min={currentAge+1} max={90} onChange={e => setRetireAge(Number(e.target.value))} /></Field>
        <Field label="Renda mensal desejada (R$)" hint="Quanto quer gastar por mês na aposentadoria">
          <input style={inp()} type="number" value={monthly} min={500} onChange={e => setMonthly(Number(e.target.value))} />
        </Field>
        <Field label="Já tenho poupado (R$)"><input style={inp()} type="number" value={saved} min={0} onChange={e => setSaved(Number(e.target.value))} /></Field>
        <Field label="Rentabilidade anual esperada (%)" hint="IPCA+5% ≈ 10-12% historicamente">
          <input style={inp()} type="number" value={rate} step={0.5} min={1} onChange={e => setRate(Number(e.target.value))} />
        </Field>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '.75rem', marginBottom: '1rem' }}>
        <ResultCard label="Patrimônio necessário" value={fmt(result.needed)} highlight sub="Regra dos 4% (25× renda anual)" />
        <ResultCard label="Aporte mensal necessário" value={fmt(result.contribution)} highlight />
        <ResultCard label="Tempo restante" value={`${result.years} anos`} />
        <ResultCard label="Poupança atual cresce para" value={fmt(result.savedGrown)} />
      </div>

      <div style={{ background: C.sur2, borderRadius: 10, padding: '1rem', fontSize: '.82rem', color: C.mut, lineHeight: 1.7 }}>
        💡 <strong style={{ color: C.txt }}>Regra dos 4%:</strong> Um patrimônio bem investido permite sacar 4% ao ano indefinidamente. Para {fmt(monthly)}/mês = {fmt(monthly*12)}/ano, você precisa de <strong style={{ color: C.acc }}>{fmt(result.needed)}</strong> investidos.
      </div>
    </div>
  );
}

// ── Emergency Fund ────────────────────────────────────────
function EmergencyCalc() {
  const [expenses, setExpenses] = useState(4500);
  const [months,   setMonths]   = useState(6);
  const [hasSaved, setHasSaved] = useState(5000);
  const [monthly,  setMonthly]  = useState(500);

  const target   = expenses * months;
  const gap      = Math.max(0, target - hasSaved);
  const mNeeded  = gap > 0 ? Math.ceil(gap / monthly) : 0;
  const pct      = Math.min(100, Math.round(hasSaved / target * 100));

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
        <Field label="Gastos mensais (R$)" hint="Aluguel, comida, contas, transporte...">
          <input style={inp()} type="number" value={expenses} min={100} onChange={e => setExpenses(Number(e.target.value))} />
        </Field>
        <Field label="Meses de proteção" hint="Recomendado: 6 meses para empregado CLT, 12 para autônomo">
          <input style={{ ...inp(), padding: '.5rem 0' }} type="range" min={3} max={24} value={months} onChange={e => setMonths(Number(e.target.value))} />
          <p style={{ fontSize: '.8rem', color: C.txt, fontWeight: 600, marginTop: '.25rem' }}>{months} meses</p>
        </Field>
        <Field label="Já tenho guardado (R$)"><input style={inp()} type="number" value={hasSaved} min={0} onChange={e => setHasSaved(Number(e.target.value))} /></Field>
        <Field label="Consigo guardar por mês (R$)"><input style={inp()} type="number" value={monthly} min={0} onChange={e => setMonthly(Number(e.target.value))} /></Field>
      </div>

      <ResultCard label="Meta da reserva" value={fmt(target)} highlight />

      <div style={{ margin: '.875rem 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.78rem', color: C.mut, marginBottom: '.375rem' }}>
          <span>Progresso: {fmt(hasSaved)}</span><span>{pct}%</span>
        </div>
        <div style={{ background: C.brd2, borderRadius: 20, height: 12, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? `linear-gradient(90deg,${C.ok},#38ef7d)` : `linear-gradient(90deg,${C.acc},#a78bfa)`, borderRadius: 20, transition: 'width .5s', boxShadow: pct >= 100 ? `0 0 8px ${C.ok}88` : 'none' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem', marginBottom: '1rem' }}>
        <ResultCard label="Falta juntar" value={gap > 0 ? fmt(gap) : 'Meta atingida! 🎉'} />
        <ResultCard label="Tempo estimado" value={gap > 0 ? `${mNeeded} meses` : '✓ Completo'} sub={mNeeded > 0 ? `≈ ${(mNeeded/12).toFixed(1)} anos` : undefined} />
      </div>

      <div style={{ background: pct >= 100 ? 'rgba(0,212,170,.07)' : 'rgba(255,179,71,.07)', border: `1px solid ${pct >= 100 ? 'rgba(0,212,170,.3)' : 'rgba(255,179,71,.3)'}`, borderRadius: 10, padding: '.875rem', fontSize: '.82rem', color: C.mut, lineHeight: 1.6 }}>
        {pct >= 100 ? '🎉 Parabéns! Sua reserva está completa. Considere investir o valor excedente.' : `🛡️ A reserva de emergência é o primeiro passo antes de qualquer investimento. Mantenha em renda fixa de alta liquidez (CDB, Tesouro Selic).`}
      </div>
    </div>
  );
}

// ── Savings Goal ──────────────────────────────────────────
function SavingsGoalCalc() {
  const [goal,    setGoal]    = useState(50000);
  const [hasSaved,setHasSaved]= useState(5000);
  const [monthly, setMonthly] = useState(1000);
  const [rate,    setRate]    = useState(10);

  const result = useMemo(() => {
    const gap = goal - hasSaved;
    if (gap <= 0) return { months: 0, total: hasSaved, interest: 0 };
    const r = rate / 100 / 12;
    // n = log(1 + gap*r/monthly) / log(1+r)
    const n = r > 0 ? Math.log(1 + gap * r / monthly) / Math.log(1+r) : gap / monthly;
    const months = Math.ceil(n);
    const total  = hasSaved * Math.pow(1+r, months) + monthly * ((Math.pow(1+r,months)-1)/r);
    return { months, total, interest: total - hasSaved - monthly*months };
  }, [goal, hasSaved, monthly, rate]);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
        <Field label="Meta (R$)"><input style={inp()} type="number" value={goal} min={100} onChange={e => setGoal(Number(e.target.value))} /></Field>
        <Field label="Já tenho (R$)"><input style={inp()} type="number" value={hasSaved} min={0} onChange={e => setHasSaved(Number(e.target.value))} /></Field>
        <Field label="Aporte mensal (R$)"><input style={inp()} type="number" value={monthly} min={1} onChange={e => setMonthly(Number(e.target.value))} /></Field>
        <Field label="Rentabilidade anual (%)" hint="CDB ≈ 10-11% | LCI/LCA ≈ 9-10%">
          <input style={inp()} type="number" value={rate} step={0.5} min={0} onChange={e => setRate(Number(e.target.value))} />
        </Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '.75rem' }}>
        <ResultCard label="Prazo estimado" value={result.months === 0 ? 'Já atingiu!' : `${result.months} meses`} highlight sub={result.months > 0 ? `${(result.months/12).toFixed(1)} anos` : undefined} />
        <ResultCard label="Total acumulado" value={fmt(result.total)} />
        <ResultCard label="Ganho com juros" value={fmt(Math.max(0,result.interest))} />
      </div>
    </div>
  );
}

// ── Inflation ─────────────────────────────────────────────
function InflationCalc() {
  const [amount,    setAmount]    = useState(1000);
  const [inflation, setInflation] = useState(4.5);
  const [years,     setYears]     = useState(10);

  const result = useMemo(() => {
    const future  = amount * Math.pow(1 + inflation/100, years);
    const buyPow  = amount / Math.pow(1 + inflation/100, years);
    const lostPct = Math.round((1 - buyPow/amount) * 100);
    const table = [1,2,5,10,20,30].filter(y => y <= years + 5).map(y => ({
      year: y, value: amount / Math.pow(1+inflation/100, y), cost: amount * Math.pow(1+inflation/100, y),
    }));
    return { future, buyPow, lostPct, table };
  }, [amount, inflation, years]);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '.75rem' }}>
        <Field label="Valor atual (R$)"><input style={inp()} type="number" value={amount} min={1} onChange={e => setAmount(Number(e.target.value))} /></Field>
        <Field label="Inflação anual (%)" hint="Meta BACEN 2024: 3% | IPCA 2023: 4.62%">
          <input style={inp()} type="number" value={inflation} step={0.1} min={0} onChange={e => setInflation(Number(e.target.value))} />
        </Field>
        <Field label="Anos">
          <input style={{ ...inp(), padding: '.5rem 0' }} type="range" min={1} max={50} value={years} onChange={e => setYears(Number(e.target.value))} />
          <p style={{ fontSize: '.8rem', color: C.txt, fontWeight: 600, marginTop: '.25rem' }}>{years} anos</p>
        </Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '.75rem', marginBottom: '1rem' }}>
        <ResultCard label={`O mesmo produto custará (em ${years}a)`} value={fmt(result.future)} highlight />
        <ResultCard label="Poder de compra de hoje" value={fmt(result.buyPow)} sub="em moeda de hoje" />
        <ResultCard label="Perda do poder de compra" value={`${result.lostPct}%`} />
      </div>
      <div style={{ background: C.sur2, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '.75rem 1rem', borderBottom: `1px solid ${C.brd}`, fontSize: '.78rem', fontWeight: 600, color: C.mut, textTransform: 'uppercase', letterSpacing: '.05em' }}>Evolução do poder de compra</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem' }}>
          <thead><tr>{['Ano','Poder de compra de hoje (R$)','Quanto custará (R$)'].map(h => <th key={h} style={{ padding: '.5rem .875rem', textAlign: 'left', color: C.mut, fontWeight: 500, borderBottom: `1px solid ${C.brd}`, fontSize: '.75rem' }}>{h}</th>)}</tr></thead>
          <tbody>{result.table.map(row => (
            <tr key={row.year} style={{ borderBottom: `1px solid ${C.brd}` }}>
              <td style={{ padding: '.5rem .875rem', color: C.mut }}>{row.year}a</td>
              <td style={{ padding: '.5rem .875rem', color: row.value < amount * 0.5 ? C.err : C.txt, fontWeight: 500 }}>{fmt(row.value)}</td>
              <td style={{ padding: '.5rem .875rem', color: C.txt }}>{fmt(row.cost)}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────
function App() {
  const [calc, setCalc] = useState<Calc>('compound');

  const COMPONENTS: Record<Calc, React.ReactNode> = {
    compound:     <CompoundCalc />,
    loan:         <LoanCalc />,
    retirement:   <RetirementCalc />,
    emergency:    <EmergencyCalc />,
    savings_goal: <SavingsGoalCalc />,
    inflation:    <InflationCalc />,
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.txt, fontFamily: 'Inter,system-ui,sans-serif' }}>
      <div style={{ background: C.sur, borderBottom: `1px solid ${C.brd}`, padding: '.875rem 1.5rem', display: 'flex', alignItems: 'center', gap: '.75rem' }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#00d4aa,#38ef7d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>💰</div>
        <div>
          <span style={{ fontWeight: 700, fontSize: '.9rem' }}>Calculadora Financeira</span>
          <span style={{ fontFamily: 'monospace', fontSize: '.7rem', color: C.mut, marginLeft: 6 }}>/app10</span>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: '.72rem', color: C.mut }}>⚠️ Simulações educativas — não constituem aconselhamento financeiro</span>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '1.5rem 1rem', display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.25rem', alignItems: 'start' }}>
        {/* Sidebar */}
        <div style={{ background: C.sur, border: `1px solid ${C.brd}`, borderRadius: 12, padding: '1rem' }}>
          <p style={{ fontSize: '.72rem', color: C.mut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.625rem' }}>Simulações</p>
          {CALCS.map(c => (
            <button key={c.key} onClick={() => setCalc(c.key)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '.625rem', padding: '.625rem .75rem', borderRadius: 8, border: 'none', cursor: 'pointer', marginBottom: '.25rem', background: calc === c.key ? 'rgba(0,212,170,.1)' : 'transparent', color: calc === c.key ? C.ok : C.txt, textAlign: 'left' as const }}>
              <span style={{ fontSize: '1.05rem' }}>{c.icon}</span>
              <div>
                <div style={{ fontWeight: calc === c.key ? 600 : 400, fontSize: '.85rem' }}>{c.label}</div>
                <div style={{ fontSize: '.7rem', color: C.mut }}>{c.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Calculator */}
        <div style={{ background: C.sur, border: `1px solid ${C.brd}`, borderRadius: 12, padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: `1px solid ${C.brd}` }}>
            <span style={{ fontSize: '1.5rem' }}>{CALCS.find(c => c.key === calc)?.icon}</span>
            <div>
              <h1 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{CALCS.find(c => c.key === calc)?.label}</h1>
              <p style={{ fontSize: '.8rem', color: C.mut }}>{CALCS.find(c => c.key === calc)?.desc}</p>
            </div>
          </div>
          {COMPONENTS[calc]}
        </div>
      </div>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}input[type="number"]:focus,input[type="range"]:focus,select:focus{border-color:${C.acc}!important;outline:none}button:hover{opacity:.85}input[type="range"]{-webkit-appearance:none;height:6px;border-radius:3px;background:${C.brd2};cursor:pointer}input[type="range"]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:${C.ok};cursor:pointer}`}</style>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
