// Example Plugin for HyVornBot
// This demonstrates how to create plugins for HyVornBot
// Created by ImVylo

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { BOT_COLOR } from '../../src/utils/constants.js';

class ExamplePlugin {
  constructor(client) {
    this.client = client;
    this.log = client.logger.child('ExamplePlugin');
    this.commands = []; // Track registered commands for cleanup
  }

  /**
   * Initialize the plugin
   * Called when the plugin is loaded
   */
  async init() {
    this.log.info('Example plugin initializing...');

    // Register custom commands
    this.registerCommands();

    // Register event listeners
    this.registerEvents();

    this.log.success('Example plugin loaded!');
  }

  /**
   * Register plugin commands
   */
  registerCommands() {
    // Example: Custom hello command
    const helloCommand = {
      name: 'hello',
      description: 'A friendly greeting from the example plugin',
      category: 'plugins',
      cooldown: 5,

      data: new SlashCommandBuilder()
        .setName('hello')
        .setDescription('A friendly greeting from the example plugin')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('User to greet')
            .setRequired(false)
        ),

      execute: async (interaction, client) => {
        const isSlash = interaction.isChatInputCommand?.();
        const user = isSlash
          ? interaction.options.getUser('user') || interaction.user
          : interaction.author;

        const greetings = [
          `Hello there, ${user}! 👋`,
          `Hey ${user}! How's it going? 😊`,
          `Greetings, ${user}! 🌟`,
          `Hi ${user}! Nice to see you! 🎉`,
          `What's up, ${user}? 🚀`
        ];

        const greeting = greetings[Math.floor(Math.random() * greetings.length)];

        const embed = new EmbedBuilder()
          .setColor(BOT_COLOR)
          .setTitle('👋 Hello!')
          .setDescription(greeting)
          .setFooter({ text: 'From: Example Plugin' })
          .setTimestamp();

        if (isSlash) {
          await interaction.reply({ embeds: [embed] });
        } else {
          await interaction.reply({ embeds: [embed] });
        }
      }
    };

    // Register the command
    this.client.commands.set(helloCommand.name, helloCommand);
    this.client.slashCommands.set(helloCommand.name, helloCommand);
    this.commands.push(helloCommand.name);

    this.log.debug('Registered command: hello');
  }

  /**
   * Register event listeners
   */
  registerEvents() {
    // Example: Log when someone mentions the bot
    this.mentionHandler = (message) => {
      if (message.mentions.has(this.client.user) && !message.author.bot) {
        this.log.info(`Bot mentioned by ${message.author.tag} in ${message.guild?.name || 'DM'}`);
      }
    };

    this.client.on('messageCreate', this.mentionHandler);
    this.log.debug('Registered event listener: messageCreate');
  }

  /**
   * Cleanup when plugin is unloaded
   */
  async cleanup() {
    this.log.info('Example plugin cleaning up...');

    // Remove event listeners
    if (this.mentionHandler) {
      this.client.off('messageCreate', this.mentionHandler);
    }

    // Commands are removed by PluginLoader based on this.commands array

    this.log.success('Example plugin unloaded!');
  }
}

export default ExamplePlugin;
