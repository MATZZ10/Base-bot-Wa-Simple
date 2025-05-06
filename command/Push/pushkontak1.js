import { cmd } from '../../data/handler.js';
import fs from 'fs';

cmd.add({
  name: ['pushkontak'],
  type: "Push Kontak",
  async run({ m, conn }) {
    const text = m.args.join(" ");
    if (!m.isOwner) return m.reply("❌ Hanya pemilik yang dapat menggunakan perintah ini.");

    if (!text) {
      return m.reply("*Contoh Command :*\n.pushkontak idgc|mode|pesan1|pesan2|pesan3...\n\nMode:\n1️⃣ cepat\n2️⃣ normal (auto-adjust delay)\n3️⃣ custom|jeda(ms)\n\nKetik *.listidgc* untuk melihat ID grup.");
    }

    const parts = text.split("|");
    if (parts.length < 3) {
      return m.reply("*Format Salah!*\n.pushkontak idgc|mode|pesan1|pesan2|pesan3...\n\nMode:\n1️⃣ cepat\n2️⃣ normal (auto-adjust delay)\n3️⃣ custom|jeda(ms).\n\nKetik *.listidgc* untuk melihat ID grup.");
    }

    const [idnya, mode, ...pesanList] = parts;

    if (!idnya.endsWith("@g.us")) return m.reply("❌ Format ID Grup Tidak Valid!");
    if (pesanList.length === 0) return m.reply("❌ Minimal harus ada satu pesan!");

    let delay;
    try {
      const groupMetadata = await conn.groupMetadata(idnya);
      const totalMembers = groupMetadata.participants.length;

      if (mode.toLowerCase() === "cepat") {
        delay = totalMembers > 500 ? 5000 : 3000;
      } else if (mode.toLowerCase() === "normal") {
        delay = 7000;
      } else if (mode.toLowerCase().startsWith("custom")) {
        const customDelay = mode.split("custom|")[1];
        delay = Number(customDelay);
        if (isNaN(delay) || delay < 3000) return m.reply("❌ Format Jeda Custom Tidak Valid! Minimal 3000 ms.");
      } else {
        return m.reply("❌ Mode tidak valid. Pilih: cepat, normal, atau custom|jeda(ms).");
      }

      const participants = groupMetadata.participants;
      const halls = participants.filter(v => v.id.endsWith('.net')).map(v => v.id);

      if (halls.length === 0) return m.reply("⚠ Tidak ada kontak yang valid dalam grup.");

      let estimatedDelay = delay;
      let minDelay = 3000;
      let maxDelay = 30000;
      let lastSendTime = Date.now();
      const contacts = [];

      const totalTime = (halls.length * estimatedDelay) / 1000;
      const minutes = Math.floor(totalTime / 60);
      const seconds = Math.floor(totalTime % 60);
      const estimatedFinish = `${minutes} menit ${seconds} detik`;

      m.reply(`📢 Mengirim pesan ke *${halls.length}* anggota grup...\n⏳ Estimasi selesai: *${estimatedFinish}*`);

      for (let i = 0; i < halls.length; i++) {
        const mem = halls[i];
        let startTime = Date.now();

        try {
          const randomPesan = pesanList[Math.floor(Math.random() * pesanList.length)]; // Ambil pesan acak
          await conn.sendMessage(mem, { text: randomPesan }, { quoted: m });
          contacts.push(mem);
          fs.writeFileSync('./database/contacts.json', JSON.stringify(contacts));
        } catch (err) {
          console.log(`⚠ Gagal kirim ke ${mem}, lanjut...`);
        }

        let actualDelay = Date.now() - startTime;
        let delayDifference = actualDelay - estimatedDelay;

        if (delayDifference > 2000) {
          estimatedDelay = Math.min(estimatedDelay + 5000, maxDelay);
        } else if (delayDifference < -2000) {
          estimatedDelay = Math.max(estimatedDelay - 3000, minDelay);
        }

        await new Promise(resolve => setTimeout(resolve, estimatedDelay));
      }

      const uniqueContacts = [...new Set(contacts)];
      const vcardContent = uniqueContacts.map(contact => `
BEGIN:VCARD
VERSION:3.0
FN:BUYER [ ${global.ownername} ] ${contact.split("@")[0]}
TEL;type=CELL;type=VOICE;waid=${contact.split("@")[0]}:+${contact.split("@")[0]}
END:VCARD
      `.trim()).join("\n\n");

      fs.writeFileSync("./database/contacts.vcf", vcardContent, "utf8");

      if (m.chat !== m.sender) {
        await m.reply(`✅ Pesan berhasil dikirim ke *${halls.length}* anggota grup.\n📁 File kontak akan dikirim ke private chat.`);
      }

      await conn.sendMessage(m.sender, {
        document: fs.readFileSync("./database/contacts.vcf"),
        fileName: "contacts.vcf",
        caption: "✅ File kontak berhasil dibuat!",
        mimetype: "text/vcard"
      }, { quoted: m });

      fs.writeFileSync("./database/contacts.json", JSON.stringify([]));
      fs.writeFileSync("./database/contacts.vcf", "");
      
    } catch (err) {
      return m.reply(`❌ Terjadi kesalahan: ${err.message}`);
    }
  }
});

export default cmd;