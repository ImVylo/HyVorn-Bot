// Hytale Plugin for HyVornBot
// Created by ImVylo

import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

const Colors = {
  HYTALE: 0x00D4AA,
  ZONE1: 0x4CAF50,  // Emerald Grove - Green
  ZONE2: 0xFFC107,  // Howling Sands - Yellow/Sand
  ZONE3: 0x2196F3,  // Borea - Ice Blue
  ZONE4: 0x9C27B0,  // Devastated Lands - Purple
  ERROR: 0xED4245,
  SUCCESS: 0x57F287
};

// Hytale Lore Data
const ZONES = {
  'emerald-grove': {
    name: 'Emerald Grove (Zone 1)',
    description: 'A lush, vibrant forest zone filled with ancient trees, mystical creatures, and the peaceful Kweebec villages. This is where most players will begin their adventure.',
    color: Colors.ZONE1,
    image: 'https://hytale.com/static/images/media/concept-art/zone1.jpg',
    creatures: ['Kweebec', 'Trork', 'Fen Stalker', 'Pterosaur'],
    features: ['Dense forests', 'Kweebec villages', 'Ancient ruins', 'Underground caves', 'Rivers and lakes']
  },
  'howling-sands': {
    name: 'Howling Sands (Zone 2)',
    description: 'A vast desert zone with scorching days and freezing nights. Home to the Feran civilization and dangerous sand-dwelling creatures.',
    color: Colors.ZONE2,
    image: 'https://hytale.com/static/images/media/concept-art/zone2.jpg',
    creatures: ['Feran', 'Sand Empress', 'Desert Scorpion', 'Mummy'],
    features: ['Sand dunes', 'Oases', 'Ancient pyramids', 'Underground temples', 'Sandstorms']
  },
  'borea': {
    name: 'Borea (Zone 3)',
    description: 'A frozen tundra zone covered in snow and ice. Features harsh weather conditions and formidable frost creatures.',
    color: Colors.ZONE3,
    image: 'https://hytale.com/static/images/media/concept-art/zone3.jpg',
    creatures: ['Frost Giant', 'Ice Dragon', 'Yeti', 'Polar Bear'],
    features: ['Frozen lakes', 'Ice caves', 'Snowy mountains', 'Northern lights', 'Blizzards']
  },
  'devastated-lands': {
    name: 'Devastated Lands (Zone 4)',
    description: 'A corrupted, volcanic zone scarred by dark magic. The most dangerous region, home to powerful undead and demonic creatures.',
    color: Colors.ZONE4,
    image: 'https://hytale.com/static/images/media/concept-art/zone4.jpg',
    creatures: ['Void Dragon', 'Undead', 'Demons', 'Corrupted Beings'],
    features: ['Volcanoes', 'Lava rivers', 'Corrupted forests', 'Dark fortresses', 'Void portals']
  }
};

const FACTIONS = {
  'kweebec': {
    name: 'Kweebecs',
    description: 'Small, friendly forest-dwelling creatures who live in harmony with nature. They are skilled craftsmen and traders, known for their colorful villages built into giant trees.',
    color: Colors.ZONE1,
    zone: 'Emerald Grove',
    traits: ['Peaceful', 'Nature-loving', 'Skilled craftsmen', 'Traders'],
    enemies: ['Trorks', 'Outlanders']
  },
  'trork': {
    name: 'Trorks',
    description: 'Hostile, tribal creatures that raid Kweebec villages. They are aggressive warriors who live in crude camps and worship dark totems.',
    color: 0x8B4513,
    zone: 'Emerald Grove',
    traits: ['Aggressive', 'Tribal', 'Raiders', 'Warriors'],
    enemies: ['Kweebecs', 'Outlanders']
  },
  'feran': {
    name: 'Feran',
    description: 'An ancient, cat-like civilization that once ruled the desert. They built magnificent pyramids and temples, and possess advanced magical knowledge.',
    color: Colors.ZONE2,
    zone: 'Howling Sands',
    traits: ['Ancient', 'Magical', 'Builders', 'Mysterious'],
    enemies: ['Sand creatures', 'Tomb raiders']
  },
  'outlanders': {
    name: 'Outlanders',
    description: 'Human explorers and adventurers who have come to Orbis seeking fortune and glory. They establish settlements and trade with various factions.',
    color: 0x607D8B,
    zone: 'All Zones',
    traits: ['Adventurous', 'Adaptable', 'Resourceful', 'Diverse'],
    enemies: ['Varies by zone']
  }
};

