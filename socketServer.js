const WebSocket = require("ws");

let wss;

function initSocketServer(server) {
  wss = new WebSocket.Server({ server });

  wss.on("connection", (ws) => {
    ws.on("message", (msg) => {
      console.log("Received:", msg.toString());
      ws.send(`Echo: ${msg}`);
      sendToAll(msg);
    });

    ws.on("close", () => console.log("Client disconnected"));
  });

  wss.on("error", (err) => {
    console.log("Socket server error", err);
  });

  return wss;
}

function sendToAll(message) {
  if (!wss) return;
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

module.exports = { initSocketServer, sendToAll };
