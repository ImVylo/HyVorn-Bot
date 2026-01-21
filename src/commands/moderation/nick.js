// Nick command - Change user nicknames
// Created by ImVylo

import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { PermissionLevels } from '../../utils/constants.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';

export default {
  name: 'nick',
  description: 'Change a user\'s nickname',
  aliases: ['nickname', 'setnick'],
  cooldown: 3,
  guildOnly: true,
  permissionLevel: PermissionLevels.MODERATOR,
  botPermissions: [PermissionFlagsBits.ManageNicknames],

  data: new SlashCommandBuilder()
    .setName('nick')
    .setDescription('Change a user\'s nickname')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to change the nickname of')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('nickname')
        .setDescription('The new nickname (leave empty to reset)')
        .setMaxLength(32)
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for changing the nickname')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames),

  async execute(interaction, client) {
    const isSlash = interaction.isChatInputCommand?.();
    const moderator = isSlash ? interaction.user : interaction.author;

    let targetUser, nickname, reason;
    if (isSlash) {
      targetUser = interaction.options.getUser('user');
      nickname = interaction.options.getString('nickname');
      reason = interaction.options.getString('reason') || 'No reason provided';
    } else {
      const args = interaction.content.split(' ').slice(1);
      if (!args[0]) {
        return interaction.reply({
          embeds: [errorEmbed('Usage: `nick <@user> [new nickname]`')]
        });
      }

      const userId = args[0].replace(/[<@!>]/g, '');
      targetUser = await client.users.fetch(userId).catch(() => null);

      if (!targetUser) {
        return interaction.reply({
          embeds: [errorEmbed('User not found.')]
        });
      }

      nickname = args.slice(1).join(' ') || null;
      reason = 'No reason provided';
    }

    // Get the member
    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember) {
      return interaction.reply({
        embeds: [errorEmbed('Could not find that member in this server.')],
        flags: isSlash ? MessageFlags.Ephemeral : undefined
      });
    }

    // Check if trying to change server owner's nickname
    if (targetUser.id === interaction.guild.ownerId && moderator.id !== interaction.guild.ownerId) {
      return interaction.reply({
        embeds: [errorEmbed('You cannot change the server owner\'s nickname.')],
        flags: isSlash ? MessageFlags.Ephemeral : undefined
      });
    }

    // Check role hierarchy (except for self-nick change)
    if (targetUser.id !== moderator.id) {
      if (targetMember.roles.highest.position >= interaction.member.roles.highest.position && moderator.id !== interaction.guild.ownerId) {
        return interaction.reply({
          embeds: [errorEmbed('You cannot change the nickname of a member with equal or higher role.')],
          flags: isSlash ? MessageFlags.Ephemeral : undefined
        });
      }
    }

    // Check bot role hierarchy
    if (targetMember.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
      return interaction.reply({
        embeds: [errorEmbed('I cannot change the nickname of a member with equal or higher role than me.')],
        flags: isSlash ? MessageFlags.Ephemeral : undefined
      });
    }

    const oldNickname = targetMember.nickname || targetMember.user.username;

    try {
      await targetMember.setNickname(nickname, `${moderator.tag}: ${reason}`);

      // Log the action
      const loggingModule = client.getModule('logging');
      if (loggingModule) {
        await loggingModule.logModAction({
          guild: interaction.guild,
          action: 'Nickname Changed',
          moderator,
          target: targetUser,
          reason,
          details: nickname
            ? `"${oldNickname}" → "${nickname}"`
            : `"${oldNickname}" → Reset to username`
        });
      }

      const embed = nickname
        ? successEmbed(`Changed ${targetUser}'s nickname to **${nickname}**.\n**Reason:** ${reason}`)
        : successEmbed(`Reset ${targetUser}'s nickname.\n**Reason:** ${reason}`);

      return interaction.reply({
        embeds: [embed]
      });
    } catch (error) {
      client.logger.error('Nick', 'Error changing nickname:', error);
      return interaction.reply({
        embeds: [errorEmbed(`Failed to change nickname: ${error.message}`)],
        flags: isSlash ? MessageFlags.Ephemeral : undefined
      });
    }
  }
};
