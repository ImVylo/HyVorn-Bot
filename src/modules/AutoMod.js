// AutoMod module for HyVornBot
// Created by ImVylo

import { Collection } from 'discord.js';
import { AutoModDefaults, Emojis } from '../utils/constants.js';

class AutoMod {
  constructor(client) {
    this.client = client;
    this.log = client.logger.child('AutoMod');
    this.messageCache = new Collection(); // For spam detection
    this.joinCache = new Collection(); // For raid detection
  }

  async init() {
    this.log.info('AutoMod module initialized');
  }

  /**
   * Process a message for auto-moderation
   * @param {Message} message - Discord message
   * @returns {boolean} Whether the message was blocked
   */
  async processMessage(message) {
    if (!message.guild || message.author.bot) return false;

    const settings = this.client.db.getGuild(message.guild.id).settings;
    const enabledModules = settings.enabledModules || {};

    // Check if AutoMod is enabled
    if (enabledModules.automod === false) return false;

    const automodSettings = settings.automod || {};

    // Run all checks
    const checks = [
      this.checkSpam(message, automodSettings),
      this.checkInvites(message, automodSettings),
      this.checkLinks(message, automodSettings),
      this.checkMentions(message, automodSettings),
      this.checkCaps(message, automodSettings),
      this.checkWords(message, automodSettings)
    ];

    for (const check of checks) {
      const result = await check;
      if (result.blocked) {
        await this.handleViolation(message, result.reason, result.action);
        return true;
      }
    }

    return false;
  }

  /**
   * Check for spam (message rate limiting)
   */
  async checkSpam(message, settings) {
    if (!settings.antiSpam) return { blocked: false };

    const maxMessages = settings.spamMaxMessages || AutoModDefaults.MAX_MESSAGES_PER_INTERVAL;
    const interval = settings.spamInterval || AutoModDefaults.MESSAGE_INTERVAL;

    const key = `${message.guild.id}-${message.author.id}`;
    const now = Date.now();

    if (!this.messageCache.has(key)) {
      this.messageCache.set(key, []);
    }

    const timestamps = this.messageCache.get(key);

    // Remove old timestamps
    const recent = timestamps.filter(t => now - t < interval);
    recent.push(now);
    this.messageCache.set(key, recent);

    if (recent.length > maxMessages) {
      return {
        blocked: true,
        reason: 'Spam detected',
        action: settings.spamAction || 'delete'
      };
    }

    return { blocked: false };
  }

