const fs = require("fs-extra");
const path = require("path");
const https = require("https");

// 🔒 anti double trigger lock
const running = new Set();

const prefixFile = path.join(__dirname, "prefixData.json");

function ensurePrefixFile() {
  if (!fs.existsSync(prefixFile)) {
    fs.writeFileSync(prefixFile, JSON.stringify({}, null, 2));
  }
}

// ---- Shared function: always returns the ACTUAL current prefix for a thread ----
function getCurrentPrefix(threadID) {
  ensurePrefixFile();
  try {
    const data = JSON.parse(fs.readFileSync(prefixFile));
    return data[threadID] || global.GoatBot.config.prefix || ".";
  } catch (e) {
    return global.GoatBot.config.prefix || ".";
  }
}

function setPrefix(threadID, newPrefix) {
  ensurePrefixFile();
  const data = JSON.parse(fs.readFileSync(prefixFile));
  data[threadID] = newPrefix;
  fs.writeFileSync(prefixFile, JSON.stringify(data, null, 2));
}

const loadingSets = [
  [
    "𝐋𝐨𝐚𝐝𝐢𝐧𝐠 𝐏𝐫𝐞𝐟𝐢𝐱...\n▰▱▱▱▱▱▱▱▱▱ 10%",
    "𝐋𝐨𝐚𝐝𝐢𝐧𝐠 𝐏𝐫𝐞𝐟𝐢𝐱...\n▰▰▰▱▱▱▱▱▱▱ 30%",
    "𝐋𝐨𝐚𝐝𝐢𝐧𝐠 𝐏𝐫𝐞𝐟𝐢𝐱...\n▰▰▰▰▰▱▱▱▱▱ 50%",
    "𝐋𝐨𝐚𝐝𝐢𝐧𝐠 𝐏𝐫𝐞𝐟𝐢𝐱...\n▰▰▰▰▰▰▰▱▱▱ 70%",
    "𝐋𝐨𝐚𝐝𝐢𝐧𝐠 𝐏𝐫𝐞𝐟𝐢𝐱...\n▰▰▰▰▰▰▰▰▰▱ 90%",
    "𝐋𝐨𝐚𝐝𝐢𝐧𝐠 𝐏𝐫𝐞𝐟𝐢𝐱...\n▰▰▰▰▰▰▰▰▰▰ 100%"
  ],
  [
    "𝙇𝙤𝙖𝙙𝙞𝙣𝙜 𝙋𝙧𝙚𝙛𝙞𝙭...\n[■□□□□□□□□□] 10%",
    "𝙇𝙤𝙖𝙙𝙞𝙣𝙜 𝙋𝙧𝙚𝙛𝙞𝙭...\n[■■■□□□□□□□] 30%",
    "𝙇𝙤𝙖𝙙𝙞𝙣𝙜 𝙋𝙧𝙚𝙛𝙞𝙭...\n[■■■■■□□□□□] 50%",
    "𝙇𝙤𝙖𝙙𝙞𝙣𝙜 𝙋𝙧𝙚𝙛𝙞𝙭...\n[■■■■■■■□□□] 70%",
    "𝙇𝙤𝙖𝙙𝙞𝙣𝙜 𝙋𝙧𝙚𝙛𝙞𝙭...\n[■■■■■■■■■□] 90%",
    "𝙇𝙤𝙖𝙙𝙞𝙣𝙜 𝙋𝙧𝙚𝙛𝙞𝙭...\n[■■■■■■■■■■] 100%"
  ],
  [
    "𝙻𝚘𝚊𝚍𝚒𝚗𝚐 𝙿𝚛𝚎𝚏𝚒𝚡...\n◉□□□□□□□□□ 10%",
    "𝙻𝚘𝚊𝚍𝚒𝚗𝚐 𝙿𝚛𝚎𝚏𝚒𝚡...\n◉◉◉□□□□□□□ 30%",
    "𝙻𝚘𝚊𝚍𝚒𝚗𝚐 𝙿𝚛𝚎𝚏𝚒𝚡...\n◉◉◉◉◉□□□□□ 50%",
    "𝙻𝚘𝚊𝚍𝚒𝚗𝚐 𝙿𝚛𝚎𝚏𝚒𝚡...\n◉◉◉◉◉◉◉□□□ 70%",
    "𝙻𝚘𝚊𝚍𝚒𝚗𝚐 𝙿𝚛𝚎𝚏𝚒𝚡...\n◉◉◉◉◉◉◉◉◉□ 90%",
    "𝙻𝚘𝚊𝚍𝚒𝚗𝚐 𝙿𝚛𝚎𝚏𝚒𝚡...\n◉◉◉◉◉◉◉◉◉◉ 100%"
  ]
];

