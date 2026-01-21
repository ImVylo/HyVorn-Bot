// Message delete event
// Created by ImVylo

export default {
  name: 'messageDelete',
  once: false,

  async execute(client, message) {
    // Ignore partials and bot messages
    if (message.partial || message.author?.bot) return;

    // Log message delete
    const loggingModule = client.getModule('logging');
    if (loggingModule) {
      await loggingModule.logMessageDelete(message);
    }
  }
};
