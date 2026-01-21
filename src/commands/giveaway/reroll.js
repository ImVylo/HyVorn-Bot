// Giveaway reroll command
// Created by ImVylo

import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { PermissionLevels } from '../../utils/constants.js';

export default {
  name: 'giveaway-reroll',
  description: 'Reroll a giveaway to select new winners',
  permissionLevel: PermissionLevels.MODERATOR,
  guildOnly: true,

  data: new SlashCommandBuilder()
    .setName('giveaway-reroll')
    .setDescription('Reroll a giveaway to select new winners')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(option =>
      option
        .setName('message_id')
        .setDescription('The message ID of the giveaway')
        .setRequired(true)
    ),

  async execute(interaction, client) {
    const messageId = interaction.options.getString('message_id');

    try {
      const giveawayModule = client.getModule('giveaways');
      const giveaway = client.db.getGiveawayByMessageId(messageId);

      if (!giveaway) {
        return interaction.reply({
          content: '❌ Could not find a giveaway with that message ID!',
          flags: MessageFlags.Ephemeral
        });
      }

      if (giveaway.guild_id !== interaction.guild.id) {
        return interaction.reply({
          content: '❌ That giveaway is not in this server!',
          flags: MessageFlags.Ephemeral
        });
      }

      if (giveaway.ended === 0) {
        return interaction.reply({
          content: '❌ That giveaway has not ended yet!',
          flags: MessageFlags.Ephemeral
        });
      }

      await giveawayModule.rerollGiveaway(giveaway);

      await interaction.reply({
        content: '✅ Giveaway rerolled! New winners have been selected.',
        flags: MessageFlags.Ephemeral
      });
    } catch (error) {
      client.logger.error('GiveawayReroll', 'Failed to reroll giveaway:', error);
      await interaction.reply({
        content: '❌ Failed to reroll giveaway. Please try again.',
        flags: MessageFlags.Ephemeral
      });
    }
  }
};
