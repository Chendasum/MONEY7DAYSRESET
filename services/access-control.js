/**
 * Access Control Service for Tier-Based Features
 * Updated for Drizzle ORM compatibility
 */
const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const { pgTable, serial, text, integer, bigint, boolean, timestamp, jsonb } = require('drizzle-orm/pg-core');
const { eq } = require('drizzle-orm');

// Database setup (reuse your existing connection)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Database schema (matching your main file)
const users = pgTable('users', {
  id: serial('id').primaryKey(),
  telegram_id: bigint('telegram_id', { mode: 'number' }).notNull().unique(),
  username: text('username'),
  first_name: text('first_name'),
  last_name: text('last_name'),
  phone_number: text('phone_number'),
  email: text('email'),
  joined_at: timestamp('joined_at').defaultNow(),
  is_paid: boolean('is_paid').default(false),
  payment_date: timestamp('payment_date'),
  transaction_id: text('transaction_id'),
  is_vip: boolean('is_vip').default(false),
  tier: text('tier').default('free'),
  tier_price: integer('tier_price').default(0),
  last_active: timestamp('last_active').defaultNow(),
  timezone: text('timezone').default('Asia/Phnom_Penh'),
  testimonials: jsonb('testimonials'),
  testimonial_requests: jsonb('testimonial_requests'),
  upsell_attempts: jsonb('upsell_attempts'),
  conversion_history: jsonb('conversion_history'),
});

const db = drizzle(pool, { schema: { users } });

class TierManager {
  constructor() {
    this.tiers = {
      free: {
        name: 'ឥតគិតថ្លៃ',
        features: ['preview', 'basic_help'],
        badge: '🆓'
      },
      essential: {
        name: 'សំខាន់',
        features: ['daily_lessons', 'progress_tracking', 'basic_support'],
        badge: '✅'
      },
      premium: {
        name: 'ពិសេស',
        features: ['daily_lessons', 'progress_tracking', 'priority_support', 'advanced_analytics', 'admin_contact'],
        badge: '🚀'
      },
      vip: {
        name: 'វី.អាយ.ភី',
        features: ['daily_lessons', 'progress_tracking', 'priority_support', 'advanced_analytics', 'admin_contact', 'booking_system', 'capital_clarity', 'vip_reports'],
        badge: '👑'
      }
    };
  }

  hasFeatureAccess(userTier, feature) {
    const tier = this.tiers[userTier] || this.tiers.free;
    return tier.features.includes(feature);
  }

  getTierInfo(tierName) {
    return this.tiers[tierName] || this.tiers.free;
  }

  getTierBadge(tierName) {
    const tier = this.tiers[tierName] || this.tiers.free;
    return tier.badge;
  }
}

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
      const [user] = await db.select().from(users).where(eq(users.telegram_id, telegramId));
      
      if (!user) {
        return {
          hasAccess: false,
          userTier: 'free',
          message: "🔒 សូមចុះឈ្មោះជាមុនសិន។ ប្រើ /start ដើម្បីចាប់ផ្តើម។"
        };
      }

      if (!user.is_paid) {
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
      const [user] = await db.select().from(users).where(eq(users.telegram_id, telegramId));
      
      if (!user || !user.is_paid) {
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
        price: user.tier_price || 0,
        paidAt: user.payment_date
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

    // Get user to check payment status
    let user = null;
    try {
      const [userData] = await db.select().from(users).where(eq(users.telegram_id, telegramId));
      user = userData;
    } catch (error) {
      console.error('Error getting user for help:', error);
    }

    const isPaid = user ? user.is_paid : false;
    const pricingText = isPaid ? 'មើលតម្លៃ ($24 / $97 / $197)' : 'មើលតម្លៃ ($24)';

    const baseCommands = `📱 ពាក្យបញ្ជាសំខាន់:
- /start - ចាប់ផ្តើម
- /pricing - ${pricingText}
- /payment - ការទូទាត់
- /help - ជំនួយ
- /faq - សំណួរញឹកញាប់

💬 ជំនួយ: @Chendasum`;

    if (tier === 'free') {
      return `📱 ជំនួយ (Help):

🌟 7-Day Money Flow Reset™ 

${baseCommands}

🔒 ចង់ចូលរៀន? ប្រើ /pricing ដើម្បីមើលកម្មវិធី

💬 ជំនួយ: @Chendasum`;
    }

    const paidCommands = `
🎯 ពាក្យបញ្ជាមេរៀន:
- /day1 - ថ្ងៃទី១: ស្គាល់ Money Flow
- /day2 - ថ្ងៃទី២: ស្វែងរក Money Leaks
- /day3 - ថ្ងៃទី៣: វាយតម្លៃប្រព័ន្ធ
- /day4 - ថ្ងៃទី៤: បង្កើតផែនទីលុយ
- /day5 - ថ្ងៃទី៥: Survival vs Growth
- /day6 - ថ្ងៃទី៦: រៀបចំផែនការ
- /day7 - ថ្ងៃទី៧: Integration

🏆 ការតាមដាន:
- /badges - មើលការរីកចម្រើន
- /progress - ការរីកចម្រើនពេញលេញ
- /status - ស្ថានភាព`;

    let specificFeatures = '';
    
    if (tier === 'premium' || tier === 'vip') {
      specificFeatures += `
🚀 មុខងារ Premium:
- /admin_contact - ទាក់ទងអ្នកគ្រប់គ្រង
- /priority_support - ការជំនួយពិសេស
- /advanced_analytics - ទិន្នន័យលម្អិត`;
    }

    if (tier === 'vip') {
      specificFeatures += `
👑 មុខងារ VIP:
- /book_session - កក់ពេលជួប 1-on-1
- /vip_program_info - ព័ត៌មាន VIP ពេញលេញ
- សរសេរ "VIP APPLY" - ដាក់ពាក្យ VIP`;
    }

    return `📱 ជំនួយ (Help):

🌟 7-Day Money Flow Reset™ 
កម្រិតបច្ចុប្បន្ន: ${badge} ${tierInfo.tierInfo.name}

${baseCommands}${paidCommands}${specificFeatures}

💬 ជំនួយ: @Chendasum`;
  }

  /**
   * Check if user can access admin features
   * @param {number} telegramId - User's telegram ID
   * @returns {Promise<boolean>} Whether user has admin access
   */
  async hasAdminAccess(telegramId) {
    const adminIds = [484389665]; // Your admin ID
    return adminIds.includes(telegramId);
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
