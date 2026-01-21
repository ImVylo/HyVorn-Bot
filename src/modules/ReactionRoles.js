// Reaction Roles module for HyVornBot
// Created by ImVylo

import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, MessageFlags } from 'discord.js';
import { Colors, Emojis } from '../utils/constants.js';

class ReactionRoles {
  constructor(client) {
    this.client = client;
    this.log = client.logger.child('ReactionRoles');
  }

  async init() {
    this.log.info('ReactionRoles module initialized');
  }

  /**
   * Handle reaction add
   */
  async handleReactionAdd(reaction, user) {
    if (!reaction.message.guild) return;

    const reactionRole = this.client.db.getReactionRole(
      reaction.message.id,
      reaction.emoji.id || reaction.emoji.name
    );

    if (!reactionRole) return;

    try {
      const member = await reaction.message.guild.members.fetch(user.id);
      const role = reaction.message.guild.roles.cache.get(reactionRole.role_id);

      if (!role) return;

      // Check if member already has role
      if (!member.roles.cache.has(role.id)) {
        await member.roles.add(role);
        this.log.debug(`Added role ${role.name} to ${user.tag}`);

        // DM user if configured
        const settings = this.client.db.getGuild(reaction.message.guild.id).settings;
        if (settings.reactionRoles?.dmOnAdd) {
          try {
            await user.send({
              embeds: [
                new EmbedBuilder()
                  .setColor(Colors.SUCCESS)
                  .setDescription(`${Emojis.SUCCESS} You received the **${role.name}** role in ${reaction.message.guild.name}!`)
              ]
            });
          } catch {}
        }
      }
    } catch (error) {
      this.log.error('Error adding reaction role:', error);
    }
  }

  /**
   * Handle reaction remove
   */
  async handleReactionRemove(reaction, user) {
    if (!reaction.message.guild) return;

    const reactionRole = this.client.db.getReactionRole(
      reaction.message.id,
      reaction.emoji.id || reaction.emoji.name
    );

    if (!reactionRole) return;

    try {
      const member = await reaction.message.guild.members.fetch(user.id);
      const role = reaction.message.guild.roles.cache.get(reactionRole.role_id);

      if (!role) return;

      // Check if member has role
      if (member.roles.cache.has(role.id)) {
        await member.roles.remove(role);
        this.log.debug(`Removed role ${role.name} from ${user.tag}`);

        // DM user if configured
        const settings = this.client.db.getGuild(reaction.message.guild.id).settings;
        if (settings.reactionRoles?.dmOnRemove) {
          try {
            await user.send({
              embeds: [
                new EmbedBuilder()
                  .setColor(Colors.ERROR)
                  .setDescription(`${Emojis.ERROR} The **${role.name}** role was removed in ${reaction.message.guild.name}.`)
              ]
            });
          } catch {}
        }
      }
    } catch (error) {
      this.log.error('Error removing reaction role:', error);
    }
  }

  /**
   * Handle button interaction for button roles
   */
  async handleButton(interaction, args) {
    const roleId = args[0];

    if (!roleId) return;

    const role = interaction.guild.roles.cache.get(roleId);

    if (!role) {
      return interaction.reply({
        content: `${Emojis.ERROR} This role no longer exists.`,
        flags: MessageFlags.Ephemeral
      });
    }

    try {
      const member = interaction.member;
      const hasRole = member.roles.cache.has(role.id);

      if (hasRole) {
        await member.roles.remove(role);
        return interaction.reply({
          content: `${Emojis.ERROR} Removed the **${role.name}** role.`,
          flags: MessageFlags.Ephemeral
        });
      } else {
        await member.roles.add(role);
        return interaction.reply({
          content: `${Emojis.SUCCESS} Added the **${role.name}** role.`,
          flags: MessageFlags.Ephemeral
        });
      }
    } catch (error) {
      this.log.error('Error handling button role:', error);
      return interaction.reply({
        content: `${Emojis.ERROR} Failed to toggle role. I may not have permission.`,
        flags: MessageFlags.Ephemeral
      });
    }
  }

