import React, { useState, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom/client';

// ── Types ──────────────────────────────────────────────────
type Mode = 'json-to-excel' | 'json-to-csv' | 'excel-to-json' | 'csv-to-json';
type TabKey = 'input' | 'preview' | 'schema' | 'mapping';

interface SchemaField { key: string; type: string; nullable: boolean; sample?: unknown; }
interface Schema { fields: SchemaField[]; rowCount: number; hasInconsistencies: boolean; warnings: string[]; }
interface PreviewResult { preview: unknown[]; schema: Schema; total: number; warnings: string[]; }

// ── Design tokens ──────────────────────────────────────────
const C = {
  bg: '#0a0a0f', sur: '#111118', sur2: '#1a1a24', brd: '#2a2a38', brd2: '#3a3a4e',
  txt: '#e8e8f0', mut: '#8888a8', acc: '#6c63ff', ok: '#00d4aa', err: '#ff4d6a',
  wrn: '#ffb347', tag_blue: 'rgba(108,99,255,.15)', tag_green: 'rgba(0,212,170,.12)',
};

const TYPE_COLORS: Record<string, string> = {
  string: '#6c63ff', number: '#00d4aa', boolean: '#ffb347',
  date: '#ff7eb3', null: '#8888a8', object: '#ff6b6b', array: '#4ecdc4',
};

// ── Helpers ────────────────────────────────────────────────
const SAMPLE_JSON = JSON.stringify([
  { id: 1, nome: 'Alice', email: 'alice@email.com', ativo: true, cadastro: '2024-01-15', saldo: 1250.50 },
  { id: 2, nome: 'Bruno', email: 'bruno@email.com', ativo: false, cadastro: '2024-03-22', saldo: 890.00 },
  { id: 3, nome: 'Carol', email: 'carol@email.com', ativo: true, cadastro: '2024-05-10', saldo: 3200.75 },
], null, 2);

const MODES: { key: Mode; label: string; icon: string; desc: string; from: string; to: string }[] = [
  { key: 'json-to-excel', label: 'JSON → Excel', icon: '📊', desc: 'Converte JSON em planilha .xlsx', from: 'JSON', to: 'XLSX' },
  { key: 'json-to-csv',   label: 'JSON → CSV',   icon: '📄', desc: 'Converte JSON em arquivo .csv',  from: 'JSON', to: 'CSV' },
  { key: 'excel-to-json', label: 'Excel → JSON', icon: '{}',  desc: 'Lê planilha .xlsx e gera JSON', from: 'XLSX', to: 'JSON' },
  { key: 'csv-to-json',   label: 'CSV → JSON',   icon: '[ ]', desc: 'Lê .csv e gera JSON',          from: 'CSV',  to: 'JSON' },
];

// ─────────────────────────────────────────────────────────────
function App() {
  const [mode, setMode]         = useState<Mode>('json-to-excel');
  const [tab, setTab]           = useState<TabKey>('input');
  const [jsonText, setJsonText] = useState(SAMPLE_JSON);
  const [file, setFile]         = useState<File | null>(null);
  const [preview, setPreview]   = useState<PreviewResult | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [sheetName, setSheetName] = useState('Dados');
  const [allSheets, setAllSheets] = useState(false);
  const [headerBg, setHeaderBg] = useState('#6c63ff');
  const [altRow, setAltRow]     = useState(true);
  const [freezeHdr, setFreezeHdr] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const isToFile = mode === 'json-to-excel' || mode === 'json-to-csv';
  const fromFile = mode === 'excel-to-json' || mode === 'csv-to-json';
  const currentMode = MODES.find(m => m.key === mode)!;

  // ── Preview ────────────────────────────────────────────
  const runPreview = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      if (isToFile) {
        const data = JSON.parse(jsonText);
        const r = await fetch('/api/converter/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data, limit: 20 }),
        });
        const j = await r.json();
        if (!j.success) throw new Error(j.error);
        setPreview(j);
        setTab('preview');
      } else if (file) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('limit', '20');
        const r = await fetch('/api/converter/preview', { method: 'POST', body: fd });
        const j = await r.json();
        if (!j.success) throw new Error(j.error);
        setPreview(j);
        setTab('preview');
      }
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, [mode, jsonText, file, isToFile]);

  // ── Convert ────────────────────────────────────────────
  const runConvert = useCallback(async () => {
    setError(''); setWarnings([]);
    setLoading(true);
    try {
      if (mode === 'json-to-excel') {
        const data = JSON.parse(jsonText);
        const r = await fetch('/api/converter/json-to-excel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data, sheetName,
            style: { headerBackground: headerBg, headerForeground: '#ffffff', headerBold: true, autoWidth: true, freezeHeader: freezeHdr, alternateRowColor: altRow ? '#f8f8ff' : undefined },
          }),
        });
        if (!r.ok) { const j = await r.json(); throw new Error(j.error || 'Falha'); }
        const warns = r.headers.get('X-Warnings');
        if (warns) setWarnings(JSON.parse(warns));
        const blob = await r.blob();
        triggerDownload(blob, `export-${Date.now()}.xlsx`);

      } else if (mode === 'json-to-csv') {
        const data = JSON.parse(jsonText);
        const r = await fetch('/api/converter/json-to-csv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data }),
        });
        if (!r.ok) { const j = await r.json(); throw new Error(j.error || 'Falha'); }
        const blob = await r.blob();
        triggerDownload(blob, `export-${Date.now()}.csv`);

      } else if (mode === 'excel-to-json') {
        if (!file) throw new Error('Selecione um arquivo Excel');
        const fd = new FormData();
        fd.append('file', file);
        fd.append('options', JSON.stringify({ allSheets, skipEmptyRows: true, preserveTypes: true }));
        const r = await fetch('/api/converter/excel-to-json', { method: 'POST', body: fd });
        const j = await r.json();
        if (!j.success) throw new Error(j.error || 'Falha');
        setWarnings(j.warnings || []);
        triggerDownload(new Blob([JSON.stringify(j.data, null, 2)], { type: 'application/json' }), `result-${Date.now()}.json`);
        setPreview({ preview: Array.isArray(j.data) ? j.data.slice(0, 20) : Object.values(j.data)[0] as unknown[], schema: j.schema, total: j.stats.rowsProcessed, warnings: j.warnings });
        setTab('preview');

      } else if (mode === 'csv-to-json') {
        if (!file) throw new Error('Selecione um arquivo CSV');
        const fd = new FormData();
        fd.append('file', file);
        fd.append('options', JSON.stringify({ preserveTypes: true }));
        const r = await fetch('/api/converter/csv-to-json', { method: 'POST', body: fd });
        const j = await r.json();
        if (!j.success) throw new Error(j.error || 'Falha');
        setWarnings(j.warnings || []);
        triggerDownload(new Blob([JSON.stringify(j.data, null, 2)], { type: 'application/json' }), `result-${Date.now()}.json`);
        setPreview({ preview: (j.data as unknown[]).slice(0, 20), schema: j.schema, total: j.stats.rowsProcessed, warnings: j.warnings });
        setTab('preview');
      }
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, [mode, jsonText, file, sheetName, headerBg, altRow, freezeHdr, allSheets]);

  function triggerDownload(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ── JSON validation status ─────────────────────────────
  let jsonValid = true, jsonError = '';
  if (isToFile && jsonText.trim()) {
    try { JSON.parse(jsonText); } catch (e) { jsonValid = false; jsonError = (e as Error).message; }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.txt, fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: C.sur, borderBottom: `1px solid ${C.brd}`, padding: '.875rem 2rem', display: 'flex', alignItems: 'center', gap: '.75rem' }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: `linear-gradient(135deg,${C.acc},${C.ok})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🔄</div>
        <span style={{ fontWeight: 700, fontSize: '.9rem' }}>Conversor JSON ↔ Excel/CSV</span>
        <span style={{ fontFamily: 'monospace', fontSize: '.7rem', color: C.mut, marginLeft: 4 }}>/app5</span>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem', display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem', alignItems: 'start' }}>

        {/* ── Sidebar ── */}
        <div>
          {/* Mode selector */}
          <div style={{ background: C.sur, border: `1px solid ${C.brd}`, borderRadius: 12, padding: '1.25rem', marginBottom: '1.25rem' }}>
            <p style={{ fontSize: '.72rem', color: C.mut, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.875rem', fontWeight: 600 }}>Modo de conversão</p>
            {MODES.map(m => (
              <button key={m.key} onClick={() => { setMode(m.key); setPreview(null); setTab('input'); setError(''); setFile(null); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.75rem .875rem', borderRadius: 9, border: 'none', cursor: 'pointer', marginBottom: '.375rem', background: mode === m.key ? `rgba(108,99,255,.15)` : 'transparent', color: mode === m.key ? C.acc : C.txt, textAlign: 'left' }}>
                <span style={{ fontSize: '1rem', width: 24, textAlign: 'center' }}>{m.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '.85rem' }}>{m.label}</div>
                  <div style={{ fontSize: '.72rem', color: C.mut }}>{m.desc}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Options */}
          {mode === 'json-to-excel' && (
            <div style={{ background: C.sur, border: `1px solid ${C.brd}`, borderRadius: 12, padding: '1.25rem', marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '.72rem', color: C.mut, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.875rem', fontWeight: 600 }}>Opções Excel</p>
              <label style={{ display: 'block', fontSize: '.78rem', color: C.mut, marginBottom: '.3rem' }}>Nome da aba</label>
              <input value={sheetName} onChange={e => setSheetName(e.target.value)}
                style={{ width: '100%', background: C.sur2, border: `1px solid ${C.brd}`, borderRadius: 8, color: C.txt, padding: '.5rem .75rem', fontSize: '.85rem', marginBottom: '.75rem', boxSizing: 'border-box' as const }} />
              <label style={{ display: 'block', fontSize: '.78rem', color: C.mut, marginBottom: '.3rem' }}>Cor do cabeçalho</label>
              <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', marginBottom: '.75rem' }}>
                <input type="color" value={headerBg} onChange={e => setHeaderBg(e.target.value)}
                  style={{ width: 36, height: 28, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }} />
                <span style={{ fontSize: '.8rem', color: C.mut, fontFamily: 'monospace' }}>{headerBg}</span>
              </div>
              {[
                { label: 'Congelar cabeçalho', val: freezeHdr, set: setFreezeHdr },
                { label: 'Linhas alternadas', val: altRow, set: setAltRow },
              ].map(o => (
                <label key={o.label} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', cursor: 'pointer', marginBottom: '.5rem', fontSize: '.85rem' }}>
                  <input type="checkbox" checked={o.val} onChange={e => o.set(e.target.checked)} style={{ accentColor: C.acc }} />
                  {o.label}
                </label>
              ))}
            </div>
          )}

          {mode === 'excel-to-json' && (
            <div style={{ background: C.sur, border: `1px solid ${C.brd}`, borderRadius: 12, padding: '1.25rem' }}>
              <p style={{ fontSize: '.72rem', color: C.mut, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.875rem', fontWeight: 600 }}>Opções</p>
              <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', cursor: 'pointer', fontSize: '.85rem' }}>
                <input type="checkbox" checked={allSheets} onChange={e => setAllSheets(e.target.checked)} style={{ accentColor: C.acc }} />
                Exportar todas as abas
              </label>
            </div>
          )}
        </div>

        {/* ── Main panel ── */}
        <div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '.25rem', marginBottom: '1rem', background: C.sur, border: `1px solid ${C.brd}`, borderRadius: 10, padding: '.25rem' }}>
            {(['input', 'preview', 'schema'] as TabKey[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ flex: 1, padding: '.5rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '.82rem', fontWeight: tab === t ? 600 : 400, background: tab === t ? C.acc : 'transparent', color: tab === t ? '#fff' : C.mut, textTransform: 'capitalize' as const }}>
                {t === 'input' ? 'Entrada' : t === 'preview' ? `Preview${preview ? ` (${preview.total})` : ''}` : 'Schema'}
              </button>
            ))}
          </div>

          {/* Input tab */}
          {tab === 'input' && (
            <div style={{ background: C.sur, border: `1px solid ${C.brd}`, borderRadius: 12, padding: '1.5rem' }}>
              {isToFile ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
                    <span style={{ fontSize: '.8rem', color: C.mut, fontWeight: 500 }}>JSON de entrada</span>
                    <div style={{ display: 'flex', gap: '.5rem' }}>
                      {!jsonValid && <span style={{ fontSize: '.75rem', color: C.err }}>⚠ JSON inválido: {jsonError.slice(0, 40)}</span>}
                      {jsonValid && jsonText && <span style={{ fontSize: '.75rem', color: C.ok }}>✓ JSON válido</span>}
                      <button onClick={() => setJsonText(SAMPLE_JSON)} style={{ background: 'none', border: `1px solid ${C.brd}`, borderRadius: 6, color: C.mut, cursor: 'pointer', fontSize: '.72rem', padding: '2px 8px' }}>Exemplo</button>
                    </div>
                  </div>
                  <textarea value={jsonText} onChange={e => setJsonText(e.target.value)}
                    style={{ width: '100%', height: 340, background: C.sur2, border: `1px solid ${jsonValid ? C.brd : C.err}`, borderRadius: 10, color: C.txt, padding: '1rem', fontSize: '.82rem', fontFamily: 'JetBrains Mono, Consolas, monospace', resize: 'vertical', outline: 'none', boxSizing: 'border-box' as const, lineHeight: 1.6 }} />
                </>
              ) : (
                <>
                  <p style={{ fontSize: '.8rem', color: C.mut, fontWeight: 500, marginBottom: '.75rem' }}>
                    Arquivo {mode === 'excel-to-json' ? 'Excel (.xlsx, .xls)' : 'CSV (.csv)'}
                  </p>
                  <div
                    onClick={() => fileRef.current?.click()}
                    style={{ border: `2px dashed ${file ? C.ok : C.brd2}`, borderRadius: 12, padding: '3rem 2rem', textAlign: 'center', cursor: 'pointer', transition: 'border-color .2s', background: file ? 'rgba(0,212,170,.04)' : 'transparent' }}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { setFile(f); setPreview(null); } }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '.75rem' }}>{file ? '✅' : '📁'}</div>
                    {file
                      ? <><p style={{ fontWeight: 600 }}>{file.name}</p><p style={{ fontSize: '.8rem', color: C.mut }}>{(file.size / 1024).toFixed(1)} KB</p></>
                      : <><p style={{ fontWeight: 500, marginBottom: '.375rem' }}>Arraste ou clique para selecionar</p><p style={{ fontSize: '.8rem', color: C.mut }}>Máximo 20 MB</p></>
                    }
                  </div>
                  <input ref={fileRef} type="file" accept={mode === 'excel-to-json' ? '.xlsx,.xls' : '.csv'} style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setPreview(null); } }} />
                  {file && <button onClick={() => { setFile(null); setPreview(null); }} style={{ marginTop: '.75rem', background: 'none', border: 'none', color: C.err, cursor: 'pointer', fontSize: '.8rem' }}>✕ Remover arquivo</button>}
                </>
              )}

              {/* Error */}
              {error && (
                <div style={{ marginTop: '.875rem', padding: '.875rem', background: 'rgba(255,77,106,.08)', border: `1px solid rgba(255,77,106,.3)`, borderRadius: 10, fontSize: '.85rem', color: C.err }}>
                  ⚠ {error}
                </div>
              )}

              {/* Warnings */}
              {warnings.length > 0 && (
                <div style={{ marginTop: '.75rem', padding: '.75rem', background: 'rgba(255,179,71,.06)', border: `1px solid rgba(255,179,71,.3)`, borderRadius: 10 }}>
                  {warnings.map((w, i) => <p key={i} style={{ fontSize: '.8rem', color: C.wrn }}>⚠ {w}</p>)}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '.75rem', marginTop: '1rem' }}>
                <button onClick={runPreview} disabled={loading || (isToFile ? !jsonValid || !jsonText : !file)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', padding: '.75rem 1.25rem', borderRadius: 10, border: `1px solid ${C.brd2}`, background: 'transparent', color: C.txt, cursor: 'pointer', fontSize: '.875rem', fontWeight: 500, opacity: (loading || (isToFile ? !jsonValid : !file)) ? .5 : 1 }}>
                  👁 Preview
                </button>
                <button onClick={runConvert} disabled={loading || (isToFile ? !jsonValid || !jsonText : !file)}
                  style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem', padding: '.75rem 1.5rem', borderRadius: 10, border: 'none', background: C.acc, color: '#fff', cursor: 'pointer', fontSize: '.875rem', fontWeight: 600, opacity: (loading || (isToFile ? !jsonValid : !file)) ? .6 : 1 }}>
                  {loading ? '⏳ Convertendo...' : `⬇ Converter ${currentMode.to === 'XLSX' ? 'para Excel' : currentMode.to === 'CSV' ? 'para CSV' : 'para JSON'}`}
                </button>
              </div>
            </div>
          )}

          {/* Preview tab */}
          {tab === 'preview' && (
            <div style={{ background: C.sur, border: `1px solid ${C.brd}`, borderRadius: 12, overflow: 'hidden' }}>
              {!preview
                ? <div style={{ padding: '3rem', textAlign: 'center', color: C.mut }}>Clique em "Preview" para visualizar os dados</div>
                : (
                  <>
                    <div style={{ padding: '1rem 1.5rem', borderBottom: `1px solid ${C.brd}`, display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '.8rem', color: C.mut }}>{preview.total} registros{preview.preview.length < preview.total ? ` — mostrando ${preview.preview.length}` : ''}</span>
                      {preview.warnings.length > 0 && <span style={{ fontSize: '.75rem', color: C.wrn }}>⚠ {preview.warnings.length} avisos</span>}
                    </div>
                    <div style={{ overflow: 'auto', maxHeight: 420 }}>
                      {preview.preview.length > 0 && typeof preview.preview[0] === 'object' ? (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.8rem' }}>
                          <thead>
                            <tr style={{ background: headerBg }}>
                              <th style={{ padding: '.5rem .75rem', textAlign: 'left', color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', borderRight: `1px solid rgba(255,255,255,.15)` }}>#</th>
                              {Object.keys(preview.preview[0] as object).map(k => (
                                <th key={k} style={{ padding: '.5rem .75rem', textAlign: 'left', color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', borderRight: `1px solid rgba(255,255,255,.15)` }}>{k}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {preview.preview.map((row, i) => (
                              <tr key={i} style={{ background: i % 2 === 1 && altRow ? '#f8f8ff08' : 'transparent', borderBottom: `1px solid ${C.brd}` }}>
                                <td style={{ padding: '.4rem .75rem', color: C.mut, borderRight: `1px solid ${C.brd}` }}>{i + 1}</td>
                                {Object.values(row as object).map((v, j) => (
                                  <td key={j} style={{ padding: '.4rem .75rem', borderRight: `1px solid ${C.brd}`, color: v === null ? C.mut : C.txt, fontStyle: v === null ? 'italic' : 'normal', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {v === null ? 'null' : v === true ? '✓' : v === false ? '✗' : String(v)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <pre style={{ padding: '1rem', color: C.txt, fontSize: '.8rem', overflow: 'auto' }}>{JSON.stringify(preview.preview, null, 2)}</pre>
                      )}
                    </div>
                  </>
                )}
            </div>
          )}

          {/* Schema tab */}
          {tab === 'schema' && (
            <div style={{ background: C.sur, border: `1px solid ${C.brd}`, borderRadius: 12, padding: '1.5rem' }}>
              {!preview?.schema
                ? <div style={{ textAlign: 'center', color: C.mut, padding: '3rem' }}>Faça um Preview para detectar o schema</div>
                : (
                  <>
                    <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                      {[
                        { label: 'Campos', val: preview.schema.fields.length },
                        { label: 'Registros', val: preview.schema.rowCount },
                        { label: 'Inconsistências', val: preview.schema.hasInconsistencies ? '⚠ Sim' : '✓ Não' },
                      ].map(s => (
                        <div key={s.label} style={{ background: C.sur2, border: `1px solid ${C.brd}`, borderRadius: 10, padding: '.75rem 1.25rem', textAlign: 'center' }}>
                          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: C.acc }}>{s.val}</div>
                          <div style={{ fontSize: '.75rem', color: C.mut }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                      {preview.schema.fields.map(f => (
                        <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.625rem .875rem', background: C.sur2, borderRadius: 9, border: `1px solid ${C.brd}` }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '.85rem', fontWeight: 600, flex: 1 }}>{f.key}</span>
                          <span style={{ fontSize: '.72rem', fontWeight: 600, padding: '2px 10px', borderRadius: 20, background: `${TYPE_COLORS[f.type] || '#8888a8'}22`, color: TYPE_COLORS[f.type] || '#8888a8', border: `1px solid ${TYPE_COLORS[f.type] || '#8888a8'}44` }}>{f.type}</span>
                          {f.nullable && <span style={{ fontSize: '.7rem', color: C.mut, background: C.brd, padding: '1px 7px', borderRadius: 10 }}>nullable</span>}
                          {f.sample !== undefined && f.sample !== null && <span style={{ fontSize: '.75rem', color: C.mut, fontFamily: 'monospace', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>ex: {String(f.sample)}</span>}
                        </div>
                      ))}
                    </div>
                    {preview.warnings.length > 0 && (
                      <div style={{ marginTop: '1rem', padding: '.875rem', background: 'rgba(255,179,71,.06)', border: `1px solid rgba(255,179,71,.3)`, borderRadius: 10 }}>
                        {preview.warnings.map((w, i) => <p key={i} style={{ fontSize: '.8rem', color: C.wrn, marginBottom: '.25rem' }}>⚠ {w}</p>)}
                      </div>
                    )}
                  </>
                )}
            </div>
          )}
        </div>
      </div>

      <style>{`*{box-sizing:border-box;margin:0;padding:0}body{-webkit-font-smoothing:antialiased}textarea:focus,input[type="text"]:focus{border-color:${C.acc}!important;outline:none}button:hover:not(:disabled){opacity:.88}::-webkit-scrollbar{width:6px;height:6px}::-webkit-scrollbar-track{background:${C.sur}}::-webkit-scrollbar-thumb{background:${C.brd2};border-radius:3px}`}</style>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
);
