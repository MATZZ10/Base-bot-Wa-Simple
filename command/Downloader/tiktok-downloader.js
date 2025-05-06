import { Downloader } from "@tobyg74/tiktok-api-dl";
import pkg from "@fizzxydev/baileys-pro";
import { cmd } from "../../data/handler.js";
const { proto, generateWAMessageContent, generateWAMessageFromContent } = pkg;

cmd.add({
  name: ["ttdl", "tiktok", "tt"],
  type: "Downloader",
  usage: ".ttdl <link>",
  energyUsed: 10,
  async run({ m, conn, func }) {
    if (
      !m.args[0] ||
      !/^https?:\/\/(www\.|vm\.|vt\.)?tiktok\.com\//.test(m.args[0])
    ) {
      return m.reply("❌ Masukkan link TikTok yang valid!");
    }

    const hasil = await Downloader(m.args[0]);
    const response = hasil.result;

    let teks = `🌟 *Informasi Video TikTok* 🌟\n\n`;
    if (response.hashtag?.length) {
      teks += `📝 *Hashtag* : ${response.hashtag.map((tag) => `#${tag}`).join(" ")}\n\n`;
    } else {
      teks += `📝 *Hashtag* : Tidak ada\n\n`;
    }

    if (response.statistics) {
      const stats = response.statistics;
      teks += `📊 *Statistik Video* :\n`;
      teks += `   🔹 *Komentar* : ${stats.commentCount.toLocaleString()}\n`;
      teks += `   🔹 *Like* : ${stats.diggCount.toLocaleString()}\n`;
      teks += `   🔹 *Download* : ${stats.downloadCount.toLocaleString()}\n`;
      teks += `   🔹 *View* : ${stats.playCount.toLocaleString()}\n`;
      teks += `   🔹 *Share* : ${stats.shareCount.toLocaleString()}\n`;
      teks += `   🔹 *WhatsApp Share* : ${stats.whatsappShareCount.toLocaleString()}\n`;
      teks += `   🔹 *Koleksi* : ${stats.collectCount.toLocaleString()}\n`;
      teks += `   🔹 *Repost* : ${stats.repostCount.toLocaleString()}\n\n`;
    }

    if (response.author) {
      const author = response.author;
      teks += `👤 *Informasi Pembuat Video* :\n`;
      teks += `   🔹 *Username* : @${author.username}\n`;
      teks += `   🔹 *Nama* : ${author.nickname}\n`;
      teks += `   🔹 *Bio* : ${author.signature.replace(/\n/g, " ")}\n`;
      teks += `   🔹 *Region* : ${author.region}\n`;
      teks += `   🔹 *Profil* : 🔗 ${author.url}\n\n`;
    }

    if (response.type === "video" && response.video?.playAddr?.[0]) {
      const videoBuffer = await func.getBuffer(response.video.playAddr[0]);
      await conn.sendMessage(m.chat, {
        video: videoBuffer,
        caption: teks,
        quoted: m,
      });
    } else if (response.type === "image" && response.images?.length) {
      await sendInteractiveAlbum(m.chat, response.images, teks, m, conn);
    } else {
      m.reply("❌ Gagal mendapatkan media dari TikTok.");
    }
  },
});

async function createImage(url, conn) {
  const { imageMessage } = await generateWAMessageContent(
    { image: { url } },
    { upload: conn.waUploadToServer },
  );
  return imageMessage;
}

async function sendInteractiveAlbum(jid, imageUrls, caption, quoted, conn) {
  const cards = await Promise.all(
    imageUrls.map(async (url, index) => ({
      header: proto.Message.InteractiveMessage.Header.fromObject({
        title: `Image ${index + 1}`,
        hasMediaAttachment: true,
        imageMessage: await createImage(url, conn),
      }),
      body: proto.Message.InteractiveMessage.Body.fromObject({
        text: caption,
      }),
      nativeFlowMessage:
        proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
          buttons: [],
        }),
    })),
  );

  const msg = generateWAMessageFromContent(
    jid,
    {
      viewOnceMessage: {
        message: {
          messageContextInfo: {
            deviceListMetadata: {},
            deviceListMetadataVersion: 2,
          },
          interactiveMessage: proto.Message.InteractiveMessage.fromObject({
            carouselMessage:
              proto.Message.InteractiveMessage.CarouselMessage.fromObject({
                cards,
              }),
          }),
        },
      },
    },
    { quoted },
  );

  await conn.relayMessage(msg.key.remoteJid, msg.message, {
    messageId: msg.key.id,
  });
}

export default cmd;
