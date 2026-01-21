// Balance command
// Created by ImVylo

import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { Colors, Emojis } from '../../utils/constants.js';

export default {
  name: 'balance',
  description: 'Check your or another user\'s balance',
  aliases: ['bal', 'money', 'coins'],
  cooldown: 5,
  guildOnly: true,

  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check your or another user\'s balance')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to check')
        .setRequired(false)
    ),

  async execute(interaction, client) {
    const isSlash = interaction.isChatInputCommand?.();
    const guild = interaction.guild;

    let targetUser;
    if (isSlash) {
      targetUser = interaction.options.getUser('user') || interaction.user;
    } else {
      const args = interaction.content.split(' ').slice(1);
      const userId = args[0]?.replace(/[<@!>]/g, '');
      targetUser = userId
        ? await client.users.fetch(userId).catch(() => null) || interaction.author
        : interaction.author;
    }

    const economyModule = client.getModule('economy');
    const symbol = economyModule?.getCurrencySymbol(guild.id) || '💰';
    const currencyName = economyModule?.getCurrencyName(guild.id) || 'coins';

    const { balance, bank } = client.db.getBalance(targetUser.id, guild.id);
    const total = balance + bank;

    const embed = new EmbedBuilder()
      .setColor(Colors.ECONOMY)
      .setAuthor({
        name: `${targetUser.username}'s Balance`,
        iconURL: targetUser.displayAvatarURL({ dynamic: true })
      })
      .addFields(
        { name: `${Emojis.MONEY} Wallet`, value: `${symbol} ${balance.toLocaleString()}`, inline: true },
        { name: '🏦 Bank', value: `${symbol} ${bank.toLocaleString()}`, inline: true },
        { name: '💎 Total', value: `${symbol} ${total.toLocaleString()}`, inline: true }
      );

    if (isSlash) {
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    } else {
      await interaction.reply({ embeds: [embed] });
    }
  }
};
