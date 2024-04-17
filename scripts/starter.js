const fs = require("fs");
const path = require("path");
const axios = require("axios");
const nodemailer = require("nodemailer");
const qs = require("qs");
const { sendNotify } = require(path.json(
  __dirname,
  "../scripts/sendNotify.js"
));

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
