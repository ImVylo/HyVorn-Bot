// Remind command - Set reminders
// Created by ImVylo

import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { Colors, Emojis } from '../../utils/constants.js';
import { errorEmbed, successEmbed } from '../../utils/embeds.js';
import { parseTime, formatDuration } from '../../utils/time.js';

export default {
  name: 'remind',
  description: 'Set a reminder',
  aliases: ['reminder', 'remindme'],
  cooldown: 5,
  guildOnly: false,

  data: new SlashCommandBuilder()
    .setName('remind')
    .setDescription('Set a reminder')
    .addSubcommand(sub =>
      sub.setName('set')
        .setDescription('Set a new reminder')
        .addStringOption(opt =>
          opt.setName('time').setDescription('When to remind (e.g., 1h, 30m, 2d)').setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('message').setDescription('What to remind you about').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('List your active reminders')
    )
    .addSubcommand(sub =>
      sub.setName('delete')
        .setDescription('Delete a reminder')
        .addIntegerOption(opt =>
          opt.setName('id').setDescription('Reminder ID to delete').setRequired(true)
        )
    ),

  async execute(interaction, client) {
    const isSlash = interaction.isChatInputCommand?.();
    const user = isSlash ? interaction.user : interaction.author;

    if (isSlash) {
      const subcommand = interaction.options.getSubcommand();

      switch (subcommand) {
        case 'set': {
          const timeStr = interaction.options.getString('time');
          const message = interaction.options.getString('message');

          const duration = parseTime(timeStr);
          if (!duration || duration < 60000) {
            return interaction.reply({
              embeds: [errorEmbed('Invalid time format! Minimum is 1 minute. Examples: 1h, 30m, 2d')],
              flags: MessageFlags.Ephemeral
            });
          }

          if (duration > 30 * 24 * 60 * 60 * 1000) {
            return interaction.reply({
              embeds: [errorEmbed('Maximum reminder duration is 30 days!')],
              flags: MessageFlags.Ephemeral
            });
          }

          const remindAt = new Date(Date.now() + duration).toISOString();
          const reminderId = client.db.createReminder(
            user.id,
            interaction.channel.id,
            interaction.guild?.id || null,
            message,
            remindAt
          );

          const embed = new EmbedBuilder()
            .setColor(Colors.SUCCESS)
            .setTitle(`${Emojis.SUCCESS} Reminder Set`)
            .setDescription(`I'll remind you about:\n**${message}**`)
            .addFields(
              { name: 'Time', value: `<t:${Math.floor((Date.now() + duration) / 1000)}:R>`, inline: true },
              { name: 'ID', value: `#${reminderId}`, inline: true }
            )
            .setFooter({ text: 'I\'ll DM you when it\'s time!' })
            .setTimestamp();

          return interaction.reply({ embeds: [embed] });
        }

        case 'list': {
          const reminders = client.db.getUserReminders(user.id);

          if (reminders.length === 0) {
            return interaction.reply({
              embeds: [errorEmbed('You have no active reminders.')],
              flags: MessageFlags.Ephemeral
            });
          }

          const reminderList = reminders.slice(0, 10).map((r, i) => {
            const time = new Date(r.remind_at);
            return `**#${r.id}** - <t:${Math.floor(time.getTime() / 1000)}:R>\n${r.message.slice(0, 50)}${r.message.length > 50 ? '...' : ''}`;
          }).join('\n\n');

          const embed = new EmbedBuilder()
            .setColor(Colors.PRIMARY)
            .setTitle('⏰ Your Reminders')
            .setDescription(reminderList)
            .setFooter({ text: `${reminders.length} reminder(s)` })
            .setTimestamp();

          return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        case 'delete': {
          const id = interaction.options.getInteger('id');
          const reminders = client.db.getUserReminders(user.id);
          const reminder = reminders.find(r => r.id === id);

          if (!reminder) {
            return interaction.reply({
              embeds: [errorEmbed('Reminder not found or doesn\'t belong to you.')],
              flags: MessageFlags.Ephemeral
            });
          }

          client.db.deleteReminder(id);
          return interaction.reply({
            embeds: [successEmbed(`Reminder #${id} has been deleted.`)],
            flags: MessageFlags.Ephemeral
          });
        }
      }
    } else {
      // Prefix command handling
      const args = interaction.content.split(' ').slice(1);

      if (args[0] === 'list') {
        const reminders = client.db.getUserReminders(user.id);
        if (reminders.length === 0) {
          return interaction.reply({ embeds: [errorEmbed('You have no active reminders.')] });
        }

        const reminderList = reminders.slice(0, 10).map(r => {
          const time = new Date(r.remind_at);
          return `**#${r.id}** - <t:${Math.floor(time.getTime() / 1000)}:R>\n${r.message.slice(0, 50)}`;
        }).join('\n\n');

        const embed = new EmbedBuilder()
          .setColor(Colors.PRIMARY)
          .setTitle('⏰ Your Reminders')
          .setDescription(reminderList)
          .setTimestamp();

        return interaction.reply({ embeds: [embed] });
      }

      if (args[0] === 'delete' && args[1]) {
        const id = parseInt(args[1]);
        const reminders = client.db.getUserReminders(user.id);
        const reminder = reminders.find(r => r.id === id);

        if (!reminder) {
          return interaction.reply({ embeds: [errorEmbed('Reminder not found.')] });
        }

        client.db.deleteReminder(id);
        return interaction.reply({ embeds: [successEmbed(`Reminder #${id} deleted.`)] });
      }

      // Set reminder: !remind 1h do something
      const timeStr = args[0];
      const message = args.slice(1).join(' ');

      if (!timeStr || !message) {
        return interaction.reply({
          embeds: [errorEmbed('Usage: `!remind <time> <message>`\nExample: `!remind 1h Take a break`')]
        });
      }

      const duration = parseTime(timeStr);
      if (!duration || duration < 60000) {
        return interaction.reply({
          embeds: [errorEmbed('Invalid time! Examples: 1h, 30m, 2d')]
        });
      }

      const remindAt = new Date(Date.now() + duration).toISOString();
      const reminderId = client.db.createReminder(
        user.id,
        interaction.channel.id,
        interaction.guild?.id || null,
        message,
        remindAt
      );

      const embed = new EmbedBuilder()
        .setColor(Colors.SUCCESS)
        .setTitle(`${Emojis.SUCCESS} Reminder Set`)
        .setDescription(`**${message}**`)
        .addFields(
          { name: 'Time', value: `<t:${Math.floor((Date.now() + duration) / 1000)}:R>`, inline: true }
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }
  }
};