  /**
   * Check for Discord invites
   */
  async checkInvites(message, settings) {
    if (!settings.antiInvite) return { blocked: false };

    const inviteRegex = /(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/[^\s]+/gi;

    if (inviteRegex.test(message.content)) {
      // Check whitelist
      const whitelist = settings.inviteWhitelist || [];
      const invites = message.content.match(inviteRegex) || [];

      for (const invite of invites) {
        const code = invite.split('/').pop();
        if (!whitelist.includes(code)) {
          return {
            blocked: true,
            reason: 'Discord invite link detected',
            action: settings.inviteAction || 'delete'
          };
        }
      }
    }

    return { blocked: false };
  }

  /**
   * Check for links
   */
  async checkLinks(message, settings) {
    if (!settings.antiLink) return { blocked: false };

    const linkRegex = /https?:\/\/[^\s]+/gi;
    const links = message.content.match(linkRegex);

    if (!links) return { blocked: false };

    const whitelist = settings.linkWhitelist || [];
    const blacklist = settings.linkBlacklist || [];

    for (const link of links) {
      try {
        const url = new URL(link);
        const domain = url.hostname.replace('www.', '');

        // Check blacklist first
        if (blacklist.some(d => domain.includes(d))) {
          return {
            blocked: true,
            reason: 'Blacklisted link detected',
            action: settings.linkAction || 'delete'
          };
        }

        // If whitelist mode is enabled, check whitelist
        if (settings.linkWhitelistMode) {
          if (!whitelist.some(d => domain.includes(d))) {
            return {
              blocked: true,
              reason: 'Link not in whitelist',
              action: settings.linkAction || 'delete'
            };
          }
        }
      } catch {
        // Invalid URL, skip
      }
    }

    return { blocked: false };
  }

  /**
   * Check for mass mentions
   */
  async checkMentions(message, settings) {
    if (!settings.antiMention) return { blocked: false };

    const maxMentions = settings.maxMentions || AutoModDefaults.MAX_MENTIONS;
    const totalMentions = message.mentions.users.size + message.mentions.roles.size;

    if (totalMentions > maxMentions) {
      return {
        blocked: true,
        reason: `Mass mentions detected (${totalMentions} mentions)`,
        action: settings.mentionAction || 'delete'
      };
    }

    return { blocked: false };
  }

  /**
   * Check for excessive caps
   */
  async checkCaps(message, settings) {
    if (!settings.antiCaps) return { blocked: false };

    const content = message.content.replace(/[^a-zA-Z]/g, '');
    if (content.length < (settings.minCapsLength || AutoModDefaults.MIN_CAPS_LENGTH)) {
      return { blocked: false };
    }

    const capsCount = content.replace(/[^A-Z]/g, '').length;
    const capsPercent = (capsCount / content.length) * 100;

    if (capsPercent > (settings.maxCapsPercent || AutoModDefaults.MAX_CAPS_PERCENT)) {
      return {
        blocked: true,
        reason: 'Excessive caps detected',
        action: settings.capsAction || 'delete'
      };
    }

    return { blocked: false };
  }

  /**
   * Check for blacklisted words
   */
  async checkWords(message, settings) {
    if (!settings.wordBlacklist || settings.wordBlacklist.length === 0) {
      return { blocked: false };
    }

    const content = message.content.toLowerCase();

    for (const word of settings.wordBlacklist) {
      // Support wildcards
      const regex = new RegExp(word.replace(/\*/g, '.*'), 'i');
      if (regex.test(content)) {
        return {
          blocked: true,
          reason: 'Blacklisted word detected',
          action: settings.wordAction || 'delete'
        };
      }
    }

    return { blocked: false };
  }

  /**
   * Handle a violation
   */
  async handleViolation(message, reason, action) {
    try {
      // Delete the message
      if (action === 'delete' || action === 'warn' || action === 'mute') {
        await message.delete().catch(() => {});
      }

      // Warn the user
      if (action === 'warn' || action === 'mute') {
        this.client.db.addWarning(
          message.author.id,
          message.guild.id,
          this.client.user.id,
          `[AutoMod] ${reason}`
        );
      }

      // Mute the user
      if (action === 'mute') {
        const member = message.member;
        if (member && member.moderatable) {
          await member.timeout(300000, `[AutoMod] ${reason}`); // 5 minutes
        }
      }

      // Send notification
      try {
        const reply = await message.channel.send({
          content: `${Emojis.WARNING} ${message.author}, ${reason.toLowerCase()}. Please follow the server rules.`
        });
        setTimeout(() => reply.delete().catch(() => {}), 5000);
      } catch {}

      // Log the violation
      const loggingModule = this.client.getModule('logging');
      if (loggingModule) {
        await loggingModule.logAutoMod(message, reason, action);
      }

      this.log.debug(`AutoMod: ${reason} - ${message.author.tag} in ${message.guild.name}`);
    } catch (error) {
      this.log.error('Error handling violation:', error);
    }
  }

  /**
   * Check for raid (mass joins)
   */
  async checkRaid(member) {
    const settings = this.client.db.getGuild(member.guild.id).settings;
    const automodSettings = settings.automod || {};

    if (!automodSettings.antiRaid) return;

    const key = member.guild.id;
    const now = Date.now();
    const threshold = automodSettings.raidThreshold || 10; // members
    const interval = automodSettings.raidInterval || 10000; // 10 seconds

    if (!this.joinCache.has(key)) {
      this.joinCache.set(key, []);
    }

    const joins = this.joinCache.get(key);
    const recent = joins.filter(j => now - j.time < interval);
    recent.push({ id: member.id, time: now });
    this.joinCache.set(key, recent);

    if (recent.length >= threshold) {
      // Raid detected
      this.log.warn(`Raid detected in ${member.guild.name}!`);

      // Enable lockdown mode
      const settings = this.client.db.getGuild(member.guild.id).settings;
      if (!settings.lockdownMode) {
        this.client.db.setSetting(member.guild.id, 'lockdownMode', true);

        // Notify in log channel
        const loggingModule = this.client.getModule('logging');
        if (loggingModule) {
          await loggingModule.logRaid(member.guild, recent.length);
        }
      }

      // Kick recent joins if configured
      if (automodSettings.raidAction === 'kick') {
        for (const join of recent) {
          try {
            const m = await member.guild.members.fetch(join.id);
            await m.kick('[AutoMod] Raid detected');
          } catch {}
        }
      }

      // Clear join cache
      this.joinCache.set(key, []);
    }
  }

  cleanup() {
    this.messageCache.clear();
    this.joinCache.clear();
    this.log.info('AutoMod module cleaned up');
  }
}

export default AutoMod;
