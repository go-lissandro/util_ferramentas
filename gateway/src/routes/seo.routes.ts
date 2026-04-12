import { Router, Request, Response } from 'express';

export const seoRouter = Router();

const SITE_URL  = process.env.SITE_URL  || 'https://util-ferramentas.onrender.com';
const SITE_NAME = process.env.SITE_NAME || 'Util Ferramentas';
const YEAR      = new Date().getFullYear();

// ── Shared HTML shell ──────────────────────────────────────
function page(title: string, description: string, canonical: string, body: string): string {
  const ADSENSE_ID  = process.env.GOOGLE_ADSENSE_ID || '';
  const SC_TOKEN    = process.env.GOOGLE_SEARCH_CONSOLE || '';

  const adsScript = ADSENSE_ID
    ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ID}" crossorigin="anonymous"></script>`
    : '';
  const adUnit = (slot = 'AUTO') => ADSENSE_ID
    ? `<div class="ad-wrap"><p class="ad-label">Publicidade</p><ins class="adsbygoogle" style="display:block" data-ad-client="${ADSENSE_ID}" data-ad-slot="${slot}" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle=window.adsbygoogle||[]).push({});</script></div>`
    : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${title}</title>
<meta name="description" content="${description}"/>
<meta name="robots" content="index,follow"/>
<link rel="canonical" href="${canonical}"/>
${SC_TOKEN ? `<meta name="google-site-verification" content="${SC_TOKEN}"/>` : ''}
<meta property="og:type" content="website"/>
<meta property="og:url" content="${canonical}"/>
<meta property="og:title" content="${title}"/>
<meta property="og:description" content="${description}"/>
<meta property="og:locale" content="pt_BR"/>
<meta name="twitter:card" content="summary"/>
${adsScript}
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#0a0a0f;--sur:#111118;--sur2:#1a1a24;--brd:#2a2a38;--txt:#e8e8f0;--mut:#8888a8;--acc:#6c63ff;--ok:#00d4aa}
body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--txt);line-height:1.7;font-size:1rem}
a{color:var(--acc);text-decoration:none}a:hover{text-decoration:underline}
.wrap{max-width:860px;margin:0 auto;padding:0 1.5rem}
header{background:var(--sur);border-bottom:1px solid var(--brd);padding:.875rem 0;position:sticky;top:0;z-index:10}
.hdr{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.75rem}
.logo{font-weight:700;font-size:1.05rem;color:var(--txt)}
.logo em{color:var(--acc);font-style:normal}
nav{display:flex;gap:1.25rem;font-size:.875rem;color:var(--mut);flex-wrap:wrap}
nav a{color:var(--mut)}nav a:hover{color:var(--txt);text-decoration:none}
.btn-sm{background:var(--acc);color:#fff;padding:.4rem 1rem;border-radius:7px;font-size:.85rem;font-weight:600}
.btn-sm:hover{opacity:.88;text-decoration:none}
main{padding:3rem 0 4rem}
h1{font-size:clamp(1.6rem,4vw,2.4rem);font-weight:700;line-height:1.2;margin-bottom:1rem;color:var(--txt)}
h2{font-size:1.4rem;font-weight:700;margin:2.5rem 0 1rem;color:var(--txt)}
h3{font-size:1.1rem;font-weight:600;margin:2rem 0 .75rem;color:var(--txt)}
p{color:var(--mut);margin-bottom:1rem;line-height:1.8}
ul,ol{color:var(--mut);padding-left:1.5rem;margin-bottom:1rem;line-height:1.8}
li{margin-bottom:.375rem}
strong{color:var(--txt)}
.lead{font-size:1.1rem;color:var(--mut);max-width:680px;margin-bottom:2rem;line-height:1.8}
.box{background:var(--sur);border:1px solid var(--brd);border-radius:12px;padding:1.5rem;margin:1.5rem 0}
.box p:last-child{margin-bottom:0}
.tip{background:rgba(108,99,255,.08);border:1px solid rgba(108,99,255,.25);border-radius:10px;padding:1rem 1.25rem;margin:1.25rem 0;color:var(--txt);font-size:.9rem}
.tip strong{color:var(--acc)}
.step-list{list-style:none;padding:0;counter-reset:steps}
.step-list li{counter-increment:steps;display:flex;gap:.875rem;margin-bottom:1.25rem;padding-left:0}
.step-list li::before{content:counter(steps);min-width:28px;height:28px;background:var(--acc);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.8rem;flex-shrink:0;margin-top:.15rem}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin:1.5rem 0}
.card{background:var(--sur);border:1px solid var(--brd);border-radius:12px;padding:1.25rem}
.card h3{font-size:.95rem;margin:.5rem 0 .5rem;color:var(--txt)}
.card p{font-size:.85rem;margin:0}
.card .icon{font-size:1.75rem}
.breadcrumb{font-size:.8rem;color:var(--mut);margin-bottom:1.5rem}
.breadcrumb a{color:var(--mut)}
.tag{display:inline-block;background:rgba(0,212,170,.12);color:var(--ok);font-size:.72rem;font-weight:600;padding:2px 10px;border-radius:20px;margin-right:.375rem;margin-bottom:.5rem}
.ad-wrap{margin:2rem 0;padding:1rem 0;border-top:1px solid var(--brd)}
.ad-label{font-size:.68rem;color:var(--mut);text-transform:uppercase;letter-spacing:.06em;margin-bottom:.5rem;text-align:center}
.toc{background:var(--sur);border:1px solid var(--brd);border-radius:10px;padding:1.25rem;margin:1.5rem 0}
.toc p{font-size:.85rem;font-weight:600;color:var(--txt);margin-bottom:.625rem}
.toc ol{font-size:.875rem;color:var(--mut)}
.toc a{color:var(--mut)}
table{width:100%;border-collapse:collapse;margin:1.5rem 0;font-size:.9rem}
th{background:var(--sur);border:1px solid var(--brd);padding:.625rem .875rem;text-align:left;font-size:.82rem;color:var(--mut);font-weight:600}
td{border:1px solid var(--brd);padding:.625rem .875rem;color:var(--mut)}
tr:nth-child(even) td{background:rgba(255,255,255,.02)}
footer{background:var(--sur);border-top:1px solid var(--brd);padding:2rem 0;text-align:center}
footer p{font-size:.8rem;color:var(--mut)}
footer a{color:var(--mut);margin:0 .625rem}
footer a:hover{color:var(--txt);text-decoration:none}
.footer-links{display:flex;flex-wrap:wrap;gap:.5rem 1.25rem;justify-content:center;margin-bottom:.875rem}
</style>
</head>
<body>
<header><div class="wrap"><div class="hdr">
  <a href="/" class="logo"><em>Util</em> Ferramentas</a>
  <nav>
    <a href="/como-baixar-videos">Baixar Vídeos</a>
    <a href="/converter-mp3">Converter MP3</a>
    <a href="/encurtar-links">Encurtar Links</a>
    <a href="/converter-json-excel">JSON↔Excel</a>
  </nav>
  <a href="/app4" class="btn-sm">Usar grátis</a>
