// Eval command - Owner only
// Created by ImVylo

import { SlashCommandBuilder, EmbedBuilder, codeBlock, MessageFlags } from 'discord.js';
import { BOT_COLOR, PermissionLevels } from '../../utils/constants.js';
import { errorEmbed } from '../../utils/embeds.js';
import util from 'util';

export default {
  name: 'eval',
  description: 'Execute JavaScript code (Owner only)',
  aliases: ['ev'],
  cooldown: 0,
  permissionLevel: PermissionLevels.BOT_OWNER,

  data: new SlashCommandBuilder()
    .setName('eval')
    .setDescription('Execute JavaScript code (Owner only)')
    .addStringOption(option =>
      option
        .setName('code')
        .setDescription('The code to execute')
        .setRequired(true)
    )
    .addBooleanOption(option =>
      option
        .setName('silent')
        .setDescription('Hide the output')
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

    let code, silent;
    if (isSlash) {
      code = interaction.options.getString('code');
      silent = interaction.options.getBoolean('silent') || false;
    } else {
      const args = interaction.content.split(' ').slice(1);
      silent = args.includes('--silent') || args.includes('-s');
      code = args.filter(a => a !== '--silent' && a !== '-s').join(' ');
    }

    if (!code) {
      const embed = errorEmbed('Please provide code to execute.');
      return isSlash
        ? interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [embed] });
    }

    // Remove code blocks if present
    code = code.replace(/```(js|javascript)?\n?/g, '').replace(/```$/g, '');

    try {
      const start = process.hrtime();

      // Create context variables
      const message = interaction;
      const guild = interaction.guild;
      const channel = interaction.channel;
      const member = interaction.member;
      const db = client.db;

      // Execute
      let result = eval(code);

      // Handle promises
      if (result instanceof Promise) {
        result = await result;
      }

      const diff = process.hrtime(start);
      const time = (diff[0] * 1e9 + diff[1]) / 1e6;

      if (silent) {
        return isSlash
          ? interaction.reply({ content: 'Executed silently.', flags: MessageFlags.Ephemeral })
          : interaction.react('✅');
      }

      // Format output
      let output = util.inspect(result, { depth: 2, maxArrayLength: 50 });

      // Truncate if too long
      if (output.length > 1900) {
        output = output.substring(0, 1900) + '...';
      }

      // Clean sensitive data
      output = clean(output, client.config.token);

      const embed = new EmbedBuilder()
        .setColor(BOT_COLOR)
        .setTitle('Eval Result')
        .addFields(
          { name: 'Input', value: codeBlock('js', code.substring(0, 1000)), inline: false },
          { name: 'Output', value: codeBlock('js', output), inline: false },
          { name: 'Type', value: codeBlock(typeof result), inline: true },
          { name: 'Time', value: codeBlock(`${time.toFixed(3)}ms`), inline: true }
        )
        .setTimestamp();

      return isSlash
        ? interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [embed] });
    } catch (error) {
      const embed = new EmbedBuilder()
        .setColor(0xED4245)
        .setTitle('Eval Error')
        .addFields(
          { name: 'Input', value: codeBlock('js', code.substring(0, 1000)), inline: false },
          { name: 'Error', value: codeBlock('js', clean(error.message, client.config.token)), inline: false }
        )
        .setTimestamp();

      return isSlash
        ? interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [embed] });
    }
  }
};

function clean(text, token) {
  if (typeof text !== 'string') {
    text = util.inspect(text, { depth: 2 });
  }

  // Replace token
  if (token) {
    text = text.replace(new RegExp(token, 'gi'), '[REDACTED]');
  }

  // Replace common sensitive patterns
  text = text.replace(/`/g, '`\u200b');

  return text;
}
