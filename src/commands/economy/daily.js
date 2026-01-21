// Daily command
// Created by ImVylo

import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { Colors, Emojis } from '../../utils/constants.js';
import { formatDuration } from '../../utils/time.js';

export default {
  name: 'daily',
  description: 'Claim your daily reward',
  aliases: [],
  cooldown: 5,
  guildOnly: true,

  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Claim your daily reward'),

  async execute(interaction, client) {
    const isSlash = interaction.isChatInputCommand?.();
    const guild = interaction.guild;
    const userId = isSlash ? interaction.user.id : interaction.author.id;

    const economyModule = client.getModule('economy');
    const symbol = economyModule?.getCurrencySymbol(guild.id) || '💰';

    const result = await economyModule.claimDaily(userId, guild.id);

    if (!result.success) {
      const timeUntil = formatDuration(result.timeUntil, true);
      const embed = new EmbedBuilder()
        .setColor(Colors.ERROR)
        .setDescription(`${Emojis.ERROR} You've already claimed your daily reward!\n\nCome back in **${timeUntil}**`);

      return isSlash
        ? interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [embed] });
    }

    const embed = new EmbedBuilder()
      .setColor(Colors.ECONOMY)
      .setTitle(`${Emojis.SUCCESS} Daily Reward Claimed!`)
      .setDescription(`You received ${symbol} **${result.amount.toLocaleString()}**!`);

    if (result.bonus > 0) {
      embed.addFields({
        name: `🔥 ${result.streak} Day Streak Bonus!`,
        value: `+${symbol} ${result.bonus.toLocaleString()}`,
        inline: true
      });
    }

    embed.addFields({
      name: 'Total',
      value: `${symbol} ${result.total.toLocaleString()}`,
      inline: true
    });

    if (isSlash) {
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    } else {
      await interaction.reply({ embeds: [embed] });
    }
  }
};