const gifs = [
  "https://i.imgur.com/zex8uo7.gif",
  "https://i.imgur.com/4ki8eBI.gif",
  "https://i.imgur.com/AMKQCJc.gif",
  "https://i.imgur.com/rkjO7YV.gif",
  "https://i.imgur.com/SgNPn8E.gif",
  "https://i.imgur.com/u3qB5y2.gif",
  "https://i.imgur.com/KUFxWlF.gif",
  "https://i.imgur.com/FV9krHV.gif",
  "https://i.imgur.com/lFrFMEn.gif",
  "https://i.imgur.com/KrEez4A.gif"
];

// ================= SHARED: "prefix" -> loading animation + gif + info card =================
// Called from BOTH onStart (normal command dispatch) AND onChat (manual no-prefix
// safety net below), so the exact same behaviour fires no matter which path
// the framework routes the message through — the user never needs to type the
// bot's prefix character first, just the word "prefix" by itself.
async function showPrefixInfo({ message, event, api }) {
  const key = event.threadID;
  if (running.has(key)) return;
  running.add(key);
  setTimeout(() => running.delete(key), 5000);

  const botPrefix = global.GoatBot.config.prefix || ".";
  const groupPrefix = getCurrentPrefix(event.threadID);

  const ping = Date.now() - event.timestamp;
  const day = new Date().toLocaleString("en-US", { weekday: "long" });
  const BOTNAME = global.GoatBot.config.nickNameBot || "KakashiBot";

  const textFrames = [
`╭─❍ ⟣ 𝗣𝗥𝗘𝗙𝗜𝗫 𝗜𝗡𝗙𝗢 ⟢ ❍─╮

  ⏱️  𝗣𝗶𝗻𝗴     : ${ping}ms
  📅  𝗗𝗮𝘆      : ${day}
  💠  𝗕𝗼𝘁 𝗣𝗿𝗲𝗳𝗶𝘅 : ${botPrefix}
  💬  𝗚𝗿𝗼𝘂𝗽 𝗣𝗿𝗲𝗳𝗶𝘅 : ${groupPrefix}
  🤖  𝗕𝗼𝘁 𝗡𝗮𝗺𝗲  : ${BOTNAME}

╰─❍ ⟣ 𝗧𝗛𝗔𝗡𝗞  𝗬𝗢𝗨 ⟢ ❍─╯`,

`┏━━━━━━━━━━━━━━━━━━━━┓
┃       ✦ 𝙋𝙍𝙀𝙁𝙄𝙓 𝙎𝙏𝘼𝙏𝙐𝙎 ✦        ┃
┣━━━━━━━━━━━━━━━━━━━━┫
┃ ⏱️  𝙋𝙞𝙣𝙜   ➜ ${ping}ms
┃ 📅  𝘿𝙖𝙮    ➜ ${day}
┃ 💠  𝙋𝙧𝙚𝙛𝙞𝙭  ➜ ${botPrefix}
┃ 💬  𝙂𝙧𝙤𝙪𝙥   ➜ ${groupPrefix}
┃ 🤖  𝘽𝙤𝙩     ➜ ${BOTNAME}
┗━━━━━━━━━━━━━━━━━━━━┛`,

`▁ ▂ ▃ ▄  𝐏𝐑𝐄𝐅𝐈𝐗 𝐈𝐍𝐅𝐎  ▄ ▃ ▂ ▁

  ➤ 𝐏𝐢𝐧𝐠         ⋮ ${ping}ms
  ➤ 𝐃𝐚𝐲          ⋮ ${day}
  ➤ 𝐁𝐨𝐭 𝐍𝐚𝐦𝐞     ⋮ ${BOTNAME}
  ➤ 𝐁𝐨𝐭 𝐏𝐫𝐞𝐟𝐢𝐱   ⋮ ${botPrefix}
  ➤ 𝐆𝐫𝐨𝐮𝐩 𝐏𝐫𝐞𝐟𝐢𝐱 ⋮ ${groupPrefix}

▔ ▔ ▔ ▔ ▔ ▔ ▔ ▔ ▔ ▔ ▔ ▔ ▔ ▔ ▔ ▔`,

`  ⟦ 𝙿 𝚁 𝙴 𝙵 𝙸 𝚇   𝚂 𝚃 𝙰 𝚃 𝚄 𝚂 ⟧

  ⌁ 𝙿𝚒𝚗𝚐          » ${ping}ms
  ⌁ 𝙳𝚊𝚢           » ${day}
  ⌁ 𝙿𝚛𝚎𝚏𝚒𝚡        » ${botPrefix}
  ⌁ 𝙶𝚛𝚘𝚞𝚙 𝙿𝚛𝚎𝚏𝚒𝚡  » ${groupPrefix}

  ⟦ 𝙿𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 ${BOTNAME} ⟧`
  ];

  const randomLoadingSet = loadingSets[Math.floor(Math.random() * loadingSets.length)];
  const randomGifUrl = gifs[Math.floor(Math.random() * gifs.length)];
  const randomText = textFrames[Math.floor(Math.random() * textFrames.length)];

  const msg = await message.reply(randomLoadingSet[0]);

  for (let i = 1; i < randomLoadingSet.length; i++) {
    await new Promise(r => setTimeout(r, 1000));
    api.editMessage(randomLoadingSet[i], msg.messageID);
  }

  await new Promise(r => setTimeout(r, 700));
  api.unsendMessage(msg.messageID);

  const cacheFolder = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheFolder)) fs.mkdirSync(cacheFolder);

  const gifName = path.basename(randomGifUrl);
  const gifPath = path.join(cacheFolder, gifName);

  if (!fs.existsSync(gifPath)) {
    await new Promise((resolve, reject) => {
      const file = fs.createWriteStream(gifPath);
      https.get(randomGifUrl, res => {
        res.pipe(file);
        file.on("finish", () => file.close(resolve));
      }).on("error", reject);
    });
  }

  running.delete(key);

  return api.sendMessage({
    body: randomText,
    attachment: fs.createReadStream(gifPath)
  }, event.threadID);
}