</div></div></header>
<main><div class="wrap">${body}${adUnit()}</div></main>
<footer><div class="wrap">
  <div class="footer-links">
    <a href="/">Início</a>
    <a href="/como-baixar-videos">Baixar Vídeos</a>
    <a href="/converter-mp3">Converter MP3</a>
    <a href="/encurtar-links">Encurtar Links</a>
    <a href="/converter-json-excel">JSON↔Excel</a>
    <a href="/sobre">Sobre</a>
    <a href="/privacidade">Privacidade</a>
    <a href="/termos">Termos de Uso</a>
    <a href="/checkout.html">Planos</a>
    <a href="/app1">Entrar</a>
  </div>
  <p>&copy; ${YEAR} ${SITE_NAME}. Todos os direitos reservados.</p>
</div></footer>
</body></html>`;
}

// ─────────────────────────────────────────────────────────────────
// robots.txt
// ─────────────────────────────────────────────────────────────────
seoRouter.get('/robots.txt', (_req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send(`User-agent: *
Allow: /
Disallow: /api/
Disallow: /app1
Disallow: /app2
Disallow: /app3

Sitemap: ${SITE_URL}/sitemap.xml`);
});

// ─────────────────────────────────────────────────────────────────
// sitemap.xml
// ─────────────────────────────────────────────────────────────────
seoRouter.get('/sitemap.xml', (_req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const urls = [
    ['/', '1.0', 'weekly'],
    ['/como-baixar-videos', '0.9', 'monthly'],
    ['/converter-mp3', '0.9', 'monthly'],
    ['/encurtar-links', '0.8', 'monthly'],
    ['/converter-json-excel', '0.8', 'monthly'],
    ['/sobre', '0.6', 'monthly'],
    ['/privacidade', '0.5', 'yearly'],
    ['/termos', '0.5', 'yearly'],
    ['/checkout.html', '0.9', 'monthly'],
    ['/app4', '0.8', 'weekly'],
    ['/app5', '0.7', 'weekly'],
  ].map(([loc, pri, freq]) =>
    `<url><loc>${SITE_URL}${loc}</loc><lastmod>${today}</lastmod><changefreq>${freq}</changefreq><priority>${pri}</priority></url>`
  ).join('\n  ');

  res.setHeader('Content-Type', 'application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls}
</urlset>`);
});

