// Use command - Use items from inventory (DankMemer style)
// Created by ImVylo

import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { Colors, Emojis } from '../../utils/constants.js';
import { errorEmbed, successEmbed } from '../../utils/embeds.js';

// Random chaos effects
const CHAOS_EFFECTS = [
  { type: 'good', message: 'The chaos blessed you!', minCoins: 500, maxCoins: 2000 },
  { type: 'bad', message: 'The chaos cursed you!', minCoins: -1000, maxCoins: -100 },
  { type: 'swap', message: 'The chaos swapped your wallets!' },
  { type: 'double', message: 'JACKPOT! Your wallet doubled!' },
  { type: 'half', message: 'Oh no! Your wallet was halved!' },
  { type: 'nothing', message: 'The chaos... did nothing. How chaotic.' },
  { type: 'steal', message: 'The chaos stole from your target!', percent: 0.2 },
  { type: 'gift', message: 'The chaos gifted coins to your target!', minCoins: 100, maxCoins: 500 }
];

export default {
  name: 'use',
  description: 'Use an item from your inventory',
  aliases: [],
  cooldown: 5,
  guildOnly: true,

  data: new SlashCommandBuilder()
    .setName('use')
    .setDescription('Use an item from your inventory')
    .addStringOption(opt =>
      opt.setName('item').setDescription('Item to use').setRequired(true).setAutocomplete(true)
    )
    .addUserOption(opt =>
      opt.setName('target').setDescription('User to use it on (if applicable)')
    ),

  async autocomplete(interaction, client) {
    const focused = interaction.options.getFocused().toLowerCase();
    const inventory = client.db.getInventory(interaction.user.id, interaction.guild.id);

    const choices = inventory
      .filter(item => item.name.toLowerCase().includes(focused))
      .slice(0, 25)
      .map(item => {
        const data = JSON.parse(item.value || '{}');
        return { name: `${data.emoji || '📦'} ${item.name} (x${item.quantity})`, value: item.name };
      });

    await interaction.respond(choices);
  },

  async execute(interaction, client) {
    const isSlash = interaction.isChatInputCommand?.();
    const guild = interaction.guild;
    const user = isSlash ? interaction.user : interaction.author;
    const userId = user.id;

    const economyModule = client.getModule('economy');
    const symbol = economyModule?.getCurrencySymbol(guild.id) || '💰';

    let itemName, target;
    if (isSlash) {
      itemName = interaction.options.getString('item');
      target = interaction.options.getUser('target');
    } else {
      const args = interaction.content.split(' ').slice(1);
      const targetMention = args.find(a => a.startsWith('<@'));
      itemName = args.filter(a => !a.startsWith('<@')).join(' ');
      if (targetMention) {
        const targetId = targetMention.replace(/[<@!>]/g, '');
        target = await client.users.fetch(targetId).catch(() => null);
      }
    }

    // Get inventory
    const inventory = client.db.getInventory(userId, guild.id);
    const invItem = inventory.find(i =>
      i.name.toLowerCase() === itemName.toLowerCase()
    );

    if (!invItem || invItem.quantity < 1) {
      return isSlash
        ? interaction.reply({ embeds: [errorEmbed(`You don't have any **${itemName}** in your inventory!`)], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [errorEmbed(`You don't have any **${itemName}** in your inventory!`)] });
    }

    // Parse item data
    const itemData = JSON.parse(invItem.value || '{}');
    const emoji = itemData.emoji || '📦';

    // Check if target is needed
    if ((itemData.type === 'use' || itemData.effect === 'coinSteal' || itemData.effect === 'taxCollect' ||
         itemData.effect === 'itemSteal' || itemData.effect === 'redistribute' || itemData.effect === 'chaos') && !target) {
      return isSlash
        ? interaction.reply({ embeds: [errorEmbed('This item needs a target! Use `/use <item> @user`')], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [errorEmbed('This item needs a target!')] });
    }

    if (target && target.bot) {
      return isSlash
        ? interaction.reply({ embeds: [errorEmbed('You can\'t use items on bots!')], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [errorEmbed('You can\'t use items on bots!')] });
    }

    if (target && target.id === userId) {
      return isSlash
        ? interaction.reply({ embeds: [errorEmbed('You can\'t use this item on yourself!')], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [errorEmbed('You can\'t use this item on yourself!')] });
    }

    // Remove item from inventory
    const removeItem = () => {
      client.db.db.prepare(`
        UPDATE inventory SET quantity = quantity - 1
        WHERE user_id = ? AND guild_id = ? AND item_id = ? AND quantity > 0
      `).run(userId, guild.id, invItem.item_id);

      client.db.db.prepare(`
        DELETE FROM inventory WHERE user_id = ? AND guild_id = ? AND item_id = ? AND quantity <= 0
      `).run(userId, guild.id, invItem.item_id);
    };

    // Handle different item effects
    let embed;

    switch (itemData.effect) {
      case 'coinSteal': {
        const targetBalance = client.db.getBalance(target.id, guild.id).balance;
        const stealAmount = Math.min(
          Math.floor(Math.random() * (itemData.max - itemData.min + 1)) + itemData.min,
          targetBalance
        );

        if (targetBalance < 50) {
          return isSlash
            ? interaction.reply({ embeds: [errorEmbed(`${target} is too poor to steal from! They only have ${symbol} ${targetBalance}`)], flags: MessageFlags.Ephemeral })
            : interaction.reply({ embeds: [errorEmbed(`${target} is too poor to steal from!`)] });
        }

        removeItem();
        client.db.removeBalance(target.id, guild.id, stealAmount);
        client.db.addBalance(userId, guild.id, stealAmount);

        embed = new EmbedBuilder()
          .setColor(Colors.SUCCESS)
          .setTitle(`${emoji} Coin Yoink!`)
          .setDescription(`**${user.username}** yoinked ${symbol} **${stealAmount.toLocaleString()}** from ${target}!\n\n*Yoink yoink!*`);
        break;
      }

      case 'taxCollect': {
        const targetBalance = client.db.getBalance(target.id, guild.id).balance;
        const taxAmount = Math.min(
          Math.floor(targetBalance * itemData.percent),
          itemData.max
        );

        if (taxAmount < 10) {
          return isSlash
            ? interaction.reply({ embeds: [errorEmbed(`${target} doesn't have enough to tax!`)], flags: MessageFlags.Ephemeral })
            : interaction.reply({ embeds: [errorEmbed(`${target} doesn't have enough to tax!`)] });
        }

        removeItem();
        client.db.removeBalance(target.id, guild.id, taxAmount);
        client.db.addBalance(userId, guild.id, taxAmount);

        embed = new EmbedBuilder()
          .setColor(Colors.SUCCESS)
          .setTitle(`${emoji} Tax Collected!`)
          .setDescription(`**${user.username}** collected ${symbol} **${taxAmount.toLocaleString()}** in taxes from ${target}!\n\n*The IRS sends their regards.*`);
        break;
      }

      case 'itemSteal': {
        const targetInv = client.db.getInventory(target.id, guild.id);

        if (targetInv.length === 0) {
          return isSlash
            ? interaction.reply({ embeds: [errorEmbed(`${target} has no items to steal!`)], flags: MessageFlags.Ephemeral })
            : interaction.reply({ embeds: [errorEmbed(`${target} has no items to steal!`)] });
        }

        const randomItem = targetInv[Math.floor(Math.random() * targetInv.length)];
        const stolenData = JSON.parse(randomItem.value || '{}');

        removeItem();

        // Remove from target
        client.db.db.prepare(`
          UPDATE inventory SET quantity = quantity - 1
          WHERE user_id = ? AND guild_id = ? AND item_id = ?
        `).run(target.id, guild.id, randomItem.item_id);

        // Add to user
        client.db.addToInventory(userId, guild.id, randomItem.item_id, 1);

        embed = new EmbedBuilder()
          .setColor(Colors.SUCCESS)
          .setTitle(`${emoji} Item Yoinked!`)
          .setDescription(`**${user.username}** stole a **${stolenData.emoji || '📦'} ${randomItem.name}** from ${target}!\n\n*Five finger discount!*`);
        break;
      }

      case 'redistribute': {
        const userBalance = client.db.getBalance(userId, guild.id).balance;
        const targetBalance = client.db.getBalance(target.id, guild.id).balance;
        const average = Math.floor((userBalance + targetBalance) / 2);

        removeItem();
        client.db.updateUser(userId, guild.id, { balance: average });
        client.db.updateUser(target.id, guild.id, { balance: average });

        const userDiff = average - userBalance;
        const result = userDiff >= 0 ? `gained ${symbol} ${userDiff.toLocaleString()}` : `lost ${symbol} ${Math.abs(userDiff).toLocaleString()}`;

        embed = new EmbedBuilder()
          .setColor(userDiff >= 0 ? Colors.SUCCESS : Colors.ERROR)
          .setTitle(`${emoji} Wealth Redistributed!`)
          .setDescription(`**${user.username}** used the Communism Card on ${target}!\n\nBoth wallets are now ${symbol} **${average.toLocaleString()}**\n\nYou ${result}!\n\n*☭ Our money ☭*`);
        break;
      }

      case 'gamble5050': {
        const userBalance = client.db.getBalance(userId, guild.id).balance;
        const won = Math.random() < 0.5;

        removeItem();

        if (won) {
          client.db.addBalance(userId, guild.id, userBalance);
          embed = new EmbedBuilder()
            .setColor(Colors.SUCCESS)
            .setTitle(`${emoji} JACKPOT!`)
            .setDescription(`The button glows green!\n\nYour wallet **DOUBLED**!\n\n${symbol} ${userBalance.toLocaleString()} → ${symbol} **${(userBalance * 2).toLocaleString()}**`);
        } else {
          const loss = Math.floor(userBalance / 2);
          client.db.removeBalance(userId, guild.id, loss);
          embed = new EmbedBuilder()
            .setColor(Colors.ERROR)
            .setTitle(`${emoji} RIP`)
            .setDescription(`The button glows red...\n\nYour wallet was **HALVED**!\n\n${symbol} ${userBalance.toLocaleString()} → ${symbol} **${(userBalance - loss).toLocaleString()}**\n\n*Press F to pay respects*`);
        }
        break;
      }

      case 'moneyPrint': {
        const broke = Math.random() < 0.3; // 30% chance to break
        removeItem();

        if (broke) {
          embed = new EmbedBuilder()
            .setColor(Colors.ERROR)
            .setTitle(`${emoji} PRINTER JAM!`)
            .setDescription(`The money printer made a horrible noise and broke!\n\nYou got nothing!\n\n*Have you tried turning it off and on again?*`);
        } else {
          const printed = Math.floor(Math.random() * 2001);
          client.db.addBalance(userId, guild.id, printed);
          embed = new EmbedBuilder()
            .setColor(Colors.SUCCESS)
            .setTitle(`${emoji} Money Printer Go BRRR!`)
            .setDescription(`The money printer whirs to life...\n\nYou printed ${symbol} **${printed.toLocaleString()}**!\n\n*Totally legal and not counterfeit*`);
        }
        break;
      }

      case 'chaos': {
        const chaosEffect = CHAOS_EFFECTS[Math.floor(Math.random() * CHAOS_EFFECTS.length)];
        removeItem();

        const userBalance = client.db.getBalance(userId, guild.id).balance;
        const targetBalance = client.db.getBalance(target.id, guild.id).balance;

        let resultText = chaosEffect.message;

        switch (chaosEffect.type) {
          case 'good': {
            const coins = Math.floor(Math.random() * (chaosEffect.maxCoins - chaosEffect.minCoins + 1)) + chaosEffect.minCoins;
            client.db.addBalance(userId, guild.id, coins);
            resultText += `\n\nYou gained ${symbol} **${coins.toLocaleString()}**!`;
            break;
          }
          case 'bad': {
            const coins = Math.floor(Math.random() * (Math.abs(chaosEffect.maxCoins) - Math.abs(chaosEffect.minCoins) + 1)) + Math.abs(chaosEffect.minCoins);
            client.db.removeBalance(userId, guild.id, Math.min(coins, userBalance));
            resultText += `\n\nYou lost ${symbol} **${Math.min(coins, userBalance).toLocaleString()}**!`;
            break;
          }
          case 'swap': {
            client.db.updateUser(userId, guild.id, { balance: targetBalance });
            client.db.updateUser(target.id, guild.id, { balance: userBalance });
            resultText += `\n\nYour wallets have been swapped!\nYou: ${symbol} ${userBalance.toLocaleString()} → ${symbol} ${targetBalance.toLocaleString()}`;
            break;
          }
          case 'double': {
            client.db.addBalance(userId, guild.id, userBalance);
            resultText += `\n\nYour wallet doubled to ${symbol} **${(userBalance * 2).toLocaleString()}**!`;
            break;
          }
          case 'half': {
            const loss = Math.floor(userBalance / 2);
            client.db.removeBalance(userId, guild.id, loss);
            resultText += `\n\nYour wallet was halved to ${symbol} **${(userBalance - loss).toLocaleString()}**!`;
            break;
          }
          case 'steal': {
            const stolen = Math.floor(targetBalance * chaosEffect.percent);
            client.db.removeBalance(target.id, guild.id, stolen);
            client.db.addBalance(userId, guild.id, stolen);
            resultText += `\n\nStole ${symbol} **${stolen.toLocaleString()}** from ${target}!`;
            break;
          }
          case 'gift': {
            const gift = Math.floor(Math.random() * (chaosEffect.maxCoins - chaosEffect.minCoins + 1)) + chaosEffect.minCoins;
            client.db.removeBalance(userId, guild.id, Math.min(gift, userBalance));
            client.db.addBalance(target.id, guild.id, Math.min(gift, userBalance));
            resultText += `\n\nGave ${symbol} **${Math.min(gift, userBalance).toLocaleString()}** to ${target}!`;
            break;
          }
          case 'nothing':
          default:
            break;
        }

        embed = new EmbedBuilder()
          .setColor(Colors.PRIMARY)
          .setTitle(`${emoji} CHAOS BOMB!`)
          .setDescription(`**${user.username}** threw a chaos bomb at ${target}!\n\n${resultText}\n\n*Chaos reigns supreme!*`);
        break;
      }

      case 'cooldownReset': {
        removeItem();
        client.db.updateUser(userId, guild.id, {
          daily_claimed: null,
          work_claimed: null
        });

        embed = new EmbedBuilder()
          .setColor(Colors.SUCCESS)
          .setTitle(`${emoji} Time Rewound!`)
          .setDescription(`Your daily and work cooldowns have been reset!\n\nGo claim them again!`);
        break;
      }

      default: {
        // Regular prank items with action text
        if (itemData.action) {
          removeItem();
          const actionText = itemData.action.replace('{target}', target.toString());

          embed = new EmbedBuilder()
            .setColor(Colors.PRIMARY)
            .setTitle(`${emoji} ${invItem.name}!`)
            .setDescription(`**${user.username}** ${actionText}`)
            .setFooter({ text: `${invItem.quantity - 1} remaining` });

          // Add funny GIFs for some items
          if (invItem.name.toLowerCase().includes('glitter')) {
            embed.setImage('https://media.giphy.com/media/26tOZ42Mg6pbTUPHW/giphy.gif');
          } else if (invItem.name.toLowerCase().includes('confetti')) {
            embed.setImage('https://media.giphy.com/media/g9582DNuQppxC/giphy.gif');
          } else if (invItem.name.toLowerCase().includes('pie')) {
            embed.setImage('https://media.giphy.com/media/kHIJtQ2eVUCw8/giphy.gif');
          } else if (invItem.name.toLowerCase().includes('air horn')) {
            embed.setImage('https://media.giphy.com/media/3o7TKUZfJKUKuSWTZe/giphy.gif');
          }
        } else {
          // Passive or collectible items
          return isSlash
            ? interaction.reply({ embeds: [errorEmbed('This item cannot be used directly. It may be a passive item or collectible.')], flags: MessageFlags.Ephemeral })
            : interaction.reply({ embeds: [errorEmbed('This item cannot be used directly.')] });
        }
      }
    }

    if (isSlash) {
      await interaction.reply({ embeds: [embed] });
    } else {
      await interaction.reply({ embeds: [embed] });
    }
  }
};
