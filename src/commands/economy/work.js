// Work command
// Created by ImVylo

import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { Colors, Emojis } from '../../utils/constants.js';
import { formatDuration } from '../../utils/time.js';

export default {
  name: 'work',
  description: 'Work to earn some coins',
  aliases: ['job'],
  cooldown: 5,
  guildOnly: true,

  data: new SlashCommandBuilder()
    .setName('work')
    .setDescription('Work to earn some coins'),

  async execute(interaction, client) {
    const isSlash = interaction.isChatInputCommand?.();
    const guild = interaction.guild;
    const userId = isSlash ? interaction.user.id : interaction.author.id;

    const economyModule = client.getModule('economy');
    const symbol = economyModule?.getCurrencySymbol(guild.id) || '💰';

    const result = await economyModule.claimWork(userId, guild.id);

    if (!result.success) {
      const timeLeft = formatDuration(result.timeRemaining, true);
      const embed = new EmbedBuilder()
        .setColor(Colors.ERROR)
        .setDescription(`${Emojis.ERROR} You're too tired to work right now!\n\nTry again in **${timeLeft}**`);

      return isSlash
        ? interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [embed] });
    }

    const embed = new EmbedBuilder()
      .setColor(Colors.ECONOMY)
      .setTitle(`${Emojis.SUCCESS} Work Complete!`)
      .setDescription(`You ${result.job} and earned ${symbol} **${result.amount.toLocaleString()}**!`);

    if (isSlash) {
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    } else {
      await interaction.reply({ embeds: [embed] });
    }
  }
};
