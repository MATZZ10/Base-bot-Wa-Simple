import { jidDecode, downloadContentFromMessage } from '@whiskeysockets/baileys';
import fs from 'fs/promises';
import path from 'path';
import { fileTypeFromBuffer } from 'file-type';
import { imageToWebp, writeExifImg, writeExifVid, videoToWebp } from './exif.js';

export default function Sockets(conn, store) {
  conn.decodeJid = (jid) => {
    if (!jid) return null;
    if (/:\d+@/gi.test(jid)) {
      const decoded = jidDecode(jid) || {};
      return decoded.user ? `${decoded.user}@${decoded.server}` : jid;
    }
    return jid;
  };

  conn.download = async (message, saveToFile = false, filename = 'downloaded_file') => {
    try {
      const quoted = message.msg || message;
      const mime = quoted.mimetype || '';
      const messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
      const stream = await downloadContentFromMessage(quoted, messageType);

      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      if (!buffer.length) throw new Error('Buffer is empty');

      const type = await fileTypeFromBuffer(buffer);
      if (!type) throw new Error('Unable to determine file type');

      const ext = type.ext;
      const trueFileName = `${filename}.${ext}`;

      if (saveToFile) {
        const downloadPath = path.join(process.cwd(), 'temp', trueFileName);
        await fs.mkdir(path.dirname(downloadPath), { recursive: true });
        await fs.writeFile(downloadPath, buffer);
        return { fileName: downloadPath, buffer };
      }

      return { fileName: trueFileName, buffer };
    } catch (error) {
      console.error('Error downloading file:', error);
      return null;
    }
  };

  conn.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
    try {
      let buff;
      if (Buffer.isBuffer(path)) {
        buff = path;
      } else if (/^data:.*?\/.*?;base64,/i.test(path)) {
        buff = Buffer.from(path.split(',')[1], 'base64');
      } else if (/^https?:\/\//.test(path)) {
        buff = await (await fetch(path)).buffer();
      } else if (await fs.access(path).then(() => true).catch(() => false)) {
        buff = await fs.readFile(path);
      } else {
        throw new Error('Invalid path or buffer');
      }

      let buffer;
      if (options && (options.packname || options.author)) {
        buffer = await writeExifImg(buff, options);
      } else {
        buffer = await imageToWebp(buff);
      }

      await conn.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
      return buffer;
    } catch (error) {
      console.error('Error sending image as sticker:', error);
      return null;
    }
  };
  
  conn.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
    try {
        let buff;
        
        if (Buffer.isBuffer(path)) {
            buff = path;
        } else if (/^data:.*?\/.*?;base64,/i.test(path)) {
            buff = Buffer.from(path.split(',')[1], 'base64');
        } else if (/^https?:\/\//.test(path)) {
            buff = await (await fetch(path)).buffer();
        } else if (await fs.access(path).then(() => true).catch(() => false)) {
            buff = await fs.readFile(path);
        } else {
            throw new Error('Invalid path or buffer');
        }

        let buffer;
        if (options && (options.packname || options.author)) {
            buffer = await writeExifVid(buff, options);
        } else {
            buffer = await videoToWebp(buff);
        }

        await conn.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
        return buffer;
    } catch (error) {
        console.error('Error sending video as sticker:', error);
        return null;
    }
  };
}