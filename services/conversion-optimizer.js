/**
 * Conversion Optimizer Service
 * Handles follow-up messaging and urgency for users who show interest but don't convert
 */

class ConversionOptimizer {
  constructor() {
    this.urgencyMessages = {
      immediate: `⚠️ បន្ទាន់! មានតែ ២០ កន្លែង សម្រាប់ខែនេះ!

💸 រាល់ថ្ងៃដែលអ្នករង់ចាំ = លុយ $10-25 បាត់បង់ដោយមិនដឹងខ្លួន!

🔥 ៩២% របស់អ្នកដែលចូលរួម បានសន្សំបាន ២០-៥០% ក្នុង ៧ថ្ងៃ!

⏰ តម្លៃពិសេស $47 (ធម្មតា $97) - នឹងកើនឡើងទៅ $67 នៅថ្ងៃស្អែក!

🎯 ចូលរួមឥឡូវនេះ ហើយអ្នកនឹងឃើញលទ្ធផលក្នុង ៧ថ្ងៃ!

📱 ទូទាត់ភ្លាម:
• ABA: 000 194 742
• ACLEDA: 092 798 169
• Wing: 010 690 333`,

      scarcity: `🚨 បន្ទាន់: មានតែ ៥ កន្លែង ចុងក្រោយ!

💰 តម្លៃពិសេស $47 នឹងបាត់ក្នុងរយៈពេល ២៤ ម៉ោង!

🤔 អ្នកនៅតែកំពុងបាត់បង់លុយរាល់ថ្ងៃ... មែនទេ?

✅ ចាប់ពីថ្ងៃស្អែក តម្លៃនឹងត្រឡប់ទៅ $67 វិញ!

🎯 សម្រេចចិត្តឥឡូវនេះ = សន្សំបាន $20 + រកឃើញលុយដែលលេចក្នុង ៧ថ្ងៃ!`,

      testimonial: `💬 អ្នកប្រើប្រាស់ថ្មីៗ និយាយដូចម្តេច:

"ខ្ញុំបានរកឃើញថាខ្ញុំបាត់បង់ $400 ក្នុង១ខែ ដោយមិនដឹងខ្លួន! ឥឡូវនេះខ្ញុំសន្សំបាន $800 រួចហើយ!" - សុវណ្ណ

"ពិតជាអស្ចារ្យ! ៧ថ្ងៃ ហើយខ្ញុំដឹងចាស់ហើយថាលុយទៅណាទាំងអស់។" - ជំរាន

"តម្លៃ $47 ពិតជាមានតម្លៃខ្លាំងណាស់! ខ្ញុំបានសន្សំត្រឡប់មកវិញ $600 ក្នុង២សប្តាហ៍!" - ស្រីពេជ្រ

🤔 អ្នកចង់បន្តបាត់បង់លុយ ឬចង់ទទួលលទ្ធផលដូចគេ?

⏰ តម្លៃពិសេស $47 - មានតែ ៧ កន្លែង ចុងក្រោយ!`
    };

    this.priceAnchoring = {
      daily: `💡 គិតមើលណា: $47 ÷ 7 ថ្ងៃ = $6.70/ថ្ងៃ

☕ ធៀបនឹង:
• កាហ្វេ១ពែង = $4-6
• នំបុ័ង១ចាន = $3-5
• ទឹកក្រូច១ដប = $2-3

🎯 ប្រើ $6.70 ដើម្បីរៀនគ្រប់គ្រងលុយ VS ទិញកាហ្វេ១ពែង?

💸 ធ្វើមិនបាន = បន្តបាត់បង់ $300-800 ក្នុង១ខែ = $3600-9600 ក្នុង១ឆ្នាំ!

🔥 ធ្វើបាន = សន្សំបាន $500-1500 ក្នុង១ខែ = $6000-18000 ក្នុង១ឆ្នាំ!

📈 ROI = 12000% ក្នុង១ឆ្នាំ!`,

      comparison: `💰 ធៀបតម្លៃជាមួយវគ្គផ្សេងៗ:

❌ កម្មវិធីគ្រប់គ្រងលុយអន្តរជាតិ: $200-500
❌ ភ្នាក់ងារហិរញ្ញវត្ថុ: $100-300/ម៉ោង
❌ សៀវភៅហិរញ្ញវត្ថុ: $20-50 (ទ្រឹស្តីប៉ុណ្ណោះ)
❌ កម្មវិធីរៀនអនឡាញ: $150-400

✅ 7-Day Money Flow Reset™: $47 (ទ្រឹស្តី + ការអនុវត្ត + ជំនួយផ្ទាល់)

🎯 ពិតជាសមរម្យខ្លាំងណាស់!`
    };

    this.lossAversion = {
      pain: `😰 គិតមើលណា... រាល់ថ្ងៃដែលរង់ចាំ:

💸 បាត់បង់ $5-15 ដោយមិនដឹងខ្លួន
💸 បាត់បង់ឱកាសរកឃើញ money leaks
💸 បាត់បង់ពេលវេលាដ៏មានតម្លៃ
💸 បាត់បង់ទំនុកចិត្តក្នុងការគ្រប់គ្រងលុយ

🔥 បើអ្នកចូលរួមថ្ងៃនេះ = ឈប់បាត់បង់ពីថ្ងៃស្អែក!

⏰ $47 ឥឡូវនេះ = សន្សំបាន $200-500 ក្នុង១ខែ!`,

      regret: `🤔 ៦ខែចុងក្រោយ អ្នកបានចំណាយ:

• កាហ្វេ: $150-200
• ម្ហូបអាហារ: $300-500  
• ទិញដំណើរ: $100-300
• ការកំសាន្ត: $200-400

💰 សរុប: $750-1400 ក្នុង៦ខែ!

🎯 ហេតុអ្វីមិនចំណាយ $47 ដើម្បីឈប់បាត់បង់លុយ $100-200 ក្នុង១ខែ?

⚡ ប្រសិនបើមិនធ្វើអ្វីសា = បន្តបាត់បង់ $1200-2400 ក្នុង១ឆ្នាំ!`
    };
  }

