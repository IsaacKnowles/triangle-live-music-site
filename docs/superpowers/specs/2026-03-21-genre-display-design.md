# Genre Display on Event Cards

**Date:** 2026-03-21
**Repo:** triangle-live-music-site
**Branch:** off of `seo-and-time-block-polish`

---

## Summary

Add genre display to event cards on the Triangle Live Music site. Genre data lives in `artists_db.json` in the data pipeline repo. This feature surfaces it on the frontend without modifying the data pipeline — keeping backend and frontend work decoupled.

---

## Scope

- **In scope:** Worker changes to inject a genre map, frontend card rendering of genre chips, genre included in text search
- **Out of scope:** Artist enrichment (handled separately in the data pipeline repo), genre filter chips, any changes to `live_music_events.json` schema or the CLI

---

## Architecture

### Data Flow

1. Worker fetches `live_music_events.json` and `artists_db.json` from R2 in parallel via `Promise.all()`
2. Worker builds a slim `{ slug: string[] }` genre map — only entries with a non-empty `genre` array
3. Both `window.__EVENTS__` and `window.__GENRES__` are injected into the HTML in a single `<script>` block
4. Frontend resolves genres per event at render time using artist slugs

### Payload size

- Current genre map (77 enriched artists): ~3.8KB
- Projected at full enrichment (~800 artists, avg 2 genres): ~25–30KB
- No performance concern relative to the existing 543KB events payload

### Worker fallback

If `artists_db.json` is missing or the R2 fetch fails, `window.__GENRES__` falls back to `{}`. Site remains fully functional; genre chips are simply absent.

---

## Worker Changes (`worker.js`)

```js
const [eventsObj, artistsObj] = await Promise.all([
  env.DATA_BUCKET.get('live_music_events.json'),
  env.DATA_BUCKET.get('artists_db.json'),
]);

const eventsJson = await eventsObj.text();

let genreMap = {};
if (artistsObj) {
  const artists = JSON.parse(await artistsObj.text());
  for (const [slug, data] of Object.entries(artists)) {
    if (data.genre?.length) genreMap[slug] = data.genre;
  }
}

const injected = indexHtml.replace(
  '<head>',
  `<head>\n<script>window.__EVENTS__=${eventsJson};window.__GENRES__=${JSON.stringify(genreMap)};</script>`
);
```

---

## Frontend Changes (`index.html`)

### Genre merge function

```js
function resolveGenres(artists) {
  const seen = new Set();
  const result = [];
  const ordered = [
    ...artists.filter(a => a.role === 'headliner'),
    ...artists.filter(a => a.role !== 'headliner'),
  ];
  for (const a of ordered) {
    for (const g of (window.__GENRES__?.[a.slug] || [])) {
      if (!seen.has(g) && result.length < 3) {
        seen.add(g);
        result.push(g);
      }
    }
  }
  return result;
}
```

- Headliner genres come first
- Support act genres fill remaining slots (up to 3 total)
- Deduplication across all artists
- Returns empty array when no genre data available

### Card rendering

- `resolveGenres(e.artists || [])` called inside `renderCard(e)`
- Renders genre chips only when the array is non-empty
- Chips styled as small pill tags using existing muted color variables — no venue color involvement
- Positioned below subtitle/presenter line

### Text search

Genre strings appended to the search haystack:

```js
const hay = [e.title, e.subtitle, e.presenter, e.venueName, ...genres].join(' ').toLowerCase();
```

Allows queries like "jazz", "punk", "ambient" to surface matching events.

---

## Styling

- Small pill chips, e.g. `font-size: 11px`, `color: var(--text-muted)`, subtle border
- No color coding — genres are not venue-specific
- Chips hidden entirely (no empty space) when genre array is empty
- Consistent with existing card metadata density

---

## Testing Checklist

- [ ] Events with genre data show correct chips (headliner-biased, max 3)
- [ ] Events without genre data show no chip elements and no empty space
- [ ] Multi-artist events deduplicate genres across the bill
- [ ] Text search for a genre term returns matching events
- [ ] Site loads and functions normally when `artists_db.json` is absent from R2
