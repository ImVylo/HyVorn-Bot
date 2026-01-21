// Roleinfo command - Display role information
// Created by ImVylo

import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { Colors } from '../../utils/constants.js';
import { errorEmbed } from '../../utils/embeds.js';

export default {
  name: 'roleinfo',
  description: 'Display information about a role',
  aliases: ['ri', 'role'],
  cooldown: 3,
  guildOnly: true,

  data: new SlashCommandBuilder()
    .setName('roleinfo')
    .setDescription('Display information about a role')
    .addRoleOption(opt =>
      opt.setName('role').setDescription('Role to get info about').setRequired(true)
    ),

  async execute(interaction, client) {
    const isSlash = interaction.isChatInputCommand?.();
    const guild = interaction.guild;

    let role;
    if (isSlash) {
      role = interaction.options.getRole('role');
    } else {
      const args = interaction.content.split(' ').slice(1);
      const roleQuery = args.join(' ');
      role = guild.roles.cache.find(r =>
        r.id === roleQuery.replace(/[<@&>]/g, '') ||
        r.name.toLowerCase() === roleQuery.toLowerCase()
      );
    }

    if (!role) {
      return isSlash
        ? interaction.reply({ embeds: [errorEmbed('Role not found!')], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [errorEmbed('Role not found!')] });
    }

    // Get key permissions
    const permissions = [];
    if (role.permissions.has(PermissionFlagsBits.Administrator)) permissions.push('Administrator');
    if (role.permissions.has(PermissionFlagsBits.ManageGuild)) permissions.push('Manage Server');
    if (role.permissions.has(PermissionFlagsBits.ManageChannels)) permissions.push('Manage Channels');
    if (role.permissions.has(PermissionFlagsBits.ManageRoles)) permissions.push('Manage Roles');
    if (role.permissions.has(PermissionFlagsBits.ManageMessages)) permissions.push('Manage Messages');
    if (role.permissions.has(PermissionFlagsBits.KickMembers)) permissions.push('Kick Members');
    if (role.permissions.has(PermissionFlagsBits.BanMembers)) permissions.push('Ban Members');
    if (role.permissions.has(PermissionFlagsBits.MentionEveryone)) permissions.push('Mention Everyone');

    const memberCount = role.members.size;

    const embed = new EmbedBuilder()
      .setColor(role.color || Colors.PRIMARY)
      .setTitle(`Role: ${role.name}`)
      .addFields(
        { name: 'ID', value: role.id, inline: true },
        { name: 'Color', value: role.hexColor, inline: true },
        { name: 'Position', value: `${role.position}`, inline: true },
        { name: 'Members', value: `${memberCount}`, inline: true },
        { name: 'Mentionable', value: role.mentionable ? 'Yes' : 'No', inline: true },
        { name: 'Hoisted', value: role.hoist ? 'Yes' : 'No', inline: true },
        { name: 'Created', value: `<t:${Math.floor(role.createdTimestamp / 1000)}:R>`, inline: true },
        { name: 'Mention', value: `${role}`, inline: true },
        { name: 'Key Permissions', value: permissions.length > 0 ? permissions.join(', ') : 'None', inline: false }
      )
      .setFooter({ text: `Requested by ${isSlash ? interaction.user.username : interaction.author.username}` })
      .setTimestamp();

    if (role.icon) {
      embed.setThumbnail(role.iconURL({ size: 256 }));
    }

    if (isSlash) {
      await interaction.reply({ embeds: [embed] });
    } else {
      await interaction.reply({ embeds: [embed] });
    }
  }
};
