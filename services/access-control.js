/**
 * Access Control Service for Tier-Based Features
 * Manages user access based on payment tier levels
 */

const User = require("../models/User");
const TierManager = require("./tier-manager");

class AccessControl {
  constructor() {
    this.tierManager = new TierManager();
  }

  /**
   * Simple boolean check for feature access (FIXED - Added missing method)
   * @param {number} telegramId - User's telegram ID
   * @param {string} feature - Feature name
   * @returns {Promise<boolean>} Whether user has access
   */
  async hasAccess(telegramId, feature) {
    const result = await this.checkAccess(telegramId, feature);
    return result.hasAccess;
  }

  /**
   * Check if user can access daily lessons (FIXED - Specific method for daily content)
   * @param {number} telegramId - User's telegram ID
   * @returns {Promise<boolean>} Whether user can access daily content
   */
  async canAccessDailyLessons(telegramId) {
    try {
      const user = await User.findOne({ telegram_id: telegramId });

      if (!user) return false;

      // Handle PostgreSQL boolean conversion
      const isPaid =
        user.is_paid === true || user.is_paid === "t" || user.is_paid === 1;

      return isPaid; // Paid users can access daily lessons
    } catch (error) {
      console.error("Daily lessons access check failed:", error);
      return false;
    }
  }

  /**
   * Check if user has access to a specific feature
   * @param {number} telegramId - User's telegram ID
   * @param {string} feature - Feature name
   * @returns {Promise<{hasAccess: boolean, userTier: string, message?: string}>}
   */
  async checkAccess(telegramId, feature) {
    try {
      const user = await User.findOne({ telegram_id: telegramId });

      if (!user) {
        return {
          hasAccess: false,
          userTier: "free",
          message:
            "🔒 សូមចុះឈ្មោះជាមុនសិន។ ប្រើពាក្យបញ្ជា /start ដើម្បីចាប់ផ្តើម។",
        };
      }

      // FIXED: Handle PostgreSQL boolean conversion (true, 't', 1)
      const isPaid =
        user.is_paid === true || user.is_paid === "t" || user.is_paid === 1;

      // FIXED: Special handling for daily_lessons feature
      if (feature === "daily_lessons") {
        if (!isPaid) {
          return {
            hasAccess: false,
            userTier: "free",
            message:
              "🔒 សូមទូទាត់ប្រាក់ជាមុនដើម្បីចូលរួមកម្មវិធី។ ប្រើពាក្យបញ្ជា /pricing ដើម្បីមើលព័ត៌មាន។",
          };
        }

        return {
          hasAccess: true,
          userTier: user.tier || "essential",
          user,
        };
      }

      if (!isPaid) {
        return {
          hasAccess: false,
          userTier: "free",
          message:
            "🔒 សូមទូទាត់ប្រាក់ជាមុនដើម្បីចូលរួមកម្មវិធី។ ប្រើពាក្យបញ្ជា /pricing ដើម្បីមើលព័ត៌មាន។",
        };
      }

      const userTier = user.tier || "essential";
      const hasAccess = this.tierManager.hasFeatureAccess(userTier, feature);

      if (!hasAccess) {
        const tierBadge = this.tierManager.getTierBadge(userTier);
        return {
          hasAccess: false,
          userTier,
          message: `${tierBadge} មុខងារនេះតម្រូវឱ្យមានកម្រិតខ្ពស់ជាង។ ប្រើពាក្យបញ្ជា /pricing ដើម្បីមើលជម្រើសដំឡើងកម្រិត។`,
        };
      }

      return {
        hasAccess: true,
        userTier,
        user,
      };
    } catch (error) {
      console.error("Access control error:", error);
      return {
        hasAccess: false,
        userTier: "free",
        message: "❌ មានបញ្ហាកើតឡើង។ សូមព្យាយាមម្តងទៀត។",
      };
    }
  }

  /**
   * Get user's current tier information
   * @param {number} telegramId - User's telegram ID
   * @returns {Promise<Object>} User tier information
   */
  async getUserTierInfo(telegramId) {
    try {
      const user = await User.findOne({ telegram_id: telegramId });
      const isPaid = user?.is_paid === true || user?.is_paid === 't' || user?.is_paid === 1;

      if (!user || !isPaid) {
        return {
          tier: "free",
          tierInfo: this.tierManager.getTierInfo("free"),
          badge: this.tierManager.getTierBadge("free"),
        };
      }

      const userTier = user.tier || "essential";
      return {
        tier: userTier,
        tierInfo: this.tierManager.getTierInfo(userTier),
        badge: this.tierManager.getTierBadge(userTier),
        price: user.tier_price || 0,
        paidAt: user.payment_date,
      };
    } catch (error) {
      console.error("Error getting user tier info:", error);
      return {
        tier: "free",
        tierInfo: this.tierManager.getTierInfo("free"),
        badge: this.tierManager.getTierBadge("free"),
      };
    }
  }

