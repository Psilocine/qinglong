const path = require("path");
const axios = require("axios");
const { sendNotify } = require(path.join(__dirname, "../../sendNotify.js"));

// config
const config = require(path.join(
  __dirname,
  // MODIFY
  "../scripts/personal/__MODIFY__.js"
));

// auth ?
async function auth() {
  console.log("alternative: auth");
}
// start
start();
function start() {
  console.log("start: required");
}
// send email ?
async function notify(text, desp) {
  await sendNotify(text, desp);
}
// modify local file ?
function rewrite() {
  console.log("alternative: rewrite");
}
