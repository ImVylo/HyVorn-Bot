// Giveaway start command
// Created by ImVylo

import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { PermissionLevels } from '../../utils/constants.js';
import { parseDuration } from '../../utils/time.js';

export default {
  name: 'giveaway-start',
  description: 'Start a new giveaway',
  permissionLevel: PermissionLevels.MODERATOR,
  guildOnly: true,

  data: new SlashCommandBuilder()
    .setName('giveaway-start')
    .setDescription('Start a new giveaway')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(option =>
      option
        .setName('prize')
        .setDescription('What are you giving away?')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('duration')
        .setDescription('How long should the giveaway last? (e.g., 1h, 30m, 1d)')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('winners')
        .setDescription('Number of winners')
        .setMinValue(1)
        .setMaxValue(20)
        .setRequired(false)
    )
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Channel to post the giveaway in')
        .setRequired(false)
    )
    .addIntegerOption(option =>
      option
        .setName('min_level')
        .setDescription('Minimum level required to enter')
        .setMinValue(1)
        .setRequired(false)
    )
    .addRoleOption(option =>
      option
        .setName('required_role')
        .setDescription('Role required to enter')
        .setRequired(false)
    ),

  async execute(interaction, client) {
    const prize = interaction.options.getString('prize');
    const durationStr = interaction.options.getString('duration');
    const winners = interaction.options.getInteger('winners') || 1;
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const minLevel = interaction.options.getInteger('min_level');
    const requiredRole = interaction.options.getRole('required_role');

    // Parse duration
    const duration = parseDuration(durationStr);
    if (!duration) {
      return interaction.reply({
        content: '❌ Invalid duration format! Use formats like: 1h, 30m, 1d, 2h30m',
        flags: MessageFlags.Ephemeral
      });
    }

    if (duration < 60000) {
      return interaction.reply({
        content: '❌ Giveaway duration must be at least 1 minute!',
        flags: MessageFlags.Ephemeral
      });
    }

    const requirements = {};
    if (minLevel) requirements.minLevel = minLevel;
    if (requiredRole) requirements.requiredRole = requiredRole.id;

    try {
      const giveawayModule = client.getModule('giveaways');
      await giveawayModule.createGiveaway(channel, {
        prize,
        winners,
        duration,
        hostId: interaction.user.id,
        requirements
      });

      await interaction.reply({
        content: `✅ Giveaway started in ${channel}!`,
        flags: MessageFlags.Ephemeral
      });
    } catch (error) {
      client.logger.error('GiveawayStart', 'Failed to create giveaway:', error);
      await interaction.reply({
        content: '❌ Failed to create giveaway. Please try again.',
        flags: MessageFlags.Ephemeral
      });
    }
  }
};
