// SQLite Database wrapper for HyVornBot
// Created by ImVylo

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import logger from './Logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '../../data');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

class DatabaseManager {
  constructor() {
    this.db = null;
    this.log = logger.child('Database');
  }

  /**
   * Initialize the database connection
   */
  init() {
    const dbPath = path.join(dataDir, 'bot.db');
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.log.success('Connected to SQLite database');
    this.createTables();
    return this;
  }

  /**
   * Create all necessary tables
   */
  createTables() {
    // Guild settings
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS guilds (
        guild_id TEXT PRIMARY KEY,
        prefix TEXT DEFAULT '!',
        settings TEXT DEFAULT '{}'
      )
    `);

    // User data (per-guild)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        user_id TEXT,
        guild_id TEXT,
        xp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 0,
        balance INTEGER DEFAULT 0,
        bank INTEGER DEFAULT 0,
        daily_claimed TEXT,
        work_claimed TEXT,
        warnings TEXT DEFAULT '[]',
        PRIMARY KEY (user_id, guild_id)
      )
    `);

    // Tickets
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT,
        channel_id TEXT,
        user_id TEXT,
        category TEXT,
        status TEXT DEFAULT 'open',
        claimed_by TEXT,
        created_at TEXT,
        closed_at TEXT,
        transcript TEXT
      )
    `);

    // Mod logs
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS modlogs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT,
        user_id TEXT,
        moderator_id TEXT,
        action TEXT,
        reason TEXT,
        duration TEXT,
        created_at TEXT
      )
    `);

    // Giveaways
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS giveaways (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT,
        channel_id TEXT,
        message_id TEXT,
        prize TEXT,
        winners INTEGER,
        ends_at TEXT,
        ended INTEGER DEFAULT 0,
        host_id TEXT,
        requirements TEXT
      )
    `);

    // Reaction roles
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS reaction_roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT,
        message_id TEXT,
        emoji TEXT,
        role_id TEXT,
        UNIQUE(message_id, emoji)
      )
    `);

    // Game servers
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS game_servers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT,
        name TEXT,
        type TEXT,
        ip TEXT,
        port INTEGER,
        status_channel TEXT,
        status_message TEXT,
        voice_channel TEXT,
        rcon_password TEXT
      )
    `);

    // Add voice_channel column if it doesn't exist (migration)
    try {
      this.db.exec(`ALTER TABLE game_servers ADD COLUMN voice_channel TEXT`);
    } catch (e) {
      // Column already exists
    }

    // Tags
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tags (
        name TEXT,
        guild_id TEXT,
        content TEXT,
        author_id TEXT,
        uses INTEGER DEFAULT 0,
        PRIMARY KEY (name, guild_id)
      )
    `);

    // Reminders
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        channel_id TEXT,
        guild_id TEXT,
        message TEXT,
        remind_at TEXT
      )
    `);

    // Temp bans/mutes
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS temp_punishments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT,
        user_id TEXT,
        type TEXT,
        expires_at TEXT,
        role_ids TEXT
      )
    `);

    // Level roles
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS level_roles (
        guild_id TEXT,
        level INTEGER,
        role_id TEXT,
        PRIMARY KEY (guild_id, level)
      )
    `);

    // Shop items
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS shop_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT,
        name TEXT,
        description TEXT,
        price INTEGER,
        type TEXT,
        value TEXT,
        stock INTEGER DEFAULT -1
      )
    `);

    // User inventory
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS inventory (
        user_id TEXT,
        guild_id TEXT,
        item_id INTEGER,
        quantity INTEGER DEFAULT 1,
        PRIMARY KEY (user_id, guild_id, item_id)
      )
    `);

    // Suggestions
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS suggestions (
        id TEXT PRIMARY KEY,
        guild_id TEXT,
        channel_id TEXT,
        message_id TEXT,
        user_id TEXT,
        content TEXT,
        anonymous INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending',
        upvotes INTEGER DEFAULT 0,
        downvotes INTEGER DEFAULT 0,
        reviewed_by TEXT,
        created_at TEXT
      )
    `);

    // Suggestion votes
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS suggestion_votes (
        suggestion_id TEXT,
        user_id TEXT,
        vote INTEGER,
        PRIMARY KEY (suggestion_id, user_id)
      )
    `);

    // Staff applications
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS applications (
        id TEXT PRIMARY KEY,
        guild_id TEXT,
        channel_id TEXT,
        message_id TEXT,
        user_id TEXT,
        position TEXT,
        responses TEXT,
        status TEXT DEFAULT 'pending',
        reviewed_by TEXT,
        review_notes TEXT,
        created_at TEXT,
        reviewed_at TEXT
      )
    `);

    this.log.info('Database tables initialized');
  }

  // ==================== Guild Methods ====================

  /**
   * Get guild settings
   */
  getGuild(guildId) {
    const stmt = this.db.prepare('SELECT * FROM guilds WHERE guild_id = ?');
    let guild = stmt.get(guildId);

    if (!guild) {
      this.db.prepare('INSERT INTO guilds (guild_id) VALUES (?)').run(guildId);
      guild = stmt.get(guildId);
    }

    guild.settings = JSON.parse(guild.settings || '{}');
    return guild;
  }

  /**
   * Update guild settings
   */
  updateGuild(guildId, data) {
    const guild = this.getGuild(guildId);
    const settings = { ...guild.settings, ...data.settings };

    this.db.prepare(`
      UPDATE guilds SET prefix = ?, settings = ? WHERE guild_id = ?
    `).run(data.prefix || guild.prefix, JSON.stringify(settings), guildId);
  }

  /**
   * Get guild prefix
   */
  getPrefix(guildId) {
    const guild = this.getGuild(guildId);
    return guild.prefix;
  }

  /**
   * Set guild prefix
   */
  setPrefix(guildId, prefix) {
    this.getGuild(guildId); // Ensure guild exists
    this.db.prepare('UPDATE guilds SET prefix = ? WHERE guild_id = ?').run(prefix, guildId);
  }

  /**
   * Get a specific setting
   */
  getSetting(guildId, key) {
    const guild = this.getGuild(guildId);
    return guild.settings[key];
  }

  /**
   * Set a specific setting
   */
  setSetting(guildId, key, value) {
    const guild = this.getGuild(guildId);
    guild.settings[key] = value;
    this.db.prepare('UPDATE guilds SET settings = ? WHERE guild_id = ?')
      .run(JSON.stringify(guild.settings), guildId);
  }

  // ==================== User Methods ====================

  /**
   * Get user data
   */
  getUser(userId, guildId) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE user_id = ? AND guild_id = ?');
    let user = stmt.get(userId, guildId);

    if (!user) {
      this.db.prepare(`
        INSERT INTO users (user_id, guild_id) VALUES (?, ?)
      `).run(userId, guildId);
      user = stmt.get(userId, guildId);
    }

    user.warnings = JSON.parse(user.warnings || '[]');
    return user;
  }

  /**
   * Update user data
   */
  updateUser(userId, guildId, data) {
    this.getUser(userId, guildId); // Ensure user exists

    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      if (key === 'warnings') {
        fields.push(`${key} = ?`);
        values.push(JSON.stringify(value));
      } else {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    values.push(userId, guildId);

    this.db.prepare(`
      UPDATE users SET ${fields.join(', ')} WHERE user_id = ? AND guild_id = ?
    `).run(...values);
  }

  // ==================== XP/Leveling Methods ====================

  /**
   * Add XP to user
   */
  addXP(userId, guildId, amount) {
    const user = this.getUser(userId, guildId);
    const newXP = user.xp + amount;
    this.updateUser(userId, guildId, { xp: newXP });
    return newXP;
  }

  /**
   * Set user XP
   */
  setXP(userId, guildId, amount) {
    this.getUser(userId, guildId);
    this.updateUser(userId, guildId, { xp: Math.max(0, amount) });
  }

  /**
   * Set user level
   */
  setLevel(userId, guildId, level) {
    this.getUser(userId, guildId);
    this.updateUser(userId, guildId, { level: Math.max(0, level) });
  }

  /**
   * Get leaderboard
   */
  getLeaderboard(guildId, limit = 10) {
    return this.db.prepare(`
      SELECT * FROM users WHERE guild_id = ? ORDER BY xp DESC LIMIT ?
    `).all(guildId, limit);
  }

  // ==================== Economy Methods ====================

  /**
   * Get user balance
   */
  getBalance(userId, guildId) {
    const user = this.getUser(userId, guildId);
    return { balance: user.balance, bank: user.bank };
  }

  /**
   * Add balance
   */
  addBalance(userId, guildId, amount) {
    const user = this.getUser(userId, guildId);
    this.updateUser(userId, guildId, { balance: user.balance + amount });
    return user.balance + amount;
  }

  /**
   * Remove balance
   */
  removeBalance(userId, guildId, amount) {
    const user = this.getUser(userId, guildId);
    const newBalance = Math.max(0, user.balance - amount);
    this.updateUser(userId, guildId, { balance: newBalance });
    return newBalance;
  }

  /**
   * Transfer to bank
   */
  deposit(userId, guildId, amount) {
    const user = this.getUser(userId, guildId);
    if (user.balance < amount) return false;

    this.updateUser(userId, guildId, {
      balance: user.balance - amount,
      bank: user.bank + amount
    });
    return true;
  }

  /**
   * Withdraw from bank
   */
  withdraw(userId, guildId, amount) {
    const user = this.getUser(userId, guildId);
    if (user.bank < amount) return false;

    this.updateUser(userId, guildId, {
      balance: user.balance + amount,
      bank: user.bank - amount
    });
    return true;
  }

  /**
   * Add to bank directly
   */
  addBank(userId, guildId, amount) {
    const user = this.getUser(userId, guildId);
    this.updateUser(userId, guildId, { bank: user.bank + amount });
    return user.bank + amount;
  }

  /**
   * Remove from bank directly
   */
  removeBank(userId, guildId, amount) {
    const user = this.getUser(userId, guildId);
    const newBank = Math.max(0, user.bank - amount);
    this.updateUser(userId, guildId, { bank: newBank });
    return newBank;
  }

  /**
   * Get economy leaderboard
   */
  getEconomyLeaderboard(guildId, limit = 10) {
    return this.db.prepare(`
      SELECT *, (balance + bank) as total FROM users
      WHERE guild_id = ? ORDER BY total DESC LIMIT ?
    `).all(guildId, limit);
  }

  // ==================== Warning Methods ====================

  /**
   * Add warning
   */
  addWarning(userId, guildId, moderatorId, reason) {
    const user = this.getUser(userId, guildId);
    const warning = {
      id: user.warnings.length + 1,
      moderator: moderatorId,
      reason: reason,
      date: new Date().toISOString()
    };
    user.warnings.push(warning);
    this.updateUser(userId, guildId, { warnings: user.warnings });
    return warning;
  }

  /**
   * Get warnings
   */
  getWarnings(userId, guildId) {
    const user = this.getUser(userId, guildId);
    return user.warnings;
  }

  /**
   * Clear warnings
   */
  clearWarnings(userId, guildId) {
    this.updateUser(userId, guildId, { warnings: [] });
  }

  /**
   * Remove specific warning
   */
  removeWarning(userId, guildId, warningId) {
    const user = this.getUser(userId, guildId);
    user.warnings = user.warnings.filter(w => w.id !== warningId);
    this.updateUser(userId, guildId, { warnings: user.warnings });
  }

  // ==================== Mod Log Methods ====================

  /**
   * Add mod log entry
   */
  addModLog(guildId, userId, moderatorId, action, reason, duration = null) {
    this.db.prepare(`
      INSERT INTO modlogs (guild_id, user_id, moderator_id, action, reason, duration, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(guildId, userId, moderatorId, action, reason, duration, new Date().toISOString());
  }

  /**
   * Get mod logs for user
   */
  getModLogs(guildId, userId = null, limit = 50) {
    if (userId) {
      return this.db.prepare(`
        SELECT * FROM modlogs WHERE guild_id = ? AND user_id = ?
        ORDER BY created_at DESC LIMIT ?
      `).all(guildId, userId, limit);
    }
    return this.db.prepare(`
      SELECT * FROM modlogs WHERE guild_id = ?
      ORDER BY created_at DESC LIMIT ?
    `).all(guildId, limit);
  }

  // ==================== Ticket Methods ====================

  /**
   * Create ticket
   */
  createTicket(guildId, channelId, userId, category) {
    const result = this.db.prepare(`
      INSERT INTO tickets (guild_id, channel_id, user_id, category, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(guildId, channelId, userId, category, new Date().toISOString());
    return result.lastInsertRowid;
  }

  /**
   * Get ticket by channel
   */
  getTicketByChannel(channelId) {
    return this.db.prepare('SELECT * FROM tickets WHERE channel_id = ?').get(channelId);
  }

  /**
   * Get user tickets
   */
  getUserTickets(guildId, userId) {
    return this.db.prepare(`
      SELECT * FROM tickets WHERE guild_id = ? AND user_id = ? AND status = 'open'
    `).all(guildId, userId);
  }

  /**
   * Close ticket
   */
  closeTicket(ticketId, transcript = null) {
    this.db.prepare(`
      UPDATE tickets SET status = 'closed', closed_at = ?, transcript = ?
      WHERE id = ?
    `).run(new Date().toISOString(), transcript, ticketId);
  }

  /**
   * Claim ticket
   */
  claimTicket(ticketId, moderatorId) {
    this.db.prepare(`
      UPDATE tickets SET claimed_by = ? WHERE id = ?
    `).run(moderatorId, ticketId);
  }

  // ==================== Giveaway Methods ====================

  /**
   * Create giveaway
   */
  createGiveaway(data) {
    const result = this.db.prepare(`
      INSERT INTO giveaways (guild_id, channel_id, message_id, prize, winners, ends_at, host_id, requirements)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.guildId, data.channelId, data.messageId,
      data.prize, data.winners, data.endsAt,
      data.hostId, JSON.stringify(data.requirements || {})
    );
    return result.lastInsertRowid;
  }

  /**
   * Get active giveaways
   */
  getActiveGiveaways() {
    return this.db.prepare(`
      SELECT * FROM giveaways WHERE ended = 0
    `).all();
  }

  /**
   * End giveaway
   */
  endGiveaway(giveawayId) {
    this.db.prepare('UPDATE giveaways SET ended = 1 WHERE id = ?').run(giveawayId);
  }

  /**
   * Get giveaway by message
   */
  getGiveawayByMessage(messageId) {
    return this.db.prepare('SELECT * FROM giveaways WHERE message_id = ?').get(messageId);
  }

  // ==================== Reaction Roles Methods ====================

  /**
   * Add reaction role
   */
  addReactionRole(guildId, messageId, emoji, roleId) {
    this.db.prepare(`
      INSERT OR REPLACE INTO reaction_roles (guild_id, message_id, emoji, role_id)
      VALUES (?, ?, ?, ?)
    `).run(guildId, messageId, emoji, roleId);
  }

  /**
   * Get reaction role
   */
  getReactionRole(messageId, emoji) {
    return this.db.prepare(`
      SELECT * FROM reaction_roles WHERE message_id = ? AND emoji = ?
    `).get(messageId, emoji);
  }

  /**
   * Get all reaction roles for message
   */
  getMessageReactionRoles(messageId) {
    return this.db.prepare(`
      SELECT * FROM reaction_roles WHERE message_id = ?
    `).all(messageId);
  }

  /**
   * Delete reaction role
   */
  deleteReactionRole(messageId, emoji) {
    this.db.prepare(`
      DELETE FROM reaction_roles WHERE message_id = ? AND emoji = ?
    `).run(messageId, emoji);
  }

  // ==================== Game Server Methods ====================

  /**
   * Add game server
   */
  addGameServer(data) {
    const result = this.db.prepare(`
      INSERT INTO game_servers (guild_id, name, type, ip, port, status_channel, voice_channel, rcon_password)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(data.guildId, data.name, data.type, data.ip, data.port, data.statusChannel, data.voiceChannel, data.rconPassword);
    return result.lastInsertRowid;
  }

  /**
   * Get guild game servers
   */
  getGameServers(guildId) {
    return this.db.prepare('SELECT * FROM game_servers WHERE guild_id = ?').all(guildId);
  }

  /**
   * Get all game servers (for status updates)
   */
  getAllGameServers() {
    return this.db.prepare('SELECT * FROM game_servers').all();
  }

  /**
   * Update game server status message
   */
  updateServerStatusMessage(serverId, messageId) {
    this.db.prepare('UPDATE game_servers SET status_message = ? WHERE id = ?').run(messageId, serverId);
  }

  /**
   * Update game server voice channel
   */
  updateServerVoiceChannel(serverId, channelId) {
    this.db.prepare('UPDATE game_servers SET voice_channel = ? WHERE id = ?').run(channelId, serverId);
  }

  /**
   * Get game server by ID
   */
  getGameServer(serverId) {
    return this.db.prepare('SELECT * FROM game_servers WHERE id = ?').get(serverId);
  }

  /**
   * Delete game server
   */
  deleteGameServer(serverId) {
    this.db.prepare('DELETE FROM game_servers WHERE id = ?').run(serverId);
  }

  // ==================== Tag Methods ====================

  /**
   * Create tag
   */
  createTag(guildId, name, content, authorId) {
    this.db.prepare(`
      INSERT INTO tags (name, guild_id, content, author_id) VALUES (?, ?, ?, ?)
    `).run(name.toLowerCase(), guildId, content, authorId);
  }

  /**
   * Get tag
   */
  getTag(guildId, name) {
    return this.db.prepare(`
      SELECT * FROM tags WHERE guild_id = ? AND name = ?
    `).get(guildId, name.toLowerCase());
  }

  /**
   * Get all tags
   */
  getTags(guildId) {
    return this.db.prepare('SELECT * FROM tags WHERE guild_id = ?').all(guildId);
  }

  /**
   * Delete tag
   */
  deleteTag(guildId, name) {
    this.db.prepare('DELETE FROM tags WHERE guild_id = ? AND name = ?').run(guildId, name.toLowerCase());
  }

  /**
   * Increment tag uses
   */
  incrementTagUse(guildId, name) {
    this.db.prepare(`
      UPDATE tags SET uses = uses + 1 WHERE guild_id = ? AND name = ?
    `).run(guildId, name.toLowerCase());
  }

  // ==================== Reminder Methods ====================

  /**
   * Create reminder
   */
  createReminder(userId, channelId, guildId, message, remindAt) {
    const result = this.db.prepare(`
      INSERT INTO reminders (user_id, channel_id, guild_id, message, remind_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, channelId, guildId, message, remindAt);
    return result.lastInsertRowid;
  }

  /**
   * Get due reminders
   */
  getDueReminders() {
    return this.db.prepare(`
      SELECT * FROM reminders WHERE remind_at <= ?
    `).all(new Date().toISOString());
  }

  /**
   * Delete reminder
   */
  deleteReminder(reminderId) {
    this.db.prepare('DELETE FROM reminders WHERE id = ?').run(reminderId);
  }

  /**
   * Get user reminders
   */
  getUserReminders(userId) {
    return this.db.prepare(`
      SELECT * FROM reminders WHERE user_id = ? ORDER BY remind_at ASC
    `).all(userId);
  }

  // ==================== Temp Punishment Methods ====================

  /**
   * Add temp punishment
   */
  addTempPunishment(guildId, userId, type, expiresAt, roleIds = null) {
    this.db.prepare(`
      INSERT INTO temp_punishments (guild_id, user_id, type, expires_at, role_ids)
      VALUES (?, ?, ?, ?, ?)
    `).run(guildId, userId, type, expiresAt, roleIds ? JSON.stringify(roleIds) : null);
  }

  /**
   * Get expired punishments
   */
  getExpiredPunishments() {
    return this.db.prepare(`
      SELECT * FROM temp_punishments WHERE expires_at <= ?
    `).all(new Date().toISOString());
  }

  /**
   * Remove temp punishment
   */
  removeTempPunishment(guildId, userId, type) {
    this.db.prepare(`
      DELETE FROM temp_punishments WHERE guild_id = ? AND user_id = ? AND type = ?
    `).run(guildId, userId, type);
  }

  // ==================== Level Roles Methods ====================

  /**
   * Set level role
   */
  setLevelRole(guildId, level, roleId) {
    this.db.prepare(`
      INSERT OR REPLACE INTO level_roles (guild_id, level, role_id) VALUES (?, ?, ?)
    `).run(guildId, level, roleId);
  }

  /**
   * Get level roles
   */
  getLevelRoles(guildId) {
    return this.db.prepare('SELECT * FROM level_roles WHERE guild_id = ? ORDER BY level ASC').all(guildId);
  }

  /**
   * Remove level role
   */
  removeLevelRole(guildId, level) {
    this.db.prepare('DELETE FROM level_roles WHERE guild_id = ? AND level = ?').run(guildId, level);
  }

  // ==================== Shop Methods ====================

  /**
   * Add shop item
   */
  addShopItem(guildId, name, description, price, type, value) {
    const result = this.db.prepare(`
      INSERT INTO shop_items (guild_id, name, description, price, type, value)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(guildId, name, description, price, type, value);
    return result.lastInsertRowid;
  }

  /**
   * Get shop items
   */
  getShopItems(guildId) {
    return this.db.prepare('SELECT * FROM shop_items WHERE guild_id = ?').all(guildId);
  }

  /**
   * Delete shop item
   */
  deleteShopItem(itemId) {
    this.db.prepare('DELETE FROM shop_items WHERE id = ?').run(itemId);
  }

  /**
   * Add to inventory
   */
  addToInventory(userId, guildId, itemId, quantity = 1) {
    this.db.prepare(`
      INSERT INTO inventory (user_id, guild_id, item_id, quantity)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, guild_id, item_id) DO UPDATE SET quantity = quantity + ?
    `).run(userId, guildId, itemId, quantity, quantity);
  }

  /**
   * Get inventory
   */
  getInventory(userId, guildId) {
    return this.db.prepare(`
      SELECT i.*, s.name, s.description, s.type, s.value
      FROM inventory i
      JOIN shop_items s ON i.item_id = s.id
      WHERE i.user_id = ? AND i.guild_id = ?
    `).all(userId, guildId);
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      this.log.info('Database connection closed');
    }
  }
}

// Export singleton
const db = new DatabaseManager();
export default db;
export { DatabaseManager };
