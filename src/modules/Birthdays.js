// Birthday System Module
// Tracks user birthdays and sends birthday messages

import { EmbedBuilder } from 'discord.js';

export default class Birthdays {
  constructor(client) {
    this.client = client;
    this.db = client.db;
    this.initDatabase();
    this.startChecker();
  }

  initDatabase() {
    // Birthday configuration per guild
    this.db.db.prepare(`
      CREATE TABLE IF NOT EXISTS birthday_config (
        guild_id TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL,
        message TEXT DEFAULT 'Happy Birthday {user}! 🎉🎂',
        role_id TEXT,
        enabled INTEGER DEFAULT 1
      )
    `).run();

    // User birthdays
    this.db.db.prepare(`
      CREATE TABLE IF NOT EXISTS birthdays (
        user_id TEXT NOT NULL,
        guild_id TEXT NOT NULL,
        month INTEGER NOT NULL,
        day INTEGER NOT NULL,
        year INTEGER,
        PRIMARY KEY (user_id, guild_id)
      )
    `).run();

    // Track last check to avoid duplicate announcements
    this.db.db.prepare(`
      CREATE TABLE IF NOT EXISTS birthday_checks (
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        last_check TEXT NOT NULL,
        PRIMARY KEY (guild_id, user_id)
      )
    `).run();
  }

  getConfig(guildId) {
    return this.db.db.prepare('SELECT * FROM birthday_config WHERE guild_id = ?').get(guildId);
  }

  setConfig(guildId, data) {
    const stmt = this.db.db.prepare(`
      INSERT INTO birthday_config (guild_id, channel_id, message, role_id, enabled)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(guild_id) DO UPDATE SET
        channel_id = excluded.channel_id,
        message = excluded.message,
        role_id = excluded.role_id,
        enabled = excluded.enabled
    `);
    stmt.run(
      guildId,
      data.channelId,
      data.message || 'Happy Birthday {user}! 🎉🎂',
      data.roleId || null,
      data.enabled ? 1 : 0
    );
  }

  setBirthday(userId, guildId, month, day, year = null) {
    // Validate date
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      throw new Error('Invalid date. Month must be 1-12 and day must be 1-31.');
    }

    const stmt = this.db.db.prepare(`
      INSERT INTO birthdays (user_id, guild_id, month, day, year)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(user_id, guild_id) DO UPDATE SET
        month = excluded.month,
        day = excluded.day,
        year = excluded.year
    `);
    stmt.run(userId, guildId, month, day, year);
  }

  getBirthday(userId, guildId) {
    return this.db.db.prepare('SELECT * FROM birthdays WHERE user_id = ? AND guild_id = ?')
      .get(userId, guildId);
  }

  removeBirthday(userId, guildId) {
    this.db.db.prepare('DELETE FROM birthdays WHERE user_id = ? AND guild_id = ?')
      .run(userId, guildId);
  }

  getUpcomingBirthdays(guildId, limit = 10) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();

    return this.db.db.prepare(`
      SELECT * FROM birthdays
      WHERE guild_id = ?
      ORDER BY
        CASE
          WHEN month > ? OR (month = ? AND day >= ?) THEN 0
          ELSE 1
        END,
        month, day
      LIMIT ?
    `).all(guildId, currentMonth, currentMonth, currentDay, limit);
  }

  getTodaysBirthdays(guildId) {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    return this.db.db.prepare(`
      SELECT * FROM birthdays
      WHERE guild_id = ? AND month = ? AND day = ?
    `).all(guildId, month, day);
  }

  hasBeenCheckedToday(guildId, userId) {
    const today = new Date().toDateString();
    const check = this.db.db.prepare(`
      SELECT * FROM birthday_checks
      WHERE guild_id = ? AND user_id = ? AND last_check = ?
    `).get(guildId, userId, today);

    return !!check;
  }

  markAsChecked(guildId, userId) {
    const today = new Date().toDateString();
    this.db.db.prepare(`
      INSERT INTO birthday_checks (guild_id, user_id, last_check)
      VALUES (?, ?, ?)
      ON CONFLICT(guild_id, user_id) DO UPDATE SET
        last_check = excluded.last_check
    `).run(guildId, userId, today);
  }

  startChecker() {
    // Check every hour
    setInterval(() => {
      this.checkAllBirthdays();
    }, 60 * 60 * 1000);

    // Initial check
    this.checkAllBirthdays();
  }

  async checkAllBirthdays() {
    const guilds = this.db.db.prepare('SELECT DISTINCT guild_id FROM birthday_config WHERE enabled = 1').all();

    for (const { guild_id } of guilds) {
      await this.checkGuildBirthdays(guild_id);
    }
  }

  async checkGuildBirthdays(guildId) {
    try {
      const guild = this.client.guilds.cache.get(guildId);
      if (!guild) return;

      const config = this.getConfig(guildId);
      if (!config || !config.enabled) return;

      const channel = guild.channels.cache.get(config.channel_id);
      if (!channel) return;

      const birthdays = this.getTodaysBirthdays(guildId);

      for (const birthday of birthdays) {
        // Skip if already announced today
        if (this.hasBeenCheckedToday(guildId, birthday.user_id)) continue;

        const member = await guild.members.fetch(birthday.user_id).catch(() => null);
        if (!member) continue;

        // Send birthday message
        const message = config.message
          .replace('{user}', member.toString())
          .replace('{username}', member.user.username);

        const age = birthday.year ? new Date().getFullYear() - birthday.year : null;

        const embed = new EmbedBuilder()
          .setColor('#ff69b4')
          .setTitle('🎉 Happy Birthday! 🎂')
          .setDescription(message)
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .setTimestamp();

        if (age) {
          embed.addFields({ name: 'Age', value: age.toString(), inline: true });
        }

        await channel.send({ content: member.toString(), embeds: [embed] });

        // Add birthday role if configured
        if (config.role_id) {
          const role = guild.roles.cache.get(config.role_id);
          if (role) {
            await member.roles.add(role).catch(console.error);

            // Remove role after 24 hours
            setTimeout(async () => {
              await member.roles.remove(role).catch(console.error);
            }, 24 * 60 * 60 * 1000);
          }
        }

        this.markAsChecked(guildId, birthday.user_id);
      }
    } catch (error) {
      console.error(`Error checking birthdays for guild ${guildId}:`, error);
    }
  }

  getAllBirthdays(guildId) {
    return this.db.db.prepare('SELECT * FROM birthdays WHERE guild_id = ? ORDER BY month, day')
      .all(guildId);
  }
}
