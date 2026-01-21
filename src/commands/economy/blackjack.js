// Blackjack command - Play blackjack
// Created by ImVylo

import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import { Colors } from '../../utils/constants.js';
import { errorEmbed } from '../../utils/embeds.js';

const SUITS = ['♠️', '♥️', '♦️', '♣️'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// Active games storage
const activeGames = new Map();

function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return shuffle(deck);
}

function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function cardValue(card) {
  if (['J', 'Q', 'K'].includes(card.rank)) return 10;
  if (card.rank === 'A') return 11;
  return parseInt(card.rank);
}

function handValue(hand) {
  let value = 0;
  let aces = 0;

  for (const card of hand) {
    value += cardValue(card);
    if (card.rank === 'A') aces++;
  }

  // Adjust for aces if over 21
  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }

  return value;
}

function formatCard(card) {
  return `${card.rank}${card.suit}`;
}

function formatHand(hand, hideSecond = false) {
  if (hideSecond && hand.length >= 2) {
    return `${formatCard(hand[0])} | ??`;
  }
  return hand.map(formatCard).join(' | ');
}

function createGameEmbed(game, status = 'playing', symbol = '💰') {
  const playerValue = handValue(game.playerHand);
  const dealerValue = handValue(game.dealerHand);
  const hideDealer = status === 'playing';

  let color = Colors.PRIMARY;
  let title = '🃏 Blackjack';
  let footer = 'Hit to draw, Stand to keep your hand';

  if (status === 'win') {
    color = Colors.SUCCESS;
    title = '🃏 Blackjack - You Win!';
    footer = `You won ${symbol} ${(game.bet * 2).toLocaleString()}!`;
  } else if (status === 'blackjack') {
    color = Colors.GOLD;
    title = '🃏 BLACKJACK!';
    footer = `Blackjack pays 2.5x! You won ${symbol} ${Math.floor(game.bet * 2.5).toLocaleString()}!`;
  } else if (status === 'lose') {
    color = Colors.ERROR;
    title = '🃏 Blackjack - Dealer Wins';
    footer = `You lost ${symbol} ${game.bet.toLocaleString()}`;
  } else if (status === 'bust') {
    color = Colors.ERROR;
    title = '🃏 Blackjack - Bust!';
    footer = `You went over 21! Lost ${symbol} ${game.bet.toLocaleString()}`;
  } else if (status === 'push') {
    color = Colors.WARNING;
    title = '🃏 Blackjack - Push';
    footer = 'Tie! Your bet has been returned.';
  }

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .addFields(
      {
        name: `Dealer's Hand ${hideDealer ? '' : `(${dealerValue})`}`,
        value: `\`${formatHand(game.dealerHand, hideDealer)}\``,
        inline: false
      },
      {
        name: `Your Hand (${playerValue})`,
        value: `\`${formatHand(game.playerHand)}\``,
        inline: false
      },
      { name: 'Bet', value: `${symbol} ${game.bet.toLocaleString()}`, inline: true }
    )
    .setFooter({ text: footer })
    .setTimestamp();

  return embed;
}

function createButtons(disabled = false) {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('blackjack_hit')
        .setLabel('Hit')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🎴')
        .setDisabled(disabled),
      new ButtonBuilder()
        .setCustomId('blackjack_stand')
        .setLabel('Stand')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('✋')
        .setDisabled(disabled)
    );
}

