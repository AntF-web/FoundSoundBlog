/*
  FOUND / SOUND private editor
  Default passphrase: change-me-now

  IMPORTANT: This is only a client-side gate on a static site. It prevents casual
  access but is not strong authentication. To change the passphrase, replace the
  SHA-256 hash below. You can generate a SHA-256 hash with many local tools.
*/
const EDITOR_PASSWORD_SHA256 = 'ccc0b903bce51fb554262d742d0a282e1f8a87d064f1cf44f8ff5148ca4beb42';
const SESSION_KEY = 'foundSoundEditorUnlocked';

const lockScreen = document.querySelector('#lockScreen');
const editorApp = document.querySelector('#editorApp');
const unlockForm = document.querySelector('#unlockForm');
const passwordInput = document.querySelector('#password');
const lockMessage = document.querySelector('#lockMessage');
const postForm = document.querySelector('#postForm');
const formMessage = document.querySelector('#formMessage');
const outputMessage = document.querySelector('#outputMessage');
const jsonOutput = document.querySelector('#jsonOutput');
const tagChoices = document.querySelector('#tagChoices');

let baseData = { tags: {}, stories: [] };
let latestPost = null;

const fields = {
  date: document.querySelector('#date'),
  artist: document.querySelector('#artist'),
  location: document.querySelector('#location'),
  source: document.querySelector('#source'),
  url: document.querySelector('#url'),
  listenUrl: document.querySelector('#listenUrl'),
  imageUrl: document.querySelector('#imageUrl'),
  videoUrl: document.querySelector('#videoUrl'),
  customTags: document.querySelector('#customTags')
};

const languages = ['en', 'fr', 'es'];

function setMessage(element, message = '', type = '') {
  element.textContent = message;
  element.className = `form-message${type ? ` ${type}` : ''}`;
}

async function sha256(value) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function showEditor() {
  lockScreen.hidden = true;
  editorApp.hidden = false;
  loadBaseData();
}

function showLock() {
  editorApp.hidden = true;
  lockScreen.hidden = false;
  passwordInput.value = '';
  passwordInput.focus();
}

unlockForm.addEventListener('submit', async event => {
  event.preventDefault();
  const candidate = await sha256(passwordInput.value);
  if (candidate === EDITOR_PASSWORD_SHA256) {
    sessionStorage.setItem(SESSION_KEY, '1');
    setMessage(lockMessage, 'Unlocked.', 'success');
    showEditor();
  } else {
    setMessage(lockMessage, 'Incorrect passphrase.', 'error');
    passwordInput.select();
  }
});

document.querySelector('#lockButton').addEventListener('click', () => {
  sessionStorage.removeItem(SESSION_KEY);
  showLock();
});

