// Embed builder utilities
// Created by ImVylo

import { EmbedBuilder } from 'discord.js';
import { Colors, Emojis, BOT_NAME, BOT_COLOR } from './constants.js';

/**
 * Create a success embed
 */
export function successEmbed(description, title = null) {
  const embed = new EmbedBuilder()
    .setColor(Colors.SUCCESS)
    .setDescription(`${Emojis.SUCCESS} ${description}`);

  if (title) embed.setTitle(title);
  return embed;
}

/**
 * Create an error embed
 */
export function errorEmbed(description, title = null) {
  const embed = new EmbedBuilder()
    .setColor(Colors.ERROR)
    .setDescription(`${Emojis.ERROR} ${description}`);

  if (title) embed.setTitle(title);
  return embed;
}

/**
 * Create a warning embed
 */
export function warningEmbed(description, title = null) {
  const embed = new EmbedBuilder()
    .setColor(Colors.WARNING)
    .setDescription(`${Emojis.WARNING} ${description}`);

  if (title) embed.setTitle(title);
  return embed;
}

/**
 * Create an info embed
 */
export function infoEmbed(description, title = null) {
  const embed = new EmbedBuilder()
    .setColor(Colors.INFO)
    .setDescription(`${Emojis.INFO} ${description}`);

  if (title) embed.setTitle(title);
  return embed;
}

/**
 * Create a loading embed
 */
export function loadingEmbed(description = 'Please wait...') {
  return new EmbedBuilder()
    .setColor(Colors.INFO)
    .setDescription(`${Emojis.LOADING} ${description}`);
}

/**
 * Create a moderation embed
 */
export function modEmbed(action, user, moderator, reason, duration = null) {
  const embed = new EmbedBuilder()
    .setColor(Colors.MODERATION)
    .setTitle(`${action}`)
    .addFields(
      { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
      { name: 'Moderator', value: `${moderator.tag}`, inline: true },
      { name: 'Reason', value: reason || 'No reason provided', inline: false }
    )
    .setTimestamp();

  if (duration) {
    embed.addFields({ name: 'Duration', value: duration, inline: true });
  }

  return embed;
}

/**
 * Create a level up embed
 */
export function levelUpEmbed(user, level, rewards = null) {
  const embed = new EmbedBuilder()
    .setColor(Colors.LEVELING)
    .setTitle(`${Emojis.LEVEL_UP} Level Up!`)
    .setDescription(`Congratulations ${user}! You've reached **Level ${level}**!`)
    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
    .setTimestamp();

  if (rewards) {
    embed.addFields({ name: 'Rewards', value: rewards, inline: false });
  }

  return embed;
}

/**
 * Create an economy embed
 */
export function economyEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(Colors.ECONOMY)
    .setTitle(`${Emojis.MONEY} ${title}`)
    .setDescription(description)
    .setTimestamp();
}

/**
 * Create a ticket embed
 */
export function ticketEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(Colors.TICKET)
    .setTitle(`${Emojis.TICKET} ${title}`)
    .setDescription(description)
    .setTimestamp();
}

/**
 * Create a log embed
 */
export function logEmbed(title, description, fields = []) {
  const embed = new EmbedBuilder()
    .setColor(Colors.INFO)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();

  if (fields.length > 0) {
    embed.addFields(fields);
  }

  return embed;
}

/**
 * Create a bot embed with branding
 */
export function botEmbed(title = null, description = null) {
  const embed = new EmbedBuilder()
    .setColor(BOT_COLOR)
    .setFooter({ text: BOT_NAME });

  if (title) embed.setTitle(title);
  if (description) embed.setDescription(description);

  return embed;
}

/**
 * Create a server status embed for game servers
 */
export function serverStatusEmbed(server, isOnline, playerCount = 0, maxPlayers = 0, map = null) {
  const statusEmoji = isOnline ? Emojis.ONLINE : Emojis.OFFLINE;
  const statusText = isOnline ? 'Online' : 'Offline';

  const embed = new EmbedBuilder()
    .setColor(isOnline ? Colors.SUCCESS : Colors.ERROR)
    .setTitle(`${statusEmoji} ${server.name}`)
    .addFields(
      { name: 'Status', value: statusText, inline: true },
      { name: 'Players', value: `${playerCount}/${maxPlayers}`, inline: true }
    )
    .setTimestamp();

  if (map) {
    embed.addFields({ name: 'Map', value: map, inline: true });
  }

  return embed;
}

export default {
  successEmbed,
  errorEmbed,
  warningEmbed,
  infoEmbed,
  loadingEmbed,
  modEmbed,
  levelUpEmbed,
  economyEmbed,
  ticketEmbed,
  logEmbed,
  botEmbed,
  serverStatusEmbed
};
