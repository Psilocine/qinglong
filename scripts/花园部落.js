const path = require("path");
const axios = require("axios");
const { sendNotify } = require(path.join(__dirname, "../../sendNotify.js"));

// config
const { url, data } = require("./config.js");

start();
// start
function start() {
  console.log("start: required");
  axios
    .post(url, data)
    .then((res) => {
      const { d } = res;
      notify("花园部落-签到", d.Msg);
    })
    .catch((err) => {
      notify("花园部落-签到失败", err);
    });
}
// send email ?
async function notify(text, desp) {
  await sendNotify(text, desp);
}
// modify local file ?
function rewrite() {
  console.log("alternative: rewrite");
}
