import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import chokidar from 'chokidar';

class Handler {
  constructor() {
    if (!Handler.instance) {
      this.commands = {};
      this.callables = [];
      this.plugins = {};
      this.allowedFolder = '';
      this.watcher = null;
      Handler.instance = this;
    }
    return Handler.instance;
  }

  async SetDefFolder(folder) {
    const resolvedPath = path.resolve(folder);
    if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
      this.allowedFolder = resolvedPath;
      await this.loadPlugins();
      this.startWatcher();
    } else {
      throw new Error(`[Handler] Folder "${folder}" tidak ditemukan.`);
    }
  }

  async loadPlugins() {
    try {
      const packageJsonPath = path.resolve('package.json');
      if (!fs.existsSync(packageJsonPath)) return;

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const dependencies = Object.keys(packageJson.dependencies || {});
      this.plugins = {};

      for (const dep of dependencies) {
        try {
          this.plugins[dep] = await import(dep);
        } catch (err) {}
      }
    } catch (err) {}
  }

  async add(feature) {
  if (!feature || typeof feature !== 'object') {
    throw new Error('[Handler] Fitur harus berupa objek.');
  }

  const { name, type, usage = 'Tidak ada usage', run, call, plugins = [], filePath = null, energy = true } = feature;

  if (!run && !call) {
    throw new Error(`[Handler] Fitur "${name || 'Unnamed'}" harus memiliki setidaknya fungsi run atau call.`);
  }

  for (const pluginName of plugins) {
    if (!this.plugins[pluginName]) {
      console.warn(`[Handler] Plugin "${pluginName}" tidak ditemukan dalam package.json.`);
    }
  }

  if (run) {
    if (!name || !type) {
      throw new Error('[Handler] Command harus memiliki name dan type.');
    }

    if (Array.isArray(name)) {
      name.forEach(commandName => {
        this.commands[commandName] = { name: commandName, type, usage, run, filePath, energy };
      });
    } else {
      this.commands[name] = { name, type, usage, run, filePath, energy };
    }
  }

  if (call) {
    this.callables.push(call);
  }

  return this;
}

  async load(folder = this.allowedFolder) {
    if (!folder) throw new Error("[Handler] Folder belum ditentukan. Gunakan SetDefFolder() terlebih dahulu.");

    const resolvedPath = path.resolve(folder);
    if (!fs.existsSync(resolvedPath)) {
        console.warn(`[Handler] Folder "${folder}" tidak ditemukan.`);
        return;
    }

    const loadFilesRecursively = async (dir) => {
        const files = fs.readdirSync(dir);

        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                await loadFilesRecursively(fullPath);
            } else if (file.endsWith('.js') || file.endsWith('.cjs')) {
                try {
                    await import(`file://${fullPath}?update=${Date.now()}`);
                } catch (error) {
                    console.error(`[Handler] Gagal memuat file: ${fullPath}`, error);
                }
            }
        }
    };

    await loadFilesRecursively(resolvedPath);
  }

async handle(m, conn, db, func, config) {
  if (m.isCmd) {
    const commandName = m.command;
    const user = db.getUser(m.sender);

    if (config.energySystem && user && user.energy <= 0) {
      await conn.sendMessage(m.chat, { text: '❌ Energi kamu habis! Tunggu recharge.' }, { quoted: m });
      return;
    }

    if (this.commands[commandName]) {
      const cmd = this.commands[commandName];
      try {
        let commandPromise = cmd.run({ m, conn, db, func, config });

        if (config.energySystem && user && cmd.energy !== false) {
          await animateEnergyReduction(conn, m.chat, m, user, config.energyDrainRate, db);
        }

        await commandPromise;
      } catch (err) {
        console.error(`[Handler] Error pada command ${commandName}:`, err);
      }
    }
  }

  for (const call of this.callables) {
    try {
      await call({ m, conn, db, func, config });
    } catch (err) {
      console.error(`[Handler] Error pada callable:`, err);
    }
  }
}

  extractCaseCommands(caseFilePath) {
    if (!fs.existsSync(caseFilePath)) return [];
    const caseFileContent = fs.readFileSync(caseFilePath, 'utf-8');
    const caseRegex = /case\s+['"](.*?)['"]\s*:/g;
    const commands = [];
    let match;

    while ((match = caseRegex.exec(caseFileContent)) !== null) {
      commands.push(match[1]);
    }

    return commands;
  }

  MenuCollection() {
    const categorizedCommands = {};
    const displayedNames = new Set();

    Object.values(this.commands).forEach(command => {
        if (!command.type || !command.name || !command.usage) {
            console.warn(`Perintah "${command.name || 'Unknown'}" tidak lengkap.`);
            return;
        }

        if (!categorizedCommands[command.type]) {
            categorizedCommands[command.type] = [];
        }

        const displayName = Array.isArray(command.name) ? command.name[0] : command.name;

        if (!displayedNames.has(displayName)) {
            displayedNames.add(displayName);
            categorizedCommands[command.type].push(displayName);
        }
    });

    const caseCommands = this.extractCaseCommands(path.resolve('case.js'));
    if (caseCommands.length > 0) {
        categorizedCommands['CASE'] = [...new Set(caseCommands)];
    }

    let menu = '';

    Object.keys(categorizedCommands).forEach(category => {
        if (categorizedCommands[category].length === 0) return;
        
        menu += '─────────────────\n';
        menu += `📂 *${category.toUpperCase()}*:\n`;
        categorizedCommands[category].forEach(cmd => {
            menu += `  ➤  ${cmd}\n`;
        });
        menu += '─────────────────\n\n';
    });

    if (Object.keys(categorizedCommands).length === 0) {
        menu += "🚫 *Tidak ada perintah yang tersedia.*\n";
    }

    return menu;
  }

  startWatcher() {
    if (this.watcher) this.watcher.close();

    this.watcher = chokidar.watch(this.allowedFolder, { ignored: /(^|[\/\\])\../, persistent: true });

    this.watcher.on('change', async (filePath) => {
      if (filePath.endsWith('.js') || filePath.endsWith('.cjs')) {
        try {
          const resolvedPath = path.resolve(filePath);
          const modulePath = pathToFileURL(resolvedPath).href + `?update=${Date.now()}`;
          
          console.log(`[Handler] 🔄 File berubah: ${filePath}. Memuat ulang...`);
          
          Object.keys(this.commands).forEach(cmd => {
            if (this.commands[cmd].filePath === resolvedPath) {
              delete this.commands[cmd];
            }
          });

          const newModule = await import(modulePath);

          if (newModule.default || newModule) {
            await this.add(newModule.default || newModule);
          }
        } catch (error) {}
      }
    });
  }
}

export async function formatNumber(num) {
  return num.toLocaleString('id-ID');
}

export async function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

async function animateEnergyReduction(conn, jid, m, user, drainRate, db) {
  let currentEnergy = user.energy || 100;
  let targetEnergy = Math.max(0, currentEnergy - drainRate);
  let message = await conn.sendMessage(jid, { text: `⚡ Energi: ${currentEnergy}%` }, { quoted: m });

  for (let i = currentEnergy; i >= targetEnergy; i--) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    await conn.sendMessage(jid, {
      text: `⚡ Energi: ${i}%`,
      edit: {
        remoteJid: jid,
        id: message.key.id,
        fromMe: true
      }
    });
  }

  db.updateUser(m.sender, { energy: targetEnergy });
}

export const cmd = new Handler();
