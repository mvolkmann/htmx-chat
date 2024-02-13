import {Context, Hono} from 'hono';
import type {FC} from 'hono/jsx';
import {z} from 'zod';
import {zValidator} from '@hono/zod-validator';

const people = ['Mark', 'Tami', 'Amanda', 'Jeremy'];

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
      <div hx-ext="ws" ws-connect="/chat/ws-client" {...attrs}>
        <form ws-send>
          <label>
            Send:
            <input name="message" type="text" />
          </label>
          <button>Submit</button>
        </form>
        <div id="response"></div>
      </div>
      <button onclick="wsClient.send('test')">Send Test</button>
      <main>
        <nav id="people">
          <h2>People</h2>
          {people.map(person => (
            <button hx-get="/chat/messages" hx-target="#message-list">
              {person}
            </button>
          ))}
        </nav>
        <section id="messages">
          <h2>Messages</h2>
          <ul id="message-list"></ul>
          <form wss>
            <input type="text" name="message" />
            <button>Send</button>
          </form>
        </section>
      </main>
    </Layout>
  );
});

/**
 * This creates a WebSocket server and returns a WebSocket client.
 * See https://developers.cloudflare.com/workers/examples/websockets/.
 */
router.get('/ws-client', (c: Context) => {
  const upgradeHeader = c.req.header('Upgrade');
  if (upgradeHeader !== 'websocket') {
    return c.text('upgrade header required', {status: 426});
  }

  const webSocketPair = new WebSocketPair();
  const [client, server] = Object.values(webSocketPair);

  server.accept();
  server.addEventListener('message', event => {
    const {data} = event;
    if (typeof data === 'string') {
      const {message} = JSON.parse(data);
      console.log('chat-router.tsx: message =', message);
      client.send(message.toUpperCase());
    } else {
      console.error('chat-router.tsx : unexpected data type', typeof data);
    }
  });

  return new Response(null, {
    status: 101, // switching protocols
    webSocket: client
  });
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

/*
interface NewDog {
  name: string;
  breed: string;
}

interface Dog extends NewDog {
  id: number;
}

let lastId = 0;

// The dogs are maintained in memory.
const dogMap: { [id: number]: Dog } = {};

function addDog(name: string, breed: string): Dog {
  const id = ++lastId;
  const dog = { id, name, breed };
  dogMap[id] = dog;
  return dog;
}

addDog("Comet", "Whippet");
addDog("Oscar", "German Shorthaired Pointer");

// This gets all the dogs as either JSON or HTML.
const getAllRoute = router.get("/", (c: Context) => {
  return c.json(dogMap);
});

// This gets one dog by its id as JSON.
const idSchema = z.object({
  id: z.coerce.number().positive(),
});
const idValidator = zValidator("param", idSchema);
const getOneRoute = router.get("/:id", idValidator, (c: Context) => {
  const id = Number(c.req.param("id"));
  const dog = dogMap[id];
  c.status(dog ? 200 : 404);
  return c.json(dog);
});

// This creates a new dog.
const dogSchema = z
  .object({
    id: z.number().positive().optional(),
    name: z.string().min(1),
    breed: z.string().min(2),
  })
  .strict(); // no extra properties allowed
const dogValidator = zValidator("json", dogSchema);
const createRoute = router.post("/", dogValidator, async (c: Context) => {
  const data = (await c.req.json()) as unknown as NewDog;
  const dog = addDog(data.name, data.breed);
  c.status(201);
  return c.json(dog);
});

// This updates the dog with a given id.
const updateRoute = router.put(
  "/:id",
  idValidator,
  dogValidator,
  async (c: Context) => {
    const id = Number(c.req.param("id"));
    const data = (await c.req.json()) as unknown as NewDog;
    const dog = dogMap[id];
    if (dog) {
      dog.name = data.name;
      dog.breed = data.breed;
    }
    c.status(dog ? 200 : 404);
    return c.json(dog);
  }
);

// This deletes the dog with a given id.
const deleteRoute = router.delete("/:id", idValidator, async (c: Context) => {
  const id = Number(c.req.param("id"));
  const dog = dogMap[id];
  if (dog) delete dogMap[id];
  c.status(dog ? 200 : 404);
  return c.text("");
});

export type CreateType = typeof createRoute;
export type DeleteType = typeof deleteRoute;
export type GetAllType = typeof getAllRoute;
export type GetOneType = typeof getOneRoute;
export type UpdateType = typeof updateRoute;
*/

export default router;
