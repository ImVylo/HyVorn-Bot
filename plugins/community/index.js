// Community Plugin for HyVornBot
// RPG, Pets, Cards, Reputation, Achievements, Starboard, Time Capsules, Predictions
// Created by ImVylo

import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';

const Colors = {
  PRIMARY: 0x5865F2,
  SUCCESS: 0x57F287,
  ERROR: 0xED4245,
  WARNING: 0xFEE75C,
  GOLD: 0xFFD700,
  RPG: 0x9B59B6,
  PET: 0xE91E63,
  CARD: 0x3498DB,
  STAR: 0xF1C40F
};

// ============================================
// RPG DATA
// ============================================
const ZONES = [
  { id: 'forest', name: 'Emerald Forest', minLevel: 1, maxLevel: 10, enemies: ['Slime', 'Goblin', 'Wolf', 'Forest Spider'], boss: 'Forest Troll' },
  { id: 'desert', name: 'Howling Sands', minLevel: 10, maxLevel: 25, enemies: ['Scorpion', 'Mummy', 'Sand Wurm', 'Scarab Swarm'], boss: 'Sand Empress' },
  { id: 'tundra', name: 'Frozen Wastes', minLevel: 25, maxLevel: 40, enemies: ['Ice Wolf', 'Frost Elemental', 'Yeti', 'Snow Wraith'], boss: 'Frost Giant' },
  { id: 'volcano', name: 'Devastated Lands', minLevel: 40, maxLevel: 60, enemies: ['Lava Golem', 'Shadow Wraith', 'Demon', 'Void Spawn'], boss: 'Void Dragon' },
  { id: 'abyss', name: 'The Abyss', minLevel: 60, maxLevel: 100, enemies: ['Eldritch Horror', 'Void Lord', 'Chaos Beast', 'Ancient One'], boss: 'World Eater' }
];

const CLASSES = {
  warrior: { name: 'Warrior', emoji: '⚔️', baseHp: 120, baseAtk: 15, baseDef: 12, description: 'High HP and defense, balanced attack' },
  mage: { name: 'Mage', emoji: '🔮', baseHp: 80, baseAtk: 20, baseDef: 6, description: 'High attack, low defense, magical damage' },
  rogue: { name: 'Rogue', emoji: '🗡️', baseHp: 90, baseAtk: 18, baseDef: 8, description: 'High crit chance, fast attacks' },
  healer: { name: 'Healer', emoji: '💚', baseHp: 100, baseAtk: 10, baseDef: 10, description: 'Can heal, supportive abilities' }
};

const ITEMS = {
  // Weapons
  'wooden_sword': { name: 'Wooden Sword', type: 'weapon', rarity: 'common', atk: 5, price: 50 },
  'iron_sword': { name: 'Iron Sword', type: 'weapon', rarity: 'common', atk: 12, price: 200 },
  'steel_blade': { name: 'Steel Blade', type: 'weapon', rarity: 'uncommon', atk: 20, price: 500 },
  'fire_sword': { name: 'Flame Blade', type: 'weapon', rarity: 'rare', atk: 35, price: 1500 },
  'void_blade': { name: 'Void Blade', type: 'weapon', rarity: 'legendary', atk: 60, price: 10000 },
  // Armor
  'leather_armor': { name: 'Leather Armor', type: 'armor', rarity: 'common', def: 5, price: 50 },
  'chainmail': { name: 'Chainmail', type: 'armor', rarity: 'uncommon', def: 15, price: 400 },
  'plate_armor': { name: 'Plate Armor', type: 'armor', rarity: 'rare', def: 30, price: 1200 },
  'dragon_armor': { name: 'Dragon Scale Armor', type: 'armor', rarity: 'legendary', def: 50, price: 8000 },
  // Consumables
  'health_potion': { name: 'Health Potion', type: 'consumable', rarity: 'common', heal: 30, price: 25 },
  'greater_health': { name: 'Greater Health Potion', type: 'consumable', rarity: 'uncommon', heal: 75, price: 100 },
  'elixir': { name: 'Elixir of Life', type: 'consumable', rarity: 'rare', heal: 150, price: 500 }
};

const LOOT_TABLE = {
  common: ['wooden_sword', 'leather_armor', 'health_potion'],
  uncommon: ['iron_sword', 'steel_blade', 'chainmail', 'greater_health'],
  rare: ['fire_sword', 'plate_armor', 'elixir'],
  legendary: ['void_blade', 'dragon_armor']
};

// ============================================
// PET DATA
// ============================================
const PETS = {
  'slime': { name: 'Slime', emoji: '🟢', rarity: 'common', baseStats: { hp: 20, atk: 5 }, evolves: 'king_slime' },
  'wolf_pup': { name: 'Wolf Pup', emoji: '🐺', rarity: 'common', baseStats: { hp: 25, atk: 8 }, evolves: 'dire_wolf' },
  'baby_dragon': { name: 'Baby Dragon', emoji: '🐲', rarity: 'rare', baseStats: { hp: 40, atk: 15 }, evolves: 'elder_dragon' },
  'phoenix_chick': { name: 'Phoenix Chick', emoji: '🔥', rarity: 'epic', baseStats: { hp: 35, atk: 20 }, evolves: 'phoenix' },
  'void_sprite': { name: 'Void Sprite', emoji: '👾', rarity: 'legendary', baseStats: { hp: 50, atk: 25 }, evolves: null },
  // Evolved forms
  'king_slime': { name: 'King Slime', emoji: '👑', rarity: 'uncommon', baseStats: { hp: 50, atk: 15 }, evolves: null },
  'dire_wolf': { name: 'Dire Wolf', emoji: '🐕', rarity: 'uncommon', baseStats: { hp: 60, atk: 20 }, evolves: null },
  'elder_dragon': { name: 'Elder Dragon', emoji: '🐉', rarity: 'legendary', baseStats: { hp: 100, atk: 40 }, evolves: null },
  'phoenix': { name: 'Phoenix', emoji: '🦅', rarity: 'legendary', baseStats: { hp: 80, atk: 50 }, evolves: null }
};

// ============================================
// CARD DATA
// ============================================
const CARDS = {
  // Common
  'c_slime': { name: 'Slime', rarity: 'common', series: 'creatures', power: 10 },
  'c_goblin': { name: 'Goblin', rarity: 'common', series: 'creatures', power: 12 },
  'c_wolf': { name: 'Wolf', rarity: 'common', series: 'creatures', power: 15 },
  'c_kweebec': { name: 'Kweebec', rarity: 'common', series: 'factions', power: 11 },
  'c_trork': { name: 'Trork Warrior', rarity: 'common', series: 'factions', power: 14 },
  // Uncommon
  'u_troll': { name: 'Forest Troll', rarity: 'uncommon', series: 'creatures', power: 25 },
  'u_mummy': { name: 'Ancient Mummy', rarity: 'uncommon', series: 'creatures', power: 28 },
  'u_feran': { name: 'Feran Priest', rarity: 'uncommon', series: 'factions', power: 26 },
  'u_scarak': { name: 'Scarak Warrior', rarity: 'uncommon', series: 'factions', power: 30 },
  // Rare
  'r_yeti': { name: 'Yeti', rarity: 'rare', series: 'creatures', power: 45 },
  'r_empress': { name: 'Sand Empress', rarity: 'rare', series: 'bosses', power: 55 },
  'r_giant': { name: 'Frost Giant', rarity: 'rare', series: 'bosses', power: 58 },
  // Epic
  'e_kraken': { name: 'Kraken', rarity: 'epic', series: 'creatures', power: 75 },
  'e_phoenix': { name: 'Phoenix', rarity: 'epic', series: 'creatures', power: 80 },
  // Legendary
  'l_void_dragon': { name: 'Void Dragon', rarity: 'legendary', series: 'bosses', power: 100 },
  'l_world_eater': { name: 'World Eater', rarity: 'legendary', series: 'bosses', power: 120 }
};

const CARD_PACK_RATES = {
  common: 0.60,
  uncommon: 0.25,
  rare: 0.10,
  epic: 0.04,
  legendary: 0.01
};

// ============================================
// ACHIEVEMENT DATA
// ============================================
const ACHIEVEMENTS = {
  // RPG
  'first_blood': { name: 'First Blood', description: 'Win your first battle', emoji: '⚔️', reward: 100 },
  'monster_slayer': { name: 'Monster Slayer', description: 'Defeat 100 enemies', emoji: '💀', reward: 500 },
  'boss_hunter': { name: 'Boss Hunter', description: 'Defeat your first boss', emoji: '👹', reward: 1000 },
  'max_level': { name: 'Legendary Hero', description: 'Reach level 100', emoji: '🏆', reward: 10000 },
  // Pets
  'pet_owner': { name: 'Pet Owner', description: 'Obtain your first pet', emoji: '🐾', reward: 100 },
  'pet_collector': { name: 'Pet Collector', description: 'Own 5 different pets', emoji: '🎪', reward: 500 },
  'pet_master': { name: 'Pet Master', description: 'Evolve a pet', emoji: '✨', reward: 1000 },
  // Cards
  'card_opener': { name: 'Card Opener', description: 'Open your first card pack', emoji: '🎴', reward: 50 },
  'card_collector': { name: 'Card Collector', description: 'Collect 25 unique cards', emoji: '📚', reward: 500 },
  'legendary_find': { name: 'Legendary Find', description: 'Obtain a legendary card', emoji: '🌟', reward: 2000 },
  // Social
  'helpful': { name: 'Helpful', description: 'Receive 10 reputation', emoji: '🤝', reward: 200 },
  'respected': { name: 'Respected', description: 'Receive 100 reputation', emoji: '👏', reward: 1000 },
  'starred': { name: 'Starred', description: 'Get a message on the starboard', emoji: '⭐', reward: 300 },
  // Economy
  'rich': { name: 'Getting Rich', description: 'Have 10,000 gold', emoji: '💰', reward: 500 },
  'wealthy': { name: 'Wealthy', description: 'Have 100,000 gold', emoji: '💎', reward: 2000 }
};

// ============================================
// PLUGIN CLASS
// ============================================
class CommunityPlugin {
  constructor(client) {
    this.client = client;
    this.log = client.logger.child('Community');
    this.activeBattles = new Map();
    this.activeRaids = new Map();
    this.timeCapsuleInterval = null;
  }

