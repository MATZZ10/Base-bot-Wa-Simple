import util from 'util';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { downloadContentFromMessage } from '@fizzxydev/baileys-pro';
import { imageToWebp, writeExifImg } from './data/exif.js';
import axios from 'axios';
import func from './data/function.js';
import { createRequire } from 'module';
import { cmd } from './data/handler.js';
import moment from 'moment-timezone';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import * as Jimp from 'jimp';

const dynamicImport = async (modulePath) => {
  const require = createRequire(import.meta.url);
  return await require(modulePath);
};

const inspect = async (obj) => {
  if (typeof obj === 'object' || typeof obj === 'function') {
    return util.inspect(obj, { depth: 0 });
  }
  return String(obj);
};

export const Matzz = async (conn, m, chatUpdate, store, config, db) => {
  const { type } = m;
  let chats = type === 'conversation' ? m.message.conversation : type === 'imageMessage' ? m.message.imageMessage.caption : type === 'videoMessage' ? m.message.videoMessage.caption : type === 'extendedTextMessage' ? m.message.extendedTextMessage.text : type === 'buttonsResponseMessage' && m.quoted.fromMe && m.message.buttonsResponseMessage.selectedButtonId ? m.message.buttonsResponseMessage.selectedButtonId : type === 'templateButtonReplyMessage' && m.quoted.fromMe && m.message.templateButtonReplyMessage.selectedId ? m.message.templateButtonReplyMessage.selectedId : type === 'messageContextInfo' ? (m.message.buttonsResponseMessage?.selectedButtonId || m.message.listResponseMessage?.singleSelectReply.selectedRowId) : type === 'listResponseMessage' && m.quoted.fromMe && m.message.listResponseMessage.singleSelectReply.selectedRowId ? m.message.listResponseMessage.singleSelectReply.selectedRowId : '';
  
  if (!chats) chats = '';
  const budy = type === 'conversation' ? m.message.conversation : type === 'extendedTextMessage' ? m.message.extendedTextMessage.text : '';
  const prefix = /^[°•π÷×¶∆£¢€¥®=????+✓_=|~!?@#%^&.©^]/gi.test(chats) ? chats.match(/^[°•π÷×¶∆£¢€¥®=????+✓_=|~!?@#%^&.©^]/gi)[0] : '';
  const command = chats.replace(prefix, '').trim().split(/ +/).shift().toLowerCase();

//Function
const getTimeGreeting = (time) => {
    if (time >= "05:00:00" && time < "11:00:00") {
        return "Selamat Pagi 🌄";
    } else if (time >= "11:00:00" && time < "15:00:00") {
        return "Selamat Siang ☀️";
    } else if (time >= "15:00:00" && time < "18:00:00") {
        return "Selamat Sore 🌅";
    } else if (time >= "18:00:00" && time < "23:59:59") {
        return "Selamat Malam 🌃";
    } else {
        return "Selamat Tengah Malam 🌌";
    }
};

const time2 = moment.tz('Asia/Jakarta').format('HH : mm : ss')
const ingatwaktu = getTimeGreeting(time2);

//FAKE QUOTED
const thumb = fs.readFileSync('./media/image/thumb.jpg');
 const fdoc = {
   key: { 
     participant: '0@s.whatsapp.net', 
        ...(m.chat ? { remoteJid: 'status@broadcast' } : {})
        },
        message: {
          documentMessage: {
            title: `${config.botname}`,
            jpegThumbnail: thumb
        }
      }
   };
   
//Reply
const CReply = async(teks) => {
   await conn.sendMessage(m.chat, {
        text: teks,
        contextInfo: {
            mentionedJid: [m.sender],
            forwardingScore: 999,
            isForwarded: true,
            externalAdReply: {
                showAdAttribution: true,
                containsAutoReply: true,
                title: `${config.botname}`,
                body: `${ingatwaktu} ${m.pushname} 👋🏻`,
                previewType: "VIDEO",
                thumbnailUrl: 'https://files.catbox.moe/i43t9a.jpg',
                sourceUrl: 'https://xnxx.com'
            }
        }
    }, { quoted: fdoc });
};


switch (command) {
    default:
      if (budy.startsWith('>')) {
       if (!m.isOwner) return;
        try {
          const evaluate = await eval(`(async () => { ${budy.slice(1).trim()} })()`);
          const result = await inspect(evaluate);
          await m.reply(result);
        } catch (err) {
          await m.reply(String(err));
        }
      }
      if (budy.startsWith('=>')) {
        if (!m.isOwner) return;
        try {
          const evaled = await eval(budy.slice(2).trim());
          const result = await inspect(evaled);
          await m.reply(result);
        } catch (err) {
          await m.reply(String(err));
        }
      }

      if (budy.startsWith('$')) {
        if (!m.isOwner) return;
        exec(budy.slice(1).trim(), (err, stdout) => {
          if (err) return m.reply(String(err));
          if (stdout) return m.reply(stdout);
        });
      }
      break;
  }
};

const __filename = fileURLToPath(import.meta.url);

fs.watchFile(__filename, () => {
    fs.unwatchFile(__filename);
    console.log(chalk.redBright(`Update '${__filename}'`));
    import(`${import.meta.url}?update=${Date.now()}`);
});