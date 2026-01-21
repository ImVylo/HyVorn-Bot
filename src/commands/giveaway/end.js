// Giveaway end command
// Created by ImVylo

import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { PermissionLevels } from '../../utils/constants.js';

export default {
  name: 'giveaway-end',
  description: 'End a giveaway early',
  permissionLevel: PermissionLevels.MODERATOR,
  guildOnly: true,

  data: new SlashCommandBuilder()
    .setName('giveaway-end')
    .setDescription('End a giveaway early')
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
          content: '❌ Could not find an active giveaway with that message ID!',
          flags: MessageFlags.Ephemeral
        });
      }

      if (giveaway.guild_id !== interaction.guild.id) {
        return interaction.reply({
          content: '❌ That giveaway is not in this server!',
          flags: MessageFlags.Ephemeral
        });
      }

      await giveawayModule.endGiveaway(giveaway);

      await interaction.reply({
        content: '✅ Giveaway ended and winners have been selected!',
        flags: MessageFlags.Ephemeral
      });
    } catch (error) {
      client.logger.error('GiveawayEnd', 'Failed to end giveaway:', error);
      await interaction.reply({
        content: '❌ Failed to end giveaway. Please try again.',
        flags: MessageFlags.Ephemeral
      });
    }
  }
};
