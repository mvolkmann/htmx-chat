import {Hono} from 'hono';
import {serveStatic} from 'hono/cloudflare-workers';
// TODO: I don't know why this is needed.
import manifest from '__STATIC_CONTENT_MANIFEST';

import magic8Ball from './magic8ball.json';

const app = new Hono();

// This serves static files from the
// [site] bucket directory specified in wrangler.toml.
app.get('/*', serveStatic({root: './', manifest}));

app.get('/ws', c => {
  const upgradeHeader = c.req.header('Upgrade');
  if (upgradeHeader !== 'websocket') {
    return c.text('upgrade header required', {status: 426});
  }

  const webSocketPair = new WebSocketPair();
  //TODO: How should "client" be used?
  const [client, server] = Object.values(webSocketPair);

  server.accept();

  server.addEventListener('message', event => {
    const {data} = event;
    if (typeof data === 'string') {
      const question = data.startsWith('{') ? JSON.parse(data).message : data;
      const index = Math.floor(Math.random() * magic8Ball.length);
      const answer = magic8Ball[index];
      const html = (
        <>
          <ul id="question-list" hx-swap-oob="beforeend">
            <li>{question}</li>
          </ul>
          <ul id="answer-list" hx-swap-oob="beforeend">
            <li>{answer}</li>
          </ul>
        </>
      );
      server.send(html.toString());
    } else {
      console.error('unexpected message data type', typeof data);
    }
  });

  return new Response(null, {
    status: 101, // switching protocols
    webSocket: client
  });
});

export default app;
