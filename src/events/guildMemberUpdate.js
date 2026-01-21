// Guild Member Update event - tracks role and nickname changes
// Created by ImVylo

export default {
  name: 'guildMemberUpdate',
  once: false,

  async execute(client, oldMember, newMember) {
    const loggingModule = client.getModule('logging');
    if (!loggingModule) return;

    // Check for role changes
    const oldRoles = oldMember.roles.cache;
    const newRoles = newMember.roles.cache;

    const addedRoles = newRoles.filter(role => !oldRoles.has(role.id));
    const removedRoles = oldRoles.filter(role => !newRoles.has(role.id));

    if (addedRoles.size > 0 || removedRoles.size > 0) {
      await loggingModule.logRoleChange(
        newMember,
        [...addedRoles.values()],
        [...removedRoles.values()]
      );
    }

    // Check for nickname changes
    if (oldMember.nickname !== newMember.nickname) {
      await loggingModule.logNicknameChange(
        newMember,
        oldMember.nickname,
        newMember.nickname
      );
    }
  }
};
