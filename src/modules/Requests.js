// Unified Requests Module - Tickets, Applications, Bug Reports, Play Reports, Suggestions
// Created by ImVylo

import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
  PermissionFlagsBits,
  MessageFlags
} from 'discord.js';
import { Colors, Emojis, BOT_NAME } from '../utils/constants.js';
import logger from '../core/Logger.js';

// Ticket categories (configurable per guild, these are defaults)
const DEFAULT_TICKET_CATEGORIES = [
  { id: 'general', name: 'General Support', emoji: '💬', description: 'General questions and help' },
  { id: 'payment', name: 'Payment Issues', emoji: '💳', description: 'Billing and payment support' },
  { id: 'appeal', name: 'Punishment Appeal', emoji: '⚖️', description: 'Appeal a ban, mute, or warning' },
  { id: 'bug', name: 'Bug Report', emoji: '🐛', description: 'Report a bug or issue' },
  { id: 'player', name: 'Player Report', emoji: '🚨', description: 'Report a player for rule violations' }
];

// Request type configurations
const REQUEST_TYPES = {
  ticket: {
    name: 'Support Ticket',
    emoji: '🎫',
    color: 0x5865F2,
    prefix: 'TKT',
    channelPrefix: 'ticket',
    description: 'Get help from our support team',
    hasCategories: true,
    fields: [
      { id: 'subject', label: 'Subject', placeholder: 'Brief summary of your issue', style: 'short', required: true, maxLength: 100 },
      { id: 'description', label: 'Description', placeholder: 'Please describe your issue in detail', style: 'paragraph', required: true, maxLength: 1000 },
      { id: 'evidence', label: 'Evidence', placeholder: 'Links to screenshots, videos, etc.', style: 'paragraph', required: false, maxLength: 500 }
    ]
  },
  'app-moderator': {
    name: 'Moderator Application',
    emoji: '🛡️',
    color: 0x57F287,
    prefix: 'APP',
    channelPrefix: 'app-mod',
    description: 'Apply for Moderator (16+, 10hrs/week)',
    multiPage: true,
    questions: [
      // Basic Information
      'What is your Discord username?',
      'What is your age?',
      'What timezone are you in?',
      'How many hours per week can you dedicate to moderating?',
      'What times are you typically available? (Include timezone)',
      // Experience & Background
      'Do you have any previous moderation experience? If yes, please describe your role and responsibilities.',
      'Have you ever been banned or punished on any gaming server? If yes, explain the circumstances.',
      'How long have you been following HyVorn or been part of our community?',
      // Situational Questions
      'A player is spamming chat with inappropriate messages. How do you handle this?',
      'Two players are having a heated argument in public chat. What steps do you take?',
      'A player accuses another player of cheating but has no proof. How do you respond?',
      'You catch a friend breaking the rules. What do you do?',
      'A player is upset about a punishment they received and is demanding to speak to "someone higher up." How do you handle this?',
      'You witness another staff member abusing their powers. What do you do?',
      // Personal Questions
      'Why do you want to be a Moderator for HyVorn?',
      'What qualities make you a good fit for this role?',
      'How do you handle stress or frustration when dealing with difficult players?',
      'What does a healthy gaming community look like to you?',
      'Is there anything else you\'d like us to know about you?'
    ]
  },
  'app-admin': {
    name: 'Admin Application',
    emoji: '⚔️',
    color: 0xED4245,
    prefix: 'APP',
    channelPrefix: 'app-admin',
    description: 'Apply for Admin (18+, 15hrs/week)',
    multiPage: true,
    questions: [
      // Basic Information
      'What is your Discord username?',
      'What is your age?',
      'What timezone are you in?',
      'How many hours per week can you dedicate to admin duties?',
      'What times are you typically available? (Include timezone)',
      // Experience & Leadership
      'Describe your previous staff experience in detail. Include server names, your role, team size, and duration.',
      'Have you ever led or managed a team? Describe your leadership style.',
      'What tools or systems have you used for server/community management?',
      'Describe a difficult situation you handled as a staff member. What was the outcome?',
      'Have you ever had to remove or discipline a fellow staff member? How did you handle it?',
      // Situational Questions
      'A Moderator is consistently making poor decisions and receiving player complaints. How do you address this?',
      'There\'s a major exploit discovered that\'s affecting gameplay. Walk us through your response.',
      'Two staff members are in conflict and it\'s affecting team morale. How do you resolve this?',
      'A popular content creator is breaking rules but brings a lot of players to the server. How do you handle this?',
      'The community is upset about a recent change to the server. How do you address their concerns?',
      'You disagree with a decision made by another Admin or the Owner. What do you do?',
      // Vision & Commitment
      'Why do you want to be an Admin for HyVorn specifically?',
      'What would you bring to our admin team that we might be missing?',
      'How do you balance being approachable with maintaining authority?',
      'Where do you see HyVorn in one year, and how would you help us get there?',
      'Is there anything else you\'d like us to know about you?'
    ]
  },
  'app-builder': {
    name: 'Builder Application',
    emoji: '🏗️',
    color: 0xF1C40F,
    prefix: 'APP',
    channelPrefix: 'app-builder',
    description: 'Apply for Builder (14+, 8hrs/week)',
    multiPage: true,
    questions: [
      // Basic Information
      'What is your Discord username?',
      'What is your age?',
      'What timezone are you in?',
      'How many hours per week can you dedicate to building?',
      // Building Experience
      'How long have you been building in block-based games (Minecraft, Hytale, etc.)?',
      'Have you worked on any build teams before? If yes, describe your role and projects.',
      'What building styles are you most comfortable with? (Medieval, Fantasy, Modern, Organic, Terraforming, etc.)',
      'What\'s the largest project you\'ve worked on? Describe your contribution.',
      'Do you have experience with WorldEdit, VoxelSniper, or similar building tools?',
      // Portfolio
      'Please provide links to screenshots or videos of your best builds. (Imgur, YouTube, Planet Minecraft, etc.)',
      'Which build in your portfolio are you most proud of and why?',
      'Do you have any experience with interior design and detailing?',
      'Can you show examples of both large-scale builds and detailed smaller builds?',
      // Creative Questions
      'HyVorn is a fantasy RPG server. How would you approach building a player town hub?',
      'Describe how you would design a dungeon entrance that feels dangerous and mysterious.',
      'How do you handle feedback or criticism on your builds?',
      'Are you comfortable building within a set style guide, even if it differs from your personal style?',
      'What inspires your builds? (Games, movies, art, real architecture, etc.)',
      // Teamwork
      'How do you approach collaborative builds with other builders?',
      'Why do you want to build for HyVorn?',
      'Is there anything else you\'d like us to know about you or your work?'
    ]
  },
  'app-developer': {
    name: 'Developer Application',
    emoji: '💻',
    color: 0x9B59B6,
    prefix: 'APP',
    channelPrefix: 'app-dev',
    description: 'Apply for Developer (16+, 10hrs/week)',
    multiPage: true,
    questions: [
      // Basic Information
      'What is your Discord username?',
      'What is your age?',
      'What timezone are you in?',
      'How many hours per week can you dedicate to development?',
      // Technical Skills
      'What programming languages are you proficient in? Rate your skill level for each (Beginner/Intermediate/Advanced).',
      'Do you have experience with Minecraft/Hytale plugin development? If yes, describe what you\'ve created.',
      'Are you familiar with any game server APIs or frameworks? (Spigot, Paper, Fabric, Hytale modding, etc.)',
      'Do you have experience with databases? (MySQL, MongoDB, Redis, etc.)',
      'Are you comfortable with Git and collaborative development workflows?',
      'Do you have any experience with web development? (Frontend/Backend)',
      // Portfolio & Projects
      'Please provide links to your GitHub, GitLab, or other code repositories.',
      'Describe 2-3 projects you\'ve worked on that you\'re proud of. What was your role?',
      'Have you ever contributed to open-source projects?',
      'Do you have any published plugins, mods, or tools? Please provide links.',
      // Technical Questions
      'How would you approach designing a skill/leveling system for an MMO server?',
      'Describe how you would implement a party/group system for dungeon content.',
      'How do you ensure your code is performant and doesn\'t cause server lag?',
      'How do you approach debugging a complex issue that\'s hard to reproduce?',
      'What\'s your process for planning and architecting a new feature before coding?',
      // Collaboration & Vision
      'How do you handle code reviews and feedback on your work?',
      'Are you comfortable working with a team and following coding standards?',
      'What aspects of HyVorn\'s planned features are you most excited to work on?',
      'Why do you want to develop for HyVorn?',
      'Is there anything else you\'d like us to know about your skills or experience?'
    ]
  },
  bug: {
    name: 'Bug Report',
    emoji: '🐛',
    color: 0xED4245,
    prefix: 'BUG',
    channelPrefix: 'bug',
    description: 'Report a bug or issue',
    fields: [
      { id: 'title', label: 'Bug Title', placeholder: 'Brief description of the bug', style: 'short', required: true, maxLength: 100 },
      { id: 'steps', label: 'Steps to Reproduce', placeholder: '1. Go to...\n2. Click on...\n3. Observe that...', style: 'paragraph', required: true, maxLength: 1000 },
      { id: 'expected', label: 'Expected Behavior', placeholder: 'What should have happened?', style: 'paragraph', required: true, maxLength: 500 },
      { id: 'actual', label: 'Actual Behavior', placeholder: 'What actually happened?', style: 'paragraph', required: true, maxLength: 500 },
      { id: 'additional', label: 'Additional Info', placeholder: 'Screenshots, links, etc.', style: 'paragraph', required: false, maxLength: 500 }
    ]
  },
  play: {
    name: 'Play Report',
    emoji: '🎮',
    color: 0x5865F2,
    prefix: 'PLY',
    channelPrefix: 'play',
    description: 'Submit feedback from your play session',
    fields: [
      { id: 'username', label: 'In-Game Username', placeholder: 'Your username in the game', style: 'short', required: true, maxLength: 50 },
      { id: 'session', label: 'Session Duration', placeholder: 'How long did you play? (e.g., 2 hours)', style: 'short', required: true, maxLength: 50 },
      { id: 'activities', label: 'What did you do?', placeholder: 'Describe what activities you did', style: 'paragraph', required: true, maxLength: 1000 },
      { id: 'feedback', label: 'Feedback / Suggestions', placeholder: 'Any feedback or suggestions?', style: 'paragraph', required: false, maxLength: 500 },
      { id: 'issues', label: 'Issues Encountered', placeholder: 'Any bugs or issues? (or type "None")', style: 'paragraph', required: false, maxLength: 500 }
    ]
  },
  suggestion: {
    name: 'Suggestion',
    emoji: '💡',
    color: 0xFEE75C,
    prefix: 'IDEA',
    channelPrefix: 'idea',
    description: 'Share your ideas and suggestions',
    fields: [
      { id: 'title', label: 'Suggestion Title', placeholder: 'Brief title for your suggestion', style: 'short', required: true, maxLength: 100 },
      { id: 'description', label: 'Description', placeholder: 'Describe your suggestion in detail', style: 'paragraph', required: true, maxLength: 1500 },
      { id: 'benefit', label: 'How would this help?', placeholder: 'What benefits would this bring?', style: 'paragraph', required: true, maxLength: 500 }
    ],
    allowVoting: true
  }
};

