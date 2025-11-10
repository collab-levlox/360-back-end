const https = require("https");
const fs = require("fs");
const { initSocketServer } = require("./socketServer");

const prod = true;

let serverOptions = {};
if (prod) {
  serverOptions = {
    // cert: fs.readFileSync("/home/ubuntu/certs/cert.pem"),
    // key: fs.readFileSync("/home/ubuntu/certs/key.pem"),
  };
} else {
  console.error("HTTPS requires key and cert in non-prod mode");
  process.exit(1);
}

const wsServer = https.createServer(serverOptions);

initSocketServer(wsServer);

module.exports = wsServer;

