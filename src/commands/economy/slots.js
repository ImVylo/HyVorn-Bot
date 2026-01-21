// Slots command - Play the slot machine
// Created by ImVylo

import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { Colors } from '../../utils/constants.js';
import { errorEmbed } from '../../utils/embeds.js';

const SLOTS_SYMBOLS = [
  { emoji: '🍒', name: 'cherry', multiplier: 2 },
  { emoji: '🍋', name: 'lemon', multiplier: 2 },
  { emoji: '🍊', name: 'orange', multiplier: 3 },
  { emoji: '🍇', name: 'grape', multiplier: 3 },
  { emoji: '🔔', name: 'bell', multiplier: 4 },
  { emoji: '⭐', name: 'star', multiplier: 5 },
  { emoji: '💎', name: 'diamond', multiplier: 10 },
  { emoji: '7️⃣', name: 'seven', multiplier: 15 }
];

// Weighted selection - rarer items appear less often
const WEIGHTED_SYMBOLS = [
  ...Array(25).fill(0), // cherry - 25
  ...Array(25).fill(1), // lemon - 25
  ...Array(20).fill(2), // orange - 20
  ...Array(15).fill(3), // grape - 15
  ...Array(8).fill(4),  // bell - 8
  ...Array(5).fill(5),  // star - 5
  ...Array(1).fill(6),  // diamond - 1
  ...Array(1).fill(7)   // seven - 1
];

function getRandomSymbol() {
  const index = WEIGHTED_SYMBOLS[Math.floor(Math.random() * WEIGHTED_SYMBOLS.length)];
  return SLOTS_SYMBOLS[index];
}

function spinSlots() {
  return [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];
}

function calculateWinnings(results, bet) {
  const [a, b, c] = results;

  // Three of a kind - big win!
  if (a.name === b.name && b.name === c.name) {
    return { multiplier: a.multiplier * 3, type: 'jackpot' };
  }

  // Two of a kind
  if (a.name === b.name || b.name === c.name || a.name === c.name) {
    const matchedSymbol = a.name === b.name ? a : (b.name === c.name ? b : a);
    return { multiplier: Math.floor(matchedSymbol.multiplier / 2), type: 'match' };
  }

  // No match
  return { multiplier: 0, type: 'loss' };
}

export default {
  name: 'slots',
  description: 'Play the slot machine',
  aliases: ['slot'],
  cooldown: 5,
  guildOnly: true,

  data: new SlashCommandBuilder()
    .setName('slots')
    .setDescription('Play the slot machine')
    .addIntegerOption(opt =>
      opt.setName('bet').setDescription('Amount to bet').setRequired(true).setMinValue(10).setMaxValue(50000)
    ),

  async execute(interaction, client) {
    const isSlash = interaction.isChatInputCommand?.();
    const guild = interaction.guild;
    const user = isSlash ? interaction.user : interaction.author;

    const economyModule = client.getModule('economy');
    const symbol = economyModule?.getCurrencySymbol(guild.id) || '💰';

    let bet;
    if (isSlash) {
      bet = interaction.options.getInteger('bet');
    } else {
      const args = interaction.content.split(' ').slice(1);
      bet = parseInt(args[0]);
    }

    if (!bet || isNaN(bet) || bet < 10) {
      return isSlash
        ? interaction.reply({ embeds: [errorEmbed('Minimum bet is 10 coins!')], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [errorEmbed('Minimum bet is 10 coins!')] });
    }

    if (bet > 50000) {
      return isSlash
        ? interaction.reply({ embeds: [errorEmbed('Maximum bet is 50,000 coins!')], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [errorEmbed('Maximum bet is 50,000 coins!')] });
    }

    const userData = client.db.getBalance(user.id, guild.id);
    if (userData.balance < bet) {
      return isSlash
        ? interaction.reply({ embeds: [errorEmbed(`You don't have enough coins! You have ${symbol} **${userData.balance.toLocaleString()}**`)], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [errorEmbed(`You don't have enough coins!`)] });
    }

    // Deduct bet
    client.db.removeBalance(user.id, guild.id, bet);

    // Spin the slots
    const results = spinSlots();
    const { multiplier, type } = calculateWinnings(results, bet);
    const winnings = bet * multiplier;

    // Add winnings if any
    if (winnings > 0) {
      client.db.addBalance(user.id, guild.id, winnings);
    }

    const slotDisplay = `
╔═══════════════╗
║  ${results[0].emoji}  │  ${results[1].emoji}  │  ${results[2].emoji}  ║
╚═══════════════╝`;

    let embed;

    if (type === 'jackpot') {
      embed = new EmbedBuilder()
        .setColor(Colors.GOLD)
        .setTitle('🎰 JACKPOT! 🎉')
        .setDescription(`\`\`\`${slotDisplay}\`\`\`\n\n**THREE ${results[0].emoji}!**\n\nYou won ${symbol} **${winnings.toLocaleString()}**!`)
        .addFields(
          { name: 'Bet', value: `${symbol} ${bet.toLocaleString()}`, inline: true },
          { name: 'Multiplier', value: `${multiplier}x`, inline: true },
          { name: 'Profit', value: `${symbol} ${(winnings - bet).toLocaleString()}`, inline: true }
        )
        .setFooter({ text: '🎊 Congratulations!' })
        .setTimestamp();
    } else if (type === 'match') {
      embed = new EmbedBuilder()
        .setColor(Colors.SUCCESS)
        .setTitle('🎰 Winner!')
        .setDescription(`\`\`\`${slotDisplay}\`\`\`\n\nYou got a match!\n\nYou won ${symbol} **${winnings.toLocaleString()}**!`)
        .addFields(
          { name: 'Bet', value: `${symbol} ${bet.toLocaleString()}`, inline: true },
          { name: 'Multiplier', value: `${multiplier}x`, inline: true },
          { name: 'Profit', value: `${symbol} ${(winnings - bet).toLocaleString()}`, inline: true }
        )
        .setTimestamp();
    } else {
      embed = new EmbedBuilder()
        .setColor(Colors.ERROR)
        .setTitle('🎰 No Match')
        .setDescription(`\`\`\`${slotDisplay}\`\`\`\n\nNo luck this time...\n\nYou lost ${symbol} **${bet.toLocaleString()}**`)
        .setFooter({ text: 'Better luck next time!' })
        .setTimestamp();
    }

    if (isSlash) {
      await interaction.reply({ embeds: [embed] });
    } else {
      await interaction.reply({ embeds: [embed] });
    }
  }
};
