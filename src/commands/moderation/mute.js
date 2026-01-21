// Mute (timeout) command
// Created by ImVylo

import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { PermissionLevels } from '../../utils/constants.js';
import { successEmbed, errorEmbed, modEmbed } from '../../utils/embeds.js';
import { canModerate } from '../../core/Permissions.js';
import { parseDuration, formatDuration } from '../../utils/time.js';

export default {
  name: 'mute',
  description: 'Timeout a member (mute)',
  aliases: ['timeout'],
  cooldown: 5,
  guildOnly: true,
  permissionLevel: PermissionLevels.MODERATOR,
  botPermissions: [PermissionFlagsBits.ModerateMembers],

  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Timeout a member (mute)')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to mute')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('duration')
        .setDescription('Mute duration (e.g., 10m, 1h, 1d) - max 28 days')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for the mute')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction, client) {
    const isSlash = interaction.isChatInputCommand?.();
    const guild = interaction.guild;
    const moderator = isSlash ? interaction.member : interaction.member;

    let targetUser, duration, reason;
    if (isSlash) {
      targetUser = interaction.options.getUser('user');
      duration = interaction.options.getString('duration');
      reason = interaction.options.getString('reason') || 'No reason provided';
    } else {
      const args = interaction.content.split(' ').slice(1);
      const userId = args[0]?.replace(/[<@!>]/g, '');
      targetUser = await client.users.fetch(userId).catch(() => null);
      duration = args[1];
      reason = args.slice(2).join(' ') || 'No reason provided';
    }

    if (!targetUser) {
      const embed = errorEmbed('Please specify a valid user to mute.');
      return isSlash
        ? interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [embed] });
    }

    if (!duration) {
      const embed = errorEmbed('Please specify a duration (e.g., 10m, 1h, 1d).');
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

    // Check if moderator can mute target
    if (!canModerate(moderator, targetMember)) {
      const embed = errorEmbed('You cannot mute this user. They may have a higher role than you.');
      return isSlash
        ? interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [embed] });
    }

    // Check if bot can mute target
    if (!targetMember.moderatable) {
      const embed = errorEmbed('I cannot mute this user. They may have a higher role than me.');
      return isSlash
        ? interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [embed] });
    }

    // Parse duration
    const durationMs = parseDuration(duration);
    if (!durationMs) {
      const embed = errorEmbed('Invalid duration format. Use formats like: 10m, 1h, 1d');
      return isSlash
        ? interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [embed] });
    }

    // Discord timeout max is 28 days
    const maxDuration = 28 * 24 * 60 * 60 * 1000;
    if (durationMs > maxDuration) {
      const embed = errorEmbed('Timeout duration cannot exceed 28 days.');
      return isSlash
        ? interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [embed] });
    }

    const durationText = formatDuration(durationMs);

    try {
      // DM the user before muting
      try {
        await targetUser.send({
          embeds: [modEmbed('Muted', targetUser, moderator.user, reason, durationText)
            .setTitle(`You have been muted in ${guild.name}`)]
        });
      } catch {
        // User has DMs disabled
      }

      // Timeout the user
      await targetMember.timeout(durationMs, reason);

      // Log to database
      client.db.addModLog(guild.id, targetUser.id, moderator.user.id, 'mute', reason, durationText);

      // Log to log channel
      const loggingModule = client.getModule('logging');
      if (loggingModule) {
        await loggingModule.logModAction('mute', targetUser, moderator.user, reason, durationText);
      }

      const embed = modEmbed('Member Muted', targetUser, moderator.user, reason, durationText);
      return isSlash
        ? interaction.reply({ embeds: [embed] })
        : interaction.reply({ embeds: [embed] });
    } catch (error) {
      client.logger.error('Mute', 'Error muting user:', error);
      const embed = errorEmbed(`Failed to mute user: ${error.message}`);
      return isSlash
        ? interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [embed] });
    }
  }
};
