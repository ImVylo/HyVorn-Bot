// Slowmode command - Set channel slowmode
// Created by ImVylo

import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { PermissionLevels } from '../../utils/constants.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { parseDuration, formatDuration } from '../../utils/time.js';

export default {
  name: 'slowmode',
  description: 'Set slowmode for a channel',
  aliases: ['slow', 'sm'],
  cooldown: 5,
  guildOnly: true,
  permissionLevel: PermissionLevels.MODERATOR,
  botPermissions: [PermissionFlagsBits.ManageChannels],

  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Set slowmode for a channel')
    .addStringOption(option =>
      option
        .setName('duration')
        .setDescription('Slowmode duration (e.g., 5s, 1m, 1h, or "off" to disable)')
        .setRequired(true)
    )
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Channel to set slowmode (defaults to current channel)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for setting slowmode')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction, client) {
    const isSlash = interaction.isChatInputCommand?.();

    let durationStr, channel, reason;
    if (isSlash) {
      durationStr = interaction.options.getString('duration');
      channel = interaction.options.getChannel('channel') || interaction.channel;
      reason = interaction.options.getString('reason') || 'No reason provided';
    } else {
      const args = interaction.content.split(' ').slice(1);
      durationStr = args[0];
      channel = interaction.channel;
      reason = args.slice(1).join(' ') || 'No reason provided';

      if (!durationStr) {
        return interaction.reply({
          embeds: [errorEmbed('Please provide a duration (e.g., `5s`, `1m`, `1h`) or `off` to disable.')]
        });
      }
    }

    // Check if channel is a text channel
    if (!channel.isTextBased() || channel.isThread()) {
      return interaction.reply({
        embeds: [errorEmbed('Slowmode can only be set on text channels.')],
        flags: isSlash ? MessageFlags.Ephemeral : undefined
      });
    }

    // Parse duration
    let seconds;
    if (durationStr.toLowerCase() === 'off' || durationStr === '0') {
      seconds = 0;
    } else {
      const ms = parseDuration(durationStr);
      if (ms === null) {
        return interaction.reply({
          embeds: [errorEmbed('Invalid duration format. Use formats like `5s`, `1m`, `1h`, `6h` or `off`.')]
        });
      }
      seconds = Math.floor(ms / 1000);
    }

    // Discord slowmode limit is 6 hours (21600 seconds)
    if (seconds > 21600) {
      return interaction.reply({
        embeds: [errorEmbed('Slowmode cannot exceed 6 hours (21600 seconds).')],
        flags: isSlash ? MessageFlags.Ephemeral : undefined
      });
    }

    try {
      await channel.setRateLimitPerUser(seconds, reason);

      const user = isSlash ? interaction.user : interaction.author;

      // Log the action
      const loggingModule = client.getModule('logging');
      if (loggingModule) {
        await loggingModule.logModAction({
          guild: interaction.guild,
          action: seconds === 0 ? 'Slowmode Disabled' : 'Slowmode Set',
          moderator: user,
          target: channel,
          reason,
          details: seconds > 0 ? `Duration: ${formatDuration(seconds * 1000)}` : null
        });
      }

      const embed = seconds === 0
        ? successEmbed(`Slowmode has been disabled in ${channel}.`)
        : successEmbed(`Slowmode set to **${formatDuration(seconds * 1000)}** in ${channel}.`);

      return interaction.reply({
        embeds: [embed],
        flags: isSlash ? MessageFlags.Ephemeral : undefined
      });
    } catch (error) {
      client.logger.error('Slowmode', 'Error setting slowmode:', error);
      return interaction.reply({
        embeds: [errorEmbed(`Failed to set slowmode: ${error.message}`)],
        flags: isSlash ? MessageFlags.Ephemeral : undefined
      });
    }
  }
};
