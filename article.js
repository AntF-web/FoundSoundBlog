const root = document.querySelector('#articleRoot');
const languageSwitcher = document.querySelector('#languageSwitcher');
const backLink = document.querySelector('#backLink');
const footerText = document.querySelector('#footerText');
const metaDescription = document.querySelector('#metaDescription');
document.querySelector('#year').textContent = new Date().getFullYear();

const supportedLanguages = ['en', 'es', 'fr'];
const dateLocales = { en: 'en-GB', es: 'es-ES', fr: 'fr-FR' };
const labels = {
  en: { back: '← All stories', source: 'Read source ↗', listen: 'Listen ↗', video: 'Open video ↗', watchYoutube: 'Watch on YouTube ↗', videoUnavailable: 'This video cannot be played inside the article.', pdfOpen: 'Open PDF ↗', pdfDownload: 'Download PDF', bookletPrev: '← Previous', bookletNext: 'Next →', page: 'Page', footer: 'Independent notes for curious ears.', missing: 'Article not found.' },
  es: { back: '← Todas las historias', source: 'Leer fuente ↗', listen: 'Escuchar ↗', video: 'Abrir vídeo ↗', watchYoutube: 'Ver en YouTube ↗', videoUnavailable: 'Este vídeo no se puede reproducir dentro del artículo.', pdfOpen: 'Abrir PDF ↗', pdfDownload: 'Descargar PDF', bookletPrev: '← Anterior', bookletNext: 'Siguiente →', page: 'Página', footer: 'Notas independientes para oídos curiosos.', missing: 'Artículo no encontrado.' },
  fr: { back: '← Toutes les histoires', source: 'Lire la source ↗', listen: 'Écouter ↗', video: 'Ouvrir la vidéo ↗', watchYoutube: 'Voir sur YouTube ↗', videoUnavailable: 'Cette vidéo ne peut pas être lue directement dans l’article.', pdfOpen: 'Ouvrir le PDF ↗', pdfDownload: 'Télécharger le PDF', bookletPrev: '← Précédente', bookletNext: 'Suivante →', page: 'Page', footer: 'Notes indépendantes pour oreilles curieuses.', missing: 'Article introuvable.' }
};

let story = null;
let tagLabels = {};
let currentLanguage = initialLanguage();

function initialLanguage() {
  const saved = localStorage.getItem('foundSoundLanguage');
  if (supportedLanguages.includes(saved)) return saved;
  const browser = navigator.language?.slice(0, 2).toLowerCase();
  return supportedLanguages.includes(browser) ? browser : 'en';
}

function escapeHTML(value = '') {
  return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}
