// Unban command
// Created by ImVylo

import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { PermissionLevels } from '../../utils/constants.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';

export default {
  name: 'unban',
  description: 'Unban a user from the server',
  aliases: [],
  cooldown: 5,
  guildOnly: true,
  permissionLevel: PermissionLevels.MODERATOR,
  botPermissions: [PermissionFlagsBits.BanMembers],

  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user from the server')
    .addStringOption(option =>
      option
        .setName('user')
        .setDescription('The user ID or username#discriminator to unban')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for the unban')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction, client) {
    const isSlash = interaction.isChatInputCommand?.();
    const guild = interaction.guild;
    const moderator = isSlash ? interaction.user : interaction.author;

    let userInput, reason;
    if (isSlash) {
      userInput = interaction.options.getString('user');
      reason = interaction.options.getString('reason') || 'No reason provided';
    } else {
      const args = interaction.content.split(' ').slice(1);
      userInput = args[0];
      reason = args.slice(1).join(' ') || 'No reason provided';
    }

    if (!userInput) {
      const embed = errorEmbed('Please specify a user ID or username to unban.');
      return isSlash
        ? interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [embed] });
    }

    try {
      // Get ban list
      const bans = await guild.bans.fetch();

      // Find user by ID or tag
      let bannedUser = bans.find(ban =>
        ban.user.id === userInput ||
        ban.user.tag.toLowerCase() === userInput.toLowerCase() ||
        ban.user.username.toLowerCase() === userInput.toLowerCase()
      );

      if (!bannedUser) {
        const embed = errorEmbed('That user is not banned or could not be found.');
        return isSlash
          ? interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
          : interaction.reply({ embeds: [embed] });
      }

      // Unban the user
      await guild.members.unban(bannedUser.user.id, reason);

      // Remove temp punishment if exists
      client.db.removeTempPunishment(guild.id, bannedUser.user.id, 'ban');

      // Log to database
      client.db.addModLog(guild.id, bannedUser.user.id, moderator.id, 'unban', reason);

      // Log to log channel
      const loggingModule = client.getModule('logging');
      if (loggingModule) {
        await loggingModule.logModAction('unban', bannedUser.user, moderator, reason);
      }

      const embed = successEmbed(`**${bannedUser.user.tag}** has been unbanned.\n**Reason:** ${reason}`);
      return isSlash
        ? interaction.reply({ embeds: [embed] })
        : interaction.reply({ embeds: [embed] });
    } catch (error) {
      client.logger.error('Unban', 'Error unbanning user:', error);
      const embed = errorEmbed(`Failed to unban user: ${error.message}`);
      return isSlash
        ? interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [embed] });
    }
  }
};
