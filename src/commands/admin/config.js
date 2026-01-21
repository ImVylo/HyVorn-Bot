// Config command - Server configuration panel
// Created by ImVylo

import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ChannelType,
  PermissionFlagsBits
} from 'discord.js';
import { BOT_COLOR, PermissionLevels, Emojis } from '../../utils/constants.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';

export default {
  name: 'config',
  description: 'Configure bot settings for this server',
  aliases: ['settings', 'setup'],
  cooldown: 5,
  guildOnly: true,
  permissionLevel: PermissionLevels.ADMIN,

  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Configure bot settings for this server')
    .addSubcommand(sub =>
      sub
        .setName('view')
        .setDescription('View current configuration')
    )
    .addSubcommand(sub =>
      sub
        .setName('role')
        .setDescription('Configure bot roles (admin, mod, mute, member)')
        .addStringOption(opt =>
          opt
            .setName('type')
            .setDescription('The type of role to configure')
            .setRequired(true)
            .addChoices(
              { name: 'Admin Role (can use admin commands)', value: 'admin' },
              { name: 'Mod Role (can use mod commands)', value: 'mod' },
              { name: 'Mute Role (assigned when muted)', value: 'mute' },
              { name: 'Member Role (required to use bot)', value: 'member' }
            )
        )
        .addRoleOption(opt =>
          opt.setName('role').setDescription('The role (leave empty to clear for mute/member)').setRequired(false)
        )
        .addBooleanOption(opt =>
          opt.setName('remove').setDescription('Remove this role (for admin/mod roles)')
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('logchannel')
        .setDescription('Set the log channel')
        .addChannelOption(opt =>
          opt
            .setName('channel')
            .setDescription('The log channel')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('welcomechannel')
        .setDescription('Set the welcome channel')
        .addChannelOption(opt =>
          opt
            .setName('channel')
            .setDescription('The welcome channel')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('levelupchannel')
        .setDescription('Set the level-up notification channel')
        .addChannelOption(opt =>
          opt
            .setName('channel')
            .setDescription('The level-up channel (or current for same channel)')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('toggle')
        .setDescription('Toggle a module on/off')
        .addStringOption(opt =>
          opt
            .setName('module')
            .setDescription('The module to toggle')
            .setRequired(true)
            .addChoices(
              { name: 'Leveling', value: 'leveling' },
              { name: 'Economy', value: 'economy' },
              { name: 'Welcome', value: 'welcome' },
              { name: 'AutoMod', value: 'automod' },
              { name: 'Logging', value: 'logging' },
              { name: 'Tickets', value: 'tickets' }
            )
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('funchannel')
        .setDescription('Set the channel where fun commands can be used (leave empty to allow everywhere)')
        .addChannelOption(opt =>
          opt
            .setName('channel')
            .setDescription('The fun commands channel (leave empty to allow everywhere)')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('autopunish')
        .setDescription('Configure automatic punishment escalation for warnings')
        .addStringOption(opt =>
          opt
            .setName('action')
            .setDescription('The automatic action to configure')
            .setRequired(true)
            .addChoices(
              { name: 'Auto-Mute (at X warnings)', value: 'mute' },
              { name: 'Auto-Kick (at X warnings)', value: 'kick' },
              { name: 'Auto-Ban (at X warnings)', value: 'ban' },
              { name: 'View Current Settings', value: 'view' },
              { name: 'Reset All', value: 'reset' }
            )
        )
        .addIntegerOption(opt =>
          opt
            .setName('warnings')
            .setDescription('Number of warnings to trigger action (0 to disable)')
            .setMinValue(0)
            .setMaxValue(50)
            .setRequired(false)
        )
        .addIntegerOption(opt =>
          opt
            .setName('mute_duration')
            .setDescription('Mute duration in minutes (for auto-mute only)')
            .setMinValue(1)
            .setMaxValue(10080)
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('autorole')
        .setDescription('Set a role to automatically assign to new members')
        .addRoleOption(opt =>
          opt
            .setName('role')
            .setDescription('The role to assign (leave empty to disable)')
            .setRequired(false)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction, client) {
    const isSlash = interaction.isChatInputCommand?.();

    if (!isSlash) {
      // For prefix command, show interactive menu
      return showConfigMenu(interaction, client);
    }

    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    switch (subcommand) {
      case 'view':
        return showConfig(interaction, client);

      case 'role': {
        const roleType = interaction.options.getString('type');
        const role = interaction.options.getRole('role');
        const remove = interaction.options.getBoolean('remove') || false;
        const settings = client.db.getGuild(guildId).settings;

        // Admin roles are owner-only
        if (roleType === 'admin' && interaction.user.id !== interaction.guild.ownerId) {
          return interaction.reply({
            embeds: [errorEmbed('Only the server owner can configure admin roles.')],
            ephemeral: true
          });
        }

        // Handle array-based roles (admin, mod)
        if (roleType === 'admin' || roleType === 'mod') {
          const settingKey = roleType === 'admin' ? 'adminRoles' : 'modRoles';
          const roleName = roleType === 'admin' ? 'admin' : 'moderator';
          let roles = settings[settingKey] || [];

          if (!role) {
            return interaction.reply({
              embeds: [errorEmbed(`Please specify a role to ${remove ? 'remove' : 'add'}.`)],
              ephemeral: true
            });
          }

          if (remove) {
            if (!roles.includes(role.id)) {
              return interaction.reply({
                embeds: [errorEmbed(`${role} is not a ${roleName} role.`)],
                ephemeral: true
              });
            }
            roles = roles.filter(r => r !== role.id);
            client.db.setSetting(guildId, settingKey, roles);
            return interaction.reply({
              embeds: [successEmbed(`${role} has been removed as a ${roleName} role.`)]
            });
          } else {
            if (!roles.includes(role.id)) {
              roles.push(role.id);
              client.db.setSetting(guildId, settingKey, roles);
            }
            return interaction.reply({
              embeds: [successEmbed(`${role} has been added as a ${roleName} role.`)]
            });
          }
        }

        // Handle single roles (mute, member)
        if (roleType === 'mute') {
          if (role) {
            client.db.setSetting(guildId, 'muteRole', role.id);
            return interaction.reply({
              embeds: [successEmbed(`Mute role set to ${role}.`)]
            });
          } else {
            client.db.setSetting(guildId, 'muteRole', null);
            return interaction.reply({
              embeds: [successEmbed('Mute role has been cleared.')]
            });
          }
        }

        if (roleType === 'member') {
          if (role) {
            client.db.setSetting(guildId, 'memberRole', role.id);
            return interaction.reply({
              embeds: [successEmbed(`Users must have ${role} to use bot commands.`)]
            });
          } else {
            client.db.setSetting(guildId, 'memberRole', null);
            return interaction.reply({
              embeds: [successEmbed('All users can now use bot commands (no role required).')]
            });
          }
        }
        break;
      }

      case 'logchannel': {
        const channel = interaction.options.getChannel('channel');
        client.db.setSetting(guildId, 'logChannel', channel.id);

        return interaction.reply({
          embeds: [successEmbed(`Log channel set to ${channel}.`)]
        });
      }

      case 'welcomechannel': {
        const channel = interaction.options.getChannel('channel');
        client.db.setSetting(guildId, 'welcomeChannel', channel.id);

        return interaction.reply({
          embeds: [successEmbed(`Welcome channel set to ${channel}.`)]
        });
      }

      case 'levelupchannel': {
        const channel = interaction.options.getChannel('channel');
        if (channel) {
          client.db.setSetting(guildId, 'levelUpChannel', channel.id);
          return interaction.reply({
            embeds: [successEmbed(`Level-up notifications will be sent to ${channel}.`)]
          });
        } else {
          client.db.setSetting(guildId, 'levelUpChannel', 'current');
          return interaction.reply({
            embeds: [successEmbed(`Level-up notifications will be sent in the current channel.`)]
          });
        }
      }

      case 'toggle': {
        const moduleName = interaction.options.getString('module');
        const settings = client.db.getGuild(guildId).settings;
        const enabledModules = settings.enabledModules || {
          leveling: true,
          economy: true,
          welcome: true,
          automod: true,
          logging: true,
          tickets: true
        };

        enabledModules[moduleName] = !enabledModules[moduleName];
        client.db.setSetting(guildId, 'enabledModules', enabledModules);

        const status = enabledModules[moduleName] ? 'enabled' : 'disabled';
        return interaction.reply({
          embeds: [successEmbed(`${capitalize(moduleName)} module has been **${status}**.`)]
        });
      }

      case 'funchannel': {
        const channel = interaction.options.getChannel('channel');
        if (channel) {
          client.db.setSetting(guildId, 'funChannel', channel.id);
          return interaction.reply({
            embeds: [successEmbed(`Fun commands can now only be used in ${channel}.`)]
          });
        } else {
          client.db.setSetting(guildId, 'funChannel', null);
          return interaction.reply({
            embeds: [successEmbed(`Fun commands can now be used in any channel.`)]
          });
        }
      }

      case 'autopunish': {
        // Owner-only command (except view)
        const action = interaction.options.getString('action');
        if (action !== 'view' && interaction.user.id !== interaction.guild.ownerId) {
          return interaction.reply({
            embeds: [errorEmbed('Only the server owner can configure auto-punishment settings.')],
            ephemeral: true
          });
        }

        const warnings = interaction.options.getInteger('warnings');
        const muteDuration = interaction.options.getInteger('mute_duration');
        const settings = client.db.getGuild(guildId).settings;
        const warnPunishments = settings.warnPunishments || {};

        if (action === 'view') {
          const embed = new EmbedBuilder()
            .setColor(BOT_COLOR)
            .setTitle('Auto-Punishment Settings')
            .addFields(
              {
                name: 'Auto-Mute',
                value: warnPunishments.muteAt
                  ? `At ${warnPunishments.muteAt} warnings (${warnPunishments.muteDuration || 60} min)`
                  : 'Disabled',
                inline: true
              },
              {
                name: 'Auto-Kick',
                value: warnPunishments.kickAt
                  ? `At ${warnPunishments.kickAt} warnings`
                  : 'Disabled',
                inline: true
              },
              {
                name: 'Auto-Ban',
                value: warnPunishments.banAt
                  ? `At ${warnPunishments.banAt} warnings`
                  : 'Disabled',
                inline: true
              }
            )
            .setDescription('Configure with `/config autopunish <action> <warnings>`');
          return interaction.reply({ embeds: [embed] });
        }

        if (action === 'reset') {
          client.db.setSetting(guildId, 'warnPunishments', {});
          return interaction.reply({
            embeds: [successEmbed('All auto-punishment settings have been reset.')]
          });
        }

        if (warnings === null || warnings === undefined) {
          return interaction.reply({
            embeds: [errorEmbed('Please specify the number of warnings to trigger this action.')],
            ephemeral: true
          });
        }

        if (action === 'mute') {
          warnPunishments.muteAt = warnings === 0 ? null : warnings;
          if (muteDuration) {
            warnPunishments.muteDuration = muteDuration;
          }
          client.db.setSetting(guildId, 'warnPunishments', warnPunishments);

          if (warnings === 0) {
            return interaction.reply({
              embeds: [successEmbed('Auto-mute has been disabled.')]
            });
          }
          const durationText = muteDuration || warnPunishments.muteDuration || 60;
          return interaction.reply({
            embeds: [successEmbed(`Users will be automatically muted for ${durationText} minutes at ${warnings} warnings.`)]
          });
        }

        if (action === 'kick') {
          warnPunishments.kickAt = warnings === 0 ? null : warnings;
          client.db.setSetting(guildId, 'warnPunishments', warnPunishments);

          if (warnings === 0) {
            return interaction.reply({
              embeds: [successEmbed('Auto-kick has been disabled.')]
            });
          }
          return interaction.reply({
            embeds: [successEmbed(`Users will be automatically kicked at ${warnings} warnings.`)]
          });
        }

        if (action === 'ban') {
          warnPunishments.banAt = warnings === 0 ? null : warnings;
          client.db.setSetting(guildId, 'warnPunishments', warnPunishments);

          if (warnings === 0) {
            return interaction.reply({
              embeds: [successEmbed('Auto-ban has been disabled.')]
            });
          }
          return interaction.reply({
            embeds: [successEmbed(`Users will be automatically banned at ${warnings} warnings.`)]
          });
        }
        break;
      }

      case 'autorole': {
        const role = interaction.options.getRole('role');
        if (role) {
          // Check if bot can assign this role
          if (role.position >= interaction.guild.members.me.roles.highest.position) {
            return interaction.reply({
              embeds: [errorEmbed('I cannot assign this role as it is equal to or higher than my highest role.')],
              ephemeral: true
            });
          }
          if (role.managed) {
            return interaction.reply({
              embeds: [errorEmbed('This role is managed by an integration and cannot be automatically assigned.')],
              ephemeral: true
            });
          }

          client.db.setSetting(guildId, 'autoRole', role.id);
          return interaction.reply({
            embeds: [successEmbed(`New members will automatically receive the ${role} role.`)]
          });
        } else {
          client.db.setSetting(guildId, 'autoRole', null);
          return interaction.reply({
            embeds: [successEmbed('Auto-role has been disabled.')]
          });
        }
      }
    }
  }
};

async function showConfig(interaction, client) {
  const guild = interaction.guild;
  const settings = client.db.getGuild(guild.id).settings;
  const prefix = client.getPrefix(guild.id);

  const enabledModules = settings.enabledModules || {};
  const moduleStatus = (mod) => enabledModules[mod] !== false ? Emojis.SUCCESS : Emojis.ERROR;

  const embed = new EmbedBuilder()
    .setColor(BOT_COLOR)
    .setTitle(`${guild.name} Configuration`)
    .setThumbnail(guild.iconURL({ dynamic: true }))
    .addFields(
      { name: 'Prefix', value: `\`${prefix}\``, inline: true },
      {
        name: 'Log Channel',
        value: settings.logChannel ? `<#${settings.logChannel}>` : 'Not set',
        inline: true
      },
      {
        name: 'Welcome Channel',
        value: settings.welcomeChannel ? `<#${settings.welcomeChannel}>` : 'Not set',
        inline: true
      },
      {
        name: 'Mute Role',
        value: settings.muteRole ? `<@&${settings.muteRole}>` : 'Not set',
        inline: true
      },
      {
        name: 'Mod Roles',
        value: settings.modRoles?.length > 0
          ? settings.modRoles.map(r => `<@&${r}>`).join(', ')
          : 'Not set',
        inline: true
      },
      {
        name: 'Admin Roles',
        value: settings.adminRoles?.length > 0
          ? settings.adminRoles.map(r => `<@&${r}>`).join(', ')
          : 'Not set',
        inline: true
      },
      {
        name: 'Fun Channel',
        value: settings.funChannel ? `<#${settings.funChannel}>` : 'All channels',
        inline: true
      },
      {
        name: 'Member Role',
        value: settings.memberRole ? `<@&${settings.memberRole}>` : 'None (everyone)',
        inline: true
      },
      {
        name: 'Auto-Role',
        value: settings.autoRole ? `<@&${settings.autoRole}>` : 'Disabled',
        inline: true
      },
      {
        name: 'Modules',
        value: [
          `${moduleStatus('leveling')} Leveling`,
          `${moduleStatus('economy')} Economy`,
          `${moduleStatus('welcome')} Welcome`,
          `${moduleStatus('automod')} AutoMod`,
          `${moduleStatus('logging')} Logging`,
          `${moduleStatus('tickets')} Tickets`
        ].join('\n'),
        inline: true
      },
      {
        name: 'Auto-Punishments',
        value: formatAutoPunishments(settings.warnPunishments),
        inline: true
      }
    )
    .setTimestamp();

  return interaction.reply({ embeds: [embed] });
}

async function showConfigMenu(message, client) {
  const embed = new EmbedBuilder()
    .setColor(BOT_COLOR)
    .setTitle('Server Configuration')
    .setDescription('Use slash commands to configure the bot:\n' +
      '`/config view` - View current settings\n' +
      '`/config role <type> <role>` - Configure roles (admin/mod/mute/member)\n' +
      '`/config logchannel <channel>` - Set log channel\n' +
      '`/config welcomechannel <channel>` - Set welcome channel\n' +
      '`/config funchannel [channel]` - Set fun commands channel\n' +
      '`/config autorole [role]` - Set auto-role for new members\n' +
      '`/config autopunish <action> <warnings>` - Set auto-punishment thresholds\n' +
      '`/config toggle <module>` - Toggle modules');

  await message.reply({ embeds: [embed] });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatAutoPunishments(warnPunishments) {
  if (!warnPunishments) return 'Not configured';

  const parts = [];
  if (warnPunishments.muteAt) {
    parts.push(`Mute: ${warnPunishments.muteAt} warns`);
  }
  if (warnPunishments.kickAt) {
    parts.push(`Kick: ${warnPunishments.kickAt} warns`);
  }
  if (warnPunishments.banAt) {
    parts.push(`Ban: ${warnPunishments.banAt} warns`);
  }

  return parts.length > 0 ? parts.join('\n') : 'Not configured';
}
