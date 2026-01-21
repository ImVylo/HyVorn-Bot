// Logs command - Configure logging channels
// Created by ImVylo

import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { Colors, PermissionLevels, Emojis, LogChannels } from '../../utils/constants.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';

export default {
  name: 'logs',
  description: 'Configure logging channels',
  aliases: [],
  cooldown: 5,
  guildOnly: true,
  permissionLevel: PermissionLevels.ADMIN,

  data: new SlashCommandBuilder()
    .setName('logs')
    .setDescription('Configure logging channels')
    .addSubcommand(sub =>
      sub.setName('view')
        .setDescription('View current log channel configuration')
    )
    .addSubcommand(sub =>
      sub.setName('joins')
        .setDescription('Set the join/leave logs channel')
        .addChannelOption(opt =>
          opt.setName('channel')
            .setDescription('Channel for join/leave logs (leave empty to disable)')
            .addChannelTypes(ChannelType.GuildText)
        )
    )
    .addSubcommand(sub =>
      sub.setName('messages')
        .setDescription('Set the message logs channel (edits, deletes)')
        .addChannelOption(opt =>
          opt.setName('channel')
            .setDescription('Channel for message logs (leave empty to disable)')
            .addChannelTypes(ChannelType.GuildText)
        )
    )
    .addSubcommand(sub =>
      sub.setName('users')
        .setDescription('Set the user logs channel (role changes, nickname changes)')
        .addChannelOption(opt =>
          opt.setName('channel')
            .setDescription('Channel for user logs (leave empty to disable)')
            .addChannelTypes(ChannelType.GuildText)
        )
    )
    .addSubcommand(sub =>
      sub.setName('moderation')
        .setDescription('Set the moderation logs channel (kicks, bans, mutes)')
        .addChannelOption(opt =>
          opt.setName('channel')
            .setDescription('Channel for moderation logs (leave empty to disable)')
            .addChannelTypes(ChannelType.GuildText)
        )
    )
    .addSubcommand(sub =>
      sub.setName('automod')
        .setDescription('Set the AutoMod logs channel')
        .addChannelOption(opt =>
          opt.setName('channel')
            .setDescription('Channel for AutoMod logs (leave empty to disable)')
            .addChannelTypes(ChannelType.GuildText)
        )
    )
    .addSubcommand(sub =>
      sub.setName('invites')
        .setDescription('Set the invite logs channel')
        .addChannelOption(opt =>
          opt.setName('channel')
            .setDescription('Channel for invite logs (leave empty to disable)')
            .addChannelTypes(ChannelType.GuildText)
        )
    )
    .addSubcommand(sub =>
      sub.setName('voice')
        .setDescription('Set the voice logs channel (join/leave/move)')
        .addChannelOption(opt =>
          opt.setName('channel')
            .setDescription('Channel for voice logs (leave empty to disable)')
            .addChannelTypes(ChannelType.GuildText)
        )
    )
    .addSubcommand(sub =>
      sub.setName('all')
        .setDescription('Set all logs to one channel')
        .addChannelOption(opt =>
          opt.setName('channel')
            .setDescription('Channel for all logs (leave empty to disable all)')
            .addChannelTypes(ChannelType.GuildText)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    const channel = interaction.options.getChannel('channel');

    if (subcommand === 'view') {
      return showLogConfig(interaction, client);
    }

    if (subcommand === 'all') {
      // Set all log channels to the same channel
      const channelTypes = ['joins', 'messages', 'users', 'moderation', 'automod', 'invites', 'voice'];

      for (const type of channelTypes) {
        const settingKey = LogChannels[type];
        client.db.setSetting(guildId, settingKey, channel?.id || null);
      }

      if (channel) {
        return interaction.reply({
          embeds: [successEmbed(`All log channels set to ${channel}.`)]
        });
      } else {
        return interaction.reply({
          embeds: [successEmbed('All log channels have been disabled.')]
        });
      }
    }

    // Handle individual log channel settings
    const settingKey = LogChannels[subcommand];
    const logNames = {
      joins: 'Join/Leave',
      messages: 'Message',
      users: 'User',
      moderation: 'Moderation',
      automod: 'AutoMod',
      invites: 'Invite',
      voice: 'Voice'
    };

    client.db.setSetting(guildId, settingKey, channel?.id || null);

    if (channel) {
      return interaction.reply({
        embeds: [successEmbed(`${logNames[subcommand]} logs will be sent to ${channel}.`)]
      });
    } else {
      return interaction.reply({
        embeds: [successEmbed(`${logNames[subcommand]} logs have been disabled.`)]
      });
    }
  }
};

async function showLogConfig(interaction, client) {
  const guild = interaction.guild;
  const settings = client.db.getGuild(guild.id).settings;

  const getChannel = (key) => {
    const id = settings[key];
    return id ? `<#${id}>` : '`Not set`';
  };

  const embed = new EmbedBuilder()
    .setColor(Colors.PRIMARY)
    .setTitle(`${Emojis.INFO} Log Channels Configuration`)
    .setDescription('Use `/logs <type> #channel` to set a log channel.\nLeave channel empty to disable.')
    .addFields(
      { name: '👋 Join/Leave Logs', value: getChannel(LogChannels.joins), inline: true },
      { name: '💬 Message Logs', value: getChannel(LogChannels.messages), inline: true },
      { name: '👤 User Logs', value: getChannel(LogChannels.users), inline: true },
      { name: '🔨 Moderation Logs', value: getChannel(LogChannels.moderation), inline: true },
      { name: '🤖 AutoMod Logs', value: getChannel(LogChannels.automod), inline: true },
      { name: '📨 Invite Logs', value: getChannel(LogChannels.invites), inline: true },
      { name: '🔊 Voice Logs', value: getChannel(LogChannels.voice), inline: true }
    )
    .setFooter({ text: 'Tip: Use /logs all #channel to set all logs to one channel' })
    .setTimestamp();

  return interaction.reply({ embeds: [embed] });
}
