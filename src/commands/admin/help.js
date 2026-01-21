// Help command
// Created by ImVylo

import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { BOT_NAME, BOT_COLOR, Emojis } from '../../utils/constants.js';
import { paginate, createPages } from '../../utils/pagination.js';

export default {
  name: 'help',
  description: 'View all commands or get help for a specific command',
  aliases: ['commands', 'h'],
  cooldown: 5,

  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('View all commands or get help for a specific command')
    .addStringOption(option =>
      option
        .setName('command')
        .setDescription('Get help for a specific command')
        .setRequired(false)
    ),

  async execute(interaction, client) {
    const isSlash = interaction.isChatInputCommand?.();
    const commandName = isSlash
      ? interaction.options.getString('command')
      : interaction.content?.split(' ')[1];

    // Get specific command help
    if (commandName) {
      const command = client.commands.get(commandName.toLowerCase()) ||
        client.commands.get(client.aliases.get(commandName.toLowerCase()));

      if (!command) {
        const embed = new EmbedBuilder()
          .setColor(BOT_COLOR)
          .setDescription(`${Emojis.ERROR} Command \`${commandName}\` not found.`);

        return isSlash
          ? interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
          : interaction.reply({ embeds: [embed] });
      }

      const embed = createCommandEmbed(command, client);
      return isSlash
        ? interaction.reply({ embeds: [embed] })
        : interaction.reply({ embeds: [embed] });
    }

    // Get all commands grouped by category
    const categories = client.commandHandler.getCommandsByCategory();
    const categoryEmojis = {
      admin: '⚙️',
      moderation: '🛡️',
      tickets: '🎫',
      leveling: '📈',
      economy: '💰',
      utility: '🔧',
      fun: '🎮',
      gameserver: '🎯'
    };

    const pages = [];

    // Overview page
    const overviewEmbed = new EmbedBuilder()
      .setColor(BOT_COLOR)
      .setTitle(`${BOT_NAME} Commands`)
      .setDescription(`Use \`/help <command>\` for more info on a specific command.\n\n**Categories:**`)
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true }));

    for (const [category, commands] of Object.entries(categories)) {
      const emoji = categoryEmojis[category] || '📁';
      overviewEmbed.addFields({
        name: `${emoji} ${capitalize(category)}`,
        value: `${commands.length} commands`,
        inline: true
      });
    }

    pages.push(overviewEmbed);

    // Category pages
    for (const [category, commands] of Object.entries(categories)) {
      const emoji = categoryEmojis[category] || '📁';
      const embed = new EmbedBuilder()
        .setColor(BOT_COLOR)
        .setTitle(`${emoji} ${capitalize(category)} Commands`)
        .setDescription(commands.map(cmd => `\`${cmd.name}\` - ${cmd.description || 'No description'}`).join('\n'));

      pages.push(embed);
    }

    await paginate(interaction, pages, { showPageNumber: true });
  }
};

function createCommandEmbed(command, client) {
  const embed = new EmbedBuilder()
    .setColor(BOT_COLOR)
    .setTitle(`Command: ${command.name}`)
    .setDescription(command.description || 'No description provided');

  if (command.aliases?.length > 0) {
    embed.addFields({
      name: 'Aliases',
      value: command.aliases.map(a => `\`${a}\``).join(', '),
      inline: true
    });
  }

  if (command.cooldown) {
    embed.addFields({
      name: 'Cooldown',
      value: `${command.cooldown} seconds`,
      inline: true
    });
  }

  if (command.category) {
    embed.addFields({
      name: 'Category',
      value: capitalize(command.category),
      inline: true
    });
  }

  if (command.usage) {
    const prefix = client.config.defaultPrefix;
    embed.addFields({
      name: 'Usage',
      value: `\`${prefix}${command.name} ${command.usage}\``,
      inline: false
    });
  }

  if (command.examples?.length > 0) {
    const prefix = client.config.defaultPrefix;
    embed.addFields({
      name: 'Examples',
      value: command.examples.map(e => `\`${prefix}${command.name} ${e}\``).join('\n'),
      inline: false
    });
  }

  return embed;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
