import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

const C = {
  bg: '#0a0a0f', sur: '#111118', sur2: '#1a1a24', brd: '#2a2a38', brd2: '#3a3a4e',
  txt: '#e8e8f0', mut: '#8888a8', acc: '#6c63ff', ok: '#00d4aa', err: '#ff4d6a', wrn: '#ffb347',
};

type Tool = 'resize' | 'compress' | 'convert' | 'crop' | 'watermark' | 'grayscale';
type Format = 'image/jpeg' | 'image/png' | 'image/webp';

interface ImageInfo { width: number; height: number; size: number; name: string; type: string; }
interface ProcessResult { blob: Blob; width: number; height: number; name: string; }

const TOOLS: { key: Tool; icon: string; label: string; desc: string }[] = [
  { key: 'resize',    icon: '📐', label: 'Redimensionar', desc: 'Altere largura e altura' },
  { key: 'compress',  icon: '🗜️', label: 'Comprimir',     desc: 'Reduza o tamanho do arquivo' },
  { key: 'convert',   icon: '🔄', label: 'Converter',     desc: 'JPG, PNG, WebP' },
  { key: 'crop',      icon: '✂️', label: 'Recortar',      desc: 'Corte a imagem' },
  { key: 'watermark', icon: '🔏', label: 'Marca d\'água', desc: 'Adicione texto' },
  { key: 'grayscale', icon: '⬛', label: 'Preto e branco', desc: 'Converta para grayscale' },
];

