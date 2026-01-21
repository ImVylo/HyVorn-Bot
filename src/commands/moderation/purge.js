// Purge command - Bulk delete messages
// Created by ImVylo

import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { PermissionLevels } from '../../utils/constants.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';

export default {
  name: 'purge',
  description: 'Bulk delete messages',
  aliases: ['clear', 'prune'],
  cooldown: 5,
  guildOnly: true,
  permissionLevel: PermissionLevels.MODERATOR,
  botPermissions: [PermissionFlagsBits.ManageMessages],

  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Bulk delete messages')
    .addIntegerOption(option =>
      option
        .setName('amount')
        .setDescription('Number of messages to delete (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Only delete messages from this user')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('contains')
        .setDescription('Only delete messages containing this text')
        .setRequired(false)
    )
    .addBooleanOption(option =>
      option
        .setName('bots')
        .setDescription('Only delete bot messages')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction, client) {
    const isSlash = interaction.isChatInputCommand?.();
    const channel = interaction.channel;

    let amount, targetUser, contains, botsOnly;
    if (isSlash) {
      amount = interaction.options.getInteger('amount');
      targetUser = interaction.options.getUser('user');
      contains = interaction.options.getString('contains');
      botsOnly = interaction.options.getBoolean('bots');
    } else {
      const args = interaction.content.split(' ').slice(1);
      amount = parseInt(args[0]);

      if (isNaN(amount) || amount < 1 || amount > 100) {
        const embed = errorEmbed('Please provide a valid number between 1 and 100.');
        return interaction.reply({ embeds: [embed] });
      }

      // Check if second arg is a user mention
      if (args[1]) {
        const userId = args[1].replace(/[<@!>]/g, '');
        targetUser = await client.users.fetch(userId).catch(() => null);
      }
    }

    try {
      // Defer reply for slash commands
      if (isSlash) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      }

      // Fetch messages
      let messages = await channel.messages.fetch({ limit: Math.min(amount + 1, 100) });

      // Filter out the command message for prefix commands
      if (!isSlash) {
        messages = messages.filter(m => m.id !== interaction.id);
      }

      // Apply filters
      if (targetUser) {
        messages = messages.filter(m => m.author.id === targetUser.id);
      }

      if (contains) {
        messages = messages.filter(m =>
          m.content.toLowerCase().includes(contains.toLowerCase())
        );
      }

      if (botsOnly) {
        messages = messages.filter(m => m.author.bot);
      }

      // Filter out messages older than 14 days (Discord limitation)
      const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
      messages = messages.filter(m => m.createdTimestamp > twoWeeksAgo);

      // Limit to requested amount
      const toDelete = [...messages.values()].slice(0, amount);

      if (toDelete.length === 0) {
        const embed = errorEmbed('No messages found matching the criteria (messages must be less than 14 days old).');
        return isSlash
          ? interaction.editReply({ embeds: [embed] })
          : interaction.reply({ embeds: [embed] });
      }

      // Delete messages
      const deleted = await channel.bulkDelete(toDelete, true);

      // Log to log channel
      const loggingModule = client.getModule('logging');
      if (loggingModule) {
        await loggingModule.logBulkDelete(
          channel,
          deleted.size,
          isSlash ? interaction.user : interaction.author
        );
      }

      const embed = successEmbed(`Successfully deleted **${deleted.size}** messages.`);

      if (isSlash) {
        await interaction.editReply({ embeds: [embed] });
      } else {
        const reply = await interaction.reply({ embeds: [embed] });
        // Auto-delete success message after 5 seconds
        setTimeout(() => reply.delete().catch(() => {}), 5000);
      }
    } catch (error) {
      client.logger.error('Purge', 'Error purging messages:', error);
      const embed = errorEmbed(`Failed to delete messages: ${error.message}`);

      return isSlash
        ? interaction.editReply({ embeds: [embed] })
        : interaction.reply({ embeds: [embed] });
    }
  }
};
