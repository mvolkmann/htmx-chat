import {Hono} from 'hono';
import {serveStatic} from 'hono/cloudflare-workers';
import chatRouter from './chat-router';
// TODO: I don't know why this is needed.
import manifest from '__STATIC_CONTENT_MANIFEST';

const app = new Hono();

// This serves static files from the
// [site] bucket directory specified in wrangler.toml.
app.get('/*', serveStatic({root: './', manifest}));

app.get('/', c => c.redirect('/chat'));

app.get('/ws', c => {
  const upgradeHeader = c.req.header('Upgrade');
  console.log('server.ts /ws: upgradeHeader =', upgradeHeader);
  if (upgradeHeader !== 'websocket') {
    return c.text('upgrade header required', {status: 426});
  }

  const webSocketPair = new WebSocketPair();
  const [client, server] = Object.values(webSocketPair);

  server.accept();
  server.addEventListener('message', event => {
    const message = event.data;
    console.log('message =', message);
    if (typeof message === 'string') {
      client.send(message.toUpperCase());
    } else {
      console.error('unexpected message type', typeof message);
    }
  });

  return new Response(null, {
    status: 101, // switching protocols
    webSocket: client
  });
});

app.route('/chat', chatRouter);

export default app;
