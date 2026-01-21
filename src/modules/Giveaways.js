// Giveaways module for HyVornBot
// Created by ImVylo

import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} from 'discord.js';
import { Colors, Emojis } from '../utils/constants.js';
import { discordTimestamp, formatDuration } from '../utils/time.js';

class Giveaways {
  constructor(client) {
    this.client = client;
    this.log = client.logger.child('Giveaways');
  }

  async init() {
    this.log.info('Giveaways module initialized');
  }

  /**
   * Check and end expired giveaways
   */
  async checkGiveaways() {
    const giveaways = this.client.db.getActiveGiveaways();

    for (const giveaway of giveaways) {
      const endsAt = new Date(giveaway.ends_at).getTime();

      if (Date.now() >= endsAt) {
        await this.endGiveaway(giveaway);
      }
    }
  }

  /**
   * Create a new giveaway
   */
  async createGiveaway(channel, options) {
    const {
      prize,
      winners = 1,
      duration,
      hostId,
      requirements = {}
    } = options;

    const endsAt = new Date(Date.now() + duration);

    const embed = this.createGiveawayEmbed(prize, winners, endsAt, hostId, requirements, 0);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('giveaway_enter')
        .setLabel('Enter (0)')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🎉')
    );

    const message = await channel.send({
      embeds: [embed],
      components: [row]
    });

    // Save to database
    const giveawayId = this.client.db.createGiveaway({
      guildId: channel.guild.id,
      channelId: channel.id,
      messageId: message.id,
      prize,
      winners,
      endsAt: endsAt.toISOString(),
      hostId,
      requirements
    });

    this.log.info(`Created giveaway #${giveawayId} for "${prize}"`);

