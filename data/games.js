import TicTacToe from './tictactoe.js';

const games = {};

export async function startTicTacToe(m, conn, text) {
    if (Object.values(games).some(room => 
        room.id.startsWith('tictactoe') && 
        [room.game.playerX, room.game.playerO].includes(m.sender) &&
        room.state === 'PLAYING'
    )) {
        return conn.sendMessage(m.chat, { text: "Kamu sedang bermain Tic Tac Toe! Selesaikan dulu game sebelumnya." }, { quoted: m });
    }

    let room = Object.values(games).find(room => room.state === 'WAITING' && (text ? room.name === text : true));
    if (room) {
        room.o = m.chat;
        room.game.playerO = m.sender;
        room.state = 'PLAYING';

        let board = renderBoard(room.game);
        let msg = await conn.sendMessage(m.chat, { text: board, mentions: [room.game.currentTurn] }, { quoted: m });
        
        room.lastBoardKey = msg.key.id;
    } else {
        room = {
            id: 'tictactoe-' + (+new Date()),
            x: m.chat,
            o: '',
            game: new TicTacToe(m.sender, 'o'),
            state: 'WAITING',
            lastBoardKey: null,
        };
        if (text) room.name = text;
        conn.sendMessage(m.chat, { text: "Menunggu lawan... Ketik perintah yang sama untuk bergabung!" }, { quoted: m });
        games[room.id] = room;
    }
}

export async function processTicTacToe(m, conn) {
    let room = Object.values(games).find(room => room.id.startsWith('tictactoe') && 
        [room.game.playerX, room.game.playerO].includes(m.sender) && room.state === 'PLAYING');
    
    if (!room) return;

    let quotedId = m.quoted ? m.quoted.id : null;
    let isReplyToBoard = quotedId && quotedId === room.lastBoardKey;
    let isValidMove = /^[1-9]$/.test(m.text);

    if (!isReplyToBoard || !isValidMove) return;

    let pos = parseInt(m.text) - 1;
    let ok = room.game.turn(m.sender === room.game.playerO, pos);
    
    if (ok < 0) {
        return conn.sendMessage(m.chat, { 
            text: {
                '-3': 'Permainan sudah selesai.',
                '-2': 'Giliran bukan milikmu!',
                '-1': 'Posisi tidak valid!',
                0: 'Posisi sudah diisi!',
            }[ok]
        }, { quoted: m });
    }

    let isWin = m.sender === room.game.winner;
    let isTie = room.game.board === 511;

    let board = renderBoard(room.game);
    let msg = await conn.sendMessage(m.chat, { 
        text: isWin ? `@${m.sender.split('@')[0]} Menang! 🎉\n\n${board}` : 
              isTie ? `Permainan Seri!\n\n${board}` : 
              `Giliran @${room.game.currentTurn.split('@')[0]}\n\n${board}`, 
        mentions: [room.game.playerX, room.game.playerO] 
    });

    room.lastBoardKey = msg.key.id;

    if (isWin || isTie) delete games[room.id];
}

export async function surrenderTicTacToe(m, conn) {
    let room = Object.values(games).find(room => room.id.startsWith('tictactoe') && 
        [room.game.playerX, room.game.playerO].includes(m.sender) && room.state === 'PLAYING');

    if (!room) return;

    let winner = m.sender === room.game.playerX ? room.game.playerO : room.game.playerX;
    let board = renderBoard(room.game);

    await conn.sendMessage(m.chat, { 
        text: `@${m.sender.split('@')[0]} menyerah! @${winner.split('@')[0]} menang! 🎉\n\n${board}`,
        mentions: [room.game.playerX, room.game.playerO]
    });

    delete games[room.id];
}

function renderBoard(game) {
    return game.render().map(v => ({
        X: '❌', O: '⭕', 1: '1️⃣', 2: '2️⃣', 3: '3️⃣', 
        4: '4️⃣', 5: '5️⃣', 6: '6️⃣', 7: '7️⃣', 8: '8️⃣', 9: '9️⃣'
    }[v])).reduce((a, c, i) => a + (i % 3 === 2 ? `${c}\n` : c), '') + '\n';
}