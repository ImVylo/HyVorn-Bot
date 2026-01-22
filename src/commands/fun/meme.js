// Meme command - Random meme from Reddit
// Created by ImVylo

import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { Colors } from '../../utils/constants.js';
import { errorEmbed } from '../../utils/embeds.js';

const SUBREDDITS = ['memes', 'dankmemes', 'me_irl', 'wholesomememes', 'ProgrammerHumor'];

export default {
  name: 'meme',
  description: 'Get a random meme',
  aliases: ['reddit', 'maymay'],
  cooldown: 5,
  guildOnly: false,

  data: new SlashCommandBuilder()
    .setName('meme')
    .setDescription('Get a random meme')
    .addStringOption(opt =>
      opt.setName('subreddit').setDescription('Subreddit to get meme from')
    ),

  async execute(interaction, client) {
    const isSlash = interaction.isChatInputCommand?.();
    const user = isSlash ? interaction.user : interaction.author;

    let subreddit;
    if (isSlash) {
      subreddit = interaction.options.getString('subreddit');
    } else {
      const args = interaction.content.split(' ').slice(1);
      subreddit = args[0];
    }

    if (!subreddit) {
      subreddit = SUBREDDITS[Math.floor(Math.random() * SUBREDDITS.length)];
    }

    // Clean subreddit name
    subreddit = subreddit.replace(/^r\//, '').toLowerCase();

    if (isSlash) {
      await interaction.deferReply();
    }

    try {
      const response = await fetch(`https://www.reddit.com/r/${subreddit}/hot.json?limit=100`);

      if (!response.ok) {
        throw new Error('Subreddit not found');
      }

      const data = await response.json();
      const posts = data.data.children.filter(post => {
        const p = post.data;
        return !p.over_18 && !p.stickied && (p.url.endsWith('.jpg') || p.url.endsWith('.png') || p.url.endsWith('.gif') || p.url.includes('i.redd.it') || p.url.includes('imgur'));
      });

      if (posts.length === 0) {
        const embed = errorEmbed('No memes found in that subreddit!');
        return isSlash
          ? interaction.editReply({ embeds: [embed] })
          : interaction.reply({ embeds: [embed] });
      }

      const post = posts[Math.floor(Math.random() * posts.length)].data;

      const embed = new EmbedBuilder()
        .setColor(Colors.PRIMARY)
        .setTitle(post.title.slice(0, 256))
        .setURL(`https://reddit.com${post.permalink}`)
        .setImage(post.url)
        .setFooter({ text: `👍 ${post.ups.toLocaleString()} | 💬 ${post.num_comments.toLocaleString()} | r/${subreddit}` })
        .setTimestamp();

      if (isSlash) {
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.reply({ embeds: [embed] });
      }
    } catch (error) {
      const embed = errorEmbed('Failed to fetch meme. Try again later or try a different subreddit.');
      if (isSlash) {
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.reply({ embeds: [embed] });
      }
    }
  }
};