  /**
   * Create tier-specific help message
   * @param {number} telegramId - User's telegram ID
   * @returns {Promise<string>} Customized help message
   */
  async getTierSpecificHelp(telegramId) {
    console.log(
      `[getTierSpecificHelp] Starting for Telegram ID: ${telegramId}`,
    );
    try {
      console.log("[getTierSpecificHelp] Step 1: Getting tier info...");
      const tierInfo = await this.getUserTierInfo(telegramId);
      console.log("[getTierSpecificHelp] Step 1 Result: tierInfo =", tierInfo);

      const { tier, badge } = tierInfo;
      const tierDetails = this.tierManager.getTierInfo(tier);
      console.log(
        `[getTierSpecificHelp] Step 2: Extracted tier = ${tier}, badge = ${badge}, tierDetails =`,
        tierDetails,
      );

      // Payment-status-aware pricing display
      console.log(
        "[getTierSpecificHelp] Step 3: Finding user for payment status...",
      );
      const user = await User.findOne({ telegram_id: telegramId });
      const isPaid = user?.is_paid === true || user?.is_paid === 't' || user?.is_paid === 1;
      console.log(
        `[getTierSpecificHelp] Step 3 Result: User found = ${!!user}, isPaid = ${isPaid}`,
      );

      const pricingText = isPaid
        ? "មើលតម្លៃ ($47 / $97 / $197)"
        : "មើលតម្លៃ ($47)";
      console.log(
        `[getTierSpecificHelp] Step 4: Pricing text = ${pricingText}`,
      );

      const baseCommands = `
🎯 ពាក្យបញ្ជាទូទៅ
/start - ចាប់ផ្តើមកម្មវិធី
/pricing - ${pricingText}
/payment - ការណែនាំអំពីការទូទាត់
/help - ជំនួយនេះ
/whoami - មើលព័ត៌មានគណនី`;
      console.log("[getTierSpecificHelp] Step 5: Base commands generated.");

      let helpMessageContent = ""; // Initialize the variable to build the content

      if (tier === "free") {
        console.log(
          "[getTierSpecificHelp] Step 6: Generating FREE tier help content.",
        );
        helpMessageContent = `${badge} កម្មវិធីផ្លាស់ប្ដូរ 7-Day Money Flow Reset™${baseCommands}

🎯 ការពិនិត្យសុខភាពហិរញ្ញវត្ថុ (ឥតគិតថ្លៃ)
/financial_quiz - ពិនិត្យសុខភាពហិរញ្ញវត្ថុ ២ នាទី
/health_check - ការវាយតម្លៃហិរញ្ញវត្ថុ

🎬 ការមើលជាមុនកម្មវិធី (ឥតគិតថ្លៃ)
/preview - ការមើលជាមុនទាំងអស់
/preview_day1 - សាកល្បងមេរៀនទី១
/preview_results - លទ្ធផលអ្នកប្រើប្រាស់ពិតប្រាកដ
/preview_journey - ដំណើរការ ៧ ថ្ងៃពេញលេញ`;

        helpMessageContent += `
💰 ឧបករណ៍គណនាឥតគិតថ្លៃ
/calculate_daily - គណនាចំណាយប្រចាំថ្ងៃ
/find_leaks - រកចំណុចលេចធ្លាយលុយ
/savings_potential - គណនាសក្ដានុពលនៃការសន្សំ
/income_analysis - វិភាគចំណូល`;

        helpMessageContent += `
🔒 ចង់ចូលរៀន? ប្រើពាក្យបញ្ជា /pricing ដើម្បីមើលកម្មវិធី

🛠 ជំនួយបន្ថែម
មានសំណួរអ្វី? អ្នកអាចសរសេរសារមកខ្ញុំ`;
      } else {
        console.log(
          "[getTierSpecificHelp] Step 6: Generating PAID tier help content.",
        );
        const paidCommands = `
🎯 ពាក្យបញ្ជាមេរៀន
/day1 - ថ្ងៃទី១: មូលដ្ឋានគ្រឹះនៃលំហូរលុយ
/day2 - ថ្ងៃទី២: ចំណុចលេចធ្លាយលុយ
/day3 - ថ្ងៃទី៣: ការវាយតម្លៃប្រព័ន្ធ
/day4 - ថ្ងៃទី៤: ការកំណត់ផែនទីចំណូល/ចំណាយ
/day5 - ថ្ងៃទី៥: ការរស់រានធៀបនឹងការរីកចម្រើន
/day6 - ថ្ងៃទី៦: ការរៀបចំផែនការសកម្មភាព
/day7 - ថ្ងៃទី៧: ការរួមបញ្ចូលគ្នា

📈 កម្មវិធីបន្ថែម (30 ថ្ងៃ)
/30day - ទិដ្ឋភាពទូទៅនៃកម្មវិធី 30 ថ្ងៃ
/30day_calendar - ប្រតិទិនពេញលេញ 30 ថ្ងៃ
/extended8 - ថ្ងៃទី៨: ការវិភាគចំណូលកម្រិតខ្ពស់
/extended9 - ថ្ងៃទី៩: ការគ្រប់គ្រងចំណាយអាជីវកម្ម
/extended10 - ថ្ងៃទី១០: ការបង្កើតទម្លាប់ហិរញ្ញវត្ថុ
... និងច្រើនទៀតរហូតដល់ /extended30`;

        paidCommands += `
🏆 ការតាមដាន
/badges - មើលការរីកចម្រើន
/progress - ការរីកចម្រើនពេញលេញ
/milestones - សមិទ្ធផលទាំងអស់
/streak - មើលការអនុវត្តបន្តបន្ទាប់`;

        paidCommands += `
📚 សម្រង់ប្រាជ្ញាខ្មែរ
/quote - សម្រង់ប្រាជ្ញាប្រចាំថ្ងៃ
/wisdom - សម្រង់ប្រាជ្ញាចៃដន្យ
/quote_categories - ប្រភេទសម្រង់ទាំងអស់`;

        let specificFeatures = "";

        if (tier === "premium" || tier === "vip") {
          specificFeatures += `
🚀 មុខងារ Premium
/admin_contact - ទាក់ទងអ្នកគ្រប់គ្រង
/priority_support - ការគាំទ្រអាទិភាព
/advanced_analytics - ទិន្នន័យវិភាគលម្អិត`;
        }

        if (tier === "vip") {
          specificFeatures += `
👑 មុខងារ VIP
/book_session - កក់ពេលជួប 1-on-1
/capital_clarity - វគ្គ Capital Clarity
/vip_reports - របាយការណ៍ផ្ទាល់ខ្លួន
/extended_tracking - ការតាមដាន 30 ថ្ងៃ`;
        }

        const tierName =
          tierDetails && tierDetails.name ? tierDetails.name : tier;
        helpMessageContent = `${badge} កម្មវិធីផ្លាស់ប្ដូរ 7-Day Money Flow Reset™
កម្រិតបច្ចុប្បន្ន: ${tierName}${baseCommands}${paidCommands}${specificFeatures}

🛠 ជំនួយបន្ថែម
មានសំណួរអ្វី? អ្នកអាចសរសេរសារមកខ្ញុំ`;
      }
      console.log(
        "[getTierSpecificHelp] Step 7: Help message content generated.",
      );
      return helpMessageContent; // Correctly return the string
    } catch (error) {
      console.error(
        "Error in getTierSpecificHelp:",
        error.message,
        error.stack,
      ); // Enhanced error logging
      // Ensure the fallback message is a direct string, not using an undefined variable
      return `❌ មានបញ្ហាក្នុងការផ្ទុកជំនួយ។ សូមព្យាយាមម្តងទៀត។

🎯 ពាក្យបញ្ជាមូលដ្ឋាន
/start - ចាប់ផ្តើមកម្មវិធី
/pricing - មើលតម្លៃ
/help - ជំនួយនេះ

🛠 ជំនួយបន្ថែម
មានសំណួរអ្វី? អ្នកអាចសរសេរសារមកខ្ញុំ`;
    }
  }

