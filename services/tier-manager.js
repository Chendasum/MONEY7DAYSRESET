/**
 * Tier Management Service for 7-Day Money Flow Reset™
 * Handles tier-based feature access and pricing logic
 */

class TierManager {
  constructor() {
    this.tiers = {
      free: {
        name: "ឥតគិតថ្លៃ",
        price: 0,
        features: [
          "មើលព័ត៌មានកម្មវិធី",
          "ពិនិត្យតម្លៃសេវាកម្ម",
          "ការណែនាំទូទាត់",
        ],
      },
      essential: {
        name: "Essential Program",
        price: 47,
        features: [
          "កម្មវិធីសិក្សា 7-Day Money Flow ពេញលេញ",
          "ទទួល Daily Lessons រាល់ថ្ងៃ",
          "Progress Tracking ឧបករណ៍តាមដាន",
          "កិច្ចការ និង Worksheets ប្រចាំថ្ងៃ",
          "ជំនួយដោះស្រាយបញ្ហា",
          "Support Team ទំនាក់ទំនង",
        ],
      },
      premium: {
        name: "Premium + Support",
        price: 97,
        features: [
          "មានទាំងអស់ពី Essential Program",
          "ទាក់ទងផ្ទាល់ជាមួយ @Chendasum",
          "24/7 Priority Support",
          "ដោះស្រាយបញ្ហាជាអាទិភាព",
          "Advanced Progress Tracking",
          "Personal Reports និងស្ថិតិ",
          "Extended Support ពិសេស",
        ],
      },
      vip: {
        name: "VIP Capital Strategy",
        price: 197,
        features: [
          "មានទាំងអស់ពី Premium Program",
          "Capital Clarity Session (៩០ នាទី)",
          "Opening Frame - ការកំណត់យុទ្ធសាស្ត្រ",
          "Capital X-Ray - ការវិភាគរចនាសម្ព័ន្ធមូលធន",
          "Trust Mapping - ការវាយតម្លៃទំនុកចិត្ត",
          "System Readiness Score - ការវាយតម្លៃភាពត្រៀមខ្លួន",
          "Clarity Prescription - ផែនការយុទ្ធសាស្ត្រ",
          "30-Day Implementation Support",
          "Private Capital Network Access",
          "VIP Priority Support",
        ],
      },
    };

    this.featureMatrix = {
      // Basic Bot Access
      daily_lessons: ["essential", "premium", "vip"],
      progress_tracking: ["essential", "premium", "vip"],
      quote_system: ["essential", "premium", "vip"],
      badges: ["essential", "premium", "vip"],
      help_system: ["essential", "premium", "vip"],

      // Premium Features
      admin_access: ["premium", "vip"],
      priority_support: ["premium", "vip"],
      upload_verification: ["premium", "vip"],
      advanced_analytics: ["premium", "vip"],
      extended_help: ["premium", "vip"],

      // VIP Features
      booking_system: ["vip"],
      capital_clarity: ["vip"],
      capital_clarity_application: ["vip"],
      capital_clarity_booking: ["vip"],
      extended_tracking: ["vip"],
      personal_reports: ["vip"],
      vip_content: ["vip"],
      priority_queue: ["vip"],
      advanced_milestones: ["vip"],
      private_network: ["vip"],
    };
  }

  /**
   * Check if user has access to a specific feature
   * @param {string} userTier - User's tier (free, essential, premium, vip)
   * @param {string} feature - Feature to check
   * @returns {boolean} Whether user has access
   */
  hasFeatureAccess(userTier, feature) {
    const allowedTiers = this.featureMatrix[feature] || [];
    return allowedTiers.includes(userTier);
  }

  /**
   * Get tier information by name
   * @param {string} tierName - Tier name
   * @returns {Object} Tier information
   */
  getTierInfo(tierName) {
    return this.tiers[tierName] || this.tiers.free;
  }

  /**
   * Determine tier from payment amount
   * @param {number} amount - Payment amount
   * @returns {string} Tier name
   */
  getTierFromAmount(amount) {
    if (amount >= 197) return "vip";
    if (amount >= 97) return "premium";
    if (amount >= 47) return "essential";
    return "free";
  }

  /**
   * Get features available for a tier
   * @param {string} tierName - Tier name
   * @returns {Array} Array of features
   */
  getTierFeatures(tierName) {
    return this.tiers[tierName]?.features || [];
  }

