import {Hono} from 'hono';
import {serveStatic} from 'hono/cloudflare-workers';
import chatRouter from './chat-router';
import manifest from '__STATIC_CONTENT_MANIFEST';

const app = new Hono();

// This serves static files from the
// [site] bucket directory specified in wrangler.toml.
app.get('/*', serveStatic({root: './', manifest}));

app.get('/', c => c.redirect('/chat'));

app.route('/chat', chatRouter);

export default app;
