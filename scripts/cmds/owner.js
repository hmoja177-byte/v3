const fs = require("fs-extra");
const https = require("https");
const path = require("path");

module.exports = {
  config: {
    name: "owner",
    version: "1.0.1",
    author: "Mehedi",
    role: 0,
    shortDescription: "Owner information with image",
    category: "Information",
    guide: {
      en: "owner"
    }
  },

  onStart: async function ({ api, event }) {

    const ownerText = `
╭━━━━ 👑 Oᴡɴᴇʀ Iɴғᴏ ━━━━╮

🏷 Nᴀᴍᴇ
└─ MOJAHAID 🤖 👑

🎀 Nɪᴄᴋ
└─Obi TO 🎀

🎂 Aɢᴇ
└─ 20😘

💞 Rᴇʟᴀᴛɪᴏɴ
└─ ❥۵།🌸𝐏𝐢𝐜𝐜𝐢♡︎R̶i̶n̶シ"🌸⎯⃝🦋

💼 Wᴏʀᴋ
└─ Job + bodybuilder 😎

🎓 Eᴅᴜᴄᴀᴛɪᴏɴ
└─ Sᴇᴄʀᴇᴛ 🤫

📍 Lᴏᴄᴀᴛɪᴏɴ
└─ Tangail 

╰━━━━━ 🔗 Cᴏɴᴛᴀᴄᴛ ━━━━━━╯

📘 Fʙ ➜ Moja haid

💬 Tɢ ➜ secret

📞 Wᴀ ➜ 01607091537
`;

    const cacheDir = path.join(__dirname, "cache");
    const imgPath = path.join(cacheDir, "owner.jpg");

    // Direct image URL
    const imgLink = "https://i.imgur.com/DzsX8sv.jpeg";

    try {
      // Create cache folder
      await fs.ensureDir(cacheDir);

      // Download image
      await new Promise((resolve, reject) => {
        const file = fs.createWriteStream(imgPath);

        https.get(imgLink, (response) => {

          if (response.statusCode !== 200) {
            file.close();
            fs.unlink(imgPath).catch(() => {});
            return reject(
              new Error("Image download failed: HTTP " + response.statusCode)
            );
          }

          response.pipe(file);

          file.on("finish", () => {
            file.close(resolve);
          });

        }).on("error", (error) => {
          file.close();
          fs.unlink(imgPath).catch(() => {});
          reject(error);
        });
      });

      // Send message with image
      api.sendMessage(
        {
          body: ownerText,
          attachment: fs.createReadStream(imgPath)
        },
        event.threadID,
        (err) => {
          // Delete cache after sending
          fs.unlink(imgPath).catch(() => {});

          if (err) {
            console.log("Send message error:", err);
          }
        },
        event.messageID
      );

    } catch (error) {

      console.log("Owner command error:", error);

      // If image fails, send text instead of crashing
      api.sendMessage(
        ownerText,
        event.threadID,
        event.messageID
      );
    }
  }
};
