import { cmd } from "../../data/handler.js";
import moment from "moment";
import os from "os";
import process from "process";
import fs from "fs";

cmd.add({
  name: ["menu"],
  type: "Advance",
  usage: ".menu",
  async run({ m, conn, db, config }) {
    const user = db.options["user"].get(m.sender) || {};
    const menu = cmd.MenuCollection();
    const timeNow = moment().format("dddd, MMMM Do YYYY, h:mm:ss A");
    const botName = config.botname;
    const creator = "Matzz";
    const version = "Update";

    const userName = m.pushname || "Guest";
    const userId = m.sender || "Unknown";
    const userLevel = user.level || "1";
    const userXP = user.xp || "0";
    const userRole = user.role || "Member";
    const userCoins = user.coins || "0";
    const userRank = user.rank || "Newbie";
    const userRegistered = user.register
      ? "✅ Terdaftar"
      : "❌ Belum Terdaftar";
    const userPremium = user.premium ? "⭐ Premium" : "🔹 Reguler";
    const userWarnings = user.warnings || "0";
    const userMessages = user.messages || "0";

    const uptime = process.uptime();
    const platform = os.platform();
    const botMemoryUsage =
      (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + " MB";
    const totalCommands = Object.keys(cmd.commands).length;

    let cpuModel;
    if (os.cpus().length > 0 && os.cpus()[0].model) {
      cpuModel = os.cpus()[0].model;
    } else {
      cpuModel = "Not found";
    }
    let cpuSpeed;
    if (os.cpus().length > 0 && os.cpus()[0].speed) {
      cpuSpeed = os.cpus()[0].speed + " MHz";
    } else {
      cpuSpeed = "Not found";
    }
    const totalMemory = (os.totalmem() / 1024 / 1024).toFixed(2) + " MB";
    const freeMemory = (os.freemem() / 1024 / 1024).toFixed(2) + " MB";

    let menuText = "";
    menuText += "───────────────────────────\n";
    menuText += `🤖 *${botName} Menu* 🤖\n`;
    menuText += `🕒 *Waktu:* ${timeNow}\n`;
    menuText += `📌 *Version:* ${version}\n`;
    menuText += `👑 *Creator:* ${creator}\n\n`;

    menuText += "👤 *User Info:*\n";
    menuText += `🔹 *Nama:* ${userName}\n`;
    menuText += `🔹 *ID:* ${userId}\n`;
    menuText += `🔹 *Akun Premium:* ${userPremium}\n`;
    menuText += `🔹 *Peringatan:* ${userWarnings}\n`;
    menuText += `🔹 *Total Pesan:* ${userMessages}\n\n`;

    menuText += "⚙️ *Bot Info:*\n";
    menuText += `🔹 *Uptime:* ${Math.floor(uptime / 60)} menit\n`;
    menuText += `🔹 *Platform:* ${platform}\n`;
    menuText += `🔹 *Memory Usage:* ${botMemoryUsage}\n`;
    menuText += `🔹 *Total Commands:* ${totalCommands}\n\n`;

    menuText += "🖥 *Server Info:*\n";
    menuText += `🔹 *CPU:* ${cpuModel}\n`;
    menuText += `🔹 *CPU Speed:* ${cpuSpeed}\n`;
    menuText += `🔹 *Total Memory:* ${totalMemory}\n`;
    menuText += `🔹 *Free Memory:* ${freeMemory}\n`;
    menuText += "───────────────────────────\n\n";
    menuText += menu;
    menuText += "🔹 Gunakan perintah sesuai kategori!\n";

    const thumb = fs.readFileSync("./media/image/thumb.jpg");
    const fdoc = {
      key: {
        participant: "0@s.whatsapp.net",
        ...(m.chat ? { remoteJid: "status@broadcast" } : {}),
      },
      message: {
        documentMessage: {
          title: "Menu",
          jpegThumbnail: thumb,
        },
      },
    };

    await conn.sendMessage(m.chat, { react: { text: "⏱️", key: m.key } });
    await conn.sendMessage(
      m.chat,
      {
        text: menuText,
        contextInfo: {
          mentionedJid: [m.sender],
          forwardingScore: 999,
          isForwarded: true,
          externalAdReply: {
            title: "Matzz",
            body: "Matzz Super Bot",
            thumbnailUrl: "https://files.catbox.moe/h09j15.jpg",
            sourceUrl: "https://whatsapp.com/channel/0029Vb0t9P05vKA326ztrp3N",
            mediaType: 1,
            renderLargerThumbnail: true,
          },
        },
      },
      { quoted: fdoc },
    );
  },
});

export default cmd;