function safeMediaUrl(value = '') {
  const trimmed = String(value).trim();
  if (!trimmed) return '';
  try { const url = new URL(trimmed, window.location.href); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
}
function safeUrl(value = '') { return safeMediaUrl(value) || '#'; }
function slugify(value = '') {
  return String(value).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
function getStoryId(item) {
  if (item.id) return item.id;
  const title = item.translations?.en?.title || item.translations?.fr?.title || item.translations?.es?.title || item.artist || 'story';
  return `${item.date || 'post'}-${slugify(title)}`;
}
function translation(item) { return item.translations?.[currentLanguage] || item.translations?.en || { title: '', summary: '', note: '' }; }
function tagLabel(tag) { return tagLabels?.[tag]?.[currentLanguage] || tagLabels?.[tag]?.en || tag; }
function formatDate(date) { return new Intl.DateTimeFormat(dateLocales[currentLanguage], { year: 'numeric', month: 'long', day: '2-digit' }).format(new Date(`${date}T12:00:00`)); }
function getYouTubeId(value = '') {
  try {
    const url = new URL(value, window.location.href); const host = url.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') return url.pathname.split('/').filter(Boolean)[0] || '';
    if (host.endsWith('youtube.com')) {
      if (url.pathname === '/watch') return url.searchParams.get('v') || '';
      return url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?#]+)/)?.[1] || '';
    }
  } catch {} return '';
}
function getVimeoId(value = '') {
  try { const url = new URL(value, window.location.href); if (!url.hostname.replace(/^www\./, '').endsWith('vimeo.com')) return ''; return [...url.pathname.split('/').filter(Boolean)].reverse().find(part => /^\d+$/.test(part)) || ''; } catch { return ''; }
}
function safeArticleLink(value = '') {
  const trimmed = String(value).trim();
  if (!trimmed) return '';
  try {
    const url = new URL(trimmed, window.location.href);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}
function articleLinkAttrs(url) {
  try {
    const resolved = new URL(url, window.location.href);
    return resolved.origin === window.location.origin ? '' : ' target="_blank" rel="noopener noreferrer"';
  } catch { return ' target="_blank" rel="noopener noreferrer"'; }
}
function inlineMarkup(value = '') {
  const text = String(value);
  const pattern = /\[([^\]\n]+)\]\(([^)\s]+)\)|`([^`\n]+)`|\*\*([^*\n]+)\*\*|\*([^*\n]+)\*/g;
  let html = ''; let lastIndex = 0; let match;
  while ((match = pattern.exec(text))) {
    html += escapeHTML(text.slice(lastIndex, match.index));
    if (match[1] !== undefined) {
      const href = safeArticleLink(match[2]);
      html += href ? `<a class="article-inline-link" href="${escapeHTML(href)}"${articleLinkAttrs(href)}>${escapeHTML(match[1])}</a>` : escapeHTML(match[0]);
    } else if (match[3] !== undefined) html += `<code class="article-inline-code">${escapeHTML(match[3])}</code>`;
    else if (match[4] !== undefined) html += `<strong>${escapeHTML(match[4])}</strong>`;
    else if (match[5] !== undefined) html += `<em>${escapeHTML(match[5])}</em>`;
    lastIndex = pattern.lastIndex;
  }
  html += escapeHTML(text.slice(lastIndex));
  return html;
}
function paragraphs(value = '') {
  const lines = String(value).replace(/\r/g, '').trim().split('\n');
  const html = [];
  let paragraph = [];
  let listType = '';
  let listItems = [];
  let quoteLines = [];
  const flushParagraph = () => { if (paragraph.length) { html.push(`<p>${inlineMarkup(paragraph.join('\n')).replace(/\n/g, '<br>')}</p>`); paragraph = []; } };
  const flushList = () => { if (listItems.length) { html.push(`<${listType}>${listItems.map(item => `<li>${inlineMarkup(item)}</li>`).join('')}</${listType}>`); listItems = []; listType = ''; } };
  const flushQuote = () => { if (quoteLines.length) { html.push(`<blockquote>${quoteLines.map(line => `<p>${inlineMarkup(line)}</p>`).join('')}</blockquote>`); quoteLines = []; } };
  const flushAll = () => { flushParagraph(); flushList(); flushQuote(); };
  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line.trim()) { flushAll(); continue; }
    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      flushAll();
      const level = Math.min(5, heading[1].length + 1);
      html.push(`<h${level}>${inlineMarkup(heading[2].trim())}</h${level}>`);
      continue;
    }
    const unordered = line.match(/^[-+*]\s+(.+)$/);
    if (unordered) {
      flushParagraph(); flushQuote();
      if (listType && listType !== 'ul') flushList();
      listType = 'ul'; listItems.push(unordered[1]);
      continue;
    }
    const ordered = line.match(/^\d+\.\s+(.+)$/);
    if (ordered) {
      flushParagraph(); flushQuote();
      if (listType && listType !== 'ol') flushList();
      listType = 'ol'; listItems.push(ordered[1]);
      continue;
    }
    const quote = line.match(/^>\s?(.*)$/);
    if (quote) {
      flushParagraph(); flushList(); quoteLines.push(quote[1]); continue;
    }
    flushList(); flushQuote(); paragraph.push(line);
  }
  flushAll();
  return html.join('');
}
let youtubePlayerSerial = 0;
let youtubeApiPromise = null;

function youtubeFallbackMarkup(videoId, originalUrl, title = '') {
  const href = safeArticleLink(originalUrl) || `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
  const thumb = `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`;
  return `<div class="youtube-video-fallback">
    <a class="youtube-video-fallback__visual" href="${escapeHTML(href)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHTML(labels[currentLanguage].watchYoutube)}">
      <img src="${escapeHTML(thumb)}" alt="${escapeHTML(title || 'YouTube video')}" loading="lazy" />
      <span class="youtube-video-fallback__play" aria-hidden="true">▶</span>
    </a>
    <div class="youtube-video-fallback__body">
      <p>${escapeHTML(labels[currentLanguage].videoUnavailable)}</p>
      <a class="action-link" href="${escapeHTML(href)}" target="_blank" rel="noopener noreferrer">${escapeHTML(labels[currentLanguage].watchYoutube)}</a>
    </div>
  </div>`;
}

