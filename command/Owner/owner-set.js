import { cmd } from '../../data/handler.js';

cmd.add({
  name: ['set'],
  type: 'Owner',
  usage: '.set -prefix on/off',
  async run({ m, conn, config }) {
  if(!m.isOwner) {
      m.reply("Anda Bukan Siapa-siapa saya")
  } else {
    const text = m.args.join(" ");

    if (!text.startsWith("-prefix ")) {
      return m.reply(
        "⚠️ Opsi tidak valid!\n\n" +
        "📌 **Gunakan format berikut:**\n" +
        "- `.set -prefix on` → Mengaktifkan multi-prefix.\n" +
        "- `.set -prefix off` → Menonaktifkan multi-prefix."
      );
    }

    const args = text.split(" ");
    const value = args[1];

    if (value === "on") {
      config.prefix.multiPrefix = true;
      config.prefix.noPrefix = false;
      return m.reply("✅ MultiPrefix diaktifkan!");
    } else if (value === "off") {
      config.prefix.multiPrefix = false;
      config.prefix.noPrefix = true;
      return m.reply("✅ MultiPrefix dinonaktifkan!");
    } else {
      return m.reply(
        "⚠️ Opsi untuk `-prefix` hanya bisa `on` atau `off`.\n\n" +
        "📌 **Gunakan format berikut:**\n" +
        "- `.set -prefix on` → Mengaktifkan multi-prefix.\n" +
        "- `.set -prefix off` → Menonaktifkan multi-prefix."
      );
    }
   }
  }
});

export default cmd;