export default {
  name: 'blackjack',
  description: 'Play a game of blackjack',
  aliases: ['bj'],
  cooldown: 5,
  guildOnly: true,

  data: new SlashCommandBuilder()
    .setName('blackjack')
    .setDescription('Play a game of blackjack')
    .addIntegerOption(opt =>
      opt.setName('bet').setDescription('Amount to bet').setRequired(true).setMinValue(10).setMaxValue(50000)
    ),

  async execute(interaction, client) {
    const isSlash = interaction.isChatInputCommand?.();
    const guild = interaction.guild;
    const user = isSlash ? interaction.user : interaction.author;
    const userId = user.id;

    const economyModule = client.getModule('economy');
    const symbol = economyModule?.getCurrencySymbol(guild.id) || '💰';

    // Check for existing game
    if (activeGames.has(userId)) {
      return isSlash
        ? interaction.reply({ embeds: [errorEmbed('You already have an active blackjack game!')], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [errorEmbed('You already have an active blackjack game!')] });
    }

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

    const userData = client.db.getBalance(userId, guild.id);
    if (userData.balance < bet) {
      return isSlash
        ? interaction.reply({ embeds: [errorEmbed(`You don't have enough coins! You have ${symbol} **${userData.balance.toLocaleString()}**`)], flags: MessageFlags.Ephemeral })
        : interaction.reply({ embeds: [errorEmbed(`You don't have enough coins!`)] });
    }

    // Deduct bet
    client.db.removeBalance(userId, guild.id, bet);

    // Create game
    const deck = createDeck();
    const game = {
      deck,
      playerHand: [deck.pop(), deck.pop()],
      dealerHand: [deck.pop(), deck.pop()],
      bet,
      guildId: guild.id
    };

    // Check for immediate blackjack
    const playerValue = handValue(game.playerHand);
    if (playerValue === 21) {
      const winnings = Math.floor(bet * 2.5);
      client.db.addBalance(userId, guild.id, winnings);

      const embed = createGameEmbed(game, 'blackjack', symbol);
      return isSlash
        ? interaction.reply({ embeds: [embed] })
        : interaction.reply({ embeds: [embed] });
    }

    activeGames.set(userId, game);

    const embed = createGameEmbed(game, 'playing', symbol);
    const row = createButtons();

    const response = isSlash
      ? await interaction.reply({ embeds: [embed], components: [row], fetchReply: true })
      : await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

    // Create button collector
    const collector = response.createMessageComponentCollector({
      filter: i => i.user.id === userId,
      time: 60000
    });

    collector.on('collect', async (i) => {
      const currentGame = activeGames.get(userId);
      if (!currentGame) {
        await i.update({ components: [createButtons(true)] });
        return;
      }

      if (i.customId === 'blackjack_hit') {
        // Draw a card
        currentGame.playerHand.push(currentGame.deck.pop());
        const playerValue = handValue(currentGame.playerHand);

        if (playerValue > 21) {
          // Bust
          activeGames.delete(userId);
          const embed = createGameEmbed(currentGame, 'bust', symbol);
          await i.update({ embeds: [embed], components: [createButtons(true)] });
          collector.stop();
        } else if (playerValue === 21) {
          // Auto-stand on 21
          await resolveGame(i, currentGame, userId, client, symbol);
          collector.stop();
        } else {
          const embed = createGameEmbed(currentGame, 'playing', symbol);
          await i.update({ embeds: [embed], components: [row] });
        }
      } else if (i.customId === 'blackjack_stand') {
        await resolveGame(i, currentGame, userId, client, symbol);
        collector.stop();
      }
    });

    collector.on('end', (collected, reason) => {
      if (reason === 'time') {
        const currentGame = activeGames.get(userId);
        if (currentGame) {
          // Auto-stand on timeout
          activeGames.delete(userId);
          resolveGameTimeout(response, currentGame, userId, client, symbol);
        }
      }
    });
  }
};

async function resolveGame(interaction, game, userId, client, symbol) {
  activeGames.delete(userId);

  // Dealer draws until 17
  while (handValue(game.dealerHand) < 17) {
    game.dealerHand.push(game.deck.pop());
  }

  const playerValue = handValue(game.playerHand);
  const dealerValue = handValue(game.dealerHand);

  let status;
  let winnings = 0;

  if (dealerValue > 21) {
    // Dealer bust
    status = 'win';
    winnings = game.bet * 2;
  } else if (playerValue > dealerValue) {
    status = 'win';
    winnings = game.bet * 2;
  } else if (playerValue < dealerValue) {
    status = 'lose';
  } else {
    status = 'push';
    winnings = game.bet; // Return bet
  }

  if (winnings > 0) {
    client.db.addBalance(userId, game.guildId, winnings);
  }

  const embed = createGameEmbed(game, status, symbol);
  await interaction.update({ embeds: [embed], components: [createButtons(true)] });
}

async function resolveGameTimeout(message, game, userId, client, symbol) {
  // Dealer draws until 17
  while (handValue(game.dealerHand) < 17) {
    game.dealerHand.push(game.deck.pop());
  }

  const playerValue = handValue(game.playerHand);
  const dealerValue = handValue(game.dealerHand);

  let status;
  let winnings = 0;

  if (dealerValue > 21) {
    status = 'win';
    winnings = game.bet * 2;
  } else if (playerValue > dealerValue) {
    status = 'win';
    winnings = game.bet * 2;
  } else if (playerValue < dealerValue) {
    status = 'lose';
  } else {
    status = 'push';
    winnings = game.bet;
  }

  if (winnings > 0) {
    client.db.addBalance(userId, game.guildId, winnings);
  }

  const embed = createGameEmbed(game, status, symbol);
  embed.setFooter({ text: 'Game auto-resolved due to timeout' });

  try {
    await message.edit({ embeds: [embed], components: [createButtons(true)] });
  } catch (e) {
    // Message may have been deleted
  }
}
