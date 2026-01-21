// Ready event - fired when bot is connected and ready
// Created by ImVylo

import { ActivityType } from 'discord.js';

export default {
  name: 'clientReady',
  once: true,

  async execute(client) {
    const log = client.logger.child('Ready');

    log.success(`Logged in as ${client.user.tag}`);
    log.info(`Serving ${client.guilds.cache.size} guilds`);
    log.info(`Watching ${client.users.cache.size} users`);

    // Set initial bot status
    client.user.setPresence({
      activities: [{
        name: '/help | HyVornBot',
        type: ActivityType.Watching
      }],
      status: 'online'
    });

    // Register slash commands
    await client.commandHandler.registerSlashCommands();

    // Cache invites for invite tracking
    await cacheInvites(client);

    // Start scheduled tasks
    startScheduledTasks(client);

    // Update status with player count
    await updateBotStatus(client);

    log.success('Bot is ready!');
  }
};

/**
 * Start scheduled tasks (giveaways, reminders, temp punishments)
 */
function startScheduledTasks(client) {
  const log = client.logger.child('Scheduler');

  // Check giveaways every 30 seconds
  setInterval(async () => {
    try {
      const giveawayModule = client.getModule('giveaways');
      if (giveawayModule) {
        await giveawayModule.checkGiveaways();
      }
    } catch (error) {
      log.error('Giveaway check error:', error.message);
    }
  }, 30000);

  // Check reminders every 30 seconds
  setInterval(async () => {
    try {
      const reminders = client.db.getDueReminders();
      for (const reminder of reminders) {
        try {
          const channel = await client.channels.fetch(reminder.channel_id);
          if (channel) {
            await channel.send(`<@${reminder.user_id}> Reminder: ${reminder.message}`);
          }
          client.db.deleteReminder(reminder.id);
        } catch (err) {
          // Channel might not exist anymore
          client.db.deleteReminder(reminder.id);
        }
      }
    } catch (error) {
      log.error('Reminder check error:', error.message);
    }
  }, 30000);

  // Check temp punishments every minute
  setInterval(async () => {
    try {
      const expired = client.db.getExpiredPunishments();
      for (const punishment of expired) {
        try {
          const guild = await client.guilds.fetch(punishment.guild_id);
          if (!guild) continue;

          if (punishment.type === 'mute') {
            const member = await guild.members.fetch(punishment.user_id).catch(() => null);
            if (member) {
              // Remove timeout
              await member.timeout(null, 'Mute duration expired');
            }
          } else if (punishment.type === 'ban') {
            await guild.members.unban(punishment.user_id, 'Ban duration expired');
          }

          client.db.removeTempPunishment(punishment.guild_id, punishment.user_id, punishment.type);
        } catch (err) {
          // User might have left or been unbanned manually
          client.db.removeTempPunishment(punishment.guild_id, punishment.user_id, punishment.type);
        }
      }
    } catch (error) {
      log.error('Temp punishment check error:', error.message);
    }
  }, 60000);


  // Check for expired suggestions every hour
  setInterval(async () => {
    try {
      const requestsModule = client.getModule('requests');
      if (requestsModule) {
        await requestsModule.purgeExpiredSuggestions(client);
      }
    } catch (error) {
      log.error('Suggestion purge error:', error.message);
    }
  }, 3600000); // 1 hour

  log.info('Scheduled tasks started');
}

/**
 * Cache all guild invites for invite tracking
 */
async function cacheInvites(client) {
  client.inviteCache = new Map();

  for (const guild of client.guilds.cache.values()) {
    try {
      const invites = await guild.invites.fetch();
      const guildInvites = new Map();

      invites.forEach(invite => {
        guildInvites.set(invite.code, {
          code: invite.code,
          uses: invite.uses,
          inviter: invite.inviter
        });
      });

      client.inviteCache.set(guild.id, guildInvites);
    } catch (error) {
      // Bot might not have permission to fetch invites
    }
  }
}

/**
 * Update bot status
 */
async function updateBotStatus(client) {
  client.user.setPresence({
    activities: [{
      name: '/help | HyVornBot',
      type: ActivityType.Watching
    }],
    status: 'online'
  });
}
