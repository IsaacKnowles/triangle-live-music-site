import indexHtml from './index.html';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/' || path === '/index.html') {
      const [eventsObj, artistsObj] = await Promise.all([
        env.DATA_BUCKET.get('live_music_events.json'),
        env.DATA_BUCKET.get('artists_db.json'),
      ]);

      if (!eventsObj) return new Response('Data unavailable', { status: 503 });

      const eventsJson = await eventsObj.text();

      let genreMap = {};
      if (artistsObj) {
        const artists = JSON.parse(await artistsObj.text());
        for (const [slug, data] of Object.entries(artists)) {
          if (data.genre?.length) genreMap[slug] = data.genre;
        }
      } else {
        console.error('[worker] artists_db.json not found in R2 — serving without genre data');
      }

      const injected = indexHtml.replace(
        '<head>',
        `<head>\n<script>window.__EVENTS__=${eventsJson};window.__GENRES__=${JSON.stringify(genreMap)};</script>`
      );

      return new Response(injected, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      });
    }

    return new Response('Not Found', { status: 404 });
  },
};
