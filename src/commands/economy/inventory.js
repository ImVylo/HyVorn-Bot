// Inventory command - View your items
// Created by ImVylo

import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { Colors, Emojis } from '../../utils/constants.js';
import { paginate, createPages } from '../../utils/pagination.js';

export default {
  name: 'inventory',
  description: 'View your inventory',
  aliases: ['inv', 'items', 'bag'],
  cooldown: 5,
  guildOnly: true,

  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('View your inventory')
    .addUserOption(opt =>
      opt.setName('user').setDescription('User to view inventory of')
    ),

  async execute(interaction, client) {
    const isSlash = interaction.isChatInputCommand?.();
    const guild = interaction.guild;

    let targetUser;
    if (isSlash) {
      targetUser = interaction.options.getUser('user') || interaction.user;
    } else {
      const args = interaction.content.split(' ').slice(1);
      const userId = args[0]?.replace(/[<@!>]/g, '');
      targetUser = userId
        ? await client.users.fetch(userId).catch(() => null) || interaction.author
        : interaction.author;
    }

    const inventory = client.db.getInventory(targetUser.id, guild.id);

    if (inventory.length === 0) {
      const embed = new EmbedBuilder()
        .setColor(Colors.INFO)
        .setTitle(`${Emojis.INFO} ${targetUser.username}'s Inventory`)
        .setDescription('Your inventory is empty!\n\nUse `/shop` to buy some items.')
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }));

      return isSlash
        ? interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [embed] });
    }

    const pages = createPages(inventory, 8, (pageItems, page, total) => {
      const embed = new EmbedBuilder()
        .setColor(Colors.ECONOMY)
        .setTitle(`🎒 ${targetUser.username}'s Inventory`)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }));

      let description = '';
      for (const item of pageItems) {
        const value = JSON.parse(item.value || '{}');
        const emoji = value.emoji || '📦';
        description += `${emoji} **${item.name}** — ${item.quantity}x\n`;
        description += `┗ *${item.description}*\n\n`;
      }

      embed.setDescription(description);
      embed.setFooter({ text: `Total: ${inventory.length} unique items | Use /use <item> @user` });

      return embed;
    });

    return paginate(interaction, pages, { flags: MessageFlags.Ephemeral });
  }
};
