// Poll command - Create polls
// Created by ImVylo

import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { Colors, Emojis } from '../../utils/constants.js';
import { errorEmbed } from '../../utils/embeds.js';

const POLL_EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

export default {
  name: 'poll',
  description: 'Create a poll',
  aliases: ['vote'],
  cooldown: 10,
  guildOnly: true,

  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Create a poll')
    .addStringOption(opt =>
      opt.setName('question').setDescription('The poll question').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('options').setDescription('Poll options separated by | (max 10)')
    ),

  async execute(interaction, client) {
    const isSlash = interaction.isChatInputCommand?.();
    const user = isSlash ? interaction.user : interaction.author;

    let question, optionsStr;
    if (isSlash) {
      question = interaction.options.getString('question');
      optionsStr = interaction.options.getString('options');
    } else {
      const args = interaction.content.split(' ').slice(1).join(' ');
      const parts = args.split('|').map(p => p.trim());
      question = parts[0];
      optionsStr = parts.slice(1).join('|');
    }

    if (!question) {
      return isSlash
        ? interaction.reply({ embeds: [errorEmbed('Please provide a question!')], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [errorEmbed('Please provide a question!')] });
    }

    const embed = new EmbedBuilder()
      .setColor(Colors.PRIMARY)
      .setTitle('📊 Poll')
      .setFooter({ text: `Poll by ${user.username}` })
      .setTimestamp();

    let reactions = [];

    if (optionsStr) {
      // Multiple choice poll
      const options = optionsStr.split('|').map(o => o.trim()).filter(o => o).slice(0, 10);

      if (options.length < 2) {
        return isSlash
          ? interaction.reply({ embeds: [errorEmbed('Please provide at least 2 options separated by |')], flags: MessageFlags.Ephemeral })
          : interaction.reply({ embeds: [errorEmbed('Please provide at least 2 options separated by |')] });
      }

      const optionsText = options.map((opt, i) => `${POLL_EMOJIS[i]} ${opt}`).join('\n\n');
      embed.setDescription(`**${question}**\n\n${optionsText}`);
      reactions = POLL_EMOJIS.slice(0, options.length);
    } else {
      // Yes/No poll
      embed.setDescription(`**${question}**`);
      reactions = ['👍', '👎'];
    }

    let pollMessage;
    if (isSlash) {
      await interaction.reply({ embeds: [embed], fetchReply: true }).then(msg => {
        pollMessage = msg;
      });
    } else {
      pollMessage = await interaction.reply({ embeds: [embed], fetchReply: true });
    }

    // Add reactions
    for (const emoji of reactions) {
      await pollMessage.react(emoji).catch(() => {});
    }
  }
};
