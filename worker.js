import indexHtml from './index.html';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/' || path === '/index.html') {
      const dataObj = await env.DATA_BUCKET.get('live_music_events.json');
      if (!dataObj) return new Response('Data unavailable', { status: 503 });

      const json = await dataObj.text();
      const injected = indexHtml.replace(
        '<head>',
        `<head>\n<script>window.__EVENTS__=${json};</script>`
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
