// Coinflip command
// Created by ImVylo

import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { BOT_COLOR } from '../../utils/constants.js';
import { errorEmbed } from '../../utils/embeds.js';

export default {
  name: 'coinflip',
  description: 'Flip a coin',
  aliases: ['flip', 'coin'],
  cooldown: 3,

  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Flip a coin'),

  async execute(interaction, client) {
    const isSlash = interaction.isChatInputCommand?.();

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

    const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
    const emoji = result === 'Heads' ? '🪙' : '🔵';

    const embed = new EmbedBuilder()
      .setColor(BOT_COLOR)
      .setTitle(`${emoji} Coin Flip`)
      .setDescription(`The coin landed on **${result}**!`);

    if (isSlash) {
      await interaction.reply({ embeds: [embed] });
    } else {
      await interaction.reply({ embeds: [embed] });
    }
  }
};