  /**
   * Handle select menu for role selection
   */
  async handleSelectMenu(interaction) {
    const selectedRoles = interaction.values;
    const member = interaction.member;

    try {
      // Get all roles from this select menu
      const options = interaction.component.options;
      const allRoleIds = options.map(opt => opt.value);

      // Remove unselected roles, add selected roles
      const rolesToAdd = [];
      const rolesToRemove = [];

      for (const roleId of allRoleIds) {
        const role = interaction.guild.roles.cache.get(roleId);
        if (!role) continue;

        if (selectedRoles.includes(roleId)) {
          if (!member.roles.cache.has(roleId)) {
            rolesToAdd.push(role);
          }
        } else {
          if (member.roles.cache.has(roleId)) {
            rolesToRemove.push(role);
          }
        }
      }

      // Apply changes
      if (rolesToAdd.length > 0) {
        await member.roles.add(rolesToAdd);
      }
      if (rolesToRemove.length > 0) {
        await member.roles.remove(rolesToRemove);
      }

      const addedNames = rolesToAdd.map(r => r.name).join(', ');
      const removedNames = rolesToRemove.map(r => r.name).join(', ');

      let message = '';
      if (addedNames) message += `${Emojis.SUCCESS} Added: **${addedNames}**\n`;
      if (removedNames) message += `${Emojis.ERROR} Removed: **${removedNames}**`;
      if (!message) message = 'No changes made.';

      return interaction.reply({
        content: message,
        flags: MessageFlags.Ephemeral
      });
    } catch (error) {
      this.log.error('Error handling select menu:', error);
      return interaction.reply({
        content: `${Emojis.ERROR} Failed to update roles.`,
        flags: MessageFlags.Ephemeral
      });
    }
  }

  /**
   * Create a reaction role panel
   */
  async createReactionPanel(channel, roles, options = {}) {
    const {
      title = 'Role Selection',
      description = 'React to get roles!',
      color = Colors.INFO,
      type = 'reaction' // 'reaction', 'button', or 'select'
    } = options;

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(title)
      .setDescription(description);

    if (type === 'reaction') {
      // Add role list to embed
      const roleList = roles.map(r => `${r.emoji} - <@&${r.roleId}>`).join('\n');
      embed.addFields({ name: 'Roles', value: roleList });

      const message = await channel.send({ embeds: [embed] });

      // Add reactions and store in database
      for (const role of roles) {
        await message.react(role.emoji);
        this.client.db.addReactionRole(
          channel.guild.id,
          message.id,
          role.emoji,
          role.roleId
        );
      }

      return message;
    } else if (type === 'button') {
      // Create buttons
      const rows = [];
      let currentRow = new ActionRowBuilder();

      for (let i = 0; i < roles.length; i++) {
        const role = roles[i];
        const button = new ButtonBuilder()
          .setCustomId(`role_${role.roleId}`)
          .setLabel(role.label || 'Role')
          .setStyle(role.style || ButtonStyle.Primary);

        if (role.emoji) button.setEmoji(role.emoji);

        currentRow.addComponents(button);

        // Max 5 buttons per row
        if ((i + 1) % 5 === 0 || i === roles.length - 1) {
          rows.push(currentRow);
          currentRow = new ActionRowBuilder();
        }
      }

      return channel.send({ embeds: [embed], components: rows });
    } else if (type === 'select') {
      // Create select menu
      const options = roles.map(r => ({
        label: r.label || 'Role',
        value: r.roleId,
        description: r.description,
        emoji: r.emoji
      }));

      const select = new StringSelectMenuBuilder()
        .setCustomId('roles_select')
        .setPlaceholder('Select your roles...')
        .setMinValues(0)
        .setMaxValues(roles.length)
        .addOptions(options);

      const row = new ActionRowBuilder().addComponents(select);

      return channel.send({ embeds: [embed], components: [row] });
    }
  }

  cleanup() {
    this.log.info('ReactionRoles module cleaned up');
  }
}

export default ReactionRoles;