const inp = (extra?: React.CSSProperties): React.CSSProperties => ({
  width: '100%', background: C.sur2, border: `1px solid ${C.brd}`,
  borderRadius: 8, color: C.txt, padding: '.575rem .75rem',
  fontSize: '.875rem', fontFamily: 'inherit', outline: 'none',
  boxSizing: 'border-box' as const, ...extra,
});

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function App() {
  const [tool, setTool]         = useState<Tool>('resize');
  const [imgSrc, setImgSrc]     = useState<string>('');
  const [imgInfo, setImgInfo]   = useState<ImageInfo | null>(null);
  const [result, setResult]     = useState<ProcessResult | null>(null);
  const [processing, setProc]   = useState(false);
  const [error, setError]       = useState('');
  const [dragging, setDragging] = useState(false);

  // Tool settings
  const [resizeW, setResizeW]     = useState(800);
  const [resizeH, setResizeH]     = useState(600);
  const [keepRatio, setKeepRatio] = useState(true);
  const [quality, setQuality]     = useState(80);
  const [outFormat, setOutFormat] = useState<Format>('image/jpeg');
  const [cropX, setCropX]         = useState(0);
  const [cropY, setCropY]         = useState(0);
  const [cropW, setCropW]         = useState(100);
  const [cropH, setCropH]         = useState(100);
  const [waterText, setWaterText] = useState('© Meu Site');
  const [waterPos, setWaterPos]   = useState<'center'|'br'|'bl'|'tr'|'tl'>('br');
  const [waterOpacity, setWaterOpacity] = useState(70);

  const fileRef  = useRef<HTMLInputElement>(null);
  const origImg  = useRef<HTMLImageElement | null>(null);

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) { setError('Selecione uma imagem (JPG, PNG, WebP, GIF)'); return; }
    if (file.size > 30 * 1024 * 1024) { setError('Arquivo muito grande. Máximo 30 MB.'); return; }
    setError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      setImgSrc(src);
      const img = new Image();
      img.onload = () => {
        origImg.current = img;
        setImgInfo({ width: img.width, height: img.height, size: file.size, name: file.name, type: file.type });
        setResizeW(img.width); setResizeH(img.height);
        setCropW(img.width); setCropH(img.height);
        setResult(null);
        // Auto-set output format
        if (file.type === 'image/png') setOutFormat('image/png');
        else if (file.type === 'image/webp') setOutFormat('image/webp');
        else setOutFormat('image/jpeg');
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  }, []);

  const process = useCallback(async () => {
    if (!origImg.current || !imgInfo) return;
    setProc(true); setError('');
    try {
      await new Promise(r => setTimeout(r, 50)); // let UI update
      const canvas  = document.createElement('canvas');
      const ctx     = canvas.getContext('2d')!;
      const img     = origImg.current;

      if (tool === 'resize') {
        canvas.width  = resizeW;
        canvas.height = resizeH;
        ctx.drawImage(img, 0, 0, resizeW, resizeH);
      } else if (tool === 'compress') {
        canvas.width  = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
      } else if (tool === 'convert') {
        canvas.width  = img.width;
        canvas.height = img.height;
        if (outFormat !== 'image/png') {
          ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,img.width,img.height);
        }
        ctx.drawImage(img, 0, 0);
      } else if (tool === 'crop') {
        canvas.width  = cropW;
        canvas.height = cropH;
        ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
      } else if (tool === 'grayscale') {
        canvas.width  = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const d = ctx.getImageData(0, 0, img.width, img.height);
        for (let i = 0; i < d.data.length; i += 4) {
          const g = d.data[i]*0.299 + d.data[i+1]*0.587 + d.data[i+2]*0.114;
          d.data[i] = d.data[i+1] = d.data[i+2] = g;
        }
        ctx.putImageData(d, 0, 0);
      } else if (tool === 'watermark') {
        canvas.width  = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const fs   = Math.max(24, Math.min(img.width / 12, 72));
        ctx.font   = `bold ${fs}px Inter, Arial, sans-serif`;
        ctx.globalAlpha = waterOpacity / 100;
        ctx.fillStyle = '#ffffff';
        const mt   = ctx.measureText(waterText);
        const tw   = mt.width; const th = fs;
        const pad  = fs * 0.8;
        const positions: Record<string, [number,number]> = {
          center: [(img.width - tw) / 2, (img.height + th) / 2],
          br:     [img.width  - tw - pad, img.height - pad],
          bl:     [pad,                   img.height - pad],
          tr:     [img.width  - tw - pad, th + pad],
          tl:     [pad,                   th + pad],
        };
        const [x, y] = positions[waterPos];
        // Shadow
        ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 6;
        ctx.fillText(waterText, x, y);
        ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      }

      const fmt  = tool === 'convert' ? outFormat : (imgInfo.type as Format || 'image/jpeg');
      const q    = (tool === 'compress' || tool === 'convert') ? quality / 100 : 0.92;
      const blob = await new Promise<Blob>((res, rej) =>
        canvas.toBlob(b => b ? res(b) : rej(new Error('Falha')), fmt, q)
      );

      const ext  = fmt.split('/')[1].replace('jpeg','jpg');
      const base = imgInfo.name.replace(/\.[^.]+$/, '');
      const name = `${base}-${tool}.${ext}`;

      setResult({ blob, width: canvas.width, height: canvas.height, name });
    } catch (e) {
      setError((e as Error).message);
    }
    setProc(false);
  }, [tool, imgInfo, resizeW, resizeH, quality, outFormat, cropX, cropY, cropW, cropH, waterText, waterPos, waterOpacity]);

  function downloadResult() {
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    const a   = document.createElement('a'); a.href = url; a.download = result.name;
    a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const onResizeW = (w: number) => {
    setResizeW(w);
    if (keepRatio && imgInfo) setResizeH(Math.round(w * imgInfo.height / imgInfo.width));
  };
  const onResizeH = (h: number) => {
    setResizeH(h);
    if (keepRatio && imgInfo) setResizeW(Math.round(h * imgInfo.width / imgInfo.height));
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.txt, fontFamily: 'Inter,system-ui,sans-serif' }}>
      {/* Header */}
      <div style={{ background: C.sur, borderBottom: `1px solid ${C.brd}`, padding: '.875rem 1.5rem', display: 'flex', alignItems: 'center', gap: '.75rem' }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#ff7eb3,#ff6b6b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🖼️</div>
        <div>
          <span style={{ fontWeight: 700, fontSize: '.9rem' }}>Editor de Imagens</span>
          <span style={{ fontFamily: 'monospace', fontSize: '.7rem', color: C.mut, marginLeft: 6 }}>/app9</span>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: '.75rem', color: C.ok }}>✓ Processamento local — sua imagem não é enviada a nenhum servidor</span>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '1.5rem 1rem', display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.25rem', alignItems: 'start' }}>

        {/* Sidebar: tools */}
        <div>
          <div style={{ background: C.sur, border: `1px solid ${C.brd}`, borderRadius: 12, padding: '1rem', marginBottom: '1rem' }}>
            <p style={{ fontSize: '.72rem', color: C.mut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.625rem' }}>Ferramentas</p>
            {TOOLS.map(t => (
              <button key={t.key} onClick={() => { setTool(t.key); setResult(null); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '.625rem', padding: '.625rem .75rem', borderRadius: 8, border: 'none', cursor: 'pointer', marginBottom: '.25rem', background: tool === t.key ? 'rgba(108,99,255,.12)' : 'transparent', color: tool === t.key ? C.acc : C.txt, textAlign: 'left' as const }}>
                <span style={{ fontSize: '1.05rem', width: 22, textAlign: 'center' as const }}>{t.icon}</span>
                <div>
                  <div style={{ fontWeight: tool === t.key ? 600 : 400, fontSize: '.875rem' }}>{t.label}</div>
                  <div style={{ fontSize: '.72rem', color: C.mut }}>{t.desc}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Image info */}
          {imgInfo && (
            <div style={{ background: C.sur, border: `1px solid ${C.brd}`, borderRadius: 12, padding: '1rem' }}>
              <p style={{ fontSize: '.72rem', color: C.mut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.625rem' }}>Imagem original</p>
              <div style={{ fontSize: '.82rem', color: C.mut, lineHeight: 2 }}>
                <div>📁 <span style={{ color: C.txt }}>{imgInfo.name.slice(0, 20)}</span></div>
                <div>📐 <span style={{ color: C.txt }}>{imgInfo.width} × {imgInfo.height}px</span></div>
                <div>💾 <span style={{ color: C.txt }}>{formatSize(imgInfo.size)}</span></div>
                <div>🖼️ <span style={{ color: C.txt }}>{imgInfo.type.split('/')[1].toUpperCase()}</span></div>
              </div>
            </div>
          )}
        </div>

        {/* Main */}
        <div>
          {/* Drop zone */}
          {!imgSrc ? (
            <div onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) loadFile(f); }}
              onClick={() => fileRef.current?.click()}
              style={{ border: `2px dashed ${dragging ? C.acc : C.brd2}`, borderRadius: 14, padding: '4rem 2rem', textAlign: 'center' as const, cursor: 'pointer', transition: 'border-color .2s', background: dragging ? 'rgba(108,99,255,.04)' : 'transparent' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🖼️</div>
              <p style={{ fontWeight: 600, marginBottom: '.5rem' }}>Arraste uma imagem ou clique para selecionar</p>
              <p style={{ fontSize: '.85rem', color: C.mut }}>JPG, PNG, WebP, GIF — até 30 MB</p>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
            </div>
          ) : (
            <div>
              {/* Preview + options */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                {/* Original preview */}
                <div style={{ background: C.sur, border: `1px solid ${C.brd}`, borderRadius: 12, padding: '1rem' }}>
                  <p style={{ fontSize: '.72rem', color: C.mut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.625rem' }}>Original</p>
                  <img src={imgSrc} alt="original" style={{ width: '100%', maxHeight: 220, objectFit: 'contain', borderRadius: 8, background: '#fff2' }} />
                </div>
                {/* Result preview */}
                <div style={{ background: C.sur, border: `1px solid ${C.brd}`, borderRadius: 12, padding: '1rem' }}>
                  <p style={{ fontSize: '.72rem', color: C.mut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.625rem' }}>
                    Resultado {result ? `— ${result.width}×${result.height}px ${formatSize(result.blob.size)}` : ''}
                  </p>
                  {result ? (
                    <img src={URL.createObjectURL(result.blob)} alt="result" style={{ width: '100%', maxHeight: 220, objectFit: 'contain', borderRadius: 8, background: '#fff2' }} />
                  ) : (
                    <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.mut, fontSize: '.85rem', flexDirection: 'column', gap: '.5rem', border: `1px dashed ${C.brd}`, borderRadius: 8 }}>
                      <span style={{ fontSize: '2rem' }}>✨</span>Configure e processe
                    </div>
                  )}
                </div>
              </div>

              {/* Tool options */}
              <div style={{ background: C.sur, border: `1px solid ${C.brd}`, borderRadius: 12, padding: '1.25rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>{TOOLS.find(t => t.key === tool)?.icon}</span>
                  <span style={{ fontWeight: 600 }}>{TOOLS.find(t => t.key === tool)?.label}</span>
                </div>

                {tool === 'resize' && (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '.75rem', alignItems: 'flex-end', marginBottom: '.75rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '.78rem', color: C.mut, marginBottom: '.3rem' }}>Largura (px)</label>
                        <input style={inp()} type="number" value={resizeW} min={1} max={8000} onChange={e => onResizeW(parseInt(e.target.value)||1)} />
                      </div>
                      <div style={{ paddingBottom: '.5rem', color: C.mut }}>×</div>
                      <div>
                        <label style={{ display: 'block', fontSize: '.78rem', color: C.mut, marginBottom: '.3rem' }}>Altura (px)</label>
                        <input style={inp()} type="number" value={resizeH} min={1} max={8000} onChange={e => onResizeH(parseInt(e.target.value)||1)} />
                      </div>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', cursor: 'pointer', fontSize: '.85rem', color: C.mut }}>
                      <input type="checkbox" checked={keepRatio} onChange={e => setKeepRatio(e.target.checked)} style={{ accentColor: C.acc }} />
                      Manter proporção
                    </label>
                    <div style={{ marginTop: '.875rem', display: 'flex', gap: '.5rem', flexWrap: 'wrap' as const }}>
                      {[[1920,1080,'FHD'],[1280,720,'HD'],[800,600,'800×600'],[400,400,'400×400']].map(([w,h,l]) => (
                        <button key={l} onClick={() => { setResizeW(w as number); setResizeH(h as number); }}
                          style={{ padding:'.3rem .75rem', borderRadius:20, fontSize:'.75rem', border:`1px solid ${C.brd}`, background:C.sur2, color:C.mut, cursor:'pointer' }}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {(tool === 'compress') && (
                  <div>
                    <label style={{ display: 'block', fontSize: '.78rem', color: C.mut, marginBottom: '.375rem' }}>
                      Qualidade: <strong style={{ color: C.txt }}>{quality}%</strong>
                      {quality >= 85 ? ' (alta)' : quality >= 60 ? ' (boa)' : ' (baixa)'}
                    </label>
                    <input type="range" min={10} max={100} value={quality} onChange={e => setQuality(parseInt(e.target.value))} style={{ width: '100%', accentColor: C.acc, marginBottom: '.5rem' }} />
                    <p style={{ fontSize: '.78rem', color: C.mut }}>Valores entre 70-85% oferecem bom equilíbrio entre qualidade e tamanho de arquivo.</p>
                  </div>
                )}

                {tool === 'convert' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '.78rem', color: C.mut, marginBottom: '.5rem' }}>Formato de saída</label>
                    <div style={{ display: 'flex', gap: '.75rem', marginBottom: '1rem' }}>
                      {[['image/jpeg','JPG'],['image/png','PNG'],['image/webp','WebP']].map(([f,l]) => (
                        <button key={f} onClick={() => setOutFormat(f as Format)}
                          style={{ flex:1, padding:'.625rem', borderRadius:9, border:`1px solid ${outFormat===f?C.acc:C.brd}`, background:outFormat===f?'rgba(108,99,255,.12)':C.sur2, color:outFormat===f?C.acc:C.mut, cursor:'pointer', fontWeight:outFormat===f?600:400 }}>
                          {l}
                        </button>
                      ))}
                    </div>
                    {outFormat !== 'image/png' && (
                      <>
                        <label style={{ display: 'block', fontSize: '.78rem', color: C.mut, marginBottom: '.375rem' }}>Qualidade: <strong style={{ color: C.txt }}>{quality}%</strong></label>
                        <input type="range" min={10} max={100} value={quality} onChange={e => setQuality(parseInt(e.target.value))} style={{ width: '100%', accentColor: C.acc }} />
                      </>
                    )}
                    <div style={{ marginTop: '1rem', padding: '.75rem', background: C.sur2, borderRadius: 8, fontSize: '.78rem', color: C.mut, lineHeight: 1.6 }}>
                      <strong style={{ color: C.txt }}>WebP</strong> — 25-35% menor que JPG, suportado por todos os navegadores modernos<br/>
                      <strong style={{ color: C.txt }}>PNG</strong> — sem perda de qualidade, ideal para imagens com transparência<br/>
                      <strong style={{ color: C.txt }}>JPG</strong> — universal, ideal para fotos
                    </div>
                  </div>
                )}

                {tool === 'crop' && imgInfo && (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                      {[['X inicial', cropX, setCropX, 0, imgInfo.width-1],
                        ['Y inicial', cropY, setCropY, 0, imgInfo.height-1],
                        ['Largura',   cropW, setCropW, 1, imgInfo.width],
                        ['Altura',    cropH, setCropH, 1, imgInfo.height]].map(([label, val, setter, min, max]) => (
                        <div key={label as string}>
                          <label style={{ display: 'block', fontSize: '.78rem', color: C.mut, marginBottom: '.3rem' }}>{label as string} (px)</label>
                          <input style={inp()} type="number" value={val as number} min={min as number} max={max as number}
                            onChange={e => (setter as React.Dispatch<React.SetStateAction<number>>)(parseInt(e.target.value)||0)} />
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize: '.78rem', color: C.mut, marginTop: '.75rem' }}>
                      Imagem original: {imgInfo.width} × {imgInfo.height}px
                    </p>
                  </div>
                )}

                {tool === 'watermark' && (
                  <div>
                    <div style={{ marginBottom: '.875rem' }}>
                      <label style={{ display: 'block', fontSize: '.78rem', color: C.mut, marginBottom: '.3rem' }}>Texto da marca d'água</label>
                      <input style={inp()} value={waterText} onChange={e => setWaterText(e.target.value)} placeholder="© Meu Site" />
                    </div>
                    <div style={{ marginBottom: '.875rem' }}>
                      <label style={{ display: 'block', fontSize: '.78rem', color: C.mut, marginBottom: '.5rem' }}>Posição</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '.375rem', maxWidth: 220 }}>
                        {[['tl','↖'],['tr','↗'],[null,''],['center','⊙'],[null,''],['bl','↙'],['br','↘']].map(([pos, icon], i) => (
                          pos ? (
                            <button key={pos as string} onClick={() => setWaterPos(pos as typeof waterPos)}
                              style={{ padding: '.5rem', borderRadius: 6, border: `1px solid ${waterPos===pos?C.acc:C.brd}`, background: waterPos===pos?'rgba(108,99,255,.12)':C.sur2, color: waterPos===pos?C.acc:C.mut, cursor: 'pointer', fontSize: '1rem' }}>
                              {icon}
                            </button>
                          ) : <div key={i} />
                        ))}
                      </div>
                    </div>
                    <label style={{ display: 'block', fontSize: '.78rem', color: C.mut, marginBottom: '.375rem' }}>Opacidade: <strong style={{ color: C.txt }}>{waterOpacity}%</strong></label>
                    <input type="range" min={10} max={100} value={waterOpacity} onChange={e => setWaterOpacity(parseInt(e.target.value))} style={{ width: '100%', accentColor: C.acc }} />
                  </div>
                )}

                {tool === 'grayscale' && (
                  <div style={{ padding: '1rem', background: C.sur2, borderRadius: 8, fontSize: '.85rem', color: C.mut, lineHeight: 1.6 }}>
                    Converte a imagem para preto e branco (escala de cinza) preservando todos os detalhes de luminosidade. Clique em Processar para aplicar.
                  </div>
                )}
              </div>

              {/* Actions */}
              {error && <div style={{ padding: '.75rem', borderRadius: 8, background: 'rgba(255,77,106,.08)', border: `1px solid rgba(255,77,106,.3)`, color: C.err, fontSize: '.85rem', marginBottom: '.875rem' }}>{error}</div>}

              <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' as const }}>
                <button onClick={process} disabled={processing}
                  style={{ flex: 1, padding: '.75rem', borderRadius: 10, border: 'none', background: C.acc, color: '#fff', fontWeight: 600, cursor: processing ? 'wait' : 'pointer', fontSize: '.9rem', minWidth: 140, opacity: processing ? .7 : 1 }}>
                  {processing ? '⏳ Processando...' : `✨ ${TOOLS.find(t=>t.key===tool)?.label}`}
                </button>
                {result && (
                  <button onClick={downloadResult}
                    style={{ flex: 1, padding: '.75rem', borderRadius: 10, border: 'none', background: C.ok, color: '#0a0a0f', fontWeight: 600, cursor: 'pointer', fontSize: '.9rem', minWidth: 140 }}>
                    ⬇ Baixar {formatSize(result.blob.size)}
                  </button>
                )}
                <button onClick={() => { setImgSrc(''); setImgInfo(null); setResult(null); origImg.current = null; if (fileRef.current) fileRef.current.value = ''; }}
                  style={{ padding: '.75rem 1.25rem', borderRadius: 10, border: `1px solid ${C.brd}`, background: 'transparent', color: C.mut, cursor: 'pointer', fontSize: '.9rem' }}>
                  Nova imagem
                </button>
              </div>

              {/* Savings badge */}
              {result && imgInfo && (
                <div style={{ marginTop: '.75rem', padding: '.75rem 1rem', borderRadius: 10, background: result.blob.size < imgInfo.size ? 'rgba(0,212,170,.07)' : 'rgba(255,179,71,.07)', border: `1px solid ${result.blob.size < imgInfo.size ? 'rgba(0,212,170,.25)' : 'rgba(255,179,71,.25)'}`, fontSize: '.82rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>
                    {formatSize(imgInfo.size)} → <strong style={{ color: C.txt }}>{formatSize(result.blob.size)}</strong>
                  </span>
                  {result.blob.size < imgInfo.size ? (
                    <span style={{ color: C.ok, fontWeight: 600 }}>
                      −{Math.round((1 - result.blob.size/imgInfo.size) * 100)}% menor 🎉
                    </span>
                  ) : (
                    <span style={{ color: C.wrn }}>arquivo maior (PNG sem perda)</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}input:focus,select:focus,textarea:focus{border-color:${C.acc}!important;outline:none}button:hover:not(:disabled){opacity:.85}`}</style>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
