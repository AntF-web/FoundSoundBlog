const storiesEl = document.querySelector('#stories');
const searchInput = document.querySelector('#searchInput');
const tagFilters = document.querySelector('#tagFilters');
const yearEl = document.querySelector('#year');
const languageSwitcher = document.querySelector('#languageSwitcher');
const metaDescription = document.querySelector('#metaDescription');

const supportedLanguages = ['en', 'es', 'fr'];
const dateLocales = { en: 'en-GB', es: 'es-ES', fr: 'fr-FR' };

const ui = {
  en: {
    pageTitle: 'Found / Sound — Independent Music Notes',
    description: 'A trilingual independent music blog for sounds, scenes, records and stories found across the web.',
    navStories: 'Stories', navAbout: 'About', navAria: 'Primary navigation', languageAria: 'Language',
    heroEyebrow: 'Independent music notes', heroTitle: 'Sounds worth<br>passing on.',
    heroCopy: 'Records, scenes, mixes, artists and musical rabbit holes found online — retold, contextualised and linked back to the original source.',
    filtersAria: 'Music filters', searchPlaceholder: 'Search music stories...', searchAria: 'Search music stories',
    all: 'All', noStories: 'No music stories found.', readArticle: 'Read article →', readOriginal: 'Read source ↗', listen: 'Listen ↗',
    aboutEyebrow: 'About this blog', aboutTitle: 'A listening notebook, not an algorithm.',
    aboutCopy: 'A personal selection of music and the stories around it. Each entry can be a short note or a complete article with text, images and video, while keeping credit and links to the original source.',
    footer: 'Independent notes for curious ears.',
    loadError: 'Could not load stories.json. Run this site through a local/web server instead of opening index.html directly.'
  },
  es: {
    pageTitle: 'Found / Sound — Notas de música independiente',
    description: 'Un blog musical independiente y trilingüe sobre sonidos, escenas, discos e historias encontradas en la web.',
    navStories: 'Historias', navAbout: 'Acerca de', navAria: 'Navegación principal', languageAria: 'Idioma',
    heroEyebrow: 'Notas de música independiente', heroTitle: 'Sonidos que vale la pena<br>compartir.',
    heroCopy: 'Discos, escenas, sesiones, artistas y caminos musicales encontrados en internet — recontados, contextualizados y enlazados a la fuente original.',
    filtersAria: 'Filtros musicales', searchPlaceholder: 'Buscar historias musicales...', searchAria: 'Buscar historias musicales',
    all: 'Todo', noStories: 'No se encontraron historias musicales.', readArticle: 'Leer artículo →', readOriginal: 'Leer fuente ↗', listen: 'Escuchar ↗',
    aboutEyebrow: 'Acerca de este blog', aboutTitle: 'Un cuaderno de escucha, no un algoritmo.',
    aboutCopy: 'Una selección personal de música y de las historias que la rodean. Cada entrada puede ser una nota breve o un artículo completo con texto, imágenes y vídeo, manteniendo los créditos y enlaces a la fuente original.',
    footer: 'Notas independientes para oídos curiosos.',
    loadError: 'No se pudo cargar stories.json. Ejecuta el sitio mediante un servidor local o web en lugar de abrir index.html directamente.'
  },
  fr: {
    pageTitle: 'Found / Sound — Notes de musique indépendante',
    description: 'Un blog musical indépendant et trilingue consacré aux sons, scènes, disques et histoires trouvés sur le web.',
    navStories: 'Histoires', navAbout: 'À propos', navAria: 'Navigation principale', languageAria: 'Langue',
    heroEyebrow: 'Notes de musique indépendante', heroTitle: 'Des sons qui méritent<br>de circuler.',
    heroCopy: 'Disques, scènes, mixes, artistes et détours musicaux découverts en ligne — racontés, contextualisés et reliés à leur source originale.',
    filtersAria: 'Filtres musicaux', searchPlaceholder: 'Rechercher des histoires musicales...', searchAria: 'Rechercher des histoires musicales',
    all: 'Tout', noStories: 'Aucune histoire musicale trouvée.', readArticle: 'Lire l’article →', readOriginal: 'Lire la source ↗', listen: 'Écouter ↗',
    aboutEyebrow: 'À propos de ce blog', aboutTitle: 'Un carnet d’écoute, pas un algorithme.',
    aboutCopy: 'Une sélection personnelle de musique et des histoires qui l’entourent. Chaque entrée peut être une note courte ou un article complet avec texte, images et vidéo, tout en conservant les crédits et les liens vers la source originale.',
    footer: 'Notes indépendantes pour oreilles curieuses.',
    loadError: 'Impossible de charger stories.json. Lancez ce site via un serveur local ou web au lieu d’ouvrir index.html directement.'
  }
};

