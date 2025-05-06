import fs from 'fs';
import path from 'path';
import axios from 'axios';
import QRCode from 'qrcode';
import https from 'https'
import os from 'os'
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const func = {
  getBuffer: async (url, options = {}) => {
    try {
      const res = await axios({
        method: 'get',
        url,
        headers: {
          'DNT': 1,
          'Upgrade-Insecure-Request': 1,
        },
        responseType: 'arraybuffer',
        ...options,
      });
      return res.data;
    } catch (err) {
      console.error('Error in getBuffer:', err.message);
      throw new Error('Failed to fetch buffer.');
    }
  },

  Styles: async (text, style = 1) => {
    const xStr = 'abcdefghijklmnopqrstuvwxyz1234567890'.split('');
    const yStr = {
      1: 'ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘqʀꜱᴛᴜᴠᴡxʏᴢ1234567890',
      2: '𝓪𝓫𝓬𝓭𝓮𝓯𝓰𝓱𝓲𝓳𝓴𝓵𝓶𝓷𝓸𝓹𝓺𝓻𝓼𝓽𝓾𝓿𝔀𝔁𝔂𝔃1234567890',
      3: '𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫1234567890',
      4: '𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝗲𝗻𝘂𝘮𝗽𝗴𝘘',
      5: '𝘢𝘣𝘤𝘥𝘦𝘧𝘨𝘩𝘪𝘫𝘬𝘭𝘮𝘯𝘰𝘱𝘲𝘳𝘴𝘵𝘶𝘷𝘸𝘹𝘺1234567890',
    };

    if (!yStr[style]) return text;

    const replacer = xStr.map((v, i) => ({
      original: v,
      convert: yStr[style][i],
    }));

    return text
      .toLowerCase()
      .split('')
      .map(v => {
        const find = replacer.find(x => x.original === v);
        return find ? find.convert : v;
      })
      .join('');
  },

  bufferToImage: async (buffer) => {
    const mediaDir = path.resolve('./media/image');
    if (!fs.existsSync(mediaDir)) {
      fs.mkdirSync(mediaDir, { recursive: true });
    }
    const filePath = path.join(mediaDir, `${Date.now()}.jpg`);
    try {
      if (!Buffer.isBuffer(buffer)) {
        throw new Error('Input is not a valid buffer.');
      }
      fs.writeFileSync(filePath, buffer);
      if (fs.existsSync(filePath)) {
        return filePath;
      } else {
        throw new Error('Failed to save buffer to file.');
      }
    } catch (err) {
      console.error('Error in bufferToImage:', err.message);
      throw err;
    }
  },
  
  qrisDinamis: async (nominal, codeqr, toBuffer = false) => {
    const path = '../media/image/QRIS.png';

    function toCRC16(str) {
      function charCodeAt(str, i) {
        let get = str.substr(i, 1);
        return get.charCodeAt();
      }

      let crc = 0xFFFF;
      let strlen = str.length;
      for (let c = 0; c < strlen; c++) {
        crc ^= charCodeAt(str, c) << 8;
        for (let i = 0; i < 8; i++) {
          if (crc & 0x8000) {
            crc = (crc << 1) ^ 0x1021;
          } else {
            crc = crc << 1;
          }
        }
      }
      let hex = crc & 0xFFFF;
      hex = hex.toString(16).toUpperCase();
      if (hex.length === 3) {
        hex = "0" + hex;
      }
      return hex;
    }

    let qris = codeqr;
    let qris2 = qris.slice(0, -4);
    let replaceQris = qris2.replace("010211", "010212");
    let pecahQris = replaceQris.split("5802ID");
    let uang = "54" + ("0" + nominal.length).slice(-2) + nominal + "5802ID";

    let output = pecahQris[0] + uang + pecahQris[1] + toCRC16(pecahQris[0] + uang + pecahQris[1]);

    if (toBuffer) {
      return await QRCode.toBuffer(output, { margin: 2, scale: 10 });
    } else {
      await QRCode.toFile(path, output, { margin: 2, scale: 10 });
      return path;
    }
  },

  brat: async (conn, m, text, pack, author, quoted) => {
    const encodedText = encodeURIComponent(text);
    const response = await axios.get(`https://brat.caliphdev.com/api/brat?text=${encodedText}`, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);
    await conn.sendImageAsSticker(m.from, buffer, quoted, { packname: pack, author: author });
  },
  
  bratVideo: async (text) => {
    if (!text) throw new Error('Teks tidak boleh kosong');
    if (text.length > 250) throw new Error('Karakter terbatas, max 250!');

    const words = text.split(" ");
    const framePaths = [];

    try {
        for (let i = 0; i < words.length; i++) {
            const currentText = words.slice(0, i + 1).join(" ");

            const { data } = await axios.get(
                `https://aqul-brat.hf.space/?text=${encodeURIComponent(currentText)}`,
                { responseType: "arraybuffer" }
            );

            const framePath = `./frame${i}.mp4`;
            fs.writeFileSync(framePath, data);
            framePaths.push(framePath);
        }

        const fileListPath = "./filelist.txt";
        let fileListContent = "";

        for (const frame of framePaths) {
            fileListContent += `file '${frame}'\n`;
            fileListContent += `duration 0.5\n`;
        }

        fileListContent += `file '${framePaths[framePaths.length - 1]}'\n`;
        fileListContent += `duration 1.5\n`;

        fs.writeFileSync(fileListPath, fileListContent);
        const outputVideoPath = "./output.mp4";

        await execAsync(
            `ffmpeg -y -f concat -safe 0 -i ${fileListPath} -vf "fps=30" -c:v libx264 -preset superfast -pix_fmt yuv420p ${outputVideoPath}`
        );

        const buffer = fs.readFileSync(outputVideoPath);

        // Hapus file sementara
        for (const frame of framePaths) {
            if (fs.existsSync(frame)) fs.unlinkSync(frame);
        }
        if (fs.existsSync(fileListPath)) fs.unlinkSync(fileListPath);
        if (fs.existsSync(outputVideoPath)) fs.unlinkSync(outputVideoPath);

        return { buffer, type: 'video/mp4' };
    } catch (err) {
        throw new Error(err.message);
    }
  },

 
 catbox: async (buffer, filename = 'upload.jpg') => {
    return new Promise((resolve, reject) => {
        const tempPath = path.join(os.tmpdir(), filename)
        fs.promises.writeFile(tempPath, buffer).then(() => {
            const boundary = `----WebKitFormBoundary${Date.now().toString(16)}`
            const fileStream = fs.createReadStream(tempPath)
            let data = ''
            data += `--${boundary}\r\n`
            data += `Content-Disposition: form-data; name="reqtype"\r\n\r\nfileupload\r\n`
            data += `--${boundary}\r\n`
            data += `Content-Disposition: form-data; name="userhash"\r\n\r\n\r\n`
            data += `--${boundary}\r\n`
            data += `Content-Disposition: form-data; name="fileToUpload"; filename="${filename}"\r\n`
            data += `Content-Type: application/octet-stream\r\n\r\n`
            const dataBuffer = Buffer.from(data, 'utf-8')
            const endBuffer = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8')
            const options = {
                method: 'POST',
                hostname: 'catbox.moe',
                path: '/user/api.php',
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${boundary}`,
                    'User-Agent': 'Mozilla/5.0 (Android 10; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0'
                }
            }
            const req = https.request(options, (res) => {
                let responseData = ''
                res.on('data', (chunk) => {
                    responseData += chunk
                })
                res.on('end', () => {
                    fs.promises.unlink(tempPath).finally(() => resolve(responseData.trim()))
                })
            })
            req.on('error', (err) => {
                fs.promises.unlink(tempPath).finally(() => reject(err))
            })
            req.write(dataBuffer)
            fileStream.pipe(req, { end: false })
            fileStream.on('end', () => {
                req.write(endBuffer)
                req.end()
            })
        }).catch(reject)
    })
 },
 enhance: async (input) => {
  let buffer, ext;

  if (Buffer.isBuffer(input)) {
    buffer = input;
    ext = (await import('file-type')).fileTypeFromBuffer(input);
    ext = ext ? ext.ext : 'png';
  } else if (typeof input === 'string' && fs.existsSync(input)) {
    buffer = fs.readFileSync(input);
    ext = path.extname(input).slice(1) || 'bin';
  } else {
    throw new Error('Input harus berupa buffer atau path file yang valid.');
  }

  const mime = ext === 'png' ? 'image/png' :
               ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
               'application/octet-stream';

  const fileName = Math.random().toString(36).slice(2, 8) + '.' + ext;

  const { data } = await axios.post("https://pxpic.com/getSignedUrl", {
    folder: "uploads",
    fileName
  }, { headers: { "Content-Type": "application/json" } });

  await axios.put(data.presignedUrl, buffer, { headers: { "Content-Type": mime } });

  const url = "https://files.fotoenhancer.com/uploads/" + fileName;

  const api = await axios.post("https://pxpic.com/callAiFunction", new URLSearchParams({
    imageUrl: url,
    targetFormat: 'png',
    needCompress: 'no',
    imageQuality: '100',
    compressLevel: '6',
    fileOriginalExtension: ext,
    aiFunction: 'enhance',
    upscalingLevel: ''
  }).toString(), {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Android 10; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/png,image/svg+xml,*/*;q=0.8',
      'Content-Type': 'application/x-www-form-urlencoded',
      'accept-language': 'id-ID'
    }
  });

  return api.data.resultImageUrl;
 },
 deepAnalyze: async (data, options = {}) => {
  let result = { original: data, type: typeof data };

  if (typeof data === 'string') {
    result.words = data.split(/\s+/);
    result.sentences = data.split(/[.!?]/).map(s => s.trim()).filter(Boolean);
    result.lines = data.split('\n').map(s => s.trim()).filter(Boolean);
    result.length = data.length;
    result.isJSON = false;

    try {
      let jsonData = JSON.parse(data);
      result.isJSON = true;
      result.jsonParsed = await func.deepAnalyze(jsonData);
    } catch (e) {}
  }

  if (Array.isArray(data)) {
    result.length = data.length;
    result.items = data;
    result.types = data.map(item => typeof item);
    result.deepBreakdown = await Promise.all(data.map(async item => await func.deepAnalyze(item)));
  }

  if (Buffer.isBuffer(data)) {
    result.size = data.length;
    result.hex = data.toString('hex').slice(0, 100);
    result.base64 = data.toString('base64').slice(0, 100);
    result.utf8 = data.toString('utf-8').slice(0, 100);
  }

  if (typeof data === 'object' && data !== null) {
    result.keys = Object.keys(data);
    result.values = Object.values(data);
    result.entries = Object.entries(data);
    result.types = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, typeof value])
    );
    result.deepBreakdown = Object.fromEntries(
      await Promise.all(Object.entries(data).map(async ([key, value]) => [key, await func.deepAnalyze(value)]))
    );

    if (options.download && data.path && data.data instanceof Buffer) {
      const fsPromises = (await import('fs')).promises;
      await fsPromises.writeFile(data.path, data.data);
      result.fileSaved = data.path;
    }
  }

  if (typeof data === 'function') {
    result.functionName = data.name || 'anonymous';
    result.parameters = data.toString().match(/([^)]*)/)?.[1]?.split(',').map(s => s.trim()) || [];
    result.body = data.toString().split('{').slice(1).join('{').slice(0, -1).trim();
  }

  if (typeof data === 'bigint') {
    result.bigintValue = data.toString();
  }

  if (typeof data === 'symbol') {
    result.symbolKey = data.toString();
  }

  if (typeof data === 'undefined') {
    result.isUndefined = true;
  }

  if (typeof data === 'number') {
    result.isInteger = Number.isInteger(data);
    result.isFloat = !Number.isInteger(data);
    result.isFinite = Number.isFinite(data);
    result.isNaN = Number.isNaN(data);
  }

  if (typeof data === 'boolean') {
    result.isTrue = data === true;
    result.isFalse = data === false;
  }

  if (typeof data === 'object' && data !== null && options.dynamicImport) {
    try {
      let importedModule = await import(data);
      result.importedModule = await func.deepAnalyze(importedModule);
    } catch (e) {
      result.importError = e.message;
    }
  }

  if (typeof data === 'object' && data !== null && options.inspectPrototype) {
    let prototype = Object.getPrototypeOf(data);
    result.prototype = prototype ? await func.deepAnalyze(prototype) : null;
  }

  return result;
 },
};

export default func;