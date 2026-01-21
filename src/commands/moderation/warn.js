// Warn command
// Created by ImVylo

import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { PermissionLevels } from '../../utils/constants.js';
import { successEmbed, errorEmbed, modEmbed } from '../../utils/embeds.js';
import { canModerate } from '../../core/Permissions.js';

export default {
  name: 'warn',
  description: 'Warn a member',
  aliases: [],
  cooldown: 5,
  guildOnly: true,
  permissionLevel: PermissionLevels.MODERATOR,

  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a member')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to warn')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for the warning')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction, client) {
    const isSlash = interaction.isChatInputCommand?.();
    const guild = interaction.guild;
    const moderator = isSlash ? interaction.member : interaction.member;

    let targetUser, reason;
    if (isSlash) {
      targetUser = interaction.options.getUser('user');
      reason = interaction.options.getString('reason');
    } else {
      const args = interaction.content.split(' ').slice(1);
      const userId = args[0]?.replace(/[<@!>]/g, '');
      targetUser = await client.users.fetch(userId).catch(() => null);
      reason = args.slice(1).join(' ');
    }

    if (!targetUser) {
      const embed = errorEmbed('Please specify a valid user to warn.');
      return isSlash
        ? interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [embed] });
    }

    if (!reason) {
      const embed = errorEmbed('Please provide a reason for the warning.');
      return isSlash
        ? interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [embed] });
    }

    const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);

    // Check if moderator can warn target (if they're in the server)
    if (targetMember && !canModerate(moderator, targetMember)) {
      const embed = errorEmbed('You cannot warn this user. They may have a higher role than you.');
      return isSlash
        ? interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [embed] });
    }

    try {
      // Add warning to database
      const warning = client.db.addWarning(targetUser.id, guild.id, moderator.user.id, reason);
      const warnings = client.db.getWarnings(targetUser.id, guild.id);

      // DM the user
      try {
        await targetUser.send({
          embeds: [modEmbed('Warning', targetUser, moderator.user, reason)
            .setTitle(`You have been warned in ${guild.name}`)
            .addFields({ name: 'Total Warnings', value: `${warnings.length}`, inline: true })]
        });
      } catch {
        // User has DMs disabled
      }

      // Log to database (mod log)
      client.db.addModLog(guild.id, targetUser.id, moderator.user.id, 'warn', reason);

      // Log to log channel
      const loggingModule = client.getModule('logging');
      if (loggingModule) {
        await loggingModule.logModAction('warn', targetUser, moderator.user, reason);
      }

      // Check auto-punishment thresholds
      const settings = client.db.getGuild(guild.id).settings;
      const warnPunishments = settings.warnPunishments || {};
      let autoPunishment = null;

      // Auto-ban at X warnings (check first as it's the most severe)
      if (warnPunishments.banAt && warnings.length >= warnPunishments.banAt) {
        try {
          await guild.members.ban(targetUser.id, {
            reason: `Automatic ban: Reached ${warnings.length} warnings`
          });
          autoPunishment = `Automatically banned (${warnings.length} warnings)`;

          // Log the auto-ban
          client.db.addModLog(guild.id, targetUser.id, client.user.id, 'ban', `Auto-punishment: Reached ${warnings.length} warnings`);
          if (loggingModule) {
            await loggingModule.logModAction({
              guild,
              action: 'Auto-Ban',
              moderator: client.user,
              target: targetUser,
              reason: `Reached ${warnings.length} warnings`,
              details: 'Triggered by warn command'
            });
          }
        } catch {}
      }
      // Auto-kick at X warnings
      else if (warnPunishments.kickAt && warnings.length >= warnPunishments.kickAt && targetMember) {
        try {
          await targetMember.kick(`Automatic kick: Reached ${warnings.length} warnings`);
          autoPunishment = `Automatically kicked (${warnings.length} warnings)`;

          // Log the auto-kick
          client.db.addModLog(guild.id, targetUser.id, client.user.id, 'kick', `Auto-punishment: Reached ${warnings.length} warnings`);
          if (loggingModule) {
            await loggingModule.logModAction({
              guild,
              action: 'Auto-Kick',
              moderator: client.user,
              target: targetUser,
              reason: `Reached ${warnings.length} warnings`,
              details: 'Triggered by warn command'
            });
          }
        } catch {}
      }
      // Auto-mute at X warnings
      else if (warnPunishments.muteAt && warnings.length >= warnPunishments.muteAt && targetMember) {
        try {
          const muteDuration = (warnPunishments.muteDuration || 60) * 60 * 1000; // Default 60 minutes
          await targetMember.timeout(muteDuration, `Automatic mute: Reached ${warnings.length} warnings`);
          const durationText = warnPunishments.muteDuration ? `${warnPunishments.muteDuration} minutes` : '1 hour';
          autoPunishment = `Automatically muted for ${durationText} (${warnings.length} warnings)`;

          // Log the auto-mute
          client.db.addModLog(guild.id, targetUser.id, client.user.id, 'mute', `Auto-punishment: Reached ${warnings.length} warnings`, durationText);
          if (loggingModule) {
            await loggingModule.logModAction({
              guild,
              action: 'Auto-Mute',
              moderator: client.user,
              target: targetUser,
              reason: `Reached ${warnings.length} warnings`,
              details: `Duration: ${durationText}`
            });
          }
        } catch {}
      }

      const embed = modEmbed('Member Warned', targetUser, moderator.user, reason)
        .addFields({ name: 'Warning #', value: `${warning.id}`, inline: true })
        .addFields({ name: 'Total Warnings', value: `${warnings.length}`, inline: true });

      if (autoPunishment) {
        embed.addFields({ name: 'Auto-Punishment', value: autoPunishment, inline: false });
      }

      return isSlash
        ? interaction.reply({ embeds: [embed] })
        : interaction.reply({ embeds: [embed] });
    } catch (error) {
      client.logger.error('Warn', 'Error warning user:', error);
      const embed = errorEmbed(`Failed to warn user: ${error.message}`);
      return isSlash
        ? interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [embed] });
    }
  }
};
