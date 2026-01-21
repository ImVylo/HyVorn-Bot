// Ban command
// Created by ImVylo

import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { PermissionLevels } from '../../utils/constants.js';
import { successEmbed, errorEmbed, modEmbed } from '../../utils/embeds.js';
import { canModerate } from '../../core/Permissions.js';
import { parseDuration, formatDuration } from '../../utils/time.js';

export default {
  name: 'ban',
  description: 'Ban a member from the server',
  aliases: [],
  cooldown: 5,
  guildOnly: true,
  permissionLevel: PermissionLevels.MODERATOR,
  botPermissions: [PermissionFlagsBits.BanMembers],

  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to ban')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for the ban')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('duration')
        .setDescription('Ban duration (e.g., 1d, 7d, 30d) - leave empty for permanent')
        .setRequired(false)
    )
    .addIntegerOption(option =>
      option
        .setName('delete_messages')
        .setDescription('Days of messages to delete (0-7)')
        .setMinValue(0)
        .setMaxValue(7)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction, client) {
    const isSlash = interaction.isChatInputCommand?.();
    const guild = interaction.guild;
    const moderator = isSlash ? interaction.member : interaction.member;

    let targetUser, reason, duration, deleteMessages;
    if (isSlash) {
      targetUser = interaction.options.getUser('user');
      reason = interaction.options.getString('reason') || 'No reason provided';
      duration = interaction.options.getString('duration');
      deleteMessages = interaction.options.getInteger('delete_messages') || 0;
    } else {
      const args = interaction.content.split(' ').slice(1);
      const userId = args[0]?.replace(/[<@!>]/g, '');
      targetUser = await client.users.fetch(userId).catch(() => null);
      reason = args.slice(1).join(' ') || 'No reason provided';
      deleteMessages = 0;
    }

    if (!targetUser) {
      const embed = errorEmbed('Please specify a valid user to ban.');
      return isSlash
        ? interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [embed] });
    }

    const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);

    // Check if moderator can ban target (if they're in the server)
    if (targetMember) {
      if (!canModerate(moderator, targetMember)) {
        const embed = errorEmbed('You cannot ban this user. They may have a higher role than you.');
        return isSlash
          ? interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
          : interaction.reply({ embeds: [embed] });
      }

      if (!targetMember.bannable) {
        const embed = errorEmbed('I cannot ban this user. They may have a higher role than me.');
        return isSlash
          ? interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
          : interaction.reply({ embeds: [embed] });
      }
    }

    // Parse duration if provided
    let durationMs = null;
    let durationText = 'Permanent';
    if (duration) {
      durationMs = parseDuration(duration);
      if (!durationMs) {
        const embed = errorEmbed('Invalid duration format. Use formats like: 1d, 7d, 30d');
        return isSlash
          ? interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
          : interaction.reply({ embeds: [embed] });
      }
      durationText = formatDuration(durationMs);
    }

    try {
      // DM the user before banning
      try {
        const dmEmbed = modEmbed('Banned', targetUser, moderator.user, reason)
          .setTitle(`You have been banned from ${guild.name}`);

        if (durationMs) {
          dmEmbed.addFields({ name: 'Duration', value: durationText, inline: true });
        }

        await targetUser.send({ embeds: [dmEmbed] });
      } catch {
        // User has DMs disabled
      }

      // Ban the user
      await guild.members.ban(targetUser.id, {
        reason: reason,
        deleteMessageDays: deleteMessages
      });

      // If temp ban, store it
      if (durationMs) {
        const expiresAt = new Date(Date.now() + durationMs).toISOString();
        client.db.addTempPunishment(guild.id, targetUser.id, 'ban', expiresAt);
      }

      // Log to database
      client.db.addModLog(guild.id, targetUser.id, moderator.user.id, 'ban', reason, durationText);

      // Log to log channel
      const loggingModule = client.getModule('logging');
      if (loggingModule) {
        await loggingModule.logModAction('ban', targetUser, moderator.user, reason, durationText);
      }

      const embed = modEmbed('Member Banned', targetUser, moderator.user, reason, durationText);
      return isSlash
        ? interaction.reply({ embeds: [embed] })
        : interaction.reply({ embeds: [embed] });
    } catch (error) {
      client.logger.error('Ban', 'Error banning user:', error);
      const embed = errorEmbed(`Failed to ban user: ${error.message}`);
      return isSlash
        ? interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [embed] });
    }
  }
};
