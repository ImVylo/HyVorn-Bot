// Lockdown command - Lock/unlock channels
// Created by ImVylo

import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags, EmbedBuilder } from 'discord.js';
import { PermissionLevels, BOT_COLOR, Emojis } from '../../utils/constants.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';

export default {
  name: 'lockdown',
  description: 'Lock or unlock a channel',
  aliases: ['lock'],
  cooldown: 5,
  guildOnly: true,
  permissionLevel: PermissionLevels.MODERATOR,
  botPermissions: [PermissionFlagsBits.ManageChannels],

  data: new SlashCommandBuilder()
    .setName('lockdown')
    .setDescription('Lock or unlock a channel')
    .addSubcommand(sub =>
      sub
        .setName('lock')
        .setDescription('Lock a channel (prevent members from sending messages)')
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('Channel to lock (defaults to current channel)')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(false)
        )
        .addStringOption(option =>
          option
            .setName('reason')
            .setDescription('Reason for locking the channel')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('unlock')
        .setDescription('Unlock a channel (allow members to send messages)')
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('Channel to unlock (defaults to current channel)')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(false)
        )
        .addStringOption(option =>
          option
            .setName('reason')
            .setDescription('Reason for unlocking the channel')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('server')
        .setDescription('Lock all channels in the server (emergency lockdown)')
        .addStringOption(option =>
          option
            .setName('reason')
            .setDescription('Reason for server lockdown')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('lift')
        .setDescription('Lift server-wide lockdown (unlock all channels)')
        .addStringOption(option =>
          option
            .setName('reason')
            .setDescription('Reason for lifting lockdown')
            .setRequired(false)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction, client) {
    const isSlash = interaction.isChatInputCommand?.();

    if (!isSlash) {
      // For prefix commands, default to lock action
      return lockChannel(interaction, interaction.channel, 'No reason provided', client);
    }

    const subcommand = interaction.options.getSubcommand();
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const reason = interaction.options.getString('reason') || 'No reason provided';

    switch (subcommand) {
      case 'lock':
        return lockChannel(interaction, channel, reason, client);
      case 'unlock':
        return unlockChannel(interaction, channel, reason, client);
      case 'server':
        return serverLockdown(interaction, reason, client);
      case 'lift':
        return liftLockdown(interaction, reason, client);
    }
  }
};

async function lockChannel(interaction, channel, reason, client) {
  const isSlash = interaction.isChatInputCommand?.();
  const user = isSlash ? interaction.user : interaction.author;

  try {
    // Get the @everyone role
    const everyoneRole = interaction.guild.roles.everyone;

    // Check current permissions
    const currentPerms = channel.permissionOverwrites.cache.get(everyoneRole.id);
    if (currentPerms?.deny.has(PermissionFlagsBits.SendMessages)) {
      return interaction.reply({
        embeds: [errorEmbed(`${channel} is already locked.`)],
        flags: isSlash ? MessageFlags.Ephemeral : undefined
      });
    }

    // Lock the channel
    await channel.permissionOverwrites.edit(everyoneRole, {
      SendMessages: false,
      AddReactions: false
    }, { reason: `Locked by ${user.tag}: ${reason}` });

    // Send lockdown announcement in the channel
    const lockEmbed = new EmbedBuilder()
      .setColor(0xED4245) // Red
      .setTitle(`${Emojis.ERROR} Channel Locked`)
      .setDescription('This channel has been locked by a moderator.')
      .addFields({ name: 'Reason', value: reason })
      .setFooter({ text: `Locked by ${user.tag}` })
      .setTimestamp();

    if (channel.id !== interaction.channel.id) {
      await channel.send({ embeds: [lockEmbed] });
    }

    // Log the action
    const loggingModule = client.getModule('logging');
    if (loggingModule) {
      await loggingModule.logModAction({
        guild: interaction.guild,
        action: 'Channel Locked',
        moderator: user,
        target: channel,
        reason
      });
    }

    return interaction.reply({
      embeds: [successEmbed(`${channel} has been locked.`)],
      flags: isSlash ? MessageFlags.Ephemeral : undefined
    });
  } catch (error) {
    client.logger.error('Lockdown', 'Error locking channel:', error);
    return interaction.reply({
      embeds: [errorEmbed(`Failed to lock channel: ${error.message}`)],
      flags: isSlash ? MessageFlags.Ephemeral : undefined
    });
  }
}

async function unlockChannel(interaction, channel, reason, client) {
  const isSlash = interaction.isChatInputCommand?.();
  const user = isSlash ? interaction.user : interaction.author;

  try {
    // Get the @everyone role
    const everyoneRole = interaction.guild.roles.everyone;

    // Unlock the channel (reset to null to use default/inherited permissions)
    await channel.permissionOverwrites.edit(everyoneRole, {
      SendMessages: null,
      AddReactions: null
    }, { reason: `Unlocked by ${user.tag}: ${reason}` });

    // Send unlock announcement in the channel
    const unlockEmbed = new EmbedBuilder()
      .setColor(0x57F287) // Green
      .setTitle(`${Emojis.SUCCESS} Channel Unlocked`)
      .setDescription('This channel has been unlocked by a moderator.')
      .addFields({ name: 'Reason', value: reason })
      .setFooter({ text: `Unlocked by ${user.tag}` })
      .setTimestamp();

    if (channel.id !== interaction.channel.id) {
      await channel.send({ embeds: [unlockEmbed] });
    }

    // Log the action
    const loggingModule = client.getModule('logging');
    if (loggingModule) {
      await loggingModule.logModAction({
        guild: interaction.guild,
        action: 'Channel Unlocked',
        moderator: user,
        target: channel,
        reason
      });
    }

    return interaction.reply({
      embeds: [successEmbed(`${channel} has been unlocked.`)],
      flags: isSlash ? MessageFlags.Ephemeral : undefined
    });
  } catch (error) {
    client.logger.error('Lockdown', 'Error unlocking channel:', error);
    return interaction.reply({
      embeds: [errorEmbed(`Failed to unlock channel: ${error.message}`)],
      flags: isSlash ? MessageFlags.Ephemeral : undefined
    });
  }
}

async function serverLockdown(interaction, reason, client) {
  const user = interaction.user;
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    const everyoneRole = interaction.guild.roles.everyone;
    const textChannels = interaction.guild.channels.cache.filter(
      c => c.type === ChannelType.GuildText || c.type === ChannelType.GuildAnnouncement
    );

    let lockedCount = 0;
    const errors = [];

    for (const [, channel] of textChannels) {
      try {
        await channel.permissionOverwrites.edit(everyoneRole, {
          SendMessages: false,
          AddReactions: false
        }, { reason: `Server lockdown by ${user.tag}: ${reason}` });
        lockedCount++;
      } catch (err) {
        errors.push(channel.name);
      }
    }

    // Log the action
    const loggingModule = client.getModule('logging');
    if (loggingModule) {
      await loggingModule.logModAction({
        guild: interaction.guild,
        action: 'Server Lockdown',
        moderator: user,
        reason,
        details: `Locked ${lockedCount} channels`
      });
    }

    let message = `Server lockdown activated. Locked **${lockedCount}** channels.`;
    if (errors.length > 0) {
      message += `\nFailed to lock: ${errors.slice(0, 5).join(', ')}${errors.length > 5 ? ` and ${errors.length - 5} more` : ''}`;
    }

    return interaction.editReply({
      embeds: [successEmbed(message)]
    });
  } catch (error) {
    client.logger.error('Lockdown', 'Error during server lockdown:', error);
    return interaction.editReply({
      embeds: [errorEmbed(`Failed to initiate server lockdown: ${error.message}`)]
    });
  }
}

async function liftLockdown(interaction, reason, client) {
  const user = interaction.user;
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    const everyoneRole = interaction.guild.roles.everyone;
    const textChannels = interaction.guild.channels.cache.filter(
      c => c.type === ChannelType.GuildText || c.type === ChannelType.GuildAnnouncement
    );

    let unlockedCount = 0;
    const errors = [];

    for (const [, channel] of textChannels) {
      try {
        await channel.permissionOverwrites.edit(everyoneRole, {
          SendMessages: null,
          AddReactions: null
        }, { reason: `Lockdown lifted by ${user.tag}: ${reason}` });
        unlockedCount++;
      } catch (err) {
        errors.push(channel.name);
      }
    }

    // Log the action
    const loggingModule = client.getModule('logging');
    if (loggingModule) {
      await loggingModule.logModAction({
        guild: interaction.guild,
        action: 'Lockdown Lifted',
        moderator: user,
        reason,
        details: `Unlocked ${unlockedCount} channels`
      });
    }

    let message = `Server lockdown lifted. Unlocked **${unlockedCount}** channels.`;
    if (errors.length > 0) {
      message += `\nFailed to unlock: ${errors.slice(0, 5).join(', ')}${errors.length > 5 ? ` and ${errors.length - 5} more` : ''}`;
    }

    return interaction.editReply({
      embeds: [successEmbed(message)]
    });
  } catch (error) {
    client.logger.error('Lockdown', 'Error lifting lockdown:', error);
    return interaction.editReply({
      embeds: [errorEmbed(`Failed to lift lockdown: ${error.message}`)]
    });
  }
}