  /**
   * Get urgency message based on user engagement level
   * @param {string} type - Type of urgency message
   * @returns {string} Formatted urgency message
   */
  getUrgencyMessage(type = 'immediate') {
    return this.urgencyMessages[type] || this.urgencyMessages.immediate;
  }

  /**
   * Get price anchoring message to make $47 seem reasonable
   * @param {string} type - Type of anchoring
   * @returns {string} Formatted anchoring message
   */
  getPriceAnchoringMessage(type = 'daily') {
    return this.priceAnchoring[type] || this.priceAnchoring.daily;
  }

  /**
   * Get loss aversion message to create pain of missing out
   * @param {string} type - Type of loss aversion
   * @returns {string} Formatted loss aversion message
   */
  getLossAversionMessage(type = 'pain') {
    return this.lossAversion[type] || this.lossAversion.pain;
  }

  /**
   * Get complete conversion sequence for follow-up
   * @returns {Array} Array of timed messages
   */
  getConversionSequence() {
    return [
      {
        delay: 300000, // 5 minutes
        message: `💡 $47 = "ថ្លៃ"?

🤔 គិតមើលធៀបណា:

☕ កាហ្វេ 1 ពែង = $4-6 (រយៈពេល 30 នាទី)
🍜 ម្ហូប 1 ចាន = $5-8 (រយៈពេល 20 នាទី)
🎬 រោងកុន 1 ដង = $8-12 (រយៈពេល 2 ម៉ោង)

📊 Money Flow Reset™ = $47 (រយៈពេល 7 ថ្ងៃ = ផ្លាស់ប្តូរមួយជីវិត)

🧮 គណនាមើល:
• $47 ÷ 7 ថ្ងៃ = $6.70/ថ្ងៃ
• តម្លៃ = កាហ្វេ 1 ពែង
• លទ្ធផល = សន្សំបាន $400-1200/ខែ

💰 ក្នុង 1 ខែ អ្នកសន្សំបាន $400-1200
💰 ក្នុង 12 ខែ អ្នកសន្សំបាន $4,800-14,400

🔥 ROI = 10,000-30,000% ក្នុង 1 ឆ្នាំ!

🎯 តើអ្នកចង់ចំណាយ $47 ដើម្បីសន្សំបាន $4,800-14,400?

📱 ប្រើ /payment ដើម្បីទទួលបាន payment details`,
        type: 'price_anchoring'
      },
      {
        delay: 900000, // 15 minutes
        message: `🔥 បន្ទាន់! មានតែ 15 កន្លែង សម្រាប់ខែនេះ!

📈 អ្នកដែលបានចូលរួម Money Flow Reset™ បាននិយាយថា:

"ថ្ងៃទី 3 ខ្ញុំបានរកឃើញ subscriptions $25 ដែលខ្ញុំភ្លេច! 1 ខែ = $25 សន្សំបាន!" - សុវណ្ណា

"ក្រោយពី 7 ថ្ងៃ ខ្ញុំបានកាត់បន្ថយចំណាយ convenience 40%. សន្សំបាន $120 ក្នុងខែដំបូង!" - ដារ៉ា

"ឥឡូវនេះខ្ញុំដឹងចាស់ថាលុយខ្ញុំទៅណាទាំងអស់។ មានផែនការសន្សំច្បាស់លាស់!" - ណារ៉ា

💪 92% Success Rate - 92% នៃអ្នកចូលរួម បានសន្សំបាន $400+ ក្នុងខែដំបូង!

⏰ Early Bird តម្លៃ $47 នឹងអស់នៅ:
• ថ្ងៃនេះ: $47
• ថ្ងៃស្អែក: $57  
• សប្តាហ៍ក្រោយ: $67

🎯 សន្សំបាន $10-20 ដោយការចូលរួមថ្ងៃនេះ!

📱 ប្រើ /payment ដើម្បីចាប់ផ្តើមភ្លាម`,
        type: 'social_proof_urgency'
      },
      {
        delay: 1800000, // 30 minutes
        message: `😰 គិតមើលណា... រាល់ថ្ងៃដែលរង់ចាំ:

💸 $5-15 បាត់បង់ដោយ convenience spending
💸 $3-8 បាត់បង់ដោយ subscription ដែលភ្លេច
💸 $10-20 បាត់បង់ដោយ impulse buying
💸 $2-5 បាត់បង់ដោយ micro expenses

🔥 សរុប = $20-48 បាត់បង់ក្នុង 1 ថ្ងៃ ដោយមិនដឹងខ្លួន!

📊 ក្នុង 1 ខែ = $600-1,440 បាត់បង់ដោយមិនដឹងខ្លួន!

🤔 1 ឆ្នាំចុងក្រោយ អ្នកបានបាត់បង់:
• Convenience spending: $1,800-3,600
• Forgotten subscriptions: $300-600
• Impulse purchases: $1,200-2,400
• Micro expenses: $600-1,200

💰 សរុប: $3,900-7,800 បាត់បង់ក្នុង 1 ឆ្នាំ!

🎯 $47 ដើម្បីបញ្ឈប់ការបាត់បង់ $3,900-7,800?

⚡ ប្រសិនបើមិនធ្វើអ្វីឥឡូវនេះ = បន្តបាត់បង់ $20-48 រាល់ថ្ងៃ!

📱 ប្រើ /payment ដើម្បីបញ្ឈប់ការបាត់បង់លុយ`,
        type: 'loss_aversion'
      },
      {
        delay: 3600000, // 1 hour
        message: `🚨 ចុងក្រោយ: នៅសល់ 2 ម៉ោង សម្រាប់ Early Bird តម្លៃ $47!

⏰ ចាប់ពីស្អែកព្រឹក:
• តម្លៃនឹងកើនឡើងទៅ $67 (សន្សំបាន $20!)
• មានតែ 5 កន្លែង ចុងក្រោយ
• បន្ទាប់ពីនេះ waiting list 1 សប្តាហ៍

💡 ចំណុចសម្រេចចិត្ត នៅពេលនេះ:
• ចូលរួមថ្ងៃនេះ = $47 + រៀនចាប់ពីថ្ងៃស្អែក
• រង់ចាំថ្ងៃស្អែក = $67 + អាចមិនមាន កន្លែង

🎯 អ្នកនៅតែបន្តបាត់បង់ $20-48 រាល់ថ្ងៃ...

🔥 កុំធ្វើដូច 70% ដែល "រង់ចាំ" ហើយ regret ក្រោយ!

💪 ធ្វើដូច 30% ដែល "ចាត់វិធានការ" ហើយ ជោគជ័យ!

📱 ប្រើ /payment ដើម្បីទទួលបាន $47 តម្លៃ
⏰ នៅសល់ 2 ម៉ោង ប៉ុណ្ណោះ!

🎉 បន្ទាប់ពីទូទាត់ អ្នកនឹងទទួលបាន Day 1 ភ្លាម!`,
        type: 'final_urgency'
      }
    ];
  }

