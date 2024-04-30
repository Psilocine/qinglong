/**
 * v2.0
 *
 * 新增 history.json, 保存每日数据, 便于后续宏观统计
 *
 * 统计：
 * 折线图：认购、待售
 */
const https = require("https");
const querystring = require("querystring");
const fs = require("fs");
const path = require("path");
const { sendNotify } = require(path.join(__dirname, "../../sendNotify.js"));

// config
const {
  building,
  YESTERDAY_CACHE,
  HISTORY_CACHE,
  HTTP_OPTIONS,
} = require("./config.js");

const map = {};
let count = building.length;
let prevData;
let stat;

if (fs.existsSync(YESTERDAY_CACHE)) {
  const raw = fs.readFileSync(YESTERDAY_CACHE);
  if (raw) {
    prevData = JSON.parse(raw);
    stat = fs.statSync(YESTERDAY_CACHE);
  }
}

let historyData;
if (fs.existsSync(HISTORY_CACHE)) {
  historyData = JSON.parse(fs.readFileSync(HISTORY_CACHE));
} else {
  historyData = {};
}

let prevDate;
const nowDate = formatDate(new Date());
if (stat && stat.mtime) {
  const d = new Date(stat.mtime);
  prevDate = formatDate(d);
  if (prevDate === nowDate) {
    console.log("");
    console.log("\x1b[38;5;41m今日已更新, 情况如下:\x1b[0m");
    const _data = Object.values(prevData);
    const subscribeTotal = _data.reduce((v, p) => v + p.b, 0);
    const unSoldTotal = _data.reduce((v, p) => v + p.u, 0);
    console.log(`\x1b[38;5;81m认购:\x1b[0m ${subscribeTotal}套`);
    console.log(`\x1b[38;5;215m待售:\x1b[0m ${unSoldTotal}套`);
    console.log(`共计: ${subscribeTotal + unSoldTotal}套`);
    console.table(prevData);
    return;
  }
}

for (let i = 0; i < building.length; i++) {
  fetchInfo(building[i]);
}

let failNotify = false;
function fetchInfo(opt) {
  const { label, ...rest } = opt;
  const data = querystring.stringify({
    ...rest,
    t: +new Date(),
  });

  const req = https.request(HTTP_OPTIONS, (res) => {
    let response = "";

    res.on("data", (chunk) => {
      response += chunk;
    });

    res.on("end", () => {
      const s = response.match(/fw_ysfw/g)?.length || 0;
      const b = response.match(/fw_yrgfw/g)?.length || 0;
      const u = response.match(/fw_zz/g)?.length || 0;
      map[label] = {
        s: s,
        b: b,
        u: u,
      };

      const logText = `${label.padEnd(8)} 共${
        s + u + b
      }套: 已售:${s}套, 认购:${b}套, 未售:\x1b[31m${u}\x1b[0m套`;

      if (prevData && prevData[label]) {
        console.log(
          `${logText.padEnd(50)} ${prevDate} 已售${
            prevData[label].s
          }套, 环比:\x1b[31m${s - prevData[label].s}\x1b[0m套; 认购${
            prevData[label].b
          }套, 环比:\x1b[31m${b - prevData[label].b}\x1b[0m套`
        );
      } else {
        console.log(logText);
      }

      count--;
      if (count === 0) {
        write(YESTERDAY_CACHE, JSON.stringify(map));
        notify("长滩-昨日销量", map);

        // 存 history
        const _map = {};
        let _s = 0;
        let _b = 0;
        let _u = 0;
        for (const key in map) {
          if (Object.hasOwnProperty.call(map, key)) {
            _map[key] = JSON.stringify(map[key]);
            _s += map[key].s;
            _b += map[key].b;
            _u += map[key].u;
          }
        }

        /**
         * 结构
         *
         * date: JSON.stringify({
         *    t: { // total
         *      s: number, // sold
         *      b: number, // booked
         *      u: number, // unsold
         *    },
         *    d: { // description
         *      [building]: { s: number, b: number, u: number }
         *    }
         * })
         */
        if (!historyData[nowDate]) {
          historyData[nowDate] = JSON.stringify({
            t: {
              s: _s,
              b: _b,
              u: _u,
            },
            d: _map,
          });

          rewrite(HISTORY_CACHE, JSON.stringify(historyData));
        }
      }
    });
  });

  req.on("error", (error) => {
    if (!failNotify) {
      failNotify = true;
      notify("长滩-失败", error);
    }
    console.error(error);
  });

  req.write(data);
  req.end();
}

// send email ?
async function notify(text, desp) {
  await sendNotify(text, desp);
}

// modify local file ?
function rewrite(path, data) {
  fs.writeFileSync(path, data);
}

function formatDate(d) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
