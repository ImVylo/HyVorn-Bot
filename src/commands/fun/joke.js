// Joke command - Random joke
// Created by ImVylo

import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { Colors } from '../../utils/constants.js';
import { errorEmbed } from '../../utils/embeds.js';

// Fallback jokes if API fails
const FALLBACK_JOKES = [
  { setup: 'Why do programmers prefer dark mode?', punchline: 'Because light attracts bugs!' },
  { setup: 'Why did the developer go broke?', punchline: 'Because he used up all his cache!' },
  { setup: 'Why do Java developers wear glasses?', punchline: 'Because they can\'t C#!' },
  { setup: 'What\'s a computer\'s least favorite food?', punchline: 'Spam!' },
  { setup: 'Why was the JavaScript developer sad?', punchline: 'Because he didn\'t Node how to Express himself!' },
  { setup: 'What do you call 8 hobbits?', punchline: 'A hobbyte!' },
  { setup: 'Why did the computer go to the doctor?', punchline: 'Because it had a virus!' },
  { setup: 'What\'s a computer\'s favorite snack?', punchline: 'Microchips!' },
  { setup: 'Why did the PowerPoint presentation cross the road?', punchline: 'To get to the other slide!' },
  { setup: 'How does a computer get drunk?', punchline: 'It takes screenshots!' }
];

export default {
  name: 'joke',
  description: 'Get a random joke',
  aliases: ['j'],
  cooldown: 5,
  guildOnly: false,

  data: new SlashCommandBuilder()
    .setName('joke')
    .setDescription('Get a random joke')
    .addStringOption(opt =>
      opt.setName('type')
        .setDescription('Type of joke')
        .addChoices(
          { name: 'Any', value: 'any' },
          { name: 'Programming', value: 'programming' },
          { name: 'Dark', value: 'dark' },
          { name: 'Pun', value: 'pun' }
        )
    ),

  async execute(interaction, client) {
    const isSlash = interaction.isChatInputCommand?.();
    const user = isSlash ? interaction.user : interaction.author;

    // Check if fun commands are restricted to a specific channel
    if (interaction.guild) {
      const settings = client.db.getGuild(interaction.guild.id).settings;
      if (settings.funChannel && interaction.channel.id !== settings.funChannel) {
        return interaction.reply({
          embeds: [errorEmbed(`Fun commands can only be used in <#${settings.funChannel}>!`)],
          flags: MessageFlags.Ephemeral
        });
      }
    }

    let jokeType = 'any';
    if (isSlash) {
      jokeType = interaction.options.getString('type') || 'any';
    }

    try {
      // Try JokeAPI
      const category = jokeType === 'any' ? 'Any' : jokeType.charAt(0).toUpperCase() + jokeType.slice(1);
      const response = await fetch(`https://v2.jokeapi.dev/joke/${category}?blacklistFlags=nsfw,religious,racist,sexist`);

      if (response.ok) {
        const data = await response.json();

        if (!data.error) {
          const embed = new EmbedBuilder()
            .setColor(Colors.PRIMARY)
            .setTitle('😄 Random Joke');

          if (data.type === 'twopart') {
            embed.setDescription(`**${data.setup}**\n\n||${data.delivery}||`);
          } else {
            embed.setDescription(data.joke);
          }

          embed.setFooter({ text: `Category: ${data.category}` });
          embed.setTimestamp();

          return isSlash
            ? interaction.reply({ embeds: [embed] })
            : interaction.reply({ embeds: [embed] });
        }
      }

      // Use fallback
      throw new Error('API failed');
    } catch (error) {
      // Use fallback jokes
      const joke = FALLBACK_JOKES[Math.floor(Math.random() * FALLBACK_JOKES.length)];

      const embed = new EmbedBuilder()
        .setColor(Colors.PRIMARY)
        .setTitle('😄 Random Joke')
        .setDescription(`**${joke.setup}**\n\n||${joke.punchline}||`)
        .setFooter({ text: 'Click the spoiler to reveal the punchline!' })
        .setTimestamp();

      return isSlash
        ? interaction.reply({ embeds: [embed] })
        : interaction.reply({ embeds: [embed] });
    }
  }
};
