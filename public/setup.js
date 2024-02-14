const ws = new WebSocket('ws://localhost:8787/ws');
if (!ws) {
  throw new Error("Server didn't accept WebSocket");
}

ws.addEventListener('open', () => {
  console.log('Opened WebSocket');
});

ws.addEventListener('message', message => {
  console.log('Received', message);
});

ws.addEventListener('close', message => {
  console.log('Closed WebSocket');
});

ws.addEventListener('error', message => {
  console.log('WebSocket error:', message);

  // Potentially reconnect the WebSocket connection, by instantiating a
  // new WebSocket as seen above, and connecting new events
  // websocket = new WebSocket(url)
  // websocket.addEventListener(...)
});

function wsSend(message) {
  console.log('Sending WebSocket message:', message);
  ws.send(message);
}
