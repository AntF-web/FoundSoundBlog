const root = document.querySelector('#articleRoot');
const languageSwitcher = document.querySelector('#languageSwitcher');
const backLink = document.querySelector('#backLink');
const footerText = document.querySelector('#footerText');
const metaDescription = document.querySelector('#metaDescription');
document.querySelector('#year').textContent = new Date().getFullYear();

const supportedLanguages = ['en', 'es', 'fr'];
const dateLocales = { en: 'en-GB', es: 'es-ES', fr: 'fr-FR' };
const labels = {
  en: { back: '← All stories', source: 'Read source ↗', listen: 'Listen ↗', video: 'Open video ↗', footer: 'Independent notes for curious ears.', missing: 'Article not found.' },
  es: { back: '← Todas las historias', source: 'Leer fuente ↗', listen: 'Escuchar ↗', video: 'Abrir vídeo ↗', footer: 'Notas independientes para oídos curiosos.', missing: 'Artículo no encontrado.' },
  fr: { back: '← Toutes les histoires', source: 'Lire la source ↗', listen: 'Écouter ↗', video: 'Ouvrir la vidéo ↗', footer: 'Notes indépendantes pour oreilles curieuses.', missing: 'Article introuvable.' }
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
function inlineLinks(value = '') {
  const text = String(value);
  const pattern = /\[([^\]\n]+)\]\(([^)\s]+)\)/g;
  let html = ''; let lastIndex = 0; let match;
  while ((match = pattern.exec(text))) {
    html += escapeHTML(text.slice(lastIndex, match.index));
    const href = safeArticleLink(match[2]);
    if (href) html += `<a class="article-inline-link" href="${escapeHTML(href)}"${articleLinkAttrs(href)}>${escapeHTML(match[1])}</a>`;
    else html += escapeHTML(match[0]);
    lastIndex = pattern.lastIndex;
  }
  html += escapeHTML(text.slice(lastIndex));
  return html;
}
function paragraphs(value = '') {
  return String(value).trim().split(/\n\s*\n/).filter(Boolean).map(paragraph => `<p>${inlineLinks(paragraph).replace(/\n/g, '<br>')}</p>`).join('');
}
function renderVideo(url, title) {
  const mediaUrl = safeMediaUrl(url); if (!mediaUrl) return '';
  const yt = getYouTubeId(mediaUrl); const vm = getVimeoId(mediaUrl);
  if (yt) return `<div class="article-video-frame"><iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(yt)}" title="${escapeHTML(title)}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`;
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
  const blocks = (story.content || []).map(block => renderBlock(block, content.title)).join('');
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
}

languageSwitcher.addEventListener('click', event => {
  const button = event.target.closest('button[data-lang]');
  if (!button) return;
  currentLanguage = button.dataset.lang;
  localStorage.setItem('foundSoundLanguage', currentLanguage);
  render();
});

const requestedId = new URLSearchParams(location.search).get('id');
fetch('stories.json', { cache: 'no-store' })
  .then(response => { if (!response.ok) throw new Error('stories'); return response.json(); })
  .then(data => {
    tagLabels = data.tags || {};
    story = (data.stories || []).find(item => getStoryId(item) === requestedId) || null;
    render();
  })
  .catch(() => { story = null; render(); });
render();