  /**
   * Get pricing display for unpaid users (only Essential Program)
   * @returns {string} Formatted pricing message for unpaid users
   */
  getUnpaidPricingDisplay() {
    return `💰 7-Day Money Flow Reset™

🔥 Essential Program - $47 តែប៉ុណ្ណោះ!
⏰ តម្លៃពិសេស: $47 (ធម្មតា $97)

📊 តម្លៃក្នុង១ថ្ងៃ = $6.70 តែប៉ុណ្ណោះ!
☕ ធៀបនឹង: កាហ្វេ២ពែង + នំ១ចាន = $8-10

🎯 ចំណុចខ្លាំងពិសេស:
• ៩២% អ្នកចូលរួម បានសន្សំបាន ២០-៥០% ក្នុង ៧ថ្ងៃ
• ៨៧% បាននិយាយថា "ពិតជាមានតម្លៃ!"
• ៩៥% បានកាត់បន្ថយចំណាយមិនចាំបាច់

💎 មេរៀនពេញលេញ ៧ថ្ងៃ:
• ថ្ងៃទី ១: ស្គាល់លំហូរលុយ (ដឹងថាលុយទៅណា)
• ថ្ងៃទី ២: ស្វែងរកកន្លែងលុយលេច (ឃើញបាត់បង់)
• ថ្ងៃទី ៣: វាយតម្លៃប្រព័ន្ធគ្រប់គ្រងលុយ
• ថ្ងៃទី ៤: ផែនទីចំណូល-ចំណាយ (ត្រួតត្រា)
• ថ្ងៃទី ៥: ការរស់រាន vs ការលូតលាស់ (ជ្រើសរើសប្រាជ្ញា)
• ថ្ងៃទី ៦: ផែនការសកម្មភាព (ចាប់ផ្តើមធ្វើ)
• ថ្ងៃទី ៧: ការរួមបញ្ចូល និងជំហានបន្ទាប់

✅ អ្វីដែលអ្នកនឹងទទួលបាន:
• អ្នកនឹងដឹងថាលុយទៅណា (ឈប់ឆ្ងល់)
• អ្នកនឹងសន្សំបាន ២០-៥០% ក្នុង ៧ថ្ងៃ
• អ្នកនឹងមានប្រព័ន្ធគ្រប់គ្រងលុយ
• អ្នកនឹងឈប់បារម្ភអំពីលុយ
• ផ្លាស់ប្តូរជីវិតហិរញ្ញវត្ថុជារៀងរហូត

🎯 សម្រាប់អ្នកដែល:
• បាត់លុយដោយមិនដឹងថាទៅណា
• ចង់សន្សំបាន ប៉ុន្តែមិនដឹងចាប់ផ្តើម
• ចង់ឈប់ព្រួយបារម្ភអំពីលុយ
• ចង់មានប្រព័ន្ធគ្រប់គ្រងលុយ
• ចង់ដឹងថាតើទៅកាន់ហិរញ្ញវត្ថុបែបណា

⚡ ប្រសិនបើអ្នកមិនឃើញលទ្ធផលក្នុង ៧ថ្ងៃ = យកលុយវិញ ១០០%!

📱 វិធីទូទាត់:
• ABA Bank: 000 194 742
• ACLEDA Bank: 092 798 169  
• Wing Transfer: 102 534 677

💬 បន្ទាប់ពីទូទាត់ សូមផ្ញើរូបថត Payment Confirmation!

🚀 ចាប់ផ្តើមភ្លាម - ទទួលមេរៀនថ្ងៃដំបូង!
⏰ មានតែ ២០ spots សម្រាប់ខែនេះ!`;
  }

  /**
   * Get pricing display for paid users (all tiers for upgrades)
   * @returns {string} Formatted pricing message for paid users
   */
  getPaidPricingDisplay() {
    return `💰 កម្មវិធី 7-Day Money Flow Reset™

🎯 Essential Program - $47
• កម្មវិធីសិក្សា 7-Day Money Flow ពេញលេញ
• ទទួល Daily Lessons រាល់ថ្ងៃ
• Progress Tracking ឧបករណ៍តាមដាន
• កិច្ចការ និង Worksheets ប្រចាំថ្ងៃ
• ជំនួយដោះស្រាយបញ្ហា
• Support Team ទំនាក់ទំនង

🚀 Premium + Support - $97
• មានទាំងអស់ពី Essential Program
• ទាក់ទងផ្ទាល់ជាមួយ @Chendasum
• 24/7 Priority Support
• ដោះស្រាយបញ្ហាជាអាទិភាព
• Advanced Progress Tracking
• Personal Reports និងស្ថិតិ
• Extended Support ពិសេស

👑 VIP Capital Strategy - $197
• មានទាំងអស់ពី Premium Program
• Capital Clarity Session (៩០ នាទី)
• Opening Frame - ការកំណត់យុទ្ធសាស្ត្រ
• Capital X-Ray - ការវិភាគរចនាសម្ព័ន្ធមូលធន
• Trust Mapping - ការវាយតម្លៃទំនុកចិត្ត
• System Readiness Score - ការវាយតម្លៃភាពត្រៀមខ្លួន
• Clarity Prescription - ផែនការយុទ្ធសាស្ត្រ
• 30-Day Implementation Support
• Private Capital Network Access
• VIP Priority Support

🎯 VIP Network Benefits:
• Access to exclusive opportunities
• Private capital network connections
• Invitation-only programs
• Advanced strategy access (by qualification)

📱 វិធីសាស្ត្រទូទាត់:
• ABA Bank: 000 194 742
• ACLEDA Bank: 092 798 169
• Wing Transfer: 010 690 333

បន្ទាប់ពីទូទាត់ សូមផ្ញើរូបថត Payment Confirmation និងប្រាប់ពីកម្មវិធីដែលអ្នកជ្រើសរើស។`;
  }

