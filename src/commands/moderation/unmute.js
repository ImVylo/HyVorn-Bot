// Unmute (remove timeout) command
// Created by ImVylo

import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { PermissionLevels } from '../../utils/constants.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';

export default {
  name: 'unmute',
  description: 'Remove timeout from a member (unmute)',
  aliases: ['untimeout'],
  cooldown: 5,
  guildOnly: true,
  permissionLevel: PermissionLevels.MODERATOR,
  botPermissions: [PermissionFlagsBits.ModerateMembers],

  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Remove timeout from a member (unmute)')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to unmute')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for the unmute')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction, client) {
    const isSlash = interaction.isChatInputCommand?.();
    const guild = interaction.guild;
    const moderator = isSlash ? interaction.user : interaction.author;

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
      const embed = errorEmbed('Please specify a valid user to unmute.');
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

    if (!targetMember.isCommunicationDisabled()) {
      const embed = errorEmbed('That user is not muted.');
      return isSlash
        ? interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [embed] });
    }

    try {
      // Remove timeout
      await targetMember.timeout(null, reason);

      // Remove temp punishment if exists
      client.db.removeTempPunishment(guild.id, targetUser.id, 'mute');

      // Log to database
      client.db.addModLog(guild.id, targetUser.id, moderator.id, 'unmute', reason);

      // Log to log channel
      const loggingModule = client.getModule('logging');
      if (loggingModule) {
        await loggingModule.logModAction('unmute', targetUser, moderator, reason);
      }

      const embed = successEmbed(`**${targetUser.tag}** has been unmuted.\n**Reason:** ${reason}`);
      return isSlash
        ? interaction.reply({ embeds: [embed] })
        : interaction.reply({ embeds: [embed] });
    } catch (error) {
      client.logger.error('Unmute', 'Error unmuting user:', error);
      const embed = errorEmbed(`Failed to unmute user: ${error.message}`);
      return isSlash
        ? interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [embed] });
    }
  }
};