// Status configurations
const STATUS_CONFIG = {
  open: { emoji: '🟢', label: 'Open', color: 0x57F287 },
  pending: { emoji: '🟡', label: 'Pending Review', color: 0xFEE75C },
  in_progress: { emoji: '🔵', label: 'In Progress', color: 0x5865F2 },
  approved: { emoji: '✅', label: 'Approved', color: 0x57F287 },
  denied: { emoji: '❌', label: 'Denied', color: 0xED4245 },
  closed: { emoji: '🔒', label: 'Closed', color: 0x99AAB5 }
};

class RequestsModule {
  constructor(client) {
    this.client = client;
    this.log = logger.child('Requests');
    this.name = 'requests';
    // Store in-progress multi-page applications
    this.pendingApplications = new Map();
  }

  init() {
    // Create the requests table if it doesn't exist
    this.createTable();
    this.log.success('Requests module initialized');
    return this;
  }

  createTable() {
    this.client.db.db.exec(`
      CREATE TABLE IF NOT EXISTS requests (
        id TEXT PRIMARY KEY,
        guild_id TEXT,
        channel_id TEXT,
        message_id TEXT,
        user_id TEXT,
        type TEXT,
        title TEXT,
        status TEXT DEFAULT 'open',
        data TEXT DEFAULT '{}',
        claimed_by TEXT,
        created_at TEXT,
        updated_at TEXT,
        closed_at TEXT,
        closed_by TEXT,
        transcript TEXT
      )
    `);

    // Create index for faster lookups
    try {
      this.client.db.db.exec(`CREATE INDEX IF NOT EXISTS idx_requests_guild ON requests(guild_id)`);
      this.client.db.db.exec(`CREATE INDEX IF NOT EXISTS idx_requests_channel ON requests(channel_id)`);
      this.client.db.db.exec(`CREATE INDEX IF NOT EXISTS idx_requests_user ON requests(user_id, guild_id)`);
    } catch (e) {
      // Indexes might already exist
    }
  }

  // ==================== Settings ====================

  getSettings(guildId) {
    const settings = this.client.db.getSetting(guildId, 'requests') || {};
    return {
      enabled: settings.enabled !== false,
      categories: settings.categories || {},
      transcriptChannel: settings.transcriptChannel || null,
      suggestionsChannel: settings.suggestionsChannel || null, // Public channel for approved suggestions
      staffRoles: settings.staffRoles || [],
      typeRoles: settings.typeRoles || {}, // Per-type staff roles
      counters: settings.counters || {},
      panelChannel: settings.panelChannel || null,
      panelMessage: settings.panelMessage || null,
      ticketCategories: settings.ticketCategories || null,
      // Suggestion voting thresholds
      suggestionApproveVotes: settings.suggestionApproveVotes || 0,
      suggestionDenyVotes: settings.suggestionDenyVotes || 0,
      suggestionExpireDays: settings.suggestionExpireDays ?? 30,
      approvedSuggestionsChannel: settings.approvedSuggestionsChannel || null
    };
  }

  updateSettings(guildId, newSettings) {
    const current = this.getSettings(guildId);
    this.client.db.setSetting(guildId, 'requests', { ...current, ...newSettings });
  }

  getNextId(guildId, type) {
    const settings = this.getSettings(guildId);
    const typeConfig = REQUEST_TYPES[type];
    const prefix = typeConfig?.prefix || 'REQ';

    const counterKey = type.startsWith('app-') ? 'application' : type;
    const count = (settings.counters[counterKey] || 0) + 1;

    settings.counters[counterKey] = count;
    this.updateSettings(guildId, { counters: settings.counters });

    return `${prefix}-${count.toString().padStart(4, '0')}`;
  }

  // ==================== Request CRUD ====================