// ─────────────────────────────────────────────────────────────────
// HOME PAGE
// ─────────────────────────────────────────────────────────────────
seoRouter.get('/', (_req, res) => {
  const body = `
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"WebSite","name":"${SITE_NAME}","url":"${SITE_URL}","description":"Ferramentas online gratuitas: baixar vídeos, converter MP3, encurtar links, converter JSON para Excel","potentialAction":{"@type":"SearchAction","target":"${SITE_URL}/app4?url={search_term_string}","query-input":"required name=search_term_string"}}
</script>

<h1>Ferramentas online gratuitas para o seu dia a dia</h1>
<p class="lead">O <strong>Util Ferramentas</strong> reúne em um só lugar as ferramentas digitais mais utilizadas na internet: baixar vídeos, converter para MP3, encurtar links, converter JSON para Excel e muito mais — tudo de forma rápida, sem instalação e sem limite de uso.</p>

<div class="cards">
  <div class="card"><div class="icon">⬇️</div><h3><a href="/app4">Baixar Vídeos Online</a></h3><p>Salve vídeos do YouTube, Instagram, TikTok, Vimeo, Twitter e outros 1000+ sites em MP4, WebM ou MP3.</p></div>
  <div class="card"><div class="icon">🎵</div><h3><a href="/converter-mp3">Converter Vídeo em MP3</a></h3><p>Extraia o áudio de qualquer vídeo online e salve como MP3 com qualidade de 192kbps.</p></div>
  <div class="card"><div class="icon">🔗</div><h3><a href="/encurtar-links">Encurtador de Links</a></h3><p>Crie links curtos personalizados com análise de cliques, QR code e data de expiração.</p></div>
  <div class="card"><div class="icon">🔄</div><h3><a href="/converter-json-excel">Conversor JSON↔Excel</a></h3><p>Transforme arquivos JSON em planilhas Excel formatadas e converta Excel/CSV para JSON com um clique.</p></div>
</div>

<h2>Por que usar o Util Ferramentas?</h2>
<p>Diferente de outros sites que exigem cadastro ou limitam o número de downloads, o Util Ferramentas foi criado para ser <strong>simples, direto e sem complicações</strong>. Todas as ferramentas básicas são gratuitas e não há limite de uso para os recursos principais.</p>

<ul>
  <li><strong>Sem instalação</strong> — funciona direto no navegador, em qualquer dispositivo</li>
  <li><strong>Sem cadastro</strong> para as ferramentas gratuitas</li>
  <li><strong>Suporte a mais de 1000 sites</strong> de vídeo</li>
  <li><strong>Conversão de dados</strong> sem perda de formatação</li>
  <li><strong>Links curtos</strong> com painel de analytics</li>
</ul>

<h2>Como baixar vídeos online</h2>
<p>Para baixar um vídeo usando o Util Ferramentas, basta seguir três passos simples:</p>
<ol class="step-list">
  <li>Copie o link do vídeo que deseja baixar (YouTube, Instagram, TikTok, etc.)</li>
  <li>Acesse a <a href="/app4">ferramenta de download</a> e cole o link no campo indicado</li>
  <li>Escolha o formato desejado (MP4 para vídeo, MP3 para áudio) e clique em Baixar</li>
</ol>

<div class="tip"><strong>Dica:</strong> Para extrair apenas o áudio de um vídeo do YouTube e salvar como MP3, basta selecionar "Somente áudio (MP3)" na lista de formatos antes de baixar.</div>

<h2>Conversor JSON para Excel</h2>
<p>Precisa transformar dados JSON em uma planilha Excel bem formatada? Com o <a href="/app5">conversor JSON↔Excel</a>, você pode colar seu JSON diretamente na interface, visualizar uma prévia dos dados, escolher as cores do cabeçalho e fazer o download do arquivo .xlsx com um clique.</p>
<p>O conversor também funciona no sentido inverso: faça upload de uma planilha Excel ou arquivo CSV e receba os dados no formato JSON, com detecção automática de tipos (números, datas, booleanos, textos).</p>

<h2>Sites de vídeo suportados</h2>
<p>A ferramenta de download suporta mais de 1000 plataformas, incluindo as mais populares:</p>
<table>
  <tr><th>Plataforma</th><th>Tipo de conteúdo</th><th>Formatos disponíveis</th></tr>
  <tr><td>YouTube</td><td>Vídeos, Shorts, Lives</td><td>MP4 (até 4K), MP3, WebM</td></tr>
  <tr><td>Instagram</td><td>Reels, Stories, Posts</td><td>MP4, MP3</td></tr>
  <tr><td>TikTok</td><td>Vídeos</td><td>MP4 sem marca d'água</td></tr>
  <tr><td>Twitter / X</td><td>Vídeos em tweets</td><td>MP4</td></tr>
  <tr><td>Vimeo</td><td>Vídeos públicos</td><td>MP4 (até 1080p)</td></tr>
  <tr><td>Facebook</td><td>Vídeos públicos</td><td>MP4</td></tr>
  <tr><td>Reddit</td><td>Vídeos em posts</td><td>MP4</td></tr>
  <tr><td>Twitch</td><td>Clips e VODs</td><td>MP4</td></tr>
</table>

<h2>Perguntas frequentes</h2>

<h3>O Util Ferramentas é gratuito?</h3>
<p>Sim. O download de vídeos, a conversão de áudio para MP3 e o conversor JSON↔Excel são completamente gratuitos e sem limite de uso. O plano Pro adiciona funcionalidades avançadas como gerenciamento de dados dinâmicos e encurtador de links com analytics.</p>

<h3>Preciso instalar algum programa?</h3>
<p>Não. Todas as ferramentas funcionam diretamente no navegador, sem necessidade de instalar nenhum software adicional. Funciona em computadores, tablets e smartphones.</p>

<h3>É seguro usar?</h3>
<p>Sim. Os arquivos são processados no servidor e entregues diretamente para o seu dispositivo. Não armazenamos os vídeos baixados nem compartilhamos seus dados com terceiros. Consulte nossa <a href="/privacidade">Política de Privacidade</a> para mais detalhes.</p>

<h3>Por que alguns vídeos do YouTube não funcionam?</h3>
<p>Vídeos com restrição de idade, conteúdo de membros pagantes ou vídeos privados não podem ser baixados sem autenticação. Vídeos públicos normais do YouTube funcionam na maioria dos casos.</p>

<h3>Qual o tamanho máximo de arquivo para o conversor?</h3>
<p>O conversor JSON↔Excel aceita arquivos de até 20 MB. Para arquivos maiores, recomendamos dividir o conteúdo em partes menores.</p>

<h3>Como posso encurtar um link?</h3>
<p>O encurtador de links está disponível no <a href="/checkout.html">plano Pro</a>. Com ele você cria links curtos personalizados, acompanha quantos cliques cada link recebeu e define datas de expiração.</p>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(page(`${SITE_NAME} — Ferramentas Online Gratuitas`, 'Baixe vídeos do YouTube, Instagram e TikTok, converta MP3, encurte links e converta JSON para Excel. Ferramentas online gratuitas, sem cadastro e sem limites.', `${SITE_URL}/`, body));
});

// ─────────────────────────────────────────────────────────────────
// COMO BAIXAR VÍDEOS
// ─────────────────────────────────────────────────────────────────
seoRouter.get('/como-baixar-videos', (_req, res) => {
  const body = `
<div class="breadcrumb"><a href="/">Início</a> › Como Baixar Vídeos</div>
<span class="tag">Guia Completo</span><span class="tag">Gratuito</span>
<h1>Como baixar vídeos online: guia completo 2024</h1>
<p class="lead">Aprenda a salvar vídeos do YouTube, Instagram, TikTok e outros sites diretamente no seu computador ou celular, sem instalar programas.</p>

<div class="toc">
  <p>Neste guia você vai aprender:</p>
  <ol>
    <li><a href="#passo-a-passo">Passo a passo para baixar qualquer vídeo</a></li>
    <li><a href="#youtube">Como baixar vídeos do YouTube</a></li>
    <li><a href="#instagram">Como baixar vídeos do Instagram</a></li>
    <li><a href="#tiktok">Como baixar vídeos do TikTok</a></li>
    <li><a href="#formatos">Diferença entre MP4, WebM e outros formatos</a></li>
    <li><a href="#celular">Como baixar no celular</a></li>
    <li><a href="#problemas">Resolução de problemas comuns</a></li>
  </ol>
</div>

<h2 id="passo-a-passo">Passo a passo: como baixar qualquer vídeo</h2>
<p>O processo é o mesmo para qualquer plataforma. Veja como fazer:</p>
<ol class="step-list">
  <li><strong>Copie o link do vídeo</strong> — No aplicativo ou site onde o vídeo está, clique em "Compartilhar" e copie o link.</li>
  <li><strong>Acesse a ferramenta</strong> — Abra o <a href="/app4">Util Ferramentas — Download de Vídeos</a> no seu navegador.</li>
  <li><strong>Cole o link</strong> — Clique no campo de texto e cole o link copiado (Ctrl+V no computador, segurar e colar no celular).</li>
  <li><strong>Busque o vídeo</strong> — Clique em "Buscar" e aguarde alguns segundos enquanto carregamos as informações.</li>
  <li><strong>Escolha o formato</strong> — Selecione MP4 para vídeo completo ou MP3 para extrair apenas o áudio.</li>
  <li><strong>Baixe o arquivo</strong> — Clique em "Baixar" e o arquivo será salvo na pasta de downloads do seu dispositivo.</li>
</ol>

<div class="tip"><strong>💡 Dica importante:</strong> O tempo de download varia conforme o tamanho do vídeo e a velocidade da internet. Vídeos em alta resolução (1080p ou 4K) podem demorar mais para processar.</div>

<h2 id="youtube">Como baixar vídeos do YouTube</h2>
<p>O YouTube é a maior plataforma de vídeos do mundo e também a mais utilizada para downloads. Para baixar um vídeo do YouTube:</p>
<ul>
  <li>Acesse o vídeo no YouTube (youtube.com ou no aplicativo)</li>
  <li>Clique no botão <strong>Compartilhar</strong> abaixo do vídeo</li>
  <li>Clique em <strong>Copiar link</strong></li>
  <li>Cole o link no <a href="/app4">nosso downloader</a></li>
</ul>
<p>O YouTube disponibiliza vídeos em várias resoluções: 360p, 480p, 720p (HD), 1080p (Full HD), 1440p (2K) e 4K. Quanto maior a resolução, maior será o arquivo final.</p>
<p><strong>Atenção:</strong> Vídeos marcados como privados, conteúdo exclusivo para membros pagantes ou vídeos com restrição de idade não podem ser baixados sem autenticação.</p>

<h2 id="instagram">Como baixar vídeos do Instagram</h2>
<p>Para baixar vídeos do Instagram (Reels, Stories e posts de vídeo), siga estes passos:</p>
<ol class="step-list">
  <li>Abra o Instagram e encontre o vídeo que deseja baixar</li>
  <li>Toque nos três pontos (...) no canto superior direito do post</li>
  <li>Selecione "Copiar link"</li>
  <li>Cole no <a href="/app4">downloader do Util Ferramentas</a></li>
</ol>
<p>Funciona para Reels, vídeos em posts e IGTV. Para Stories, o conteúdo precisa ser de um perfil público.</p>

<h2 id="tiktok">Como baixar vídeos do TikTok</h2>
<p>O TikTok tem uma limitação: vídeos baixados pelo próprio aplicativo geralmente têm uma marca d'água. Com nossa ferramenta, você pode baixar sem a marca d'água:</p>
<ol class="step-list">
  <li>Abra o TikTok e encontre o vídeo</li>
  <li>Toque em <strong>Compartilhar</strong> (seta apontando para cima)</li>
  <li>Selecione <strong>Copiar link</strong></li>
  <li>Cole no downloader e baixe em MP4</li>
</ol>

<h2 id="formatos">Diferença entre os formatos de vídeo</h2>
<table>
  <tr><th>Formato</th><th>Uso recomendado</th><th>Compatibilidade</th></tr>
  <tr><td><strong>MP4</strong></td><td>Vídeo completo para assistir ou editar</td><td>Universal — funciona em todos os dispositivos</td></tr>
  <tr><td><strong>WebM</strong></td><td>Vídeos para web, arquivos menores</td><td>Navegadores modernos, alguns players</td></tr>
  <tr><td><strong>MP3</strong></td><td>Extrair somente o áudio</td><td>Universal — funciona em todos os players</td></tr>
  <tr><td><strong>M4A</strong></td><td>Áudio de alta qualidade</td><td>Apple, players modernos</td></tr>
</table>
<p>Para uso geral, recomendamos o formato <strong>MP4</strong> — é compatível com praticamente todos os dispositivos e softwares de edição de vídeo.</p>

<h2 id="celular">Como baixar vídeos no celular</h2>
<p>Para baixar vídeos diretamente no smartphone, o processo é o mesmo, mas com algumas dicas específicas:</p>
<p><strong>Android:</strong> O arquivo será salvo automaticamente na pasta Downloads. Você pode encontrá-lo no aplicativo "Arquivos" ou na Galeria (se for MP4).</p>
<p><strong>iPhone (iOS):</strong> No Safari, após clicar em "Baixar", segure o arquivo e selecione "Salvar no Arquivos" para guardar no iCloud ou no armazenamento local.</p>

<h2 id="problemas">Resolução de problemas comuns</h2>
<div class="box">
  <h3>❓ O vídeo não está sendo encontrado</h3>
  <p>Verifique se o link foi copiado corretamente e se o vídeo é público. Links de vídeos privados ou com restrições não funcionam.</p>
</div>
<div class="box">
  <h3>❓ O download está muito lento</h3>
  <p>Vídeos em alta resolução levam mais tempo para processar. Tente escolher uma resolução menor (720p em vez de 1080p, por exemplo).</p>
</div>
<div class="box">
  <h3>❓ O arquivo baixado não abre</h3>
  <p>Instale o <a href="https://www.videolan.org/vlc/" rel="noopener noreferrer" target="_blank">VLC Media Player</a>, que é gratuito e reproduz praticamente todos os formatos de vídeo.</p>
</div>

<div style="margin-top:2.5rem;padding:1.5rem;background:rgba(108,99,255,.08);border:1px solid rgba(108,99,255,.25);border-radius:12px;text-align:center">
  <p style="color:var(--txt);font-weight:600;font-size:1.05rem;margin-bottom:.75rem">Pronto para começar?</p>
  <a href="/app4" style="display:inline-flex;align-items:center;gap:.5rem;background:var(--acc);color:#fff;padding:.875rem 2rem;border-radius:10px;font-weight:600;font-size:.95rem;text-decoration:none">⬇️ Baixar vídeo agora — é grátis</a>
</div>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(page('Como Baixar Vídeos Online Grátis — YouTube, Instagram, TikTok | Util Ferramentas', 'Guia completo sobre como baixar vídeos do YouTube, Instagram, TikTok e outros sites. Passo a passo simples, sem instalar programas, grátis.', `${SITE_URL}/como-baixar-videos`, body));
});

