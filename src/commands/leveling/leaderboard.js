// Leaderboard command
// Created by ImVylo

import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { BOT_COLOR, Emojis } from '../../utils/constants.js';
import { paginate, createPages } from '../../utils/pagination.js';

export default {
  name: 'leaderboard',
  description: 'View the server XP leaderboard',
  aliases: ['lb', 'top'],
  cooldown: 10,
  guildOnly: true,

  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View the server XP leaderboard')
    .addStringOption(option =>
      option
        .setName('type')
        .setDescription('Leaderboard type')
        .setRequired(false)
        .addChoices(
          { name: 'XP/Levels', value: 'xp' },
          { name: 'Economy', value: 'economy' }
        )
    ),

  async execute(interaction, client) {
    const isSlash = interaction.isChatInputCommand?.();
    const guild = interaction.guild;

    let type;
    if (isSlash) {
      type = interaction.options.getString('type') || 'xp';
    } else {
      const args = interaction.content.split(' ').slice(1);
      type = args[0]?.toLowerCase() === 'economy' ? 'economy' : 'xp';
    }

    const userId = isSlash ? interaction.user.id : interaction.author.id;

    if (type === 'xp') {
      const leaderboard = client.db.getLeaderboard(guild.id, 100);

      if (leaderboard.length === 0) {
        const embed = new EmbedBuilder()
          .setColor(BOT_COLOR)
          .setDescription('No XP data yet. Start chatting to earn XP!');

        return isSlash
          ? interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
          : interaction.reply({ embeds: [embed] });
      }

      const pages = createPages(leaderboard, 10, (pageUsers, page, total, startIndex) => {
        const description = pageUsers.map((user, i) => {
          const position = startIndex + i + 1;
          const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `**${position}.**`;
          const isCurrentUser = user.user_id === userId ? ' ← You' : '';
          return `${medal} <@${user.user_id}> - Level ${user.level} (${user.xp.toLocaleString()} XP)${isCurrentUser}`;
        }).join('\n');

        return new EmbedBuilder()
          .setColor(BOT_COLOR)
          .setTitle(`${Emojis.TROPHY} XP Leaderboard`)
          .setDescription(description)
          .setThumbnail(guild.iconURL({ dynamic: true }));
      });

      return paginate(interaction, pages, { flags: MessageFlags.Ephemeral });
    } else {
      const leaderboard = client.db.getEconomyLeaderboard(guild.id, 100);

      if (leaderboard.length === 0) {
        const embed = new EmbedBuilder()
          .setColor(BOT_COLOR)
          .setDescription('No economy data yet. Start earning coins!');

        return isSlash
          ? interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
          : interaction.reply({ embeds: [embed] });
      }

      const economyModule = client.getModule('economy');
      const symbol = economyModule?.getCurrencySymbol(guild.id) || '💰';

      const pages = createPages(leaderboard, 10, (pageUsers, page, total, startIndex) => {
        const description = pageUsers.map((user, i) => {
          const position = startIndex + i + 1;
          const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `**${position}.**`;
          const isCurrentUser = user.user_id === userId ? ' ← You' : '';
          return `${medal} <@${user.user_id}> - ${symbol} ${user.total.toLocaleString()}${isCurrentUser}`;
        }).join('\n');

        return new EmbedBuilder()
          .setColor(BOT_COLOR)
          .setTitle(`${Emojis.MONEY} Economy Leaderboard`)
          .setDescription(description)
          .setThumbnail(guild.iconURL({ dynamic: true }));
      });

      return paginate(interaction, pages, { flags: MessageFlags.Ephemeral });
    }
  }
};
