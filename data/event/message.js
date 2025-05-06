import chalk from 'chalk';
import moment from 'moment';
import readline from 'readline';
import wrapAnsi from 'wrap-ansi';

const maxWidth = process.stdout.columns - 10 || 50;

const tampilkanPesan = (isiPesan) => {
    const wrappedText = wrapAnsi(isiPesan, maxWidth, { hard: true });
    const lines = wrappedText.split('\n');
    const maxLength = Math.max(...lines.map((line) => line.length));
    const garis = '─'.repeat(maxLength + 4);

    console.log(chalk.gray(`┌${garis}┐`));
    lines.forEach((line) => {
        console.log(chalk.gray(`│ `) + chalk.cyan(line.padEnd(maxLength, ' ')) + chalk.gray(` │`));
    });
    console.log(chalk.gray(`└${garis}┘\n`));
};

export async function messagesSystem(conn, store, m) {
    const timestamp = moment().format('HH:mm:ss');
    const pengirim = m?.sender || 'Unknown';
    const nomor = pengirim.split('@')[0] || 'Unknown';

    const isiPesan = (m?.text || m?.body || '...')
        .normalize('NFKC')
        .replace(/[\u{FFFD}\u{200B}]/gu, '')
        .replace(/[^ -~]+/g, '');

    const tipePengirim = pengirim.endsWith('@g.us') ? chalk.blueBright('📢 [GROUP]') :
                         pengirim.endsWith('@s.whatsapp.net') ? chalk.greenBright('💬 [USER]') :
                         pengirim.endsWith('status@broadcast') ? chalk.yellowBright('📢 [STATUS]') :
                         chalk.redBright('❓ [UNKNOWN]');

    readline.cursorTo(process.stdout, 0);
    readline.clearLine(process.stdout, 0);

    console.log(chalk.gray('──────────────────────────────────────────────────'));
    console.log(chalk.gray(`[ ${timestamp} ]`) + ` ${tipePengirim} ` + chalk.magentaBright(nomor));
    console.log(chalk.gray('──────────────────────────────────────────────────\n'));

    tampilkanPesan(isiPesan);
}