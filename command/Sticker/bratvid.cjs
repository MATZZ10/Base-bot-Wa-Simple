const { cmd } = require('../../data/handler.js');

cmd.add({
  name: ['bratvideo'],
  type: 'Sticker',
  async run({ m, func, conn, config }) { 
    if(!m.text) {
      return m.reply("MANA TEXT NYA WOYYYYYY");
    } else if (m.text.length > 250) {
      return m.reply("Kepanjangan Asu! Maksimal 250 Karakter.");
    } else {
      const data = await func.bratVideo(m.text)
      const buffer = await data.buffer
 
      await conn.sendVideoAsSticker(m.chat, buffer, m, { packname: "Matzz", author: "Matzz" });
    }
  }
});

module.exports = cmd;