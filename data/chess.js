import Chess from "./chessfunc.js";

let games = {};

export async function startChessGame({ m, conn }) {
    let sender = m.sender;

    if (Object.values(games).some(game => [game.white, game.black].includes(sender))) {
        return conn.sendMessage(m.from, { text: "⚠️ Kamu masih dalam permainan catur yang sedang berlangsung!" }, { quoted: m });
    }

    let gameId = `chess-${Date.now()}`;
    games[gameId] = {
        id: gameId,
        white: sender,
        black: null,
        game: new Chess(),
        state: "WAITING",
    };

    let instructions = `♟️ *Permainan Catur WhatsApp* ♟️\n\n` +
        `📝 *Cara Bermain:*\n` +
        `1. Ketik *.c join* untuk bergabung.\n` +
        `2. Pemain putih bergerak duluan.\n` +
        `3. Gunakan format sederhana untuk bergerak: *e2 e4* (dari petak e2 ke e4).\n` +
        `4. Bot akan mengecek pergerakan dan memberi tahu jika ada kesalahan.\n\n` +
        `⏳ Menunggu lawan...`;

    conn.sendMessage(m.from, { text: instructions }, { quoted: m });
}

export async function joinChessGame({ m, conn }) {
    let sender = m.sender;
    let game = Object.values(games).find(g => g.state === "WAITING");

    if (!game) {
        return conn.sendMessage(m.from, { text: `⚠️ Tidak ada permainan yang tersedia. Buat permainan dengan *.c start*!` }, { quoted: m });
    }

    if (game.white === sender) {
        return conn.sendMessage(m.from, { text: "⚠️ Kamu sudah masuk dalam permainan ini!" }, { quoted: m });
    }

    game.black = sender;
    game.state = "PLAYING";

    let whiteView = game.game.renderBoardFor(game.white);
    let blackView = game.game.renderBoardFor(game.black);

    let messageWhite = `♟️ *Permainan Catur Dimulai!*\n\n` +
        `👤 *Putih:* @${game.white.split('@')[0]}\n` +
        `⚫ *Hitam:* @${game.black.split('@')[0]}\n\n` +
        whiteView + `\n\n` +
        `👤 *Giliran:* @${game.game.turn === "w" ? game.white.split('@')[0] : game.black.split('@')[0]}\n` +
        `Gunakan format: *e2 e4* untuk bergerak!`;

    let messageBlack = `♟️ *Permainan Catur Dimulai!*\n\n` +
        `👤 *Putih:* @${game.white.split('@')[0]}\n` +
        `⚫ *Hitam:* @${game.black.split('@')[0]}\n\n` +
        blackView + `\n\n` +
        `👤 *Giliran:* @${game.game.turn === "w" ? game.white.split('@')[0] : game.black.split('@')[0]}\n` +
        `Gunakan format: *e2 e4* untuk bergerak!`;

    conn.sendMessage(game.white, { text: messageWhite, mentions: [game.white, game.black] }, { quoted: m });
    conn.sendMessage(game.black, { text: messageBlack, mentions: [game.white, game.black] }, { quoted: m });
}

export async function moveChessPiece({ m, conn }) {
    let sender = m.sender;
    let game = Object.values(games).find(g => [g.white, g.black].includes(sender) && g.state === "PLAYING");

    if (!game) {
        return conn.sendMessage(m.from, { text: "⚠️ Kamu tidak sedang bermain catur!" }, { quoted: m });
    }

    if ((game.game.turn === "w" && sender !== game.white) || (game.game.turn === "b" && sender !== game.black)) {
        return conn.sendMessage(m.from, { text: "⏳ Bukan giliranmu!" }, { quoted: m });
    }

    let move = m.args.slice(1).join(" ");
    if (!/^[a-h][1-8] [a-h][1-8]$/.test(move)) {
        return conn.sendMessage(m.from, { text: "❌ Format salah! Gunakan format: *e2 e4*" }, { quoted: m });
    }

    let [from, to] = move.split(" ");
    let result = game.game.move(from, to);

    if (!result.success) {
        return conn.sendMessage(m.from, { text: `❌ ${result.error}` }, { quoted: m });
    }

    let whiteView = game.game.renderBoardFor(game.white);
    let blackView = game.game.renderBoardFor(game.black);

    let messageWhite = `♟️ *Catur WhatsApp*\n\n` +
        `👤 *Putih:* @${game.white.split('@')[0]}\n` +
        `⚫ *Hitam:* @${game.black.split('@')[0]}\n\n` +
        whiteView + `\n\n` +
        `👤 *Giliran:* @${game.game.turn === "w" ? game.white.split('@')[0] : game.black.split('@')[0]}\n`;

    let messageBlack = `♟️ *Catur WhatsApp*\n\n` +
        `👤 *Putih:* @${game.white.split('@')[0]}\n` +
        `⚫ *Hitam:* @${game.black.split('@')[0]}\n\n` +
        blackView + `\n\n` +
        `👤 *Giliran:* @${game.game.turn === "w" ? game.white.split('@')[0] : game.black.split('@')[0]}\n`;

    conn.sendMessage(game.white, { text: messageWhite, mentions: [game.white, game.black] }, { quoted: m });
    conn.sendMessage(game.black, { text: messageBlack, mentions: [game.white, game.black] }, { quoted: m });

    if (game.game.isCheckmate()) {
        let winner = game.game.turn === "w" ? game.black : game.white;
        let loser = game.game.turn === "w" ? game.white : game.black;

        conn.sendMessage(winner, { text: `🏆 *Selamat!* Kamu menang dengan skakmat!` }, { quoted: m });
        conn.sendMessage(loser, { text: `😞 *Kamu kalah!* Lawanmu melakukan skakmat!` }, { quoted: m });

        delete games[game.id];
    }
}