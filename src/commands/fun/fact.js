// Fact command - Random facts
// Created by ImVylo

import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { Colors } from '../../utils/constants.js';
import { errorEmbed } from '../../utils/embeds.js';

// Curated list of interesting facts
const FACTS = [
  "Honey never spoils. Archaeologists have found 3,000-year-old honey in Egyptian tombs that was still edible.",
  "A group of flamingos is called a 'flamboyance'.",
  "Octopuses have three hearts and blue blood.",
  "The shortest war in history lasted 38-45 minutes between Britain and Zanzibar in 1896.",
  "Bananas are berries, but strawberries aren't.",
  "A day on Venus is longer than its year.",
  "The inventor of the Pringles can is buried in one.",
  "There are more possible iterations of a game of chess than there are atoms in the observable universe.",
  "Cleopatra lived closer in time to the Moon landing than to the construction of the Great Pyramid of Giza.",
  "Wombat poop is cube-shaped.",
  "Scotland's national animal is the unicorn.",
  "A jiffy is an actual unit of time: 1/100th of a second.",
  "Cows have best friends and get stressed when separated.",
  "The first computer programmer was a woman named Ada Lovelace.",
  "The entire world's population could fit inside Los Angeles standing shoulder-to-shoulder.",
  "There are more trees on Earth than stars in the Milky Way.",
  "Sharks are older than trees.",
  "Oxford University is older than the Aztec Empire.",
  "Nintendo was founded in 1889 and originally sold playing cards.",
  "The longest hiccuping spree lasted 68 years.",
  "A cloud can weigh over a million pounds.",
  "The human brain uses about 20% of the body's total energy.",
  "Dolphins have names for each other.",
  "The first oranges weren't orange - they were green.",
  "Humans share 50% of their DNA with bananas.",
  "The longest time between two twins being born is 87 days.",
  "A snail can sleep for three years.",
  "The Eiffel Tower can grow by up to 6 inches in summer due to heat expansion.",
  "Astronauts can grow up to 2 inches taller in space.",
  "The inventor of the frisbee was turned into a frisbee after he died.",
  "Crows can recognize and remember human faces.",
  "The world's oldest wooden wheel was found in Slovenia and is over 5,000 years old.",
  "An average person walks the equivalent of 5 times around the Earth in their lifetime.",
  "Your brain's storage capacity is considered virtually unlimited.",
  "The longest English word without a vowel is 'rhythms'."
];

export default {
  name: 'fact',
  description: 'Get a random fact',
  aliases: ['facts', 'randomfact'],
  cooldown: 5,
  guildOnly: false,

  data: new SlashCommandBuilder()
    .setName('fact')
    .setDescription('Get a random fact'),

  async execute(interaction, client) {
    const isSlash = interaction.isChatInputCommand?.();

    const fact = FACTS[Math.floor(Math.random() * FACTS.length)];

    const embed = new EmbedBuilder()
      .setColor(Colors.PRIMARY)
      .setTitle('🧠 Random Fact')
      .setDescription(fact)
      .setFooter({ text: '💡 The more you know!' })
      .setTimestamp();

    if (isSlash) {
      await interaction.reply({ embeds: [embed] });
    } else {
      await interaction.reply({ embeds: [embed] });
    }
  }
};