  createRequest(data) {
    const id = this.getNextId(data.guildId, data.type);

    this.client.db.db.prepare(`
      INSERT INTO requests (id, guild_id, channel_id, message_id, user_id, type, title, status, data, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.guildId,
      data.channelId || null,
      data.messageId || null,
      data.userId,
      data.type,
      data.title || 'Untitled',
      data.status || 'open',
      JSON.stringify(data.data || {}),
      new Date().toISOString(),
      new Date().toISOString()
    );

    return id;
  }

  getRequest(requestId) {
    const request = this.client.db.db.prepare('SELECT * FROM requests WHERE id = ?').get(requestId);
    if (request) {
      request.data = JSON.parse(request.data || '{}');
    }
    return request;
  }

  getRequestByChannel(channelId) {
    const request = this.client.db.db.prepare('SELECT * FROM requests WHERE channel_id = ?').get(channelId);
    if (request) {
      request.data = JSON.parse(request.data || '{}');
    }
    return request;
  }

  getUserRequests(guildId, userId, type = null, status = null) {
    let query = 'SELECT * FROM requests WHERE guild_id = ? AND user_id = ?';
    const params = [guildId, userId];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    return this.client.db.db.prepare(query).all(...params).map(r => {
      r.data = JSON.parse(r.data || '{}');
      return r;
    });
  }

  // Check if user has any open/pending application (any role)
  hasOpenApplication(guildId, userId) {
    const appTypes = ['app-moderator', 'app-admin', 'app-builder', 'app-developer'];
    const query = `SELECT * FROM requests WHERE guild_id = ? AND user_id = ? AND type IN (${appTypes.map(() => '?').join(',')}) AND status IN ('open', 'pending') LIMIT 1`;
    const result = this.client.db.db.prepare(query).get(guildId, userId, ...appTypes);
    if (result) {
      result.data = JSON.parse(result.data || '{}');
    }
    return result || null;
  }

  updateRequest(requestId, updates) {
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (key === 'data') {
        fields.push('data = ?');
        values.push(JSON.stringify(value));
      } else {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(requestId);

    this.client.db.db.prepare(`UPDATE requests SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }

  // ==================== Panel Creation ====================

  async createPanel(channel, panelType = 'all') {
    const settings = this.getSettings(channel.guild.id);

    if (panelType === 'ticket' || panelType === 'all') {
      await this.createTicketPanel(channel, settings);
    }

    if (panelType === 'application' || panelType === 'all') {
      await this.createApplicationPanel(channel, settings);
    }

    if (panelType === 'suggestion' || panelType === 'all') {
      await this.createSuggestionPanel(channel, settings);
    }

    if (panelType === 'report' || panelType === 'all') {
      await this.createReportPanel(channel, settings);
    }

    // Save panel location
    this.updateSettings(channel.guild.id, {
      panelChannel: channel.id
    });
  }

  async createTicketPanel(channel, settings) {
    const categories = settings.ticketCategories || DEFAULT_TICKET_CATEGORIES;

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🎫 Welcome to Support!')
      .setDescription(
        'Need help? Open a support ticket and our team will assist you!\n\n' +
        '**Please include as much information as possible about your issue.**\n\n' +
        '⏱️ Our staff team typically responds within **24 hours**.\n' +
        '📋 Please ensure you read the rules before opening a ticket.'
      )
      .setThumbnail(channel.guild.iconURL({ dynamic: true }))
      .setFooter({ text: 'HyVorn Support • Select a category below' })
      .setTimestamp();

    // Create dropdown with categories
    const select = new StringSelectMenuBuilder()
      .setCustomId('request_ticketcat')
      .setPlaceholder('Click to view Categories')
      .addOptions(
        categories.map(cat => ({
          label: cat.name,
          value: cat.id,
          emoji: cat.emoji,
          description: cat.description.slice(0, 100)
        }))
      );

    const row = new ActionRowBuilder().addComponents(select);

    await channel.send({ embeds: [embed], components: [row] });
  }

  async createApplicationPanel(channel, settings) {
    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle('🌟 Interested in joining our wonderful staff team? 🌟')
      .setDescription(
        "We're always looking to expand our staff members! If you'd like to apply, please make sure to read the application requirements thoroughly and to answer honestly!\n\n" +
        '**Requirements:**\n' +
        '• Must be 15+ years old\n' +
        '• Must be able to play 5 hours minimum a week\n' +
        '• Must have a total playtime of at least 8 hours on the server\n' +
        '• Must be able to capture your screen in good quality\n' +
        '• Must not be account sharing\n' +
        '• Must not be staff on another server\n\n' +
        '**Other things to keep in mind:**\n' +
        '• You are not allowed to ask staff to look into your application\n' +
        '• AI usage is forbidden\n' +
        '• You must wait at least **30 days** before submitting another application\n' +
        "• If you're a returning staff member, please make a ticket first"
      )
      .setThumbnail(channel.guild.iconURL({ dynamic: true }))
      .setFooter({ text: 'HyVorn Staff Applications • Select a position below' })
      .setTimestamp();

    // Direct dropdown for position selection
    const select = new StringSelectMenuBuilder()
      .setCustomId('request_appselect')
      .setPlaceholder('Select a position to apply for...')
      .addOptions([
        { label: 'Moderator', value: 'app-moderator', emoji: '🛡️', description: '16+, 10hrs/week' },
        { label: 'Admin', value: 'app-admin', emoji: '⚔️', description: '18+, 15hrs/week' },
        { label: 'Builder', value: 'app-builder', emoji: '🏗️', description: '14+, 8hrs/week' },
        { label: 'Developer', value: 'app-developer', emoji: '💻', description: '16+, 10hrs/week' }
      ]);

    const row = new ActionRowBuilder().addComponents(select);

    await channel.send({ embeds: [embed], components: [row] });
  }

  async createSuggestionPanel(channel, settings) {
    const embed = new EmbedBuilder()
      .setColor(0xFEE75C)
      .setTitle('💡 Share Your Ideas!')
      .setDescription(
        'Have an idea to improve the server? We want to hear from you!\n\n' +
        '**How it works:**\n' +
        '1. Submit your suggestion below\n' +
        '2. Staff will review your idea\n' +
        '3. If approved, it goes to the community for voting!\n\n' +
        '**Guidelines:**\n' +
        '• Be specific and descriptive\n' +
        '• Check if your idea has been suggested before\n' +
        '• Be respectful - all suggestions are reviewed'
      )
      .setThumbnail(channel.guild.iconURL({ dynamic: true }))
      .setFooter({ text: 'HyVorn Suggestions • Staff reviewed' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('request_start_suggestion')
        .setLabel('Submit a Suggestion')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('💡')
    );

    await channel.send({ embeds: [embed], components: [row] });
  }

  async createReportPanel(channel, settings) {
    const embed = new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle('📊 Reports & Feedback')
      .setDescription(
        'Help us improve by submitting reports!\n\n' +
        '🐛 **Bug Report** - Found a bug or glitch? Let us know!\n' +
        '🎮 **Play Report** - Share feedback from your play session\n\n' +
        '*Your reports help make the server better for everyone!*'
      )
      .setThumbnail(channel.guild.iconURL({ dynamic: true }))
      .setFooter({ text: 'HyVorn Reports' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('request_start_bug')
        .setLabel('Bug Report')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🐛'),
      new ButtonBuilder()
        .setCustomId('request_start_play')
        .setLabel('Play Report')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🎮')
    );

    await channel.send({ embeds: [embed], components: [row] });
  }

  // Legacy single panel (combines everything)
  async createCombinedPanel(channel) {
    const embed = new EmbedBuilder()
      .setColor(Colors.PRIMARY)
      .setTitle('📬 HyVorn Request Center')
      .setDescription(
        'Welcome! Select what you need help with:\n\n' +
        '🎫 **Support Ticket** - Get help from our team\n' +
        '📋 **Staff Application** - Join our staff team\n' +
        '🐛 **Bug Report** - Report issues you\'ve found\n' +
        '🎮 **Play Report** - Share your play session feedback\n' +
        '💡 **Suggestion** - Share your ideas with us\n\n' +
        '*Click a button below to get started!*'
      )
      .setThumbnail(channel.guild.iconURL({ dynamic: true }))
      .setFooter({ text: 'HyVorn • All requests are handled by our team' })
      .setTimestamp();

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('request_start_ticket')
        .setLabel('Support')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🎫'),
      new ButtonBuilder()
        .setCustomId('request_start_application')
        .setLabel('Apply')
        .setStyle(ButtonStyle.Success)
        .setEmoji('📋'),
      new ButtonBuilder()
        .setCustomId('request_start_bug')
        .setLabel('Bug Report')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🐛')
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('request_start_play')
        .setLabel('Play Report')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🎮'),
      new ButtonBuilder()
        .setCustomId('request_start_suggestion')
        .setLabel('Suggestion')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('💡')
    );

    const message = await channel.send({ embeds: [embed], components: [row1, row2] });

    this.updateSettings(channel.guild.id, {
      panelChannel: channel.id,
      panelMessage: message.id
    });

    return message;
  }

  // ==================== Button Handlers ====================

  async handleButton(interaction, args) {
    const [action, ...rest] = args;

    switch (action) {
      case 'start':
        return this.handleStartButton(interaction, rest[0]);
      case 'dmstart':
        // rest could be ['ticket', 'categoryId'] or just ['type']
        return this.handleDmStartButton(interaction, rest[0], rest[1] || null);
      case 'claim':
        return this.handleClaimButton(interaction, rest[0]);
      case 'close':
        return this.showReasonModal(interaction, rest[0], 'closed');
      case 'approve':
        return this.showReasonModal(interaction, rest[0], 'approved');
      case 'deny':
        return this.showReasonModal(interaction, rest[0], 'denied');
      case 'transcript':
        return this.handleTranscriptButton(interaction, rest[0]);
      case 'continue':
        return this.handleContinueButton(interaction);
      case 'vote':
        return this.handleVoteButton(interaction, rest[0], rest[1]);
    }
  }

  async showReasonModal(interaction, requestId, status) {
    const statusLabels = {
      approved: 'Approve',
      denied: 'Deny',
      closed: 'Close'
    };

    const modal = new ModalBuilder()
      .setCustomId(`request_reason_${requestId}_${status}`)
      .setTitle(`${statusLabels[status]} Request`);

    const reasonInput = new TextInputBuilder()
      .setCustomId('reason')
      .setLabel(`Reason for ${statusLabels[status].toLowerCase()}ing`)
      .setPlaceholder('Enter the reason for this decision...')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMinLength(5)
      .setMaxLength(500);

    modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));

    await interaction.showModal(modal);
  }

  async handleReasonModalSubmit(interaction, requestId, status) {
    const reason = interaction.fields.getTextInputValue('reason');
    await this.handleStatusButton(interaction, requestId, status, reason);
  }

  async handleStartButton(interaction, type) {
    // Check if this is a DM interaction (user clicked button in DMs)
    if (!interaction.guild) {
      // This is from DMs, show the modal directly
      if (type === 'application') {
        // Show application type selector in DMs
        const select = new StringSelectMenuBuilder()
          .setCustomId('request_dm_appselect')
          .setPlaceholder('Select a position to apply for...')
          .addOptions([
            { label: 'Moderator', value: 'app-moderator', emoji: '🛡️', description: '16+, 10hrs/week' },
            { label: 'Admin', value: 'app-admin', emoji: '⚔️', description: '18+, 15hrs/week' },
            { label: 'Builder', value: 'app-builder', emoji: '🏗️', description: '14+, 8hrs/week' },
            { label: 'Developer', value: 'app-developer', emoji: '💻', description: '16+, 10hrs/week' }
          ]);

        const row = new ActionRowBuilder().addComponents(select);
        return interaction.reply({ content: '📋 Select the position you\'d like to apply for:', components: [row] });
      }

      // For other types, show modal directly in DMs
      return this.showRequestModal(interaction, type);
    }

    // Guild interaction - redirect to DMs
    const config = REQUEST_TYPES[type] || { name: type, emoji: '📬' };

    // Prevent duplicate DM sends within 5 seconds
    const existing = this.pendingApplications.get(interaction.user.id);
    if (existing && existing.dmSentAt && Date.now() - existing.dmSentAt < 5000) {
      return interaction.reply({ content: 'Please check your DMs - a message was already sent!', flags: MessageFlags.Ephemeral });
    }

    try {
      // Store guild info for later use with timestamp
      this.pendingApplications.set(interaction.user.id, {
        guildId: interaction.guild.id,
        type: type,
        fromGuild: true,
        dmSentAt: Date.now()
      });

      // Create DM embed and button
      const dmEmbed = new EmbedBuilder()
        .setColor(config.color || Colors.PRIMARY)
        .setTitle(`${config.emoji} ${config.name}`)
        .setDescription(
          `You're starting a **${config.name}** for **${interaction.guild.name}**.\n\n` +
          'Click the button below to begin!'
        )
        .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`request_dmstart_${type}`)
          .setLabel(`Start ${config.name}`)
          .setStyle(ButtonStyle.Primary)
          .setEmoji(config.emoji)
      );

      // Send DM
      await interaction.user.send({ embeds: [dmEmbed], components: [row] });

