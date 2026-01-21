// Permission system for HyVornBot
// Created by ImVylo

import { PermissionsBitField } from 'discord.js';
import { BOT_OWNER_ID, PermissionLevels } from '../utils/constants.js';
import db from './Database.js';

/**
 * Get user's permission level
 * @param {GuildMember} member - Discord guild member
 * @param {Guild} guild - Discord guild
 * @returns {number} Permission level
 */
export function getPermissionLevel(member, guild) {
  // Bot owner has highest permission
  if (member.id === BOT_OWNER_ID) {
    return PermissionLevels.BOT_OWNER;
  }

  // Server owner
  if (member.id === guild.ownerId) {
    return PermissionLevels.SERVER_OWNER;
  }

  // Get guild settings for custom admin/mod roles
  const guildSettings = db.getGuild(guild.id).settings;
  const adminRoles = guildSettings.adminRoles || [];
  const modRoles = guildSettings.modRoles || [];

  // Check admin roles
  if (adminRoles.some(roleId => member.roles.cache.has(roleId))) {
    return PermissionLevels.ADMIN;
  }

  // Check if member has Administrator permission
  if (member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return PermissionLevels.ADMIN;
  }

  // Check mod roles
  if (modRoles.some(roleId => member.roles.cache.has(roleId))) {
    return PermissionLevels.MODERATOR;
  }

  // Check if member has moderation permissions
  const modPerms = [
    PermissionsBitField.Flags.KickMembers,
    PermissionsBitField.Flags.BanMembers,
    PermissionsBitField.Flags.ManageMessages,
    PermissionsBitField.Flags.ModerateMembers
  ];

  if (modPerms.some(perm => member.permissions.has(perm))) {
    return PermissionLevels.MODERATOR;
  }

  return PermissionLevels.USER;
}

/**
 * Check if user has required permission level
 * @param {GuildMember} member - Discord guild member
 * @param {Guild} guild - Discord guild
 * @param {number} requiredLevel - Required permission level
 * @returns {boolean}
 */
export function hasPermissionLevel(member, guild, requiredLevel) {
  return getPermissionLevel(member, guild) >= requiredLevel;
}

/**
 * Check if user is bot owner
 * @param {string} userId - User ID
 * @returns {boolean}
 */
export function isBotOwner(userId) {
  return userId === BOT_OWNER_ID;
}

/**
 * Check if user is server owner
 * @param {GuildMember} member - Discord guild member
 * @param {Guild} guild - Discord guild
 * @returns {boolean}
 */
export function isServerOwner(member, guild) {
  return member.id === guild.ownerId;
}

/**
 * Check if user is admin
 * @param {GuildMember} member - Discord guild member
 * @param {Guild} guild - Discord guild
 * @returns {boolean}
 */
export function isAdmin(member, guild) {
  return hasPermissionLevel(member, guild, PermissionLevels.ADMIN);
}

/**
 * Check if user is moderator
 * @param {GuildMember} member - Discord guild member
 * @param {Guild} guild - Discord guild
 * @returns {boolean}
 */
export function isModerator(member, guild) {
  return hasPermissionLevel(member, guild, PermissionLevels.MODERATOR);
}

/**
 * Check if user can moderate target
 * @param {GuildMember} moderator - Moderator member
 * @param {GuildMember} target - Target member
 * @returns {boolean}
 */
export function canModerate(moderator, target) {
  // Bot owner can moderate anyone
  if (isBotOwner(moderator.id)) return true;

  // Can't moderate server owner
  if (target.id === target.guild.ownerId) return false;

  // Can't moderate bot owner
  if (isBotOwner(target.id)) return false;

  // Check role hierarchy
  return moderator.roles.highest.position > target.roles.highest.position;
}

/**
 * Get permission level name
 * @param {number} level - Permission level
 * @returns {string}
 */
export function getPermissionLevelName(level) {
  switch (level) {
    case PermissionLevels.BOT_OWNER:
      return 'Bot Owner';
    case PermissionLevels.SERVER_OWNER:
      return 'Server Owner';
    case PermissionLevels.ADMIN:
      return 'Administrator';
    case PermissionLevels.MODERATOR:
      return 'Moderator';
    default:
      return 'User';
  }
}

/**
 * Format Discord permissions for display
 * @param {PermissionsBitField} permissions - Discord permissions
 * @returns {string[]}
 */
export function formatPermissions(permissions) {
  const permNames = {
    Administrator: 'Administrator',
    ManageGuild: 'Manage Server',
    ManageRoles: 'Manage Roles',
    ManageChannels: 'Manage Channels',
    ManageMessages: 'Manage Messages',
    ManageWebhooks: 'Manage Webhooks',
    ManageEmojisAndStickers: 'Manage Emojis',
    KickMembers: 'Kick Members',
    BanMembers: 'Ban Members',
    ModerateMembers: 'Timeout Members',
    MentionEveryone: 'Mention Everyone',
    ViewAuditLog: 'View Audit Log'
  };

  return Object.entries(permNames)
    .filter(([perm]) => permissions.has(PermissionsBitField.Flags[perm]))
    .map(([, name]) => name);
}

export default {
  getPermissionLevel,
  hasPermissionLevel,
  isBotOwner,
  isServerOwner,
  isAdmin,
  isModerator,
  canModerate,
  getPermissionLevelName,
  formatPermissions
};
