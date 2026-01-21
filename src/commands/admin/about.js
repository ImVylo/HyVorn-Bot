// About command
// Created by ImVylo

import { SlashCommandBuilder, EmbedBuilder, version as djsVersion } from 'discord.js';
import { BOT_NAME, BOT_AUTHOR, BOT_VERSION, BOT_COLOR, BOT_OWNER_ID } from '../../utils/constants.js';
import { formatDuration } from '../../utils/time.js';
import os from 'os';

export default {
  name: 'about',
  description: 'View information about the bot',
  aliases: ['info', 'botinfo'],
  cooldown: 10,

  data: new SlashCommandBuilder()
    .setName('about')
    .setDescription('View information about the bot'),

  async execute(interaction, client) {
    const isSlash = interaction.isChatInputCommand?.();

    const uptime = formatDuration(client.getUptime());
    const memUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const totalMemory = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);

    const owner = await client.users.fetch(BOT_OWNER_ID).catch(() => null);

    const embed = new EmbedBuilder()
      .setColor(BOT_COLOR)
      .setTitle(BOT_NAME)
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setDescription(`A feature-rich, modular Discord bot combining the best of MEE6 and RedBot.`)
      .addFields(
        { name: '👤 Author', value: BOT_AUTHOR, inline: true },
        { name: '📌 Version', value: BOT_VERSION, inline: true },
        { name: '👑 Owner', value: owner ? owner.tag : 'Unknown', inline: true },
        { name: '⏱️ Uptime', value: uptime, inline: true },
        { name: '🏠 Servers', value: client.guilds.cache.size.toLocaleString(), inline: true },
        { name: '👥 Users', value: client.users.cache.size.toLocaleString(), inline: true },
        { name: '📝 Commands', value: client.commands.size.toString(), inline: true },
        { name: '🔌 Plugins', value: client.plugins.size.toString(), inline: true },
        { name: '📊 Commands Run', value: client.stats.commandsRun.toLocaleString(), inline: true },
        { name: '💾 Memory', value: `${memUsage} MB / ${totalMemory} GB`, inline: true },
        { name: '📦 Discord.js', value: `v${djsVersion}`, inline: true },
        { name: '🟢 Node.js', value: process.version, inline: true }
      )
      .setFooter({ text: `Made with ❤️ by ${BOT_AUTHOR}` })
      .setTimestamp();

    if (isSlash) {
      await interaction.reply({ embeds: [embed] });
    } else {
      await interaction.reply({ embeds: [embed] });
    }
  }
};
