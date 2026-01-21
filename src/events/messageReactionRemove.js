// Message reaction remove event
// Created by ImVylo

export default {
  name: 'messageReactionRemove',
  once: false,

  async execute(client, reaction, user) {
    // Ignore bots
    if (user.bot) return;

    // Fetch partial reactions
    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (error) {
        return;
      }
    }

    // Handle reaction roles
    const reactionRolesModule = client.getModule('reactionroles');
    if (reactionRolesModule) {
      await reactionRolesModule.handleReactionRemove(reaction, user);
    }
  }
};
