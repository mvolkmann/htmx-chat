import {Hono} from 'hono';
import {serveStatic} from 'hono/cloudflare-workers';

// @ts-ignore
import magic8Ball from './magic8ball.json';

// TODO: Why is this needed?
// @ts-ignore
import manifest from '__STATIC_CONTENT_MANIFEST';

function getAnswer(question: string): string {
  const index = Math.floor(Math.random() * magic8Ball.length);
  return magic8Ball[index];
}

const app = new Hono();

// This serves static files from the
// [site] bucket directory specified in wrangler.toml.
app.get('/*', serveStatic({root: './', manifest}));

// This establishes a WebSocket connection.
app.get('/ws', c => {
  const upgradeHeader = c.req.header('Upgrade');
  if (upgradeHeader !== 'websocket') {
    return c.text('WebSocket upgrade header required', {status: 426});
  }

  //TODO: How should "client" be used?
  const [client, server] = Object.values(new WebSocketPair());

  server.accept();

  server.addEventListener('message', event => {
    const {data} = event;
    if (typeof data === 'string') {
      const question = data.startsWith('{') ? JSON.parse(data).message : data;
      const html = (
        <>
          <ul id="question-list" hx-swap-oob="beforeend">
            <li>{question}</li>
          </ul>
          <ul id="answer-list" hx-swap-oob="beforeend">
            <li>{getAnswer(question)}</li>
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
