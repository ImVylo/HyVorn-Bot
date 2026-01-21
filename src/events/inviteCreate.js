// Invite Create event - tracks new invites
// Created by ImVylo

export default {
  name: 'inviteCreate',
  once: false,

  async execute(client, invite) {
    // Store invite in cache for tracking
    if (!client.inviteCache) {
      client.inviteCache = new Map();
    }

    if (!client.inviteCache.has(invite.guild.id)) {
      client.inviteCache.set(invite.guild.id, new Map());
    }

    client.inviteCache.get(invite.guild.id).set(invite.code, {
      code: invite.code,
      uses: invite.uses,
      inviter: invite.inviter
    });
  }
};