  /**
   * Schedule follow-up messages for user who viewed pricing
   * @param {Object} bot - Telegram bot instance
   * @param {number} chatId - Chat ID
   * @param {number} userId - User ID
   */
  scheduleFollowUpSequence(bot, chatId, userId) {
    const sequence = this.getConversionSequence();
    
    // Store the timeout IDs for potential cancellation
    const timeoutIds = [];
    
    sequence.forEach((step, index) => {
      const timeoutId = setTimeout(async () => {
        try {
          // Check if user is still unpaid before sending follow-up
          const User = require("../models/User");
          const user = await User.findOne({ telegramId: userId });
          
          if (!user || user.isPaid) {
            // User has already converted, cancel remaining messages
            console.log(`User ${userId} has converted, canceling remaining follow-ups`);
            return;
          }

          // Send the follow-up message
          await bot.sendMessage(chatId, step.message);
          
          // Track follow-up engagement
          console.log(`✅ Follow-up ${step.type} sent to user ${userId} at ${new Date().toISOString()}`);
          
          // Update user's last follow-up timestamp
          await User.findOneAndUpdate(
            { telegramId: userId },
            { 
              lastFollowUp: new Date(),
              $inc: { followUpCount: 1 }
            }
          );
          
        } catch (error) {
          console.error(`❌ Error sending follow-up ${step.type} to user ${userId}:`, error);
        }
      }, step.delay);
      
      timeoutIds.push(timeoutId);
    });
    
    // Store timeout IDs for potential cancellation
    this.activeSequences = this.activeSequences || {};
    this.activeSequences[userId] = timeoutIds;
    
    console.log(`🚀 Conversion sequence scheduled for user ${userId} - ${sequence.length} messages over ${sequence[sequence.length-1].delay/1000/60} minutes`);
  }

