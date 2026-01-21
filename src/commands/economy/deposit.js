// Deposit command - Deposit coins to bank
// Created by ImVylo

import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { Colors } from '../../utils/constants.js';
import { errorEmbed, successEmbed } from '../../utils/embeds.js';

export default {
  name: 'deposit',
  description: 'Deposit coins from your wallet to your bank',
  aliases: ['dep'],
  cooldown: 3,
  guildOnly: true,

  data: new SlashCommandBuilder()
    .setName('deposit')
    .setDescription('Deposit coins from your wallet to your bank')
    .addStringOption(opt =>
      opt.setName('amount').setDescription('Amount to deposit (number or "all")').setRequired(true)
    ),

  async execute(interaction, client) {
    const isSlash = interaction.isChatInputCommand?.();
    const guild = interaction.guild;
    const user = isSlash ? interaction.user : interaction.author;

    const economyModule = client.getModule('economy');
    const symbol = economyModule?.getCurrencySymbol(guild.id) || '💰';
    const bankLimit = economyModule?.getBankLimit(guild.id) || 100000;

    let amountStr;
    if (isSlash) {
      amountStr = interaction.options.getString('amount');
    } else {
      const args = interaction.content.split(' ').slice(1);
      amountStr = args[0];
    }

    if (!amountStr) {
      return isSlash
        ? interaction.reply({ embeds: [errorEmbed('Please specify an amount to deposit!')], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [errorEmbed('Please specify an amount to deposit!')] });
    }

    const userData = client.db.getBalance(user.id, guild.id);
    const wallet = userData.balance;
    const bank = userData.bank || 0;

    let amount;
    if (amountStr.toLowerCase() === 'all' || amountStr.toLowerCase() === 'max') {
      amount = Math.min(wallet, bankLimit - bank);
    } else {
      amount = parseInt(amountStr);
    }

    if (isNaN(amount) || amount <= 0) {
      return isSlash
        ? interaction.reply({ embeds: [errorEmbed('Please enter a valid amount!')], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [errorEmbed('Please enter a valid amount!')] });
    }

    if (amount > wallet) {
      return isSlash
        ? interaction.reply({ embeds: [errorEmbed(`You only have ${symbol} **${wallet.toLocaleString()}** in your wallet!`)], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [errorEmbed(`You only have ${symbol} **${wallet.toLocaleString()}** in your wallet!`)] });
    }

    if (bank + amount > bankLimit) {
      const canDeposit = bankLimit - bank;
      if (canDeposit <= 0) {
        return isSlash
          ? interaction.reply({ embeds: [errorEmbed(`Your bank is full! Maximum capacity: ${symbol} **${bankLimit.toLocaleString()}**`)], flags: MessageFlags.Ephemeral })
          : interaction.reply({ embeds: [errorEmbed(`Your bank is full! Maximum capacity: ${symbol} **${bankLimit.toLocaleString()}**`)] });
      }
      amount = canDeposit;
    }

    // Transfer from wallet to bank
    client.db.removeBalance(user.id, guild.id, amount);
    client.db.addBank(user.id, guild.id, amount);

    const newWallet = wallet - amount;
    const newBank = bank + amount;

    const embed = new EmbedBuilder()
      .setColor(Colors.SUCCESS)
      .setTitle('💳 Bank Deposit')
      .setDescription(`Successfully deposited ${symbol} **${amount.toLocaleString()}** into your bank!`)
      .addFields(
        { name: 'Wallet', value: `${symbol} ${newWallet.toLocaleString()}`, inline: true },
        { name: 'Bank', value: `${symbol} ${newBank.toLocaleString()} / ${bankLimit.toLocaleString()}`, inline: true }
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
