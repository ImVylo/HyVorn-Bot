// Tag command - Custom tags/snippets
// Created by ImVylo

import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { Colors, PermissionLevels } from '../../utils/constants.js';
import { errorEmbed, successEmbed } from '../../utils/embeds.js';

export default {
  name: 'tag',
  description: 'Create and use custom tags',
  aliases: ['t', 'tags'],
  cooldown: 3,
  guildOnly: true,

  data: new SlashCommandBuilder()
    .setName('tag')
    .setDescription('Create and use custom tags')
    .addSubcommand(sub =>
      sub.setName('get')
        .setDescription('Get a tag')
        .addStringOption(opt =>
          opt.setName('name').setDescription('Tag name').setRequired(true).setAutocomplete(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('create')
        .setDescription('Create a new tag')
        .addStringOption(opt =>
          opt.setName('name').setDescription('Tag name').setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('content').setDescription('Tag content').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('delete')
        .setDescription('Delete a tag')
        .addStringOption(opt =>
          opt.setName('name').setDescription('Tag name').setRequired(true).setAutocomplete(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('List all tags')
    )
    .addSubcommand(sub =>
      sub.setName('info')
        .setDescription('Get info about a tag')
        .addStringOption(opt =>
          opt.setName('name').setDescription('Tag name').setRequired(true).setAutocomplete(true)
        )
    ),

  async autocomplete(interaction, client) {
    const focused = interaction.options.getFocused().toLowerCase();
    const tags = client.db.getTags(interaction.guild.id);

    const choices = tags
      .filter(tag => tag.name.toLowerCase().includes(focused))
      .slice(0, 25)
      .map(tag => ({ name: tag.name, value: tag.name }));

    await interaction.respond(choices);
  },

  async execute(interaction, client) {
    const isSlash = interaction.isChatInputCommand?.();
    const guild = interaction.guild;
    const user = isSlash ? interaction.user : interaction.author;

    if (isSlash) {
      const subcommand = interaction.options.getSubcommand();

      switch (subcommand) {
        case 'get': {
          const name = interaction.options.getString('name');
          const tag = client.db.getTag(guild.id, name);

          if (!tag) {
            return interaction.reply({
              embeds: [errorEmbed(`Tag \`${name}\` not found.`)],
              flags: MessageFlags.Ephemeral
            });
          }

          client.db.incrementTagUse(guild.id, name);
          return interaction.reply({ content: tag.content });
        }

        case 'create': {
          const name = interaction.options.getString('name').toLowerCase();
          const content = interaction.options.getString('content');

          if (name.length > 32) {
            return interaction.reply({
              embeds: [errorEmbed('Tag name must be 32 characters or less.')],
              flags: MessageFlags.Ephemeral
            });
          }

          if (content.length > 2000) {
            return interaction.reply({
              embeds: [errorEmbed('Tag content must be 2000 characters or less.')],
              flags: MessageFlags.Ephemeral
            });
          }

          const existingTag = client.db.getTag(guild.id, name);
          if (existingTag) {
            return interaction.reply({
              embeds: [errorEmbed(`Tag \`${name}\` already exists.`)],
              flags: MessageFlags.Ephemeral
            });
          }

          client.db.createTag(guild.id, name, content, user.id);
          return interaction.reply({
            embeds: [successEmbed(`Tag \`${name}\` created successfully!`)]
          });
        }

        case 'delete': {
          const name = interaction.options.getString('name');
          const tag = client.db.getTag(guild.id, name);

          if (!tag) {
            return interaction.reply({
              embeds: [errorEmbed(`Tag \`${name}\` not found.`)],
              flags: MessageFlags.Ephemeral
            });
          }

          // Only author or admins can delete
          const member = await guild.members.fetch(user.id);
          if (tag.author_id !== user.id && !member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return interaction.reply({
              embeds: [errorEmbed('You can only delete your own tags.')],
              flags: MessageFlags.Ephemeral
            });
          }

          client.db.deleteTag(guild.id, name);
          return interaction.reply({
            embeds: [successEmbed(`Tag \`${name}\` deleted.`)]
          });
        }

        case 'list': {
          const tags = client.db.getTags(guild.id);

          if (tags.length === 0) {
            return interaction.reply({
              embeds: [errorEmbed('No tags found in this server.')],
              flags: MessageFlags.Ephemeral
            });
          }

          const tagList = tags.map(t => `\`${t.name}\``).join(', ');

          const embed = new EmbedBuilder()
            .setColor(Colors.PRIMARY)
            .setTitle('📑 Server Tags')
            .setDescription(tagList)
            .setFooter({ text: `${tags.length} tag(s) total` })
            .setTimestamp();

          return interaction.reply({ embeds: [embed] });
        }

        case 'info': {
          const name = interaction.options.getString('name');
          const tag = client.db.getTag(guild.id, name);

          if (!tag) {
            return interaction.reply({
              embeds: [errorEmbed(`Tag \`${name}\` not found.`)],
              flags: MessageFlags.Ephemeral
            });
          }

          const embed = new EmbedBuilder()
            .setColor(Colors.PRIMARY)
            .setTitle(`Tag: ${tag.name}`)
            .addFields(
              { name: 'Author', value: `<@${tag.author_id}>`, inline: true },
              { name: 'Uses', value: `${tag.uses}`, inline: true },
              { name: 'Content Preview', value: tag.content.slice(0, 100) + (tag.content.length > 100 ? '...' : ''), inline: false }
            )
            .setTimestamp();

          return interaction.reply({ embeds: [embed] });
        }
      }
    } else {
      // Prefix command handling
      const args = interaction.content.split(' ').slice(1);
      const action = args[0]?.toLowerCase();

      if (!action) {
        // List tags
        const tags = client.db.getTags(guild.id);
        if (tags.length === 0) {
          return interaction.reply({ embeds: [errorEmbed('No tags found.')] });
        }
        const tagList = tags.map(t => `\`${t.name}\``).join(', ');
        const embed = new EmbedBuilder()
          .setColor(Colors.PRIMARY)
          .setTitle('📑 Server Tags')
          .setDescription(tagList)
          .setTimestamp();
        return interaction.reply({ embeds: [embed] });
      }

      if (action === 'create' || action === 'add') {
        const name = args[1]?.toLowerCase();
        const content = args.slice(2).join(' ');

        if (!name || !content) {
          return interaction.reply({ embeds: [errorEmbed('Usage: `!tag create <name> <content>`')] });
        }

        const existingTag = client.db.getTag(guild.id, name);
        if (existingTag) {
          return interaction.reply({ embeds: [errorEmbed(`Tag \`${name}\` already exists.`)] });
        }

        client.db.createTag(guild.id, name, content, user.id);
        return interaction.reply({ embeds: [successEmbed(`Tag \`${name}\` created!`)] });
      }

      if (action === 'delete' || action === 'remove') {
        const name = args[1];
        if (!name) {
          return interaction.reply({ embeds: [errorEmbed('Please specify a tag name.')] });
        }

        const tag = client.db.getTag(guild.id, name);
        if (!tag) {
          return interaction.reply({ embeds: [errorEmbed(`Tag \`${name}\` not found.`)] });
        }

        const member = await guild.members.fetch(user.id);
        if (tag.author_id !== user.id && !member.permissions.has(PermissionFlagsBits.ManageMessages)) {
          return interaction.reply({ embeds: [errorEmbed('You can only delete your own tags.')] });
        }

        client.db.deleteTag(guild.id, name);
        return interaction.reply({ embeds: [successEmbed(`Tag \`${name}\` deleted.`)] });
      }

      // Try to get a tag
      const tag = client.db.getTag(guild.id, action);
      if (tag) {
        client.db.incrementTagUse(guild.id, action);
        return interaction.reply({ content: tag.content });
      }

      return interaction.reply({ embeds: [errorEmbed(`Tag \`${action}\` not found.`)] });
    }
  }
};
