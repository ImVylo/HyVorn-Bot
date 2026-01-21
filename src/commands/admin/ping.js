// Ping command
// Created by ImVylo

import { SlashCommandBuilder } from 'discord.js';
import { successEmbed } from '../../utils/embeds.js';

export default {
  name: 'ping',
  description: 'Check bot latency',
  aliases: ['pong', 'latency'],
  cooldown: 5,

  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot latency'),

  async execute(interaction, client) {
    const isSlash = interaction.isChatInputCommand?.();
    const sent = Date.now();

    if (isSlash) {
      await interaction.reply({
        embeds: [successEmbed('Pinging...')]
      });

      const latency = Date.now() - sent;
      const wsLatency = client.ws.ping;

      await interaction.editReply({
        embeds: [successEmbed(
          `**Roundtrip:** ${latency}ms\n**WebSocket:** ${wsLatency}ms`,
          'Pong!'
        )]
      });
    } else {
      // Prefix command
      const message = interaction;
      const reply = await message.reply({
        embeds: [successEmbed('Pinging...')]
      });

      const latency = reply.createdTimestamp - message.createdTimestamp;
      const wsLatency = client.ws.ping;

      await reply.edit({
        embeds: [successEmbed(
          `**Roundtrip:** ${latency}ms\n**WebSocket:** ${wsLatency}ms`,
          'Pong!'
        )]
      });
    }
  }
};
