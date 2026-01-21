// Command Handler for HyVornBot
// Created by ImVylo

import { Collection, REST, Routes, MessageFlags } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { PermissionLevels } from '../utils/constants.js';
import { getPermissionLevel, hasPermissionLevel } from './Permissions.js';
import { errorEmbed } from '../utils/embeds.js';
import { formatDuration } from '../utils/time.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class CommandHandler {
  constructor(client) {
    this.client = client;
    this.log = client.logger.child('Commands');
    this.commandsPath = path.join(__dirname, '../commands');
  }

  /**
   * Load all commands from the commands directory
   */
  async loadCommands() {
    this.log.info('Loading commands...');

    const categories = fs.readdirSync(this.commandsPath).filter(file => {
      const filePath = path.join(this.commandsPath, file);
      return fs.statSync(filePath).isDirectory();
    });

    let loadedCount = 0;
    const slashCommands = [];

    for (const category of categories) {
      const categoryPath = path.join(this.commandsPath, category);
      const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));

      for (const file of commandFiles) {
        try {
          const filePath = path.join(categoryPath, file);
          const fileUrl = pathToFileURL(filePath).href;
          const command = await import(fileUrl);

          if (command.default) {
            const cmd = command.default;
            cmd.category = category;

            // Register command
            this.client.commands.set(cmd.name, cmd);

            // Register aliases
            if (cmd.aliases && Array.isArray(cmd.aliases)) {
              for (const alias of cmd.aliases) {
                this.client.aliases.set(alias, cmd.name);
              }
            }

            // Add to slash commands array if it's a slash command
            if (cmd.data) {
              slashCommands.push(cmd.data.toJSON());
              this.client.slashCommands.set(cmd.data.name, cmd);
            }

            loadedCount++;
            this.log.debug(`Loaded command: ${cmd.name} (${category})`);
          }
        } catch (error) {
          this.log.error(`Failed to load command ${file}:`, error.message);
        }
      }
    }

    this.log.success(`Loaded ${loadedCount} commands`);

    // Store slash commands for registration
    this.slashCommandsData = slashCommands;
  }

  /**
   * Register slash commands with Discord
   */
  async registerSlashCommands() {
    // Build slash commands data from client.slashCommands (includes plugin commands)
    const slashCommandsData = [];
    for (const [name, command] of this.client.slashCommands) {
      if (command.data) {
        slashCommandsData.push(command.data.toJSON ? command.data.toJSON() : command.data);
      }
    }

    if (slashCommandsData.length === 0) {
      this.log.warn('No slash commands to register');
      return;
    }

    const rest = new REST({ version: '10' }).setToken(this.client.config.token);

    try {
      this.log.info(`Registering ${slashCommandsData.length} slash commands...`);

      if (this.client.config.devGuildId) {
        // Clear global commands first to avoid duplicates
        await rest.put(
          Routes.applicationCommands(this.client.config.clientId),
          { body: [] }
        );

        // Register to dev guild for testing
        await rest.put(
          Routes.applicationGuildCommands(this.client.config.clientId, this.client.config.devGuildId),
          { body: slashCommandsData }
        );
        this.log.success(`Registered slash commands to dev guild`);
      } else {
        // Register globally
        await rest.put(
          Routes.applicationCommands(this.client.config.clientId),
          { body: slashCommandsData }
        );
        this.log.success(`Registered slash commands globally`);
      }
    } catch (error) {
      this.log.error('Failed to register slash commands:', error.message);
    }
  }

  /**
   * Handle prefix command
   * @param {Message} message - Discord message
   */
  async handlePrefixCommand(message) {
    const prefix = this.client.getPrefix(message.guild?.id);

    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    // Get command by name or alias
    const command = this.client.commands.get(commandName) ||
      this.client.commands.get(this.client.aliases.get(commandName));

    if (!command) return;

    // Check if command is guild only
    if (command.guildOnly && !message.guild) {
      return message.reply({ embeds: [errorEmbed('This command can only be used in a server.')] });
    }

    // Check member role requirement (skip for users with Manage Server)
    if (message.guild && !message.member.permissions.has('ManageGuild')) {
      const memberRole = this.client.db.getSetting(message.guild.id, 'memberRole');
      if (memberRole && !message.member.roles.cache.has(memberRole)) {
        return message.reply({ embeds: [errorEmbed('You need to be a verified member to use bot commands.')] });
      }
    }

    // Check permissions
    if (command.permissionLevel !== undefined && message.guild) {
      if (!hasPermissionLevel(message.member, message.guild, command.permissionLevel)) {
        return message.reply({ embeds: [errorEmbed('You do not have permission to use this command.')] });
      }
    }

    // Check bot permissions
    if (command.botPermissions && message.guild) {
      const missing = message.guild.members.me.permissions.missing(command.botPermissions);
      if (missing.length > 0) {
        return message.reply({
          embeds: [errorEmbed(`I'm missing permissions: ${missing.join(', ')}`)]
        });
      }
    }

    // Check cooldown
    const cooldownResult = this.checkCooldown(message.author.id, command);
    if (cooldownResult.onCooldown) {
      return message.reply({
        embeds: [errorEmbed(`Please wait ${formatDuration(cooldownResult.remaining, true)} before using this command again.`)]
      });
    }

    // Execute command
    try {
      this.client.stats.commandsRun++;
      await command.execute(message, args, this.client);
    } catch (error) {
      this.log.error(`Error executing command ${command.name}:`, error);
      message.reply({ embeds: [errorEmbed('An error occurred while executing this command.')] });
    }
  }

  /**
   * Handle slash command
   * @param {Interaction} interaction - Discord interaction
   */
  async handleSlashCommand(interaction) {
    const command = this.client.slashCommands.get(interaction.commandName);

    if (!command) return;

    // Check member role requirement (skip for users with Manage Server)
    if (interaction.guild && !interaction.member.permissions.has('ManageGuild')) {
      const memberRole = this.client.db.getSetting(interaction.guild.id, 'memberRole');
      if (memberRole && !interaction.member.roles.cache.has(memberRole)) {
        return interaction.reply({
          embeds: [errorEmbed('You need to be a verified member to use bot commands.')],
          flags: MessageFlags.Ephemeral
        });
      }
    }

    // Check permissions
    if (command.permissionLevel !== undefined) {
      if (!hasPermissionLevel(interaction.member, interaction.guild, command.permissionLevel)) {
        return interaction.reply({
          embeds: [errorEmbed('You do not have permission to use this command.')],
          flags: MessageFlags.Ephemeral
        });
      }
    }

    // Check bot permissions
    if (command.botPermissions && interaction.guild) {
      const missing = interaction.guild.members.me.permissions.missing(command.botPermissions);
      if (missing.length > 0) {
        return interaction.reply({
          embeds: [errorEmbed(`I'm missing permissions: ${missing.join(', ')}`)],
          flags: MessageFlags.Ephemeral
        });
      }
    }

    // Check cooldown
    const cooldownResult = this.checkCooldown(interaction.user.id, command);
    if (cooldownResult.onCooldown) {
      return interaction.reply({
        embeds: [errorEmbed(`Please wait ${formatDuration(cooldownResult.remaining, true)} before using this command again.`)],
        flags: MessageFlags.Ephemeral
      });
    }

    // Execute command
    try {
      this.client.stats.commandsRun++;
      await command.execute(interaction, this.client);
    } catch (error) {
      this.log.error(`Error executing slash command ${command.data.name}:`, error);

      const errorResponse = { embeds: [errorEmbed('An error occurred while executing this command.')], flags: MessageFlags.Ephemeral };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorResponse);
      } else {
        await interaction.reply(errorResponse);
      }
    }
  }

  /**
   * Check command cooldown
   * @param {string} userId - User ID
   * @param {Object} command - Command object
   * @returns {Object} Cooldown check result
   */
  checkCooldown(userId, command) {
    const cooldownAmount = (command.cooldown || 3) * 1000;
    const commandName = command.name || command.data?.name;

    if (!this.client.cooldowns.has(commandName)) {
      this.client.cooldowns.set(commandName, new Collection());
    }

    const now = Date.now();
    const timestamps = this.client.cooldowns.get(commandName);

    if (timestamps.has(userId)) {
      const expirationTime = timestamps.get(userId) + cooldownAmount;

      if (now < expirationTime) {
        return {
          onCooldown: true,
          remaining: expirationTime - now
        };
      }
    }

    timestamps.set(userId, now);
    setTimeout(() => timestamps.delete(userId), cooldownAmount);

    return { onCooldown: false };
  }

  /**
   * Reload a specific command
   * @param {string} commandName - Command name
   * @returns {boolean} Success
   */
  async reloadCommand(commandName) {
    const command = this.client.commands.get(commandName) ||
      this.client.commands.get(this.client.aliases.get(commandName));

    if (!command) return false;

    const filePath = path.join(this.commandsPath, command.category, `${command.name}.js`);

    try {
      // Delete from cache
      const fileUrl = pathToFileURL(filePath).href;
      delete require.cache[require.resolve(fileUrl)];

      // Reload
      const newCommand = await import(`${fileUrl}?t=${Date.now()}`);

      if (newCommand.default) {
        newCommand.default.category = command.category;
        this.client.commands.set(newCommand.default.name, newCommand.default);

        if (newCommand.default.data) {
          this.client.slashCommands.set(newCommand.default.data.name, newCommand.default);
        }

        this.log.info(`Reloaded command: ${commandName}`);
        return true;
      }
    } catch (error) {
      this.log.error(`Failed to reload command ${commandName}:`, error);
    }

    return false;
  }

  /**
   * Get all commands by category
   * @returns {Object} Commands grouped by category
   */
  getCommandsByCategory() {
    const categories = {};

    for (const [name, command] of this.client.commands) {
      const category = command.category || 'misc';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(command);
    }

    return categories;
  }
}

export default CommandHandler;
export { CommandHandler };
