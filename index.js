// const app = require("./app");
// const socketApp = require("./socket.app");
// const prisma = require("./prisma");
// const port = process.env.PORT || 8081;
// const socketPort = 8082;

// prisma
//   .$connect()
//   .then((i) => {
//     console.log("Prisma connected ");
//     app.listen(port, "0.0.0.0", () => {
//       console.log(`Server is running on port ${port}`);
//     });

//     // socketApp.listen(socketPort, "0.0.0.0", () => {
//     //   console.log(`Socket server is running on port ${socketPort}`);
//     // });
//   })
//   .catch((error) => {
//     console.error(error);
//   });

const fs = require("fs");
const https = require("https");
const prisma = require("./prisma");

const app = require("./app");
const socketApp = require("./socket.app");

const port = process.env.PORT || 8081;
const socketPort = 8082;

// Load SSL certificate and key
// const options = {
//   key: fs.readFileSync("./key.pem"),
//   cert: fs.readFileSync("./cert.pem"),
// };

const options = {
  key: fs.readFileSync("localhost+1-key.pem"),
  cert: fs.readFileSync("localhost+1.pem"),
};

// https.createServer(options, app).listen(8081, () => {
//   console.log("✅ HTTPS server running on https://localhost:8081");
// });

prisma
  .$connect()
  .then(() => {
    console.log("Prisma connected");

    // Create HTTPS server for your app
    https.createServer(options, app).listen(port, "0.0.0.0", () => {
      console.log(`HTTPS server is running on https://0.0.0.0:${port}`);
    });

    // If you also want socket server to use HTTPS
    // https.createServer(options, socketApp).listen(socketPort, "0.0.0.0", () => {
    //   console.log(`Socket server is running on https://0.0.0.0:${socketPort}`);
    // });
  })
  .catch((error) => {
    console.error("Prisma connection failed:", error);
  });