  /**
   * Get pricing display based on user payment status
   * @param {boolean} isPaid - Whether user is paid
   * @returns {string} Formatted pricing message
   */
  getPricingDisplay(isPaid = false) {
    return isPaid
      ? this.getPaidPricingDisplay()
      : this.getUnpaidPricingDisplay();
  }

  /**
   * Check if user can upgrade to a higher tier
   * @param {string} currentTier - Current tier
   * @param {string} targetTier - Target tier
   * @returns {boolean} Whether upgrade is possible
   */
  canUpgrade(currentTier, targetTier) {
    const tierOrder = ["free", "essential", "premium", "vip"];
    const currentIndex = tierOrder.indexOf(currentTier);
    const targetIndex = tierOrder.indexOf(targetTier);
    return targetIndex > currentIndex;
  }

  /**
   * Get upgrade message for user
   * @param {string} currentTier - Current tier
   * @returns {string} Upgrade message
   */
  getUpgradeMessage(currentTier) {
    const tierOrder = ["free", "essential", "premium", "vip"];
    const currentIndex = tierOrder.indexOf(currentTier);
    const nextTier = tierOrder[currentIndex + 1];

    if (!nextTier) {
      return `👑 អ្នកកំពុងប្រើកម្រិតខ្ពស់បំផុត! អរគុណសម្រាប់ការជ្រើសរើស VIP។`;
    }

    const nextTierInfo = this.tiers[nextTier];
    const upgradeMessages = {
      essential: `🚀 ចង់បាន Premium Support?
      
Premium + Support - $97
• ទាក់ទងផ្ទាល់ជាមួយ @Chendasum
• 24/7 Priority Support
• Advanced Progress Tracking

ទំនាក់ទំនងដើម្បី upgrade!`,

      premium: `👑 ចង់បាន VIP Capital Strategy?
      
VIP Capital Strategy - $197
• Capital Clarity Session (៩០ នាទី)
• 5-Phase Capital Analysis Framework
• Private Capital Network Access

ទំនាក់ទំនងដើម្បី upgrade!`,
    };

    return (
      upgradeMessages[currentTier] || `សូមទាក់ទងដើម្បី upgrade ទៅកម្រិតបន្ទាប់!`
    );
  }

  /**
   * Get tier-specific welcome message
   * @param {string} tier - User tier
   * @returns {string} Welcome message
   */
  getTierWelcomeMessage(tier) {
    const welcomeMessages = {
      essential: `🎯 ស្វាគមន៍ចូល Essential Program!

អ្នកទទួលបាន:
✅ កម្មវិធីសិក្សា 7 ថ្ងៃពេញលេញ
✅ មេរៀនរាល់ថ្ងៃ
✅ ឧបករណ៍តាមដានសមិទ្ធផល
✅ កិច្ចការ និងលំហាត់ប្រចាំថ្ងៃ
✅ ការគាំទ្រពីក្រុមជំនួយ

ចាប់ផ្តើមជាមួយ /day1 ឥឡូវនេះ!`,

      premium: `🚀 ស្វាគមន៍ចូល Premium Program!

អ្នកទទួលបាន:
✅ កម្មវិធីមូលដ្ឋានពេញលេញ
✅ ទាក់ទងផ្ទាល់ជាមួយ @Chendasum
✅ ជំនួយបន្ទាន់ 24 ម៉ោង
✅ ដោះស្រាយបញ្ហាជាអាទិភាព
✅ ការតាមដានលម្អិតខ្ពស់

អ្នកអាចទាក់ទងអ្នកគ្រប់គ្រងដោយផ្ទាល់! ចាប់ផ្តើមជាមួយ /day1!`,

      vip: `👑 ស្វាគមន៍ចូល VIP Capital Strategy!

អ្នកទទួលបាន:
✅ Premium Program ពេញលេញ
✅ ជួបផ្ទាល់ 1-on-1 Session
✅ Capital Clarity Session (តម្លៃ $197)
✅ ការតាមដាន 30 ថ្ងៃ
✅ អាទិភាព VIP Support
✅ ចូលរួម Private Network

អ្នកទទួលបានការបម្រើពិសេស! ចាប់ផ្តើមជាមួយ /day1!`,
    };

    return (
      welcomeMessages[tier] || `ស្វាគមន៍! ប្រើ /pricing ដើម្បីមើលកម្មវិធី។`
    );
  }

  /**
   * Get tier badge/icon
   * @param {string} tier - User tier
   * @returns {string} Tier badge
   */
  getTierBadge(tier) {
    const badges = {
      free: "🔓",
      essential: "🎯",
      premium: "🚀",
      vip: "👑",
    };
    return badges[tier] || "🔓";
  }

  /**
   * Get simple tier description for users
   * @param {string} tier - User tier
   * @returns {string} Simple description
   */
  getSimpleTierDescription(tier) {
    const descriptions = {
      essential: "កម្មវិធី 7 ថ្ងៃពេញលេញ",
      premium: "កម្មវិធី + Support ផ្ទាល់",
      vip: "កម្មវិធី + Capital Strategy",
    };
    return descriptions[tier] || "មិនមានកម្មវិធី";
  }
}

module.exports = TierManager;
