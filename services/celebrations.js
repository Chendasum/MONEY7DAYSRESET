/**
 * Micro-Celebration Animations Service
 * Adds engaging celebration animations for user achievements
 */

class CelebrationService {
  constructor() {
    this.animations = {
      dayComplete: {
        emojis: ["🎉", "✨", "🌟", "🎊", "🏆", "💫"],
        patterns: [
          "🎉✨🎉✨🎉✨🎉",
          "🌟💫🌟💫🌟💫🌟",
          "🎊🏆🎊🏆🎊🏆🎊",
          "✨🎉🌟🎊💫🏆✨",
        ],
      },
      paymentConfirmed: {
        emojis: ["💰", "🎯", "🚀", "⭐", "🔥", "💎"],
        patterns: [
          "💰🎯🚀💰🎯🚀💰",
          "⭐🔥💎⭐🔥💎⭐",
          "🚀💰🎯🔥💎⭐🚀",
          "💎🔥⭐💰🎯🚀💎",
        ],
      },
      programComplete: {
        emojis: ["🏆", "🎊", "🌟", "🎉", "💫", "👑"],
        patterns: [
          "🏆🎊🌟🎉💫👑🏆",
          "🌟🎉🏆💫🎊👑🌟",
          "🎊👑🏆🌟💫🎉🎊",
          "💫🏆🎉🌟🎊👑💫",
        ],
      },
      vipUpgrade: {
        emojis: ["👑", "💎", "⭐", "🔥", "🚀", "🌟"],
        patterns: [
          "👑💎⭐🔥🚀🌟👑",
          "💎🌟👑⭐🔥🚀💎",
          "⭐🚀🔥👑💎🌟⭐",
          "🔥👑🌟💎⭐🚀🔥",
        ],
      },
      milestone: {
        emojis: ["🎯", "🌟", "💫", "✨", "🎉", "🏅"],
        patterns: [
          "🎯🌟💫✨🎉🏅🎯",
          "🌟🎉🏅💫✨🎯🌟",
          "💫🎯🌟🏅🎉✨💫",
          "✨🏅🎉🎯🌟💫✨",
        ],
      },
    };
  }

  /**
   * Create animated celebration message
   * @param {string} type - Type of celebration
   * @param {string} message - Main message content
   * @param {Object} options - Animation options
   * @returns {string} Animated message
   */
  createCelebration(type, message, options = {}) {
    const animation = this.animations[type] || this.animations.milestone;
    const pattern = this.getRandomPattern(animation.patterns);
    const duration = options.duration || "normal";

    let celebrationText = "";

    // Add animated header
    celebrationText += this.createAnimatedHeader(pattern, duration);
    celebrationText += "\n\n";

    // Add main message
    celebrationText += message;
    celebrationText += "\n\n";

    // Add animated footer
    celebrationText += this.createAnimatedFooter(pattern, duration);

    return celebrationText;
  }

  /**
   * Create animated header
   * @param {string} pattern - Emoji pattern
   * @param {string} duration - Animation duration
   * @returns {string} Animated header
   */
  createAnimatedHeader(pattern, duration) {
    switch (duration) {
      case "short":
        return pattern;
      case "long":
        return `${pattern}\n${pattern}\n${pattern}`;
      default:
        return `${pattern}\n${pattern}`;
    }
  }

  /**
   * Create animated footer
   * @param {string} pattern - Emoji pattern
   * @param {string} duration - Animation duration
   * @returns {string} Animated footer
   */
  createAnimatedFooter(pattern, duration) {
    const reversed = pattern.split("").reverse().join("");
    switch (duration) {
      case "short":
        return reversed;
      case "long":
        return `${reversed}\n${reversed}\n${reversed}`;
      default:
        return `${reversed}\n${reversed}`;
    }
  }

  /**
   * Get random pattern from array
   * @param {Array} patterns - Array of patterns
   * @returns {string} Random pattern
   */
  getRandomPattern(patterns) {
    return patterns[Math.floor(Math.random() * patterns.length)];
  }

  /**
   * Create day completion celebration
   * @param {number} dayNumber - Day number completed
   * @param {string} customMessage - Custom message
   * @returns {string} Celebration message
   */
  dayCompleteCelebration(dayNumber, customMessage = "") {
    const achievements = {
      1: "បានស្គាល់ Money Flow របស់អ្នក!",
      2: "បានរកឃើញ Money Leaks!",
      3: "បានវាយតម្លៃប្រព័ន្ធហិរញ្ញវត្ថុ!",
      4: "បានបង្កើតផែនទី Income & Cost!",
      5: "បានយល់ពី Survival vs Growth!",
      6: "បានបង្កើតផែនការសកម្មភាព!",
      7: "បានបញ្ចប់កម្មវិធីពេញលេញ!",
    };

    const baseMessage = `🎊 អបអរសាទរ! អ្នកបានបញ្ចប់ថ្ងៃទី ${dayNumber}!

🌟 ${achievements[dayNumber] || "សម្រេចបានជាពិសេស!"}

${customMessage}

💪 រក្សាភាពជោគជ័យនេះបន្ត!`;

    return this.createCelebration("dayComplete", baseMessage, {
      duration: "normal",
    });
  }

