// Guild member remove event
// Created by ImVylo

export default {
  name: 'guildMemberRemove',
  once: false,

  async execute(client, member) {
    // Handle leave message
    const welcomeModule = client.getModule('welcome');
    if (welcomeModule) {
      await welcomeModule.handleMemberLeave(member);
    }

    // Log member leave
    const loggingModule = client.getModule('logging');
    if (loggingModule) {
      await loggingModule.logMemberLeave(member);
    }
  }
};
