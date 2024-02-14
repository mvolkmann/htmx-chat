import {Hono} from 'hono';
import {serveStatic} from 'hono/cloudflare-workers';
import chatRouter from './chat-router';
// TODO: I don't know why this is needed.
import manifest from '__STATIC_CONTENT_MANIFEST';

const magic8Ball = [
  'It is certain',
  'It is decidedly so',
  'Without a doubt',
  'Yes definitely',
  'You may rely on it',

  'As I see it, yes',
  'Most likely',
  'Outlook good',
  'Yes',
  'Signs point to yes',

  'Reply hazy, try again',
  'Ask again later',
  'Better not tell you now',
  'Cannot predict now',
  'Concentrate and ask again',

  "Don't count on it",
  'My reply is no',
  'My sources say no',
  'Outlook not so good',
  'Very doubtful'
];

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
  //TODO: How should "client" be used?
  const [client, server] = Object.values(webSocketPair);

  server.accept();

  server.addEventListener('message', event => {
    const {data} = event;
    if (typeof data === 'string') {
      const question = data.startsWith('{') ? JSON.parse(data).message : data;
      console.log('question =', question);
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

app.route('/chat', chatRouter);

export default app;
