// Embed command - Create custom embeds
// Created by ImVylo

import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { Colors, PermissionLevels } from '../../utils/constants.js';
import { errorEmbed } from '../../utils/embeds.js';

export default {
  name: 'embed',
  description: 'Create a custom embed message',
  aliases: [],
  cooldown: 5,
  guildOnly: true,
  permissionLevel: PermissionLevels.MODERATOR,

  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Create a custom embed message')
    .addStringOption(opt =>
      opt.setName('description').setDescription('Embed description').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('title').setDescription('Embed title')
    )
    .addStringOption(opt =>
      opt.setName('color').setDescription('Embed color (hex code, e.g., #FF0000)')
    )
    .addStringOption(opt =>
      opt.setName('footer').setDescription('Embed footer text')
    )
    .addStringOption(opt =>
      opt.setName('image').setDescription('Image URL')
    )
    .addStringOption(opt =>
      opt.setName('thumbnail').setDescription('Thumbnail URL')
    )
    .addChannelOption(opt =>
      opt.setName('channel').setDescription('Channel to send embed to (default: current)')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction, client) {
    const isSlash = interaction.isChatInputCommand?.();
    const user = isSlash ? interaction.user : interaction.author;

    let title, description, color, footer, image, thumbnail, targetChannel;

    if (isSlash) {
      title = interaction.options.getString('title');
      description = interaction.options.getString('description');
      color = interaction.options.getString('color');
      footer = interaction.options.getString('footer');
      image = interaction.options.getString('image');
      thumbnail = interaction.options.getString('thumbnail');
      targetChannel = interaction.options.getChannel('channel') || interaction.channel;
    } else {
      // Simple prefix command parsing
      const args = interaction.content.split(' ').slice(1).join(' ');
      description = args;
      targetChannel = interaction.channel;
    }

    if (!description) {
      return isSlash
        ? interaction.reply({ embeds: [errorEmbed('Please provide a description for the embed!')], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [errorEmbed('Please provide a description!')] });
    }

    // Parse color
    let embedColor = Colors.PRIMARY;
    if (color) {
      const hexMatch = color.match(/^#?([0-9A-Fa-f]{6})$/);
      if (hexMatch) {
        embedColor = parseInt(hexMatch[1], 16);
      }
    }

    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setDescription(description)
      .setTimestamp();

    if (title) embed.setTitle(title);
    if (footer) embed.setFooter({ text: footer });
    if (image) {
      try {
        new URL(image);
        embed.setImage(image);
      } catch (e) {
        // Invalid URL, ignore
      }
    }
    if (thumbnail) {
      try {
        new URL(thumbnail);
        embed.setThumbnail(thumbnail);
      } catch (e) {
        // Invalid URL, ignore
      }
    }

    try {
      await targetChannel.send({ embeds: [embed] });

      if (targetChannel.id !== interaction.channel.id) {
        if (isSlash) {
          await interaction.reply({ content: `Embed sent to ${targetChannel}!`, flags: MessageFlags.Ephemeral });
        } else {
          await interaction.react('✅');
        }
      } else {
        if (isSlash) {
          await interaction.reply({ content: 'Embed sent!', flags: MessageFlags.Ephemeral });
        } else {
          // Delete command message for cleaner look
          await interaction.delete().catch(() => {});
        }
      }
    } catch (error) {
      return isSlash
        ? interaction.reply({ embeds: [errorEmbed('Failed to send embed. Check my permissions!')], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [errorEmbed('Failed to send embed.')] });
    }
  }
};
