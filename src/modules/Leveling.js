// Leveling module for HyVornBot
// Created by ImVylo

import { Collection, EmbedBuilder } from 'discord.js';
import { XPDefaults, Colors, Emojis } from '../utils/constants.js';
import { levelUpEmbed } from '../utils/embeds.js';

class Leveling {
  constructor(client) {
    this.client = client;
    this.log = client.logger.child('Leveling');
    this.cooldowns = new Collection();
  }

  async init() {
    this.log.info('Leveling module initialized');
  }

  /**
   * Process a message for XP gain
   * @param {Message} message - Discord message
   */
  async processMessage(message) {
    if (!message.guild || message.author.bot) return;

    const settings = this.client.db.getGuild(message.guild.id).settings;
    const enabledModules = settings.enabledModules || {};

    // Check if leveling is enabled
    if (enabledModules.leveling === false) return;

    const xpSettings = settings.xp || {};

    // Check if channel is excluded
    if (xpSettings.excludedChannels?.includes(message.channel.id)) return;

    // Check if user has excluded role
    if (xpSettings.excludedRoles?.some(r => message.member.roles.cache.has(r))) return;

    // Check cooldown
    const key = `${message.guild.id}-${message.author.id}`;
    const now = Date.now();
    const cooldownTime = xpSettings.cooldown || XPDefaults.COOLDOWN || 60000;

    if (this.cooldowns.has(key)) {
      const lastMessage = this.cooldowns.get(key);
      if (now - lastMessage < cooldownTime) return;
    }

    this.cooldowns.set(key, now);

    // Calculate XP to give
    let xpToGive = this.getRandomXP(xpSettings);

    // Apply multipliers
    xpToGive = this.applyMultipliers(xpToGive, message, xpSettings);

    // Add XP
    const user = this.client.db.getUser(message.author.id, message.guild.id);
    const newXP = user.xp + xpToGive;
    const oldLevel = user.level;
    const newLevel = this.calculateLevel(newXP, xpSettings);

    // Update database
    this.client.db.updateUser(message.author.id, message.guild.id, {
      xp: newXP,
      level: newLevel
    });

    // Check for level up
    if (newLevel > oldLevel) {
      await this.handleLevelUp(message, oldLevel, newLevel, xpSettings);
    }
  }

  /**
   * Get random XP amount
   */
  getRandomXP(settings) {
    const min = settings.minXP || XPDefaults.MIN_XP;
    const max = settings.maxXP || XPDefaults.MAX_XP;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Apply XP multipliers based on roles and channels
   */
  applyMultipliers(xp, message, settings) {
    let multiplier = 1;

    // Role multipliers
    if (settings.roleMultipliers) {
      for (const [roleId, mult] of Object.entries(settings.roleMultipliers)) {
        if (message.member.roles.cache.has(roleId)) {
          multiplier = Math.max(multiplier, mult);
        }
      }
    }

    // Channel multipliers
    if (settings.channelMultipliers?.[message.channel.id]) {
      multiplier *= settings.channelMultipliers[message.channel.id];
    }

    return Math.floor(xp * multiplier);
  }

  /**
   * Calculate level from XP
   */
  calculateLevel(xp, settings) {
    const multiplier = settings.levelMultiplier || XPDefaults.LEVEL_MULTIPLIER;
    let level = 0;
    let requiredXP = 0;

    while (xp >= requiredXP) {
      level++;
      requiredXP += level * multiplier;
    }

    return level - 1;
  }

  /**
   * Calculate XP required for a level
   */
  getXPForLevel(level, settings) {
    const multiplier = settings?.levelMultiplier || XPDefaults.LEVEL_MULTIPLIER;
    let totalXP = 0;

    for (let i = 1; i <= level; i++) {
      totalXP += i * multiplier;
    }

    return totalXP;
  }

  /**
   * Handle level up event
   */
  async handleLevelUp(message, oldLevel, newLevel, settings) {
    // Get level roles to assign
    const levelRoles = this.client.db.getLevelRoles(message.guild.id);
    const newRoles = levelRoles.filter(lr => lr.level <= newLevel && lr.level > oldLevel);
    const rewards = [];

    // Assign level roles
    for (const lr of newRoles) {
      try {
        const role = message.guild.roles.cache.get(lr.role_id);
        if (role && !message.member.roles.cache.has(role.id)) {
          await message.member.roles.add(role);
          rewards.push(`${role}`);
        }
      } catch (error) {
        this.log.error('Error assigning level role:', error);
      }
    }

    // Remove old level roles if configured
    if (settings.removeOldRoles) {
      const oldRoles = levelRoles.filter(lr => lr.level <= oldLevel);
      for (const lr of oldRoles) {
        try {
          const role = message.guild.roles.cache.get(lr.role_id);
          if (role && message.member.roles.cache.has(role.id)) {
            await message.member.roles.remove(role);
          }
        } catch (error) {
          this.log.error('Error removing old level role:', error);
        }
      }
    }

    // Send level up message
    const guildSettings = this.client.db.getGuild(message.guild.id).settings;
    const levelUpChannel = guildSettings.levelUpChannel;

    let channel;
    if (levelUpChannel === 'current' || !levelUpChannel) {
      channel = message.channel;
    } else if (levelUpChannel === 'dm') {
      channel = await message.author.createDM().catch(() => null);
    } else {
      channel = message.guild.channels.cache.get(levelUpChannel);
    }

    if (channel) {
      const rewardText = rewards.length > 0 ? rewards.join(', ') : null;
      const embed = levelUpEmbed(message.author, newLevel, rewardText);

      try {
        await channel.send({ content: `${message.author}`, embeds: [embed] });
      } catch (error) {
        this.log.error('Error sending level up message:', error);
      }
    }
  }

  /**
   * Get user rank in leaderboard
   */
  getUserRank(userId, guildId) {
    const leaderboard = this.client.db.getLeaderboard(guildId, 999999);
    const index = leaderboard.findIndex(u => u.user_id === userId);
    return index === -1 ? null : index + 1;
  }

  /**
   * Get formatted progress bar
   */
  getProgressBar(current, total, length = 10) {
    const progress = Math.floor((current / total) * length);
    const empty = length - progress;
    return '█'.repeat(progress) + '░'.repeat(empty);
  }

  cleanup() {
    this.cooldowns.clear();
    this.log.info('Leveling module cleaned up');
  }
}

export default Leveling;
