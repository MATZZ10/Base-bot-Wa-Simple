import { cmd } from '../../data/handler.js';
import fs from 'fs';

cmd.add({
  name: ["restart"],
  type: "Owner",
  usage: "restart",
  async run({ m, conn }) {
    if (!m.isOwner) return m.reply("Untuk Owner")
    await m.reply("Memproses _restart server_ . . .")
    return process.exit(0);
  }
});