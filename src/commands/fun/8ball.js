// 8ball command
// Created by ImVylo

import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { BOT_COLOR } from '../../utils/constants.js';
import { errorEmbed } from '../../utils/embeds.js';

const RESPONSES = [
  // Positive
  'It is certain.',
  'It is decidedly so.',
  'Without a doubt.',
  'Yes, definitely.',
  'You may rely on it.',
  'As I see it, yes.',
  'Most likely.',
  'Outlook good.',
  'Yes.',
  'Signs point to yes.',
  // Neutral
  'Reply hazy, try again.',
  'Ask again later.',
  'Better not tell you now.',
  'Cannot predict now.',
  'Concentrate and ask again.',
  // Negative
  'Don\'t count on it.',
  'My reply is no.',
  'My sources say no.',
  'Outlook not so good.',
  'Very doubtful.'
];

export default {
  name: '8ball',
  description: 'Ask the magic 8ball a question',
  aliases: ['eightball', 'magic8ball'],
  cooldown: 5,

  data: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Ask the magic 8ball a question')
    .addStringOption(option =>
      option
        .setName('question')
        .setDescription('Your question')
        .setRequired(true)
    ),

  async execute(interaction, client) {
    const isSlash = interaction.isChatInputCommand?.();

    let question;
    if (isSlash) {
      question = interaction.options.getString('question');
    } else {
      question = interaction.content.split(' ').slice(1).join(' ');
    }

    if (!question) {
      return isSlash
        ? interaction.reply({ embeds: [errorEmbed('Please ask a question!')], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [errorEmbed('Please ask a question!')] });
    }

    const response = RESPONSES[Math.floor(Math.random() * RESPONSES.length)];

    const embed = new EmbedBuilder()
      .setColor(BOT_COLOR)
      .setTitle('🎱 Magic 8-Ball')
      .addFields(
        { name: 'Question', value: question, inline: false },
        { name: 'Answer', value: response, inline: false }
      );

    if (isSlash) {
      await interaction.reply({ embeds: [embed] });
    } else {
      await interaction.reply({ embeds: [embed] });
    }
  }
};
