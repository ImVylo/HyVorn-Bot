// User info command
// Created by ImVylo

import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { BOT_COLOR, Emojis } from '../../utils/constants.js';
import { discordTimestamp } from '../../utils/time.js';
import { formatPermissions } from '../../core/Permissions.js';

export default {
  name: 'userinfo',
  description: 'View information about a user',
  aliases: ['ui', 'whois', 'user'],
  cooldown: 5,
  guildOnly: true,

  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('View information about a user')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to get info about')
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

    const member = await guild.members.fetch(targetUser.id).catch(() => null);

    const statusEmojis = {
      online: Emojis.ONLINE,
      idle: Emojis.IDLE,
      dnd: Emojis.DND,
      offline: Emojis.OFFLINE
    };

    const embed = new EmbedBuilder()
      .setColor(member?.displayHexColor || BOT_COLOR)
      .setAuthor({
        name: targetUser.tag,
        iconURL: targetUser.displayAvatarURL({ dynamic: true })
      })
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: 'ID', value: targetUser.id, inline: true },
        { name: 'Bot', value: targetUser.bot ? 'Yes' : 'No', inline: true },
        { name: 'Created', value: discordTimestamp(targetUser.createdAt, 'R'), inline: true }
      );

    if (member) {
      const status = member.presence?.status || 'offline';
      const roles = member.roles.cache
        .filter(r => r.id !== guild.id)
        .sort((a, b) => b.position - a.position)
        .map(r => r.toString())
        .slice(0, 10);

      embed.addFields(
        {
          name: 'Status',
          value: `${statusEmojis[status]} ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          inline: true
        },
        { name: 'Nickname', value: member.nickname || 'None', inline: true },
        { name: 'Joined Server', value: discordTimestamp(member.joinedAt, 'R'), inline: true }
      );

      if (roles.length > 0) {
        const roleText = roles.join(', ') + (member.roles.cache.size > 11 ? ` +${member.roles.cache.size - 11} more` : '');
        embed.addFields({
          name: `Roles (${member.roles.cache.size - 1})`,
          value: roleText,
          inline: false
        });
      }

      // Key permissions
      const keyPerms = formatPermissions(member.permissions);
      if (keyPerms.length > 0) {
        embed.addFields({
          name: 'Key Permissions',
          value: keyPerms.join(', '),
          inline: false
        });
      }
    }

    // Add banner if available
    const fetchedUser = await targetUser.fetch().catch(() => null);
    if (fetchedUser?.banner) {
      embed.setImage(fetchedUser.bannerURL({ dynamic: true, size: 512 }));
    }

    if (isSlash) {
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    } else {
      await interaction.reply({ embeds: [embed] });
    }
  }
};
