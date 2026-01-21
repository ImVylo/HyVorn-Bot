// Rank command
// Created by ImVylo

import { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, MessageFlags } from 'discord.js';
import { Colors, BOT_COLOR } from '../../utils/constants.js';

export default {
  name: 'rank',
  description: 'View your or another user\'s rank',
  aliases: ['level', 'xp'],
  cooldown: 5,
  guildOnly: true,

  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('View your or another user\'s rank')
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

    const levelingModule = client.getModule('leveling');
    const settings = client.db.getGuild(guild.id).settings;
    const xpSettings = settings.xp || {};

    // Get user data
    const userData = client.db.getUser(targetUser.id, guild.id);
    const rank = levelingModule.getUserRank(targetUser.id, guild.id);

    // Calculate XP for current and next level
    const currentLevelXP = levelingModule.getXPForLevel(userData.level, xpSettings);
    const nextLevelXP = levelingModule.getXPForLevel(userData.level + 1, xpSettings);
    const xpProgress = userData.xp - currentLevelXP;
    const xpNeeded = nextLevelXP - currentLevelXP;
    const progressPercent = Math.floor((xpProgress / xpNeeded) * 100);

    // Create progress bar
    const progressBar = levelingModule.getProgressBar(xpProgress, xpNeeded, 20);

    const embed = new EmbedBuilder()
      .setColor(BOT_COLOR)
      .setAuthor({
        name: targetUser.tag,
        iconURL: targetUser.displayAvatarURL({ dynamic: true })
      })
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: 'Rank', value: `#${rank || '???'}`, inline: true },
        { name: 'Level', value: `${userData.level}`, inline: true },
        { name: 'Total XP', value: userData.xp.toLocaleString(), inline: true },
        {
          name: `Progress (${progressPercent}%)`,
          value: `\`${progressBar}\`\n${xpProgress.toLocaleString()} / ${xpNeeded.toLocaleString()} XP`,
          inline: false
        }
      )
      .setFooter({ text: `${xpNeeded - xpProgress} XP to level ${userData.level + 1}` });

    if (isSlash) {
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    } else {
      await interaction.reply({ embeds: [embed] });
    }
  }
};
