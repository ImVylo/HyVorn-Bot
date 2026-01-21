// Withdraw command - Withdraw coins from bank
// Created by ImVylo

import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { Colors } from '../../utils/constants.js';
import { errorEmbed } from '../../utils/embeds.js';

export default {
  name: 'withdraw',
  description: 'Withdraw coins from your bank to your wallet',
  aliases: ['with'],
  cooldown: 3,
  guildOnly: true,

  data: new SlashCommandBuilder()
    .setName('withdraw')
    .setDescription('Withdraw coins from your bank to your wallet')
    .addStringOption(opt =>
      opt.setName('amount').setDescription('Amount to withdraw (number or "all")').setRequired(true)
    ),

  async execute(interaction, client) {
    const isSlash = interaction.isChatInputCommand?.();
    const guild = interaction.guild;
    const user = isSlash ? interaction.user : interaction.author;

    const economyModule = client.getModule('economy');
    const symbol = economyModule?.getCurrencySymbol(guild.id) || '💰';

    let amountStr;
    if (isSlash) {
      amountStr = interaction.options.getString('amount');
    } else {
      const args = interaction.content.split(' ').slice(1);
      amountStr = args[0];
    }

    if (!amountStr) {
      return isSlash
        ? interaction.reply({ embeds: [errorEmbed('Please specify an amount to withdraw!')], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [errorEmbed('Please specify an amount to withdraw!')] });
    }

    const userData = client.db.getBalance(user.id, guild.id);
    const wallet = userData.balance;
    const bank = userData.bank || 0;

    let amount;
    if (amountStr.toLowerCase() === 'all' || amountStr.toLowerCase() === 'max') {
      amount = bank;
    } else {
      amount = parseInt(amountStr);
    }

    if (isNaN(amount) || amount <= 0) {
      return isSlash
        ? interaction.reply({ embeds: [errorEmbed('Please enter a valid amount!')], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [errorEmbed('Please enter a valid amount!')] });
    }

    if (amount > bank) {
      return isSlash
        ? interaction.reply({ embeds: [errorEmbed(`You only have ${symbol} **${bank.toLocaleString()}** in your bank!`)], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [errorEmbed(`You only have ${symbol} **${bank.toLocaleString()}** in your bank!`)] });
    }

    // Transfer from bank to wallet
    client.db.removeBank(user.id, guild.id, amount);
    client.db.addBalance(user.id, guild.id, amount);

    const newWallet = wallet + amount;
    const newBank = bank - amount;

    const embed = new EmbedBuilder()
      .setColor(Colors.SUCCESS)
      .setTitle('💳 Bank Withdrawal')
      .setDescription(`Successfully withdrew ${symbol} **${amount.toLocaleString()}** from your bank!`)
      .addFields(
        { name: 'Wallet', value: `${symbol} ${newWallet.toLocaleString()}`, inline: true },
        { name: 'Bank', value: `${symbol} ${newBank.toLocaleString()}`, inline: true }
      )
      .setFooter({ text: `Requested by ${user.username}` })
      .setTimestamp();

    if (isSlash) {
      await interaction.reply({ embeds: [embed] });
    } else {
      await interaction.reply({ embeds: [embed] });
    }
  }
};
