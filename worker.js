export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Only intercept the root HTML page
    if (path === '/' || path === '/index.html') {
      const [htmlRes, dataObj] = await Promise.all([
        env.ASSETS.fetch(new Request(new URL('/index.html', url))),
        env.DATA_BUCKET.get('live_music_events.json'),
      ]);

      if (!dataObj) {
        return new Response('Data unavailable', { status: 503 });
      }

      const [html, json] = await Promise.all([htmlRes.text(), dataObj.text()]);

      // Inject before </body> so it's available when the inline script runs
      const injected = html.replace(
        '</body>',
        `<script>window.__EVENTS__=${json};</script>\n</body>`
      );

      return new Response(injected, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      });
    }

    return env.ASSETS.fetch(request);
  },
};
