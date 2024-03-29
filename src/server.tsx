import {Context, Hono} from 'hono';
import {serveStatic} from 'hono/cloudflare-workers';

// @ts-ignore
import magic8Ball from './magic8ball.json';

// TODO: Why is this needed?
// @ts-ignore
import manifest from '__STATIC_CONTENT_MANIFEST';

let questionNumber = 0;

function getAnswer(question: string): string {
  const index = Math.floor(Math.random() * magic8Ball.length);
  return magic8Ball[index];
}

const app = new Hono();

app.delete('/question/:id', (c: Context) => {
  const id = c.req.param('id');
  const html = <tr id={'question' + id} hx-swap-oob="delete"></tr>;

  return new Response(html.toString());
});

// This serves static files from the
// [site] bucket directory specified in wrangler.toml.
app.get('/*', serveStatic({root: './', manifest}));

// This establishes a WebSocket connection.
app.get('/ws', (c: Context) => {
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
      questionNumber++;
      const answerId = 'answer' + questionNumber;
      const html = (
        <tbody id="table-body" hx-swap-oob="beforeend">
          <tr id={'question' + questionNumber}>
            <td class="question">
              <div>
                <div>{question}</div>
                <button
                  class="delete-btn"
                  hx-delete={'/question/' + questionNumber}
                >
                  ✕
                </button>
              </div>
            </td>
            <td class="answer" id={answerId}>
              <div>{getAnswer(question)}</div>
            </td>
          </tr>
        </tbody>
      );

      // Simulate slow responses.
      setTimeout(() => {
        server.send(html.toString());
      }, 1000);

      // Send more detail later.
      setTimeout(() => {
        const html = (
          <li id={answerId} hx-swap-oob="beforeend">
            <p>This provides more detail about the answer.</p>
          </li>
        );
        server.send(html.toString());
      }, 2000);
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
