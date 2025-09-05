/**
 * Simplified Tier Management Service
 * Works with the fixed AccessControl service
 */

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
        price: 24,
        features: ['daily_lessons', 'progress_tracking', 'basic_support'],
        badge: '✅'
      },
      premium: {
        name: 'ពិសេស',
        price: 97,
        features: ['daily_lessons', 'progress_tracking', 'priority_support', 'advanced_analytics', 'admin_contact'],
        badge: '🚀'
      },
      vip: {
        name: 'វី.អាយ.ភី',
        price: 197,
        features: ['daily_lessons', 'progress_tracking', 'priority_support', 'advanced_analytics', 'admin_contact', 'booking_system', 'capital_clarity', 'vip_reports'],
        badge: '👑'
      }
    };

    // Payment configuration
    this.paymentConfig = {
      aba: { account: "000 194 742", name: "SUM CHENDA" },
      acleda: { account: "092 798 169", name: "SUM CHENDA" },
      wing: { number: "102 534 677", name: "SUM CHENDA" },
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

  // Simple pricing display for unpaid users
  getUnpaidPricingDisplay() {
    return `💰 តម្លៃកម្មវិធី 7-Day Money Flow Reset™

🎯 កម្មវិធីសាមញ្ញ (Essential Program)
💵 តម្លៃ: $24 USD (បញ្ចុះតម្លៃ 50%)
🏷️ កូដ: LAUNCH50

📚 អ្វីដែលអ្នកនឹងទទួលបាន:
✅ មេរៀន ៧ ថ្ងៃពេញលេញ
✅ ការគ្រប់គ្រងលុយបានល្អ
✅ ការកាត់បន្ថយចំណាយ
✅ ការបង្កើនចំណូល
✅ ផែនការហិរញ្ញវត្ថុច្បាស់

🎯 កម្មវិធី Premium (ការប្រឹក្សាផ្ទាល់)
💵 តម្លៃ: $97 USD
✅ ទទួលបាន Essential Program ពេញលេញ
✅ ការប្រឹក្សាផ្ទាល់ខ្លួន 1-on-1
✅ ការតាមដានផ្ទាល់ខ្លួន
✅ ឧបករណ៍វិភាគកម្រិតខ្ពស់

👑 កម្មវិធី VIP (Capital Strategy)
💵 តម្លៃ: $197 USD
✅ ទទួលបាន Premium ពេញលេញ
✅ Capital Clarity Session
✅ Strategic Network Access
✅ Implementation Support

💎 វិធីទូទាត់:
• ABA Bank: ${this.paymentConfig.aba.account}
• ACLEDA Bank: ${this.paymentConfig.acleda.account}
• Wing: ${this.paymentConfig.wing.number}
• ឈ្មោះ: ${this.paymentConfig.aba.name}

⚡ ចាប់ផ្តើមភ្លាមៗ:
👉 /payment - ការណែនាំទូទាត់ពេញលេញ
👉 @Chendasum - ជំនួយផ្ទាល់`;
  }

  // Simple pricing display for paid users
  getPaidPricingDisplay() {
    return `💰 កម្មវិធី 7-Day Money Flow Reset™ - ការដំឡើងកម្រិត

✅ អ្នកមានកម្មវិធី Essential រួចហើយ!

🚀 ចង់ដំឡើងទៅ Premium? ($97)
• ការប្រឹក្សាផ្ទាល់ខ្លួន 1-on-1
• ការតាមដានផ្ទាល់ខ្លួន
• ការគាំទ្រអាទិភាព 24/7

👑 ចង់ដំឡើងទៅ VIP? ($197)
• គ្រប់យ៉ាងពី Premium
• Capital Clarity Session
• Strategic Network Access
• VIP Features ពេញលេញ

💳 ការទូទាត់: /payment
💬 ជំនួយ: @Chendasum`;
  }

  getPricingDisplay(isPaid = false) {
    return isPaid ? this.getPaidPricingDisplay() : this.getUnpaidPricingDisplay();
  }

  getTierFromAmount(amount) {
    if (amount >= 197) return "vip";
    if (amount >= 97) return "premium";
    if (amount >= 24) return "essential";
    return "free";
  }

  canUpgrade(currentTier, targetTier) {
    const tierOrder = ["free", "essential", "premium", "vip"];
    const currentIndex = tierOrder.indexOf(currentTier);
    const targetIndex = tierOrder.indexOf(targetTier);
    return targetIndex > currentIndex;
  }

  getTierWelcomeMessage(tier) {
    const welcomeMessages = {
      essential: `🎯 ស្វាគមន៍ចូល Essential Program!

✅ អ្នកឥឡូវអាចចូលប្រើ:
• កម្មវិធីសិក្សា ៧ ថ្ងៃពេញលេញ
• ការតាមដានការរីកចម្រើន
• ការគាំទ្រមូលដ្ឋាន

🚀 ចាប់ផ្តើមជាមួយ /day1 ឥឡូវនេះ!`,

      premium: `🚀 ស្វាគមន៍ចូល Premium Program!

✅ អ្នកឥឡូវអាចចូលប្រើ:
• កម្មវិធីមូលដ្ឋានពេញលេញ
• ការប្រឹក្សាផ្ទាល់ខ្លួន
• ការគាំទ្រអាទិភាព 24/7
• ការវិភាគកម្រិតខ្ពស់

💪 ចាប់ផ្តើមជាមួយ /day1!`,

      vip: `👑 ស្វាគមន៍ចូល VIP Program!

✅ អ្នកឥឡូវអាចចូលប្រើ:
• កម្មវិធី Premium ពេញលេញ
• Capital Clarity Session
• VIP Features ទាំងអស់
• ការគាំទ្រ VIP ពិសេស

🔥 ចាប់ផ្តើមជាមួយ /day1 + VIP Benefits!`
    };

    return welcomeMessages[tier] || "ស្វាគមន៍! ប្រើ /pricing ដើម្បីមើលកម្មវិធី។";
  }
}

module.exports = TierManager;
