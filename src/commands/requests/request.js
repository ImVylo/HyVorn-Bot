// Request command - Unified request system management
// Created by ImVylo

import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType, MessageFlags } from 'discord.js';
import { Colors, Emojis } from '../../utils/constants.js';
import { errorEmbed, successEmbed } from '../../utils/embeds.js';

export default {
  name: 'request',
  description: 'Unified request system (tickets, applications, reports, suggestions)',
  cooldown: 5,
  guildOnly: true,

  data: new SlashCommandBuilder()
    .setName('request')
    .setDescription('Unified request system management')
    .addSubcommand(sub =>
      sub.setName('setup')
        .setDescription('Initial setup - set staff roles and transcript channel')
        .addRoleOption(opt =>
          opt.setName('staff').setDescription('Staff role for handling requests').setRequired(true)
        )
        .addChannelOption(opt =>
          opt.setName('transcripts').setDescription('Channel for transcripts').addChannelTypes(ChannelType.GuildText)
        )
    )
    .addSubcommand(sub =>
      sub.setName('category')
        .setDescription('Set category for a request type')
        .addStringOption(opt =>
          opt.setName('type')
            .setDescription('Request type')
            .setRequired(true)
            .addChoices(
              { name: '🎫 Support Tickets', value: 'ticket' },
              { name: '📋 Applications', value: 'application' },
              { name: '🐛 Bug Reports', value: 'bug' },
              { name: '🎮 Play Reports', value: 'play' },
              { name: '💡 Suggestions', value: 'suggestion' }
            )
        )
        .addChannelOption(opt =>
          opt.setName('category').setDescription('Category to create channels in').addChannelTypes(ChannelType.GuildCategory).setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('suggestions-channel')
        .setDescription('Set the public channel where approved suggestions are posted for voting')
        .addChannelOption(opt =>
          opt.setName('channel').setDescription('Public suggestions channel').addChannelTypes(ChannelType.GuildText).setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('suggestion-votes')
        .setDescription('Set vote thresholds for auto-approving or denying suggestions')
        .addIntegerOption(opt =>
          opt.setName('approve')
            .setDescription('Net upvotes needed to auto-approve (0 to disable)')
            .setMinValue(0)
            .setMaxValue(100)
        )
        .addIntegerOption(opt =>
          opt.setName('deny')
            .setDescription('Net downvotes needed to auto-deny (0 to disable)')
            .setMinValue(0)
            .setMaxValue(100)
        )
    )
    .addSubcommand(sub =>
      sub.setName('suggestion-expire')
        .setDescription('Set how long suggestions stay open before auto-expiring')
        .addIntegerOption(opt =>
          opt.setName('days')
            .setDescription('Days until suggestions expire (0 to disable, default 30)')
            .setMinValue(0)
            .setMaxValue(365)
        )
    )
    .addSubcommand(sub =>
      sub.setName('approved-channel')
        .setDescription('Set channel where community-approved suggestions are posted')
        .addChannelOption(opt =>
          opt.setName('channel')
            .setDescription('Channel for approved suggestions (leave empty to disable)')
            .addChannelTypes(ChannelType.GuildText)
        )
    )
    .addSubcommand(sub =>
      sub.setName('panel')
        .setDescription('Create a request panel in this channel')
        .addStringOption(opt =>
          opt.setName('type')
            .setDescription('Type of panel to create')
            .addChoices(
              { name: '🎫 Tickets (with dropdown)', value: 'ticket' },
              { name: '📋 Applications (with requirements)', value: 'application' },
              { name: '💡 Suggestions (with voting)', value: 'suggestion' },
              { name: '📊 Reports (bug/play)', value: 'report' },
              { name: '📬 All-in-One (combined)', value: 'combined' }
            )
        )
    )
    .addSubcommand(sub =>
      sub.setName('channels')
        .setDescription('View all configured categories and channels')
    )
    .addSubcommand(sub =>
      sub.setName('addrole')
        .setDescription('Add a staff role')
        .addRoleOption(opt =>
          opt.setName('role').setDescription('Staff role to add').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('removerole')
        .setDescription('Remove a staff role')
        .addRoleOption(opt =>
          opt.setName('role').setDescription('Staff role to remove').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('typerole')
        .setDescription('Assign a role to handle a specific request type')
        .addStringOption(opt =>
          opt.setName('type')
            .setDescription('Request type')
            .setRequired(true)
            .addChoices(
              { name: '🎫 Support Tickets', value: 'ticket' },
              { name: '🛡️ Moderator Applications', value: 'app-moderator' },
              { name: '⚔️ Admin Applications', value: 'app-admin' },
              { name: '🏗️ Builder Applications', value: 'app-builder' },
              { name: '💻 Developer Applications', value: 'app-developer' },
              { name: '🐛 Bug Reports', value: 'bug' },
              { name: '🎮 Play Reports', value: 'play' },
              { name: '💡 Suggestions', value: 'suggestion' }
            )
        )
        .addRoleOption(opt =>
          opt.setName('role').setDescription('Role that can handle this type').setRequired(true)
        )
        .addBooleanOption(opt =>
          opt.setName('remove').setDescription('Remove this role from the type instead of adding')
        )
    )
    .addSubcommand(sub =>
      sub.setName('view')
        .setDescription('View a specific request')
        .addStringOption(opt =>
          opt.setName('id').setDescription('Request ID (e.g., TKT-0001)').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('List requests')
        .addStringOption(opt =>
          opt.setName('type')
            .setDescription('Filter by type')
            .addChoices(
              { name: '🎫 Tickets', value: 'ticket' },
              { name: '📋 Applications', value: 'application' },
              { name: '🐛 Bug Reports', value: 'bug' },
              { name: '🎮 Play Reports', value: 'play' },
              { name: '💡 Suggestions', value: 'suggestion' }
            )
        )
        .addStringOption(opt =>
          opt.setName('status')
            .setDescription('Filter by status')
            .addChoices(
              { name: '🟢 Open', value: 'open' },
              { name: '🟡 Pending', value: 'pending' },
              { name: '✅ Approved', value: 'approved' },
              { name: '❌ Denied', value: 'denied' },
              { name: '🔒 Closed', value: 'closed' }
            )
        )
    ),

  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();
    const requestsModule = client.getModule('requests');

    if (!requestsModule) {
      return interaction.reply({
        embeds: [errorEmbed('Requests module is not loaded.')],
        flags: MessageFlags.Ephemeral
      });
    }

    const guild = interaction.guild;

    switch (subcommand) {
      case 'setup': {
        // Owner-only command
        if (interaction.user.id !== guild.ownerId) {
          return interaction.reply({
            embeds: [errorEmbed('Only the server owner can setup the request system.')],
            flags: MessageFlags.Ephemeral
          });
        }

        const staffRole = interaction.options.getRole('staff');
        const transcriptsChannel = interaction.options.getChannel('transcripts');

        const settings = requestsModule.getSettings(guild.id);
        const staffRoles = settings.staffRoles || [];

        if (!staffRoles.includes(staffRole.id)) {
          staffRoles.push(staffRole.id);
        }

        requestsModule.updateSettings(guild.id, {
          enabled: true,
          staffRoles: staffRoles,
          transcriptChannel: transcriptsChannel?.id || settings.transcriptChannel
        });

        const embed = new EmbedBuilder()
          .setColor(Colors.SUCCESS)
          .setTitle(`${Emojis.SUCCESS} Request System Setup!`)
          .setDescription('The unified request system has been configured.')
          .addFields(
            { name: 'Staff Role', value: `${staffRole}`, inline: true },
            { name: 'Transcripts', value: transcriptsChannel ? `${transcriptsChannel}` : 'Not set', inline: true }
          )
          .setFooter({ text: 'Use /request category to set categories for each type' })
          .setTimestamp();

        return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      }

      case 'category': {
        const member = await guild.members.fetch(interaction.user.id);
        if (!member.permissions.has(PermissionFlagsBits.ManageGuild)) {
          return interaction.reply({
            embeds: [errorEmbed('You need Manage Server permission.')],
            flags: MessageFlags.Ephemeral
          });
        }

        const type = interaction.options.getString('type');
        const category = interaction.options.getChannel('category');

        const settings = requestsModule.getSettings(guild.id);
        const categories = settings.categories || {};

        // For applications, set the general 'application' category
        const categoryKey = type === 'application' ? 'app-moderator' : type;
        categories[categoryKey] = category.id;

        // If it's application, set for all app types
        if (type === 'application') {
          categories['app-admin'] = category.id;
          categories['app-builder'] = category.id;
          categories['app-developer'] = category.id;
        }

        requestsModule.updateSettings(guild.id, { categories });

        const typeNames = {
          ticket: '🎫 Support Tickets',
          application: '📋 Applications',
          bug: '🐛 Bug Reports',
          play: '🎮 Play Reports',
          suggestion: '💡 Suggestions'
        };

        return interaction.reply({
          embeds: [successEmbed(`${typeNames[type]} will now be created in ${category}`)],
          flags: MessageFlags.Ephemeral
        });
      }

      case 'suggestions-channel': {
        const member = await guild.members.fetch(interaction.user.id);
        if (!member.permissions.has(PermissionFlagsBits.ManageGuild)) {
          return interaction.reply({
            embeds: [errorEmbed('You need Manage Server permission.')],
            flags: MessageFlags.Ephemeral
          });
        }

        const channel = interaction.options.getChannel('channel');
        requestsModule.updateSettings(guild.id, { suggestionsChannel: channel.id });

        return interaction.reply({
          embeds: [successEmbed(`Approved suggestions will be posted to ${channel} for public voting.`)],
          flags: MessageFlags.Ephemeral
        });
      }

      case 'suggestion-votes': {
        const member = await guild.members.fetch(interaction.user.id);
        if (!member.permissions.has(PermissionFlagsBits.ManageGuild)) {
          return interaction.reply({
            embeds: [errorEmbed('You need Manage Server permission.')],
            flags: MessageFlags.Ephemeral
          });
        }

        const approveThreshold = interaction.options.getInteger('approve');
        const denyThreshold = interaction.options.getInteger('deny');
        const settings = requestsModule.getSettings(guild.id);

        // If no options provided, show current settings
        if (approveThreshold === null && denyThreshold === null) {
          const currentApprove = settings.suggestionApproveVotes || 0;
          const currentDeny = settings.suggestionDenyVotes || 0;

          const embed = new EmbedBuilder()
            .setColor(Colors.INFO)
            .setTitle('💡 Suggestion Vote Thresholds')
            .addFields(
              {
                name: 'Auto-Approve',
                value: currentApprove > 0 ? `${currentApprove} net upvotes` : 'Disabled',
                inline: true
              },
              {
                name: 'Auto-Deny',
                value: currentDeny > 0 ? `${currentDeny} net downvotes` : 'Disabled',
                inline: true
              }
            )
            .setDescription('Use `/request suggestion-votes approve:<num> deny:<num>` to configure.')
            .setFooter({ text: 'Net votes = upvotes - downvotes' });

          return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        const updates = {};
        const messages = [];

        if (approveThreshold !== null) {
          updates.suggestionApproveVotes = approveThreshold;
          messages.push(approveThreshold > 0
            ? `Auto-approve at **${approveThreshold}** net upvotes`
            : 'Auto-approve **disabled**');
        }

        if (denyThreshold !== null) {
          updates.suggestionDenyVotes = denyThreshold;
          messages.push(denyThreshold > 0
            ? `Auto-deny at **${denyThreshold}** net downvotes`
            : 'Auto-deny **disabled**');
        }

        requestsModule.updateSettings(guild.id, updates);

        return interaction.reply({
          embeds: [successEmbed(`Suggestion vote thresholds updated:\n${messages.join('\n')}`)],
          flags: MessageFlags.Ephemeral
        });
      }

      case 'suggestion-expire': {
        const member = await guild.members.fetch(interaction.user.id);
        if (!member.permissions.has(PermissionFlagsBits.ManageGuild)) {
          return interaction.reply({
            embeds: [errorEmbed('You need Manage Server permission.')],
            flags: MessageFlags.Ephemeral
          });
        }

        const days = interaction.options.getInteger('days');
        const settings = requestsModule.getSettings(guild.id);

        // If no option provided, show current setting
        if (days === null) {
          const currentDays = settings.suggestionExpireDays ?? 30;

          const embed = new EmbedBuilder()
            .setColor(Colors.INFO)
            .setTitle('💡 Suggestion Expiry')
            .setDescription(currentDays > 0
              ? `Suggestions expire after **${currentDays} days** of no activity.`
              : 'Suggestion expiry is **disabled**.')
            .setFooter({ text: 'Use /request suggestion-expire days:<num> to change' });

          return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        requestsModule.updateSettings(guild.id, { suggestionExpireDays: days });

        return interaction.reply({
          embeds: [successEmbed(days > 0
            ? `Suggestions will now expire after **${days} days**.`
            : 'Suggestion expiry has been **disabled**.')],
          flags: MessageFlags.Ephemeral
        });
      }

      case 'approved-channel': {
        const member = await guild.members.fetch(interaction.user.id);
        if (!member.permissions.has(PermissionFlagsBits.ManageGuild)) {
          return interaction.reply({
            embeds: [errorEmbed('You need Manage Server permission.')],
            flags: MessageFlags.Ephemeral
          });
        }

        const channel = interaction.options.getChannel('channel');

        if (channel) {
          requestsModule.updateSettings(guild.id, { approvedSuggestionsChannel: channel.id });
          return interaction.reply({
            embeds: [successEmbed(`Community-approved suggestions will be posted to ${channel}.`)],
            flags: MessageFlags.Ephemeral
          });
        } else {
          requestsModule.updateSettings(guild.id, { approvedSuggestionsChannel: null });
          return interaction.reply({
            embeds: [successEmbed('Approved suggestions channel has been disabled. Suggestions will stay in the voting channel.')],
            flags: MessageFlags.Ephemeral
          });
        }
      }

      case 'panel': {
        const member = await guild.members.fetch(interaction.user.id);
        if (!member.permissions.has(PermissionFlagsBits.ManageGuild)) {
          return interaction.reply({
            embeds: [errorEmbed('You need Manage Server permission.')],
            flags: MessageFlags.Ephemeral
          });
        }

        const panelType = interaction.options.getString('type') || 'combined';

        if (panelType === 'combined') {
          await requestsModule.createCombinedPanel(interaction.channel);
        } else {
          await requestsModule.createPanel(interaction.channel, panelType);
        }

        const typeNames = {
          ticket: '🎫 Ticket panel',
          application: '📋 Application panel',
          suggestion: '💡 Suggestion panel',
          report: '📊 Report panel',
          combined: '📬 Combined panel'
        };

        return interaction.reply({
          content: `${typeNames[panelType]} created!`,
          flags: MessageFlags.Ephemeral
        });
      }

      case 'channels': {
        const settings = requestsModule.getSettings(guild.id);
        const categories = settings.categories || {};
        const typeRoles = settings.typeRoles || {};

        // Build type-specific roles string
        const typeRolesList = [];
        const typeNames = {
          'ticket': '🎫 Tickets',
          'app-moderator': '🛡️ Mod Apps',
          'app-admin': '⚔️ Admin Apps',
          'app-builder': '🏗️ Builder Apps',
          'app-developer': '💻 Dev Apps',
          'bug': '🐛 Bug Reports',
          'play': '🎮 Play Reports',
          'suggestion': '💡 Suggestions'
        };

        for (const [type, roles] of Object.entries(typeRoles)) {
          if (roles && roles.length > 0) {
            typeRolesList.push(`**${typeNames[type] || type}:** ${roles.map(r => `<@&${r}>`).join(', ')}`);
          }
        }

        const embed = new EmbedBuilder()
          .setColor(Colors.PRIMARY)
          .setTitle('📬 Request System Configuration')
          .addFields(
            { name: '🎫 Tickets Category', value: categories.ticket ? `<#${categories.ticket}>` : 'Not set', inline: true },
            { name: '📋 Applications Category', value: categories['app-moderator'] ? `<#${categories['app-moderator']}>` : 'Not set', inline: true },
            { name: '🐛 Bug Reports Category', value: categories.bug ? `<#${categories.bug}>` : 'Not set', inline: true },
            { name: '🎮 Play Reports Category', value: categories.play ? `<#${categories.play}>` : 'Not set', inline: true },
            { name: '💡 Suggestions Review Category', value: categories.suggestion ? `<#${categories.suggestion}>` : 'Not set', inline: true },
            { name: '💡 Suggestions Public Channel', value: settings.suggestionsChannel ? `<#${settings.suggestionsChannel}>` : 'Not set', inline: true },
            { name: '📝 Transcripts Channel', value: settings.transcriptChannel ? `<#${settings.transcriptChannel}>` : 'Not set', inline: true },
            { name: '👥 Global Staff Roles', value: settings.staffRoles?.length > 0 ? settings.staffRoles.map(r => `<@&${r}>`).join(', ') : 'None', inline: false },
            { name: '🔐 Type-Specific Roles', value: typeRolesList.length > 0 ? typeRolesList.join('\n') : 'None (using global roles)', inline: false }
          )
          .setFooter({ text: 'Use /request typerole to assign roles to specific types' })
          .setTimestamp();

        return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      }

      case 'addrole': {
        const member = await guild.members.fetch(interaction.user.id);
        if (!member.permissions.has(PermissionFlagsBits.ManageGuild)) {
          return interaction.reply({
            embeds: [errorEmbed('You need Manage Server permission.')],
            flags: MessageFlags.Ephemeral
          });
        }

        const role = interaction.options.getRole('role');
        const settings = requestsModule.getSettings(guild.id);
        const staffRoles = settings.staffRoles || [];

        if (staffRoles.includes(role.id)) {
          return interaction.reply({
            embeds: [errorEmbed('This role is already a staff role.')],
            flags: MessageFlags.Ephemeral
          });
        }

        staffRoles.push(role.id);
        requestsModule.updateSettings(guild.id, { staffRoles });

        return interaction.reply({
          embeds: [successEmbed(`${role} has been added as a staff role.`)],
          flags: MessageFlags.Ephemeral
        });
      }

      case 'removerole': {
        const member = await guild.members.fetch(interaction.user.id);
        if (!member.permissions.has(PermissionFlagsBits.ManageGuild)) {
          return interaction.reply({
            embeds: [errorEmbed('You need Manage Server permission.')],
            flags: MessageFlags.Ephemeral
          });
        }

        const role = interaction.options.getRole('role');
        const settings = requestsModule.getSettings(guild.id);
        let staffRoles = settings.staffRoles || [];

        if (!staffRoles.includes(role.id)) {
          return interaction.reply({
            embeds: [errorEmbed('This role is not a staff role.')],
            flags: MessageFlags.Ephemeral
          });
        }

        staffRoles = staffRoles.filter(r => r !== role.id);
        requestsModule.updateSettings(guild.id, { staffRoles });

        return interaction.reply({
          embeds: [successEmbed(`${role} has been removed from staff roles.`)],
          flags: MessageFlags.Ephemeral
        });
      }

      case 'typerole': {
        // Owner-only command
        if (interaction.user.id !== guild.ownerId) {
          return interaction.reply({
            embeds: [errorEmbed('Only the server owner can configure type-specific roles.')],
            flags: MessageFlags.Ephemeral
          });
        }

        const type = interaction.options.getString('type');
        const role = interaction.options.getRole('role');
        const remove = interaction.options.getBoolean('remove') || false;

        const settings = requestsModule.getSettings(guild.id);
        const typeRoles = settings.typeRoles || {};

        if (!typeRoles[type]) {
          typeRoles[type] = [];
        }

        const typeNames = {
          'ticket': '🎫 Support Tickets',
          'app-moderator': '🛡️ Moderator Applications',
          'app-admin': '⚔️ Admin Applications',
          'app-builder': '🏗️ Builder Applications',
          'app-developer': '💻 Developer Applications',
          'bug': '🐛 Bug Reports',
          'play': '🎮 Play Reports',
          'suggestion': '💡 Suggestions'
        };

        if (remove) {
          typeRoles[type] = typeRoles[type].filter(r => r !== role.id);
          requestsModule.updateSettings(guild.id, { typeRoles });
          return interaction.reply({
            embeds: [successEmbed(`${role} removed from **${typeNames[type]}**.`)],
            flags: MessageFlags.Ephemeral
          });
        } else {
          if (!typeRoles[type].includes(role.id)) {
            typeRoles[type].push(role.id);
          }
          requestsModule.updateSettings(guild.id, { typeRoles });
          return interaction.reply({
            embeds: [successEmbed(`${role} can now handle **${typeNames[type]}**.`)],
            flags: MessageFlags.Ephemeral
          });
        }
      }

      case 'view': {
        const requestId = interaction.options.getString('id').toUpperCase();
        const request = requestsModule.getRequest(requestId);

        if (!request) {
          return interaction.reply({
            embeds: [errorEmbed(`Request #${requestId} not found.`)],
            flags: MessageFlags.Ephemeral
          });
        }

        // Check permissions
        const settings = requestsModule.getSettings(guild.id);
        const member = await guild.members.fetch(interaction.user.id);
        const isStaff = member.permissions.has(PermissionFlagsBits.ManageGuild) ||
          settings.staffRoles?.some(r => member.roles.cache.has(r));
        const isRequester = request.user_id === interaction.user.id;

        if (!isStaff && !isRequester) {
          return interaction.reply({
            embeds: [errorEmbed('You can only view your own requests.')],
            flags: MessageFlags.Ephemeral
          });
        }

        const types = requestsModule.getRequestTypes();
        const config = types[request.type] || { name: 'Unknown', emoji: '❓', color: Colors.PRIMARY };

        const statusEmoji = {
          open: '🟢',
          pending: '🟡',
          in_progress: '🔵',
          approved: '✅',
          denied: '❌',
          closed: '🔒'
        };

        const embed = new EmbedBuilder()
          .setColor(config.color)
          .setTitle(`${config.emoji} ${config.name} #${requestId}`)
          .setDescription(`**Requester:** <@${request.user_id}>\n**Status:** ${statusEmoji[request.status] || '❓'} ${request.status}`)
          .addFields(
            { name: 'Created', value: `<t:${Math.floor(new Date(request.created_at).getTime() / 1000)}:R>`, inline: true },
            { name: 'Channel', value: request.channel_id ? `<#${request.channel_id}>` : 'None', inline: true }
          )
          .setTimestamp();

        if (request.claimed_by) {
          embed.addFields({ name: 'Claimed By', value: `<@${request.claimed_by}>`, inline: true });
        }

        if (request.closed_by) {
          embed.addFields(
            { name: 'Closed By', value: `<@${request.closed_by}>`, inline: true },
            { name: 'Closed At', value: `<t:${Math.floor(new Date(request.closed_at).getTime() / 1000)}:R>`, inline: true }
          );
        }

        // Add data preview
        const data = request.data;
        if (data.responses) {
          const preview = data.responses.slice(0, 3).map((r, i) =>
            `**Q${i + 1}:** ${r.question.slice(0, 50)}...\n*${r.response.slice(0, 100)}...*`
          ).join('\n\n');
          embed.addFields({ name: 'Responses Preview', value: preview || 'No responses', inline: false });
        } else if (data.description || data.title) {
          embed.addFields({ name: 'Title', value: data.title || data.subject || 'N/A', inline: false });
          if (data.description) {
            embed.addFields({ name: 'Description', value: data.description.slice(0, 500), inline: false });
          }
        }

        return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      }

      case 'list': {
        const type = interaction.options.getString('type');
        const status = interaction.options.getString('status');

        // Build query
        let query = 'SELECT * FROM requests WHERE guild_id = ?';
        const params = [guild.id];

        if (type) {
          if (type === 'application') {
            query += ' AND type LIKE ?';
            params.push('app-%');
          } else {
            query += ' AND type = ?';
            params.push(type);
          }
        }

        if (status) {
          query += ' AND status = ?';
          params.push(status);
        }

        query += ' ORDER BY created_at DESC LIMIT 20';

        const requests = client.db.db.prepare(query).all(...params);

        if (requests.length === 0) {
          return interaction.reply({
            embeds: [new EmbedBuilder()
              .setColor(Colors.INFO)
              .setDescription('No requests found matching your criteria.')
            ],
            flags: MessageFlags.Ephemeral
          });
        }

        const types = requestsModule.getRequestTypes();
        const statusEmoji = { open: '🟢', pending: '🟡', in_progress: '🔵', approved: '✅', denied: '❌', closed: '🔒' };

        const description = requests.map(r => {
          const config = types[r.type] || { emoji: '❓', name: 'Unknown' };
          return `${config.emoji} **#${r.id}** - ${statusEmoji[r.status]} ${r.status} - <@${r.user_id}>`;
        }).join('\n');

        const embed = new EmbedBuilder()
          .setColor(Colors.PRIMARY)
          .setTitle('📬 Recent Requests')
          .setDescription(description)
          .setFooter({ text: `Showing ${requests.length} requests` })
          .setTimestamp();

        return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      }
    }
  }
};
