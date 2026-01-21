// Kick command
// Created by ImVylo

import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { PermissionLevels } from '../../utils/constants.js';
import { successEmbed, errorEmbed, modEmbed } from '../../utils/embeds.js';
import { canModerate } from '../../core/Permissions.js';

export default {
  name: 'kick',
  description: 'Kick a member from the server',
  aliases: [],
  cooldown: 5,
  guildOnly: true,
  permissionLevel: PermissionLevels.MODERATOR,
  botPermissions: [PermissionFlagsBits.KickMembers],

  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to kick')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for the kick')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction, client) {
    const isSlash = interaction.isChatInputCommand?.();
    const guild = interaction.guild;
    const moderator = isSlash ? interaction.member : interaction.member;

    let targetUser, reason;
    if (isSlash) {
      targetUser = interaction.options.getUser('user');
      reason = interaction.options.getString('reason') || 'No reason provided';
    } else {
      const args = interaction.content.split(' ').slice(1);
      const userId = args[0]?.replace(/[<@!>]/g, '');
      targetUser = await client.users.fetch(userId).catch(() => null);
      reason = args.slice(1).join(' ') || 'No reason provided';
    }

    if (!targetUser) {
      const embed = errorEmbed('Please specify a valid user to kick.');
      return isSlash
        ? interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [embed] });
    }

    const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);

    if (!targetMember) {
      const embed = errorEmbed('That user is not in this server.');
      return isSlash
        ? interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [embed] });
    }

    // Check if moderator can kick target
    if (!canModerate(moderator, targetMember)) {
      const embed = errorEmbed('You cannot kick this user. They may have a higher role than you.');
      return isSlash
        ? interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [embed] });
    }

    // Check if bot can kick target
    if (!targetMember.kickable) {
      const embed = errorEmbed('I cannot kick this user. They may have a higher role than me.');
      return isSlash
        ? interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [embed] });
    }

    try {
      // DM the user before kicking
      try {
        await targetUser.send({
          embeds: [modEmbed('Kicked', targetUser, moderator.user, reason).setTitle(`You have been kicked from ${guild.name}`)]
        });
      } catch {
        // User has DMs disabled
      }

      // Kick the user
      await targetMember.kick(reason);

      // Log to database
      client.db.addModLog(guild.id, targetUser.id, moderator.user.id, 'kick', reason);

      // Log to log channel
      const loggingModule = client.getModule('logging');
      if (loggingModule) {
        await loggingModule.logModAction('kick', targetUser, moderator.user, reason);
      }

      const embed = modEmbed('Member Kicked', targetUser, moderator.user, reason);
      return isSlash
        ? interaction.reply({ embeds: [embed] })
        : interaction.reply({ embeds: [embed] });
    } catch (error) {
      client.logger.error('Kick', 'Error kicking user:', error);
      const embed = errorEmbed(`Failed to kick user: ${error.message}`);
      return isSlash
        ? interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [embed] });
    }
  }
};
