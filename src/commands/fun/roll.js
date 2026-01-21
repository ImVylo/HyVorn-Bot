// Roll command - Roll dice
// Created by ImVylo

import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { Colors } from '../../utils/constants.js';
import { errorEmbed } from '../../utils/embeds.js';

export default {
  name: 'roll',
  description: 'Roll dice',
  aliases: ['dice', 'r'],
  cooldown: 3,
  guildOnly: false,

  data: new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Roll dice')
    .addStringOption(opt =>
      opt.setName('dice').setDescription('Dice to roll (e.g., 2d6, d20, 4d8+5)')
    ),

  async execute(interaction, client) {
    const isSlash = interaction.isChatInputCommand?.();
    const user = isSlash ? interaction.user : interaction.author;

    // Check if fun commands are restricted to a specific channel
    if (interaction.guild) {
      const settings = client.db.getGuild(interaction.guild.id).settings;
      if (settings.funChannel && interaction.channel.id !== settings.funChannel) {
        return interaction.reply({
          embeds: [errorEmbed(`Fun commands can only be used in <#${settings.funChannel}>!`)],
          flags: MessageFlags.Ephemeral
        });
      }
    }

    let diceStr;
    if (isSlash) {
      diceStr = interaction.options.getString('dice') || 'd20';
    } else {
      const args = interaction.content.split(' ').slice(1);
      diceStr = args[0] || 'd20';
    }

    // Parse dice notation (e.g., 2d6, d20, 4d8+5)
    const match = diceStr.match(/^(\d*)d(\d+)([+-]\d+)?$/i);

    if (!match) {
      const embed = new EmbedBuilder()
        .setColor(Colors.ERROR)
        .setDescription('Invalid dice format! Use format like: `d20`, `2d6`, `4d8+5`');
      return isSlash
        ? interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [embed] });
    }

    const numDice = parseInt(match[1]) || 1;
    const sides = parseInt(match[2]);
    const modifier = parseInt(match[3]) || 0;

    if (numDice < 1 || numDice > 100) {
      const embed = new EmbedBuilder()
        .setColor(Colors.ERROR)
        .setDescription('You can roll between 1 and 100 dice.');
      return isSlash
        ? interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [embed] });
    }

    if (sides < 2 || sides > 1000) {
      const embed = new EmbedBuilder()
        .setColor(Colors.ERROR)
        .setDescription('Dice can have between 2 and 1000 sides.');
      return isSlash
        ? interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [embed] });
    }

    // Roll the dice
    const rolls = [];
    for (let i = 0; i < numDice; i++) {
      rolls.push(Math.floor(Math.random() * sides) + 1);
    }

    const sum = rolls.reduce((a, b) => a + b, 0);
    const total = sum + modifier;

    // Check for special rolls
    let specialText = '';
    if (numDice === 1 && rolls[0] === sides) {
      specialText = '\n🎉 **CRITICAL!**';
    } else if (numDice === 1 && rolls[0] === 1) {
      specialText = '\n💀 **CRITICAL FAIL!**';
    }

    // Build response
    let rollText = rolls.join(' + ');
    if (modifier !== 0) {
      rollText += ` ${modifier >= 0 ? '+' : ''}${modifier}`;
    }

    const embed = new EmbedBuilder()
      .setColor(Colors.PRIMARY)
      .setTitle('🎲 Dice Roll')
      .setDescription(`**${user.username}** rolled **${numDice}d${sides}${modifier !== 0 ? (modifier >= 0 ? `+${modifier}` : modifier) : ''}**`)
      .addFields(
        { name: 'Rolls', value: rolls.length <= 20 ? `[ ${rolls.join(', ')} ]` : `${rolls.length} dice rolled`, inline: true },
        { name: 'Total', value: `**${total}**${specialText}`, inline: true }
      )
      .setTimestamp();

    if (isSlash) {
      await interaction.reply({ embeds: [embed] });
    } else {
      await interaction.reply({ embeds: [embed] });
    }
  }
};
