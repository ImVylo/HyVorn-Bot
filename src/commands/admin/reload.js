// Reload command - Owner only
// Created by ImVylo

import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { PermissionLevels } from '../../utils/constants.js';

export default {
  name: 'reload',
  description: 'Reload commands or events',
  aliases: [],
  cooldown: 10,
  permissionLevel: PermissionLevels.BOT_OWNER,

  data: new SlashCommandBuilder()
    .setName('reload')
    .setDescription('Reload commands or events (Owner only)')
    .addStringOption(option =>
      option
        .setName('type')
        .setDescription('What to reload')
        .setRequired(true)
        .addChoices(
          { name: 'Command', value: 'command' },
          { name: 'All Commands', value: 'commands' },
          { name: 'Events', value: 'events' },
          { name: 'All', value: 'all' }
        )
    )
    .addStringOption(option =>
      option
        .setName('name')
        .setDescription('Command name (if reloading single command)')
        .setRequired(false)
    ),

  async execute(interaction, client) {
    const isSlash = interaction.isChatInputCommand?.();
    const userId = isSlash ? interaction.user.id : interaction.author.id;

    // Check owner permission
    if (!client.isOwner(userId)) {
      const embed = errorEmbed('This command is restricted to the bot owner.');
      return isSlash
        ? interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [embed] });
    }

    let type, name;
    if (isSlash) {
      type = interaction.options.getString('type');
      name = interaction.options.getString('name');
    } else {
      const args = interaction.content.split(' ').slice(1);
      type = args[0]?.toLowerCase();
      name = args[1]?.toLowerCase();
    }

    if (!type) {
      const embed = errorEmbed('Please specify what to reload: `command`, `commands`, `events`, or `all`');
      return isSlash
        ? interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [embed] });
    }

    try {
      switch (type) {
        case 'command': {
          if (!name) {
            const embed = errorEmbed('Please specify a command name to reload.');
            return isSlash
              ? interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
              : interaction.reply({ embeds: [embed] });
          }

          const success = await client.commandHandler.reloadCommand(name);
          if (success) {
            return isSlash
              ? interaction.reply({ embeds: [successEmbed(`Reloaded command: \`${name}\``)] })
              : interaction.reply({ embeds: [successEmbed(`Reloaded command: \`${name}\``)] });
          } else {
            return isSlash
              ? interaction.reply({ embeds: [errorEmbed(`Failed to reload command: \`${name}\``)] })
              : interaction.reply({ embeds: [errorEmbed(`Failed to reload command: \`${name}\``)] });
          }
        }

        case 'commands': {
          await client.commandHandler.loadCommands();
          const embed = successEmbed(`Reloaded ${client.commands.size} commands.`);
          return isSlash
            ? interaction.reply({ embeds: [embed] })
            : interaction.reply({ embeds: [embed] });
        }

        case 'events': {
          await client.eventHandler.reloadEvents();
          const embed = successEmbed('Reloaded all events.');
          return isSlash
            ? interaction.reply({ embeds: [embed] })
            : interaction.reply({ embeds: [embed] });
        }

        case 'all': {
          await client.commandHandler.loadCommands();
          await client.eventHandler.reloadEvents();
          const embed = successEmbed(`Reloaded ${client.commands.size} commands and all events.`);
          return isSlash
            ? interaction.reply({ embeds: [embed] })
            : interaction.reply({ embeds: [embed] });
        }

        default: {
          const embed = errorEmbed('Invalid type. Use `command`, `commands`, `events`, or `all`');
          return isSlash
            ? interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
            : interaction.reply({ embeds: [embed] });
        }
      }
    } catch (error) {
      client.logger.error('Reload', 'Error reloading:', error);
      const embed = errorEmbed(`Error: ${error.message}`);
      return isSlash
        ? interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [embed] });
    }
  }
};
