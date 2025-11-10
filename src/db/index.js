







// dataStore.js
const fs = require("fs");
const data = JSON.parse(fs.readFileSync("./src/db/data.json", "utf8"));

module.exports = data.list;
