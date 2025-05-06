/*
 * Created by Matzz
 * WhatsApp Bot Professional Version
 * Powered by @fizzxydev/baileys-pro
 */

import pkg from '@fizzxydev/baileys-pro';
const { makeWASocket, DisconnectReason, useMultiFileAuthState, makeInMemoryStore, makeCacheableSignalKeyStore } = pkg;
import pino from 'pino';
import ora from 'ora';
import { exec } from 'child_process';
import readline from 'readline';
import Serialize from './data/serialize.js';
import { messagesSystem } from './data/event/message.js';
import { Matzz } from './case.js';
import config from './config.js';
import Sockets from './data/sockets.js';
import db from './data/database.js';
import { cmd } from './data/handler.js';
import func from './data/function.js';

/*
 * Helper untuk prompt input terminal
 */
const question = (query) => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
};

const logger = pino({ level: "silent" }).child({ level: "silent" })

/*
 * Bot WhatsApp utama dengan konsep Class
 */
class Bot {
  constructor() {
    this.store = makeInMemoryStore({ logger: pino({ level: 'silent' }) });
    this.spinner = ora({ text: '[SYSTEM] Inisialisasi bot...', spinner: 'dots' });
    this.conn = null;
    this.state = null;
    this.saveCreds = null;
  }

  /*
   * Setup autentikasi Multi-Device
   */
  async setupAuth() {
    const auth = await useMultiFileAuthState('session');
    this.state = auth.state;
    this.saveCreds = auth.saveCreds;
  }

  /*
   * Membuka koneksi ke WhatsApp
   */
  async connect() {
    this.conn = makeWASocket({
      auth: {
        creds: this.state.creds,
        keys: makeCacheableSignalKeyStore(this.state.keys, pino({ level: 'silent' })),
      },
      getMessage: async (key) => {
        if (this.store) {
          const msg = await this.store.loadMessage(key.remoteJid, key.id);
          return msg?.message || 'Hi bro';
        }
        return pkg.proto.Message.fromObject({});
      },
      generateHighQualityLinkPreview: true,
      version: [2, 3000, 1019430034],
      browser: ['Safari', 'MacOS', '16.4.0'],
      syncFullHistory: true,
      retryRequestDelayMs: 10,
      transactionOpts: {
        maxCommitRetries: 10,
        delayBetweenTriesMs: 10,
      },
      maxMsgRetryCount: 15,
      appStateMacVerification: {
        patch: true,
        snapshot: true,
      },
      logger
    });

    this.store.bind(this.conn.ev);
    Sockets(this.conn);

    this.handleEvents();
  }

  /*
   * Menangani semua event penting
   */
  handleEvents() {
    this.conn.ev.on('connection.update', (update) => this.onConnectionUpdate(update));
    this.conn.ev.on('creds.update', this.saveCreds);
    this.conn.ev.on('messages.upsert', (chatUpdate) => this.onMessage(chatUpdate));
  }

  /*
   * Event: update status koneksi
   */
  async onConnectionUpdate(update) {
    const { connection, lastDisconnect } = update;

    switch (connection) {
      case 'connecting':
        this.spinner.text = '[INFO] Menghubungkan ke WhatsApp...';
        break;

      case 'open':
        this.spinner.succeed('[SUCCESS] Bot online dan siap digunakan.');
        break;

      case 'close':
        this.spinner.fail('[ERROR] Koneksi terputus.');
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        if (shouldReconnect) {
          console.log('[SYSTEM] Mencoba menghubungkan ulang...');
          setTimeout(() => this.start(), 5000);
        } else {
          console.log('[SYSTEM] Sesi habis, menghapus sesi dan keluar.');
          exec('rm -rf session');
          process.exit(0);
        }
        break;

      default:
        break;
    }
  }

  /*
   * Event: pesan baru masuk
   */
  async onMessage(chatUpdate) {
    try {
      const msg = chatUpdate?.messages?.[0];
      if (!msg) return;

      const m = new Serialize(msg, this.conn);
      if (!m) return;

      if (m.from?.endsWith('@g.us')) {
        db.options?.group?.add(m.from);
      } else if (m.sender?.endsWith('@s.whatsapp.net')) {
        db.options?.user?.add(m.sender);
      }

      await messagesSystem(this.conn, this.store, m);
      await cmd.handle(m, this.conn, db, func, config);
      await Matzz(this.conn, m, chatUpdate, this.store, config, db);

    } catch (error) {
      // Lewatkan error minor
    }
  }

  /*
   * Memulai keseluruhan bot
   */
  async start() {
    try {
      console.clear();
      this.spinner.start();

      await cmd.SetDefFolder('./command');
      await cmd.load();

      await this.setupAuth();
      await this.connect();

      if (!this.conn.authState.creds.registered) {
        this.spinner.stop();
        const phoneNumber = await question('[SYSTEM] Masukkan nomor HP: +\n');
        try {
          const code = await this.conn.requestPairingCode(phoneNumber);
          console.log(`[SYSTEM] Masukkan kode ini di WhatsApp: ${code}`);
        } catch (error) {
          console.error('[ERROR] Gagal membuat kode pairing:', error.message);
        }
      }
    } catch (error) {
      this.spinner.fail('[ERROR] Startup gagal.');
      console.error(error);
    }
  }
}

/*
 * Menangani error global secara aman
 */
process.on('uncaughtException', (error) => {
  if (error.message?.includes('Connection Closed') || error.message?.includes('Timed out')) return;
  console.error('[UNCAUGHT EXCEPTION]', error);
});

process.on('unhandledRejection', (reason) => {
  if (reason?.message?.includes('Connection Closed') || reason?.message?.includes('Timed out')) return;
  console.error('[UNHANDLED REJECTION]', reason);
});

/*
 * Inisialisasi dan jalankan Bot
 */
const bot = new Bot();
bot.start();