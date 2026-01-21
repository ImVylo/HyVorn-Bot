// Temporary Voice Channels Module
// Creates temporary voice channels that are deleted when empty

import { ChannelType, PermissionFlagsBits } from 'discord.js';

export default class TempVoice {
  constructor(client) {
    this.client = client;
    this.db = client.db;
    this.tempChannels = new Set(); // Track temp channels in memory
    this.initDatabase();
    this.setupListeners();
  }

  initDatabase() {
    // Configuration per guild
    this.db.db.prepare(`
      CREATE TABLE IF NOT EXISTS tempvoice_config (
        guild_id TEXT PRIMARY KEY,
        lobby_channel_id TEXT NOT NULL,
        category_id TEXT,
        channel_name TEXT DEFAULT 'Voice {user}',
        user_limit INTEGER DEFAULT 0,
        enabled INTEGER DEFAULT 1
      )
    `).run();

    // Track temp channels
    this.db.db.prepare(`
      CREATE TABLE IF NOT EXISTS tempvoice_channels (
        channel_id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        owner_id TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    `).run();
  }

  getConfig(guildId) {
    return this.db.db.prepare('SELECT * FROM tempvoice_config WHERE guild_id = ?').get(guildId);
  }

  setConfig(guildId, data) {
    const stmt = this.db.db.prepare(`
      INSERT INTO tempvoice_config (guild_id, lobby_channel_id, category_id, channel_name, user_limit, enabled)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(guild_id) DO UPDATE SET
        lobby_channel_id = excluded.lobby_channel_id,
        category_id = excluded.category_id,
        channel_name = excluded.channel_name,
        user_limit = excluded.user_limit,
        enabled = excluded.enabled
    `);
    stmt.run(
      guildId,
      data.lobbyChannelId,
      data.categoryId || null,
      data.channelName || 'Voice {user}',
      data.userLimit || 0,
      data.enabled ? 1 : 0
    );
  }

  setupListeners() {
    this.client.on('voiceStateUpdate', async (oldState, newState) => {
      await this.handleVoiceStateUpdate(oldState, newState);
    });
  }

  async handleVoiceStateUpdate(oldState, newState) {
    const guild = newState.guild;
    const config = this.getConfig(guild.id);

    if (!config || !config.enabled) return;

    // User joined the lobby channel - create temp channel
    if (newState.channelId === config.lobby_channel_id && !oldState.channelId) {
      await this.createTempChannel(guild, newState.member, config);
    }

    // User left a temp channel - check if it should be deleted
    if (oldState.channel) {
      await this.checkAndDeleteEmptyChannel(oldState.channel);
    }
  }

  async createTempChannel(guild, member, config) {
    try {
      const channelName = config.channel_name.replace('{user}', member.user.username);
      const category = config.category_id ? guild.channels.cache.get(config.category_id) : null;

      const channel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildVoice,
        parent: category,
        userLimit: config.user_limit,
        permissionOverwrites: [
          {
            id: member.id,
            allow: [
              PermissionFlagsBits.ManageChannels,
              PermissionFlagsBits.MoveMembers,
              PermissionFlagsBits.MuteMembers,
            ],
          },
        ],
      });

      // Save to database
      this.db.db.prepare(`
        INSERT INTO tempvoice_channels (channel_id, guild_id, owner_id, created_at)
        VALUES (?, ?, ?, ?)
      `).run(channel.id, guild.id, member.id, Date.now());

      this.tempChannels.add(channel.id);

      // Move user to new channel
      await member.voice.setChannel(channel);

      return channel;
    } catch (error) {
      console.error('Error creating temp voice channel:', error);
    }
  }

  async checkAndDeleteEmptyChannel(channel) {
    // Check if this is a temp channel
    const tempChannel = this.db.db.prepare('SELECT * FROM tempvoice_channels WHERE channel_id = ?')
      .get(channel.id);

    if (!tempChannel) return;

    // If channel is empty, delete it
    if (channel.members.size === 0) {
      try {
        this.db.db.prepare('DELETE FROM tempvoice_channels WHERE channel_id = ?').run(channel.id);
        this.tempChannels.delete(channel.id);
        await channel.delete();
      } catch (error) {
        console.error('Error deleting temp voice channel:', error);
      }
    }
  }

  getTempChannelInfo(channelId) {
    return this.db.db.prepare('SELECT * FROM tempvoice_channels WHERE channel_id = ?').get(channelId);
  }

  getGuildTempChannels(guildId) {
    return this.db.db.prepare('SELECT * FROM tempvoice_channels WHERE guild_id = ?').all(guildId);
  }

  async cleanupOrphanedChannels(guild) {
    const tempChannels = this.getGuildTempChannels(guild.id);
    let cleaned = 0;

    for (const temp of tempChannels) {
      const channel = guild.channels.cache.get(temp.channel_id);
      if (!channel || channel.members.size === 0) {
        if (channel) {
          try {
            await channel.delete();
          } catch (error) {
            console.error('Error deleting orphaned channel:', error);
          }
        }
        this.db.db.prepare('DELETE FROM tempvoice_channels WHERE channel_id = ?').run(temp.channel_id);
        this.tempChannels.delete(temp.channel_id);
        cleaned++;
      }
    }

    return cleaned;
  }
}
