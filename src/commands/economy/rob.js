// Rob command - Attempt to steal coins from another user
// Created by ImVylo

import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { Colors } from '../../utils/constants.js';
import { errorEmbed } from '../../utils/embeds.js';

export default {
  name: 'rob',
  description: 'Attempt to steal coins from another user',
  aliases: ['steal'],
  cooldown: 60,
  guildOnly: true,

  data: new SlashCommandBuilder()
    .setName('rob')
    .setDescription('Attempt to steal coins from another user')
    .addUserOption(opt =>
      opt.setName('target').setDescription('User to rob').setRequired(true)
    ),

  async execute(interaction, client) {
    const isSlash = interaction.isChatInputCommand?.();
    const guild = interaction.guild;
    const user = isSlash ? interaction.user : interaction.author;

    const economyModule = client.getModule('economy');
    const symbol = economyModule?.getCurrencySymbol(guild.id) || '💰';

    let target;
    if (isSlash) {
      target = interaction.options.getUser('target');
    } else {
      const args = interaction.content.split(' ').slice(1);
      const targetMention = args[0];
      if (targetMention) {
        const targetId = targetMention.replace(/[<@!>]/g, '');
        target = await client.users.fetch(targetId).catch(() => null);
      }
    }

    if (!target) {
      return isSlash
        ? interaction.reply({ embeds: [errorEmbed('Please specify a user to rob!')], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [errorEmbed('Please specify a user to rob!')] });
    }

    if (target.bot) {
      return isSlash
        ? interaction.reply({ embeds: [errorEmbed('You can\'t rob bots!')], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [errorEmbed('You can\'t rob bots!')] });
    }

    if (target.id === user.id) {
      return isSlash
        ? interaction.reply({ embeds: [errorEmbed('You can\'t rob yourself!')], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [errorEmbed('You can\'t rob yourself!')] });
    }

    const userData = client.db.getBalance(user.id, guild.id);
    const targetData = client.db.getBalance(target.id, guild.id);

    const userWallet = userData.balance;
    const targetWallet = targetData.balance;

    // Need at least 500 coins to rob
    if (userWallet < 500) {
      return isSlash
        ? interaction.reply({ embeds: [errorEmbed(`You need at least ${symbol} **500** in your wallet to attempt a robbery!`)], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [errorEmbed(`You need at least ${symbol} **500** in your wallet to attempt a robbery!`)] });
    }

    // Target needs at least 100 coins
    if (targetWallet < 100) {
      return isSlash
        ? interaction.reply({ embeds: [errorEmbed(`${target.username} doesn't have enough coins to rob! They need at least ${symbol} **100**.`)], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [errorEmbed(`${target.username} doesn't have enough coins to rob!`)] });
    }

    // 45% success rate
    const success = Math.random() < 0.45;

    let embed;

    if (success) {
      // Steal 10-40% of target's wallet
      const stealPercent = 0.1 + Math.random() * 0.3;
      const stealAmount = Math.floor(targetWallet * stealPercent);

      client.db.removeBalance(target.id, guild.id, stealAmount);
      client.db.addBalance(user.id, guild.id, stealAmount);

      const messages = [
        `You snuck up behind ${target} and snatched ${symbol} **${stealAmount.toLocaleString()}** from their pocket!`,
        `Smooth criminal! You robbed ${target} for ${symbol} **${stealAmount.toLocaleString()}**!`,
        `${target} wasn't paying attention and you yoinked ${symbol} **${stealAmount.toLocaleString()}**!`,
        `Under the cover of darkness, you stole ${symbol} **${stealAmount.toLocaleString()}** from ${target}!`
      ];

      embed = new EmbedBuilder()
        .setColor(Colors.SUCCESS)
        .setTitle('🔫 Robbery Successful!')
        .setDescription(messages[Math.floor(Math.random() * messages.length)])
        .setFooter({ text: '💰 Crime pays... sometimes' })
        .setTimestamp();
    } else {
      // Fail - lose 10-25% of your wallet as a fine
      const finePercent = 0.1 + Math.random() * 0.15;
      const fineAmount = Math.floor(userWallet * finePercent);

      client.db.removeBalance(user.id, guild.id, fineAmount);

      const messages = [
        `You got caught trying to rob ${target}! You paid ${symbol} **${fineAmount.toLocaleString()}** in fines.`,
        `${target} caught you red-handed! The police fined you ${symbol} **${fineAmount.toLocaleString()}**.`,
        `BUSTED! Your robbery attempt failed and you lost ${symbol} **${fineAmount.toLocaleString()}**!`,
        `${target}'s guard dog bit you! Hospital bill: ${symbol} **${fineAmount.toLocaleString()}**`
      ];

      embed = new EmbedBuilder()
        .setColor(Colors.ERROR)
        .setTitle('🚔 Robbery Failed!')
        .setDescription(messages[Math.floor(Math.random() * messages.length)])
        .setFooter({ text: 'Crime doesn\'t always pay...' })
        .setTimestamp();
    }

    if (isSlash) {
      await interaction.reply({ embeds: [embed] });
    } else {
      await interaction.reply({ embeds: [embed] });
    }
  }
};