// ─────────────────────────────────────────────────────────────────
// CONVERTER MP3
// ─────────────────────────────────────────────────────────────────
seoRouter.get('/converter-mp3', (_req, res) => {
  const body = `
<div class="breadcrumb"><a href="/">Início</a> › Converter Vídeo para MP3</div>
<span class="tag">Guia</span><span class="tag">Gratuito</span>
<h1>Como converter vídeo para MP3 online: guia completo</h1>
<p class="lead">Aprenda a extrair o áudio de qualquer vídeo online e salvar como MP3 de alta qualidade, sem instalar programas e de forma completamente gratuita.</p>

<h2>O que é conversão de vídeo para MP3?</h2>
<p>Converter um vídeo para MP3 significa extrair apenas a trilha de áudio do arquivo de vídeo e salvá-la em formato de música. É muito útil para:</p>
<ul>
  <li>Salvar músicas de clipes do YouTube na biblioteca do seu player</li>
  <li>Extrair o áudio de podcasts, entrevistas e aulas em vídeo</li>
  <li>Criar ringtones a partir de vídeos</li>
  <li>Ouvir conteúdo offline sem gastar espaço com o vídeo completo</li>
</ul>

<h2>Como converter vídeo do YouTube para MP3</h2>
<ol class="step-list">
  <li>Copie o link do vídeo do YouTube que deseja converter</li>
  <li>Acesse nossa <a href="/app4">ferramenta de conversão</a></li>
  <li>Cole o link e clique em "Buscar"</li>
  <li>Na lista de formatos, selecione <strong>"Somente áudio (MP3)"</strong></li>
  <li>Clique em "Baixar áudio (MP3)" — o arquivo será salvo automaticamente</li>
</ol>

<div class="tip"><strong>Qualidade do áudio:</strong> Nossa ferramenta converte com qualidade de 192kbps, que é considerada qualidade de CD e suficiente para a grande maioria dos usos.</div>

<h2>Formatos de áudio: qual é o melhor?</h2>
<table>
  <tr><th>Formato</th><th>Qualidade</th><th>Tamanho</th><th>Compatibilidade</th></tr>
  <tr><td><strong>MP3</strong></td><td>Boa (192kbps)</td><td>Médio</td><td>Universal</td></tr>
  <tr><td><strong>M4A / AAC</strong></td><td>Melhor que MP3</td><td>Menor</td><td>Apple, Android, browsers</td></tr>
  <tr><td><strong>OGG</strong></td><td>Boa</td><td>Pequeno</td><td>Android, PC (alguns players)</td></tr>
  <tr><td><strong>WAV</strong></td><td>Máxima (sem perda)</td><td>Grande</td><td>Universal</td></tr>
</table>
<p>Para uso geral — ouvir no celular, no carro ou em fones de ouvido — o MP3 em 192kbps é mais do que suficiente. A diferença de qualidade em relação a formatos mais modernos é imperceptível para a maioria das pessoas.</p>

<h2>Posso converter áudio de qualquer vídeo?</h2>
<p>Sim, a conversão funciona para qualquer plataforma suportada pelo nosso downloader: YouTube, Instagram, TikTok, Vimeo, Twitter/X, Facebook, Reddit, Twitch e muitas outras.</p>
<p>A única limitação é que o vídeo precisa ser público e acessível. Vídeos privados, conteúdo exclusivo para assinantes ou vídeos com restrição de idade não podem ser processados.</p>

<h2>Onde fica o arquivo MP3 depois do download?</h2>
<p><strong>No computador (Windows):</strong> O arquivo é salvo na pasta "Downloads" (C:\\Usuários\\SeuNome\\Downloads).</p>
<p><strong>No Mac:</strong> O arquivo vai para a pasta "Downloads" na barra lateral do Finder.</p>
<p><strong>No Android:</strong> O arquivo é salvo em Armazenamento Interno → Downloads. Você pode encontrá-lo também no app "Arquivos".</p>
<p><strong>No iPhone:</strong> Após o download, selecione "Salvar nos Arquivos" para guardar no armazenamento local ou iCloud.</p>

<div class="box">
  <h3>Como adicionar o MP3 ao Spotify ou Apple Music?</h3>
  <p>Após baixar o arquivo MP3, você pode adicioná-lo às suas bibliotecas locais:</p>
  <ul>
    <li><strong>Spotify:</strong> Configurações → Biblioteca de músicas locais → ative e aponte para a pasta onde salvou o arquivo</li>
    <li><strong>Apple Music:</strong> Arraste o arquivo MP3 para a janela do Apple Music ou use Arquivo → Importar</li>
    <li><strong>VLC / outros players:</strong> Abra o arquivo diretamente — funciona em qualquer player</li>
  </ul>
</div>

<div style="margin-top:2.5rem;padding:1.5rem;background:rgba(0,212,170,.06);border:1px solid rgba(0,212,170,.25);border-radius:12px;text-align:center">
  <p style="color:var(--txt);font-weight:600;font-size:1.05rem;margin-bottom:.75rem">Converter agora — rápido e gratuito</p>
  <a href="/app4" style="display:inline-flex;align-items:center;gap:.5rem;background:var(--ok);color:#0a0a0f;padding:.875rem 2rem;border-radius:10px;font-weight:600;font-size:.95rem;text-decoration:none">🎵 Converter vídeo para MP3</a>
</div>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(page('Converter Vídeo para MP3 Online Grátis — YouTube, Instagram, TikTok | Util Ferramentas', 'Converta vídeos do YouTube, Instagram e TikTok para MP3 online, grátis e sem instalar programas. Qualidade 192kbps, rápido e fácil de usar.', `${SITE_URL}/converter-mp3`, body));
});

// ─────────────────────────────────────────────────────────────────
// ENCURTAR LINKS
// ─────────────────────────────────────────────────────────────────
seoRouter.get('/encurtar-links', (_req, res) => {
  const body = `
<div class="breadcrumb"><a href="/">Início</a> › Encurtador de Links</div>
<span class="tag">Plano Pro</span>
<h1>Encurtador de links com analytics: o que é e como usar</h1>
<p class="lead">Descubra como um encurtador de links profissional pode ajudar a organizar suas URLs, rastrear cliques e melhorar a experiência do usuário nas suas campanhas digitais.</p>

<h2>O que é um encurtador de links?</h2>
<p>Um encurtador de links é uma ferramenta que transforma URLs longas e difíceis de lembrar em links curtos, limpos e profissionais. Por exemplo, uma URL como <code>https://meusite.com.br/paginas/produtos/categoria/produto-especifico-com-nome-longo</code> pode se tornar simplesmente <code>util.link/produto</code>.</p>
<p>Além de facilitar o compartilhamento, links curtos profissionais permitem rastrear quantas pessoas clicaram, de onde vieram e quando — informações essenciais para quem trabalha com marketing digital, redes sociais ou e-commerce.</p>

<h2>Para que serve um encurtador de links?</h2>
<ul>
  <li><strong>Redes sociais:</strong> Posts com links curtos parecem mais profissionais e têm mais espaço para o texto da mensagem</li>
  <li><strong>E-mail marketing:</strong> Links curtos são mais clicáveis e permitem rastrear a taxa de abertura</li>
  <li><strong>Bio do Instagram:</strong> Um link curto é mais fácil de lembrar e digitar</li>
  <li><strong>Apresentações e materiais impressos:</strong> Links curtos são mais fáceis de digitar</li>
  <li><strong>Campanhas pagas:</strong> Rastreie qual anúncio ou canal gera mais cliques</li>
  <li><strong>QR Codes:</strong> Links curtos geram QR codes menores e mais fáceis de escanear</li>
</ul>

<h2>Funcionalidades do encurtador no Util Ferramentas</h2>
<div class="cards">
  <div class="card"><div class="icon">📊</div><h3>Analytics em tempo real</h3><p>Veja quantos cliques cada link recebeu, com histórico dos últimos 30 dias.</p></div>
  <div class="card"><div class="icon">📱</div><h3>QR Code automático</h3><p>Cada link curto gera automaticamente um QR code pronto para usar.</p></div>
  <div class="card"><div class="icon">⏰</div><h3>Data de expiração</h3><p>Configure uma data para o link expirar automaticamente — útil para promoções.</p></div>
  <div class="card"><div class="icon">✏️</div><h3>Slug personalizado</h3><p>Escolha o nome do seu link curto: <code>util.link/sua-campanha</code></p></div>
</div>

<h2>Como criar um link curto</h2>
<ol class="step-list">
  <li>Acesse o <a href="/checkout.html">plano Pro</a> e crie sua conta</li>
  <li>No painel, acesse "Encurtador de Links"</li>
  <li>Cole a URL que deseja encurtar</li>
  <li>Opcionalmente, defina um slug personalizado e data de expiração</li>
  <li>Clique em "Criar link" — seu link curto está pronto</li>
</ol>

<h2>Encurtador de links para negócios</h2>
<p>Para empresas e profissionais de marketing, rastrear o desempenho de links é essencial. Com o encurtador do Util Ferramentas você pode:</p>
<ul>
  <li>Criar links diferentes para cada canal (Instagram, WhatsApp, e-mail) e comparar qual gera mais cliques</li>
  <li>Saber exatamente quantas pessoas acessaram uma promoção específica</li>
  <li>Criar links com prazo de validade para ofertas temporárias</li>
  <li>Gerar QR codes para materiais físicos como banners, cartões de visita e embalagens</li>
</ul>

<div style="margin-top:2.5rem;padding:1.5rem;background:rgba(108,99,255,.08);border:1px solid rgba(108,99,255,.25);border-radius:12px;text-align:center">
  <p style="color:var(--txt);font-weight:600;margin-bottom:.5rem">Disponível no Plano Pro</p>
  <p style="color:var(--mut);font-size:.9rem;margin-bottom:1rem">Encurtador de links + Gerenciador de Dados + suporte prioritário</p>
  <a href="/checkout.html" style="display:inline-flex;align-items:center;gap:.5rem;background:var(--acc);color:#fff;padding:.875rem 2rem;border-radius:10px;font-weight:600;text-decoration:none">🔗 Assinar Plano Pro — R$29,90/mês</a>
</div>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(page('Encurtador de Links com Analytics — Util Ferramentas', 'Encurte links, rastreie cliques e gere QR codes. Encurtador de links profissional com analytics em tempo real, slug personalizado e data de expiração.', `${SITE_URL}/encurtar-links`, body));
});

