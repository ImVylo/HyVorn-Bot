// Tempban command - Temporarily ban a user
// Created by ImVylo

import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { PermissionLevels } from '../../utils/constants.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { parseDuration, formatDuration } from '../../utils/time.js';

export default {
  name: 'tempban',
  description: 'Temporarily ban a user',
  aliases: ['tb', 'tban'],
  cooldown: 5,
  guildOnly: true,
  permissionLevel: PermissionLevels.MODERATOR,
  botPermissions: [PermissionFlagsBits.BanMembers],

  data: new SlashCommandBuilder()
    .setName('tempban')
    .setDescription('Temporarily ban a user')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to temporarily ban')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('duration')
        .setDescription('Ban duration (e.g., 1h, 1d, 1w, 30d)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for the ban')
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
    const moderator = isSlash ? interaction.user : interaction.author;

    let targetUser, durationStr, reason, deleteMessages;
    if (isSlash) {
      targetUser = interaction.options.getUser('user');
      durationStr = interaction.options.getString('duration');
      reason = interaction.options.getString('reason') || 'No reason provided';
      deleteMessages = interaction.options.getInteger('delete_messages') || 0;
    } else {
      const args = interaction.content.split(' ').slice(1);
      if (args.length < 2) {
        return interaction.reply({
          embeds: [errorEmbed('Usage: `tempban <@user> <duration> [reason]`\nExample: `tempban @user 7d Spamming`')]
        });
      }

      const userId = args[0].replace(/[<@!>]/g, '');
      targetUser = await client.users.fetch(userId).catch(() => null);

      if (!targetUser) {
        return interaction.reply({
          embeds: [errorEmbed('User not found.')]
        });
      }

      durationStr = args[1];
      reason = args.slice(2).join(' ') || 'No reason provided';
      deleteMessages = 0;
    }

    // Parse duration
    const durationMs = parseDuration(durationStr);
    if (!durationMs) {
      return interaction.reply({
        embeds: [errorEmbed('Invalid duration format. Use formats like `1h`, `1d`, `1w`, `30d`.')],
        flags: isSlash ? MessageFlags.Ephemeral : undefined
      });
    }

    // Maximum ban duration: 1 year
    const maxDuration = 365 * 24 * 60 * 60 * 1000;
    if (durationMs > maxDuration) {
      return interaction.reply({
        embeds: [errorEmbed('Ban duration cannot exceed 1 year. Use `/ban` for permanent bans.')],
        flags: isSlash ? MessageFlags.Ephemeral : undefined
      });
    }

    // Check if target is the moderator
    if (targetUser.id === moderator.id) {
      return interaction.reply({
        embeds: [errorEmbed('You cannot ban yourself.')],
        flags: isSlash ? MessageFlags.Ephemeral : undefined
      });
    }

    // Check if target is the bot
    if (targetUser.id === client.user.id) {
      return interaction.reply({
        embeds: [errorEmbed('I cannot ban myself.')],
        flags: isSlash ? MessageFlags.Ephemeral : undefined
      });
    }

    // Check if target is the server owner
    if (targetUser.id === interaction.guild.ownerId) {
      return interaction.reply({
        embeds: [errorEmbed('You cannot ban the server owner.')],
        flags: isSlash ? MessageFlags.Ephemeral : undefined
      });
    }

    // Check role hierarchy
    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (targetMember) {
      const modMember = interaction.member;
      if (targetMember.roles.highest.position >= modMember.roles.highest.position) {
        return interaction.reply({
          embeds: [errorEmbed('You cannot ban a member with equal or higher role.')],
          flags: isSlash ? MessageFlags.Ephemeral : undefined
        });
      }

      // Check if bot can ban the target
      if (targetMember.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
        return interaction.reply({
          embeds: [errorEmbed('I cannot ban a member with equal or higher role than me.')],
          flags: isSlash ? MessageFlags.Ephemeral : undefined
        });
      }
    }

    // Check if user is already banned
    const existingBan = await interaction.guild.bans.fetch(targetUser.id).catch(() => null);
    if (existingBan) {
      return interaction.reply({
        embeds: [errorEmbed('This user is already banned.')],
        flags: isSlash ? MessageFlags.Ephemeral : undefined
      });
    }

    const expiresAt = new Date(Date.now() + durationMs).toISOString();

    try {
      // Try to DM the user before ban
      try {
        await targetUser.send({
          embeds: [{
            color: 0xED4245,
            title: `Temporarily Banned from ${interaction.guild.name}`,
            description: `You have been temporarily banned.\n\n**Duration:** ${formatDuration(durationMs)}\n**Reason:** ${reason}\n**Expires:** <t:${Math.floor(Date.now() / 1000 + durationMs / 1000)}:R>`,
            timestamp: new Date().toISOString()
          }]
        });
      } catch {
        // Can't DM user, continue anyway
      }

      // Ban the user
      await interaction.guild.members.ban(targetUser.id, {
        deleteMessageSeconds: deleteMessages * 24 * 60 * 60,
        reason: `[Tempban: ${formatDuration(durationMs)}] ${moderator.tag}: ${reason}`
      });

      // Add to temp punishments for automatic unban
      client.db.addTempPunishment(interaction.guild.id, targetUser.id, 'ban', expiresAt);

      // Log to mod logs
      client.db.addModLog(
        interaction.guild.id,
        targetUser.id,
        moderator.id,
        'tempban',
        reason,
        formatDuration(durationMs)
      );

      // Log the action
      const loggingModule = client.getModule('logging');
      if (loggingModule) {
        await loggingModule.logModAction({
          guild: interaction.guild,
          action: 'Temporary Ban',
          moderator,
          target: targetUser,
          reason,
          details: `Duration: ${formatDuration(durationMs)}\nExpires: <t:${Math.floor(Date.now() / 1000 + durationMs / 1000)}:F>`
        });
      }

      return interaction.reply({
        embeds: [successEmbed(
          `**${targetUser.tag}** has been temporarily banned.\n` +
          `**Duration:** ${formatDuration(durationMs)}\n` +
          `**Reason:** ${reason}\n` +
          `**Expires:** <t:${Math.floor(Date.now() / 1000 + durationMs / 1000)}:R>`
        )]
      });
    } catch (error) {
      client.logger.error('Tempban', 'Error temp banning user:', error);
      return interaction.reply({
        embeds: [errorEmbed(`Failed to ban user: ${error.message}`)],
        flags: isSlash ? MessageFlags.Ephemeral : undefined
      });
    }
  }
};