    return { id: giveawayId, message };
  }

  /**
   * Create giveaway embed
   */
  createGiveawayEmbed(prize, winners, endsAt, hostId, requirements, entries) {
    const embed = new EmbedBuilder()
      .setColor(Colors.PRIMARY)
      .setTitle(`🎉 ${prize}`)
      .setDescription(`React with 🎉 or click the button to enter!\n\n` +
        `**Ends:** ${discordTimestamp(endsAt, 'R')}\n` +
        `**Hosted by:** <@${hostId}>\n` +
        `**Winners:** ${winners}`)
      .setFooter({ text: `${entries} entries` })
      .setTimestamp(endsAt);

    // Add requirements if any
    const reqList = [];
    if (requirements.roleId) {
      reqList.push(`Must have <@&${requirements.roleId}> role`);
    }
    if (requirements.minLevel) {
      reqList.push(`Must be level ${requirements.minLevel}+`);
    }
    if (requirements.minMessages) {
      reqList.push(`Must have ${requirements.minMessages}+ messages`);
    }

    if (reqList.length > 0) {
      embed.addFields({
        name: 'Requirements',
        value: reqList.join('\n'),
        inline: false
      });
    }

    return embed;
  }

  /**
   * Handle button interaction
   */
  async handleButton(interaction, args) {
    const action = args[0];

    if (action === 'enter') {
      return this.enterGiveaway(interaction);
    }
  }

  /**
   * Handle reaction add
   */
  async handleReactionAdd(reaction, user) {
    if (reaction.emoji.name !== '🎉') return;

    const giveaway = this.client.db.getGiveawayByMessage(reaction.message.id);
    if (!giveaway || giveaway.ended) return;

    // Check requirements
    const eligible = await this.checkRequirements(user, reaction.message.guild, giveaway);
    if (!eligible.success) {
      try {
        await user.send({
          embeds: [
            new EmbedBuilder()
              .setColor(Colors.ERROR)
              .setDescription(`${Emojis.ERROR} You cannot enter this giveaway: ${eligible.reason}`)
          ]
        });
      } catch {}
      await reaction.users.remove(user.id).catch(() => {});
    }
  }

  /**
   * Enter a giveaway via button
   */
  async enterGiveaway(interaction) {
    const giveaway = this.client.db.getGiveawayByMessage(interaction.message.id);

    if (!giveaway) {
      return interaction.reply({
        content: `${Emojis.ERROR} This giveaway no longer exists.`,
        flags: MessageFlags.Ephemeral
      });
    }

    if (giveaway.ended) {
      return interaction.reply({
        content: `${Emojis.ERROR} This giveaway has ended.`,
        flags: MessageFlags.Ephemeral
      });
    }

    // Check requirements
    const requirements = JSON.parse(giveaway.requirements || '{}');
    const eligible = await this.checkRequirements(interaction.user, interaction.guild, giveaway);

    if (!eligible.success) {
      return interaction.reply({
        content: `${Emojis.ERROR} ${eligible.reason}`,
        flags: MessageFlags.Ephemeral
      });
    }

    // Toggle entry via reaction
    const message = interaction.message;
    const reaction = message.reactions.cache.get('🎉');

    if (reaction) {
      const users = await reaction.users.fetch();
      if (users.has(interaction.user.id)) {
        // Remove entry
        await reaction.users.remove(interaction.user.id);
        await this.updateGiveawayMessage(message, giveaway);
        return interaction.reply({
          content: `${Emojis.ERROR} You have left the giveaway.`,
          flags: MessageFlags.Ephemeral
        });
      }
    }

    // Add entry
    await message.react('🎉');
    const giveawayReaction = message.reactions.cache.get('🎉');
    if (giveawayReaction) {
      await giveawayReaction.users.remove(this.client.user.id).catch(() => {});
    }

    // User reacts
    await interaction.reply({
      content: `${Emojis.SUCCESS} You have entered the giveaway! Good luck!`,
      flags: MessageFlags.Ephemeral
    });

    // React for the user (they need to do it themselves actually)
    // This is a placeholder - in real implementation, track entries in DB
  }

  /**
   * Check if user meets giveaway requirements
   */
  async checkRequirements(user, guild, giveaway) {
    const requirements = JSON.parse(giveaway.requirements || '{}');

    // Check role requirement
    if (requirements.roleId) {
      const member = await guild.members.fetch(user.id).catch(() => null);
      if (!member || !member.roles.cache.has(requirements.roleId)) {
        return { success: false, reason: 'You do not have the required role.' };
      }
    }

    // Check level requirement
    if (requirements.minLevel) {
      const userData = this.client.db.getUser(user.id, guild.id);
      if (userData.level < requirements.minLevel) {
        return { success: false, reason: `You must be level ${requirements.minLevel}+.` };
      }
    }

    return { success: true };
  }

  /**
   * Update giveaway message with entry count
   */
  async updateGiveawayMessage(message, giveaway) {
    const reaction = message.reactions.cache.get('🎉');
    const entries = reaction ? reaction.count - 1 : 0; // Subtract bot's reaction

    const requirements = JSON.parse(giveaway.requirements || '{}');
    const embed = this.createGiveawayEmbed(
      giveaway.prize,
      giveaway.winners,
      new Date(giveaway.ends_at),
      giveaway.host_id,
      requirements,
      entries
    );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('giveaway_enter')
        .setLabel(`Enter (${entries})`)
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🎉')
    );

    await message.edit({ embeds: [embed], components: [row] });
  }

  /**
   * End a giveaway and pick winners
   */
  async endGiveaway(giveaway) {
    try {
      const channel = await this.client.channels.fetch(giveaway.channel_id);
      if (!channel) return;

      const message = await channel.messages.fetch(giveaway.message_id).catch(() => null);
      if (!message) return;

      // Get entries
      const reaction = message.reactions.cache.get('🎉');
      let entries = [];

      if (reaction) {
        const users = await reaction.users.fetch();
        entries = users.filter(u => !u.bot).map(u => u.id);
      }

      // Mark as ended
      this.client.db.endGiveaway(giveaway.id);

      // Pick winners
      const winners = this.pickWinners(entries, giveaway.winners);

      // Update embed
      const embed = new EmbedBuilder()
        .setColor(Colors.ERROR)
        .setTitle(`🎉 ${giveaway.prize}`)
        .setDescription(winners.length > 0
          ? `**Winners:** ${winners.map(w => `<@${w}>`).join(', ')}`
          : 'No valid entries.')
        .addFields(
          { name: 'Hosted by', value: `<@${giveaway.host_id}>`, inline: true },
          { name: 'Entries', value: `${entries.length}`, inline: true }
        )
        .setFooter({ text: 'Giveaway ended' })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('giveaway_ended')
          .setLabel('Ended')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true)
      );

      await message.edit({ embeds: [embed], components: [row] });

      // Announce winners
      if (winners.length > 0) {
        await channel.send({
          content: `🎉 Congratulations ${winners.map(w => `<@${w}>`).join(', ')}! You won **${giveaway.prize}**!`,
          allowedMentions: { users: winners }
        });
      } else {
        await channel.send({
          content: `😢 No one entered the giveaway for **${giveaway.prize}**.`
        });
      }

      this.log.info(`Ended giveaway #${giveaway.id} - ${winners.length} winners`);
    } catch (error) {
      this.log.error('Error ending giveaway:', error);
    }
  }

  /**
   * Pick random winners
   */
  pickWinners(entries, count) {
    const shuffled = [...entries].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, entries.length));
  }

  /**
   * Reroll a giveaway
   */
  async rerollGiveaway(messageId, count = 1) {
    const giveaway = this.client.db.getGiveawayByMessage(messageId);

    if (!giveaway) {
      return { success: false, error: 'Giveaway not found.' };
    }

    if (!giveaway.ended) {
      return { success: false, error: 'Giveaway has not ended yet.' };
    }

    try {
      const channel = await this.client.channels.fetch(giveaway.channel_id);
      const message = await channel.messages.fetch(messageId);

      const reaction = message.reactions.cache.get('🎉');
      let entries = [];

      if (reaction) {
        const users = await reaction.users.fetch();
        entries = users.filter(u => !u.bot).map(u => u.id);
      }

      const winners = this.pickWinners(entries, count);

      if (winners.length === 0) {
        return { success: false, error: 'No valid entries to reroll.' };
      }

      await channel.send({
        content: `🎉 New winner${winners.length > 1 ? 's' : ''}: ${winners.map(w => `<@${w}>`).join(', ')}! Congratulations on winning **${giveaway.prize}**!`,
        allowedMentions: { users: winners }
      });

      return { success: true, winners };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  cleanup() {
    this.log.info('Giveaways module cleaned up');
  }
}

export default Giveaways;
