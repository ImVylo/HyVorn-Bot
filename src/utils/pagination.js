// Pagination utility for embeds
// Created by ImVylo

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  MessageFlags
} from 'discord.js';

/**
 * Create a paginated embed message
 * @param {Object} interaction - Discord interaction
 * @param {EmbedBuilder[]} pages - Array of embed pages
 * @param {Object} options - Pagination options
 * @returns {Promise<Message>}
 */
export async function paginate(interaction, pages, options = {}) {
  const {
    timeout = 120000,
    showPageNumber = true,
    ephemeral = false,
    authorOnly = true
  } = options;

  if (!pages || pages.length === 0) {
    throw new Error('No pages provided for pagination');
  }

  // If only one page, just send it without buttons
  if (pages.length === 1) {
    return interaction.reply({
      embeds: [pages[0]],
      ephemeral
    });
  }

  let currentPage = 0;

  // Add page numbers to footers if enabled
  if (showPageNumber) {
    pages.forEach((page, index) => {
      const existingFooter = page.data.footer?.text || '';
      const separator = existingFooter ? ' | ' : '';
      page.setFooter({
        text: `${existingFooter}${separator}Page ${index + 1}/${pages.length}`,
        iconURL: page.data.footer?.icon_url
      });
    });
  }

  // Create navigation buttons
  const getButtons = (page) => {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('pagination_first')
        .setEmoji('⏮️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === 0),
      new ButtonBuilder()
        .setCustomId('pagination_prev')
        .setEmoji('◀️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === 0),
      new ButtonBuilder()
        .setCustomId('pagination_stop')
        .setEmoji('⏹️')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('pagination_next')
        .setEmoji('▶️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === pages.length - 1),
      new ButtonBuilder()
        .setCustomId('pagination_last')
        .setEmoji('⏭️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === pages.length - 1)
    );
  };

  // Send initial message
  const message = await interaction.reply({
    embeds: [pages[currentPage]],
    components: [getButtons(currentPage)],
    ephemeral,
    fetchReply: true
  });

  // Create button collector
  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter: (i) => {
      if (authorOnly && i.user.id !== interaction.user.id) {
        i.reply({
          content: 'These buttons are not for you!',
          flags: MessageFlags.Ephemeral
        });
        return false;
      }
      return i.customId.startsWith('pagination_');
    },
    time: timeout
  });

  collector.on('collect', async (i) => {
    switch (i.customId) {
      case 'pagination_first':
        currentPage = 0;
        break;
      case 'pagination_prev':
        currentPage = Math.max(0, currentPage - 1);
        break;
      case 'pagination_stop':
        collector.stop('stopped');
        return;
      case 'pagination_next':
        currentPage = Math.min(pages.length - 1, currentPage + 1);
        break;
      case 'pagination_last':
        currentPage = pages.length - 1;
        break;
    }

    await i.update({
      embeds: [pages[currentPage]],
      components: [getButtons(currentPage)]
    });
  });

  collector.on('end', async (_, reason) => {
    // Disable all buttons when collector ends
    const disabledRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('pagination_first')
        .setEmoji('⏮️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('pagination_prev')
        .setEmoji('◀️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('pagination_stop')
        .setEmoji('⏹️')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('pagination_next')
        .setEmoji('▶️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('pagination_last')
        .setEmoji('⏭️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );

    try {
      if (reason === 'stopped' && !ephemeral) {
        await message.edit({ components: [] });
      } else {
        await message.edit({ components: [disabledRow] });
      }
    } catch (error) {
      // Message may have been deleted
    }
  });

  return message;
}

/**
 * Create paginated embeds from an array of items
 * @param {Array} items - Array of items to paginate
 * @param {number} itemsPerPage - Items per page
 * @param {Function} embedBuilder - Function that takes (items, page, totalPages) and returns an embed
 * @returns {EmbedBuilder[]} Array of embeds
 */
export function createPages(items, itemsPerPage, embedBuilder) {
  const pages = [];
  const totalPages = Math.ceil(items.length / itemsPerPage);

  for (let i = 0; i < totalPages; i++) {
    const start = i * itemsPerPage;
    const pageItems = items.slice(start, start + itemsPerPage);
    pages.push(embedBuilder(pageItems, i + 1, totalPages, start));
  }

  return pages;
}

/**
 * Create a simple select menu for navigation
 * @param {Object} interaction - Discord interaction
 * @param {Object} menuOptions - Options for the menu
 * @returns {Promise<string|null>} Selected value or null if timed out
 */
export async function selectMenu(interaction, menuOptions) {
  const {
    placeholder = 'Select an option',
    options,
    timeout = 60000,
    ephemeral = false
  } = menuOptions;

  const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = await import('discord.js');

  const select = new StringSelectMenuBuilder()
    .setCustomId('select_menu')
    .setPlaceholder(placeholder)
    .addOptions(
      options.map(opt =>
        new StringSelectMenuOptionBuilder()
          .setLabel(opt.label)
          .setValue(opt.value)
          .setDescription(opt.description || null)
          .setEmoji(opt.emoji || null)
      )
    );

  const row = new ActionRowBuilder().addComponents(select);

  const message = await interaction.reply({
    components: [row],
    ephemeral,
    fetchReply: true
  });

  try {
    const i = await message.awaitMessageComponent({
      filter: (i) => i.user.id === interaction.user.id,
      time: timeout
    });

    await i.deferUpdate();
    return i.values[0];
  } catch (error) {
    return null;
  }
}

/**
 * Confirm action with buttons
 * @param {Object} interaction - Discord interaction
 * @param {string} message - Confirmation message
 * @param {Object} options - Options
 * @returns {Promise<boolean|null>} true if confirmed, false if denied, null if timed out
 */
export async function confirm(interaction, message, options = {}) {
  const {
    timeout = 30000,
    ephemeral = true,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel'
  } = options;

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('confirm_yes')
      .setLabel(confirmLabel)
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('confirm_no')
      .setLabel(cancelLabel)
      .setStyle(ButtonStyle.Danger)
  );

  const reply = await interaction.reply({
    content: message,
    components: [row],
    ephemeral,
    fetchReply: true
  });

  try {
    const i = await reply.awaitMessageComponent({
      filter: (i) => i.user.id === interaction.user.id,
      time: timeout
    });

    await i.deferUpdate();

    // Disable buttons
    const disabledRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('confirm_yes')
        .setLabel(confirmLabel)
        .setStyle(ButtonStyle.Success)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('confirm_no')
        .setLabel(cancelLabel)
        .setStyle(ButtonStyle.Danger)
        .setDisabled(true)
    );

    await reply.edit({ components: [disabledRow] });

    return i.customId === 'confirm_yes';
  } catch (error) {
    // Timed out
    try {
      await reply.edit({ components: [] });
    } catch {}
    return null;
  }
}

export default {
  paginate,
  createPages,
  selectMenu,
  confirm
};
