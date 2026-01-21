// Giveaway list command
// Created by ImVylo

import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { Colors, Emojis } from '../../utils/constants.js';
import { discordTimestamp } from '../../utils/time.js';

export default {
  name: 'giveaway-list',
  description: 'List all active giveaways',
  guildOnly: true,

  data: new SlashCommandBuilder()
    .setName('giveaway-list')
    .setDescription('List all active giveaways in this server'),

  async execute(interaction, client) {
    try {
      const giveaways = client.db.getActiveGiveaways(interaction.guild.id);

      if (!giveaways || giveaways.length === 0) {
        return interaction.reply({
          content: '📭 There are no active giveaways in this server!',
          flags: MessageFlags.Ephemeral
        });
      }

      const embed = new EmbedBuilder()
        .setColor(Colors.PRIMARY)
        .setTitle('🎉 Active Giveaways')
        .setDescription(`Found ${giveaways.length} active giveaway(s)`)
        .setTimestamp();

      for (const giveaway of giveaways.slice(0, 10)) {
        const endsAt = new Date(giveaway.ends_at);
        const channel = await client.channels.fetch(giveaway.channel_id).catch(() => null);
        
        embed.addFields({
          name: `${Emojis.STAR} ${giveaway.prize}`,
          value: `**Winners:** ${giveaway.winner_count}\n**Ends:** ${discordTimestamp(endsAt, 'R')}\n**Channel:** ${channel || 'Unknown'}\n**Message ID:** \`${giveaway.message_id}\``,
          inline: false
        });
      }

      if (giveaways.length > 10) {
        embed.setFooter({ text: `Showing 10 of ${giveaways.length} giveaways` });
      }

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      client.logger.error('GiveawayList', 'Failed to list giveaways:', error);
      await interaction.reply({
        content: '❌ Failed to list giveaways. Please try again.',
        flags: MessageFlags.Ephemeral
      });
    }
  }
};
