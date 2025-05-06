/*
 * Created by Matzz
 * Database Handler with Energy System
 */

import fs from 'fs';
import path from 'path';
import config from '../config.js';

class Database {
  constructor(filePath = './database/database.json') {
    this.filePath = path.resolve(filePath);
    this.defaultData = this.getDefaultData();
    this.data = {};
    this.options = {};

    this.ensureDatabase();
    this.load();
  }

  /*
   * Default data structure
   */
  getDefaultData() {
    return {
      users: [],
      groups: [],
      settings: {
        greeting: '',
        status: 'activated',
      },
      store: {
        produk: {},
        order: [],
        testi: [],
        chat: {},
        rekber: {},
        transaksi: [],
      },
      message: [],
    };
  }

  /*
   * Create database if not exists
   */
  ensureDatabase() {
    if (!fs.existsSync(this.filePath)) {
      console.log(`[Database] File not found, creating new database at ${this.filePath}`);
      this.saveData(this.defaultData);
    }
  }

  /*
   * Load database
   */
  load() {
    try {
      const rawData = fs.readFileSync(this.filePath);
      this.data = JSON.parse(rawData);
    } catch (error) {
      console.error('[Database] Error loading database, restoring default.', error);
      this.data = this.getDefaultData();
      this.saveData(this.data);
    }

    this.options = {
      user: {
        add: this.addUser.bind(this),
        get: this.getUser.bind(this),
        update: this.updateUser.bind(this),
        energy: {
          decrease: this.decreaseEnergy.bind(this),
          restore: this.restoreEnergy.bind(this),
        }
      },
      group: {
        add: this.addGroup.bind(this),
        get: this.getGroup.bind(this),
        update: this.updateGroup.bind(this),
      },
    };
  }

  /*
   * Save database
   */
  save() {
    try {
      const backupPath = this.filePath.replace(/\.json$/, `-backup-${Date.now()}.json`);
      if (fs.existsSync(this.filePath)) {
        fs.copyFileSync(this.filePath, backupPath);
      }
      this.saveData(this.data);
    } catch (error) {
      console.error('[Database] Error saving database:', error);
    }
  }

  /*
   * Write JSON data
   */
  saveData(data) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  /*
   * User Section
   */
  addUser(userId) {
    if (!this.getUser(userId)) {
      this.data.users.push({
        userId,
        name: '',
        warnings: 0,
        messages: 0,
        premium: false,
        energy: config.energySystem ? config.maxEnergy : undefined, // add energy if enabled
        transaksi: [],
        order: {},
      });
      this.save();
    }
  }

  getUser(userId) {
    return this.data.users.find(u => u.userId === userId);
  }

  updateUser(userId, newData) {
    const user = this.getUser(userId);
    if (user) {
      Object.assign(user, newData, { updatedAt: new Date().toISOString() });
      this.save();
    }
  }

  /*
   * Energy System
   */
  decreaseEnergy(userId, amount = config.energyDrainRate) {
    if (!config.energySystem) return;

    const user = this.getUser(userId);
    if (user && typeof user.energy === 'number') {
      user.energy -= amount;
      if (user.energy < 0) user.energy = 0;
      this.save();
    }
  }

  restoreEnergy(userId) {
    if (!config.energySystem) return;

    const user = this.getUser(userId);
    if (user) {
      user.energy = config.maxEnergy;
      this.save();
    }
  }

  /*
   * Group Section
   */
  addGroup(groupId) {
    if (!this.getGroup(groupId)) {
      this.data.groups.push({
        groupId,
        welcome: false,
        promote: false,
        demote: false,
        mute: false,
        antilink: false,
        antigambar: false,
        antibokep: false,
        antikatakasar: false,
      });
      this.save();
    }
  }

  getGroup(groupId) {
    return this.data.groups.find(g => g.groupId === groupId);
  }

  updateGroup(groupId, newData) {
    const group = this.getGroup(groupId);
    if (group) {
      Object.assign(group, newData, { updatedAt: new Date().toISOString() });
      this.save();
    }
  }
}

/*
 * Export instance
 */
const db = new Database();
export default db;