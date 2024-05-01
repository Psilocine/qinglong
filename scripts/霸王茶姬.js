const path = require("path");
const axios = require("axios");
const { sendNotify } = require(path.join(__dirname, "../../sendNotify.js"));

// config
const { url, headers, data } = require("./config.js");

// start
start();
function start() {
  console.log("start: required");
  axios
    .post(url, data, { headers })
    .then((res) => {
      const { data } = res.data;
      notify("霸王茶姬-签到", `${data.rewardDetailList[0].sendNum}积分`);
    })
    .catch((err) => {
      notify("霸王茶姬-签到失败", err);
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