// ─────────────────────────────────────────────────────────────────
// CONVERTER JSON EXCEL
// ─────────────────────────────────────────────────────────────────
seoRouter.get('/converter-json-excel', (_req, res) => {
  const body = `
<div class="breadcrumb"><a href="/">Início</a> › Conversor JSON↔Excel</div>
<span class="tag">Gratuito</span><span class="tag">Ferramenta</span>
<h1>Conversor JSON para Excel online — rápido e gratuito</h1>
<p class="lead">Transforme arquivos JSON em planilhas Excel (.xlsx) formatadas, ou converta planilhas Excel e CSV para JSON, de forma gratuita e sem instalar nenhum programa.</p>

<h2>O que é o conversor JSON↔Excel?</h2>
<p>O conversor JSON↔Excel do Util Ferramentas é uma ferramenta online que permite transformar dados no formato JSON em planilhas Excel prontas para uso, e também fazer o processo inverso: converter planilhas Excel (.xlsx) ou arquivos CSV em dados JSON estruturados.</p>
<p>É especialmente útil para desenvolvedores, analistas de dados, profissionais de TI e qualquer pessoa que precise trocar dados entre sistemas diferentes ou preparar relatórios a partir de APIs.</p>

<h2>Quando usar JSON → Excel?</h2>
<ul>
  <li>Exportar dados de uma API para uma planilha para análise</li>
  <li>Criar relatórios a partir de dados estruturados</li>
  <li>Compartilhar dados com pessoas que preferem planilhas</li>
  <li>Transformar respostas de APIs em tabelas legíveis</li>
  <li>Preparar dados para importação em ferramentas de BI</li>
</ul>

<h2>Quando usar Excel/CSV → JSON?</h2>
<ul>
  <li>Importar dados de planilhas para um banco de dados ou sistema</li>
  <li>Converter dados para enviar para uma API</li>
  <li>Processar planilhas em código (JavaScript, Python, etc.)</li>
  <li>Migrar dados entre sistemas diferentes</li>
</ul>

<h2>Como converter JSON para Excel</h2>
<ol class="step-list">
  <li>Acesse o <a href="/app5">Conversor JSON↔Excel</a></li>
  <li>Selecione o modo "JSON → Excel" no painel lateral</li>
  <li>Cole seu JSON no editor ou utilize os dados de exemplo</li>
  <li>Configure o nome da aba e as opções de formatação (cor do cabeçalho, linhas alternadas, etc.)</li>
  <li>Clique em "Preview" para visualizar como ficará a planilha</li>
  <li>Clique em "Converter para Excel" para baixar o arquivo .xlsx</li>
</ol>

<div class="tip"><strong>Formato esperado:</strong> O JSON deve ser um array de objetos, como <code>[{"nome": "Alice", "idade": 30}, {"nome": "Bruno", "idade": 25}]</code>. Cada chave do objeto se torna um cabeçalho de coluna.</div>

<h2>Formatação automática do Excel</h2>
<p>O conversor aplica automaticamente formatações profissionais na planilha gerada:</p>
<ul>
  <li><strong>Cabeçalho colorido</strong> — você escolhe a cor de fundo e o texto fica branco</li>
  <li><strong>Largura automática</strong> — cada coluna é redimensionada para o conteúdo</li>
  <li><strong>Linha congelada</strong> — o cabeçalho fica visível ao rolar a planilha</li>
  <li><strong>Linhas alternadas</strong> — facilita a leitura com fundo levemente diferente nas linhas pares</li>
  <li><strong>Múltiplas abas</strong> — envie um objeto com vários arrays e cada um vira uma aba</li>
</ul>

<h2>Detecção automática de tipos</h2>
<p>Ao converter Excel ou CSV para JSON, o conversor detecta automaticamente os tipos de dados em cada coluna:</p>
<table>
  <tr><th>Valor na planilha</th><th>Tipo detectado no JSON</th><th>Exemplo</th></tr>
  <tr><td>Números</td><td>number</td><td>42, 3.14, -10</td></tr>
  <tr><td>Texto</td><td>string</td><td>"Alice", "São Paulo"</td></tr>
  <tr><td>Verdadeiro/Falso</td><td>boolean</td><td>true, false</td></tr>
  <tr><td>Datas</td><td>string (ISO)</td><td>"2024-01-15"</td></tr>
  <tr><td>Célula vazia</td><td>null</td><td>null</td></tr>
</table>

<h2>Limite de tamanho</h2>
<p>O conversor aceita arquivos de até <strong>20 MB</strong> e processa arquivos JSON com centenas de milhares de linhas sem problemas. Para arquivos muito grandes (acima de 100.000 linhas), recomendamos dividir em partes para manter a performance.</p>

<div style="margin-top:2.5rem;padding:1.5rem;background:rgba(0,212,170,.06);border:1px solid rgba(0,212,170,.25);border-radius:12px;text-align:center">
  <p style="color:var(--txt);font-weight:600;font-size:1.05rem;margin-bottom:.75rem">Experimente agora — completamente gratuito</p>
  <a href="/app5" style="display:inline-flex;align-items:center;gap:.5rem;background:var(--ok);color:#0a0a0f;padding:.875rem 2rem;border-radius:10px;font-weight:600;font-size:.95rem;text-decoration:none">🔄 Abrir Conversor JSON↔Excel</a>
</div>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(page('Conversor JSON para Excel Online Grátis — Util Ferramentas', 'Converta JSON para Excel (.xlsx) e Excel/CSV para JSON online, grátis. Formatação automática, múltiplas abas, detecção de tipos. Sem instalar programas.', `${SITE_URL}/converter-json-excel`, body));
});

// ─────────────────────────────────────────────────────────────────
// SOBRE
// ─────────────────────────────────────────────────────────────────
seoRouter.get('/sobre', (_req, res) => {
  const body = `
<div class="breadcrumb"><a href="/">Início</a> › Sobre</div>
<h1>Sobre o Util Ferramentas</h1>
<p class="lead">O Util Ferramentas nasceu da necessidade de ter em um único lugar as ferramentas digitais mais usadas no dia a dia — sem propagandas excessivas, sem redirecionamentos desnecessários e sem complicações.</p>

<h2>Nossa missão</h2>
<p>Oferecer ferramentas online gratuitas, rápidas e confiáveis para qualquer pessoa, seja um estudante que precisa salvar uma aula em vídeo, um desenvolvedor que precisa converter dados entre formatos, ou um profissional de marketing que precisa encurtar e rastrear links.</p>

<h2>As ferramentas disponíveis</h2>
<div class="cards">
  <div class="card"><div class="icon">⬇️</div><h3>Download de Vídeos</h3><p>Salve vídeos de mais de 1000 plataformas em vários formatos e qualidades.</p></div>
  <div class="card"><div class="icon">🎵</div><h3>Extração de Áudio MP3</h3><p>Converta qualquer vídeo online para MP3 com qualidade de 192kbps.</p></div>
  <div class="card"><div class="icon">🔄</div><h3>Conversor JSON↔Excel</h3><p>Transforme dados estruturados entre JSON, Excel e CSV com formatação automática.</p></div>
  <div class="card"><div class="icon">🔗</div><h3>Encurtador de Links</h3><p>Crie links curtos rastreáveis com analytics e QR code integrado.</p></div>
  <div class="card"><div class="icon">🗃️</div><h3>Gerenciador de Dados</h3><p>Crie estruturas dinâmicas para organizar qualquer tipo de informação.</p></div>
</div>

<h2>Planos e preços</h2>
<p>As ferramentas de download de vídeos e o conversor JSON↔Excel são completamente gratuitos e sem limite de uso. O <a href="/checkout.html">Plano Pro</a> (R$29,90/mês) adiciona o encurtador de links com analytics e o gerenciador de dados dinâmicos.</p>

<h2>Contato</h2>
<p>Para dúvidas, sugestões ou relatar problemas, entre em contato pelo email disponível na <a href="/checkout.html">página de planos</a>. Respondemos em até 24 horas úteis.</p>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(page('Sobre — Util Ferramentas', 'Conheça o Util Ferramentas: ferramentas online gratuitas para download de vídeos, conversão MP3, encurtador de links e conversor JSON para Excel.', `${SITE_URL}/sobre`, body));
});

