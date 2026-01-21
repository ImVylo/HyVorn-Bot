// Server info command
// Created by ImVylo

import { SlashCommandBuilder, EmbedBuilder, ChannelType } from 'discord.js';
import { BOT_COLOR } from '../../utils/constants.js';
import { discordTimestamp } from '../../utils/time.js';

export default {
  name: 'serverinfo',
  description: 'View information about the server',
  aliases: ['si', 'server', 'guildinfo'],
  cooldown: 5,
  guildOnly: true,

  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('View information about the server'),

  async execute(interaction, client) {
    const isSlash = interaction.isChatInputCommand?.();
    const guild = interaction.guild;

    // Fetch more data
    await guild.fetch();

    const owner = await guild.fetchOwner();

    // Count channels by type
    const channels = guild.channels.cache;
    const textChannels = channels.filter(c => c.type === ChannelType.GuildText).size;
    const voiceChannels = channels.filter(c => c.type === ChannelType.GuildVoice).size;
    const categories = channels.filter(c => c.type === ChannelType.GuildCategory).size;

    // Count members
    const members = guild.members.cache;
    const humans = members.filter(m => !m.user.bot).size;
    const bots = members.filter(m => m.user.bot).size;
    const online = members.filter(m => m.presence?.status === 'online').size;

    // Verification level
    const verificationLevels = {
      0: 'None',
      1: 'Low',
      2: 'Medium',
      3: 'High',
      4: 'Very High'
    };

    // Boost info
    const boostLevel = guild.premiumTier;
    const boostCount = guild.premiumSubscriptionCount || 0;

    const embed = new EmbedBuilder()
      .setColor(BOT_COLOR)
      .setTitle(guild.name)
      .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: 'Owner', value: `${owner.user.tag}`, inline: true },
        { name: 'Created', value: discordTimestamp(guild.createdAt, 'R'), inline: true },
        { name: 'ID', value: guild.id, inline: true },
        {
          name: `Members (${guild.memberCount})`,
          value: `👤 ${humans} humans\n🤖 ${bots} bots\n🟢 ${online} online`,
          inline: true
        },
        {
          name: `Channels (${channels.size})`,
          value: `💬 ${textChannels} text\n🔊 ${voiceChannels} voice\n📁 ${categories} categories`,
          inline: true
        },
        {
          name: 'Server Boost',
          value: `Level ${boostLevel}\n${boostCount} boosts`,
          inline: true
        },
        { name: 'Roles', value: `${guild.roles.cache.size}`, inline: true },
        { name: 'Emojis', value: `${guild.emojis.cache.size}`, inline: true },
        { name: 'Verification', value: verificationLevels[guild.verificationLevel], inline: true }
      )
      .setFooter({ text: `Server ID: ${guild.id}` })
      .setTimestamp();

    // Add banner if available
    if (guild.banner) {
      embed.setImage(guild.bannerURL({ size: 512 }));
    }

    // Add features if any
    if (guild.features.length > 0) {
      const features = guild.features
        .map(f => f.toLowerCase().replace(/_/g, ' '))
        .map(f => f.charAt(0).toUpperCase() + f.slice(1))
        .slice(0, 10)
        .join(', ');

      embed.addFields({
        name: 'Features',
        value: features,
        inline: false
      });
    }

    if (isSlash) {
      await interaction.reply({ embeds: [embed] });
    } else {
      await interaction.reply({ embeds: [embed] });
    }
  }
};