// ================= SHARED: "prefix set <newPrefix>" =================
async function handleSetPrefix({ message, event, api, args, threadsData }) {
  const key = event.threadID;
  if (running.has(key)) return;
  running.add(key);
  setTimeout(() => running.delete(key), 5000);

  const newPrefix = args[1];

  if (!newPrefix) {
    running.delete(key);
    return message.reply("❌ | Example: prefix set !");
  }

  // ---- Admin-only check (group admin OR bot admin) ----
  let isAdmin = false;
  try {
    const threadInfo = await api.getThreadInfo(event.threadID);
    const isGroupAdmin = threadInfo.adminIDs?.some(a => a.id == event.senderID);
    const isBotAdmin = global.GoatBot.config.adminBot?.includes(event.senderID);
    isAdmin = isGroupAdmin || isBotAdmin;
  } catch (e) {
    isAdmin = global.GoatBot.config.adminBot?.includes(event.senderID);
  }

  if (!isAdmin) {
    running.delete(key);
    return message.reply("❌ | শুধুমাত্র গ্রুপ এডমিন বা বট এডমিন প্রেফিক্স পরিবর্তন করতে পারবে।");
  }

  // ---- Only change THIS thread's prefix, never global ----
  setPrefix(event.threadID, newPrefix);

  if (threadsData) {
    try {
      await threadsData.set(event.threadID, newPrefix, "data.prefix");
    } catch (e) {}
  }

  running.delete(key);
  return message.reply(`✅ Prefix changed successfully for this group!\nNew Prefix: ${newPrefix}`);
}

module.exports = {
  config: {
    name: "prefix",
    version: "21.1",
    author: "HR ID OY",
    description: "Full prefix system with random animation + gif — works with no bot prefix needed",
    category: "Utility",
    role: 0,
    // 🔑 REQUIRED so "prefix" and "prefix set <newPrefix>" work WITHOUT the bot prefix
    usePrefix: false,
    guide: {
      en: "prefix -> show prefix info with animation (no bot prefix needed)\nprefix set <newPrefix> -> change prefix for this group (admin only)"
    }
  },

  onStart: async function ({ message, event, api, args, threadsData }) {
    if (args[0] === "set") {
      return handleSetPrefix({ message, event, api, args, threadsData });
    }
    return showPrefixInfo({ message, event, api });
  },

  // ================= NO-PREFIX SAFETY NET =================
  // Runs on every message regardless of the framework's usePrefix handling,
  // so "prefix" / "prefix set <x>" always fires the full flow above even if
  // usePrefix:false isn't honoured for some reason — and the bare prefix
  // character alone (e.g. "." or "!") still gets its quick one-line reply.
  onChat: async function ({ event, message, api, threadsData }) {
    if (!event.body) return;

    const body = event.body.trim();
    const lower = body.toLowerCase();

    // "prefix set <newPrefix>" typed with no bot prefix at all
    const setMatch = lower.match(/^prefix\s+set\s+(\S+)$/);
    if (setMatch) {
      return handleSetPrefix({
        message, event, api, threadsData,
        args: ["set", body.split(/\s+/)[2]]
      });
    }

    // bare word "prefix" typed with no bot prefix at all
    if (lower === "prefix") {
      return showPrefixInfo({ message, event, api });
    }

    // ---- ALWAYS read the ACTUAL live prefix for this thread, never hardcoded ----
    const currentPrefix = getCurrentPrefix(event.threadID);

    // Only reply if the ENTIRE message is exactly the current prefix, nothing else
    if (body === currentPrefix) {
      return message.reply("");
    }
  }
};
