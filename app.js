const express = require("express");
const createError = require("http-errors");
const helmet = require("helmet");
const routes = require("./src/route");
const hocError = require("./src/utils/hocError");
const logger = require("./src/utils/logger");
const cors = require("cors");
const app = express();

app.use(express.json());

app.use(helmet());
// app.use(express.text());
app.use(express.urlencoded({ extended: false }));
app.use(cors({ origin: "*" }));

app.use((req, res, next) => {
  console.log(req.method, "method");
  logger.info(`${req.method} ${req.url} `);
  logger.info(`body : ${JSON.stringify(req.body)}  `);
  logger.info(`params : ${JSON.stringify(req.query)}  `);
  next();
});

app.use("/360-api", routes);


app.use((req, res, next) => {
  next(createError.NotFound());
});

app.use(hocError);

module.exports = app;
