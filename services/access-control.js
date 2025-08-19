/**
 * Access Control Service for Tier-Based Features
 * Manages user access based on payment tier levels
 */

const User = require('../models/User');
const TierManager = require('./tier-manager');

class AccessControl {
  constructor() {
    this.tierManager = new TierManager();
  }

  /**
   * Check if user has access to a specific feature
   * @param {number} telegramId - User's telegram ID
   * @param {string} feature - Feature name
   * @returns {Promise<{hasAccess: boolean, userTier: string, message?: string}>}
   */
  async checkAccess(telegramId, feature) {
    try {
      const user = await User.findOne({ telegramId });
      
      if (!user) {
        return {
          hasAccess: false,
          userTier: 'free',
          message: "🔒 សូមចុះឈ្មោះជាមុនសិន។ ប្រើ /start ដើម្បីចាប់ផ្តើម។"
        };
      }

      if (!user.isPaid) {
        return {
          hasAccess: false,
          userTier: 'free',
          message: "🔒 សូមទូទាត់មុនដើម្បីចូលរួមកម្មវិធី។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។"
        };
      }

      const userTier = user.tier || 'essential';
      const hasAccess = this.tierManager.hasFeatureAccess(userTier, feature);

      if (!hasAccess) {
        const tierBadge = this.tierManager.getTierBadge(userTier);
        return {
          hasAccess: false,
          userTier,
          message: `${tierBadge} មុខងារនេះត្រូវការកម្រិតខ្ពស់ជាង។ ប្រើ /pricing ដើម្បីមើលការ upgrade។`
        };
      }

      return {
        hasAccess: true,
        userTier,
        user
      };
    } catch (error) {
      console.error('Access control error:', error);
      return {
        hasAccess: false,
        userTier: 'free',
        message: "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។"
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
      const user = await User.findOne({ telegramId });
      
      if (!user || !user.isPaid) {
        return {
          tier: 'free',
          tierInfo: this.tierManager.getTierInfo('free'),
          badge: this.tierManager.getTierBadge('free')
        };
      }

      const userTier = user.tier || 'essential';
      return {
        tier: userTier,
        tierInfo: this.tierManager.getTierInfo(userTier),
        badge: this.tierManager.getTierBadge(userTier),
        price: user.tierPrice || 0,
        paidAt: user.paymentDate
      };
    } catch (error) {
      console.error('Error getting user tier info:', error);
      return {
        tier: 'free',
        tierInfo: this.tierManager.getTierInfo('free'),
        badge: this.tierManager.getTierBadge('free')
      };
    }
  }

  /**
   * Create tier-specific help message
   * @param {number} telegramId - User's telegram ID
   * @returns {Promise<string>} Customized help message
   */
  async getTierSpecificHelp(telegramId) {
    const tierInfo = await this.getUserTierInfo(telegramId);
    const { tier, badge } = tierInfo;

    // Payment-status-aware pricing display
    const user = await User.findOne({ telegramId });
    const isPaid = user ? user.isPaid : false;
    const pricingText = isPaid ? 'មើលតម្លៃ ($47 / $97 / $197)' : 'មើលតម្លៃ ($47)';

    const baseCommands = `
🎯 *ពាក្យបញ្ជាទូទៅ*
/start - ចាប់ផ្តើមកម្មវិធី
/day1 - ថ្ងៃទី១: Money Flow Basics
/pricing - ${pricingText}
/payment - ការណែនាំទូទាត់
/help - ជំនួយនេះ
/whoami - មើលព័ត៌មានគណនី`;

    if (tier === 'free') {
      return `${badge} *កម្មវិធីផ្លាស់ប្ដូរ 7-Day Money Flow Reset™*${baseCommands}

🔒 *ចង់ចូលរៀន?* ប្រើ /pricing ដើម្បីមើលកម្មវិធី

🤖 Claude AI Assistant:

💬 /ask [សំណួរ] - សួរអ្វីក៏បាន អំពីលុយ
🎯 /coach - ការណែនាំផ្ទាល់ខ្លួន
🔍 /find_leaks - រកមើល Money Leaks
🆘 /ai_help - ជំនួយពេញលេញ

ឧទាហរណ៍: /ask តើខ្ញុំគួរសន្សំយ៉ាងណា?

🛠 *ជំនួយបន្ថែម*
មានសំណួរអ្វី? អ្នកអាចសរសេរសារមក ខ្ញុំ`;
    }

    const paidCommands = `
🎯 *ពាក្យបញ្ជាមេរៀន*
/day1 - ថ្ងៃទី១: Money Flow Basics
/day2 - ថ្ងៃទី២: Money Leaks
/day3 - ថ្ងៃទី៣: System Evaluation
/day4 - ថ្ងៃទី៤: Income/Cost Mapping
/day5 - ថ្ងៃទី៥: Survival vs Growth
/day6 - ថ្ងៃទី៦: Action Planning
/day7 - ថ្ងៃទី៧: Integration

🏆 *ការតាមដាន*
/badges - មើលការរីកចម្រើន
/progress - ការរីកចម្រើនពេញលេញ
/milestones - សមិទ្ធផលទាំងអស់
/streak - មើលការធ្វើបន្តបន្ទាប់

📚 *សម្រង់ប្រាជ្ញាខ្មែរ*
/quote - សម្រង់ប្រាជ្ញាប្រចាំថ្ងៃ
/wisdom - សម្រង់ចៃដន្យ
/quote_categories - ប្រភេទសម្រង់ទាំងអស់`;

    let specificFeatures = '';
    
    if (tier === 'premium' || tier === 'vip') {
      specificFeatures += `
🚀 *មុខងារ Premium*
/admin_contact - ទាក់ទងអ្នកគ្រប់គ្រង
/priority_support - ការជំនួយពិសេស
/advanced_analytics - ទិន្នន័យលម្អិត`;
    }

    if (tier === 'vip') {
      specificFeatures += `
👑 *មុខងារ VIP*
/book_session - កក់ពេលជួប 1-on-1
/capital_clarity - Capital Clarity Sessions
/vip_reports - របាយការណ៍ផ្ទាល់ខ្លួន
/extended_tracking - ការតាមដាន 30 ថ្ងៃ`;
    }

    return `${badge} *កម្មវិធីផ្លាស់ប្ដូរ 7-Day Money Flow Reset™*
*កម្រិតបច្ចុប្បន្ន: ${tierInfo.tierInfo.name}*${baseCommands}${paidCommands}${specificFeatures}

🛠 *ជំនួយបន្ថែម*
មានសំណួរអ្វី? អ្នកអាចសរសេរសារមក ខ្ញុំ`;
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
    const access = await this.checkAccess(telegramId, 'admin_access');
    return access.hasAccess;
  }

  /**
   * Check if user can book 1-on-1 sessions
   * @param {number} telegramId - User's telegram ID
   * @returns {Promise<boolean>} Whether user can book sessions
   */
  async canBookSessions(telegramId) {
    const access = await this.checkAccess(telegramId, 'booking_system');
    return access.hasAccess;
  }

  /**
   * Get tier-specific support message
   * @param {string} tier - User tier
   * @returns {string} Support message
   */
  getTierSupportMessage(tier) {
    const messages = {
      free: "🔓 សូមទូទាត់ដើម្បីទទួលបានការជំនួយពេញលេញ។",
      essential: "🎯 ប្រើ /help សម្រាប់ការជំនួយ ឬសរសេរសំណួរមកដោយផ្ទាល់។",
      premium: "🚀 អ្នកទទួលបានការជំនួយពិសេស! ប្រើ /admin_contact ដើម្បីទាក់ទងអ្នកគ្រប់គ្រង។",
      vip: "👑 អ្នកទទួលបានការបម្រើពិសេស! ប្រើ /book_session ដើម្បីកក់ពេលជួប 1-on-1។"
    };
    
    return messages[tier] || messages.free;
  }
}

module.exports = AccessControl;
