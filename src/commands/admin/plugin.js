// Plugin management command
// Created by ImVylo

import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { BOT_COLOR, PermissionLevels, Emojis } from '../../utils/constants.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';

export default {
  name: 'plugin',
  description: 'Manage bot plugins',
  aliases: ['plugins'],
  cooldown: 5,
  permissionLevel: PermissionLevels.BOT_OWNER,

  data: new SlashCommandBuilder()
    .setName('plugin')
    .setDescription('Manage bot plugins (Owner only)')
    .addSubcommand(sub =>
      sub
        .setName('list')
        .setDescription('List all available plugins')
    )
    .addSubcommand(sub =>
      sub
        .setName('load')
        .setDescription('Load a plugin')
        .addStringOption(opt =>
          opt
            .setName('name')
            .setDescription('Plugin folder name')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('unload')
        .setDescription('Unload a plugin')
        .addStringOption(opt =>
          opt
            .setName('name')
            .setDescription('Plugin name')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('reload')
        .setDescription('Reload a plugin')
        .addStringOption(opt =>
          opt
            .setName('name')
            .setDescription('Plugin name')
            .setRequired(true)
        )
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

    let subcommand, name;
    if (isSlash) {
      subcommand = interaction.options.getSubcommand();
      name = interaction.options.getString('name');
    } else {
      const args = interaction.content.split(' ').slice(1);
      subcommand = args[0]?.toLowerCase() || 'list';
      name = args[1];
    }

    switch (subcommand) {
      case 'list': {
        const plugins = client.pluginLoader.getAvailablePlugins();

        if (plugins.length === 0) {
          return isSlash
            ? interaction.reply({ embeds: [errorEmbed('No plugins found in the plugins directory.')] })
            : interaction.reply({ embeds: [errorEmbed('No plugins found in the plugins directory.')] });
        }

        const embed = new EmbedBuilder()
          .setColor(BOT_COLOR)
          .setTitle('Available Plugins')
          .setDescription(plugins.map(p => {
            const status = p.loaded ? Emojis.SUCCESS : Emojis.ERROR;
            const error = p.error ? ' (Error)' : '';
            return `${status} **${p.name}** v${p.version}${error}\n   ${p.description}`;
          }).join('\n\n'))
          .setFooter({ text: `${plugins.filter(p => p.loaded).length}/${plugins.length} plugins loaded` });

        return isSlash
          ? interaction.reply({ embeds: [embed] })
          : interaction.reply({ embeds: [embed] });
      }

      case 'load': {
        if (!name) {
          return isSlash
            ? interaction.reply({ embeds: [errorEmbed('Please provide a plugin name.')] })
            : interaction.reply({ embeds: [errorEmbed('Please provide a plugin name.')] });
        }

        const success = await client.pluginLoader.loadPlugin(name);

        if (success) {
          return isSlash
            ? interaction.reply({ embeds: [successEmbed(`Loaded plugin: **${name}**`)] })
            : interaction.reply({ embeds: [successEmbed(`Loaded plugin: **${name}**`)] });
        } else {
          return isSlash
            ? interaction.reply({ embeds: [errorEmbed(`Failed to load plugin: **${name}**`)] })
            : interaction.reply({ embeds: [errorEmbed(`Failed to load plugin: **${name}**`)] });
        }
      }

      case 'unload': {
        if (!name) {
          return isSlash
            ? interaction.reply({ embeds: [errorEmbed('Please provide a plugin name.')] })
            : interaction.reply({ embeds: [errorEmbed('Please provide a plugin name.')] });
        }

        const success = await client.pluginLoader.unloadPlugin(name);

        if (success) {
          return isSlash
            ? interaction.reply({ embeds: [successEmbed(`Unloaded plugin: **${name}**`)] })
            : interaction.reply({ embeds: [successEmbed(`Unloaded plugin: **${name}**`)] });
        } else {
          return isSlash
            ? interaction.reply({ embeds: [errorEmbed(`Failed to unload plugin: **${name}**`)] })
            : interaction.reply({ embeds: [errorEmbed(`Failed to unload plugin: **${name}**`)] });
        }
      }

      case 'reload': {
        if (!name) {
          return isSlash
            ? interaction.reply({ embeds: [errorEmbed('Please provide a plugin name.')] })
            : interaction.reply({ embeds: [errorEmbed('Please provide a plugin name.')] });
        }

        const success = await client.pluginLoader.reloadPlugin(name);

        if (success) {
          return isSlash
            ? interaction.reply({ embeds: [successEmbed(`Reloaded plugin: **${name}**`)] })
            : interaction.reply({ embeds: [successEmbed(`Reloaded plugin: **${name}**`)] });
        } else {
          return isSlash
            ? interaction.reply({ embeds: [errorEmbed(`Failed to reload plugin: **${name}**`)] })
            : interaction.reply({ embeds: [errorEmbed(`Failed to reload plugin: **${name}**`)] });
        }
      }

      default: {
        return isSlash
          ? interaction.reply({ embeds: [errorEmbed('Invalid subcommand. Use `list`, `load`, `unload`, or `reload`.')] })
          : interaction.reply({ embeds: [errorEmbed('Invalid subcommand. Use `list`, `load`, `unload`, or `reload`.')] });
      }
    }
  }
};
