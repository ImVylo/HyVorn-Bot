// Welcome module for HyVornBot
// Created by ImVylo

import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import { Colors, Emojis } from '../utils/constants.js';

class Welcome {
  constructor(client) {
    this.client = client;
    this.log = client.logger.child('Welcome');
  }

  async init() {
    this.log.info('Welcome module initialized');
  }

  /**
   * Handle member join
   */
  async handleMemberJoin(member) {
    const settings = this.client.db.getGuild(member.guild.id).settings;
    const enabledModules = settings.enabledModules || {};

    if (enabledModules.welcome === false) return;

    // Send welcome message
    await this.sendWelcomeMessage(member, settings);

    // Assign auto-role
    await this.assignAutoRole(member, settings);
  }

  /**
   * Handle member leave
   */
  async handleMemberLeave(member) {
    const settings = this.client.db.getGuild(member.guild.id).settings;
    const enabledModules = settings.enabledModules || {};

    if (enabledModules.welcome === false) return;

    // Send leave message
    await this.sendLeaveMessage(member, settings);
  }

  /**
   * Send welcome message
   */
  async sendWelcomeMessage(member, settings) {
    const welcomeSettings = settings.welcome || {};

    if (!settings.welcomeChannel) return;

    const channel = member.guild.channels.cache.get(settings.welcomeChannel);
    if (!channel) return;

    try {
      const message = this.formatMessage(
        welcomeSettings.message || 'Welcome to {server}, {user}!',
        member
      );

      if (welcomeSettings.useEmbed !== false) {
        const embed = new EmbedBuilder()
          .setColor(welcomeSettings.color || Colors.SUCCESS)
          .setTitle(welcomeSettings.title || `${Emojis.SUCCESS} Welcome!`)
          .setDescription(message)
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
          .setFooter({ text: `Member #${member.guild.memberCount}` })
          .setTimestamp();

        if (welcomeSettings.image) {
          embed.setImage(welcomeSettings.image);
        }

        await channel.send({ content: `${member}`, embeds: [embed] });
      } else {
        await channel.send({ content: message });
      }
    } catch (error) {
      this.log.error('Error sending welcome message:', error);
    }
  }

  /**
   * Send leave message
   */
  async sendLeaveMessage(member, settings) {
    const welcomeSettings = settings.welcome || {};

    if (!welcomeSettings.leaveMessage) return;

    const channel = member.guild.channels.cache.get(
      welcomeSettings.leaveChannel || settings.welcomeChannel
    );
    if (!channel) return;

    try {
      const message = this.formatMessage(
        welcomeSettings.leaveMessage || '{user} has left the server.',
        member
      );

      if (welcomeSettings.useEmbed !== false) {
        const embed = new EmbedBuilder()
          .setColor(Colors.ERROR)
          .setTitle(`${Emojis.ERROR} Goodbye`)
          .setDescription(message)
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .setFooter({ text: `Members: ${member.guild.memberCount}` })
          .setTimestamp();

        await channel.send({ embeds: [embed] });
      } else {
        await channel.send({ content: message });
      }
    } catch (error) {
      this.log.error('Error sending leave message:', error);
    }
  }

  /**
   * Assign auto-role to new member
   */
  async assignAutoRole(member, settings) {
    const welcomeSettings = settings.welcome || {};
    const autoRoleId = welcomeSettings.autoRole;

    if (!autoRoleId) return;

    try {
      const role = member.guild.roles.cache.get(autoRoleId);
      if (role && !member.roles.cache.has(role.id)) {
        await member.roles.add(role);
        this.log.debug(`Assigned auto-role ${role.name} to ${member.user.tag}`);
      }
    } catch (error) {
      this.log.error('Error assigning auto-role:', error);
    }
  }

  /**
   * Handle verification button
   */
  async handleVerification(interaction) {
    const settings = this.client.db.getGuild(interaction.guild.id).settings;
    const welcomeSettings = settings.welcome || {};
    const verifyRoleId = welcomeSettings.verifyRole;

    if (!verifyRoleId) {
      return interaction.reply({
        content: 'Verification is not configured for this server.',
        flags: MessageFlags.Ephemeral
      });
    }

    try {
      const role = interaction.guild.roles.cache.get(verifyRoleId);

      if (!role) {
        return interaction.reply({
          content: 'The verification role no longer exists.',
          flags: MessageFlags.Ephemeral
        });
      }

      if (interaction.member.roles.cache.has(role.id)) {
        return interaction.reply({
          content: 'You are already verified!',
          flags: MessageFlags.Ephemeral
        });
      }

      await interaction.member.roles.add(role);

      // Remove unverified role if configured
      const unverifiedRoleId = welcomeSettings.unverifiedRole;
      if (unverifiedRoleId && interaction.member.roles.cache.has(unverifiedRoleId)) {
        await interaction.member.roles.remove(unverifiedRoleId);
      }

      return interaction.reply({
        content: `${Emojis.SUCCESS} You have been verified!`,
        flags: MessageFlags.Ephemeral
      });
    } catch (error) {
      this.log.error('Error handling verification:', error);
      return interaction.reply({
        content: 'An error occurred during verification.',
        flags: MessageFlags.Ephemeral
      });
    }
  }

  /**
   * Create verification panel
   */
  async createVerificationPanel(channel, settings) {
    const welcomeSettings = settings.welcome || {};

    const embed = new EmbedBuilder()
      .setColor(Colors.INFO)
      .setTitle(welcomeSettings.verifyTitle || '✅ Verification Required')
      .setDescription(
        welcomeSettings.verifyDescription ||
        'Click the button below to verify yourself and gain access to the server.'
      );

    const button = new ButtonBuilder()
      .setCustomId('verify')
      .setLabel(welcomeSettings.verifyButtonText || 'Verify')
      .setStyle(ButtonStyle.Success)
      .setEmoji('✅');

    const row = new ActionRowBuilder().addComponents(button);

    return channel.send({
      embeds: [embed],
      components: [row]
    });
  }

  /**
   * Format message with placeholders
   */
  formatMessage(message, member) {
    return message
      .replace(/{user}/g, member.toString())
      .replace(/{username}/g, member.user.username)
      .replace(/{tag}/g, member.user.tag)
      .replace(/{server}/g, member.guild.name)
      .replace(/{membercount}/g, member.guild.memberCount.toString())
      .replace(/{id}/g, member.user.id);
  }

  cleanup() {
    this.log.info('Welcome module cleaned up');
  }
}

export default Welcome;
