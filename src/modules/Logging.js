// Logging module for HyVornBot
// Created by ImVylo

import { EmbedBuilder, AuditLogEvent } from 'discord.js';
import { Colors, LogTypes, LogChannels, Emojis } from '../utils/constants.js';
import { discordTimestamp } from '../utils/time.js';

class Logging {
  constructor(client) {
    this.client = client;
    this.log = client.logger.child('Logging');
  }

  async init() {
    this.log.info('Logging module initialized');
  }

  /**
   * Get log channel for a guild based on log type
   */
  async getLogChannel(guildId, logType = null) {
    const settings = this.client.db.getGuild(guildId).settings;
    const enabledModules = settings.enabledModules || {};

    if (enabledModules.logging === false) return null;

    // Get the setting key for this log type
    const settingKey = logType ? LogChannels[logType] : null;

    // Check for type-specific log channel
    if (settingKey && settings[settingKey]) {
      return this.client.channels.fetch(settings[settingKey]).catch(() => null);
    }

    // Fall back to general log channel
    if (settings.logChannel) {
      return this.client.channels.fetch(settings.logChannel).catch(() => null);
    }

    return null;
  }

  /**
   * Send a log embed to the appropriate channel
   */
  async sendLog(guildId, embed, logType = null) {
    const channel = await this.getLogChannel(guildId, logType);
    if (!channel) return;

    try {
      await channel.send({ embeds: [embed] });
    } catch (error) {
      this.log.error(`Failed to send log: ${error.message}`);
    }
  }

  /**
   * Log message delete
   */
  async logMessageDelete(message) {
    if (!message.guild || message.author?.bot) return;

    const embed = new EmbedBuilder()
      .setColor(Colors.ERROR)
      .setTitle(`${Emojis.ERROR} Message Deleted`)
      .setDescription(`Message by ${message.author} deleted in ${message.channel}`)
      .addFields(
        { name: 'Author', value: `${message.author.tag} (${message.author.id})`, inline: true },
        { name: 'Channel', value: `${message.channel.name}`, inline: true },
        { name: 'Content', value: message.content?.slice(0, 1000) || 'No content', inline: false }
      )
      .setFooter({ text: `Message ID: ${message.id}` })
      .setTimestamp();

    if (message.attachments.size > 0) {
      embed.addFields({
        name: 'Attachments',
        value: message.attachments.map(a => a.url).join('\n').slice(0, 1000),
        inline: false
      });
    }

    await this.sendLog(message.guild.id, embed, LogTypes.MESSAGE_DELETE);
  }

  /**
   * Log message edit
   */
  async logMessageEdit(oldMessage, newMessage) {
    if (!oldMessage.guild || oldMessage.author?.bot) return;

    const embed = new EmbedBuilder()
      .setColor(Colors.WARNING)
      .setTitle(`${Emojis.WARNING} Message Edited`)
      .setDescription(`Message by ${oldMessage.author} edited in ${oldMessage.channel}`)
      .addFields(
        { name: 'Author', value: `${oldMessage.author.tag} (${oldMessage.author.id})`, inline: true },
        { name: 'Channel', value: `${oldMessage.channel.name}`, inline: true },
        { name: 'Before', value: oldMessage.content?.slice(0, 1000) || 'No content', inline: false },
        { name: 'After', value: newMessage.content?.slice(0, 1000) || 'No content', inline: false }
      )
      .setFooter({ text: `Message ID: ${oldMessage.id}` })
      .setTimestamp();

    await this.sendLog(oldMessage.guild.id, embed, LogTypes.MESSAGE_EDIT);
  }

  /**
   * Log bulk message delete
   */
  async logBulkDelete(channel, count, moderator) {
    const embed = new EmbedBuilder()
      .setColor(Colors.ERROR)
      .setTitle(`${Emojis.ERROR} Bulk Messages Deleted`)
      .addFields(
        { name: 'Channel', value: `${channel} (${channel.name})`, inline: true },
        { name: 'Messages Deleted', value: `${count}`, inline: true },
        { name: 'Moderator', value: `${moderator.tag}`, inline: true }
      )
      .setTimestamp();

    await this.sendLog(channel.guild.id, embed, LogTypes.MESSAGE_BULK_DELETE);
  }