function replaceYouTubeWithFallback(shell) {
  if (!shell || shell.dataset.fallbackApplied === 'true') return;
  shell.dataset.fallbackApplied = 'true';
  const videoId = shell.dataset.youtubeId || '';
  const originalUrl = shell.dataset.youtubeUrl || '';
  const title = shell.dataset.youtubeTitle || '';
  shell.classList.add('article-video-frame--fallback');
  shell.innerHTML = youtubeFallbackMarkup(videoId, originalUrl, title);
}

function ensureYouTubeApi() {
  if (window.YT && typeof window.YT.Player === 'function') return Promise.resolve(window.YT);
  if (youtubeApiPromise) return youtubeApiPromise;
  youtubeApiPromise = new Promise((resolve, reject) => {
    const previousReady = window.onYouTubeIframeAPIReady;
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      if (window.YT && typeof window.YT.Player === 'function') resolve(window.YT);
      else reject(new Error('YouTube player API unavailable'));
    };
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previousReady === 'function') {
        try { previousReady(); } catch {}
      }
      finish();
    };
    if (!document.querySelector('script[data-found-sound-youtube-api]')) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.dataset.foundSoundYoutubeApi = 'true';
      script.onerror = () => reject(new Error('YouTube player API failed to load'));
      document.head.appendChild(script);
    }
    window.setTimeout(() => {
      if (!settled && window.YT && typeof window.YT.Player === 'function') finish();
      else if (!settled) reject(new Error('YouTube player API timeout'));
    }, 9000);
  }).catch(error => {
    youtubeApiPromise = null;
    throw error;
  });
  return youtubeApiPromise;
}

function initYouTubePlayers(container = document) {
  const shells = [...container.querySelectorAll('.youtube-player-shell:not([data-youtube-ready])')];
  if (!shells.length) return;
  ensureYouTubeApi().then(() => {
    shells.forEach(shell => {
      if (!shell.isConnected || shell.dataset.youtubeReady === 'true') return;
      shell.dataset.youtubeReady = 'true';
      const target = shell.querySelector('.youtube-player-target');
      const videoId = shell.dataset.youtubeId || '';
      if (!target || !videoId) { replaceYouTubeWithFallback(shell); return; }
      try {
        new window.YT.Player(target.id, {
          videoId,
          host: 'https://www.youtube-nocookie.com',
          playerVars: {
            rel: 0,
            playsinline: 1,
            origin: window.location.origin
          },
          events: {
            onError: event => {
              // 2 invalid ID, 5 HTML5 error, 100 removed/private,
              // 101/150 embedding disabled, 153 missing/invalid client identity.
              if ([2, 5, 100, 101, 150, 153].includes(Number(event.data))) replaceYouTubeWithFallback(shell);
            }
          }
        });
      } catch {
        replaceYouTubeWithFallback(shell);
      }
    });
  }).catch(() => shells.forEach(replaceYouTubeWithFallback));
}