function todayString() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function slugify(value) {
  return value.trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function selectedTags() {
  const checked = [...tagChoices.querySelectorAll('input[type="checkbox"]:checked')].map(input => input.value);
  const custom = fields.customTags.value.split(',').map(slugify);
  return unique([...checked, ...custom]);
}

function translationFor(language) {
  return {
    title: document.querySelector(`#title-${language}`).value.trim(),
    summary: document.querySelector(`#summary-${language}`).value.trim(),
    note: document.querySelector(`#note-${language}`).value.trim()
  };
}

function buildPost() {
  return {
    date: fields.date.value,
    artist: fields.artist.value.trim(),
    location: fields.location.value.trim(),
    source: fields.source.value.trim(),
    url: fields.url.value.trim(),
    listenUrl: fields.listenUrl.value.trim(),
    imageUrl: fields.imageUrl.value.trim(),
    videoUrl: fields.videoUrl.value.trim(),
    tags: selectedTags(),
    translations: {
      en: translationFor('en'),
      es: translationFor('es'),
      fr: translationFor('fr')
    }
  };
}

function mediaPreviewUrl(value = '') {
  const trimmed = String(value).trim();
  if (!trimmed) return '';
  try { return new URL(trimmed, window.location.href).href; }
  catch { return ''; }
}

function youtubeId(value = '') {
  try {
    const url = new URL(value, window.location.href);
    const host = url.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') return url.pathname.split('/').filter(Boolean)[0] || '';
    if (host.endsWith('youtube.com')) {
      if (url.pathname === '/watch') return url.searchParams.get('v') || '';
      return url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?#]+)/)?.[1] || '';
    }
  } catch {}
  return '';
}

function vimeoId(value = '') {
  try {
    const url = new URL(value, window.location.href);
    if (!url.hostname.replace(/^www\./, '').endsWith('vimeo.com')) return '';
    return [...url.pathname.split('/').filter(Boolean)].reverse().find(part => /^\d+$/.test(part)) || '';
  } catch {}
  return '';
}

function renderMediaPreview() {
  const preview = document.querySelector('#mediaPreview');
  const image = mediaPreviewUrl(fields.imageUrl.value);
  const video = mediaPreviewUrl(fields.videoUrl.value);
  const blocks = [];

  if (image) blocks.push(`<img src="${image.replace(/"/g, '&quot;')}" alt="Media preview" />`);

  if (video) {
    const yt = youtubeId(video);
    const vm = vimeoId(video);
    if (yt) blocks.push(`<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(yt)}" title="YouTube preview" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`);
    else if (vm) blocks.push(`<iframe src="https://player.vimeo.com/video/${encodeURIComponent(vm)}" title="Vimeo preview" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`);
    else if (/\.(mp4|webm|ogg)(?:[?#].*)?$/i.test(video)) blocks.push(`<video src="${video.replace(/"/g, '&quot;')}" controls preload="metadata" playsinline></video>`);
    else blocks.push('<p class="muted small">Video will appear as an external link because this URL is not recognised as YouTube, Vimeo or a direct video file.</p>');
  }

  preview.innerHTML = blocks.length ? blocks.join('') : '<p class="muted small">Optional. Add an image or video above to preview it here.</p>';
}

function refreshOutput() {
  latestPost = buildPost();
  jsonOutput.textContent = JSON.stringify(latestPost, null, 2);
  renderMediaPreview();
}

function renderTags() {
  const entries = Object.entries(baseData.tags || {});
  if (!entries.length) {
    tagChoices.innerHTML = '<span class="muted small">No existing tags loaded.</span>';
    return;
  }
  tagChoices.innerHTML = entries.map(([slug, labels]) => `
    <label class="tag-option">
      <input type="checkbox" value="${slug.replace(/"/g, '&quot;')}" />
      <span>${(labels.en || slug).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>
    </label>
  `).join('');
  tagChoices.querySelectorAll('input').forEach(input => input.addEventListener('change', refreshOutput));
}

async function loadBaseData() {
  if (baseData.stories.length || Object.keys(baseData.tags).length) return;
  try {
    const response = await fetch('stories.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Could not load stories.json');
    baseData = await response.json();
    renderTags();
    setMessage(outputMessage, `${baseData.stories?.length || 0} existing posts loaded.`, 'success');
  } catch (error) {
    baseData = { tags: {}, stories: [] };
    renderTags();
    setMessage(outputMessage, 'Could not load stories.json. You can still generate a single post, but the full-file download will contain only this new post.', 'error');
  }
  refreshOutput();
}

function ensureCustomTagLabels(data, tags) {
  data.tags ||= {};
  tags.forEach(tag => {
    if (!data.tags[tag]) data.tags[tag] = { en: tag, es: tag, fr: tag };
  });
}

function validatePost(post) {
  if (!post.date || !post.artist) return 'Date and artist are required.';
  for (const language of languages) {
    const translation = post.translations[language];
    if (!translation.title || !translation.summary) return `Title and summary are required in ${language.toUpperCase()}.`;
  }
  return '';
}

postForm.addEventListener('submit', event => {
  event.preventDefault();
  const post = buildPost();
  const error = validatePost(post);
  refreshOutput();
  if (error) {
    setMessage(formMessage, error, 'error');
    return;
  }
  latestPost = post;
  setMessage(formMessage, 'Post validated and ready.', 'success');
  setMessage(outputMessage, 'Use Copy post JSON or Download updated stories.json.', 'success');
});

postForm.addEventListener('input', refreshOutput);

[...document.querySelectorAll('.language-tab')].forEach(button => {
  button.addEventListener('click', () => {
    const language = button.dataset.lang;
    document.querySelectorAll('.language-tab').forEach(tab => {
      const active = tab === button;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    document.querySelectorAll('.translation-panel').forEach(panel => {
      const active = panel.dataset.panel === language;
      panel.hidden = !active;
      panel.classList.toggle('active', active);
    });
  });
});

document.querySelector('#copyPostButton').addEventListener('click', async () => {
  const post = buildPost();
  const error = validatePost(post);
  if (error) {
    setMessage(outputMessage, error, 'error');
    return;
  }
  try {
    await navigator.clipboard.writeText(JSON.stringify(post, null, 2));
    setMessage(outputMessage, 'Post JSON copied to clipboard.', 'success');
  } catch {
    setMessage(outputMessage, 'Clipboard access failed. Select the JSON above and copy it manually.', 'error');
  }
});

document.querySelector('#downloadStoriesButton').addEventListener('click', () => {
  const post = buildPost();
  const error = validatePost(post);
  if (error) {
    setMessage(outputMessage, error, 'error');
    return;
  }
  const updated = JSON.parse(JSON.stringify(baseData));
  updated.stories ||= [];
  ensureCustomTagLabels(updated, post.tags);
  updated.stories = [post, ...updated.stories].sort((a, b) => new Date(b.date) - new Date(a.date));

  const blob = new Blob([`${JSON.stringify(updated, null, 2)}\n`], { type: 'application/json' });
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = 'stories.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(href);
  setMessage(outputMessage, 'Updated stories.json downloaded.', 'success');
});

document.querySelector('#resetButton').addEventListener('click', () => {
  if (!confirm('Clear the entire form?')) return;
  postForm.reset();
  fields.date.value = todayString();
  setMessage(formMessage, 'Form cleared.');
  setMessage(outputMessage, '');
  refreshOutput();
});

fields.date.value = todayString();
refreshOutput();

if (sessionStorage.getItem(SESSION_KEY) === '1') showEditor();
else showLock();
