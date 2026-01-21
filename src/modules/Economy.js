// Economy module for HyVornBot
// Created by ImVylo

import { EconomyDefaults } from '../utils/constants.js';

class Economy {
  constructor(client) {
    this.client = client;
    this.log = client.logger.child('Economy');
  }

  async init() {
    this.log.info('Economy module initialized');
  }

  /**
   * Check if economy is enabled for a guild
   */
  isEnabled(guildId) {
    const settings = this.client.db.getGuild(guildId).settings;
    const enabledModules = settings.enabledModules || {};
    return enabledModules.economy !== false;
  }

  /**
   * Get economy settings for a guild
   */
  getSettings(guildId) {
    const settings = this.client.db.getGuild(guildId).settings;
    return settings.economy || {};
  }

  /**
   * Get currency name
   */
  getCurrencyName(guildId) {
    const settings = this.getSettings(guildId);
    return settings.currencyName || 'coins';
  }

  /**
   * Get currency symbol/emoji
   */
  getCurrencySymbol(guildId) {
    const settings = this.getSettings(guildId);
    return settings.currencySymbol || '💰';
  }

  /**
   * Format amount with currency
   */
  formatCurrency(amount, guildId) {
    const symbol = this.getCurrencySymbol(guildId);
    return `${symbol} ${amount.toLocaleString()}`;
  }

