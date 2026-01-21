// Extended Discord Client for HyVornBot
// Created by ImVylo

import { Client, Collection, GatewayIntentBits, Partials } from 'discord.js';
import { BOT_NAME, BOT_VERSION, BOT_AUTHOR, BOT_OWNER_ID } from '../utils/constants.js';
import logger from './Logger.js';
import db from './Database.js';

class HyVornClient extends Client {
  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.MessageContent
      ],
      partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
        Partials.User,
        Partials.GuildMember
      ],
      allowedMentions: {
        parse: ['users', 'roles'],
        repliedUser: true
      }
    });

    // Bot info
    this.botName = BOT_NAME;
    this.botVersion = BOT_VERSION;
    this.botAuthor = BOT_AUTHOR;
    this.ownerId = BOT_OWNER_ID;

    // Collections
    this.commands = new Collection();
    this.slashCommands = new Collection();
    this.aliases = new Collection();
    this.cooldowns = new Collection();
    this.plugins = new Collection();
    this.modules = new Collection();

    // Logger
    this.logger = logger;
    this.log = logger.child('Client');

    // Database
    this.db = db;

    // Config (set during init)
    this.config = null;

    // Handlers (set during init)
    this.commandHandler = null;
    this.eventHandler = null;
    this.pluginLoader = null;

    // Stats
    this.stats = {
      commandsRun: 0,
      messagesReceived: 0,
      startTime: null
    };
  }

  /**
   * Initialize the bot
   * @param {Object} config - Bot configuration
   */
  async init(config) {
    this.config = config;
    this.stats.startTime = Date.now();

    this.log.info('Initializing HyVornBot...');
    this.log.info(`Version: ${this.botVersion}`);
    this.log.info(`Author: ${this.botAuthor}`);

    // Initialize database
    this.db.init();

    // Initialize handlers
    const { CommandHandler } = await import('./CommandHandler.js');
    const { EventHandler } = await import('./EventHandler.js');
    const { PluginLoader } = await import('./PluginLoader.js');

    this.commandHandler = new CommandHandler(this);
    this.eventHandler = new EventHandler(this);
    this.pluginLoader = new PluginLoader(this);

    // Load commands, events, and plugins
    await this.commandHandler.loadCommands();
    await this.eventHandler.loadEvents();
    await this.pluginLoader.loadPlugins();

    // Initialize modules
    await this.initializeModules();

    return this;
  }

  /**
   * Initialize feature modules
   */
  async initializeModules() {
    const moduleNames = [
      'AutoMod',
      'Leveling',
      'Economy',
      'Logging',
      'Welcome',
      'ReactionRoles',
      'Giveaways',
      'Requests',
      'TempVoice',
      'Birthdays'
    ];

    for (const moduleName of moduleNames) {
      try {
        const module = await import(`../modules/${moduleName}.js`);
        if (module.default) {
          const instance = new module.default(this);
          this.modules.set(moduleName.toLowerCase(), instance);

          // Add convenient accessor properties
          const propertyName = moduleName.charAt(0).toLowerCase() + moduleName.slice(1);
          this[propertyName] = instance;

          if (typeof instance.init === 'function') {
            await instance.init();
          }
          this.log.debug(`Loaded module: ${moduleName}`);
        }
      } catch (error) {
        this.log.warn(`Failed to load module ${moduleName}: ${error.message}`);
      }
    }

    this.log.success(`Loaded ${this.modules.size} modules`);
  }

  /**
   * Get a module by name
   * @param {string} name - Module name
   * @returns {Object|undefined}
   */
  getModule(name) {
    return this.modules.get(name.toLowerCase());
  }

  /**
   * Start the bot
   * @param {string} token - Bot token
   */
  async start(token) {
    this.log.info('Connecting to Discord...');

    try {
      await this.login(token);
    } catch (error) {
      this.log.fatal('Failed to connect to Discord:', error.message);
      process.exit(1);
    }
  }

  /**
   * Get bot uptime
   * @returns {number} Uptime in milliseconds
   */
  getUptime() {
    return Date.now() - this.stats.startTime;
  }

  /**
   * Get guild prefix
   * @param {string} guildId - Guild ID
   * @returns {string}
   */
  getPrefix(guildId) {
    if (!guildId) return this.config.defaultPrefix;
    return this.db.getPrefix(guildId) || this.config.defaultPrefix;
  }

  /**
   * Check if user is bot owner
   * @param {string} userId - User ID
   * @returns {boolean}
   */
  isOwner(userId) {
    return userId === this.ownerId;
  }

  /**
   * Shutdown the bot gracefully
   */
  async shutdown() {
    this.log.info('Shutting down...');

    // Cleanup modules
    for (const [name, module] of this.modules) {
      if (typeof module.cleanup === 'function') {
        await module.cleanup();
        this.log.debug(`Cleaned up module: ${name}`);
      }
    }

    // Close database
    this.db.close();

    // Destroy client
    this.destroy();
    this.log.info('Goodbye!');
    process.exit(0);
  }
}

export default HyVornClient;
export { HyVornClient };
