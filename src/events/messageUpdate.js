// Message update event
// Created by ImVylo

export default {
  name: 'messageUpdate',
  once: false,

  async execute(client, oldMessage, newMessage) {
    // Ignore partials, bots, and unchanged content
    if (oldMessage.partial || newMessage.partial) return;
    if (oldMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;

    // Log message edit
    const loggingModule = client.getModule('logging');
    if (loggingModule) {
      await loggingModule.logMessageEdit(oldMessage, newMessage);
    }

    // AutoMod check on edited message
    const automodModule = client.getModule('automod');
    if (automodModule && newMessage.guild) {
      await automodModule.processMessage(newMessage);
    }
  }
};