  /**
   * Claim daily reward
   */
  async claimDaily(userId, guildId) {
    const user = this.client.db.getUser(userId, guildId);
    const settings = this.getSettings(guildId);
    const dailyAmount = settings.dailyAmount || EconomyDefaults.DAILY_AMOUNT;

    const now = new Date();
    const lastClaimed = user.daily_claimed ? new Date(user.daily_claimed) : null;

    // Check if already claimed today
    if (lastClaimed) {
      const lastClaimedDate = lastClaimed.toDateString();
      const todayDate = now.toDateString();

      if (lastClaimedDate === todayDate) {
        // Calculate time until next daily
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const timeUntil = tomorrow.getTime() - now.getTime();

        return {
          success: false,
          message: 'already_claimed',
          timeUntil
        };
      }
    }

    // Calculate streak bonus
    let streak = 1;
    let bonus = 0;

    if (lastClaimed) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastClaimed.toDateString() === yesterday.toDateString()) {
        streak = (user.daily_streak || 0) + 1;
        bonus = Math.min(streak * 10, 100); // Max 100 bonus
      }
    }

    const totalAmount = dailyAmount + bonus;

    // Update user
    this.client.db.updateUser(userId, guildId, {
      balance: user.balance + totalAmount,
      daily_claimed: now.toISOString(),
      daily_streak: streak
    });

    return {
      success: true,
      amount: dailyAmount,
      bonus,
      total: totalAmount,
      streak
    };
  }

  /**
   * Claim work reward
   */
  async claimWork(userId, guildId) {
    const user = this.client.db.getUser(userId, guildId);
    const settings = this.getSettings(guildId);

    const cooldown = settings.workCooldown || EconomyDefaults.WORK_COOLDOWN || 3600000;
    const minAmount = settings.workMin || EconomyDefaults.WORK_MIN;
    const maxAmount = settings.workMax || EconomyDefaults.WORK_MAX;

    const now = Date.now();
    const lastWork = user.work_claimed ? new Date(user.work_claimed).getTime() : 0;

    // Check cooldown
    if (now - lastWork < cooldown) {
      return {
        success: false,
        message: 'cooldown',
        timeRemaining: cooldown - (now - lastWork)
      };
    }

    // Random amount
    const amount = Math.floor(Math.random() * (maxAmount - minAmount + 1)) + minAmount;

    // Update user
    this.client.db.updateUser(userId, guildId, {
      balance: user.balance + amount,
      work_claimed: new Date(now).toISOString()
    });

    // Random job messages
    const jobs = [
      'worked at a coffee shop',
      'delivered packages',
      'walked some dogs',
      'mowed lawns',
      'washed cars',
      'tutored students',
      'fixed computers',
      'streamed on Twitch',
      'sold lemonade',
      'babysat for neighbors'
    ];

    const job = jobs[Math.floor(Math.random() * jobs.length)];

    return {
      success: true,
      amount,
      job
    };
  }

  /**
   * Transfer money between users
   */
  async transfer(fromUserId, toUserId, guildId, amount) {
    const fromUser = this.client.db.getUser(fromUserId, guildId);

    if (fromUser.balance < amount) {
      return {
        success: false,
        message: 'insufficient_funds'
      };
    }

    // Transfer
    this.client.db.updateUser(fromUserId, guildId, {
      balance: fromUser.balance - amount
    });

    this.client.db.addBalance(toUserId, guildId, amount);

    return {
      success: true,
      amount
    };
  }

  /**
   * Attempt to rob another user
   */
  async rob(robberId, victimId, guildId) {
    const settings = this.getSettings(guildId);

    const cooldown = settings.robCooldown || EconomyDefaults.ROB_COOLDOWN || 7200000;
    const successChance = settings.robSuccessChance || EconomyDefaults.ROB_SUCCESS_CHANCE;
    const finePercent = settings.robFinePercent || EconomyDefaults.ROB_FINE_PERCENT;

    const robber = this.client.db.getUser(robberId, guildId);
    const victim = this.client.db.getUser(victimId, guildId);

    // Check cooldown
    const now = Date.now();
    const lastRob = robber.last_rob ? new Date(robber.last_rob).getTime() : 0;

    if (now - lastRob < cooldown) {
      return {
        success: false,
        message: 'cooldown',
        timeRemaining: cooldown - (now - lastRob)
      };
    }

    // Check if victim has money
    if (victim.balance < 100) {
      return {
        success: false,
        message: 'victim_poor'
      };
    }

    // Update cooldown
    this.client.db.updateUser(robberId, guildId, {
      last_rob: new Date(now).toISOString()
    });

    // Random success/fail
    if (Math.random() < successChance) {
      // Success - steal 10-30% of victim's balance
      const percent = 0.1 + Math.random() * 0.2;
      const amount = Math.floor(victim.balance * percent);

      this.client.db.updateUser(victimId, guildId, {
        balance: victim.balance - amount
      });

      this.client.db.addBalance(robberId, guildId, amount);

      return {
        success: true,
        stolen: true,
        amount
      };
    } else {
      // Fail - pay fine
      const fine = Math.floor(robber.balance * finePercent);

      if (fine > 0) {
        this.client.db.updateUser(robberId, guildId, {
          balance: robber.balance - fine
        });
      }

      return {
        success: true,
        stolen: false,
        fine
      };
    }
  }

  /**
   * Gamble with coinflip
   */
  async coinflip(userId, guildId, amount, choice) {
    const user = this.client.db.getUser(userId, guildId);

    if (user.balance < amount) {
      return {
        success: false,
        message: 'insufficient_funds'
      };
    }

    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    const won = choice.toLowerCase() === result;

    if (won) {
      this.client.db.addBalance(userId, guildId, amount);
    } else {
      this.client.db.removeBalance(userId, guildId, amount);
    }

    return {
      success: true,
      won,
      result,
      amount: won ? amount : -amount,
      newBalance: user.balance + (won ? amount : -amount)
    };
  }

  /**
   * Play slots
   */
  async slots(userId, guildId, bet) {
    const user = this.client.db.getUser(userId, guildId);

    if (user.balance < bet) {
      return {
        success: false,
        message: 'insufficient_funds'
      };
    }

    const symbols = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣'];
    const weights = [30, 25, 20, 15, 7, 3]; // Rarity weights

    const spin = () => {
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      let random = Math.random() * totalWeight;

      for (let i = 0; i < symbols.length; i++) {
        random -= weights[i];
        if (random <= 0) return symbols[i];
      }
      return symbols[0];
    };

    const results = [spin(), spin(), spin()];

    // Calculate winnings
    let multiplier = 0;

    if (results[0] === results[1] && results[1] === results[2]) {
      // Three of a kind
      const symbolIndex = symbols.indexOf(results[0]);
      multiplier = [3, 4, 5, 7, 15, 50][symbolIndex];
    } else if (results[0] === results[1] || results[1] === results[2] || results[0] === results[2]) {
      // Two of a kind
      multiplier = 1.5;
    }

    const winnings = Math.floor(bet * multiplier);
    const netGain = winnings - bet;

    this.client.db.updateUser(userId, guildId, {
      balance: user.balance + netGain
    });

    return {
      success: true,
      results,
      won: multiplier > 0,
      bet,
      winnings,
      netGain,
      multiplier,
      newBalance: user.balance + netGain
    };
  }

  cleanup() {
    this.log.info('Economy module cleaned up');
  }
}

export default Economy;