  /**
   * Cancel follow-up sequence for user (when they convert)
   * @param {number} userId - User ID
   */
  cancelFollowUpSequence(userId) {
    if (this.activeSequences && this.activeSequences[userId]) {
      this.activeSequences[userId].forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      delete this.activeSequences[userId];
      console.log(`🛑 Follow-up sequence canceled for user ${userId}`);
    }
  }

  /**
   * Get objection handler messages
   * @param {string} objection - Type of objection
   * @returns {string} Objection handler message
   */
  getObjectionHandler(objection) {
    const handlers = {
      'too_expensive': `💰 $47 = "ថ្លៃពេក"?

🤔 បើអ្នកចិត្តថា $47 ថ្លៃ... តើអ្នកមានអារម្មណ៍យ៉ាងណា ពេលដឹងថាអ្នកបាត់:

💸 $50-100 ក្នុង១ខែ ដោយមិនដឹងខ្លួន?
💸 $600-1200 ក្នុង១ឆ្នាំ ដោយមិនដឹងខ្លួន?

🎯 $47 ដើម្បីរកឃើញ money leaks = សន្សំបាន $200-500 ក្នុង១ខែ!

⚡ ROI = 400-1000% ក្នុង១ខែ!`,

      'no_time': `⏰ "មិនមានពេល"?

🤔 អ្នកមានពេល:
• មើល Facebook: ៣០នាទី/ថ្ងៃ?
• មើល TikTok: ៤៥នាទី/ថ្ងៃ?
• ញ៉ាំម្ហូប: ៦០នាទី/ថ្ងៃ?

💡 កម្មវិធីនេះ: ១៥-២០នាទី/ថ្ងៃ × ៧ថ្ងៃ = ២ម៉ោង ២០នាទី សរុប!

🎯 ២ម៉ោង ២០នាទី = ផ្លាស់ប្តូរជីវិតហិរញ្ញវត្ថុ!

⚡ តើមានតម្លៃអត់?`,

      'not_sure': `🤔 "មិនច្បាស់"?

💡 អ្វីដែលអ្នកច្បាស់:
✅ អ្នកកំពុងបាត់លុយរាល់ថ្ងៃ
✅ អ្នកចង់ដឹងថាលុយទៅណា
✅ អ្នកចង់សន្សំបានច្រើន
✅ អ្នកចង់មានប្រព័ន្ធគ្រប់គ្រងលុយ

🎯 បើអ្នកច្បាស់ចំពោះបញ្ហា... ចុះហេតុអ្វីមិនច្បាស់ចំពោះដំណោះស្រាយ?

⚡ មាន 100% money-back guarantee! មិនមានហានិភ័យ!`
    };

    return handlers[objection] || handlers['not_sure'];
  }
}

module.exports = ConversionOptimizer;