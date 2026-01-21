// Shop command - Buy goofy gadgets and items (DankMemer style)
// Created by ImVylo

import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, MessageFlags } from 'discord.js';
import { Colors, Emojis } from '../../utils/constants.js';
import { errorEmbed, successEmbed } from '../../utils/embeds.js';
import { paginate, createPages } from '../../utils/pagination.js';

// All shop items organized by category
const SHOP_ITEMS = {
  pranks: [
    {
      name: 'Banana Phone',
      description: 'Call someone with a banana. Very professional.',
      price: 500,
      type: 'use',
      emoji: '🍌',
      action: 'called {target} using a banana phone. Ring ring ring ring ring ring ring... BANANA PHONE!'
    },
    {
      name: 'Confetti Cannon',
      description: 'Blast someone with confetti!',
      price: 300,
      type: 'use',
      emoji: '🎊',
      action: 'blasted {target} with a confetti cannon! 🎊🎉 PARTY TIME!'
    },
    {
      name: 'Whoopee Cushion',
      description: 'Classic prank. The fart noise is *chefs kiss*.',
      price: 250,
      type: 'use',
      emoji: '💨',
      action: 'placed a whoopee cushion under {target}\'s seat. *PFFFFFTTTTTTT* Everyone heard that.'
    },
    {
      name: 'Fake Spider',
      description: 'Scare someone with a terrifying fake spider!',
      price: 350,
      type: 'use',
      emoji: '🕷️',
      action: 'threw a fake spider at {target}! They screamed and fell off their chair! 🕷️😱'
    },
    {
      name: 'Air Horn',
      description: 'BWAAAAAAAA - Perfect for ruining someone\'s day.',
      price: 450,
      type: 'use',
      emoji: '📯',
      action: 'blasted an air horn right in {target}\'s ear! BWAAAAAAAA! They can\'t hear anymore.'
    },
    {
      name: 'Glitter Bomb',
      description: 'Cover someone in glitter. They\'ll find it for WEEKS.',
      price: 600,
      type: 'use',
      emoji: '✨',
      action: 'sent {target} a glitter bomb! BOOM! They\'re now 500% more fabulous and will never get it all off! ✨'
    },
    {
      name: 'Rubber Chicken',
      description: 'Smack someone with a rubber chicken. Why? Why not.',
      price: 200,
      type: 'use',
      emoji: '🐔',
      action: 'smacked {target} repeatedly with a rubber chicken! *SQUAWK SQUAWK SQUAWK*'
    },
    {
      name: 'Silly String',
      description: 'Cover someone in silly string!',
      price: 300,
      type: 'use',
      emoji: '🎀',
      action: 'sprayed {target} with 47 cans of silly string! They look like a mummy now!'
    },
    {
      name: 'Kazoo',
      description: 'Serenade someone with the world\'s most annoying instrument.',
      price: 150,
      type: 'use',
      emoji: '🎵',
      action: 'serenaded {target} with a 10-minute kazoo solo of "Never Gonna Give You Up". Beautiful. They cried.'
    },
    {
      name: 'Pie',
      description: 'Classic pie to the face. Cream filled.',
      price: 400,
      type: 'use',
      emoji: '🥧',
      action: 'threw a cream pie directly into {target}\'s face! SPLAT! Delicious AND humiliating!'
    },
    {
      name: 'Clown Nose',
      description: 'Force someone to wear a clown nose.',
      price: 250,
      type: 'use',
      emoji: '🔴',
      action: 'superglued a clown nose onto {target}\'s face! Honk honk! 🤡 They\'re stuck with it!'
    },
    {
      name: 'Vuvuzela',
      description: 'BZZZZZZZZZ - The sound of nightmares.',
      price: 500,
      type: 'use',
      emoji: '📢',
      action: 'followed {target} around with a vuvuzela for 3 hours straight! BZZZZZZZZZZZ!'
    },
    {
      name: 'Water Balloon',
      description: 'Splash someone when they least expect it!',
      price: 200,
      type: 'use',
      emoji: '🎈',
      action: 'threw a water balloon at {target}! SPLASH! They\'re completely soaked!'
    },
    {
      name: 'Stink Bomb',
      description: 'Clear a room instantly. Smells like a thousand farts.',
      price: 550,
      type: 'use',
      emoji: '💩',
      action: 'dropped a stink bomb near {target}! The smell... THE SMELL! Everyone within 50 feet is gagging!'
    },
    {
      name: 'Airhorn Shoes',
      description: 'Secretly attach airhorns to someone\'s shoes.',
      price: 700,
      type: 'use',
      emoji: '👟',
      action: 'attached airhorns to {target}\'s shoes! Every step they take: HONK HONK HONK!'
    }
  ],
  explosives: [
    {
      name: 'Firecracker',
      description: 'A small explosive surprise! Makes a loud POP.',
      price: 400,
      type: 'use',
      emoji: '🧨',
      action: 'threw a firecracker at {target}\'s feet! *POP POP POP* They jumped 10 feet in the air!'
    },
    {
      name: 'Smoke Bomb',
      description: 'Disappear in a cloud of smoke... or just annoy someone.',
      price: 600,
      type: 'use',
      emoji: '💨',
      action: 'threw a smoke bomb at {target}! *POOF* They\'re coughing and can\'t see anything!'
    },
    {
      name: 'Confetti Grenade',
      description: 'Pull the pin, throw it, PARTY EXPLOSION!',
      price: 800,
      type: 'use',
      emoji: '💥',
      action: 'threw a confetti grenade at {target}! BOOM! 🎊🎉 Confetti EVERYWHERE! It\'s in their hair, clothes, EVERYTHING!'
    },
    {
      name: 'Glitter Grenade',
      description: 'Like a glitter bomb but 10x worse.',
      price: 1000,
      type: 'use',
      emoji: '✨',
      action: 'detonated a glitter grenade near {target}! KABOOM! ✨ They will NEVER be free of the glitter. NEVER.'
    },
    {
      name: 'Fart Bomb',
      description: 'A devastating chemical weapon of mass disgust.',
      price: 750,
      type: 'use',
      emoji: '☠️',
      action: 'deployed a military-grade fart bomb near {target}! The Geneva Convention wants to have a word with you.'
    },
    {
      name: 'Party Popper Landmine',
      description: 'They step on it, instant party explosion.',
      price: 900,
      type: 'use',
      emoji: '🎉',
      action: 'placed a party popper landmine and {target} stepped on it! BANG! Streamers everywhere!'
    },
    {
      name: 'Foam Explosion',
      description: 'Covers everything in expanding foam. Everything.',
      price: 1200,
      type: 'use',
      emoji: '🫧',
      action: 'set off a foam explosion near {target}! They\'re now drowning in a sea of foam bubbles!'
    },
    {
      name: 'Spring Snake Can',
      description: 'Classic fake peanut can with spring snakes.',
      price: 350,
      type: 'use',
      emoji: '🐍',
      action: 'gave {target} a "peanut can" and BOING! Spring snakes flew everywhere! They screamed!'
    }
  ],
  robbery: [
    {
      name: 'Lockpick',
      description: 'Increases bank heist success rate by 10%.',
      price: 2000,
      type: 'passive',
      emoji: '🔓',
      effect: 'robBonus',
      value: 0.10
    },
    {
      name: 'Ski Mask',
      description: 'Look like a proper criminal. +15% rob success.',
      price: 3000,
      type: 'passive',
      emoji: '🎭',
      effect: 'robBonus',
      value: 0.15
    },
    {
      name: 'Getaway Car',
      description: 'Escape faster! Reduces rob fail penalty by 50%.',
      price: 5000,
      type: 'passive',
      emoji: '🚗',
      effect: 'robPenaltyReduction',
      value: 0.50
    },
    {
      name: 'Crowbar',
      description: 'Break into things easier. +20% rob success.',
      price: 4000,
      type: 'passive',
      emoji: '🔧',
      effect: 'robBonus',
      value: 0.20
    },
    {
      name: 'Fake ID',
      description: 'Avoid suspicion. -25% chance of getting caught.',
      price: 3500,
      type: 'passive',
      emoji: '🪪',
      effect: 'robPenaltyReduction',
      value: 0.25
    },
    {
      name: 'Hacking Device',
      description: 'Bypass security. +25% rob success on rich targets.',
      price: 7500,
      type: 'passive',
      emoji: '💻',
      effect: 'robBonus',
      value: 0.25
    },
    {
      name: 'Bribe Money',
      description: 'One-time use. Escape a failed robbery without penalty.',
      price: 2500,
      type: 'consumable',
      emoji: '💵',
      effect: 'robEscape'
    },
    {
      name: 'Inside Info',
      description: 'Know exactly how much your target has. One use.',
      price: 1500,
      type: 'consumable',
      emoji: '📋',
      effect: 'robInfo'
    }
  ],
  protection: [
    {
      name: 'Padlock',
      description: 'Protects your wallet from ONE robbery attempt.',
      price: 1000,
      type: 'consumable',
      emoji: '🔒',
      effect: 'robProtection',
      uses: 1
    },
    {
      name: 'Alarm System',
      description: 'Alerts you when someone tries to rob you. Blocks 3 attempts.',
      price: 3000,
      type: 'consumable',
      emoji: '🚨',
      effect: 'robProtection',
      uses: 3
    },
    {
      name: 'Guard Dog',
      description: 'Bites robbers! Protects 5 times and steals 10% from them.',
      price: 5000,
      type: 'consumable',
      emoji: '🐕',
      effect: 'robCounter',
      uses: 5,
      counterPercent: 0.10
    },
    {
      name: 'Bodyguard',
      description: 'Protects you from 10 rob attempts. Very intimidating.',
      price: 10000,
      type: 'consumable',
      emoji: '🕴️',
      effect: 'robProtection',
      uses: 10
    },
    {
      name: 'Decoy Wallet',
      description: 'Robbers steal this instead! Contains only 100 coins.',
      price: 500,
      type: 'consumable',
      emoji: '👛',
      effect: 'decoyWallet',
      uses: 1
    },
    {
      name: 'Insurance',
      description: 'Get 50% of stolen money back if robbed. Lasts 24 hours.',
      price: 2000,
      type: 'timed',
      emoji: '📜',
      effect: 'insurance',
      duration: 86400000
    },
    {
      name: 'Landmine',
      description: 'Anyone who robs you steps on it! Deals 500 coin damage.',
      price: 1500,
      type: 'consumable',
      emoji: '💣',
      effect: 'robTrap',
      uses: 1,
      damage: 500
    }
  ],
  powerups: [
    {
      name: 'Lucky Coin',
      description: '2x daily reward for 24 hours!',
      price: 1500,
      type: 'timed',
      emoji: '🍀',
      effect: 'dailyMultiplier',
      value: 2,
      duration: 86400000
    },
    {
      name: 'Work Boots',
      description: '2x work earnings for 1 hour!',
      price: 800,
      type: 'timed',
      emoji: '👢',
      effect: 'workMultiplier',
      value: 2,
      duration: 3600000
    },
    {
      name: 'XP Boost',
      description: '2x XP gains for 1 hour!',
      price: 1000,
      type: 'timed',
      emoji: '⚡',
      effect: 'xpMultiplier',
      value: 2,
      duration: 3600000
    },
    {
      name: 'Golden Dice',
      description: 'Better gambling odds for 30 minutes!',
      price: 2000,
      type: 'timed',
      emoji: '🎲',
      effect: 'gamblingBoost',
      value: 0.15,
      duration: 1800000
    },
    {
      name: 'Money Magnet',
      description: 'Random bonus coins for 1 hour! (10-50 per message)',
      price: 3000,
      type: 'timed',
      emoji: '🧲',
      effect: 'moneyMagnet',
      duration: 3600000
    },
    {
      name: 'Time Machine',
      description: 'Reset your daily/work cooldowns instantly!',
      price: 2500,
      type: 'consumable',
      emoji: '⏰',
      effect: 'cooldownReset'
    },
    {
      name: 'Multiplier Stack',
      description: 'Stack multipliers! Your next 5 earnings are 3x!',
      price: 5000,
      type: 'consumable',
      emoji: '📈',
      effect: 'multiplierStack',
      value: 3,
      uses: 5
    }
  ],
  chaos: [
    {
      name: 'Reverse Card',
      description: 'Uno reverse! Reflect the next prank used on you!',
      price: 1500,
      type: 'consumable',
      emoji: '🔄',
      effect: 'prankReflect',
      uses: 1
    },
    {
      name: 'Coin Yoink',
      description: 'Steal 100-500 coins from someone instantly!',
      price: 2000,
      type: 'use',
      emoji: '🫳',
      effect: 'coinSteal',
      min: 100,
      max: 500
    },
    {
      name: 'Tax Collector',
      description: 'Collect 5% of someone\'s wallet! (Max 1000)',
      price: 3000,
      type: 'use',
      emoji: '🧾',
      effect: 'taxCollect',
      percent: 0.05,
      max: 1000
    },
    {
      name: 'Item Yoink',
      description: 'Steal a random item from someone\'s inventory!',
      price: 5000,
      type: 'use',
      emoji: '🎒',
      effect: 'itemSteal'
    },
    {
      name: 'Bankrupt Button',
      description: 'Press F to pay respects... 50% chance to double OR halve your wallet!',
      price: 1000,
      type: 'self',
      emoji: '🔘',
      effect: 'gamble5050'
    },
    {
      name: 'Money Printer',
      description: 'Print money! Get 0-2000 coins! (Might break)',
      price: 2500,
      type: 'self',
      emoji: '🖨️',
      effect: 'moneyPrint'
    },
    {
      name: 'Communism Card',
      description: 'Redistribute wealth! You and target average your wallets!',
      price: 1500,
      type: 'use',
      emoji: '☭',
      effect: 'redistribute'
    },
    {
      name: 'Chaos Bomb',
      description: 'Random effect! Could be AMAZING or TERRIBLE!',
      price: 666,
      type: 'use',
      emoji: '🎰',
      effect: 'chaos'
    }
  ],
  collectibles: [
    {
      name: 'Pet Rock',
      description: 'His name is Rocky. He\'s a good boy. Does nothing.',
      price: 100,
      type: 'collectible',
      emoji: '🪨',
      rarity: 'common'
    },
    {
      name: 'Rubber Duck',
      description: 'For debugging purposes. Squeak squeak.',
      price: 250,
      type: 'collectible',
      emoji: '🦆',
      rarity: 'common'
    },
    {
      name: 'Rare Pepe',
      description: 'A rare and valuable Pepe. Very rare. Much value.',
      price: 5000,
      type: 'collectible',
      emoji: '🐸',
      rarity: 'rare'
    },
    {
      name: 'Golden Trophy',
      description: 'Proof that you have too much money.',
      price: 25000,
      type: 'collectible',
      emoji: '🏆',
      rarity: 'legendary'
    },
    {
      name: 'Diamond',
      description: 'Shiny! Worth a lot! Does nothing!',
      price: 50000,
      type: 'collectible',
      emoji: '💎',
      rarity: 'legendary'
    },
    {
      name: 'Crown',
      description: 'For true royalty (or people with too many coins).',
      price: 100000,
      type: 'collectible',
      emoji: '👑',
      rarity: 'mythic'
    },
    {
      name: 'Developer Badge',
      description: 'Only the coolest people have this. (You bought it)',
      price: 69420,
      type: 'collectible',
      emoji: '⚙️',
      rarity: 'mythic'
    }
  ]
};