  /**
   * Middleware function for command protection
   * @param {string} feature - Feature name
   * @returns {Function} Middleware function
   */
  requiresFeature(feature) {
    return async (msg, bot, next) => {
      const access = await this.checkAccess(msg.from.id, feature);

      if (!access.hasAccess) {
        await bot.sendMessage(msg.chat.id, access.message);
        return;
      }

      // Add user and tier info to message object
      msg.userTier = access.userTier;
      msg.user = access.user;

      if (next) next();
    };
  }

  /**
   * Check if user can access admin features
   * @param {number} telegramId - User's telegram ID
   * @returns {Promise<boolean>} Whether user has admin access
   */
  async hasAdminAccess(telegramId) {
    const access = await this.checkAccess(telegramId, "admin_access");
    return access.hasAccess;
  }

  /**
   * Check if user can book 1-on-1 sessions
   * @param {number} telegramId - User's telegram ID
   * @returns {Promise<boolean>} Whether user can book sessions
   */
  async canBookSessions(telegramId) {
    const access = await this.checkAccess(telegramId, "booking_system");
    return access.hasAccess;
  }

  /**
   * Get tier-specific support message
   * @param {string} tier - User tier
   * @returns {string} Support message
   */
  getTierSupportMessage(tier) {
    const messages = {
      free: "🔓 សូមទូទាត់ប្រាក់ដើម្បីទទួលបានការគាំទ្រពេញលេញ។",
      essential:
        "🎯 ប្រើពាក្យបញ្ជា /help សម្រាប់ការគាំទ្រ ឬសរសេរសំណួរមកខ្ញុំដោយផ្ទាល់។",
      premium:
        "🚀 អ្នកទទួលបានការគាំទ្រពិសេស! ប្រើពាក្យបញ្ជា /admin_contact ដើម្បីទាក់ទងអ្នកគ្រប់គ្រង។",
      vip: "👑 អ្នកទទួលបានការបម្រើពិសេស! ប្រើពាក្យបញ្ជា /book_session ដើម្បីកក់ពេលជួប 1-on-1។",
    };

    return messages[tier] || messages.free;
  }
}

module.exports = AccessControl;