yearEl.textContent = new Date().getFullYear();
let stories = [];
let tagLabels = {};
let activeTag = 'all';
let currentLanguage = getInitialLanguage();

function getInitialLanguage() {
  const saved = localStorage.getItem('foundSoundLanguage');
  if (supportedLanguages.includes(saved)) return saved;
  const browserLanguage = navigator.language?.slice(0, 2).toLowerCase();
  return supportedLanguages.includes(browserLanguage) ? browserLanguage : 'en';
}

function escapeHTML(value = '') {
  return String(value).replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);
}

function safeUrl(value = '') {
  const trimmed = String(value).trim();
  if (!trimmed) return '#';
  try {
    const url = new URL(trimmed, window.location.href);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '#';
  } catch { return '#'; }
}

function safeMediaUrl(value = '') {
  const trimmed = String(value).trim();
  if (!trimmed) return '';
  try {
    const url = new URL(trimmed, window.location.href);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}

function slugify(value = '') {
  return String(value).trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function translateStory(story) {
  return story.translations?.[currentLanguage] || story.translations?.en || { title: '', summary: '', note: '' };
}

function getStoryId(story) {
  if (story.id) return story.id;
  const title = story.translations?.en?.title || story.translations?.fr?.title || story.translations?.es?.title || story.artist || 'story';
  return `${story.date || 'post'}-${slugify(title)}`;
}

function getTagLabel(tag) {
  return tagLabels?.[tag]?.[currentLanguage] || tagLabels?.[tag]?.en || tag;
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat(dateLocales[currentLanguage], { year: 'numeric', month: 'short', day: '2-digit' })
    .format(new Date(`${dateString}T12:00:00`));
}

function getAllTags() {
  return [...new Set(stories.flatMap(story => story.tags || []))]
    .sort((a, b) => getTagLabel(a).localeCompare(getTagLabel(b), dateLocales[currentLanguage]));
}

function articleTextForSearch(story) {
  return (story.content || []).map(block => {
    if (block.type === 'text') return block.translations?.[currentLanguage] || block.translations?.en || '';
    return block.captions?.[currentLanguage] || block.captions?.en || '';
  }).join(' ');
}

function renderFeaturedImage(story, content) {
  const imageUrl = safeMediaUrl(story.imageUrl || '');
  if (!imageUrl) return '';
  return `<figure class="story-media story-image-wrap"><img class="story-image" src="${escapeHTML(imageUrl)}" alt="${escapeHTML(content.title || story.artist || '')}" loading="lazy" /></figure>`;
}

function updateStaticText() {
  const t = ui[currentLanguage];
  document.documentElement.lang = currentLanguage;
  document.title = t.pageTitle;
  metaDescription.setAttribute('content', t.description);
  document.querySelector('#navStories').textContent = t.navStories;
  document.querySelector('#navAbout').textContent = t.navAbout;
  document.querySelector('.nav').setAttribute('aria-label', t.navAria);
  languageSwitcher.setAttribute('aria-label', t.languageAria);
  document.querySelector('#heroEyebrow').textContent = t.heroEyebrow;
  document.querySelector('#heroTitle').innerHTML = t.heroTitle;
  document.querySelector('#heroCopy').textContent = t.heroCopy;
  document.querySelector('#filtersSection').setAttribute('aria-label', t.filtersAria);
  searchInput.placeholder = t.searchPlaceholder;
  searchInput.setAttribute('aria-label', t.searchAria);
  document.querySelector('#aboutEyebrow').textContent = t.aboutEyebrow;
  document.querySelector('#aboutTitle').textContent = t.aboutTitle;
  document.querySelector('#aboutCopy').textContent = t.aboutCopy;
  document.querySelector('#footerText').textContent = t.footer;
  languageSwitcher.querySelectorAll('button').forEach(button => {
    const isActive = button.dataset.lang === currentLanguage;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}

function renderFilters() {
  const tags = ['all', ...getAllTags()];
  tagFilters.innerHTML = tags.map(tag => {
    const label = tag === 'all' ? ui[currentLanguage].all : getTagLabel(tag);
    return `<button class="tag-button ${tag === activeTag ? 'active' : ''}" data-tag="${escapeHTML(tag)}">${escapeHTML(label)}</button>`;
  }).join('');
  tagFilters.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', () => {
      activeTag = button.dataset.tag;
      renderFilters();
      renderStories();
    });
  });
}

