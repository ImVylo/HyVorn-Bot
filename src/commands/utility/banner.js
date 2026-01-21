// Banner command - Display user banner
// Created by ImVylo

import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { Colors } from '../../utils/constants.js';
import { errorEmbed } from '../../utils/embeds.js';

export default {
  name: 'banner',
  description: 'Display a user\'s banner',
  aliases: [],
  cooldown: 3,
  guildOnly: false,

  data: new SlashCommandBuilder()
    .setName('banner')
    .setDescription('Display a user\'s banner')
    .addUserOption(opt =>
      opt.setName('user').setDescription('User to get banner of')
    ),

  async execute(interaction, client) {
    const isSlash = interaction.isChatInputCommand?.();

    let targetUser;
    if (isSlash) {
      targetUser = interaction.options.getUser('user') || interaction.user;
    } else {
      const args = interaction.content.split(' ').slice(1);
      const mention = args[0];
      if (mention) {
        const userId = mention.replace(/[<@!>]/g, '');
        targetUser = await client.users.fetch(userId).catch(() => null) || interaction.author;
      } else {
        targetUser = interaction.author;
      }
    }

    // Force fetch to get banner
    const user = await client.users.fetch(targetUser.id, { force: true });

    if (!user.banner) {
      return isSlash
        ? interaction.reply({ embeds: [errorEmbed(`${user.username} doesn't have a banner set.`)], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [errorEmbed(`${user.username} doesn't have a banner set.`)] });
    }

    const bannerURL = user.bannerURL({ size: 4096, dynamic: true });

    const embed = new EmbedBuilder()
      .setColor(user.accentColor || Colors.PRIMARY)
      .setTitle(`${user.username}'s Banner`)
      .setImage(bannerURL)
      .addFields(
        { name: 'PNG', value: `[Link](${user.bannerURL({ format: 'png', size: 4096 })})`, inline: true },
        { name: 'JPG', value: `[Link](${user.bannerURL({ format: 'jpg', size: 4096 })})`, inline: true },
        { name: 'WEBP', value: `[Link](${user.bannerURL({ format: 'webp', size: 4096 })})`, inline: true }
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