const CREATURES = {
  'fen-stalker': {
    name: 'Fen Stalker',
    description: 'A terrifying creature that lurks in swamps and dark forests. It uses stealth to ambush unsuspecting prey.',
    zone: 'Emerald Grove',
    danger: 'High',
    color: Colors.ZONE1,
    behavior: 'Aggressive ambush predator'
  },
  'pterosaur': {
    name: 'Pterosaur',
    description: 'Flying reptiles that soar through the skies of Orbis. Some can be tamed and used as mounts.',
    zone: 'Multiple Zones',
    danger: 'Medium',
    color: Colors.HYTALE,
    behavior: 'Territorial, can be tamed'
  },
  'void-dragon': {
    name: 'Void Dragon',
    description: 'The most powerful creature in Orbis. A massive dragon corrupted by void energy, serving as a major boss encounter.',
    zone: 'Devastated Lands',
    danger: 'Extreme',
    color: Colors.ZONE4,
    behavior: 'Extremely hostile boss creature'
  },
  'yeti': {
    name: 'Yeti',
    description: 'Large, fur-covered creatures that roam the frozen wastes of Borea. Generally peaceful unless provoked.',
    zone: 'Borea',
    danger: 'Medium',
    color: Colors.ZONE3,
    behavior: 'Territorial but not aggressive'
  },
  'sand-empress': {
    name: 'Sand Empress',
    description: 'A powerful boss creature that rules the deepest tombs of the Howling Sands. Commands legions of undead servants.',
    zone: 'Howling Sands',
    danger: 'Extreme',
    color: Colors.ZONE2,
    behavior: 'Boss creature, commands undead'
  }
};

const TRIVIA = [
  { question: 'What is the name of the world in Hytale?', answer: 'Orbis', options: ['Orbis', 'Terra', 'Gaia', 'Aether'] },
  { question: 'Which zone is home to the Kweebecs?', answer: 'Emerald Grove', options: ['Emerald Grove', 'Howling Sands', 'Borea', 'Devastated Lands'] },
  { question: 'What studio is developing Hytale?', answer: 'Hypixel Studios', options: ['Hypixel Studios', 'Mojang', 'Riot Games', 'Epic Games'] },
  { question: 'What type of creature is a Fen Stalker?', answer: 'Ambush predator', options: ['Ambush predator', 'Friendly NPC', 'Mount', 'Boss'] },
  { question: 'Which zone features pyramids and ancient temples?', answer: 'Howling Sands', options: ['Howling Sands', 'Emerald Grove', 'Borea', 'Devastated Lands'] },
  { question: 'What corrupted zone is ruled by void creatures?', answer: 'Devastated Lands', options: ['Devastated Lands', 'Borea', 'Howling Sands', 'Emerald Grove'] },
  { question: 'What ancient civilization built the desert pyramids?', answer: 'Feran', options: ['Feran', 'Kweebec', 'Trork', 'Outlanders'] },
  { question: 'Which zone has frozen tundra and blizzards?', answer: 'Borea', options: ['Borea', 'Howling Sands', 'Emerald Grove', 'Devastated Lands'] },
  { question: 'What creatures raid Kweebec villages?', answer: 'Trorks', options: ['Trorks', 'Feran', 'Yetis', 'Outlanders'] },
  { question: 'What powerful boss rules the deep desert tombs?', answer: 'Sand Empress', options: ['Sand Empress', 'Void Dragon', 'Fen Stalker', 'Frost Giant'] }
];