// ─────────────────────────────────────────────────────────────────
// PRIVACIDADE
// ─────────────────────────────────────────────────────────────────
seoRouter.get('/privacidade', (_req, res) => {
  const body = `
<div class="breadcrumb"><a href="/">Início</a> › Política de Privacidade</div>
<h1>Política de Privacidade</h1>
<p><em>Última atualização: ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</em></p>

<h2>1. Informações que coletamos</h2>
<p>O Util Ferramentas coleta apenas as informações necessárias para o funcionamento dos serviços:</p>
<ul>
  <li><strong>Dados de conta:</strong> nome e e-mail fornecidos durante o cadastro (apenas usuários do plano Pro)</li>
  <li><strong>Dados de uso:</strong> URLs processadas para download de vídeos (não são armazenadas permanentemente)</li>
  <li><strong>Dados técnicos:</strong> endereço IP para controle de abuso e segurança, logs de acesso padrão do servidor</li>
  <li><strong>Cookies:</strong> utilizamos cookies estritamente necessários para autenticação e preferências do usuário</li>
</ul>

<h2>2. Como usamos suas informações</h2>
<p>As informações coletadas são utilizadas exclusivamente para:</p>
<ul>
  <li>Fornecer os serviços solicitados (download de vídeos, conversão de dados, encurtamento de links)</li>
  <li>Autenticar usuários do plano Pro</li>
  <li>Prevenir abusos e garantir a segurança do serviço</li>
  <li>Enviar comunicações relacionadas à conta (alterações importantes, atualizações do serviço)</li>
</ul>

<h2>3. Compartilhamento de dados</h2>
<p>Não vendemos, alugamos nem compartilhamos seus dados pessoais com terceiros para fins comerciais. Os dados podem ser compartilhados apenas nas seguintes situações:</p>
<ul>
  <li>Quando exigido por lei ou determinação judicial</li>
  <li>Para proteção dos direitos do Util Ferramentas em caso de fraude ou abuso</li>
</ul>

<h2>4. Armazenamento e segurança</h2>
<p>Os arquivos processados (vídeos, planilhas, JSON) são tratados temporariamente no servidor apenas durante o processamento e removidos automaticamente após a entrega. Não mantemos cópias dos arquivos dos usuários.</p>
<p>Os dados de conta são armazenados em banco de dados seguro com criptografia de senha (bcrypt) e conexão SSL.</p>

<h2>5. Google AdSense e publicidade</h2>
<p>Utilizamos o Google AdSense para exibir anúncios em nossas páginas públicas. O Google pode usar cookies para exibir anúncios relevantes com base em suas visitas anteriores a este e outros sites. Você pode optar por não receber anúncios personalizados acessando as <a href="https://adssettings.google.com" rel="noopener noreferrer" target="_blank">Configurações de anúncios do Google</a>.</p>

<h2>6. Seus direitos</h2>
<p>De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:</p>
<ul>
  <li>Acessar os dados que possuímos sobre você</li>
  <li>Corrigir dados incorretos</li>
  <li>Solicitar a exclusão dos seus dados</li>
  <li>Portabilidade dos dados</li>
</ul>
<p>Para exercer esses direitos, entre em contato conosco pela <a href="/checkout.html">página de contato</a>.</p>

<h2>7. Alterações nesta política</h2>
<p>Esta política pode ser atualizada periodicamente. Notificaremos usuários cadastrados sobre alterações significativas por e-mail. O uso continuado do serviço após a publicação de alterações constitui aceitação das mesmas.</p>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(page('Política de Privacidade — Util Ferramentas', 'Política de privacidade do Util Ferramentas. Como coletamos, usamos e protegemos suas informações pessoais.', `${SITE_URL}/privacidade`, body));
});

// ─────────────────────────────────────────────────────────────────
// TERMOS
// ─────────────────────────────────────────────────────────────────
seoRouter.get('/termos', (_req, res) => {
  const body = `
<div class="breadcrumb"><a href="/">Início</a> › Termos de Uso</div>
<h1>Termos de Uso</h1>
<p><em>Última atualização: ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</em></p>

<h2>1. Aceitação dos termos</h2>
<p>Ao utilizar os serviços do Util Ferramentas, você concorda com estes termos de uso. Se não concordar com qualquer parte destes termos, não utilize nossos serviços.</p>

<h2>2. Uso permitido</h2>
<p>O Util Ferramentas é uma plataforma de ferramentas digitais para uso pessoal e profissional. Você pode utilizar nossas ferramentas para:</p>
<ul>
  <li>Baixar conteúdo que você tem direito de acessar</li>
  <li>Converter dados entre formatos para uso próprio ou profissional legítimo</li>
  <li>Encurtar links para seus próprios conteúdos ou conteúdos que você tem permissão para compartilhar</li>
</ul>

<h2>3. Uso proibido</h2>
<p>É expressamente proibido utilizar nossos serviços para:</p>
<ul>
  <li>Baixar conteúdo protegido por direitos autorais sem permissão do detentor dos direitos</li>
  <li>Distribuir, revender ou compartilhar conteúdo baixado de forma que viole direitos autorais</li>
  <li>Utilizar nossas ferramentas de forma automatizada (bots, scrapers) sem autorização prévia</li>
  <li>Tentar sobrecarregar, hackear ou comprometer a segurança do sistema</li>
  <li>Criar conteúdo ilegal ou que viole direitos de terceiros</li>
</ul>

<h2>4. Direitos autorais e propriedade intelectual</h2>
<p>O Util Ferramentas respeita os direitos autorais e espera que seus usuários façam o mesmo. O uso das ferramentas de download é de responsabilidade exclusiva do usuário, que deve garantir que possui os direitos necessários para baixar e usar o conteúdo.</p>

<h2>5. Limitação de responsabilidade</h2>
<p>O Util Ferramentas é fornecido "como está", sem garantias de disponibilidade contínua. Não nos responsabilizamos por:</p>
<ul>
  <li>Indisponibilidade temporária dos serviços</li>
  <li>Mudanças nas APIs de plataformas externas que afetem o funcionamento</li>
  <li>Uso indevido das ferramentas por parte dos usuários</li>
</ul>

<h2>6. Plano pago e reembolsos</h2>
<p>O Plano Pro é cobrado mensalmente. Cancelamentos podem ser feitos a qualquer momento e o acesso continua até o fim do período pago. Reembolsos podem ser solicitados em até 7 dias após a primeira cobrança caso o serviço não funcione conforme descrito.</p>

<h2>7. Alterações nos serviços</h2>
<p>Reservamos o direito de modificar, suspender ou encerrar qualquer parte dos serviços com aviso prévio de 30 dias para usuários do plano pago.</p>

<h2>8. Contato</h2>
<p>Para dúvidas sobre estes termos, entre em contato pela <a href="/checkout.html">página de contato</a>.</p>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(page('Termos de Uso — Util Ferramentas', 'Termos de uso do Util Ferramentas. Conheça as regras de uso das nossas ferramentas digitais gratuitas.', `${SITE_URL}/termos`, body));
});
