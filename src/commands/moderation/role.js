// Role command - Add or remove roles from users
// Created by ImVylo

import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { PermissionLevels } from '../../utils/constants.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';

export default {
  name: 'role',
  description: 'Add or remove roles from users',
  aliases: ['r'],
  cooldown: 3,
  guildOnly: true,
  permissionLevel: PermissionLevels.MODERATOR,
  botPermissions: [PermissionFlagsBits.ManageRoles],

  data: new SlashCommandBuilder()
    .setName('role')
    .setDescription('Add or remove roles from users')
    .addSubcommand(sub =>
      sub
        .setName('add')
        .setDescription('Add a role to a user')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('The user to add the role to')
            .setRequired(true)
        )
        .addRoleOption(option =>
          option
            .setName('role')
            .setDescription('The role to add')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('reason')
            .setDescription('Reason for adding the role')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('remove')
        .setDescription('Remove a role from a user')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('The user to remove the role from')
            .setRequired(true)
        )
        .addRoleOption(option =>
          option
            .setName('role')
            .setDescription('The role to remove')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('reason')
            .setDescription('Reason for removing the role')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('toggle')
        .setDescription('Toggle a role on a user (add if missing, remove if present)')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('The user to toggle the role on')
            .setRequired(true)
        )
        .addRoleOption(option =>
          option
            .setName('role')
            .setDescription('The role to toggle')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('reason')
            .setDescription('Reason for toggling the role')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('info')
        .setDescription('Get information about a role')
        .addRoleOption(option =>
          option
            .setName('role')
            .setDescription('The role to get info about')
            .setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction, client) {
    const isSlash = interaction.isChatInputCommand?.();

    if (!isSlash) {
      // For prefix commands, parse action from args
      const args = interaction.content.split(' ').slice(1);
      const action = args[0]?.toLowerCase();

      if (!action || !['add', 'remove', 'toggle'].includes(action)) {
        return interaction.reply({
          embeds: [errorEmbed('Usage: `role <add|remove|toggle> <@user> <@role>`')]
        });
      }

      return interaction.reply({
        embeds: [errorEmbed('Please use the slash command `/role` for better functionality.')]
      });
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'info') {
      return showRoleInfo(interaction, client);
    }

    const targetUser = interaction.options.getUser('user');
    const role = interaction.options.getRole('role');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const moderator = interaction.user;

    // Get the member
    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember) {
      return interaction.reply({
        embeds: [errorEmbed('Could not find that member in this server.')],
        flags: MessageFlags.Ephemeral
      });
    }

    // Check if the role is manageable
    if (role.managed) {
      return interaction.reply({
        embeds: [errorEmbed('This role is managed by an integration and cannot be manually assigned.')],
        flags: MessageFlags.Ephemeral
      });
    }

    // Check if the role is @everyone
    if (role.id === interaction.guild.id) {
      return interaction.reply({
        embeds: [errorEmbed('You cannot manage the @everyone role.')],
        flags: MessageFlags.Ephemeral
      });
    }

    // Check role hierarchy - moderator must have higher role than the target role
    if (role.position >= interaction.member.roles.highest.position && interaction.user.id !== interaction.guild.ownerId) {
      return interaction.reply({
        embeds: [errorEmbed('You cannot manage a role that is equal to or higher than your highest role.')],
        flags: MessageFlags.Ephemeral
      });
    }

    // Check bot role hierarchy
    if (role.position >= interaction.guild.members.me.roles.highest.position) {
      return interaction.reply({
        embeds: [errorEmbed('I cannot manage a role that is equal to or higher than my highest role.')],
        flags: MessageFlags.Ephemeral
      });
    }

    try {
      let action;
      let actionPast;

      switch (subcommand) {
        case 'add':
          if (targetMember.roles.cache.has(role.id)) {
            return interaction.reply({
              embeds: [errorEmbed(`${targetUser} already has the ${role} role.`)],
              flags: MessageFlags.Ephemeral
            });
          }
          await targetMember.roles.add(role, `${moderator.tag}: ${reason}`);
          action = 'added to';
          actionPast = 'Role Added';
          break;

        case 'remove':
          if (!targetMember.roles.cache.has(role.id)) {
            return interaction.reply({
              embeds: [errorEmbed(`${targetUser} doesn't have the ${role} role.`)],
              flags: MessageFlags.Ephemeral
            });
          }
          await targetMember.roles.remove(role, `${moderator.tag}: ${reason}`);
          action = 'removed from';
          actionPast = 'Role Removed';
          break;

        case 'toggle':
          if (targetMember.roles.cache.has(role.id)) {
            await targetMember.roles.remove(role, `${moderator.tag}: ${reason}`);
            action = 'removed from';
            actionPast = 'Role Removed';
          } else {
            await targetMember.roles.add(role, `${moderator.tag}: ${reason}`);
            action = 'added to';
            actionPast = 'Role Added';
          }
          break;
      }

      // Log the action
      const loggingModule = client.getModule('logging');
      if (loggingModule) {
        await loggingModule.logModAction({
          guild: interaction.guild,
          action: actionPast,
          moderator,
          target: targetUser,
          reason,
          details: `Role: ${role.name}`
        });
      }

      return interaction.reply({
        embeds: [successEmbed(`${role} has been ${action} ${targetUser}.\n**Reason:** ${reason}`)]
      });
    } catch (error) {
      client.logger.error('Role', 'Error managing role:', error);
      return interaction.reply({
        embeds: [errorEmbed(`Failed to manage role: ${error.message}`)],
        flags: MessageFlags.Ephemeral
      });
    }
  }
};

async function showRoleInfo(interaction, client) {
  const role = interaction.options.getRole('role');

  const permissions = role.permissions.toArray();
  const permissionList = permissions.length > 0
    ? permissions.slice(0, 10).join(', ') + (permissions.length > 10 ? ` (+${permissions.length - 10} more)` : '')
    : 'None';

  const embed = {
    color: role.color || 0x5865F2,
    title: `Role Info: ${role.name}`,
    fields: [
      { name: 'ID', value: role.id, inline: true },
      { name: 'Color', value: role.hexColor, inline: true },
      { name: 'Position', value: `${role.position}`, inline: true },
      { name: 'Mentionable', value: role.mentionable ? 'Yes' : 'No', inline: true },
      { name: 'Hoisted', value: role.hoist ? 'Yes' : 'No', inline: true },
      { name: 'Managed', value: role.managed ? 'Yes' : 'No', inline: true },
      { name: 'Members', value: `${role.members.size}`, inline: true },
      { name: 'Created', value: `<t:${Math.floor(role.createdTimestamp / 1000)}:R>`, inline: true },
      { name: 'Key Permissions', value: permissionList, inline: false }
    ],
    timestamp: new Date().toISOString()
  };

  return interaction.reply({ embeds: [embed] });
}