  /**
   * Create payment confirmation celebration
   * @param {string} customMessage - Custom message
   * @returns {string} Celebration message
   */
  paymentConfirmedCelebration(customMessage = "") {
    const baseMessage = `🎉 ការទូទាត់បានបញ្ជាក់!

🚀 សូមស្វាគមន៍ចូលរួមកម្មវិធី 7-Day Money Flow Reset™!

${customMessage}

💎 ការដំណើរផ្លាស់ប្តូរជីវិតចាប់ផ្តើមហើយ!`;

    return this.createCelebration("paymentConfirmed", baseMessage, {
      duration: "long",
    });
  }

  /**
   * Create program completion celebration
   * @param {string} customMessage - Custom message
   * @returns {string} Celebration message
   */
  programCompleteCelebration(customMessage = "") {
    const baseMessage = `🏆 អបអរសាទរ! អ្នកបានបញ្ចប់ 7-Day Money Flow Reset™!

🌟 អ្នកបានសម្រេច:
✅ ស្គាល់ Money Flow របស់អ្នក
✅ រកឃើញ Money Leaks
✅ វាយតម្លៃប្រព័ន្ធហិរញ្ញវត្ថុ
✅ បង្កើតផែនទី Income & Cost
✅ យល់ពី Survival vs Growth
✅ បង្កើតផែនការសកម្មភាព
✅ បញ្ចប់កម្មវិធីពេញលេញ

${customMessage}

🎯 ឥឡូវនេះអ្នកមានវិធីសាស្ត្រពិតប្រាកដសម្រាប់គ្រប់គ្រងលុយ!`;

    return this.createCelebration("programComplete", baseMessage, {
      duration: "long",
    });
  }

  /**
   * Create VIP upgrade celebration
   * @param {string} customMessage - Custom message
   * @returns {string} Celebration message
   */
  vipUpgradeCelebration(customMessage = "") {
    const baseMessage = `👑 អបអរសាទរ! អ្នកបានក្លាយជា VIP Member!

💎 អ្នកឥឡូវនេះមានសិទ្ធិចូលប្រើ:
✅ 1-on-1 coaching calls
✅ Advanced strategies
✅ Priority support 24/7
✅ Exclusive templates
✅ Private community

${customMessage}

🚀 ជំហានបន្ទាប់ទៅកាន់ជោគជ័យ!`;

    return this.createCelebration("vipUpgrade", baseMessage, {
      duration: "long",
    });
  }

  /**
   * Create milestone celebration
   * @param {string} milestone - Milestone achieved
   * @param {string} customMessage - Custom message
   * @returns {string} Celebration message
   */
  milestoneCelebration(milestone, customMessage = "") {
    const baseMessage = `🎯 អបអរសាទរ!

🌟 ${milestone}

${customMessage}

💪 បន្តដំណើរជោគជ័យនេះ!`;

    return this.createCelebration("milestone", baseMessage, {
      duration: "normal",
    });
  }

  /**
   * Create quick celebration for small achievements
   * @param {string} achievement - Achievement text
   * @returns {string} Quick celebration
   */
  quickCelebration(achievement) {
    const emojis = ["🎉", "✨", "🌟", "🎊", "💫"];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

    return `${randomEmoji} ${achievement} ${randomEmoji}`;
  }

  /**
   * Send animated celebration message
   * @param {Object} bot - Telegram bot instance
   * @param {number} chatId - Chat ID
   * @param {string} type - Celebration type
   * @param {string} message - Message content
   * @param {Object} options - Options
   */
  async sendCelebration(bot, chatId, type, message, options = {}) {
    const celebrationMessage = this.createCelebration(type, message, options);

    // Send main celebration
    await bot.sendMessage(chatId, celebrationMessage);

    // Optional: Send quick follow-up animation
    if (options.followUp) {
      setTimeout(async () => {
        await bot.sendMessage(chatId, this.quickCelebration(options.followUp));
      }, 2000);
    }
  }

  /**
   * Get progress celebration based on completion percentage
   * @param {number} percentage - Completion percentage
   * @returns {string} Progress celebration
   */
  getProgressCelebration(percentage) {
    if (percentage >= 100) {
      return "🏆 ពេញលេញ! អ្នកអស្ចារ្យ!";
    } else if (percentage >= 75) {
      return "🌟 ស្ទើរបាន! បន្តិច!";
    } else if (percentage >= 50) {
      return "💪 កំពុងល្អ! បន្ត!";
    } else if (percentage >= 25) {
      return "🎯 ចាប់ផ្តើមល្អ!";
    } else {
      return "🚀 ចាប់ផ្តើម!";
    }
  }
}

module.exports = new CelebrationService();