const LORE_FACTS = [
  'Orbis is the name of the world where Hytale takes place.',
  'The Kweebecs are small, peaceful forest dwellers who live in villages built into giant trees.',
  'Trorks are hostile tribal creatures that frequently raid Kweebec settlements.',
  'The Fen Stalker is one of the most feared predators in the Emerald Grove.',
  'Hytale features a full day/night cycle that affects creature spawns and gameplay.',
  'The game includes powerful modding tools called Hytale Model Maker.',
  'Players can tame and ride various creatures, including Pterosaurs.',
  'The Void Dragon is considered one of the most powerful creatures in Orbis.',
  'The Feran were an ancient cat-like civilization that built the pyramids in the Howling Sands.',
  'Borea is a frozen zone inspired by Arctic and Nordic environments.',
  'The Devastated Lands were corrupted by dark magic and void energy.',
  'Hytale uses a voxel-based world similar to Minecraft but with much higher fidelity.',
  'The game features four distinct elemental zones, each with unique biomes and creatures.',
  'Adventure mode features a full story campaign with quests and boss encounters.',
  'The Hypixel team started developing Hytale in 2015.',
  'Players can create custom games, maps, and servers using Hytale\'s built-in tools.',
  'The soundtrack is composed by Oscar Garvin, known for his work on Minecraft mods.',
  'Hytale supports both singleplayer and multiplayer gameplay.',
  'The game features procedurally generated dungeons and structures.',
  'Magic and spellcasting play a significant role in Hytale\'s combat system.'
];

class HytalePlugin {
  constructor(client) {
    this.client = client;
    this.log = client.logger.child('Hytale');
    this.newsCheckInterval = null;
    this.lastNewsCheck = null;
    this.cachedNews = [];
  }

  async init() {
    this.log.info('Hytale plugin initializing...');

    // Create database tables
    this.initDatabase();

    // Register commands
    this.registerCommands();

    // Start news checking
    this.startNewsCheck();

    this.log.success('Hytale plugin loaded!');
  }

  initDatabase() {
    const db = this.client.db.db;

    db.exec(`
      CREATE TABLE IF NOT EXISTS hytale_news_channels (
        guild_id TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL,
        last_post_id TEXT
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS hytale_trivia_scores (
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        correct INTEGER DEFAULT 0,
        total INTEGER DEFAULT 0,
        PRIMARY KEY (guild_id, user_id)
      )
    `);
  }

  registerCommands() {
    const hytaleCommand = {
      name: 'hytale',
      description: 'Hytale community features',
      category: 'plugins',
      cooldown: 5,

      data: new SlashCommandBuilder()
        .setName('hytale')
        .setDescription('Hytale community features')
        .addSubcommand(sub =>
          sub.setName('news')
            .setDescription('Get the latest Hytale news')
        )
        .addSubcommand(sub =>
          sub.setName('zone')
            .setDescription('Learn about a Hytale zone')
            .addStringOption(opt =>
              opt.setName('name')
                .setDescription('Zone name')
                .setRequired(true)
                .addChoices(
                  { name: 'Emerald Grove (Zone 1)', value: 'emerald-grove' },
                  { name: 'Howling Sands (Zone 2)', value: 'howling-sands' },
                  { name: 'Borea (Zone 3)', value: 'borea' },
                  { name: 'Devastated Lands (Zone 4)', value: 'devastated-lands' }
                )
            )
        )
        .addSubcommand(sub =>
          sub.setName('faction')
            .setDescription('Learn about a Hytale faction')
            .addStringOption(opt =>
              opt.setName('name')
                .setDescription('Faction name')
                .setRequired(true)
                .addChoices(
                  { name: 'Kweebecs', value: 'kweebec' },
                  { name: 'Trorks', value: 'trork' },
                  { name: 'Feran', value: 'feran' },
                  { name: 'Outlanders', value: 'outlanders' }
                )
            )
        )
        .addSubcommand(sub =>
          sub.setName('creature')
            .setDescription('Learn about a Hytale creature')
            .addStringOption(opt =>
              opt.setName('name')
                .setDescription('Creature name')
                .setRequired(true)
                .addChoices(
                  { name: 'Fen Stalker', value: 'fen-stalker' },
                  { name: 'Pterosaur', value: 'pterosaur' },
                  { name: 'Void Dragon', value: 'void-dragon' },
                  { name: 'Yeti', value: 'yeti' },
                  { name: 'Sand Empress', value: 'sand-empress' }
                )
            )
        )
        .addSubcommand(sub =>
          sub.setName('lore')
            .setDescription('Get a random Hytale lore fact')
        )
        .addSubcommand(sub =>
          sub.setName('trivia')
            .setDescription('Test your Hytale knowledge')
        )
        .addSubcommand(sub =>
          sub.setName('leaderboard')
            .setDescription('View the Hytale trivia leaderboard')
        )
        .addSubcommand(sub =>
          sub.setName('setnews')
            .setDescription('Set a channel for Hytale news updates')
            .addChannelOption(opt =>
              opt.setName('channel')
                .setDescription('Channel for news (leave empty to disable)')
                .addChannelTypes(ChannelType.GuildText)
            )
        ),

      execute: this.handleCommand.bind(this)
    };

    this.client.commands.set(hytaleCommand.name, hytaleCommand);
    this.client.slashCommands.set(hytaleCommand.name, hytaleCommand);

    this.log.debug('Registered command: hytale');
  }

