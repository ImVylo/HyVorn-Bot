// Prefix command
// Created by ImVylo

import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { successEmbed, errorEmbed, infoEmbed } from '../../utils/embeds.js';
import { PermissionLevels } from '../../utils/constants.js';

export default {
  name: 'prefix',
  description: 'View or change the server prefix',
  aliases: ['setprefix'],
  cooldown: 5,
  guildOnly: true,
  permissionLevel: PermissionLevels.ADMIN,

  data: new SlashCommandBuilder()
    .setName('prefix')
    .setDescription('View or change the server prefix')
    .addStringOption(option =>
      option
        .setName('new_prefix')
        .setDescription('The new prefix to set')
        .setRequired(false)
        .setMaxLength(5)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction, client) {
    const isSlash = interaction.isChatInputCommand?.();
    const guild = interaction.guild;

    let newPrefix;
    if (isSlash) {
      newPrefix = interaction.options.getString('new_prefix');
    } else {
      const args = interaction.content.split(' ').slice(1);
      newPrefix = args[0];
    }

    const currentPrefix = client.getPrefix(guild.id);

    // If no new prefix provided, show current
    if (!newPrefix) {
      const embed = infoEmbed(`The current prefix is \`${currentPrefix}\``);
      return isSlash
        ? interaction.reply({ embeds: [embed] })
        : interaction.reply({ embeds: [embed] });
    }

    // Validate new prefix
    if (newPrefix.length > 5) {
      const embed = errorEmbed('Prefix must be 5 characters or less.');
      return isSlash
        ? interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [embed] });
    }

    // Set new prefix
    client.db.setPrefix(guild.id, newPrefix);

    const embed = successEmbed(`Prefix changed from \`${currentPrefix}\` to \`${newPrefix}\``);
    return isSlash
      ? interaction.reply({ embeds: [embed] })
      : interaction.reply({ embeds: [embed] });
  }
};