function renderStories() {
  const query = searchInput.value.trim().toLocaleLowerCase(dateLocales[currentLanguage]);
  const filtered = stories.filter(story => {
    const content = translateStory(story);
    const labels = (story.tags || []).map(getTagLabel);
    const matchesTag = activeTag === 'all' || (story.tags || []).includes(activeTag);
    const haystack = [content.title, content.summary, content.note, articleTextForSearch(story), story.artist, story.source, story.location, ...labels]
      .join(' ').toLocaleLowerCase(dateLocales[currentLanguage]);
    return matchesTag && haystack.includes(query);
  });

  if (!filtered.length) {
    storiesEl.innerHTML = `<p class="empty">${escapeHTML(ui[currentLanguage].noStories)}</p>`;
    return;
  }

  storiesEl.innerHTML = filtered.map((story, index) => {
    const content = translateStory(story);
    const source = content.source || story.source || '';
    const identity = [story.artist, story.location].filter(Boolean).map(escapeHTML).join(' · ');
    const listenUrl = safeUrl(story.listenUrl || '');
    const sourceUrl = safeUrl(story.url || '');
    const articleUrl = `article.html?id=${encodeURIComponent(getStoryId(story))}`;
    const number = String(index + 1).padStart(2, '0');

    return `
      <article class="story">
        <div class="story-meta">
          <span class="story-number">${number}</span>
          <div>${escapeHTML(formatDate(story.date))}</div>
          ${identity ? `<div class="story-identity">${identity}</div>` : ''}
        </div>
        <div class="story-main">
          <h2><a class="story-title-link" href="${escapeHTML(articleUrl)}">${escapeHTML(content.title)}</a></h2>
          ${renderFeaturedImage(story, content)}
          <p class="story-summary">${escapeHTML(content.summary)}</p>
          <p class="story-read"><a class="read-article-link" href="${escapeHTML(articleUrl)}">${escapeHTML(ui[currentLanguage].readArticle)}</a></p>
        </div>
        <div class="story-side">
          <div>
            <div class="story-tags">${(story.tags || []).map(tag => `<span class="story-tag">${escapeHTML(getTagLabel(tag))}</span>`).join('')}</div>
            ${source ? `<p class="source-name">${escapeHTML(source)}</p>` : ''}
          </div>
          <div class="story-links">
            ${story.listenUrl ? `<a class="action-link listen-link" href="${escapeHTML(listenUrl)}" target="_blank" rel="noopener noreferrer">${escapeHTML(ui[currentLanguage].listen)}</a>` : ''}
            ${story.url ? `<a class="action-link" href="${escapeHTML(sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHTML(ui[currentLanguage].readOriginal)}</a>` : ''}
          </div>
        </div>
      </article>`;
  }).join('');
}

function setLanguage(language) {
  if (!supportedLanguages.includes(language)) return;
  currentLanguage = language;
  localStorage.setItem('foundSoundLanguage', language);
  updateStaticText();
  renderFilters();
  renderStories();
}

languageSwitcher.addEventListener('click', event => {
  const button = event.target.closest('button[data-lang]');
  if (button) setLanguage(button.dataset.lang);
});
searchInput.addEventListener('input', renderStories);

updateStaticText();
fetch(`stories.json?ts=${Date.now()}`, { cache: 'no-store' })
  .then(response => { if (!response.ok) throw new Error('Could not load stories.json'); return response.json(); })
  .then(data => {
    tagLabels = data.tags || {};
    stories = (data.stories || []).sort((a, b) => new Date(b.date) - new Date(a.date));
    renderFilters();
    renderStories();
  })
  .catch(() => { storiesEl.innerHTML = `<p class="empty">${escapeHTML(ui[currentLanguage].loadError)}</p>`; });
