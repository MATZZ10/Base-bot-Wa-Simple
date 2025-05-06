export default class Chess {
    constructor() {
        this.board = [
            ["♜", "♞", "♝", "♛", "♚", "♝", "♞", "♜"],
            ["♟", "♟", "♟", "♟", "♟", "♟", "♟", "♟"],
            [" ", " ", " ", " ", " ", " ", " ", " "],
            [" ", " ", " ", " ", " ", " ", " ", " "],
            [" ", " ", " ", " ", " ", " ", " ", " "],
            [" ", " ", " ", " ", " ", " ", " ", " "],
            ["♙", "♙", "♙", "♙", "♙", "♙", "♙", "♙"],
            ["♖", "♘", "♗", "♕", "♔", "♗", "♘", "♖"]
        ];
        this.turn = "w";
    }

    renderBoardFor(player) {
    let isBlack = player === this.black;
    let boardView = isBlack ? [...this.board].reverse().map(row => [...row].reverse()) : this.board;

    let boardString = isBlack ? "  h g f e d c b a\n" : "  a b c d e f g h\n";
    boardView.forEach((row, i) => {
        boardString += `${isBlack ? i + 1 : 8 - i} ${row.join(" ")} ${isBlack ? i + 1 : 8 - i}\n`;
    });
    boardString += isBlack ? "  h g f e d c b a\n" : "  a b c d e f g h\n";

    return "```" + boardString + "```";
}

    move(from, to) {
        let [fx, fy] = [from.charCodeAt(0) - 97, 8 - parseInt(from[1])];
        let [tx, ty] = [to.charCodeAt(0) - 97, 8 - parseInt(to[1])];

        if (this.board[fy][fx] === " " || this.board[fy][fx] === undefined) {
            return { success: false, error: "Tidak ada bidak di posisi itu!" };
        }

        this.board[ty][tx] = this.board[fy][fx];
        this.board[fy][fx] = " ";
        this.turn = this.turn === "w" ? "b" : "w";

        return { success: true };
    }
    
    findKing(turn) {
        let kingSymbol = turn === "w" ? "♔" : "♚";
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                if (this.board[y][x] === kingSymbol) return [x, y];
            }
        }
        return null;
    }

    isUnderAttack(x, y, attackerTurn) {
        let enemyPieces = attackerTurn === "w" 
            ? ["♜", "♞", "♝", "♛", "♟"] 
            : ["♖", "♘", "♗", "♕", "♙"];

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (enemyPieces.includes(this.board[row][col])) {
                    if (this.canMovePiece(col, row, x, y, attackerTurn)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    canMovePiece(fx, fy, tx, ty, turn) {
        let piece = this.board[fy][fx];
        if (piece === "♜" || piece === "♖") return fx === tx || fy === ty;
        if (piece === "♝" || piece === "♗") return Math.abs(fx - tx) === Math.abs(fy - ty);
        if (piece === "♛" || piece === "♕") return fx === tx || fy === ty || Math.abs(fx - tx) === Math.abs(fy - ty);
        if (piece === "♞" || piece === "♘") return Math.abs(fx - tx) === 2 && Math.abs(fy - ty) === 1 || Math.abs(fx - tx) === 1 && Math.abs(fy - ty) === 2;
        if (piece === "♟" || piece === "♙") return fy + (turn === "w" ? -1 : 1) === ty && fx === tx;
        if (piece === "♚" || piece === "♔") return Math.abs(fx - tx) <= 1 && Math.abs(fy - ty) <= 1;
        return false;
    }

    isCheckmate() {
        let kingPos = this.findKing(this.turn);
        if (!kingPos) return false;

        let [kx, ky] = kingPos;
        if (!this.isUnderAttack(kx, ky, this.turn === "w" ? "b" : "w")) return false;

        let moves = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],         [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];

        for (let [dx, dy] of moves) {
            let nx = kx + dx, ny = ky + dy;
            if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
                if (!this.isUnderAttack(nx, ny, this.turn === "w" ? "b" : "w")) {
                    return false;
                }
            }
        }

        return true;
    }
}