// Message reaction add event
// Created by ImVylo

export default {
  name: 'messageReactionAdd',
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
      await reactionRolesModule.handleReactionAdd(reaction, user);
    }

    // Handle giveaway entries
    const giveawayModule = client.getModule('giveaways');
    if (giveawayModule) {
      await giveawayModule.handleReactionAdd(reaction, user);
    }
  }
};
