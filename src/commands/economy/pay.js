// Pay command
// Created by ImVylo

import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { Colors, Emojis } from '../../utils/constants.js';
import { errorEmbed, successEmbed } from '../../utils/embeds.js';

export default {
  name: 'pay',
  description: 'Pay another user',
  aliases: ['give', 'transfer'],
  cooldown: 5,
  guildOnly: true,

  data: new SlashCommandBuilder()
    .setName('pay')
    .setDescription('Pay another user')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to pay')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('amount')
        .setDescription('Amount to pay')
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interaction, client) {
    const isSlash = interaction.isChatInputCommand?.();
    const guild = interaction.guild;
    const userId = isSlash ? interaction.user.id : interaction.author.id;

    let targetUser, amount;
    if (isSlash) {
      targetUser = interaction.options.getUser('user');
      amount = interaction.options.getInteger('amount');
    } else {
      const args = interaction.content.split(' ').slice(1);
      const targetId = args[0]?.replace(/[<@!>]/g, '');
      targetUser = await client.users.fetch(targetId).catch(() => null);
      amount = parseInt(args[1]);
    }

    if (!targetUser) {
      return isSlash
        ? interaction.reply({ embeds: [errorEmbed('Please specify a valid user.')], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [errorEmbed('Please specify a valid user.')] });
    }

    if (targetUser.id === userId) {
      return isSlash
        ? interaction.reply({ embeds: [errorEmbed('You cannot pay yourself.')], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [errorEmbed('You cannot pay yourself.')] });
    }

    if (targetUser.bot) {
      return isSlash
        ? interaction.reply({ embeds: [errorEmbed('You cannot pay bots.')], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [errorEmbed('You cannot pay bots.')] });
    }

    if (!amount || amount < 1) {
      return isSlash
        ? interaction.reply({ embeds: [errorEmbed('Please specify a valid amount.')], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [errorEmbed('Please specify a valid amount.')] });
    }

    const economyModule = client.getModule('economy');
    const symbol = economyModule?.getCurrencySymbol(guild.id) || '💰';

    const result = await economyModule.transfer(userId, targetUser.id, guild.id, amount);

    if (!result.success) {
      return isSlash
        ? interaction.reply({ embeds: [errorEmbed('You don\'t have enough coins in your wallet.')], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [errorEmbed('You don\'t have enough coins in your wallet.')] });
    }

    const embed = new EmbedBuilder()
      .setColor(Colors.ECONOMY)
      .setDescription(`${Emojis.SUCCESS} You sent ${symbol} **${amount.toLocaleString()}** to ${targetUser}!`);

    if (isSlash) {
      await interaction.reply({ embeds: [embed] });
    } else {
      await interaction.reply({ embeds: [embed] });
    }
  }
};