// Flatten all items for easy lookup
const ALL_ITEMS = Object.values(SHOP_ITEMS).flat();

export default {
  name: 'shop',
  description: 'View and buy items from the shop',
  aliases: ['store'],
  cooldown: 5,
  guildOnly: true,

  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('View and buy items from the shop')
    .addSubcommand(sub =>
      sub.setName('view').setDescription('View available items')
        .addStringOption(opt =>
          opt.setName('category')
            .setDescription('Item category')
            .addChoices(
              { name: '🎭 Pranks', value: 'pranks' },
              { name: '💥 Explosives', value: 'explosives' },
              { name: '🔓 Robbery Tools', value: 'robbery' },
              { name: '🛡️ Protection', value: 'protection' },
              { name: '⚡ Powerups', value: 'powerups' },
              { name: '🎰 Chaos Items', value: 'chaos' },
              { name: '✨ Collectibles', value: 'collectibles' }
            )
        )
    )
    .addSubcommand(sub =>
      sub.setName('buy')
        .setDescription('Buy an item')
        .addStringOption(opt =>
          opt.setName('item').setDescription('Item name to buy').setRequired(true).setAutocomplete(true)
        )
        .addIntegerOption(opt =>
          opt.setName('quantity').setDescription('Quantity to buy').setMinValue(1).setMaxValue(99)
        )
    ),

  async autocomplete(interaction, client) {
    const focused = interaction.options.getFocused().toLowerCase();
    const choices = ALL_ITEMS
      .filter(item => item.name.toLowerCase().includes(focused))
      .slice(0, 25)
      .map(item => ({ name: `${item.emoji} ${item.name} - ${item.price} coins`, value: item.name }));

    await interaction.respond(choices);
  },

  async execute(interaction, client) {
    const isSlash = interaction.isChatInputCommand?.();
    const guild = interaction.guild;
    const userId = isSlash ? interaction.user.id : interaction.author.id;

    const economyModule = client.getModule('economy');
    const symbol = economyModule?.getCurrencySymbol(guild.id) || '💰';

    // Initialize shop items if needed
    initializeShopItems(client, guild.id);

    let subcommand;
    let category;
    if (isSlash) {
      subcommand = interaction.options.getSubcommand();
      category = interaction.options.getString('category');
    } else {
      const args = interaction.content.split(' ').slice(1);
      subcommand = args[0]?.toLowerCase() === 'buy' ? 'buy' : 'view';
      category = args[1]?.toLowerCase();
    }

    if (subcommand === 'view') {
      const categories = category ? { [category]: SHOP_ITEMS[category] } : SHOP_ITEMS;
      const pages = [];

      // Category overview page
      if (!category) {
        const overviewEmbed = new EmbedBuilder()
          .setColor(Colors.ECONOMY)
          .setTitle(`${Emojis.MONEY} Item Shop`)
          .setDescription('Welcome to the shop! Use `/shop view <category>` to browse items.\n\n**Categories:**')
          .addFields(
            { name: '🎭 Pranks', value: `${SHOP_ITEMS.pranks.length} items\nFunny items to use on friends`, inline: true },
            { name: '💥 Explosives', value: `${SHOP_ITEMS.explosives.length} items\nBoom boom fun times`, inline: true },
            { name: '🔓 Robbery', value: `${SHOP_ITEMS.robbery.length} items\nTools for heists`, inline: true },
            { name: '🛡️ Protection', value: `${SHOP_ITEMS.protection.length} items\nKeep your coins safe`, inline: true },
            { name: '⚡ Powerups', value: `${SHOP_ITEMS.powerups.length} items\nBoost your earnings`, inline: true },
            { name: '🎰 Chaos', value: `${SHOP_ITEMS.chaos.length} items\nRisky but fun!`, inline: true },
            { name: '✨ Collectibles', value: `${SHOP_ITEMS.collectibles.length} items\nFlex your wealth`, inline: true }
          )
          .setFooter({ text: 'Use /shop buy <item> to purchase!' });

        pages.push(overviewEmbed);
      }

      // Add category pages
      for (const [catName, items] of Object.entries(categories)) {
        if (!items) continue;

        const catEmojis = {
          pranks: '🎭',
          explosives: '💥',
          robbery: '🔓',
          protection: '🛡️',
          powerups: '⚡',
          chaos: '🎰',
          collectibles: '✨'
        };

        const catPages = createPages(items, 5, (pageItems, page, total) => {
          const embed = new EmbedBuilder()
            .setColor(Colors.ECONOMY)
            .setTitle(`${catEmojis[catName] || '📦'} ${catName.charAt(0).toUpperCase() + catName.slice(1)} Shop`);

          let description = '';
          for (const item of pageItems) {
            description += `**${item.emoji} ${item.name}** — ${symbol} ${item.price.toLocaleString()}\n`;
            description += `┗ *${item.description}*\n\n`;
          }

          embed.setDescription(description);
          embed.setFooter({ text: `Use /shop buy <item> | Page ${page}/${total}` });

          return embed;
        });

        pages.push(...catPages);
      }

      return paginate(interaction, pages, { flags: MessageFlags.Ephemeral });
    } else if (subcommand === 'buy') {
      let itemName, quantity;
      if (isSlash) {
        itemName = interaction.options.getString('item');
        quantity = interaction.options.getInteger('quantity') || 1;
      } else {
        const args = interaction.content.split(' ').slice(2);
        itemName = args.slice(0, -1).join(' ') || args[0];
        quantity = parseInt(args[args.length - 1]) || 1;
        if (isNaN(parseInt(args[args.length - 1]))) {
          itemName = args.join(' ');
          quantity = 1;
        }
      }

      // Find item
      const item = ALL_ITEMS.find(i =>
        i.name.toLowerCase() === itemName.toLowerCase()
      );

      if (!item) {
        return isSlash
          ? interaction.reply({ embeds: [errorEmbed('Item not found! Use `/shop view` to see available items.')], flags: MessageFlags.Ephemeral })
          : interaction.reply({ embeds: [errorEmbed('Item not found! Use `/shop view` to see available items.')] });
      }

      const totalCost = item.price * quantity;
      const { balance } = client.db.getBalance(userId, guild.id);

      if (balance < totalCost) {
        return isSlash
          ? interaction.reply({
              embeds: [errorEmbed(`You need ${symbol} **${totalCost.toLocaleString()}** but only have ${symbol} **${balance.toLocaleString()}**\n\nYou're ${symbol} **${(totalCost - balance).toLocaleString()}** short!`)],
              flags: MessageFlags.Ephemeral
            })
          : interaction.reply({
              embeds: [errorEmbed(`You need ${symbol} **${totalCost.toLocaleString()}** but only have ${symbol} **${balance.toLocaleString()}**`)]
            });
      }

      // Purchase
      client.db.removeBalance(userId, guild.id, totalCost);

      // Get or create item in database
      let dbItem = client.db.getShopItems(guild.id).find(i => i.name === item.name);
      if (!dbItem) {
        const itemId = client.db.addShopItem(
          guild.id,
          item.name,
          item.description,
          item.price,
          item.type,
          JSON.stringify(item)
        );
        dbItem = { id: itemId };
      }

      client.db.addToInventory(userId, guild.id, dbItem.id, quantity);

      const embed = new EmbedBuilder()
        .setColor(Colors.SUCCESS)
        .setTitle(`${Emojis.SUCCESS} Purchase Successful!`)
        .setDescription(`You bought **${quantity}x ${item.emoji} ${item.name}** for ${symbol} **${totalCost.toLocaleString()}**!`)
        .addFields({
          name: 'How to use',
          value: item.type === 'use' ? '`/use <item> @user`' :
                 item.type === 'self' ? '`/use <item>`' :
                 item.type === 'passive' ? 'Passive effect (automatic)' :
                 item.type === 'consumable' ? 'Auto-activated when needed' :
                 item.type === 'collectible' ? 'Shows in your inventory!' :
                 'Check `/inventory`'
        })
        .setFooter({ text: `New balance: ${symbol} ${(balance - totalCost).toLocaleString()}` });

      return isSlash
        ? interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [embed] });
    }
  }
};

function initializeShopItems(client, guildId) {
  const existing = client.db.getShopItems(guildId);

  if (existing.length === 0) {
    for (const item of ALL_ITEMS) {
      client.db.addShopItem(
        guildId,
        item.name,
        item.description,
        item.price,
        item.type,
        JSON.stringify(item)
      );
    }
  }
}

export { SHOP_ITEMS, ALL_ITEMS };
