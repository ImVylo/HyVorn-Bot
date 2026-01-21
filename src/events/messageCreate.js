// Message create event
// Created by ImVylo

export default {
  name: 'messageCreate',
  once: false,

  async execute(client, message) {
    // Ignore bots
    if (message.author.bot) return;

    // Increment stats
    client.stats.messagesReceived++;

    // Process in guild only for most features
    if (message.guild) {
      // AutoMod check
      const automod = client.getModule('automod');
      if (automod) {
        const blocked = await automod.processMessage(message);
        if (blocked) return;
      }

      // XP/Leveling
      const leveling = client.getModule('leveling');
      if (leveling) {
        await leveling.processMessage(message);
      }

      // AFK check
      await checkAFK(client, message);
    }

    // Handle prefix commands
    await client.commandHandler.handlePrefixCommand(message);
  }
};

/**
 * Check and handle AFK mentions
 */
async function checkAFK(client, message) {
  const guildSettings = client.db.getGuild(message.guild.id).settings;
  const afkUsers = guildSettings.afkUsers || {};

  // Check if message author is AFK
  if (afkUsers[message.author.id]) {
    delete afkUsers[message.author.id];
    client.db.setSetting(message.guild.id, 'afkUsers', afkUsers);

    try {
      await message.reply({
        content: 'Welcome back! I\'ve removed your AFK status.',
        allowedMentions: { repliedUser: false }
      });

      // Try to remove [AFK] from nickname
      if (message.member.nickname?.startsWith('[AFK] ')) {
        const newNick = message.member.nickname.replace('[AFK] ', '');
        await message.member.setNickname(newNick).catch(() => {});
      }
    } catch (error) {
      // Ignore errors
    }
  }

  // Check mentioned users for AFK
  for (const [userId, user] of message.mentions.users) {
    if (afkUsers[userId]) {
      const afkData = afkUsers[userId];
      const afkTime = new Date(afkData.since);
      const timeAgo = formatTimeAgo(afkTime);

      try {
        await message.reply({
          content: `**${user.username}** is AFK: ${afkData.reason || 'No reason provided'} (${timeAgo})`,
          allowedMentions: { repliedUser: false }
        });
      } catch (error) {
        // Ignore errors
      }
    }
  }
}

/**
 * Format time ago string
 */
function formatTimeAgo(date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
