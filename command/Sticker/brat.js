import { cmd } from '../../data/handler.js';

cmd.add({
 name: ["brat"],
 type: "Sticker",
 usage: ".brat Teks",
 async run({ m, conn, func, config }) {
  if(!m.text) {
    return m.reply("MANA TEXT NYA WOYYYYYY");
  } else if (m.text.length > 300) {
    return m.reply("Kepanjangan Asu! Maksimal 300 Huruf.");
  } else {
    try {
      await func.brat(conn, m, m.text, config.pack, config.author, m);
    } catch (error) {
      console.error(error);
      return m.reply("Ada yang error saat memproses perintah ini.");
    }
  }
 }
})

export default cmd;
 
  