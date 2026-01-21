// Softban command - Ban then immediately unban to clear messages
// Created by ImVylo

import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { PermissionLevels } from '../../utils/constants.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';

export default {
  name: 'softban',
  description: 'Ban and immediately unban a user to clear their messages',
  aliases: ['sb'],
  cooldown: 5,
  guildOnly: true,
  permissionLevel: PermissionLevels.MODERATOR,
  botPermissions: [PermissionFlagsBits.BanMembers],

  data: new SlashCommandBuilder()
    .setName('softban')
    .setDescription('Ban and immediately unban a user to clear their messages')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to softban')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('days')
        .setDescription('Number of days of messages to delete (1-7)')
        .setMinValue(1)
        .setMaxValue(7)
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for the softban')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction, client) {
    const isSlash = interaction.isChatInputCommand?.();
    const moderator = isSlash ? interaction.user : interaction.author;

    let targetUser, days, reason;
    if (isSlash) {
      targetUser = interaction.options.getUser('user');
      days = interaction.options.getInteger('days') || 1;
      reason = interaction.options.getString('reason') || 'No reason provided';
    } else {
      const args = interaction.content.split(' ').slice(1);
      if (!args[0]) {
        return interaction.reply({
          embeds: [errorEmbed('Please specify a user to softban.')]
        });
      }

      const userId = args[0].replace(/[<@!>]/g, '');
      targetUser = await client.users.fetch(userId).catch(() => null);

      if (!targetUser) {
        return interaction.reply({
          embeds: [errorEmbed('User not found.')]
        });
      }

      days = parseInt(args[1]) || 1;
      if (days < 1 || days > 7) days = 1;
      reason = args.slice(2).join(' ') || 'No reason provided';
    }

    // Check if target is the moderator
    if (targetUser.id === moderator.id) {
      return interaction.reply({
        embeds: [errorEmbed('You cannot softban yourself.')],
        flags: isSlash ? MessageFlags.Ephemeral : undefined
      });
    }

    // Check if target is the bot
    if (targetUser.id === client.user.id) {
      return interaction.reply({
        embeds: [errorEmbed('I cannot softban myself.')],
        flags: isSlash ? MessageFlags.Ephemeral : undefined
      });
    }

    // Check if target is the server owner
    if (targetUser.id === interaction.guild.ownerId) {
      return interaction.reply({
        embeds: [errorEmbed('You cannot softban the server owner.')],
        flags: isSlash ? MessageFlags.Ephemeral : undefined
      });
    }

    // Check role hierarchy
    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (targetMember) {
      const modMember = interaction.member;
      if (targetMember.roles.highest.position >= modMember.roles.highest.position) {
        return interaction.reply({
          embeds: [errorEmbed('You cannot softban a member with equal or higher role.')],
          flags: isSlash ? MessageFlags.Ephemeral : undefined
        });
      }

      // Check if bot can ban the target
      if (targetMember.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
        return interaction.reply({
          embeds: [errorEmbed('I cannot softban a member with equal or higher role than me.')],
          flags: isSlash ? MessageFlags.Ephemeral : undefined
        });
      }
    }

    try {
      // Try to DM the user before softban
      try {
        await targetUser.send({
          embeds: [{
            color: 0xFEE75C,
            title: `Softbanned from ${interaction.guild.name}`,
            description: `You have been softbanned (kicked with message deletion).\n\n**Reason:** ${reason}\n\nYou can rejoin the server using an invite link.`,
            timestamp: new Date().toISOString()
          }]
        });
      } catch {
        // Can't DM user, continue anyway
      }

      // Ban the user (this deletes messages)
      await interaction.guild.members.ban(targetUser.id, {
        deleteMessageSeconds: days * 24 * 60 * 60,
        reason: `[Softban] ${moderator.tag}: ${reason}`
      });

      // Immediately unban
      await interaction.guild.members.unban(targetUser.id, `Softban unban by ${moderator.tag}`);

      // Log to mod logs
      client.db.addModLog(interaction.guild.id, {
        action: 'softban',
        moderatorId: moderator.id,
        userId: targetUser.id,
        reason,
        details: { days }
      });

      // Log the action
      const loggingModule = client.getModule('logging');
      if (loggingModule) {
        await loggingModule.logModAction({
          guild: interaction.guild,
          action: 'Softban',
          moderator,
          target: targetUser,
          reason,
          details: `Deleted ${days} day(s) of messages`
        });
      }

      return interaction.reply({
        embeds: [successEmbed(`**${targetUser.tag}** has been softbanned.\n**Reason:** ${reason}\n**Messages deleted:** ${days} day(s)`)]
      });
    } catch (error) {
      client.logger.error('Softban', 'Error softbanning user:', error);
      return interaction.reply({
        embeds: [errorEmbed(`Failed to softban user: ${error.message}`)],
        flags: isSlash ? MessageFlags.Ephemeral : undefined
      });
    }
  }
};