function renderVideo(url, title) {
  const mediaUrl = safeMediaUrl(url); if (!mediaUrl) return '';
  const yt = getYouTubeId(mediaUrl); const vm = getVimeoId(mediaUrl);
  if (yt) { const playerId = `found-sound-yt-${++youtubePlayerSerial}`; return `<div class="article-video-frame youtube-player-shell" data-youtube-id="${escapeHTML(yt)}" data-youtube-url="${escapeHTML(mediaUrl)}" data-youtube-title="${escapeHTML(title)}"><div class="youtube-player-target" id="${playerId}"></div></div>`; }
  if (vm) return `<div class="article-video-frame"><iframe src="https://player.vimeo.com/video/${encodeURIComponent(vm)}" title="${escapeHTML(title)}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>`;
  if (/\.(mp4|webm|ogg)(?:[?#].*)?$/i.test(mediaUrl)) return `<div class="article-video-frame"><video src="${escapeHTML(mediaUrl)}" controls preload="metadata" playsinline></video></div>`;
  return `<div class="article-empty-video"><a class="action-link" href="${escapeHTML(mediaUrl)}" target="_blank" rel="noopener noreferrer">${escapeHTML(labels[currentLanguage].video)}</a></div>`;
}
function renderBlock(block, contentTitle) {
  if (block.type === 'text') {
    const text = block.translations?.[currentLanguage] || block.translations?.en || '';
    if (!text.trim()) return '';
    return `<section class="article-text">${paragraphs(text)}</section>`;
  }
  const caption = block.captions?.[currentLanguage] || block.captions?.en || '';
  if (block.type === 'image') {
    const url = safeMediaUrl(block.url || ''); if (!url) return '';
    const size = ['small', 'medium', 'large', 'wide'].includes(block.size) ? block.size : 'large';
    return `<figure class="article-media article-media--${size}"><img src="${escapeHTML(url)}" alt="${escapeHTML(caption || contentTitle)}" loading="lazy" />${caption ? `<figcaption class="article-caption">${escapeHTML(caption)}</figcaption>` : ''}</figure>`;
  }
  if (block.type === 'video') {
    const video = renderVideo(block.url || '', contentTitle); if (!video) return '';
    return `<figure class="article-media">${video}${caption ? `<figcaption class="article-caption">${escapeHTML(caption)}</figcaption>` : ''}</figure>`;
  }
  if (block.type === 'link') {
    const href = safeArticleLink(block.url || ''); if (!href) return '';
    const label = block.labels?.[currentLanguage] || block.labels?.en || href;
    return `<aside class="article-link-block"><a href="${escapeHTML(href)}"${articleLinkAttrs(href)}><span>${escapeHTML(label)}</span><span aria-hidden="true">↗</span></a></aside>`;
  }
  if (block.type === 'pdf') {
    const url = safeMediaUrl(block.url || ''); if (!url) return '';
    const pdfCaption = block.captions?.[currentLanguage] || block.captions?.en || '';
    const height = Math.min(1100, Math.max(420, Number(block.height) || 720));
    return `<figure class="article-document">
      <div class="article-pdf-frame" style="--pdf-height:${height}px"><iframe src="${escapeHTML(url)}#view=FitH" title="${escapeHTML(pdfCaption || contentTitle)}" loading="lazy"></iframe></div>
      ${pdfCaption ? `<figcaption class="article-caption">${escapeHTML(pdfCaption)}</figcaption>` : ''}
      <div class="article-document-actions"><a class="action-link" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(labels[currentLanguage].pdfOpen)}</a><a class="action-link" href="${escapeHTML(url)}" download>${escapeHTML(labels[currentLanguage].pdfDownload)}</a></div>
    </figure>`;
  }
  if (block.type === 'booklet') {
    const validPages = (block.pages || []).map(page => ({ page, url: safeMediaUrl(page.url || '') })).filter(item => item.url);
    const pages = validPages.map(({ page, url }, pageIndex) => {
      const pageCaption = page.captions?.[currentLanguage] || page.captions?.en || '';
      return `<figure class="booklet-page${pageIndex === 0 ? ' is-active' : ''}" data-page="${pageIndex}"><a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer"><img src="${escapeHTML(url)}" alt="${escapeHTML(pageCaption || `${labels[currentLanguage].page} ${pageIndex + 1}`)}" loading="lazy" /></a>${pageCaption ? `<figcaption class="article-caption">${escapeHTML(pageCaption)}</figcaption>` : ''}</figure>`;
    });
    if (!pages.length) return '';
    const display = ['slideshow', 'vertical', 'grid'].includes(block.display) ? block.display : 'slideshow';
    const bookletCaption = block.captions?.[currentLanguage] || block.captions?.en || '';
    const controls = display === 'slideshow' && pages.length > 1 ? `<div class="booklet-controls"><button type="button" data-booklet-action="prev">${escapeHTML(labels[currentLanguage].bookletPrev)}</button><span data-booklet-counter>1 / ${pages.length}</span><button type="button" data-booklet-action="next">${escapeHTML(labels[currentLanguage].bookletNext)}</button></div>` : '';
    return `<section class="article-booklet article-booklet--${display}" data-booklet data-current="0">${bookletCaption ? `<p class="booklet-caption">${escapeHTML(bookletCaption)}</p>` : ''}<div class="booklet-pages">${pages.join('')}</div>${controls}</section>`;
  }
  return '';
}

function render() {
  const l = labels[currentLanguage];
  document.documentElement.lang = currentLanguage;
  backLink.textContent = l.back; footerText.textContent = l.footer;
  languageSwitcher.querySelectorAll('button').forEach(button => { const active = button.dataset.lang === currentLanguage; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
  if (!story) { root.innerHTML = `<div class="article-error"><h1>${escapeHTML(l.missing)}</h1></div>`; return; }
  const content = translation(story);
  document.title = `${content.title} — Found / Sound`;
  metaDescription.setAttribute('content', content.summary || content.title);
  const identity = [story.artist, story.location].filter(Boolean).join(' · ');
  const featured = safeMediaUrl(story.imageUrl || '');
  const blocks = (story.content || []).map((block, index) => renderBlock(block, content.title, index)).join('');
  const fallbackVideo = !blocks && story.videoUrl ? `<figure class="article-media">${renderVideo(story.videoUrl, content.title)}</figure>` : '';
  root.innerHTML = `
    <article>
      <header class="article-header">
        <p class="article-kicker">${escapeHTML(formatDate(story.date))}${identity ? ` · ${escapeHTML(identity)}` : ''}</p>
        <h1 class="article-title">${escapeHTML(content.title)}</h1>
        ${content.summary ? `<p class="article-deck">${escapeHTML(content.summary)}</p>` : ''}
        <div class="article-tags">${(story.tags || []).map(tag => `<span class="story-tag">${escapeHTML(tagLabel(tag))}</span>`).join('')}</div>
        ${featured ? `<figure class="article-featured"><img src="${escapeHTML(featured)}" alt="${escapeHTML(content.title)}" /></figure>` : ''}
      </header>
      <div class="article-body">
        ${blocks || fallbackVideo || `<section class="article-text">${paragraphs(content.summary || '')}</section>`}
        ${content.note ? `<aside class="article-note">${paragraphs(content.note)}</aside>` : ''}
        <div class="article-actions">
          ${story.listenUrl ? `<a class="action-link listen-link" href="${escapeHTML(safeUrl(story.listenUrl))}" target="_blank" rel="noopener noreferrer">${escapeHTML(l.listen)}</a>` : ''}
          ${story.url ? `<a class="action-link" href="${escapeHTML(safeUrl(story.url))}" target="_blank" rel="noopener noreferrer">${escapeHTML(l.source)}</a>` : ''}
        </div>
      </div>
    </article>`;
  initYouTubePlayers(root);
}

root.addEventListener('click', event => {
  const button = event.target.closest('[data-booklet-action]');
  if (!button) return;
  const booklet = button.closest('[data-booklet]');
  if (!booklet) return;
  const pages = [...booklet.querySelectorAll('.booklet-page')];
  if (!pages.length) return;
  let current = Number(booklet.dataset.current || 0);
  current = button.dataset.bookletAction === 'next' ? (current + 1) % pages.length : (current - 1 + pages.length) % pages.length;
  booklet.dataset.current = String(current);
  pages.forEach((page, index) => page.classList.toggle('is-active', index === current));
  const counter = booklet.querySelector('[data-booklet-counter]');
  if (counter) counter.textContent = `${current + 1} / ${pages.length}`;
});

languageSwitcher.addEventListener('click', event => {
  const button = event.target.closest('button[data-lang]');
  if (!button) return;
  currentLanguage = button.dataset.lang;
  localStorage.setItem('foundSoundLanguage', currentLanguage);
  render();
});

const queryId = new URLSearchParams(location.search).get('id');
const fileId = decodeURIComponent(location.pathname.split('/').pop() || '').replace(/\.html$/i, '');
const requestedId = queryId || ((fileId && !['article', 'index', 'editor'].includes(fileId.toLowerCase())) ? fileId : '');
fetch(`stories.json?ts=${Date.now()}`, { cache: 'no-store' })
  .then(response => { if (!response.ok) throw new Error('stories'); return response.json(); })
  .then(data => {
    tagLabels = data.tags || {};
    story = (data.stories || []).find(item => getStoryId(item) === requestedId) || null;
    render();
  })
  .catch(() => { story = null; render(); });
render();