      // Reply in channel
      await interaction.reply({
        content: `${Emojis.SUCCESS} Check your DMs to continue with your **${config.name}**!`,
        flags: MessageFlags.Ephemeral
      });
    } catch (e) {
      // Can't DM user
      await interaction.reply({
        content: `${Emojis.ERROR} I couldn't send you a DM. Please make sure your DMs are open and try again.`,
        flags: MessageFlags.Ephemeral
      });
    }
  }

  async handleDmStartButton(interaction, type, extra = null) {
    // Get stored guild info
    const pending = this.pendingApplications.get(interaction.user.id);
    if (!pending || !pending.guildId) {
      try {
        return await interaction.reply({
          content: 'Your session has expired. Please go back to the server and try again.'
        });
      } catch (e) {
        // Interaction may have expired
        return;
      }
    }

    // Edit the original DM to remove the button (show it was clicked)
    try {
      const config = REQUEST_TYPES[type] || { name: type, emoji: '📬' };
      await interaction.message.edit({
        embeds: [
          EmbedBuilder.from(interaction.message.embeds[0])
            .setColor(0x57F287)
            .setDescription(`✅ You started this ${config.name}. Fill out the form that appeared!`)
        ],
        components: []
      });
    } catch (e) {
      // Message might not be editable
    }

    // Handle ticket with category
    if (type === 'ticket' && extra) {
      const categoryId = extra;
      const settings = this.getSettings(pending.guildId);
      const categories = settings.ticketCategories || DEFAULT_TICKET_CATEGORIES;
      const category = categories.find(c => c.id === categoryId) || { id: categoryId, name: categoryId, emoji: '🎫' };

      pending.ticketCategory = category;
      this.pendingApplications.set(interaction.user.id, pending);

      return this.showTicketModal(interaction, category);
    }

    // If application, show selector
    if (type === 'application') {
      const select = new StringSelectMenuBuilder()
        .setCustomId('request_dm_appselect')
        .setPlaceholder('Select a position to apply for...')
        .addOptions([
          { label: 'Moderator', value: 'app-moderator', emoji: '🛡️', description: '16+, 10hrs/week' },
          { label: 'Admin', value: 'app-admin', emoji: '⚔️', description: '18+, 15hrs/week' },
          { label: 'Builder', value: 'app-builder', emoji: '🏗️', description: '14+, 8hrs/week' },
          { label: 'Developer', value: 'app-developer', emoji: '💻', description: '16+, 10hrs/week' }
        ]);

      const row = new ActionRowBuilder().addComponents(select);
      return interaction.reply({ content: '📋 Select the position you\'d like to apply for:', components: [row] });
    }

    // Show the modal
    await this.showRequestModal(interaction, type);
  }

  async handleSelectMenu(interaction, args) {
    const [action] = args;

    // Handle DM-based application selection
    if (action === 'dm' && args[1] === 'appselect') {
      const type = interaction.values[0];
      const pending = this.pendingApplications.get(interaction.user.id);
      if (!pending || !pending.guildId) {
        try {
          return await interaction.reply({ content: 'Your session has expired. Please go back to the server and try again.' });
        } catch (e) { return; }
      }
      // Update pending data with selected type
      pending.type = type;
      this.pendingApplications.set(interaction.user.id, pending);
      await this.showRequestModal(interaction, type);
      return;
    }

    // Handle application position selection from guild panel (redirect to DMs)
    if (action === 'appselect') {
      const type = interaction.values[0];
      const config = REQUEST_TYPES[type];

      // Prevent duplicate DM sends within 5 seconds
      const existing = this.pendingApplications.get(interaction.user.id);
      if (existing && existing.dmSentAt && Date.now() - existing.dmSentAt < 5000) {
        return interaction.reply({ content: 'Please check your DMs - a message was already sent!', flags: MessageFlags.Ephemeral });
      }

      // Check if user already has an open application for any role
      const existingApp = this.hasOpenApplication(interaction.guild.id, interaction.user.id);
      if (existingApp) {
        const existingConfig = REQUEST_TYPES[existingApp.type] || { name: existingApp.type };
        return interaction.reply({
          content: `❌ You already have a pending **${existingConfig.name}**. Please wait for it to be reviewed before submitting another application.`,
          flags: MessageFlags.Ephemeral
        });
      }

      try {
        // Store guild info with timestamp
        this.pendingApplications.set(interaction.user.id, {
          guildId: interaction.guild.id,
          type: type,
          fromGuild: true,
          dmSentAt: Date.now()
        });

        // Send DM
        const dmEmbed = new EmbedBuilder()
          .setColor(config.color || Colors.PRIMARY)
          .setTitle(`${config.emoji} ${config.name}`)
          .setDescription(
            `You're starting a **${config.name}** for **${interaction.guild.name}**.\n\n` +
            'Click the button below to begin your application!'
          )
          .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() })
          .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`request_dmstart_${type}`)
            .setLabel(`Start Application`)
            .setStyle(ButtonStyle.Primary)
            .setEmoji(config.emoji)
        );

        await interaction.user.send({ embeds: [dmEmbed], components: [row] });
        await interaction.reply({
          content: `${Emojis.SUCCESS} Check your DMs to continue with your **${config.name}**!`,
          flags: MessageFlags.Ephemeral
        });
      } catch (e) {
        await interaction.reply({
          content: `${Emojis.ERROR} I couldn't send you a DM. Please make sure your DMs are open and try again.`,
          flags: MessageFlags.Ephemeral
        });
      }
      return;
    }

    // Note: Legacy button->dropdown flow removed - now using direct appselect

    // Handle DM-based ticket category selection
    if (action === 'dm' && args[1] === 'ticketcat') {
      const categoryId = interaction.values[0];
      const pending = this.pendingApplications.get(interaction.user.id);
      if (!pending || !pending.guildId) {
        try {
          return await interaction.reply({ content: 'Your session has expired. Please go back to the server and try again.' });
        } catch (e) { return; }
      }

      const guild = await this.client.guilds.fetch(pending.guildId);
      const settings = this.getSettings(pending.guildId);
      const categories = settings.ticketCategories || DEFAULT_TICKET_CATEGORIES;
      const category = categories.find(c => c.id === categoryId);

      pending.ticketCategory = category;
      this.pendingApplications.set(interaction.user.id, pending);

      await this.showTicketModal(interaction, category);
      return;
    }

    // Handle ticket category selection from guild (redirect to DMs)
    if (action === 'ticketcat') {
      const categoryId = interaction.values[0];
      const settings = this.getSettings(interaction.guild.id);
      const categories = settings.ticketCategories || DEFAULT_TICKET_CATEGORIES;
      const category = categories.find(c => c.id === categoryId);

      try {
        // Store guild info and category
        this.pendingApplications.set(interaction.user.id, {
          ticketCategory: category,
          guildId: interaction.guild.id,
          fromGuild: true
        });

        // Send DM
        const dmEmbed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle(`${category.emoji} ${category.name}`)
          .setDescription(
            `You're creating a **${category.name}** ticket for **${interaction.guild.name}**.\n\n` +
            'Click the button below to fill out the ticket form!'
          )
          .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() })
          .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`request_dmstart_ticket_${categoryId}`)
            .setLabel(`Create Ticket`)
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🎫')
        );

        await interaction.user.send({ embeds: [dmEmbed], components: [row] });
        await interaction.reply({
          content: `${Emojis.SUCCESS} Check your DMs to continue with your ticket!`,
          flags: MessageFlags.Ephemeral
        });
      } catch (e) {
        await interaction.reply({
          content: `${Emojis.ERROR} I couldn't send you a DM. Please make sure your DMs are open and try again.`,
          flags: MessageFlags.Ephemeral
        });
      }
    }
  }

  async showTicketModal(interaction, category) {
    const modal = new ModalBuilder()
      .setCustomId(`request_modal_ticket_${category.id}`)
      .setTitle(`${category.emoji} ${category.name}`);

    const subjectInput = new TextInputBuilder()
      .setCustomId('subject')
      .setLabel('Subject')
      .setPlaceholder('Brief summary of your issue')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100);

    const descriptionInput = new TextInputBuilder()
      .setCustomId('description')
      .setLabel('Description')
      .setPlaceholder('Please describe your issue in detail...')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(1000);

    const evidenceInput = new TextInputBuilder()
      .setCustomId('evidence')
      .setLabel('Evidence')
      .setPlaceholder('Links to screenshots, videos, or other evidence (optional)')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)
      .setMaxLength(500);

    modal.addComponents(
      new ActionRowBuilder().addComponents(subjectInput),
      new ActionRowBuilder().addComponents(descriptionInput),
      new ActionRowBuilder().addComponents(evidenceInput)
    );

    await interaction.showModal(modal);
  }

  async handleTicketModalSubmit(interaction, categoryId) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    // Get guild ID from interaction or pending applications (for DM-based flow)
    const pending = this.pendingApplications.get(interaction.user.id);
    const guildId = interaction.guild?.id || pending?.guildId;

    if (!guildId) {
      try {
        return await interaction.editReply({ content: 'Your session has expired. Please go back to the server and try again.' });
      } catch (e) { return; }
    }

    const settings = this.getSettings(guildId);
    const categories = settings.ticketCategories || DEFAULT_TICKET_CATEGORIES;
    const category = pending?.ticketCategory || categories.find(c => c.id === categoryId) || { id: categoryId, name: categoryId, emoji: '🎫' };

    const data = {
      subject: interaction.fields.getTextInputValue('subject'),
      description: interaction.fields.getTextInputValue('description'),
      evidence: interaction.fields.getTextInputValue('evidence') || null,
      category: category
    };

    await this.processRequest(interaction, 'ticket', data, guildId);
  }

  // ==================== Modal Handling ====================

  async showRequestModal(interaction, type) {
    const config = REQUEST_TYPES[type];
    if (!config) {
      return interaction.reply({ content: 'Invalid request type.', flags: MessageFlags.Ephemeral });
    }

    // Get guild ID from interaction or pending applications (for DM-based flow)
    const pending = this.pendingApplications.get(interaction.user.id);
    const guildId = interaction.guild?.id || pending?.guildId;

    if (!guildId) {
      try {
        return await interaction.reply({ content: 'Your session has expired. Please go back to the server and try again.' });
      } catch (e) { return; }
    }

    // Check for existing open requests
    // For applications, check if they have ANY open application (any role)
    if (type.startsWith('app-')) {
      const existingApp = this.hasOpenApplication(guildId, interaction.user.id);
      if (existingApp) {
        const existingConfig = REQUEST_TYPES[existingApp.type] || { name: existingApp.type };
        return interaction.reply({
          content: `❌ You already have a pending **${existingConfig.name}**. Please wait for it to be reviewed before submitting another application.`
        });
      }
    } else {
      // For non-applications, check for same type only
      const existingRequests = this.getUserRequests(guildId, interaction.user.id, type, 'open');
      if (existingRequests.length > 0) {
        return interaction.reply({
          content: `You already have an open ${config.name.toLowerCase()}. Please wait for it to be resolved.`
        });
      }
    }

    // Multi-page applications
    if (config.multiPage) {
      // Preserve existing pending data (like guildId from DM flow)
      const existingPending = this.pendingApplications.get(interaction.user.id) || {};
      this.pendingApplications.set(interaction.user.id, {
        ...existingPending,
        guildId: guildId,
        type: type,
        responses: [],
        currentPage: 0,
        questions: config.questions
      });

      return this.showApplicationPage(interaction, type, 0);
    }

    // Single-page modal
    const modal = new ModalBuilder()
      .setCustomId(`request_modal_${type}`)
      .setTitle(config.name);

    for (const field of config.fields) {
      const input = new TextInputBuilder()
        .setCustomId(field.id)
        .setLabel(field.label)
        .setPlaceholder(field.placeholder || '')
        .setStyle(field.style === 'paragraph' ? TextInputStyle.Paragraph : TextInputStyle.Short)
        .setRequired(field.required !== false)
        .setMaxLength(field.maxLength || 1000);

      modal.addComponents(new ActionRowBuilder().addComponents(input));
    }

    await interaction.showModal(modal);
  }

  async showApplicationPage(interaction, type, page) {
    const pending = this.pendingApplications.get(interaction.user.id);
    if (!pending) return;

    const config = REQUEST_TYPES[type];
    const questions = pending.questions;
    const startIdx = page * 5;
    const pageQuestions = questions.slice(startIdx, startIdx + 5);
    const totalPages = Math.ceil(questions.length / 5);

    const modal = new ModalBuilder()
      .setCustomId(`request_apppage_${page}`)
      .setTitle(`${config.name} (${page + 1}/${totalPages})`);

    pageQuestions.forEach((question, index) => {
      const input = new TextInputBuilder()
        .setCustomId(`q_${startIdx + index}`)
        .setLabel(question.length > 45 ? question.slice(0, 42) + '...' : question)
        .setPlaceholder(question.length > 100 ? question.slice(0, 97) + '...' : (question.length > 45 ? question : ''))
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(1000);

      modal.addComponents(new ActionRowBuilder().addComponents(input));
    });

    await interaction.showModal(modal);
  }

  async handleModalSubmit(interaction, type) {
    const config = REQUEST_TYPES[type];
    if (!config) return;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    // Get guild ID from interaction or pending applications (for DM-based flow)
    const pending = this.pendingApplications.get(interaction.user.id);
    const guildId = interaction.guild?.id || pending?.guildId;

    if (!guildId) {
      try {
        return await interaction.editReply({ content: 'Your session has expired. Please go back to the server and try again.' });
      } catch (e) { return; }
    }

    // Collect data from modal
    const data = {};
    for (const field of config.fields) {
      try {
        data[field.id] = interaction.fields.getTextInputValue(field.id);
      } catch (e) {
        data[field.id] = '';
      }
    }

    // Create the request channel and entry
    await this.processRequest(interaction, type, data, guildId);
  }

  async handleApplicationPageSubmit(interaction, page) {
    const userId = interaction.user.id;
    const pending = this.pendingApplications.get(userId);

    if (!pending) {
      return interaction.reply({
        content: 'Your application session has expired. Please start again.',
        flags: MessageFlags.Ephemeral
      });
    }

    // Collect responses from this page
    const questions = pending.questions;
    const startIdx = page * 5;
    const pageQuestions = questions.slice(startIdx, startIdx + 5);

    pageQuestions.forEach((question, index) => {
      const globalIdx = startIdx + index;
      try {
        const response = interaction.fields.getTextInputValue(`q_${globalIdx}`);
        pending.responses[globalIdx] = { question, response };
      } catch (e) {
        // Field might not exist
      }
    });

    pending.currentPage = page + 1;
    const totalPages = Math.ceil(questions.length / 5);

    // Check if there are more pages
    if (pending.currentPage < totalPages) {
      const embed = new EmbedBuilder()
        .setColor(Colors.PRIMARY)
        .setTitle(`📋 ${REQUEST_TYPES[pending.type].name}`)
        .setDescription(`Page ${page + 1} of ${totalPages} completed!\n\nClick the button below to continue.`)
        .setFooter({ text: `${pending.responses.filter(r => r).length} of ${questions.length} questions answered` });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('request_continue_next')
          .setLabel(`Continue to Page ${pending.currentPage + 1}`)
          .setStyle(ButtonStyle.Primary)
          .setEmoji('➡️')
      );

      await interaction.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral });
    } else {
      // All pages complete, submit
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const data = { responses: pending.responses.filter(r => r) };
      await this.processRequest(interaction, pending.type, data, pending.guildId);

      this.pendingApplications.delete(userId);
    }
  }

  async handleContinueButton(interaction) {
    const pending = this.pendingApplications.get(interaction.user.id);
    if (!pending) {
      return interaction.reply({
        content: 'Your application session has expired. Please start again.'
      });
    }

    await this.showApplicationPage(interaction, pending.type, pending.currentPage);
  }

  // ==================== Request Processing ====================

  async processRequest(interaction, type, data, providedGuildId = null) {
    const config = REQUEST_TYPES[type];

    // Get guild ID from parameter, interaction, or pending applications
    const guildId = providedGuildId || interaction.guild?.id;
    if (!guildId) {
      return interaction.editReply({ content: 'Session expired. Please go back to the server and try again.' });
    }

    // Fetch the guild if we're in DMs
    const guild = interaction.guild || await this.client.guilds.fetch(guildId);

    const settings = this.getSettings(guildId);
    const categoryId = settings.categories[type] || settings.categories[type.split('-')[0]];

    // Determine title
    let title = data.subject || data.title || config.name;
    if (config.multiPage) {
      const username = data.responses?.[0]?.response || interaction.user.username;
      title = `${config.name} - ${username}`;
    }

    // Create request entry first to get ID
    const requestId = this.createRequest({
      guildId: guildId,
      userId: interaction.user.id,
      type: type,
      title: title,
      status: type.startsWith('app-') || type === 'suggestion' ? 'pending' : 'open',
      data: data
    });

    // Create channel
    let channel = null;
    if (categoryId) {
      try {
        // Use request ID in channel name for consistency: TKT-0001-username
        const channelName = `${requestId}-${interaction.user.username}`.toLowerCase().slice(0, 100);

        const permissionOverwrites = [
          { id: guildId, deny: [PermissionFlagsBits.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
          { id: this.client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageMessages] }
        ];

        // Staff roles (managers) ALWAYS have access to all requests
        const allRolesWithAccess = new Set(settings.staffRoles || []);

        // Type-specific roles ALSO get access to their assigned types
        const typeRoles = settings.typeRoles?.[type] || [];
        for (const roleId of typeRoles) {
          allRolesWithAccess.add(roleId);
        }

        // Add staff role permissions
        for (const roleId of allRolesWithAccess) {
          permissionOverwrites.push({
            id: roleId,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
          });
        }

        channel = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          parent: categoryId,
          permissionOverwrites
        });

        this.updateRequest(requestId, { channel_id: channel.id });
      } catch (e) {
        this.log.error('Failed to create channel:', e.message);
      }
    }

    // Create the request embed
    const embed = this.createRequestEmbed(requestId, type, interaction.user, data, 'open');

    // Create action buttons
    const buttons = this.createActionButtons(requestId, type);

    // Send to channel
    if (channel) {
      // Use type-specific roles for ping (falls back to global staffRoles)
      const typeRoles = settings.typeRoles?.[type] || [];
      const rolesForPing = typeRoles.length > 0 ? typeRoles : settings.staffRoles;
      const staffPing = rolesForPing.map(r => `<@&${r}>`).join(' ');
      const msg = await channel.send({
        content: `${interaction.user} ${staffPing}`,
        embeds: [embed],
        components: buttons
      });

      this.updateRequest(requestId, { message_id: msg.id });

      // For applications with more than 10 responses, send follow-up embeds
      if (config.multiPage && data.responses && data.responses.length > 10) {
        const remainingResponses = data.responses.slice(10);

        // Split into chunks of 10 for multiple embeds if needed
        for (let i = 0; i < remainingResponses.length; i += 10) {
          const chunk = remainingResponses.slice(i, i + 10);
          const pageNum = Math.floor(i / 10) + 2;
          const totalPages = Math.ceil(data.responses.length / 10);

          const continueEmbed = new EmbedBuilder()
            .setColor(config.color)
            .setTitle(`📋 Continued Responses (${pageNum}/${totalPages})`)
            .setFooter({ text: `Request ID: ${requestId}` });

          chunk.forEach((r, idx) => {
            const questionNum = 10 + i + idx + 1;
            continueEmbed.addFields({
              name: `Q${questionNum}: ${r.question.slice(0, 200)}`,
              value: r.response.slice(0, 1024) || 'No response',
              inline: false
            });
          });

          await channel.send({ embeds: [continueEmbed] });
        }
      }
    }

    // Send confirmation via DM
    const confirmEmbed = new EmbedBuilder()
      .setColor(Colors.SUCCESS)
      .setTitle(`${Emojis.SUCCESS} ${config.name} Submitted!`)
      .setDescription(channel ? `Your request has been created in **${guild.name}**` : 'Your request has been submitted!')
      .addFields(
        { name: 'Request ID', value: `\`${requestId}\``, inline: true },
        { name: 'Type', value: config.name, inline: true },
        { name: 'Status', value: '🟢 Open', inline: true }
      )
      .setFooter({ text: 'You will be notified when there\'s an update.' })
      .setTimestamp();

    if (channel) {
      confirmEmbed.addFields({ name: 'Channel', value: `${channel}`, inline: false });
    }

    // Try to DM the user (skip if already in DMs)
    const inDMs = !interaction.guild;
    if (inDMs) {
      // Already in DMs, just confirm here
      await interaction.editReply({ embeds: [confirmEmbed] });
    } else {
      // In guild, try to DM
      try {
        await interaction.user.send({ embeds: [confirmEmbed] });
        await interaction.editReply({ content: `${Emojis.SUCCESS} Your request has been submitted! Check your DMs for details.`, embeds: [] });
      } catch (e) {
        // Can't DM user, show ephemeral instead
        await interaction.editReply({ embeds: [confirmEmbed] });
      }
    }
  }

  createRequestEmbed(requestId, type, user, data, status) {
    const config = REQUEST_TYPES[type];
    const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.open;

    const embed = new EmbedBuilder()
      .setColor(statusConfig.color)
      .setTitle(`${config.emoji} ${config.name} #${requestId}`)
      .setThumbnail(user.displayAvatarURL())
      .setTimestamp();

    // Add user info and ticket category if present
    let description = `**Requester:** ${user} (${user.tag})\n**Status:** ${statusConfig.emoji} ${statusConfig.label}`;

    // Add ticket category for tickets
    if (type === 'ticket' && data.category) {
      description += `\n**Category:** ${data.category.emoji || '🎫'} ${data.category.name || 'General'}`;
    }

    embed.setDescription(description);

    // Add data fields
    if (config.multiPage && data.responses) {
      // For applications, show first few responses
      const responses = data.responses.slice(0, 10);
      responses.forEach((r, i) => {
        embed.addFields({
          name: `Q${i + 1}: ${r.question.slice(0, 100)}`,
          value: r.response.slice(0, 1024) || 'No response',
          inline: false
        });
      });

      if (data.responses.length > 10) {
        embed.addFields({
          name: '📄 Continued',
          value: `*${data.responses.length - 10} more responses below*`,
          inline: false
        });
      }
    } else if (config.fields) {
      for (const field of config.fields) {
        if (data[field.id]) {
          embed.addFields({
            name: field.label,
            value: data[field.id].slice(0, 1024),
            inline: false
          });
        }
      }
    }

    embed.setFooter({ text: `Request ID: ${requestId} • Created` });

    return embed;
  }

  createActionButtons(requestId, type) {
    const config = REQUEST_TYPES[type];
    const rows = [];

    const row1 = new ActionRowBuilder();

    // For applications and suggestions, show approve/deny
    if (type.startsWith('app-') || type === 'suggestion') {
      row1.addComponents(
        new ButtonBuilder()
          .setCustomId(`request_approve_${requestId}`)
          .setLabel('Approve')
          .setStyle(ButtonStyle.Success)
          .setEmoji('✅'),
        new ButtonBuilder()
          .setCustomId(`request_deny_${requestId}`)
          .setLabel('Deny')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('❌')
      );
    }

    // Common buttons
    row1.addComponents(
      new ButtonBuilder()
        .setCustomId(`request_claim_${requestId}`)
        .setLabel('Claim')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('✋'),
      new ButtonBuilder()
        .setCustomId(`request_close_${requestId}`)
        .setLabel('Close')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🔒'),
      new ButtonBuilder()
        .setCustomId(`request_transcript_${requestId}`)
        .setLabel('Transcript')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📝')
    );

    rows.push(row1);

    // Note: Voting buttons for suggestions are only added after approval in the public channel
    // So we don't add them here during the staff review phase

    return rows;
  }

  createVoteButtons(requestId, upvotes = 0, downvotes = 0) {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`request_vote_${requestId}_up`)
        .setLabel(String(upvotes))
        .setStyle(ButtonStyle.Success)
        .setEmoji('👍'),
      new ButtonBuilder()
        .setCustomId(`request_vote_${requestId}_down`)
        .setLabel(String(downvotes))
        .setStyle(ButtonStyle.Danger)
        .setEmoji('👎'),
      new ButtonBuilder()
        .setCustomId(`request_vote_${requestId}_remove`)
        .setLabel('Remove Vote')
        .setStyle(ButtonStyle.Secondary)
    );
  }

  // ==================== Action Button Handlers ====================

  async handleClaimButton(interaction, requestId) {
    const request = this.getRequest(requestId);
    if (!request) {
      return interaction.reply({ content: 'Request not found.', flags: MessageFlags.Ephemeral });
    }

    if (request.claimed_by) {
      return interaction.reply({ content: `Already claimed by <@${request.claimed_by}>.`, flags: MessageFlags.Ephemeral });
    }

    this.updateRequest(requestId, { claimed_by: interaction.user.id });

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.SUCCESS)
          .setDescription(`${Emojis.SUCCESS} Claimed by ${interaction.user}`)
      ]
    });
  }

  async handleStatusButton(interaction, requestId, newStatus, reason = null) {
    // Defer reply since we're coming from a modal
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const request = this.getRequest(requestId);
    if (!request) {
      return interaction.editReply({ content: 'Request not found.' });
    }

    // Check permissions
    const settings = this.getSettings(interaction.guild.id);
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const hasPermission = member.permissions.has(PermissionFlagsBits.ManageGuild) ||
      settings.staffRoles.some(r => member.roles.cache.has(r));

    if (!hasPermission) {
      return interaction.editReply({ content: 'You don\'t have permission to do this.' });
    }

    // Store reason in request data
    const updatedData = { ...request.data, closeReason: reason, closedBy: interaction.user.tag };

    this.updateRequest(requestId, {
      status: newStatus,
      closed_by: interaction.user.id,
      closed_at: new Date().toISOString(),
      data: updatedData
    });

    const statusConfig = STATUS_CONFIG[newStatus];
    const config = REQUEST_TYPES[request.type];

    // Update embed - find the original message in the channel
    try {
      const messages = await interaction.channel.messages.fetch({ limit: 50 });
      const originalMsg = messages.find(m => m.embeds[0]?.footer?.text?.includes(requestId));

      if (originalMsg) {
        const embed = EmbedBuilder.from(originalMsg.embeds[0]);
        embed.setColor(statusConfig.color);
        if (embed.data.description) {
          embed.setDescription(embed.data.description.replace(/\*\*Status:\*\* .+/, `**Status:** ${statusConfig.emoji} ${statusConfig.label}`));
        }
        embed.addFields(
          { name: 'Reviewed By', value: `${interaction.user}`, inline: true },
          { name: 'Reason', value: reason || 'No reason provided', inline: false }
        );

        await originalMsg.edit({ embeds: [embed], components: [] });
      }
    } catch (e) {
      this.log.error('Failed to update original message:', e.message);
    }

    // If suggestion is approved, post to public channel for voting
    if (request.type === 'suggestion' && newStatus === 'approved') {
      await this.postApprovedSuggestion(interaction.guild, request, settings);
    }

    // Notify user
    try {
      const user = await this.client.users.fetch(request.user_id);
      const dmEmbed = new EmbedBuilder()
        .setColor(statusConfig.color)
        .setTitle(`📬 Request Update`)
        .setDescription(`Your **${config.name}** has been **${statusConfig.label.toLowerCase()}**.`)
        .addFields(
          { name: 'Request ID', value: `#${requestId}`, inline: true },
          { name: 'Server', value: interaction.guild.name, inline: true },
          { name: 'Reason', value: reason || 'No reason provided', inline: false }
        )
        .setTimestamp();

      if (request.type === 'suggestion' && newStatus === 'approved' && settings.suggestionsChannel) {
        dmEmbed.setDescription(`Your **${config.name}** has been **approved** and is now open for community voting!`);
      }

      await user.send({ embeds: [dmEmbed] });
    } catch (e) {
      // Can't DM user
    }

    // Send transcript (skip for approved suggestions since they go public)
    if (!(request.type === 'suggestion' && newStatus === 'approved')) {
      // Re-fetch request to get updated status
      const updatedRequest = this.getRequest(requestId);
      await this.sendTranscript(interaction.guild.id, updatedRequest, interaction.channel);
    }

    // Remove user access if closing
    if (newStatus === 'approved' || newStatus === 'denied' || newStatus === 'closed') {
      try {
        const channel = interaction.channel;
        await channel.permissionOverwrites.edit(request.user_id, {
          ViewChannel: false,
          SendMessages: false
        });
      } catch (e) {
        // Permission edit failed
      }
    }

    let replyContent = `Request #${requestId} has been **${statusConfig.label.toLowerCase()}**.`;
    if (request.type === 'suggestion' && newStatus === 'approved' && settings.suggestionsChannel) {
      replyContent += ` Posted to <#${settings.suggestionsChannel}> for voting.`;
    }

    // Delete channel after delay for final statuses
    if (newStatus === 'approved' || newStatus === 'denied' || newStatus === 'closed') {
      replyContent += ' This channel will be deleted in 10 seconds.';

      setTimeout(async () => {
        try {
          await interaction.channel.delete();
        } catch (e) {
          // Channel might already be deleted
        }
      }, 10000);
    }

    await interaction.editReply({
      content: replyContent,
      flags: MessageFlags.Ephemeral
    });
  }

  async postApprovedSuggestion(guild, request, settings) {
    if (!settings.suggestionsChannel) {
      this.log.warn('No suggestions channel configured for public voting');
      return;
    }

    try {
      const channel = await guild.channels.fetch(settings.suggestionsChannel);
      if (!channel) return;

      const user = await this.client.users.fetch(request.user_id);
      const data = request.data;

      const embed = new EmbedBuilder()
        .setColor(0xFEE75C)
        .setAuthor({
          name: user.tag,
          iconURL: user.displayAvatarURL()
        })
        .setTitle(`💡 ${data.title || 'Suggestion'}`)
        .setDescription(data.description || 'No description provided.')
        .addFields(
          { name: 'How would this help?', value: data.benefit || 'Not specified', inline: false }
        )
        .setFooter({ text: `Suggestion #${request.id} • Vote below!` })
        .setTimestamp();

      // Initialize votes
      const voteData = { votes: {} };
      this.updateRequest(request.id, { data: { ...data, ...voteData } });

      const voteRow = this.createVoteButtons(request.id, 0, 0);

      const msg = await channel.send({
        embeds: [embed],
        components: [voteRow]
      });

      // Store the public message ID
      this.updateRequest(request.id, {
        message_id: msg.id,
        data: { ...data, publicMessageId: msg.id, publicChannelId: channel.id }
      });

    } catch (e) {
      this.log.error('Failed to post approved suggestion:', e.message);
    }
  }

  async handleCloseButton(interaction, requestId) {
    // handleStatusButton now handles channel deletion for all final statuses
    await this.handleStatusButton(interaction, requestId, 'closed');
  }

  async handleTranscriptButton(interaction, requestId) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const request = this.getRequest(requestId);
    const transcript = await this.generateTranscript(interaction.channel, request);
    const buffer = Buffer.from(transcript, 'utf-8');

    await interaction.editReply({
      content: 'Here is the transcript (open the HTML file in a browser for best viewing):',
      files: [{
        attachment: buffer,
        name: `transcript-${requestId}.html`
      }]
    });
  }

  async handleVoteButton(interaction, requestId, voteType) {
    const request = this.getRequest(requestId);
    if (!request) {
      return interaction.reply({ content: 'Request not found.', flags: MessageFlags.Ephemeral });
    }

    const data = request.data;
    data.votes = data.votes || {};

    if (voteType === 'remove') {
      // Remove vote
      delete data.votes[interaction.user.id];
    } else {
      const currentVote = data.votes[interaction.user.id];
      const newVote = voteType === 'up' ? 1 : -1;

      if (currentVote === newVote) {
        // Remove vote if clicking same button
        delete data.votes[interaction.user.id];
      } else {
        // Set/change vote
        data.votes[interaction.user.id] = newVote;
      }
    }

    this.updateRequest(requestId, { data });

    // Calculate totals
    const upvotes = Object.values(data.votes).filter(v => v === 1).length;
    const downvotes = Object.values(data.votes).filter(v => v === -1).length;
    const netVotes = upvotes - downvotes;

    // Check vote thresholds for auto-action
    const settings = this.getSettings(interaction.guild.id);
    const approveThreshold = settings.suggestionApproveVotes || 0;
    const denyThreshold = settings.suggestionDenyVotes || 0;

    let autoAction = null;

    if (approveThreshold > 0 && netVotes >= approveThreshold) {
      autoAction = 'approved';
    } else if (denyThreshold > 0 && netVotes <= -denyThreshold) {
      autoAction = 'denied';
    }

    // Update the message with new vote counts
    try {
      if (autoAction) {
        // Auto-action triggered - update the message and close voting
        const request = this.getRequest(requestId);
        const statusEmoji = autoAction === 'approved' ? '✅' : '❌';
        const statusColor = autoAction === 'approved' ? 0x57F287 : 0xED4245;

        const embed = EmbedBuilder.from(interaction.message.embeds[0])
          .setColor(statusColor)
          .setFooter({ text: `Suggestion #${requestId} • ${statusEmoji} Community ${autoAction} (${upvotes} 👍 / ${downvotes} 👎)` });

        // Remove vote buttons
        await interaction.update({
          embeds: [embed],
          components: []
        });

        // Update request status
        this.updateRequest(requestId, { status: autoAction === 'approved' ? 'implemented' : 'denied' });

        // Post to approved suggestions channel if configured and approved
        if (autoAction === 'approved' && settings.approvedSuggestionsChannel) {
          try {
            const approvedChannel = await interaction.guild.channels.fetch(settings.approvedSuggestionsChannel);
            if (approvedChannel) {
              const originalEmbed = interaction.message.embeds[0];
              const suggestionContent = originalEmbed.description || 'No description';

              const approvedEmbed = new EmbedBuilder()
                .setColor(0x57F287)
                .setTitle('✅ Community Approved Suggestion')
                .setDescription(suggestionContent)
                .addFields(
                  { name: 'Suggested By', value: `<@${request.userId}>`, inline: true },
                  { name: 'Votes', value: `👍 ${upvotes} | 👎 ${downvotes}`, inline: true },
                  { name: 'Net Score', value: `+${netVotes}`, inline: true }
                )
                .setFooter({ text: `Suggestion #${requestId}` })
                .setTimestamp();

              await approvedChannel.send({ embeds: [approvedEmbed] });
            }
          } catch (err) {
            // Failed to post to approved channel - log but don't break
            logger.child('Requests').warn(`Failed to post to approved suggestions channel: ${err.message}`);
          }
        }
      } else {
        const components = interaction.message.components.map((row) => {
          // Check if this row contains vote buttons
          const hasVoteButton = row.components.some(c =>
            c.customId?.startsWith(`request_vote_${requestId}`)
          );
          if (hasVoteButton) {
            return this.createVoteButtons(requestId, upvotes, downvotes);
          }
          return ActionRowBuilder.from(row);
        });

        await interaction.update({ components });
      }
    } catch (e) {
      await interaction.reply({
        content: `Your vote has been recorded! Current: 👍 ${upvotes} | 👎 ${downvotes}`,
        flags: MessageFlags.Ephemeral
      });
    }
  }

  // ==================== Scheduled Tasks ====================

  async purgeExpiredSuggestions(client) {
    const log = logger.child('Requests');

    for (const guild of client.guilds.cache.values()) {
      try {
        const settings = this.getSettings(guild.id);
        const expireDays = settings.suggestionExpireDays ?? 30;

        // Skip if expiry is disabled
        if (expireDays <= 0) continue;

        const expireTime = Date.now() - (expireDays * 24 * 60 * 60 * 1000);
        const requests = this.getGuildRequests(guild.id);

        for (const request of requests) {
          // Only process suggestions that are still open/approved (in voting phase)
          if (request.type !== 'suggestion') continue;
          if (!['open', 'approved'].includes(request.status)) continue;

          const createdAt = new Date(request.createdAt).getTime();
          if (createdAt > expireTime) continue;

          // This suggestion has expired
          log.debug(`Expiring suggestion ${request.id} in guild ${guild.id}`);

          // Try to update the public message if it exists
          if (request.data?.publicMessageId && settings.suggestionsChannel) {
            try {
              const channel = await guild.channels.fetch(settings.suggestionsChannel);
              if (channel) {
                const message = await channel.messages.fetch(request.data.publicMessageId).catch(() => null);
                if (message) {
                  const data = request.data || { votes: {} };
                  const upvotes = Object.values(data.votes || {}).filter(v => v === 1).length;
                  const downvotes = Object.values(data.votes || {}).filter(v => v === -1).length;

                  const embed = EmbedBuilder.from(message.embeds[0])
                    .setColor(0x95A5A6) // Gray
                    .setFooter({ text: `Suggestion #${request.id} • ⏰ Expired (${upvotes} 👍 / ${downvotes} 👎)` });

                  await message.edit({
                    embeds: [embed],
                    components: []
                  });
                }
              }
            } catch (e) {
              // Message may have been deleted
            }
          }

          // Update status
          this.updateRequest(request.id, { status: 'expired' });
        }
      } catch (error) {
        log.error(`Error purging suggestions for guild ${guild.id}:`, error.message);
      }
    }
  }

  // ==================== Utilities ====================

  async generateTranscript(channel, request) {
    const messages = await channel.messages.fetch({ limit: 100 });
    const sortedMessages = [...messages.values()].reverse();
    const config = REQUEST_TYPES[request?.type] || { name: 'Request', emoji: '📬' };
    const statusConfig = STATUS_CONFIG[request?.status] || STATUS_CONFIG.closed;

    // Generate HTML transcript
    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Transcript - ${request?.id || channel.name}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, sans-serif; background: #36393f; color: #dcddde; margin: 0; padding: 20px; }
    .container { max-width: 900px; margin: 0 auto; }
    .header { background: #2f3136; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
    .header h1 { margin: 0 0 15px 0; color: #fff; font-size: 24px; }
    .header .info { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
    .header .info-item { background: #36393f; padding: 10px; border-radius: 4px; }
    .header .info-item label { font-size: 11px; color: #72767d; text-transform: uppercase; display: block; margin-bottom: 4px; }
    .header .info-item span { color: #fff; }
    .request-data { background: #2f3136; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
    .request-data h2 { margin: 0 0 15px 0; color: #fff; font-size: 18px; }
    .request-data .field { margin-bottom: 15px; }
    .request-data .field label { font-size: 12px; color: #72767d; text-transform: uppercase; display: block; margin-bottom: 4px; }
    .request-data .field p { margin: 0; background: #36393f; padding: 10px; border-radius: 4px; white-space: pre-wrap; }
    .messages { background: #2f3136; border-radius: 8px; padding: 10px; }
    .messages h2 { margin: 10px 10px 15px; color: #fff; font-size: 18px; }
    .message { display: flex; padding: 8px 10px; margin: 2px 0; border-radius: 4px; }
    .message:hover { background: #32353b; }
    .avatar { width: 40px; height: 40px; border-radius: 50%; margin-right: 12px; flex-shrink: 0; background: #5865f2; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: bold; }
    .content { flex: 1; min-width: 0; }
    .author { font-weight: 600; color: #fff; margin-right: 8px; }
    .timestamp { font-size: 11px; color: #72767d; }
    .text { margin-top: 4px; word-wrap: break-word; }
    .embed { background: #2f3136; border-left: 4px solid #5865f2; padding: 10px; margin-top: 8px; border-radius: 4px; }
    .embed-title { font-weight: 600; color: #fff; margin-bottom: 4px; }
    .embed-desc { font-size: 14px; }
    .embed-field { margin-top: 8px; }
    .embed-field label { font-size: 12px; font-weight: 600; color: #fff; }
    .attachment { background: #36393f; padding: 8px; border-radius: 4px; margin-top: 8px; }
    .attachment a { color: #00aff4; text-decoration: none; }
    .footer { text-align: center; color: #72767d; font-size: 12px; margin-top: 20px; padding: 20px; }
    .status-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
  </style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>${config.emoji} ${config.name} #${request?.id || 'Unknown'}</h1>
    <div class="info">
      <div class="info-item"><label>Request ID</label><span>#${request?.id || 'Unknown'}</span></div>
      <div class="info-item"><label>Type</label><span>${config.name}</span></div>
      <div class="info-item"><label>Status</label><span>${statusConfig.emoji} ${statusConfig.label}</span></div>
      <div class="info-item"><label>User</label><span>${request?.user_id ? `<@${request.user_id}>` : 'Unknown'}</span></div>
      <div class="info-item"><label>Created</label><span>${request?.created_at ? new Date(request.created_at).toLocaleString() : 'Unknown'}</span></div>
      <div class="info-item"><label>Closed</label><span>${request?.closed_at ? new Date(request.closed_at).toLocaleString() : 'N/A'}</span></div>
      ${request?.claimed_by ? `<div class="info-item"><label>Claimed By</label><span><@${request.claimed_by}></span></div>` : ''}
      ${request?.closed_by ? `<div class="info-item"><label>Closed By</label><span><@${request.closed_by}></span></div>` : ''}
    </div>
  </div>`;

    // Add request data
    if (request?.data) {
      html += `\n  <div class="request-data">\n    <h2>📋 Request Details</h2>`;

      if (config.multiPage && request.data.responses) {
        // Application responses
        for (const r of request.data.responses) {
          html += `\n    <div class="field">
      <label>${this.escapeHtml(r.question)}</label>
      <p>${this.escapeHtml(r.response)}</p>
    </div>`;
        }
      } else if (config.fields) {
        // Other request types
        for (const field of config.fields) {
          if (request.data[field.id]) {
            html += `\n    <div class="field">
      <label>${this.escapeHtml(field.label)}</label>
      <p>${this.escapeHtml(request.data[field.id])}</p>
    </div>`;
          }
        }
        // Include ticket category if present
        if (request.data.category) {
          html += `\n    <div class="field">
      <label>Category</label>
      <p>${request.data.category.emoji} ${this.escapeHtml(request.data.category.name)}</p>
    </div>`;
        }
      }
      html += `\n  </div>`;
    }

    // Add messages
    html += `\n  <div class="messages">\n    <h2>💬 Conversation (${sortedMessages.length} messages)</h2>`;

    for (const msg of sortedMessages) {
      const time = msg.createdAt.toLocaleString();
      const initial = msg.author.username.charAt(0).toUpperCase();

      html += `\n    <div class="message">
      <div class="avatar">${initial}</div>
      <div class="content">
        <span class="author">${this.escapeHtml(msg.author.tag)}</span>
        <span class="timestamp">${time}</span>
        ${msg.content ? `<div class="text">${this.escapeHtml(msg.content)}</div>` : ''}`;

      // Add embeds
      for (const embed of msg.embeds) {
        html += `\n        <div class="embed" style="border-color: #${(embed.color || 0x5865f2).toString(16).padStart(6, '0')}">
          ${embed.title ? `<div class="embed-title">${this.escapeHtml(embed.title)}</div>` : ''}
          ${embed.description ? `<div class="embed-desc">${this.escapeHtml(embed.description)}</div>` : ''}`;

        if (embed.fields && embed.fields.length > 0) {
          for (const field of embed.fields) {
            html += `\n          <div class="embed-field">
            <label>${this.escapeHtml(field.name)}</label>
            <p>${this.escapeHtml(field.value)}</p>
          </div>`;
          }
        }
        html += `\n        </div>`;
      }

      // Add attachments
      for (const [, attachment] of msg.attachments) {
        html += `\n        <div class="attachment">📎 <a href="${attachment.url}" target="_blank">${this.escapeHtml(attachment.name)}</a></div>`;
      }

      html += `\n      </div>\n    </div>`;
    }

    html += `\n  </div>
  <div class="footer">
    Generated by HyVorn Bot • ${new Date().toLocaleString()}
  </div>
</div>
</body>
</html>`;

    return html;
  }

  escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br>');
  }

  async sendTranscript(guildId, request, channel) {
    const settings = this.getSettings(guildId);
    if (!settings.transcriptChannel) return;

    try {
      const transcriptChannel = await this.client.channels.fetch(settings.transcriptChannel);
      if (!transcriptChannel) return;

      const transcript = await this.generateTranscript(channel, request);
      const buffer = Buffer.from(transcript, 'utf-8');
      const config = REQUEST_TYPES[request.type];
      const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG.closed;

      // Create summary embed
      const embed = new EmbedBuilder()
        .setColor(statusConfig.color)
        .setTitle(`📝 ${config.emoji} ${config.name} #${request.id}`)
        .setDescription(`Request has been **${statusConfig.label.toLowerCase()}**`)
        .addFields(
          { name: 'Request ID', value: `\`${request.id}\``, inline: true },
          { name: 'User', value: `<@${request.user_id}>`, inline: true },
          { name: 'Status', value: `${statusConfig.emoji} ${statusConfig.label}`, inline: true },
          { name: 'Created', value: `<t:${Math.floor(new Date(request.created_at).getTime() / 1000)}:R>`, inline: true },
          { name: 'Closed', value: `<t:${Math.floor(new Date(request.closed_at || Date.now()).getTime() / 1000)}:R>`, inline: true }
        );

      if (request.claimed_by) {
        embed.addFields({ name: 'Claimed By', value: `<@${request.claimed_by}>`, inline: true });
      }
      if (request.closed_by) {
        embed.addFields({ name: 'Closed By', value: `<@${request.closed_by}>`, inline: true });
      }

      // Add request summary
      if (request.data) {
        if (request.data.subject) {
          embed.addFields({ name: 'Subject', value: request.data.subject.slice(0, 1024), inline: false });
        } else if (request.data.title) {
          embed.addFields({ name: 'Title', value: request.data.title.slice(0, 1024), inline: false });
        }
      }

      embed.setFooter({ text: 'Open the HTML file for full transcript with request details' })
        .setTimestamp();

      await transcriptChannel.send({
        embeds: [embed],
        files: [{
          attachment: buffer,
          name: `transcript-${request.id}.html`
        }]
      });

      this.updateRequest(request.id, { transcript: 'saved' });
    } catch (e) {
      this.log.error('Failed to send transcript:', e.message);
    }
  }

  getRequestTypes() {
    return REQUEST_TYPES;
  }
}

export default RequestsModule;
export { REQUEST_TYPES, STATUS_CONFIG };
