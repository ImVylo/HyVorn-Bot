// Guild member add event
// Created by ImVylo

export default {
  name: 'guildMemberAdd',
  once: false,

  async execute(client, member) {
    // Handle welcome message
    const welcomeModule = client.getModule('welcome');
    if (welcomeModule) {
      await welcomeModule.handleMemberJoin(member);
    }

    // Log member join
    const loggingModule = client.getModule('logging');
    if (loggingModule) {
      await loggingModule.logMemberJoin(member);
    }

    // Track which invite was used
    await trackInviteUsage(client, member, loggingModule);

    // Assign auto-role if configured
    await assignAutoRole(client, member);

    // Anti-raid check
    const automodModule = client.getModule('automod');
    if (automodModule) {
      await automodModule.checkRaid(member);
    }
  }
};

async function trackInviteUsage(client, member, loggingModule) {
  try {
    if (!client.inviteCache) {
      client.inviteCache = new Map();
    }

    const cachedInvites = client.inviteCache.get(member.guild.id) || new Map();
    const newInvites = await member.guild.invites.fetch();

    // Find the invite that was used
    const usedInvite = newInvites.find(invite => {
      const cached = cachedInvites.get(invite.code);
      return cached && invite.uses > cached.uses;
    });

    // Update cache
    const newCache = new Map();
    newInvites.forEach(invite => {
      newCache.set(invite.code, {
        code: invite.code,
        uses: invite.uses,
        inviter: invite.inviter
      });
    });
    client.inviteCache.set(member.guild.id, newCache);

    // Log invite usage
    if (usedInvite && loggingModule) {
      await loggingModule.logInviteUse(member, usedInvite);
    }
  } catch (error) {
    // Ignore invite tracking errors (bot might not have permission)
  }
}

async function assignAutoRole(client, member) {
  try {
    const settings = client.db.getGuild(member.guild.id).settings;
    const autoRoleId = settings.autoRole;

    if (!autoRoleId) return;

    // Get the role
    const role = member.guild.roles.cache.get(autoRoleId);
    if (!role) {
      client.logger.warn('AutoRole', `Auto-role ${autoRoleId} not found in guild ${member.guild.id}`);
      return;
    }

    // Check if bot can assign this role
    const botMember = member.guild.members.me;
    if (role.position >= botMember.roles.highest.position) {
      client.logger.warn('AutoRole', `Cannot assign role ${role.name} - higher than bot's highest role`);
      return;
    }

    // Don't assign to bots (optional, depending on preference)
    if (member.user.bot) return;

    // Assign the role
    await member.roles.add(role, 'Auto-role on join');
    client.logger.debug('AutoRole', `Assigned ${role.name} to ${member.user.tag}`);
  } catch (error) {
    client.logger.error('AutoRole', `Failed to assign auto-role: ${error.message}`);
  }
}