  async init() {
    this.log.info('Community plugin initializing...');

    this.initDatabase();
    this.registerCommands();
    this.registerEventHandlers();
    this.startTimeCapsuleChecker();

    this.log.success('Community plugin loaded!');
  }

  initDatabase() {
    const db = this.client.db.db;

    // RPG Characters
    db.exec(`
      CREATE TABLE IF NOT EXISTS rpg_characters (
        user_id TEXT PRIMARY KEY,
        class TEXT NOT NULL,
        level INTEGER DEFAULT 1,
        xp INTEGER DEFAULT 0,
        hp INTEGER DEFAULT 100,
        max_hp INTEGER DEFAULT 100,
        gold INTEGER DEFAULT 100,
        atk INTEGER DEFAULT 10,
        def INTEGER DEFAULT 10,
        equipped_weapon TEXT,
        equipped_armor TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // RPG Inventory
    db.exec(`
      CREATE TABLE IF NOT EXISTS rpg_inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        item_id TEXT NOT NULL,
        quantity INTEGER DEFAULT 1,
        UNIQUE(user_id, item_id)
      )
    `);

    // Pets
    db.exec(`
      CREATE TABLE IF NOT EXISTS pets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        pet_id TEXT NOT NULL,
        name TEXT,
        level INTEGER DEFAULT 1,
        xp INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 0
      )
    `);

    // Cards
    db.exec(`
      CREATE TABLE IF NOT EXISTS cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        card_id TEXT NOT NULL,
        quantity INTEGER DEFAULT 1,
        UNIQUE(user_id, card_id)
      )
    `);

    // Reputation
    db.exec(`
      CREATE TABLE IF NOT EXISTS reputation (
        user_id TEXT PRIMARY KEY,
        rep INTEGER DEFAULT 0,
        given_today INTEGER DEFAULT 0,
        last_given TEXT
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS rep_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_user TEXT NOT NULL,
        to_user TEXT NOT NULL,
        amount INTEGER DEFAULT 1,
        reason TEXT,
        timestamp INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Achievements
    db.exec(`
      CREATE TABLE IF NOT EXISTS achievements (
        user_id TEXT NOT NULL,
        achievement_id TEXT NOT NULL,
        unlocked_at INTEGER DEFAULT (strftime('%s', 'now')),
        PRIMARY KEY (user_id, achievement_id)
      )
    `);

    // Starboard
    db.exec(`
      CREATE TABLE IF NOT EXISTS starboard_config (
        guild_id TEXT PRIMARY KEY,
        channel_id TEXT,
        threshold INTEGER DEFAULT 3,
        emoji TEXT DEFAULT '⭐'
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS starboard_messages (
        message_id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        author_id TEXT NOT NULL,
        starboard_message_id TEXT,
        star_count INTEGER DEFAULT 0
      )
    `);

    // Time Capsules
    db.exec(`
      CREATE TABLE IF NOT EXISTS time_capsules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        message TEXT NOT NULL,
        unlock_at INTEGER NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        opened INTEGER DEFAULT 0
      )
    `);

    // Predictions
    db.exec(`
      CREATE TABLE IF NOT EXISTS predictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        creator_id TEXT NOT NULL,
        question TEXT NOT NULL,
        options TEXT NOT NULL,
        end_time INTEGER NOT NULL,
        result INTEGER,
        pool INTEGER DEFAULT 0,
        status TEXT DEFAULT 'open',
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS prediction_bets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prediction_id INTEGER NOT NULL,
        user_id TEXT NOT NULL,
        option_index INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        UNIQUE(prediction_id, user_id)
      )
    `);

    // Boss Raids
    db.exec(`
      CREATE TABLE IF NOT EXISTS raid_progress (
        guild_id TEXT PRIMARY KEY,
        boss_id TEXT,
        boss_hp INTEGER,
        boss_max_hp INTEGER,
        participants TEXT,
        started_at INTEGER,
        status TEXT DEFAULT 'inactive'
      )
    `);
  }

  registerCommands() {
    // RPG Command
    const rpgCommand = {
      name: 'rpg',
      description: 'RPG Adventure system',
      category: 'plugins',
      cooldown: 3,
      data: new SlashCommandBuilder()
        .setName('rpg')
        .setDescription('RPG Adventure system')
        .addSubcommand(sub => sub.setName('start').setDescription('Create your character')
          .addStringOption(opt => opt.setName('class').setDescription('Choose your class').setRequired(true)
            .addChoices(
              { name: 'Warrior - High HP & Defense', value: 'warrior' },
              { name: 'Mage - High Attack', value: 'mage' },
              { name: 'Rogue - High Crit', value: 'rogue' },
              { name: 'Healer - Support', value: 'healer' }
            )))
        .addSubcommand(sub => sub.setName('profile').setDescription('View your character'))
        .addSubcommand(sub => sub.setName('adventure').setDescription('Go on an adventure')
          .addStringOption(opt => opt.setName('zone').setDescription('Choose zone')
            .addChoices(...ZONES.map(z => ({ name: `${z.name} (Lv.${z.minLevel}-${z.maxLevel})`, value: z.id })))))
        .addSubcommand(sub => sub.setName('boss').setDescription('Challenge a zone boss')
          .addStringOption(opt => opt.setName('zone').setDescription('Choose zone').setRequired(true)
            .addChoices(...ZONES.map(z => ({ name: `${z.name} - ${z.boss}`, value: z.id })))))
        .addSubcommand(sub => sub.setName('inventory').setDescription('View your inventory'))
        .addSubcommand(sub => sub.setName('equip').setDescription('Equip an item')
          .addStringOption(opt => opt.setName('item').setDescription('Item to equip').setRequired(true)))
        .addSubcommand(sub => sub.setName('use').setDescription('Use a consumable')
          .addStringOption(opt => opt.setName('item').setDescription('Item to use').setRequired(true)))
        .addSubcommand(sub => sub.setName('shop').setDescription('View the shop'))
        .addSubcommand(sub => sub.setName('buy').setDescription('Buy an item')
          .addStringOption(opt => opt.setName('item').setDescription('Item to buy').setRequired(true)))
        .addSubcommand(sub => sub.setName('heal').setDescription('Heal at the inn (50 gold)')),
      execute: this.handleRpg.bind(this)
    };

    // Pet Command
    const petCommand = {
      name: 'pet',
      description: 'Pet collection system',
      category: 'plugins',
      cooldown: 3,
      data: new SlashCommandBuilder()
        .setName('pet')
        .setDescription('Pet collection system')
        .addSubcommand(sub => sub.setName('hunt').setDescription('Hunt for a new pet'))
        .addSubcommand(sub => sub.setName('list').setDescription('View your pets'))
        .addSubcommand(sub => sub.setName('select').setDescription('Select active pet')
          .addIntegerOption(opt => opt.setName('id').setDescription('Pet ID').setRequired(true)))
        .addSubcommand(sub => sub.setName('rename').setDescription('Rename a pet')
          .addIntegerOption(opt => opt.setName('id').setDescription('Pet ID').setRequired(true))
          .addStringOption(opt => opt.setName('name').setDescription('New name').setRequired(true)))
        .addSubcommand(sub => sub.setName('feed').setDescription('Feed your pet (gives XP)'))
        .addSubcommand(sub => sub.setName('evolve').setDescription('Evolve your active pet')),
      execute: this.handlePet.bind(this)
    };

    // Card Command
    const cardCommand = {
      name: 'card',
      description: 'Card collecting system',
      category: 'plugins',
      cooldown: 3,
      data: new SlashCommandBuilder()
        .setName('card')
        .setDescription('Card collecting system')
        .addSubcommand(sub => sub.setName('pack').setDescription('Open a card pack (100 gold)'))
        .addSubcommand(sub => sub.setName('collection').setDescription('View your collection'))
        .addSubcommand(sub => sub.setName('view').setDescription('View a specific card')
          .addStringOption(opt => opt.setName('card').setDescription('Card ID').setRequired(true)))
        .addSubcommand(sub => sub.setName('trade').setDescription('Trade cards with another user')
          .addUserOption(opt => opt.setName('user').setDescription('User to trade with').setRequired(true))
          .addStringOption(opt => opt.setName('offer').setDescription('Card you offer').setRequired(true))
          .addStringOption(opt => opt.setName('want').setDescription('Card you want').setRequired(true))),
      execute: this.handleCard.bind(this)
    };

    // Rep Command
    const repCommand = {
      name: 'rep',
      description: 'Reputation system',
      category: 'plugins',
      cooldown: 5,
      data: new SlashCommandBuilder()
        .setName('rep')
        .setDescription('Reputation system')
        .addSubcommand(sub => sub.setName('give').setDescription('Give reputation to someone')
          .addUserOption(opt => opt.setName('user').setDescription('User to rep').setRequired(true))
          .addStringOption(opt => opt.setName('reason').setDescription('Reason')))
        .addSubcommand(sub => sub.setName('check').setDescription('Check reputation')
          .addUserOption(opt => opt.setName('user').setDescription('User to check')))
        .addSubcommand(sub => sub.setName('leaderboard').setDescription('View rep leaderboard')),
      execute: this.handleRep.bind(this)
    };

    // Achievement Command
    const achieveCommand = {
      name: 'achievements',
      description: 'View your achievements',
      category: 'plugins',
      cooldown: 5,
      data: new SlashCommandBuilder()
        .setName('achievements')
        .setDescription('View your achievements')
        .addUserOption(opt => opt.setName('user').setDescription('User to check')),
      execute: this.handleAchievements.bind(this)
    };

    // Starboard Command
    const starCommand = {
      name: 'starboard',
      description: 'Starboard configuration',
      category: 'plugins',
      cooldown: 5,
      data: new SlashCommandBuilder()
        .setName('starboard')
        .setDescription('Starboard configuration')
        .addSubcommand(sub => sub.setName('setup').setDescription('Setup starboard')
          .addChannelOption(opt => opt.setName('channel').setDescription('Starboard channel').setRequired(true).addChannelTypes(ChannelType.GuildText))
          .addIntegerOption(opt => opt.setName('threshold').setDescription('Star threshold (default: 3)').setMinValue(1).setMaxValue(25))
          .addStringOption(opt => opt.setName('emoji').setDescription('Star emoji (default: ⭐)')))
        .addSubcommand(sub => sub.setName('disable').setDescription('Disable starboard'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
      execute: this.handleStarboard.bind(this)
    };

    // Time Capsule Command
    const capsuleCommand = {
      name: 'timecapsule',
      description: 'Time capsule messages',
      category: 'plugins',
      cooldown: 10,
      data: new SlashCommandBuilder()
        .setName('timecapsule')
        .setDescription('Time capsule messages')
        .addSubcommand(sub => sub.setName('create').setDescription('Create a time capsule')
          .addStringOption(opt => opt.setName('message').setDescription('Your message').setRequired(true))
          .addStringOption(opt => opt.setName('duration').setDescription('When to open (e.g., 1d, 1w, 1m, 1y)').setRequired(true)))
        .addSubcommand(sub => sub.setName('list').setDescription('View your pending capsules')),
      execute: this.handleTimeCapsule.bind(this)
    };

    // Prediction Command
    const predictCommand = {
      name: 'predict',
      description: 'Prediction market',
      category: 'plugins',
      cooldown: 5,
      data: new SlashCommandBuilder()
        .setName('predict')
        .setDescription('Prediction market')
        .addSubcommand(sub => sub.setName('create').setDescription('Create a prediction')
          .addStringOption(opt => opt.setName('question').setDescription('The prediction question').setRequired(true))
          .addStringOption(opt => opt.setName('option1').setDescription('First option').setRequired(true))
          .addStringOption(opt => opt.setName('option2').setDescription('Second option').setRequired(true))
          .addStringOption(opt => opt.setName('duration').setDescription('Duration (e.g., 1h, 1d)').setRequired(true)))
        .addSubcommand(sub => sub.setName('bet').setDescription('Place a bet')
          .addIntegerOption(opt => opt.setName('id').setDescription('Prediction ID').setRequired(true))
          .addIntegerOption(opt => opt.setName('option').setDescription('Option number (1 or 2)').setRequired(true).setMinValue(1).setMaxValue(2))
          .addIntegerOption(opt => opt.setName('amount').setDescription('Amount to bet').setRequired(true).setMinValue(10)))
        .addSubcommand(sub => sub.setName('list').setDescription('List active predictions'))
        .addSubcommand(sub => sub.setName('resolve').setDescription('Resolve a prediction (creator only)')
          .addIntegerOption(opt => opt.setName('id').setDescription('Prediction ID').setRequired(true))
          .addIntegerOption(opt => opt.setName('winner').setDescription('Winning option (1 or 2)').setRequired(true).setMinValue(1).setMaxValue(2))),
      execute: this.handlePredict.bind(this)
    };

    // Raid Command
    const raidCommand = {
      name: 'raid',
      description: 'Server boss raids',
      category: 'plugins',
      cooldown: 5,
      data: new SlashCommandBuilder()
        .setName('raid')
        .setDescription('Server boss raids')
        .addSubcommand(sub => sub.setName('start').setDescription('Start a boss raid')
          .addStringOption(opt => opt.setName('boss').setDescription('Boss to fight').setRequired(true)
            .addChoices(...ZONES.map(z => ({ name: z.boss, value: z.id })))))
        .addSubcommand(sub => sub.setName('attack').setDescription('Attack the raid boss'))
        .addSubcommand(sub => sub.setName('status').setDescription('View raid status')),
      execute: this.handleRaid.bind(this)
    };

    // Register all commands
    const commands = [rpgCommand, petCommand, cardCommand, repCommand, achieveCommand, starCommand, capsuleCommand, predictCommand, raidCommand];
    commands.forEach(cmd => {
      this.client.commands.set(cmd.name, cmd);
      this.client.slashCommands.set(cmd.name, cmd);
    });

    this.log.debug(`Registered ${commands.length} community commands`);
  }

  registerEventHandlers() {
    // Starboard reaction handler
    this.client.on('messageReactionAdd', async (reaction, user) => {
      if (user.bot) return;
      await this.handleStarReaction(reaction);
    });

    this.client.on('messageReactionRemove', async (reaction, user) => {
      if (user.bot) return;
      await this.handleStarReaction(reaction);
    });
  }

  startTimeCapsuleChecker() {
    this.timeCapsuleInterval = setInterval(() => {
      this.checkTimeCapsules();
    }, 60000); // Check every minute
  }

  // ==================== RPG HANDLERS ====================
  async handleRpg(interaction) {
    const sub = interaction.options.getSubcommand();
    const db = this.client.db.db;

    switch (sub) {
      case 'start': {
        const existing = db.prepare('SELECT * FROM rpg_characters WHERE user_id = ?').get(interaction.user.id);
        if (existing) {
          return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('You already have a character! Use `/rpg profile` to view it.')], flags: MessageFlags.Ephemeral });
        }

        const classId = interaction.options.getString('class');
        const cls = CLASSES[classId];

        db.prepare(`INSERT INTO rpg_characters (user_id, class, hp, max_hp, atk, def) VALUES (?, ?, ?, ?, ?, ?)`).run(
          interaction.user.id, classId, cls.baseHp, cls.baseHp, cls.baseAtk, cls.baseDef
        );

        // Give starter items
        db.prepare(`INSERT INTO rpg_inventory (user_id, item_id, quantity) VALUES (?, 'wooden_sword', 1)`).run(interaction.user.id);
        db.prepare(`INSERT INTO rpg_inventory (user_id, item_id, quantity) VALUES (?, 'leather_armor', 1)`).run(interaction.user.id);
        db.prepare(`INSERT INTO rpg_inventory (user_id, item_id, quantity) VALUES (?, 'health_potion', 3)`).run(interaction.user.id);

        await this.grantAchievement(interaction.user.id, 'first_blood');

        const embed = new EmbedBuilder()
          .setColor(Colors.SUCCESS)
          .setTitle(`${cls.emoji} Character Created!`)
          .setDescription(`Welcome, **${cls.name}** ${interaction.user.username}!`)
          .addFields(
            { name: 'Stats', value: `❤️ HP: ${cls.baseHp}\n⚔️ ATK: ${cls.baseAtk}\n🛡️ DEF: ${cls.baseDef}`, inline: true },
            { name: 'Starter Items', value: '🗡️ Wooden Sword\n🥋 Leather Armor\n🧪 Health Potion x3', inline: true }
          )
          .setFooter({ text: 'Use /rpg adventure to start exploring!' });

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'profile': {
        const char = db.prepare('SELECT * FROM rpg_characters WHERE user_id = ?').get(interaction.user.id);
        if (!char) {
          return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('You don\'t have a character! Use `/rpg start` to create one.')], flags: MessageFlags.Ephemeral });
        }

        const cls = CLASSES[char.class];
        const xpNeeded = char.level * 100;
        const weapon = char.equipped_weapon ? ITEMS[char.equipped_weapon] : null;
        const armor = char.equipped_armor ? ITEMS[char.equipped_armor] : null;

        const embed = new EmbedBuilder()
          .setColor(Colors.RPG)
          .setTitle(`${cls.emoji} ${interaction.user.username}'s Character`)
          .addFields(
            { name: 'Class', value: cls.name, inline: true },
            { name: 'Level', value: `${char.level}`, inline: true },
            { name: 'Gold', value: `💰 ${char.gold}`, inline: true },
            { name: 'HP', value: `❤️ ${char.hp}/${char.max_hp}`, inline: true },
            { name: 'ATK', value: `⚔️ ${char.atk}${weapon ? ` (+${weapon.atk})` : ''}`, inline: true },
            { name: 'DEF', value: `🛡️ ${char.def}${armor ? ` (+${armor.def})` : ''}`, inline: true },
            { name: 'XP', value: `✨ ${char.xp}/${xpNeeded}`, inline: true },
            { name: 'Weapon', value: weapon ? weapon.name : 'None', inline: true },
            { name: 'Armor', value: armor ? armor.name : 'None', inline: true }
          );

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'adventure': {
        const char = db.prepare('SELECT * FROM rpg_characters WHERE user_id = ?').get(interaction.user.id);
        if (!char) return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('Create a character first with `/rpg start`!')], flags: MessageFlags.Ephemeral });

        if (char.hp <= 0) return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('You\'re defeated! Use `/rpg heal` at the inn.')], flags: MessageFlags.Ephemeral });

        const zoneId = interaction.options.getString('zone') || 'forest';
        const zone = ZONES.find(z => z.id === zoneId);

        if (char.level < zone.minLevel) {
          return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription(`You need to be level ${zone.minLevel} to enter ${zone.name}!`)], flags: MessageFlags.Ephemeral });
        }

        const enemy = zone.enemies[Math.floor(Math.random() * zone.enemies.length)];
        const enemyLevel = Math.floor(Math.random() * (zone.maxLevel - zone.minLevel + 1)) + zone.minLevel;
        const enemyHp = 30 + enemyLevel * 10;
        const enemyAtk = 5 + enemyLevel * 2;
        const enemyDef = 3 + enemyLevel;

        // Combat calculation
        const weapon = char.equipped_weapon ? ITEMS[char.equipped_weapon] : null;
        const armor = char.equipped_armor ? ITEMS[char.equipped_armor] : null;
        const playerAtk = char.atk + (weapon?.atk || 0);
        const playerDef = char.def + (armor?.def || 0);

        let playerHp = char.hp;
        let currentEnemyHp = enemyHp;
        let rounds = 0;
        const log = [];

        while (playerHp > 0 && currentEnemyHp > 0 && rounds < 20) {
          rounds++;
          const playerDmg = Math.max(1, playerAtk - enemyDef + Math.floor(Math.random() * 10));
          currentEnemyHp -= playerDmg;
          log.push(`You deal ${playerDmg} damage!`);

          if (currentEnemyHp <= 0) break;

          const enemyDmg = Math.max(1, enemyAtk - playerDef + Math.floor(Math.random() * 5));
          playerHp -= enemyDmg;
          log.push(`${enemy} deals ${enemyDmg} damage!`);
        }

        const victory = currentEnemyHp <= 0;
        const xpGain = victory ? enemyLevel * 15 : 0;
        const goldGain = victory ? enemyLevel * 10 + Math.floor(Math.random() * 20) : 0;

        db.prepare('UPDATE rpg_characters SET hp = ?, xp = xp + ?, gold = gold + ? WHERE user_id = ?').run(
          Math.max(0, playerHp), xpGain, goldGain, interaction.user.id
        );

        // Level up check
        const updatedChar = db.prepare('SELECT * FROM rpg_characters WHERE user_id = ?').get(interaction.user.id);
        if (updatedChar.xp >= updatedChar.level * 100) {
          const newLevel = updatedChar.level + 1;
          const hpBonus = CLASSES[char.class].baseHp / 10;
          db.prepare('UPDATE rpg_characters SET level = ?, xp = 0, max_hp = max_hp + ?, hp = hp + ?, atk = atk + 2, def = def + 1 WHERE user_id = ?').run(
            newLevel, hpBonus, hpBonus, interaction.user.id
          );
          log.push(`\n🎉 **LEVEL UP!** You are now level ${newLevel}!`);

          if (newLevel >= 100) await this.grantAchievement(interaction.user.id, 'max_level');
        }

        // Loot drop
        let lootMsg = '';
        if (victory && Math.random() < 0.3) {
          const rarity = Math.random() < 0.05 ? 'rare' : Math.random() < 0.2 ? 'uncommon' : 'common';
          const lootPool = LOOT_TABLE[rarity];
          const loot = lootPool[Math.floor(Math.random() * lootPool.length)];
          db.prepare(`INSERT INTO rpg_inventory (user_id, item_id, quantity) VALUES (?, ?, 1) ON CONFLICT(user_id, item_id) DO UPDATE SET quantity = quantity + 1`).run(interaction.user.id, loot);
          lootMsg = `\n🎁 You found: **${ITEMS[loot].name}**!`;
        }

        // Update kill count for achievements
        if (victory) {
          const kills = db.prepare('SELECT COUNT(*) as count FROM rpg_inventory WHERE user_id = ?').get(interaction.user.id);
          if (kills.count >= 100) await this.grantAchievement(interaction.user.id, 'monster_slayer');
        }

        const embed = new EmbedBuilder()
          .setColor(victory ? Colors.SUCCESS : Colors.ERROR)
          .setTitle(victory ? `Victory against ${enemy}!` : `Defeated by ${enemy}...`)
          .setDescription(`**${zone.name}** - Level ${enemyLevel} ${enemy}\n\n${log.slice(-6).join('\n')}${lootMsg}`)
          .addFields(
            { name: 'HP Remaining', value: `❤️ ${Math.max(0, playerHp)}/${char.max_hp}`, inline: true },
            { name: 'Rewards', value: victory ? `✨ ${xpGain} XP\n💰 ${goldGain} Gold` : 'None', inline: true }
          );

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'boss': {
        const char = db.prepare('SELECT * FROM rpg_characters WHERE user_id = ?').get(interaction.user.id);
        if (!char) return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('Create a character first!')], flags: MessageFlags.Ephemeral });
        if (char.hp <= 0) return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('You\'re defeated! Heal first.')], flags: MessageFlags.Ephemeral });

        const zoneId = interaction.options.getString('zone');
        const zone = ZONES.find(z => z.id === zoneId);

        if (char.level < zone.maxLevel - 5) {
          return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription(`You should be at least level ${zone.maxLevel - 5} to challenge ${zone.boss}!`)], flags: MessageFlags.Ephemeral });
        }

        const bossHp = 200 + zone.maxLevel * 20;
        const bossAtk = 15 + zone.maxLevel * 3;
        const bossDef = 10 + zone.maxLevel * 2;

        const weapon = char.equipped_weapon ? ITEMS[char.equipped_weapon] : null;
        const armor = char.equipped_armor ? ITEMS[char.equipped_armor] : null;
        const playerAtk = char.atk + (weapon?.atk || 0);
        const playerDef = char.def + (armor?.def || 0);

        let playerHp = char.hp;
        let currentBossHp = bossHp;
        let rounds = 0;

        while (playerHp > 0 && currentBossHp > 0 && rounds < 30) {
          rounds++;
          const playerDmg = Math.max(1, playerAtk - bossDef + Math.floor(Math.random() * 15));
          currentBossHp -= playerDmg;
          if (currentBossHp <= 0) break;
          const bossDmg = Math.max(1, bossAtk - playerDef + Math.floor(Math.random() * 10));
          playerHp -= bossDmg;
        }

        const victory = currentBossHp <= 0;
        const xpGain = victory ? zone.maxLevel * 50 : 0;
        const goldGain = victory ? zone.maxLevel * 30 + 500 : 0;

        db.prepare('UPDATE rpg_characters SET hp = ?, xp = xp + ?, gold = gold + ? WHERE user_id = ?').run(
          Math.max(0, playerHp), xpGain, goldGain, interaction.user.id
        );

        if (victory) {
          await this.grantAchievement(interaction.user.id, 'boss_hunter');

          // Legendary loot chance
          if (Math.random() < 0.15) {
            const loot = LOOT_TABLE.legendary[Math.floor(Math.random() * LOOT_TABLE.legendary.length)];
            db.prepare(`INSERT INTO rpg_inventory (user_id, item_id, quantity) VALUES (?, ?, 1) ON CONFLICT(user_id, item_id) DO UPDATE SET quantity = quantity + 1`).run(interaction.user.id, loot);
          }
        }

        const embed = new EmbedBuilder()
          .setColor(victory ? Colors.GOLD : Colors.ERROR)
          .setTitle(victory ? `👹 ${zone.boss} Defeated!` : `💀 Defeated by ${zone.boss}...`)
          .setDescription(victory ? `You have conquered the mighty **${zone.boss}**!` : `The ${zone.boss} was too powerful...`)
          .addFields(
            { name: 'HP Remaining', value: `❤️ ${Math.max(0, playerHp)}/${char.max_hp}`, inline: true },
            { name: 'Rewards', value: victory ? `✨ ${xpGain} XP\n💰 ${goldGain} Gold` : 'None', inline: true }
          );

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'inventory': {
        const items = db.prepare('SELECT * FROM rpg_inventory WHERE user_id = ?').all(interaction.user.id);
        if (items.length === 0) {
          return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.WARNING).setDescription('Your inventory is empty!')], flags: MessageFlags.Ephemeral });
        }

        const itemList = items.map(i => {
          const item = ITEMS[i.item_id];
          return `**${item.name}** x${i.quantity} - ${item.type} (${item.rarity})`;
        }).join('\n');

        const embed = new EmbedBuilder()
          .setColor(Colors.PRIMARY)
          .setTitle('🎒 Inventory')
          .setDescription(itemList)
          .setFooter({ text: 'Use /rpg equip <item> or /rpg use <item>' });

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'equip': {
        const itemName = interaction.options.getString('item').toLowerCase().replace(/ /g, '_');
        const inv = db.prepare('SELECT * FROM rpg_inventory WHERE user_id = ? AND item_id = ?').get(interaction.user.id, itemName);

        if (!inv) return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('You don\'t have that item!')], flags: MessageFlags.Ephemeral });

        const item = ITEMS[itemName];
        if (!item || (item.type !== 'weapon' && item.type !== 'armor')) {
          return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('That item cannot be equipped!')], flags: MessageFlags.Ephemeral });
        }

        const field = item.type === 'weapon' ? 'equipped_weapon' : 'equipped_armor';
        db.prepare(`UPDATE rpg_characters SET ${field} = ? WHERE user_id = ?`).run(itemName, interaction.user.id);

        await interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setDescription(`Equipped **${item.name}**!`)] });
        break;
      }

      case 'use': {
        const itemName = interaction.options.getString('item').toLowerCase().replace(/ /g, '_');
        const inv = db.prepare('SELECT * FROM rpg_inventory WHERE user_id = ? AND item_id = ?').get(interaction.user.id, itemName);

        if (!inv) return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('You don\'t have that item!')], flags: MessageFlags.Ephemeral });

        const item = ITEMS[itemName];
        if (!item || item.type !== 'consumable') {
          return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('That item cannot be used!')], flags: MessageFlags.Ephemeral });
        }

        const char = db.prepare('SELECT * FROM rpg_characters WHERE user_id = ?').get(interaction.user.id);
        const newHp = Math.min(char.max_hp, char.hp + item.heal);

        db.prepare('UPDATE rpg_characters SET hp = ? WHERE user_id = ?').run(newHp, interaction.user.id);

        if (inv.quantity <= 1) {
          db.prepare('DELETE FROM rpg_inventory WHERE user_id = ? AND item_id = ?').run(interaction.user.id, itemName);
        } else {
          db.prepare('UPDATE rpg_inventory SET quantity = quantity - 1 WHERE user_id = ? AND item_id = ?').run(interaction.user.id, itemName);
        }

        await interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setDescription(`Used **${item.name}**! Restored ${item.heal} HP. (${newHp}/${char.max_hp})`)] });
        break;
      }

      case 'shop': {
        const shopItems = Object.entries(ITEMS).filter(([_, i]) => i.price).slice(0, 15);
        const itemList = shopItems.map(([id, item]) => {
          const typeEmoji = item.type === 'weapon' ? '⚔️' : item.type === 'armor' ? '🛡️' : '🧪';
          return `${typeEmoji} **${item.name}** - 💰 ${item.price}`;
        }).join('\n');

        const embed = new EmbedBuilder()
          .setColor(Colors.GOLD)
          .setTitle('🏪 Shop')
          .setDescription(itemList)
          .setFooter({ text: 'Use /rpg buy <item> to purchase' });

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'buy': {
        const itemName = interaction.options.getString('item').toLowerCase().replace(/ /g, '_');
        const item = ITEMS[itemName];

        if (!item || !item.price) {
          return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('Item not found in shop!')], flags: MessageFlags.Ephemeral });
        }

        const char = db.prepare('SELECT * FROM rpg_characters WHERE user_id = ?').get(interaction.user.id);
        if (!char) return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('Create a character first!')], flags: MessageFlags.Ephemeral });

        if (char.gold < item.price) {
          return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription(`Not enough gold! You have 💰 ${char.gold}, need 💰 ${item.price}.`)], flags: MessageFlags.Ephemeral });
        }

        db.prepare('UPDATE rpg_characters SET gold = gold - ? WHERE user_id = ?').run(item.price, interaction.user.id);
        db.prepare(`INSERT INTO rpg_inventory (user_id, item_id, quantity) VALUES (?, ?, 1) ON CONFLICT(user_id, item_id) DO UPDATE SET quantity = quantity + 1`).run(interaction.user.id, itemName);

        await interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setDescription(`Purchased **${item.name}** for 💰 ${item.price}!`)] });
        break;
      }

      case 'heal': {
        const char = db.prepare('SELECT * FROM rpg_characters WHERE user_id = ?').get(interaction.user.id);
        if (!char) return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('Create a character first!')], flags: MessageFlags.Ephemeral });

        if (char.gold < 50) {
          return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('Not enough gold! Inn costs 💰 50.')], flags: MessageFlags.Ephemeral });
        }

        db.prepare('UPDATE rpg_characters SET hp = max_hp, gold = gold - 50 WHERE user_id = ?').run(interaction.user.id);

        await interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setDescription(`🏨 You rest at the inn and restore full HP! (-💰 50)`)] });
        break;
      }
    }
  }

  // ==================== PET HANDLERS ====================
  async handlePet(interaction) {
    const sub = interaction.options.getSubcommand();
    const db = this.client.db.db;

    switch (sub) {
      case 'hunt': {
        const char = db.prepare('SELECT * FROM rpg_characters WHERE user_id = ?').get(interaction.user.id);
        if (!char) return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('Create an RPG character first!')], flags: MessageFlags.Ephemeral });

        if (char.gold < 50) {
          return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('Hunting costs 💰 50!')], flags: MessageFlags.Ephemeral });
        }

        db.prepare('UPDATE rpg_characters SET gold = gold - 50 WHERE user_id = ?').run(interaction.user.id);

        // Random pet catch
        if (Math.random() < 0.4) {
          const roll = Math.random();
          let rarity;
          if (roll < 0.6) rarity = 'common';
          else if (roll < 0.85) rarity = 'uncommon';
          else if (roll < 0.95) rarity = 'rare';
          else if (roll < 0.99) rarity = 'epic';
          else rarity = 'legendary';

          const availablePets = Object.entries(PETS).filter(([_, p]) => p.rarity === rarity && !p.name.includes('King') && !p.name.includes('Elder') && !p.name.includes('Dire') && p.name !== 'Phoenix');
          if (availablePets.length === 0) {
            availablePets.push(...Object.entries(PETS).filter(([_, p]) => p.rarity === 'common'));
          }

          const [petId, pet] = availablePets[Math.floor(Math.random() * availablePets.length)];

          db.prepare('INSERT INTO pets (user_id, pet_id, name) VALUES (?, ?, ?)').run(interaction.user.id, petId, pet.name);

          const petCount = db.prepare('SELECT COUNT(DISTINCT pet_id) as count FROM pets WHERE user_id = ?').get(interaction.user.id);
          if (petCount.count >= 1) await this.grantAchievement(interaction.user.id, 'pet_owner');
          if (petCount.count >= 5) await this.grantAchievement(interaction.user.id, 'pet_collector');

          const embed = new EmbedBuilder()
            .setColor(Colors.PET)
            .setTitle(`${pet.emoji} You caught a ${pet.name}!`)
            .setDescription(`**Rarity:** ${rarity}\n**Base HP:** ${pet.baseStats.hp}\n**Base ATK:** ${pet.baseStats.atk}`)
            .setFooter({ text: 'Use /pet list to view your pets!' });

          await interaction.reply({ embeds: [embed] });
        } else {
          await interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.WARNING).setDescription('You didn\'t find any pets this time... Try again!')] });
        }
        break;
      }

      case 'list': {
        const pets = db.prepare('SELECT * FROM pets WHERE user_id = ?').all(interaction.user.id);
        if (pets.length === 0) {
          return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.WARNING).setDescription('You don\'t have any pets! Use `/pet hunt` to find some.')], flags: MessageFlags.Ephemeral });
        }

        const petList = pets.map(p => {
          const pet = PETS[p.pet_id];
          const active = p.is_active ? ' ⭐' : '';
          return `**#${p.id}** ${pet.emoji} ${p.name} (Lv.${p.level})${active}`;
        }).join('\n');

        const embed = new EmbedBuilder()
          .setColor(Colors.PET)
          .setTitle('🐾 Your Pets')
          .setDescription(petList)
          .setFooter({ text: 'Use /pet select <id> to set active pet' });

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'select': {
        const petDbId = interaction.options.getInteger('id');
        const pet = db.prepare('SELECT * FROM pets WHERE id = ? AND user_id = ?').get(petDbId, interaction.user.id);

        if (!pet) return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('Pet not found!')], flags: MessageFlags.Ephemeral });

        db.prepare('UPDATE pets SET is_active = 0 WHERE user_id = ?').run(interaction.user.id);
        db.prepare('UPDATE pets SET is_active = 1 WHERE id = ?').run(petDbId);

        const petData = PETS[pet.pet_id];
        await interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setDescription(`${petData.emoji} **${pet.name}** is now your active pet!`)] });
        break;
      }

      case 'rename': {
        const petDbId = interaction.options.getInteger('id');
        const newName = interaction.options.getString('name');
        const pet = db.prepare('SELECT * FROM pets WHERE id = ? AND user_id = ?').get(petDbId, interaction.user.id);

        if (!pet) return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('Pet not found!')], flags: MessageFlags.Ephemeral });

        db.prepare('UPDATE pets SET name = ? WHERE id = ?').run(newName, petDbId);

        await interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setDescription(`Pet renamed to **${newName}**!`)] });
        break;
      }

      case 'feed': {
        const pet = db.prepare('SELECT * FROM pets WHERE user_id = ? AND is_active = 1').get(interaction.user.id);
        if (!pet) return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('No active pet! Use `/pet select <id>` first.')], flags: MessageFlags.Ephemeral });

        const char = db.prepare('SELECT * FROM rpg_characters WHERE user_id = ?').get(interaction.user.id);
        if (!char || char.gold < 20) {
          return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('Feeding costs 💰 20!')], flags: MessageFlags.Ephemeral });
        }

        db.prepare('UPDATE rpg_characters SET gold = gold - 20 WHERE user_id = ?').run(interaction.user.id);

        const xpGain = 10 + Math.floor(Math.random() * 20);
        db.prepare('UPDATE pets SET xp = xp + ? WHERE id = ?').run(xpGain, pet.id);

        // Level up check
        const updatedPet = db.prepare('SELECT * FROM pets WHERE id = ?').get(pet.id);
        const xpNeeded = updatedPet.level * 50;

        let levelUpMsg = '';
        if (updatedPet.xp >= xpNeeded) {
          db.prepare('UPDATE pets SET level = level + 1, xp = 0 WHERE id = ?').run(pet.id);
          levelUpMsg = `\n🎉 **${pet.name} leveled up to ${updatedPet.level + 1}!**`;
        }

        const petData = PETS[pet.pet_id];
        await interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setDescription(`${petData.emoji} Fed **${pet.name}**! +${xpGain} XP${levelUpMsg}`)] });
        break;
      }

      case 'evolve': {
        const pet = db.prepare('SELECT * FROM pets WHERE user_id = ? AND is_active = 1').get(interaction.user.id);
        if (!pet) return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('No active pet!')], flags: MessageFlags.Ephemeral });

        const petData = PETS[pet.pet_id];
        if (!petData.evolves) {
          return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.WARNING).setDescription(`${petData.emoji} **${pet.name}** cannot evolve!`)], flags: MessageFlags.Ephemeral });
        }

        if (pet.level < 20) {
          return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription(`${petData.emoji} **${pet.name}** needs to be level 20 to evolve! (Currently ${pet.level})`)], flags: MessageFlags.Ephemeral });
        }

        const evolvedPet = PETS[petData.evolves];
        db.prepare('UPDATE pets SET pet_id = ?, name = ?, level = 1, xp = 0 WHERE id = ?').run(petData.evolves, evolvedPet.name, pet.id);

        await this.grantAchievement(interaction.user.id, 'pet_master');

        const embed = new EmbedBuilder()
          .setColor(Colors.GOLD)
          .setTitle('✨ Evolution!')
          .setDescription(`${petData.emoji} **${pet.name}** evolved into ${evolvedPet.emoji} **${evolvedPet.name}**!`)
          .addFields(
            { name: 'New Stats', value: `❤️ HP: ${evolvedPet.baseStats.hp}\n⚔️ ATK: ${evolvedPet.baseStats.atk}`, inline: true }
          );

        await interaction.reply({ embeds: [embed] });
        break;
      }
    }
  }

  // ==================== CARD HANDLERS ====================
  async handleCard(interaction) {
    const sub = interaction.options.getSubcommand();
    const db = this.client.db.db;

    switch (sub) {
      case 'pack': {
        const char = db.prepare('SELECT * FROM rpg_characters WHERE user_id = ?').get(interaction.user.id);
        if (!char) return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('Create an RPG character first for gold!')], flags: MessageFlags.Ephemeral });

        if (char.gold < 100) {
          return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('Card packs cost 💰 100!')], flags: MessageFlags.Ephemeral });
        }

        db.prepare('UPDATE rpg_characters SET gold = gold - 100 WHERE user_id = ?').run(interaction.user.id);

        // Open 3 cards
        const pulls = [];
        for (let i = 0; i < 3; i++) {
          const roll = Math.random();
          let rarity;
          if (roll < CARD_PACK_RATES.common) rarity = 'common';
          else if (roll < CARD_PACK_RATES.common + CARD_PACK_RATES.uncommon) rarity = 'uncommon';
          else if (roll < CARD_PACK_RATES.common + CARD_PACK_RATES.uncommon + CARD_PACK_RATES.rare) rarity = 'rare';
          else if (roll < 1 - CARD_PACK_RATES.legendary) rarity = 'epic';
          else rarity = 'legendary';

          const availableCards = Object.entries(CARDS).filter(([_, c]) => c.rarity === rarity);
          const [cardId, card] = availableCards[Math.floor(Math.random() * availableCards.length)];

          db.prepare(`INSERT INTO cards (user_id, card_id, quantity) VALUES (?, ?, 1) ON CONFLICT(user_id, card_id) DO UPDATE SET quantity = quantity + 1`).run(interaction.user.id, cardId);

          pulls.push({ id: cardId, ...card });

          if (rarity === 'legendary') await this.grantAchievement(interaction.user.id, 'legendary_find');
        }

        await this.grantAchievement(interaction.user.id, 'card_opener');

        const uniqueCards = db.prepare('SELECT COUNT(DISTINCT card_id) as count FROM cards WHERE user_id = ?').get(interaction.user.id);
        if (uniqueCards.count >= 25) await this.grantAchievement(interaction.user.id, 'card_collector');

        const rarityColors = { common: '⚪', uncommon: '🟢', rare: '🔵', epic: '🟣', legendary: '🟡' };
        const cardList = pulls.map(c => `${rarityColors[c.rarity]} **${c.name}** (${c.rarity}) - Power: ${c.power}`).join('\n');

        const embed = new EmbedBuilder()
          .setColor(Colors.CARD)
          .setTitle('🎴 Card Pack Opened!')
          .setDescription(cardList)
          .setFooter({ text: 'Use /card collection to view your cards' });

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'collection': {
        const cards = db.prepare('SELECT * FROM cards WHERE user_id = ? ORDER BY card_id').all(interaction.user.id);
        if (cards.length === 0) {
          return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.WARNING).setDescription('You don\'t have any cards! Use `/card pack` to get some.')], flags: MessageFlags.Ephemeral });
        }

        const rarityColors = { common: '⚪', uncommon: '🟢', rare: '🔵', epic: '🟣', legendary: '🟡' };
        const cardList = cards.map(c => {
          const card = CARDS[c.card_id];
          return `${rarityColors[card.rarity]} **${card.name}** x${c.quantity}`;
        }).join('\n');

        const totalPower = cards.reduce((sum, c) => sum + CARDS[c.card_id].power * c.quantity, 0);

        const embed = new EmbedBuilder()
          .setColor(Colors.CARD)
          .setTitle('🎴 Your Collection')
          .setDescription(cardList)
          .addFields({ name: 'Total Power', value: `⚡ ${totalPower}`, inline: true })
          .setFooter({ text: `${cards.length}/${Object.keys(CARDS).length} unique cards` });

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'view': {
        const cardId = interaction.options.getString('card');
        const card = CARDS[cardId];

        if (!card) return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('Card not found!')], flags: MessageFlags.Ephemeral });

        const rarityColors = { common: 0x9E9E9E, uncommon: 0x4CAF50, rare: 0x2196F3, epic: 0x9C27B0, legendary: 0xFFD700 };

        const embed = new EmbedBuilder()
          .setColor(rarityColors[card.rarity])
          .setTitle(card.name)
          .addFields(
            { name: 'Rarity', value: card.rarity, inline: true },
            { name: 'Series', value: card.series, inline: true },
            { name: 'Power', value: `⚡ ${card.power}`, inline: true }
          );

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'trade': {
        const targetUser = interaction.options.getUser('user');
        const offerCardId = interaction.options.getString('offer');
        const wantCardId = interaction.options.getString('want');

        if (targetUser.id === interaction.user.id) {
          return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('You can\'t trade with yourself!')], flags: MessageFlags.Ephemeral });
        }

        const offerCard = db.prepare('SELECT * FROM cards WHERE user_id = ? AND card_id = ?').get(interaction.user.id, offerCardId);
        const wantCard = db.prepare('SELECT * FROM cards WHERE user_id = ? AND card_id = ?').get(targetUser.id, wantCardId);

        if (!offerCard) return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('You don\'t have that card to offer!')], flags: MessageFlags.Ephemeral });
        if (!wantCard) return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('They don\'t have that card!')], flags: MessageFlags.Ephemeral });

        const offer = CARDS[offerCardId];
        const want = CARDS[wantCardId];

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`trade_accept_${interaction.user.id}_${targetUser.id}_${offerCardId}_${wantCardId}`).setLabel('Accept').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId(`trade_decline_${interaction.user.id}`).setLabel('Decline').setStyle(ButtonStyle.Danger)
        );

        const embed = new EmbedBuilder()
          .setColor(Colors.CARD)
          .setTitle('🔄 Trade Request')
          .setDescription(`${interaction.user} wants to trade with ${targetUser}!`)
          .addFields(
            { name: 'Offering', value: `**${offer.name}** (${offer.rarity})`, inline: true },
            { name: 'Wants', value: `**${want.name}** (${want.rarity})`, inline: true }
          )
          .setFooter({ text: `${targetUser.username} has 60 seconds to respond` });

        const msg = await interaction.reply({ content: `${targetUser}`, embeds: [embed], components: [row], fetchReply: true });

        const collector = msg.createMessageComponentCollector({ time: 60000 });

        collector.on('collect', async (i) => {
          if (i.customId.startsWith('trade_accept') && i.user.id === targetUser.id) {
            // Execute trade
            if (offerCard.quantity <= 1) {
              db.prepare('DELETE FROM cards WHERE user_id = ? AND card_id = ?').run(interaction.user.id, offerCardId);
            } else {
              db.prepare('UPDATE cards SET quantity = quantity - 1 WHERE user_id = ? AND card_id = ?').run(interaction.user.id, offerCardId);
            }

            if (wantCard.quantity <= 1) {
              db.prepare('DELETE FROM cards WHERE user_id = ? AND card_id = ?').run(targetUser.id, wantCardId);
            } else {
              db.prepare('UPDATE cards SET quantity = quantity - 1 WHERE user_id = ? AND card_id = ?').run(targetUser.id, wantCardId);
            }

            db.prepare(`INSERT INTO cards (user_id, card_id, quantity) VALUES (?, ?, 1) ON CONFLICT(user_id, card_id) DO UPDATE SET quantity = quantity + 1`).run(targetUser.id, offerCardId);
            db.prepare(`INSERT INTO cards (user_id, card_id, quantity) VALUES (?, ?, 1) ON CONFLICT(user_id, card_id) DO UPDATE SET quantity = quantity + 1`).run(interaction.user.id, wantCardId);

            await i.update({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle('✅ Trade Complete!').setDescription(`${interaction.user} traded **${offer.name}** for ${targetUser}'s **${want.name}**!`)], components: [] });
          } else if (i.customId.startsWith('trade_decline') && i.user.id === targetUser.id) {
            await i.update({ embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('Trade declined.')], components: [] });
          }
        });

        collector.on('end', async (collected) => {
          if (collected.size === 0) {
            await msg.edit({ embeds: [new EmbedBuilder().setColor(Colors.WARNING).setDescription('Trade request expired.')], components: [] }).catch(() => {});
          }
        });
        break;
      }
    }
  }

  // ==================== REPUTATION HANDLERS ====================
  async handleRep(interaction) {
    const sub = interaction.options.getSubcommand();
    const db = this.client.db.db;

    switch (sub) {
      case 'give': {
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason given';

        if (targetUser.id === interaction.user.id) {
          return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('You can\'t give rep to yourself!')], flags: MessageFlags.Ephemeral });
        }

        if (targetUser.bot) {
          return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('You can\'t give rep to bots!')], flags: MessageFlags.Ephemeral });
        }

        // Check daily limit
        const today = new Date().toISOString().split('T')[0];
        let giver = db.prepare('SELECT * FROM reputation WHERE user_id = ?').get(interaction.user.id);

        if (!giver) {
          db.prepare('INSERT INTO reputation (user_id) VALUES (?)').run(interaction.user.id);
          giver = { given_today: 0, last_given: null };
        }

        if (giver.last_given === today && giver.given_today >= 3) {
          return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('You\'ve used all 3 daily reps! Try again tomorrow.')], flags: MessageFlags.Ephemeral });
        }

        const newGivenToday = giver.last_given === today ? giver.given_today + 1 : 1;
        db.prepare('UPDATE reputation SET given_today = ?, last_given = ? WHERE user_id = ?').run(newGivenToday, today, interaction.user.id);

        // Give rep to target
        db.prepare('INSERT INTO reputation (user_id, rep) VALUES (?, 1) ON CONFLICT(user_id) DO UPDATE SET rep = rep + 1').run(targetUser.id);
        db.prepare('INSERT INTO rep_history (from_user, to_user, reason) VALUES (?, ?, ?)').run(interaction.user.id, targetUser.id, reason);

        // Check achievements
        const targetRep = db.prepare('SELECT * FROM reputation WHERE user_id = ?').get(targetUser.id);
        if (targetRep.rep >= 10) await this.grantAchievement(targetUser.id, 'helpful');
        if (targetRep.rep >= 100) await this.grantAchievement(targetUser.id, 'respected');

        await interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setDescription(`🤝 Gave +1 rep to ${targetUser}!\n**Reason:** ${reason}\n\n*You have ${3 - newGivenToday} reps left today.*`)] });
        break;
      }

      case 'check': {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const rep = db.prepare('SELECT * FROM reputation WHERE user_id = ?').get(targetUser.id);

        const embed = new EmbedBuilder()
          .setColor(Colors.PRIMARY)
          .setTitle(`${targetUser.username}'s Reputation`)
          .addFields({ name: 'Total Rep', value: `🤝 ${rep?.rep || 0}`, inline: true });

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'leaderboard': {
        const top = db.prepare('SELECT * FROM reputation ORDER BY rep DESC LIMIT 10').all();

        if (top.length === 0) {
          return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.WARNING).setDescription('No reputation data yet!')] });
        }

        const leaderboard = await Promise.all(top.map(async (r, i) => {
          const user = await this.client.users.fetch(r.user_id).catch(() => null);
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**${i + 1}.**`;
          return `${medal} ${user?.username || 'Unknown'} - 🤝 ${r.rep}`;
        }));

        const embed = new EmbedBuilder()
          .setColor(Colors.GOLD)
          .setTitle('🏆 Reputation Leaderboard')
          .setDescription(leaderboard.join('\n'));

        await interaction.reply({ embeds: [embed] });
        break;
      }
    }
  }

  // ==================== ACHIEVEMENT HANDLERS ====================
  async handleAchievements(interaction) {
    const db = this.client.db.db;
    const targetUser = interaction.options.getUser('user') || interaction.user;

    const unlocked = db.prepare('SELECT * FROM achievements WHERE user_id = ?').all(targetUser.id);
    const unlockedIds = unlocked.map(a => a.achievement_id);

    const achievementList = Object.entries(ACHIEVEMENTS).map(([id, ach]) => {
      const isUnlocked = unlockedIds.includes(id);
      return `${isUnlocked ? ach.emoji : '🔒'} **${ach.name}** - ${ach.description}${isUnlocked ? ' ✅' : ''}`;
    }).join('\n');

    const embed = new EmbedBuilder()
      .setColor(Colors.GOLD)
      .setTitle(`${targetUser.username}'s Achievements`)
      .setDescription(achievementList)
      .setFooter({ text: `${unlocked.length}/${Object.keys(ACHIEVEMENTS).length} unlocked` });

    await interaction.reply({ embeds: [embed] });
  }

  async grantAchievement(userId, achievementId) {
    const db = this.client.db.db;
    const existing = db.prepare('SELECT * FROM achievements WHERE user_id = ? AND achievement_id = ?').get(userId, achievementId);

    if (existing) return false;

    db.prepare('INSERT INTO achievements (user_id, achievement_id) VALUES (?, ?)').run(userId, achievementId);

    const achievement = ACHIEVEMENTS[achievementId];
    if (achievement.reward) {
      db.prepare('UPDATE rpg_characters SET gold = gold + ? WHERE user_id = ?').run(achievement.reward, userId);
    }

    return true;
  }

  // ==================== STARBOARD HANDLERS ====================
  async handleStarboard(interaction) {
    const sub = interaction.options.getSubcommand();
    const db = this.client.db.db;

    switch (sub) {
      case 'setup': {
        const channel = interaction.options.getChannel('channel');
        const threshold = interaction.options.getInteger('threshold') || 3;
        const emoji = interaction.options.getString('emoji') || '⭐';

        db.prepare(`INSERT INTO starboard_config (guild_id, channel_id, threshold, emoji) VALUES (?, ?, ?, ?) ON CONFLICT(guild_id) DO UPDATE SET channel_id = ?, threshold = ?, emoji = ?`).run(
          interaction.guild.id, channel.id, threshold, emoji, channel.id, threshold, emoji
        );

        await interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle('⭐ Starboard Configured!').setDescription(`Channel: ${channel}\nThreshold: ${threshold} ${emoji}\n\nMessages with ${threshold}+ ${emoji} reactions will be posted to the starboard!`)] });
        break;
      }

      case 'disable': {
        db.prepare('DELETE FROM starboard_config WHERE guild_id = ?').run(interaction.guild.id);
        await interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setDescription('Starboard disabled.')] });
        break;
      }
    }
  }

  async handleStarReaction(reaction) {
    try {
      if (reaction.partial) await reaction.fetch();
      if (!reaction.message.guild) return;

      const db = this.client.db.db;
      const config = db.prepare('SELECT * FROM starboard_config WHERE guild_id = ?').get(reaction.message.guild.id);

      if (!config || reaction.emoji.name !== config.emoji) return;

      const starCount = reaction.count;

      if (starCount >= config.threshold) {
        const existing = db.prepare('SELECT * FROM starboard_messages WHERE message_id = ?').get(reaction.message.id);
        const starboardChannel = await this.client.channels.fetch(config.channel_id).catch(() => null);

        if (!starboardChannel) return;

        const embed = new EmbedBuilder()
          .setColor(Colors.STAR)
          .setAuthor({ name: reaction.message.author.username, iconURL: reaction.message.author.displayAvatarURL() })
          .setDescription(reaction.message.content || '*No text content*')
          .addFields({ name: 'Source', value: `[Jump to message](${reaction.message.url})` })
          .setTimestamp(reaction.message.createdAt)
          .setFooter({ text: `${config.emoji} ${starCount}` });

        if (reaction.message.attachments.size > 0) {
          const img = reaction.message.attachments.first();
          if (img.contentType?.startsWith('image/')) {
            embed.setImage(img.url);
          }
        }

        if (existing?.starboard_message_id) {
          // Update existing
          try {
            const sbMsg = await starboardChannel.messages.fetch(existing.starboard_message_id);
            await sbMsg.edit({ embeds: [embed] });
          } catch {
            // Message deleted, create new
            const newMsg = await starboardChannel.send({ embeds: [embed] });
            db.prepare('UPDATE starboard_messages SET starboard_message_id = ?, star_count = ? WHERE message_id = ?').run(newMsg.id, starCount, reaction.message.id);
          }
        } else {
          // Create new
          const newMsg = await starboardChannel.send({ embeds: [embed] });
          db.prepare('INSERT INTO starboard_messages (message_id, guild_id, channel_id, author_id, starboard_message_id, star_count) VALUES (?, ?, ?, ?, ?, ?)').run(
            reaction.message.id, reaction.message.guild.id, reaction.message.channel.id, reaction.message.author.id, newMsg.id, starCount
          );

          await this.grantAchievement(reaction.message.author.id, 'starred');
        }

        db.prepare('UPDATE starboard_messages SET star_count = ? WHERE message_id = ?').run(starCount, reaction.message.id);
      }
    } catch (error) {
      this.log.error('Starboard error:', error.message);
    }
  }

  // ==================== TIME CAPSULE HANDLERS ====================
  async handleTimeCapsule(interaction) {
    const sub = interaction.options.getSubcommand();
    const db = this.client.db.db;

    switch (sub) {
      case 'create': {
        const message = interaction.options.getString('message');
        const durationStr = interaction.options.getString('duration');

        const match = durationStr.match(/^(\d+)([hdwmy])$/i);
        if (!match) {
          return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('Invalid duration! Use format: 1d, 1w, 1m, 1y (day, week, month, year)')], flags: MessageFlags.Ephemeral });
        }

        const amount = parseInt(match[1]);
        const unit = match[2].toLowerCase();

        const multipliers = { h: 3600, d: 86400, w: 604800, m: 2592000, y: 31536000 };
        const unlockAt = Math.floor(Date.now() / 1000) + (amount * multipliers[unit]);

        db.prepare('INSERT INTO time_capsules (guild_id, user_id, channel_id, message, unlock_at) VALUES (?, ?, ?, ?, ?)').run(
          interaction.guild.id, interaction.user.id, interaction.channel.id, message, unlockAt
        );

        const unlockDate = new Date(unlockAt * 1000);

        const embed = new EmbedBuilder()
          .setColor(Colors.SUCCESS)
          .setTitle('⏰ Time Capsule Created!')
          .setDescription('Your message has been sealed and will be revealed in the future.')
          .addFields({ name: 'Opens On', value: `<t:${unlockAt}:F> (<t:${unlockAt}:R>)` })
          .setFooter({ text: 'The message will be posted in this channel when it opens' });

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'list': {
        const capsules = db.prepare('SELECT * FROM time_capsules WHERE user_id = ? AND opened = 0 ORDER BY unlock_at').all(interaction.user.id);

        if (capsules.length === 0) {
          return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.WARNING).setDescription('You don\'t have any pending time capsules!')], flags: MessageFlags.Ephemeral });
        }

        const list = capsules.map((c, i) => `**${i + 1}.** Opens <t:${c.unlock_at}:R>`).join('\n');

        const embed = new EmbedBuilder()
          .setColor(Colors.PRIMARY)
          .setTitle('⏰ Your Time Capsules')
          .setDescription(list)
          .setFooter({ text: `${capsules.length} pending capsule(s)` });

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        break;
      }
    }
  }

  async checkTimeCapsules() {
    const db = this.client.db.db;
    const now = Math.floor(Date.now() / 1000);

    const ready = db.prepare('SELECT * FROM time_capsules WHERE unlock_at <= ? AND opened = 0').all(now);

    for (const capsule of ready) {
      try {
        const channel = await this.client.channels.fetch(capsule.channel_id).catch(() => null);
        const user = await this.client.users.fetch(capsule.user_id).catch(() => null);

        if (channel && user) {
          const embed = new EmbedBuilder()
            .setColor(Colors.GOLD)
            .setTitle('⏰ Time Capsule Opened!')
            .setDescription(capsule.message)
            .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
            .addFields({ name: 'Created', value: `<t:${capsule.created_at}:F>` })
            .setTimestamp();

          await channel.send({ content: `${user}`, embeds: [embed] });
        }

        db.prepare('UPDATE time_capsules SET opened = 1 WHERE id = ?').run(capsule.id);
      } catch (error) {
        this.log.error('Time capsule error:', error.message);
      }
    }
  }

  // ==================== PREDICTION HANDLERS ====================
  async handlePredict(interaction) {
    const sub = interaction.options.getSubcommand();
    const db = this.client.db.db;

    switch (sub) {
      case 'create': {
        const question = interaction.options.getString('question');
        const option1 = interaction.options.getString('option1');
        const option2 = interaction.options.getString('option2');
        const durationStr = interaction.options.getString('duration');

        const match = durationStr.match(/^(\d+)([hd])$/i);
        if (!match) {
          return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('Invalid duration! Use format: 1h, 1d')], flags: MessageFlags.Ephemeral });
        }

        const amount = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        const multipliers = { h: 3600, d: 86400 };
        const endTime = Math.floor(Date.now() / 1000) + (amount * multipliers[unit]);

        const options = JSON.stringify([option1, option2]);

        const result = db.prepare('INSERT INTO predictions (guild_id, creator_id, question, options, end_time) VALUES (?, ?, ?, ?, ?)').run(
          interaction.guild.id, interaction.user.id, question, options, endTime
        );

        const embed = new EmbedBuilder()
          .setColor(Colors.PRIMARY)
          .setTitle('🔮 Prediction Created!')
          .setDescription(`**${question}**`)
          .addFields(
            { name: '1️⃣ Option 1', value: option1, inline: true },
            { name: '2️⃣ Option 2', value: option2, inline: true },
            { name: 'Ends', value: `<t:${endTime}:R>`, inline: false },
            { name: 'ID', value: `#${result.lastInsertRowid}`, inline: true }
          )
          .setFooter({ text: 'Use /predict bet <id> <option> <amount> to place a bet!' });

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'bet': {
        const predictionId = interaction.options.getInteger('id');
        const optionNum = interaction.options.getInteger('option');
        const amount = interaction.options.getInteger('amount');

        const prediction = db.prepare('SELECT * FROM predictions WHERE id = ? AND guild_id = ?').get(predictionId, interaction.guild.id);

        if (!prediction) return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('Prediction not found!')], flags: MessageFlags.Ephemeral });
        if (prediction.status !== 'open') return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('This prediction is closed!')], flags: MessageFlags.Ephemeral });
        if (Math.floor(Date.now() / 1000) > prediction.end_time) return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('Betting has ended!')], flags: MessageFlags.Ephemeral });

        const char = db.prepare('SELECT * FROM rpg_characters WHERE user_id = ?').get(interaction.user.id);
        if (!char || char.gold < amount) {
          return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('Not enough gold!')], flags: MessageFlags.Ephemeral });
        }

        const existingBet = db.prepare('SELECT * FROM prediction_bets WHERE prediction_id = ? AND user_id = ?').get(predictionId, interaction.user.id);
        if (existingBet) return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('You already placed a bet!')], flags: MessageFlags.Ephemeral });

        db.prepare('UPDATE rpg_characters SET gold = gold - ? WHERE user_id = ?').run(amount, interaction.user.id);
        db.prepare('INSERT INTO prediction_bets (prediction_id, user_id, option_index, amount) VALUES (?, ?, ?, ?)').run(predictionId, interaction.user.id, optionNum - 1, amount);
        db.prepare('UPDATE predictions SET pool = pool + ? WHERE id = ?').run(amount, predictionId);

        const options = JSON.parse(prediction.options);

        await interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setDescription(`Bet 💰 ${amount} on **${options[optionNum - 1]}**!`)] });
        break;
      }

      case 'list': {
        const predictions = db.prepare('SELECT * FROM predictions WHERE guild_id = ? AND status = ? ORDER BY end_time').all(interaction.guild.id, 'open');

        if (predictions.length === 0) {
          return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.WARNING).setDescription('No active predictions!')], flags: MessageFlags.Ephemeral });
        }

        const list = predictions.map(p => {
          const options = JSON.parse(p.options);
          return `**#${p.id}** ${p.question}\n1️⃣ ${options[0]} | 2️⃣ ${options[1]}\n💰 Pool: ${p.pool} | Ends <t:${p.end_time}:R>`;
        }).join('\n\n');

        const embed = new EmbedBuilder()
          .setColor(Colors.PRIMARY)
          .setTitle('🔮 Active Predictions')
          .setDescription(list);

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'resolve': {
        const predictionId = interaction.options.getInteger('id');
        const winner = interaction.options.getInteger('winner');

        const prediction = db.prepare('SELECT * FROM predictions WHERE id = ? AND guild_id = ?').get(predictionId, interaction.guild.id);

        if (!prediction) return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('Prediction not found!')], flags: MessageFlags.Ephemeral });
        if (prediction.creator_id !== interaction.user.id && !interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
          return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('Only the creator or admins can resolve this!')], flags: MessageFlags.Ephemeral });
        }
        if (prediction.status !== 'open') return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('Already resolved!')], flags: MessageFlags.Ephemeral });

        const winnerIndex = winner - 1;
        const bets = db.prepare('SELECT * FROM prediction_bets WHERE prediction_id = ?').all(predictionId);
        const winningBets = bets.filter(b => b.option_index === winnerIndex);
        const totalWinningAmount = winningBets.reduce((sum, b) => sum + b.amount, 0);

        // Distribute winnings
        for (const bet of winningBets) {
          const share = totalWinningAmount > 0 ? (bet.amount / totalWinningAmount) * prediction.pool : 0;
          const winnings = Math.floor(share);
          db.prepare('UPDATE rpg_characters SET gold = gold + ? WHERE user_id = ?').run(winnings, bet.user_id);
        }

        db.prepare('UPDATE predictions SET status = ?, result = ? WHERE id = ?').run('resolved', winnerIndex, predictionId);

        const options = JSON.parse(prediction.options);

        const embed = new EmbedBuilder()
          .setColor(Colors.GOLD)
          .setTitle('🔮 Prediction Resolved!')
          .setDescription(`**${prediction.question}**\n\n**Winner:** ${options[winnerIndex]}`)
          .addFields(
            { name: 'Total Pool', value: `💰 ${prediction.pool}`, inline: true },
            { name: 'Winners', value: `${winningBets.length} bettors`, inline: true }
          );

        await interaction.reply({ embeds: [embed] });
        break;
      }
    }
  }

  // ==================== RAID HANDLERS ====================
  async handleRaid(interaction) {
    const sub = interaction.options.getSubcommand();
    const db = this.client.db.db;

    switch (sub) {
      case 'start': {
        const existing = db.prepare('SELECT * FROM raid_progress WHERE guild_id = ? AND status = ?').get(interaction.guild.id, 'active');
        if (existing) return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('A raid is already in progress!')], flags: MessageFlags.Ephemeral });

        const zoneId = interaction.options.getString('boss');
        const zone = ZONES.find(z => z.id === zoneId);
        const bossHp = 5000 + zone.maxLevel * 100;

        db.prepare(`INSERT INTO raid_progress (guild_id, boss_id, boss_hp, boss_max_hp, participants, started_at, status) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(guild_id) DO UPDATE SET boss_id = ?, boss_hp = ?, boss_max_hp = ?, participants = ?, started_at = ?, status = ?`).run(
          interaction.guild.id, zoneId, bossHp, bossHp, '[]', Math.floor(Date.now() / 1000), 'active',
          zoneId, bossHp, bossHp, '[]', Math.floor(Date.now() / 1000), 'active'
        );

        const embed = new EmbedBuilder()
          .setColor(Colors.ERROR)
          .setTitle(`👹 RAID BOSS: ${zone.boss}`)
          .setDescription(`A fearsome **${zone.boss}** has appeared!\n\nAll adventurers are called to battle!`)
          .addFields(
            { name: 'Boss HP', value: `❤️ ${bossHp}/${bossHp}`, inline: true },
            { name: 'Recommended Level', value: `${zone.maxLevel}+`, inline: true }
          )
          .setFooter({ text: 'Use /raid attack to deal damage!' });

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'attack': {
        const raid = db.prepare('SELECT * FROM raid_progress WHERE guild_id = ? AND status = ?').get(interaction.guild.id, 'active');
        if (!raid) return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('No active raid!')], flags: MessageFlags.Ephemeral });

        const char = db.prepare('SELECT * FROM rpg_characters WHERE user_id = ?').get(interaction.user.id);
        if (!char) return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('Create an RPG character first!')], flags: MessageFlags.Ephemeral });

        const weapon = char.equipped_weapon ? ITEMS[char.equipped_weapon] : null;
        const damage = char.atk + (weapon?.atk || 0) + Math.floor(Math.random() * 20);
        const newBossHp = Math.max(0, raid.boss_hp - damage);

        const participants = JSON.parse(raid.participants);
        if (!participants.includes(interaction.user.id)) {
          participants.push(interaction.user.id);
        }

        db.prepare('UPDATE raid_progress SET boss_hp = ?, participants = ? WHERE guild_id = ?').run(newBossHp, JSON.stringify(participants), interaction.guild.id);

        const zone = ZONES.find(z => z.id === raid.boss_id);

        if (newBossHp <= 0) {
          // Boss defeated!
          const goldReward = zone.maxLevel * 50;
          const xpReward = zone.maxLevel * 30;

          for (const participantId of participants) {
            db.prepare('UPDATE rpg_characters SET gold = gold + ?, xp = xp + ? WHERE user_id = ?').run(goldReward, xpReward, participantId);
          }

          db.prepare('UPDATE raid_progress SET status = ? WHERE guild_id = ?').run('completed', interaction.guild.id);

          const embed = new EmbedBuilder()
            .setColor(Colors.GOLD)
            .setTitle(`🎉 ${zone.boss} Defeated!`)
            .setDescription(`The raid boss has been slain!\n\n**Participants:** ${participants.length}\n**Rewards:** 💰 ${goldReward} Gold, ✨ ${xpReward} XP each`)
            .setFooter({ text: 'Congratulations to all raiders!' });

          await interaction.reply({ embeds: [embed] });
        } else {
          const hpPercent = (newBossHp / raid.boss_max_hp) * 100;
          const hpBar = '█'.repeat(Math.floor(hpPercent / 10)) + '░'.repeat(10 - Math.floor(hpPercent / 10));

          await interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.RPG).setDescription(`⚔️ You deal **${damage}** damage to **${zone.boss}**!\n\n❤️ \`[${hpBar}]\` ${newBossHp}/${raid.boss_max_hp}`)] });
        }
        break;
      }

      case 'status': {
        const raid = db.prepare('SELECT * FROM raid_progress WHERE guild_id = ?').get(interaction.guild.id);
        if (!raid || raid.status !== 'active') {
          return interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.WARNING).setDescription('No active raid. Use `/raid start` to begin one!')], flags: MessageFlags.Ephemeral });
        }

        const zone = ZONES.find(z => z.id === raid.boss_id);
        const participants = JSON.parse(raid.participants);
        const hpPercent = (raid.boss_hp / raid.boss_max_hp) * 100;
        const hpBar = '█'.repeat(Math.floor(hpPercent / 10)) + '░'.repeat(10 - Math.floor(hpPercent / 10));

        const embed = new EmbedBuilder()
          .setColor(Colors.ERROR)
          .setTitle(`👹 ${zone.boss}`)
          .addFields(
            { name: 'HP', value: `\`[${hpBar}]\`\n❤️ ${raid.boss_hp}/${raid.boss_max_hp}`, inline: false },
            { name: 'Participants', value: `${participants.length} raiders`, inline: true },
            { name: 'Started', value: `<t:${raid.started_at}:R>`, inline: true }
          );

        await interaction.reply({ embeds: [embed] });
        break;
      }
    }
  }

  cleanup() {
    if (this.timeCapsuleInterval) {
      clearInterval(this.timeCapsuleInterval);
    }
    this.log.info('Community plugin cleaned up');
  }
}

export default CommunityPlugin;