  /**
   * Log member join
   */
  async logMemberJoin(member) {
    const accountAge = Date.now() - member.user.createdTimestamp;
    const isNewAccount = accountAge < 7 * 24 * 60 * 60 * 1000; // 7 days

    const embed = new EmbedBuilder()
      .setColor(Colors.SUCCESS)
      .setTitle(`${Emojis.SUCCESS} Member Joined`)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'User', value: `${member.user.tag} (${member.user.id})`, inline: true },
        { name: 'Account Created', value: discordTimestamp(member.user.createdAt, 'R'), inline: true },
        { name: 'Member Count', value: `${member.guild.memberCount}`, inline: true }
      )
      .setFooter({ text: `User ID: ${member.user.id}` })
      .setTimestamp();

    if (isNewAccount) {
      embed.addFields({
        name: '⚠️ Warning',
        value: 'This account was created less than 7 days ago',
        inline: false
      });
    }

    await this.sendLog(member.guild.id, embed, LogTypes.MEMBER_JOIN);
  }

  /**
   * Log member leave
   */
  async logMemberLeave(member) {
    const roles = member.roles.cache
      .filter(r => r.id !== member.guild.id)
      .map(r => r.name)
      .join(', ') || 'None';

    const embed = new EmbedBuilder()
      .setColor(Colors.ERROR)
      .setTitle(`${Emojis.ERROR} Member Left`)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'User', value: `${member.user.tag} (${member.user.id})`, inline: true },
        { name: 'Joined', value: member.joinedAt ? discordTimestamp(member.joinedAt, 'R') : 'Unknown', inline: true },
        { name: 'Member Count', value: `${member.guild.memberCount}`, inline: true },
        { name: 'Roles', value: roles.slice(0, 1000), inline: false }
      )
      .setFooter({ text: `User ID: ${member.user.id}` })
      .setTimestamp();

    await this.sendLog(member.guild.id, embed, LogTypes.MEMBER_LEAVE);
  }

  /**
   * Log moderation action
   */
  async logModAction(action, user, moderator, reason, duration = null) {
    const actionEmojis = {
      kick: Emojis.KICK,
      ban: Emojis.BAN,
      unban: Emojis.UNLOCK,
      mute: Emojis.MUTE,
      unmute: Emojis.UNLOCK,
      warn: Emojis.WARN
    };

    const actionColors = {
      kick: Colors.WARNING,
      ban: Colors.ERROR,
      unban: Colors.SUCCESS,
      mute: Colors.WARNING,
      unmute: Colors.SUCCESS,
      warn: Colors.WARNING
    };

    const emoji = actionEmojis[action] || Emojis.INFO;
    const color = actionColors[action] || Colors.INFO;

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`${emoji} User ${action.charAt(0).toUpperCase() + action.slice(1)}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
        { name: 'Moderator', value: `${moderator.tag}`, inline: true },
        { name: 'Reason', value: reason || 'No reason provided', inline: false }
      )
      .setFooter({ text: `User ID: ${user.id}` })
      .setTimestamp();

    if (duration) {
      embed.addFields({ name: 'Duration', value: duration, inline: true });
    }

    // Get guild ID from the user's mutual servers with the bot
    // This is a workaround since we might not have direct guild access
    const guild = this.client.guilds.cache.find(g =>
      g.members.cache.has(moderator.id)
    );

    if (guild) {
      await this.sendLog(guild.id, embed, LogTypes.MODERATION);
    }
  }

  /**
   * Log AutoMod action
   */
  async logAutoMod(message, reason, action) {
    const embed = new EmbedBuilder()
      .setColor(Colors.MODERATION)
      .setTitle(`${Emojis.WARNING} AutoMod Action`)
      .addFields(
        { name: 'User', value: `${message.author.tag} (${message.author.id})`, inline: true },
        { name: 'Channel', value: `${message.channel}`, inline: true },
        { name: 'Action', value: action, inline: true },
        { name: 'Reason', value: reason, inline: false },
        { name: 'Message Content', value: message.content?.slice(0, 1000) || 'No content', inline: false }
      )
      .setTimestamp();

    await this.sendLog(message.guild.id, embed, LogTypes.AUTOMOD);
  }

  /**
   * Log member role changes
   */
  async logRoleChange(member, addedRoles, removedRoles) {
    const embed = new EmbedBuilder()
      .setColor(Colors.INFO)
      .setTitle(`${Emojis.INFO} Member Roles Updated`)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'User', value: `${member.user.tag} (${member.user.id})`, inline: true }
      )
      .setFooter({ text: `User ID: ${member.user.id}` })
      .setTimestamp();

    if (addedRoles.length > 0) {
      embed.addFields({
        name: '➕ Roles Added',
        value: addedRoles.map(r => `<@&${r.id}>`).join(', '),
        inline: false
      });
    }

    if (removedRoles.length > 0) {
      embed.addFields({
        name: '➖ Roles Removed',
        value: removedRoles.map(r => `<@&${r.id}>`).join(', '),
        inline: false
      });
    }

    await this.sendLog(member.guild.id, embed, LogTypes.ROLE_CHANGE);
  }

  /**
   * Log nickname changes
   */
  async logNicknameChange(member, oldNickname, newNickname) {
    const embed = new EmbedBuilder()
      .setColor(Colors.INFO)
      .setTitle(`${Emojis.INFO} Nickname Changed`)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'User', value: `${member.user.tag} (${member.user.id})`, inline: true },
        { name: 'Before', value: oldNickname || '*No nickname*', inline: true },
        { name: 'After', value: newNickname || '*No nickname*', inline: true }
      )
      .setFooter({ text: `User ID: ${member.user.id}` })
      .setTimestamp();

    await this.sendLog(member.guild.id, embed, LogTypes.NICKNAME_CHANGE);
  }

  /**
   * Log invite usage
   */
  async logInviteUse(member, invite) {
    const embed = new EmbedBuilder()
      .setColor(Colors.SUCCESS)
      .setTitle(`${Emojis.SUCCESS} Invite Used`)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'User', value: `${member.user.tag} (${member.user.id})`, inline: true },
        { name: 'Invite Code', value: `\`${invite.code}\``, inline: true },
        { name: 'Inviter', value: invite.inviter ? `${invite.inviter.tag}` : 'Unknown', inline: true },
        { name: 'Uses', value: `${invite.uses}`, inline: true }
      )
      .setFooter({ text: `User ID: ${member.user.id}` })
      .setTimestamp();

    await this.sendLog(member.guild.id, embed, LogTypes.INVITE);
  }

  /**
   * Log raid detection
   */
  async logRaid(guild, joinCount) {
    const embed = new EmbedBuilder()
      .setColor(Colors.ERROR)
      .setTitle(`${Emojis.ERROR} Raid Detected!`)
      .setDescription(`**${joinCount}** members joined in rapid succession. Lockdown mode has been enabled.`)
      .addFields(
        { name: 'Server', value: guild.name, inline: true },
        { name: 'Member Count', value: `${guild.memberCount}`, inline: true }
      )
      .setTimestamp();

    await this.sendLog(guild.id, embed, LogTypes.MODERATION);
  }

  /**
   * Log voice state changes
   */
  async logVoiceUpdate(oldState, newState) {
    const member = newState.member || oldState.member;
    if (!member) return;

    let embed;

    if (!oldState.channel && newState.channel) {
      // Joined voice channel
      embed = new EmbedBuilder()
        .setColor(Colors.SUCCESS)
        .setTitle(`${Emojis.SUCCESS} Voice Channel Join`)
        .addFields(
          { name: 'User', value: `${member.user.tag}`, inline: true },
          { name: 'Channel', value: `${newState.channel.name}`, inline: true }
        )
        .setTimestamp();

      await this.sendLog(newState.guild.id, embed, LogTypes.VOICE_JOIN);
    } else if (oldState.channel && !newState.channel) {
      // Left voice channel
      embed = new EmbedBuilder()
        .setColor(Colors.ERROR)
        .setTitle(`${Emojis.ERROR} Voice Channel Leave`)
        .addFields(
          { name: 'User', value: `${member.user.tag}`, inline: true },
          { name: 'Channel', value: `${oldState.channel.name}`, inline: true }
        )
        .setTimestamp();

      await this.sendLog(oldState.guild.id, embed, LogTypes.VOICE_LEAVE);
    } else if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
      // Moved voice channels
      embed = new EmbedBuilder()
        .setColor(Colors.INFO)
        .setTitle(`${Emojis.INFO} Voice Channel Move`)
        .addFields(
          { name: 'User', value: `${member.user.tag}`, inline: true },
          { name: 'From', value: `${oldState.channel.name}`, inline: true },
          { name: 'To', value: `${newState.channel.name}`, inline: true }
        )
        .setTimestamp();

      await this.sendLog(newState.guild.id, embed, LogTypes.VOICE_MOVE);
    }
  }

  cleanup() {
    this.log.info('Logging module cleaned up');
  }
}

export default Logging;
