// HyVornBot Constants
// Created by ImVylo

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(join(__dirname, '../../config.json'), 'utf8'));

export const BOT_NAME = config.botName || 'HyVornBot';
export const BOT_AUTHOR = 'ImVylo';
export const BOT_OWNER_ID = config.ownerId;
export const BOT_COLOR = 0x5865F2; // Discord blurple
export const BOT_VERSION = '1.0.0';

// Colors for embeds
export const Colors = {
  PRIMARY: 0x5865F2,
  SUCCESS: 0x57F287,
  WARNING: 0xFEE75C,
  ERROR: 0xED4245,
  INFO: 0x5865F2,
  MODERATION: 0xEB459E,
  ECONOMY: 0xF1C40F,
  LEVELING: 0x9B59B6,
  TICKET: 0x3498DB
};

// Emojis
export const Emojis = {
  SUCCESS: '✅',
  ERROR: '❌',
  WARNING: '⚠️',
  INFO: 'ℹ️',
  LOADING: '⏳',
  MONEY: '💰',
  STAR: '⭐',
  TROPHY: '🏆',
  TICKET: '🎫',
  LOCK: '🔒',
  UNLOCK: '🔓',
  BAN: '🔨',
  KICK: '👢',
  MUTE: '🔇',
  WARN: '⚠️',
  LEVEL_UP: '🎉',
  XP: '✨',
  ONLINE: '🟢',
  OFFLINE: '🔴',
  IDLE: '🟡',
  DND: '🔴'
};

// Cooldowns (in milliseconds)
export const Cooldowns = {
  XP: 60000,           // 1 minute
  DAILY: 86400000,     // 24 hours
  WORK: 3600000,       // 1 hour
  ROB: 7200000,        // 2 hours
  COMMAND: 3000        // 3 seconds default
};

// XP Settings defaults
export const XPDefaults = {
  MIN_XP: 15,
  MAX_XP: 25,
  LEVEL_MULTIPLIER: 100  // XP needed = level * multiplier
};

// Economy defaults
export const EconomyDefaults = {
  STARTING_BALANCE: 0,
  DAILY_AMOUNT: 100,
  WORK_MIN: 50,
  WORK_MAX: 200,
  ROB_SUCCESS_CHANCE: 0.4,
  ROB_FINE_PERCENT: 0.2,
  BANK_INTEREST_RATE: 0.01
};

// AutoMod defaults
export const AutoModDefaults = {
  MAX_MESSAGES_PER_INTERVAL: 5,
  MESSAGE_INTERVAL: 5000,
  MAX_MENTIONS: 5,
  MAX_CAPS_PERCENT: 70,
  MIN_CAPS_LENGTH: 10,
  MAX_NEWLINES: 10
};

// Ticket settings
export const TicketDefaults = {
  AUTO_CLOSE_HOURS: 48,
  MAX_TICKETS_PER_USER: 3
};

// Permissions
export const PermissionLevels = {
  USER: 0,
  MODERATOR: 1,
  ADMIN: 2,
  SERVER_OWNER: 3,
  BOT_OWNER: 4
};

// Log types - mapped to log channel categories
export const LogTypes = {
  MESSAGE_DELETE: 'messages',
  MESSAGE_EDIT: 'messages',
  MESSAGE_BULK_DELETE: 'messages',
  MEMBER_JOIN: 'joins',
  MEMBER_LEAVE: 'joins',
  MEMBER_BAN: 'moderation',
  MEMBER_UNBAN: 'moderation',
  MEMBER_KICK: 'moderation',
  MEMBER_UPDATE: 'users',
  ROLE_CHANGE: 'users',
  NICKNAME_CHANGE: 'users',
  VOICE_JOIN: 'voice',
  VOICE_LEAVE: 'voice',
  VOICE_MOVE: 'voice',
  MODERATION: 'moderation',
  AUTOMOD: 'automod',
  INVITE: 'invites'
};

// Log channel setting keys
export const LogChannels = {
  joins: 'logChannelJoins',
  messages: 'logChannelMessages',
  users: 'logChannelUsers',
  moderation: 'logChannelModeration',
  automod: 'logChannelAutomod',
  invites: 'logChannelInvites',
  voice: 'logChannelVoice'
};