  startNewsCheck() {
    // Check for news every 30 minutes
    this.newsCheckInterval = setInterval(() => {
      this.checkForNews();
    }, 30 * 60 * 1000);

    // Initial check after 1 minute
    setTimeout(() => this.checkForNews(), 60 * 1000);
  }

  async checkForNews() {
    try {
      const news = await this.fetchNews();
      if (news.length > 0 && this.cachedNews.length > 0) {
        const newPosts = news.filter(n => !this.cachedNews.find(c => c.title === n.title));
        if (newPosts.length > 0) {
          await this.broadcastNews(newPosts);
        }
      }
      this.cachedNews = news;
    } catch (error) {
      this.log.error('Error checking for news:', error.message);
    }
  }

  async fetchNews() {
    try {
      const response = await fetch('https://hytale.com/api/blog/post/published', {
        signal: AbortSignal.timeout(10000),
        headers: {
          'User-Agent': 'HyVornBot/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const posts = await response.json();
      return posts.slice(0, 5).map(post => ({
        title: post.title,
        slug: post.slug,
        excerpt: post.bodyExcerpt || post.body?.substring(0, 200) || 'No description available.',
        date: post.publishedAt,
        coverImage: post.coverImage ? `https://hytale.com${post.coverImage.s3Key}` : null,
        author: post.author?.name || 'Hytale Team',
        url: `https://hytale.com/news/${post.publishedAt?.split('T')[0]?.replace(/-/g, '/')}/${post.slug}`
      }));
    } catch (error) {
      this.log.warn('Failed to fetch Hytale news:', error.message);
      return [];
    }
  }

  async broadcastNews(newPosts) {
    const db = this.client.db.db;
    const channels = db.prepare('SELECT * FROM hytale_news_channels').all();

    for (const channelConfig of channels) {
      try {
        const channel = await this.client.channels.fetch(channelConfig.channel_id).catch(() => null);
        if (!channel) continue;

        for (const post of newPosts) {
          const embed = this.createNewsEmbed(post);
          await channel.send({ embeds: [embed] });
        }
      } catch (error) {
        this.log.error(`Failed to broadcast to channel ${channelConfig.channel_id}:`, error.message);
      }
    }
  }

  createNewsEmbed(post) {
    const embed = new EmbedBuilder()
      .setColor(Colors.HYTALE)
      .setTitle(post.title)
      .setURL(post.url)
      .setDescription(post.excerpt.substring(0, 300) + (post.excerpt.length > 300 ? '...' : ''))
      .setFooter({ text: `By ${post.author}` })
      .setTimestamp(new Date(post.date));

    if (post.coverImage) {
      embed.setImage(post.coverImage);
    }

    return embed;
  }

  async handleCommand(interaction) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'news':
        return this.handleNews(interaction);
      case 'zone':
        return this.handleZone(interaction);
      case 'faction':
        return this.handleFaction(interaction);
      case 'creature':
        return this.handleCreature(interaction);
      case 'lore':
        return this.handleLore(interaction);
      case 'trivia':
        return this.handleTrivia(interaction);
      case 'leaderboard':
        return this.handleLeaderboard(interaction);
      case 'setnews':
        return this.handleSetNews(interaction);
    }
  }

  async handleNews(interaction) {
    await interaction.deferReply();

    const news = await this.fetchNews();

    if (news.length === 0) {
      return interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor(Colors.ERROR)
          .setDescription('Unable to fetch Hytale news at this time. Please try again later.')
        ]
      });
    }

    const embeds = news.slice(0, 3).map(post => this.createNewsEmbed(post));

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setLabel('Visit Hytale.com')
          .setStyle(ButtonStyle.Link)
          .setURL('https://hytale.com/news')
      );

    await interaction.editReply({ embeds, components: [row] });
  }

  async handleZone(interaction) {
    const zoneName = interaction.options.getString('name');
    const zone = ZONES[zoneName];

    if (!zone) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('Zone not found!')],
        flags: MessageFlags.Ephemeral
      });
    }

    const embed = new EmbedBuilder()
      .setColor(zone.color)
      .setTitle(zone.name)
      .setDescription(zone.description)
      .addFields(
        { name: 'Notable Creatures', value: zone.creatures.join(', '), inline: false },
        { name: 'Key Features', value: zone.features.map(f => `• ${f}`).join('\n'), inline: false }
      )
      .setFooter({ text: 'Hytale Zone Information' });

    await interaction.reply({ embeds: [embed] });
  }

  async handleFaction(interaction) {
    const factionName = interaction.options.getString('name');
    const faction = FACTIONS[factionName];

    if (!faction) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('Faction not found!')],
        flags: MessageFlags.Ephemeral
      });
    }

    const embed = new EmbedBuilder()
      .setColor(faction.color)
      .setTitle(faction.name)
      .setDescription(faction.description)
      .addFields(
        { name: 'Home Zone', value: faction.zone, inline: true },
        { name: 'Traits', value: faction.traits.join(', '), inline: true },
        { name: 'Enemies', value: Array.isArray(faction.enemies) ? faction.enemies.join(', ') : faction.enemies, inline: false }
      )
      .setFooter({ text: 'Hytale Faction Information' });

    await interaction.reply({ embeds: [embed] });
  }

  async handleCreature(interaction) {
    const creatureName = interaction.options.getString('name');
    const creature = CREATURES[creatureName];

    if (!creature) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('Creature not found!')],
        flags: MessageFlags.Ephemeral
      });
    }

    const dangerEmoji = {
      'Low': '🟢',
      'Medium': '🟡',
      'High': '🟠',
      'Extreme': '🔴'
    };

    const embed = new EmbedBuilder()
      .setColor(creature.color)
      .setTitle(creature.name)
      .setDescription(creature.description)
      .addFields(
        { name: 'Zone', value: creature.zone, inline: true },
        { name: 'Danger Level', value: `${dangerEmoji[creature.danger] || '⚪'} ${creature.danger}`, inline: true },
        { name: 'Behavior', value: creature.behavior, inline: false }
      )
      .setFooter({ text: 'Hytale Creature Information' });

    await interaction.reply({ embeds: [embed] });
  }

  async handleLore(interaction) {
    const fact = LORE_FACTS[Math.floor(Math.random() * LORE_FACTS.length)];

    const embed = new EmbedBuilder()
      .setColor(Colors.HYTALE)
      .setTitle('Hytale Lore')
      .setDescription(fact)
      .setFooter({ text: 'Use /hytale lore for another fact!' });

    await interaction.reply({ embeds: [embed] });
  }

  async handleTrivia(interaction) {
    const trivia = TRIVIA[Math.floor(Math.random() * TRIVIA.length)];
    const shuffledOptions = [...trivia.options].sort(() => Math.random() - 0.5);

    const embed = new EmbedBuilder()
      .setColor(Colors.HYTALE)
      .setTitle('Hytale Trivia')
      .setDescription(trivia.question)
      .setFooter({ text: 'You have 30 seconds to answer!' });

    const buttons = shuffledOptions.map((option, index) =>
      new ButtonBuilder()
        .setCustomId(`hytale_trivia_${index}_${option === trivia.answer ? 'correct' : 'wrong'}`)
        .setLabel(option)
        .setStyle(ButtonStyle.Secondary)
    );

    const row = new ActionRowBuilder().addComponents(buttons);

    const response = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

    const collector = response.createMessageComponentCollector({
      time: 30000,
      max: 1
    });

    collector.on('collect', async (i) => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: 'This trivia is not for you!', flags: MessageFlags.Ephemeral });
      }

      const isCorrect = i.customId.endsWith('_correct');
      this.updateTriviaScore(interaction.guild.id, interaction.user.id, isCorrect);

      const resultEmbed = new EmbedBuilder()
        .setColor(isCorrect ? Colors.SUCCESS : Colors.ERROR)
        .setTitle(isCorrect ? 'Correct!' : 'Wrong!')
        .setDescription(isCorrect
          ? `Great job! The answer was **${trivia.answer}**.`
          : `The correct answer was **${trivia.answer}**.`)
        .setFooter({ text: 'Use /hytale trivia for another question!' });

      const disabledButtons = buttons.map((btn, index) => {
        const option = shuffledOptions[index];
        return ButtonBuilder.from(btn)
          .setStyle(option === trivia.answer ? ButtonStyle.Success : ButtonStyle.Secondary)
          .setDisabled(true);
      });

      await i.update({ embeds: [resultEmbed], components: [new ActionRowBuilder().addComponents(disabledButtons)] });
    });

    collector.on('end', async (collected) => {
      if (collected.size === 0) {
        const timeoutEmbed = new EmbedBuilder()
          .setColor(Colors.ERROR)
          .setTitle('Time\'s Up!')
          .setDescription(`The correct answer was **${trivia.answer}**.`)
          .setFooter({ text: 'Use /hytale trivia for another question!' });

        const disabledButtons = buttons.map((btn, index) => {
          const option = shuffledOptions[index];
          return ButtonBuilder.from(btn)
            .setStyle(option === trivia.answer ? ButtonStyle.Success : ButtonStyle.Secondary)
            .setDisabled(true);
        });

        await response.edit({ embeds: [timeoutEmbed], components: [new ActionRowBuilder().addComponents(disabledButtons)] }).catch(() => {});
      }
    });
  }

  updateTriviaScore(guildId, userId, correct) {
    const db = this.client.db.db;
    db.prepare(`
      INSERT INTO hytale_trivia_scores (guild_id, user_id, correct, total)
      VALUES (?, ?, ?, 1)
      ON CONFLICT(guild_id, user_id) DO UPDATE SET
        correct = correct + ?,
        total = total + 1
    `).run(guildId, userId, correct ? 1 : 0, correct ? 1 : 0);
  }

  async handleLeaderboard(interaction) {
    const db = this.client.db.db;
    const scores = db.prepare(`
      SELECT user_id, correct, total
      FROM hytale_trivia_scores
      WHERE guild_id = ?
      ORDER BY correct DESC, total ASC
      LIMIT 10
    `).all(interaction.guild.id);

    if (scores.length === 0) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(Colors.HYTALE)
          .setTitle('Hytale Trivia Leaderboard')
          .setDescription('No trivia scores yet! Use `/hytale trivia` to play.')
        ]
      });
    }

    const leaderboard = await Promise.all(scores.map(async (score, index) => {
      const user = await this.client.users.fetch(score.user_id).catch(() => null);
      const username = user ? user.username : 'Unknown User';
      const percentage = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `**${index + 1}.**`;
      return `${medal} ${username} - ${score.correct}/${score.total} (${percentage}%)`;
    }));

    const embed = new EmbedBuilder()
      .setColor(Colors.HYTALE)
      .setTitle('Hytale Trivia Leaderboard')
      .setDescription(leaderboard.join('\n'))
      .setFooter({ text: 'Use /hytale trivia to compete!' });

    await interaction.reply({ embeds: [embed] });
  }

  async handleSetNews(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('You need Manage Server permission to use this command.')],
        flags: MessageFlags.Ephemeral
      });
    }

    const channel = interaction.options.getChannel('channel');
    const db = this.client.db.db;

    if (!channel) {
      db.prepare('DELETE FROM hytale_news_channels WHERE guild_id = ?').run(interaction.guild.id);
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(Colors.SUCCESS)
          .setDescription('Hytale news updates have been disabled.')
        ]
      });
    }

    db.prepare(`
      INSERT INTO hytale_news_channels (guild_id, channel_id)
      VALUES (?, ?)
      ON CONFLICT(guild_id) DO UPDATE SET channel_id = ?
    `).run(interaction.guild.id, channel.id, channel.id);

    await interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor(Colors.SUCCESS)
        .setTitle('Hytale News Configured')
        .setDescription(`Hytale news updates will now be posted to ${channel}.`)
        .setFooter({ text: 'News is checked every 30 minutes' })
      ]
    });
  }

  cleanup() {
    if (this.newsCheckInterval) {
      clearInterval(this.newsCheckInterval);
    }
    this.log.info('Hytale plugin cleaned up');
  }
}

export default HytalePlugin;
