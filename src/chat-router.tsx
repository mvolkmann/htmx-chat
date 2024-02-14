import {Context, Hono} from 'hono';
import type {FC} from 'hono/jsx';
import {z} from 'zod';
import {zValidator} from '@hono/zod-validator';

const questions: string[] = [];
const answers: string[] = [];

// This provides HTML boilerplate for any page.
const Layout: FC = props => {
  return (
    <html>
      <head>
        <title>{props.title}</title>
        <link rel="stylesheet" href="/styles.css" />
        <script src="/htmx.min.js"></script>
        <script src="/htmx-ws.js"></script>
      </head>
      <body>{props.children}</body>
    </html>
  );
};

const router = new Hono();

router.get('/', (c: Context) => {
  const attrs = {
    'hx-on:htmx:ws-after-send': 'document.querySelector("form").reset()'
  };
  return c.html(
    <Layout title="Chat Demo">
      <h1>Chat Away!</h1>
      <div hx-ext="ws" ws-connect="/ws" {...attrs}>
        <form ws-send>
          <label>
            Question:
            <input name="message" type="text" />
          </label>
          <button>Submit</button>
        </form>
      </div>
      <div id="response"></div>
      <main>
        <nav id="questions">
          <h2>Questions</h2>
          {questions.map(question => (
            <button hx-get="/chat/messages" hx-target="#message-list">
              {question}
            </button>
          ))}
        </nav>
        <section id="answers">
          <h2>Answers</h2>
          <ul id="answer-list"></ul>
        </section>
      </main>
    </Layout>
  );
});

router.get('/messages', (c: Context) => {
  return c.html(
    <>
      <li>Hello!</li>
      <li>How are you today?</li>
      <li>What time is dinner?</li>
    </>
  );
});

export default router;
