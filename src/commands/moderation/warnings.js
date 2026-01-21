// Warnings command - View/manage user warnings
// Created by ImVylo

import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { BOT_COLOR, PermissionLevels, Emojis } from '../../utils/constants.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { paginate, createPages } from '../../utils/pagination.js';

export default {
  name: 'warnings',
  description: 'View or manage warnings for a user',
  aliases: ['warns', 'infractions'],
  cooldown: 5,
  guildOnly: true,
  permissionLevel: PermissionLevels.MODERATOR,

  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('View or manage warnings for a user')
    .addSubcommand(sub =>
      sub
        .setName('list')
        .setDescription('View warnings for a user')
        .addUserOption(opt =>
          opt.setName('user').setDescription('The user to check').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('clear')
        .setDescription('Clear all warnings for a user')
        .addUserOption(opt =>
          opt.setName('user').setDescription('The user to clear warnings for').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('remove')
        .setDescription('Remove a specific warning')
        .addUserOption(opt =>
          opt.setName('user').setDescription('The user').setRequired(true)
        )
        .addIntegerOption(opt =>
          opt.setName('warning_id').setDescription('The warning ID to remove').setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction, client) {
    const isSlash = interaction.isChatInputCommand?.();
    const guild = interaction.guild;

    let subcommand, targetUser, warningId;
    if (isSlash) {
      subcommand = interaction.options.getSubcommand();
      targetUser = interaction.options.getUser('user');
      warningId = interaction.options.getInteger('warning_id');
    } else {
      const args = interaction.content.split(' ').slice(1);
      subcommand = args[0]?.toLowerCase() || 'list';

      if (subcommand === 'list' || subcommand === 'clear') {
        const userId = args[1]?.replace(/[<@!>]/g, '');
        targetUser = await client.users.fetch(userId).catch(() => null);
      } else if (subcommand === 'remove') {
        const userId = args[1]?.replace(/[<@!>]/g, '');
        targetUser = await client.users.fetch(userId).catch(() => null);
        warningId = parseInt(args[2]);
      } else {
        // Assume it's a user mention
        const userId = args[0]?.replace(/[<@!>]/g, '');
        targetUser = await client.users.fetch(userId).catch(() => null);
        subcommand = 'list';
      }
    }

    if (!targetUser) {
      const embed = errorEmbed('Please specify a valid user.');
      return isSlash
        ? interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [embed] });
    }

    switch (subcommand) {
      case 'list': {
        const warnings = client.db.getWarnings(targetUser.id, guild.id);

        if (warnings.length === 0) {
          const embed = new EmbedBuilder()
            .setColor(BOT_COLOR)
            .setTitle(`${Emojis.SUCCESS} No Warnings`)
            .setDescription(`**${targetUser.tag}** has no warnings.`)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }));

          return isSlash
            ? interaction.reply({ embeds: [embed] })
            : interaction.reply({ embeds: [embed] });
        }

        // Create paginated embed
        const pages = createPages(warnings, 5, (pageWarnings, page, total, startIndex) => {
          return new EmbedBuilder()
            .setColor(BOT_COLOR)
            .setTitle(`Warnings for ${targetUser.tag}`)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .setDescription(
              pageWarnings.map((w) => {
                const date = new Date(w.date).toLocaleDateString();
                return `**#${w.id}** - <@${w.moderator}> (${date})\n${w.reason}`;
              }).join('\n\n')
            )
            .setFooter({ text: `Total: ${warnings.length} warnings` });
        });

        return paginate(interaction, pages);
      }

      case 'clear': {
        const warnings = client.db.getWarnings(targetUser.id, guild.id);

        if (warnings.length === 0) {
          const embed = errorEmbed(`**${targetUser.tag}** has no warnings to clear.`);
          return isSlash
            ? interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
            : interaction.reply({ embeds: [embed] });
        }

        client.db.clearWarnings(targetUser.id, guild.id);

        const embed = successEmbed(`Cleared **${warnings.length}** warnings for **${targetUser.tag}**.`);
        return isSlash
          ? interaction.reply({ embeds: [embed] })
          : interaction.reply({ embeds: [embed] });
      }

      case 'remove': {
        if (!warningId || isNaN(warningId)) {
          const embed = errorEmbed('Please specify a valid warning ID.');
          return isSlash
            ? interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
            : interaction.reply({ embeds: [embed] });
        }

        const warnings = client.db.getWarnings(targetUser.id, guild.id);
        const warning = warnings.find(w => w.id === warningId);

        if (!warning) {
          const embed = errorEmbed(`Warning #${warningId} not found for **${targetUser.tag}**.`);
          return isSlash
            ? interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
            : interaction.reply({ embeds: [embed] });
        }

        client.db.removeWarning(targetUser.id, guild.id, warningId);

        const embed = successEmbed(`Removed warning #${warningId} from **${targetUser.tag}**.`);
        return isSlash
          ? interaction.reply({ embeds: [embed] })
          : interaction.reply({ embeds: [embed] });
      }

      default: {
        const embed = errorEmbed('Invalid subcommand. Use `list`, `clear`, or `remove`.');
        return isSlash
          ? interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
          : interaction.reply({ embeds: [embed] });
      }
    }
  }
};
