// AFK command - Set AFK status
// Created by ImVylo

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Colors, Emojis } from '../../utils/constants.js';
import { successEmbed } from '../../utils/embeds.js';

// Store AFK users (in memory, resets on bot restart)
const afkUsers = new Map();

export default {
  name: 'afk',
  description: 'Set your AFK status',
  aliases: [],
  cooldown: 5,
  guildOnly: true,

  // Export AFK storage for use in events
  afkUsers,

  data: new SlashCommandBuilder()
    .setName('afk')
    .setDescription('Set your AFK status')
    .addStringOption(opt =>
      opt.setName('reason').setDescription('Reason for being AFK')
    ),

  async execute(interaction, client) {
    const isSlash = interaction.isChatInputCommand?.();
    const guild = interaction.guild;
    const user = isSlash ? interaction.user : interaction.author;
    const userId = user.id;
    const guildId = guild.id;

    let reason;
    if (isSlash) {
      reason = interaction.options.getString('reason') || 'AFK';
    } else {
      const args = interaction.content.split(' ').slice(1);
      reason = args.join(' ') || 'AFK';
    }

    // Set AFK status
    const key = `${guildId}-${userId}`;
    afkUsers.set(key, {
      reason: reason,
      timestamp: Date.now(),
      userId: userId,
      guildId: guildId
    });

    const embed = new EmbedBuilder()
      .setColor(Colors.PRIMARY)
      .setDescription(`${Emojis.SUCCESS} **${user.username}** is now AFK: ${reason}`)
      .setTimestamp();

    // Try to add [AFK] to nickname
    try {
      const member = await guild.members.fetch(userId);
      const currentNick = member.displayName;
      if (!currentNick.startsWith('[AFK]')) {
        const newNick = `[AFK] ${currentNick}`.slice(0, 32);
        await member.setNickname(newNick).catch(() => {});
      }
    } catch (e) {
      // Can't modify nickname, ignore
    }

    if (isSlash) {
      await interaction.reply({ embeds: [embed] });
    } else {
      await interaction.reply({ embeds: [embed] });
    }
  },

  // Helper to check and remove AFK
  checkAFK(guildId, userId) {
    const key = `${guildId}-${userId}`;
    return afkUsers.get(key);
  },

  removeAFK(guildId, userId) {
    const key = `${guildId}-${userId}`;
    return afkUsers.delete(key);
  },

  getAllAFK() {
    return afkUsers;
  }
};
