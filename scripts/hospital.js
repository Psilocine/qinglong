const axios = require("axios");
const CronJob = require("cron").CronJob;
const nodemailer = require("nodemailer");
const qs = require("qs");

// config
let times = 0;
let lock = false;
const notifyTime = 100;
const config = require("./config.js");
const auth = require("../auth.js");
const { headers, params, constants } = config;
const transporter = nodemailer.createTransport({
  host: "smtp." + auth.user.match(/@(.*)/)[1],
  secure: true,
  port: 465,
  auth,
  tls: {
    // do not fail on invalid certs
    rejectUnauthorized: false,
  },
});
const TO = {
  from: `美丽厦门智慧健康 <${auth.user}>`,
  to: auth.address,
};

// start
// 每 2 分钟执行
const job = new CronJob("*/2  * * * *", function () {
  !lock && start();
});

job.start();

function start() {
  axios
    .post(constants.url, qs.stringify(params), { headers })
    .then(async (res) => {
      const { code, result, msg } = res.data;
      if (code === 500) {
        console.log(msg);
        await transporter.sendMail({
          ...TO,
          subject: "鉴权失败",
          text: `请重新配置鉴权参数`,
        });
        job.stop();
        times = 0;
        return;
      }
      if (result) {
        const { doctor } = JSON.parse(result);
        let idx = -1;
        for (let i = 0; i < doctor.date.length; i++) {
          const date = doctor.date[i];
          const condition = constants.includeVip
            ? date["@status"] !== "0" && date["@used"] < date.section.length
            : date["@status"] !== "0" &&
              date["@status"] !== "-1" &&
              date["@used"] < date.section.length;

          if (condition) {
            // 还有余号
            idx = i;
            break;
          }
        }

        times++;

        if (idx === -1) {
          console.log("没有号");
          if (times % notifyTime === 0) {
            await transporter.sendMail({
              ...TO,
              subject: `心跳：已查询${times}次`,
              text: `${constants.docName}: 暂无余号. ${JSON.stringify(
                doctor.date
              )}`,
            });
          }
        } else {
          console.log("有号");
          const date = doctor.date[idx];
          const unUsed = date.section.find((v) => v["@used"] === "0"); // 找到第一个未挂号的
          await transporter.sendMail({
            ...TO,
            subject: `${constants.docDept}-${constants.docName}`,
            text: `${unUsed["@start_time"]}有号`,
          });
          job.stop();
          lock = true;
          times = 0;
          // TODO: next feature 选择日期并挂号
        }
      }
    });
}
