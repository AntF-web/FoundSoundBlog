# FOUND / SOUND — EN / ES / FR

A small static trilingual music blog for sharing records, artists, mixes, scenes, labels, radio shows and music stories discovered around the web.

Languages:

- English (`EN`)
- Spanish (`ES`)
- French (`FR`)

The visitor's selected language is remembered. On a first visit the site uses the browser language when it is English, Spanish or French, and falls back to English.

## Add or edit music posts

Open `stories.json`.

### Story format

```json
{
  "date": "2026-08-07",
  "artist": "Artist / DJ / label name",
  "location": "City or scene",
  "source": "Original publication / archive / radio station",
  "url": "https://original-source.example/article",
  "listenUrl": "https://artist-or-platform.example/listen",
  "imageUrl": "media/photo.jpg",
  "videoUrl": "https://www.youtube.com/watch?v=VIDEO_ID",
  "tags": ["artists", "releases"],
  "translations": {
    "en": {
      "title": "English title",
      "summary": "Your English retelling.",
      "note": "Your English personal note."
    },
    "es": {
      "title": "Título en español",
      "summary": "Tu resumen en español.",
      "note": "Tu comentario en español."
    },
    "fr": {
      "title": "Titre français",
      "summary": "Votre résumé en français.",
      "note": "Votre commentaire en français."
    }
  }
}
```

`artist`, `location`, `listenUrl`, `imageUrl`, `videoUrl` and even `url` are optional. If a field is empty, that element simply does not appear.

### Tags

The included music tags are:

- `releases`
- `scenes`
- `mixes`
- `artists`
- `labels`
- `radio`
- `archives`
- `club`

Add a new translated tag in the top `tags` object:

```json
"reggae": {
  "en": "reggae",
  "es": "reggae",
  "fr": "reggae"
}
```

## Run locally

Because posts are loaded from JSON, use a small local server instead of double-clicking `index.html`.

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## GitHub Pages

1. Create a GitHub repository.
2. Upload all files to the repository root.
3. Go to **Settings → Pages**.
4. Choose **Deploy from a branch**.
5. Select `main` and `/root`.

## Editorial approach

Use your own summaries, observations and criticism. Link clearly to the original article, artist, label, radio show or archive instead of copying full articles, photographs, lyrics or long passages without permission.

## Private new-post editor

This version includes `editor.html`, a small unlinked editor for creating posts without hand-writing JSON.

Open it on your deployed site at:

`https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/editor.html`

The page is intentionally **not linked from the public blog** and includes `noindex,nofollow` metadata.

### Default editor passphrase

`change-me-now`

Change it before publishing the site. In `editor.js`, replace `EDITOR_PASSWORD_SHA256` with the SHA-256 hash of your own passphrase.

**Important:** GitHub Pages is static hosting, so this browser-side passphrase is only a casual-access gate, not strong authentication. Anyone with enough technical knowledge and access to the deployed files can inspect the client-side code. Do not put secrets or sensitive drafts in this editor.

### Editor workflow

1. Open `editor.html` and unlock it.
2. Fill in the story basics, optional image/video, source/listening links, tags, and EN/FR/ES text.
3. Click **Generate post** to validate the required fields.
4. Either:
   - click **Copy post JSON** and paste the object into `stories.json`, or
   - click **Download updated stories.json** to get a full replacement file containing the new post plus all existing posts.
5. Replace/commit `stories.json` in GitHub. GitHub Pages will redeploy the blog.

Custom tags are automatically added to the downloaded file with the same label in all three languages. You can later edit those labels directly in the `tags` section of `stories.json` if you want translated tag names.
