// Avatar command - Display user avatar
// Created by ImVylo

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Colors } from '../../utils/constants.js';

export default {
  name: 'avatar',
  description: 'Display a user\'s avatar',
  aliases: ['av', 'pfp'],
  cooldown: 3,
  guildOnly: false,

  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Display a user\'s avatar')
    .addUserOption(opt =>
      opt.setName('user').setDescription('User to get avatar of')
    )
    .addBooleanOption(opt =>
      opt.setName('server').setDescription('Get server-specific avatar if available')
    ),

  async execute(interaction, client) {
    const isSlash = interaction.isChatInputCommand?.();
    const guild = interaction.guild;

    let user, serverAvatar;
    if (isSlash) {
      user = interaction.options.getUser('user') || interaction.user;
      serverAvatar = interaction.options.getBoolean('server');
    } else {
      const args = interaction.content.split(' ').slice(1);
      const mention = args[0];
      if (mention) {
        const userId = mention.replace(/[<@!>]/g, '');
        user = await client.users.fetch(userId).catch(() => null) || interaction.author;
      } else {
        user = interaction.author;
      }
      serverAvatar = args.includes('--server') || args.includes('-s');
    }

    let avatarURL;
    let isServerAvatar = false;

    if (serverAvatar && guild) {
      const member = await guild.members.fetch(user.id).catch(() => null);
      if (member?.avatar) {
        avatarURL = member.displayAvatarURL({ size: 4096, dynamic: true });
        isServerAvatar = true;
      }
    }

    if (!avatarURL) {
      avatarURL = user.displayAvatarURL({ size: 4096, dynamic: true });
    }

    const embed = new EmbedBuilder()
      .setColor(Colors.PRIMARY)
      .setTitle(`${user.username}'s Avatar${isServerAvatar ? ' (Server)' : ''}`)
      .setImage(avatarURL)
      .addFields(
        { name: 'PNG', value: `[Link](${user.displayAvatarURL({ format: 'png', size: 4096 })})`, inline: true },
        { name: 'JPG', value: `[Link](${user.displayAvatarURL({ format: 'jpg', size: 4096 })})`, inline: true },
        { name: 'WEBP', value: `[Link](${user.displayAvatarURL({ format: 'webp', size: 4096 })})`, inline: true }
      )
      .setFooter({ text: `Requested by ${isSlash ? interaction.user.username : interaction.author.username}` })
      .setTimestamp();

    if (isSlash) {
      await interaction.reply({ embeds: [embed] });
    } else {
      await interaction.reply({ embeds: [embed] });
    }
  }
};
