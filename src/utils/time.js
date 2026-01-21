// Time utility functions
// Created by ImVylo

/**
 * Parse a duration string to milliseconds
 * Supports: s, m, h, d, w (seconds, minutes, hours, days, weeks)
 * @param {string} duration - Duration string like "1h", "30m", "7d"
 * @returns {number|null} Milliseconds or null if invalid
 */
export function parseDuration(duration) {
  if (!duration) return null;

  const match = duration.match(/^(\d+)(s|m|h|d|w)$/i);
  if (!match) return null;

  const amount = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000
  };

  return amount * multipliers[unit];
}

/**
 * Format milliseconds to a human-readable string
 * @param {number} ms - Milliseconds
 * @param {boolean} short - Use short format (1h 30m) vs long format (1 hour 30 minutes)
 * @returns {string} Formatted duration
 */
export function formatDuration(ms, short = false) {
  if (!ms || ms < 0) return short ? '0s' : '0 seconds';

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);

  const parts = [];

  if (weeks > 0) {
    parts.push(short ? `${weeks}w` : `${weeks} week${weeks !== 1 ? 's' : ''}`);
  }
  if (days % 7 > 0) {
    parts.push(short ? `${days % 7}d` : `${days % 7} day${days % 7 !== 1 ? 's' : ''}`);
  }
  if (hours % 24 > 0) {
    parts.push(short ? `${hours % 24}h` : `${hours % 24} hour${hours % 24 !== 1 ? 's' : ''}`);
  }
  if (minutes % 60 > 0) {
    parts.push(short ? `${minutes % 60}m` : `${minutes % 60} minute${minutes % 60 !== 1 ? 's' : ''}`);
  }
  if (seconds % 60 > 0 && parts.length < 2) {
    parts.push(short ? `${seconds % 60}s` : `${seconds % 60} second${seconds % 60 !== 1 ? 's' : ''}`);
  }

  if (parts.length === 0) {
    return short ? '0s' : '0 seconds';
  }

  return short ? parts.join(' ') : parts.join(', ');
}

/**
 * Get a relative time string (e.g., "2 hours ago", "in 3 days")
 * @param {Date|number} date - Date object or timestamp
 * @returns {string} Relative time string
 */
export function relativeTime(date) {
  const now = Date.now();
  const timestamp = date instanceof Date ? date.getTime() : date;
  const diff = timestamp - now;
  const absDiff = Math.abs(diff);
  const isPast = diff < 0;

  const seconds = Math.floor(absDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  let value, unit;

  if (years > 0) {
    value = years;
    unit = years === 1 ? 'year' : 'years';
  } else if (months > 0) {
    value = months;
    unit = months === 1 ? 'month' : 'months';
  } else if (weeks > 0) {
    value = weeks;
    unit = weeks === 1 ? 'week' : 'weeks';
  } else if (days > 0) {
    value = days;
    unit = days === 1 ? 'day' : 'days';
  } else if (hours > 0) {
    value = hours;
    unit = hours === 1 ? 'hour' : 'hours';
  } else if (minutes > 0) {
    value = minutes;
    unit = minutes === 1 ? 'minute' : 'minutes';
  } else {
    value = seconds;
    unit = seconds === 1 ? 'second' : 'seconds';
  }

  if (isPast) {
    return `${value} ${unit} ago`;
  } else {
    return `in ${value} ${unit}`;
  }
}

/**
 * Format a date to a Discord timestamp
 * @param {Date|number} date - Date object or timestamp
 * @param {string} style - Discord timestamp style (t, T, d, D, f, F, R)
 * @returns {string} Discord timestamp string
 */
export function discordTimestamp(date, style = 'f') {
  const timestamp = date instanceof Date ? Math.floor(date.getTime() / 1000) : Math.floor(date / 1000);
  return `<t:${timestamp}:${style}>`;
}

/**
 * Get the time until a specific date
 * @param {Date|number} date - Target date
 * @returns {number} Milliseconds until the date
 */
export function timeUntil(date) {
  const timestamp = date instanceof Date ? date.getTime() : date;
  return timestamp - Date.now();
}

/**
 * Check if enough time has passed since a timestamp
 * @param {number} timestamp - Last action timestamp
 * @param {number} cooldown - Cooldown in milliseconds
 * @returns {boolean} Whether the cooldown has passed
 */
export function cooldownPassed(timestamp, cooldown) {
  if (!timestamp) return true;
  return Date.now() - timestamp >= cooldown;
}

/**
 * Get remaining cooldown time
 * @param {number} timestamp - Last action timestamp
 * @param {number} cooldown - Cooldown in milliseconds
 * @returns {number} Remaining time in milliseconds (0 if cooldown passed)
 */
export function getRemainingCooldown(timestamp, cooldown) {
  if (!timestamp) return 0;
  const remaining = cooldown - (Date.now() - timestamp);
  return remaining > 0 ? remaining : 0;
}

/**
 * Sleep for a specified duration
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get midnight of the current day (UTC)
 * @returns {Date}
 */
export function getMidnight() {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  return now;
}

/**
 * Check if a date is today (UTC)
 * @param {Date|string} date - Date to check
 * @returns {boolean}
 */
export function isToday(date) {
  const checkDate = new Date(date);
  const today = new Date();
  return checkDate.toDateString() === today.toDateString();
}

// Alias for backwards compatibility
export const parseTime = parseDuration;

export default {
  parseDuration,
  parseTime,
  formatDuration,
  relativeTime,
  discordTimestamp,
  timeUntil,
  cooldownPassed,
  getRemainingCooldown,
  sleep,
  getMidnight,
  isToday
};
