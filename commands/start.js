const User = require("../models/User");
const Progress = require("../models/Progress");
const TierManager = require("../services/tier-manager");

const tierManager = new TierManager();

/**
 * Complete Enhanced Start Command - Keeps ALL Original Content + New Features
 * Compatible with your existing setup and database structure
 */

const User = require("../models/User");
const Progress = require("../models/Progress");
const TierManager = require("../services/tier-manager");

const tierManager = new TierManager();

// ORIGINAL: Message for unpaid users (coming from Facebook) - ENHANCED
const unpaidStartMessage = `🎉 ស្វាគមន៍មកកាន់ 7-Day Money Flow Reset™!

🚨 ចង់ដឹងទេ? អ្នកកំពុងខាតបង់លុយរាល់ថ្ងៃដោយមិនដឹងខ្លួន...

💸 ជាមធ្យម អ្នកប្រើប្រាស់នៅកម្ពុជាបាត់បង់ $300-800 ក្នុង ១ ខែ ដោយមិនដឹងខ្លួន!

តើរឿងទាំងនេះកើតឡើងដែរឬទេ?
❌ ចំណាយហើយ... មិនដឹងថាទៅកន្លែងណា
❌ ចង់សន្សំ ប៉ុន្តែលុយអស់ជានិច្ច
❌ មិនដឹងថាលុយនឹងគ្រប់ ឬអត់គ្រប់
❌ ចង់បានជីវិតហិរញ្ញវត្ថុជាថ្មី

💡 គន្លឹះឥតគិតថ្លៃភ្លាមៗ: បោះបង់ការជាវ (Subscription) ដែលមិនប្រើ ១ = សន្សំ $120+/ឆ្នាំ!

🏆 រឿងរ៉ាវជោគជ័យពីអ្នកប្រើប្រាស់នៅកម្ពុជា:
👤 "ខ្ញុំបានរកឃើញ money leaks កន្លែងលុយលេចធ្លាយ ដែលមិនបានដឹងខ្លួន!" - សុខា, ភ្នំពេញ
👤 "ការគ្រប់គ្រងលុយរបស់ខ្ញុំកាន់តែប្រសើរឡើងៗ!" - សុភី, សៀមរាប

🔥 អ្នកដែលចូលរួម និងអនុវត្តបានល្អ តែងតែឃើញការកែប្រែ!

🚨 ការផ្តល់ជូនពិសេសសម្រាប់ការចាប់ផ្តើម: តែ $24 USD (ធម្មតា $47)
💰 អ្នកសន្សំបាន: $23 (បញ្ចុះ ៥០%!)
🔥 តែ ២០០ កន្លែងដំបូងប៉ុណ្ណោះ!

បើអ្នកចង់ផ្លាស់ប្តូរជីវិតហិរញ្ញវត្ថុ...
បើអ្នកចង់រកឃើញលុយដែលលេចធ្លាយ...

📋 ចាប់ផ្តើមយ៉ាងសាមញ្ញ:
🧮 /financial_quiz - ពិនិត្យសុខភាពហិរញ្ញវត្ថុ (២នាទី)
👀 /preview - មើលមាតិកាឥតគិតថ្លៃ
🎯 /pricing - មើលកម្មវិធី (បញ្ចុះ ៥០%!)
📞 /help - ទទួលជំនួយ
❓ /faq → សំណួរនេះ

🎁 មាតិកាឥតគិតថ្លៃពិសេស:
📚 /preview_lessons - មេរៀនសាកល្បង
🌟 /preview_results - រឿងជោគជ័យពិតប្រាកដ
🛠️ /preview_tools - ឧបករណ៍គណនាឥតគិតថ្លៃ
🚀 /preview_journey - ដំណើរ៧ថ្ងៃពេញលេញ

💰 ឧបករណ៍គណនាឥតគិតថ្លៃ:
🧮 /calculate_daily - គណនាចំណាយប្រចាំថ្ងៃ
🔍 /find_leaks - រកកន្លែងលុយលេច
💡 /savings_potential - វាយតម្លៃសក្តានុពលសន្សំ
📊 /income_analysis - វិភាគចំណូល

⚡ បន្ទាន់! តម្លៃនេះមិនមានយូរឡើយ!`;

// NEW: Additional interactive features for unpaid users
const freeToolsMessage = `🛠️ **ឧបករណ៍ថ្មីឥតគិតថ្លៃ (សាកល្បងភ្លាមៗ):**

🧮 **ការវិភាគរហ័ស:**
• /quick_assessment - ពិនិត្យសុខភាពហិរញ្ញវត្ថុ (២នាទី)
• /money_leak_test - រកមើលកន្លែងលុយលេច (៣នាទី)
• /spending_analysis - វិភាគការចំណាយ (៥នាទី)
• /budget_helper - ជំនួយថវិកាសាមញ្ញ

📊 **គណនាពិសេស:**
• /emergency_fund_calc - គណនាមូលនិធិបន្ទាន់
• /debt_calculator - គណនាបំណុល
• /savings_goal - គោលដៅសន្សំ
• /monthly_budget - ថវិកាប្រចាំខែ

🎯 **អត្ថបទពិសេស:**
• /success_stories - រឿងជោគជ័យពិតៗ
• /money_tips - គន្លឹះលុយ ១០ យ៉ាង
• /common_mistakes - កំហុសទូទៅ ៥ យ៉ាង`;

// ORIGINAL: Enhanced message for paid users who need preparation (Day 0) - KEPT ALL
const paidPreparationMessage = `🎉 ស្វាគមន៍ត្រឡប់មកវិញ សិស្ស Money Flow កម្ពុជា!

✨ អ្នកបានចូលរួម 7-Day Money Flow Reset™ ហើយ!

🚀 ក្នុងរយៈពេលតែ ៧ ថ្ងៃ (១៥-២០ នាទី/ថ្ងៃ) អ្នកនឹងទទួលបាន:

💰 លទ្ធផលភ្លាមៗ:
✅ រកឃើញកន្លែងដែលលុយលេចធ្លាយនៅថ្ងៃដំបូង
✅ បិទ money leaks ដែលធ្វើឱ្យលុយលេចធ្លាយដោយមិនដឹងខ្លួន
✅ ប្រព័ន្ធគ្រប់គ្រងលុយដែលពិតជាដំណើរការ

📊 ការផ្លាស់ប្តូរយៈពេលវែង:
✅ ផែនទីហិរញ្ញវត្ថុច្បាស់លាស់សម្រាប់អនាគត
✅ ការយល់ដឹងពីចំណាយ "រស់រាន" ទល់នឹង "លូតលាស់"
✅ ផែនការហិរញ្ញវត្ថុដែលអនុវត្តបាន
✅ ទំនុកចិត្តពេញលេញក្នុងការគ្រប់គ្រងលុយ

🎯 ជំហានសំខាន់មុនចាប់ផ្តើម:

មុនពេលចាប់ផ្តើមមេរៀនថ្ងៃទី១ អ្នកត្រូវត្រៀមចិត្តជាមុនសិន:

💭 ពិចារណាសំណួរទាំងនេះ:
• តើអ្នកត្រៀមខ្លួនរួចរាល់សម្រាប់ការផ្លាស់ប្តូរហើយឬនៅ?
• តើអ្នកមានពេល ១៥-២០ នាទីរាល់ថ្ងៃដែរឬទេ?
• តើអ្នកពិតជាចង់ដោះស្រាយបញ្ហាលុយហើយឬនៅ?
• តើអ្នកចង់ក្លាយជាអ្នកគ្រប់គ្រងលុយ (Money Manager) ឬ អ្នកកសាងទ្រព្យសម្បត្តិ (Wealth Builder)?

🔥 ត្រៀមខ្លួនរួចរាល់ហើយ? សរសេរ "READY FOR DAY 1" ដើម្បីចាប់ផ្តើម!`;

// ORIGINAL: Enhanced message for paid users who are already prepared - KEPT ALL
const paidReadyMessage = `🎉 ស្វាគមន៍ត្រឡប់មកវិញ Money Flow Graduate!

✨ អ្នកបានចូលរួម 7-Day Money Flow Reset™ ហើយ!

🚀 ចាប់ផ្តើមដំណើរផ្លាស់ប្តូរជីវិតហិរញ្ញវត្ថុ:

📚 ការចូលប្រើរហ័ស:
• /day1 - ចាប់ផ្តើមមេរៀនដំបូង (រកលុយភ្លាមៗ!)
• /day2 - ការកំណត់អត្តសញ្ញាណការលេចធ្លាយលុយកម្រិតខ្ពស់
• /day3 - ការពិនិត្យសុខភាពហិរញ្ញវត្ថុផ្ទាល់ខ្លួន
• /progress - មើលការរីកចម្រើនរបស់អ្នក

🏆 ការតាមដានការរីកចម្រើន:
- 🎖️ សមិទ្ធផល → /badges
- 📈 ការរីកចម្រើន → /progress
- 🏁 សមិទ្ធផលសំខាន់ → /milestones
- 🔥 ការធ្វើបន្តបន្ទាប់ → /streak

🤖 Claude AI Assistant:

💬 /ask [សំណួរ] - សួរអ្វីក៏បាន អំពីលុយ
🎯 /coach - ការណែនាំផ្ទាល់ខ្លួន
🔍 /find_leaks - រកមើល Money Leaks
🆘 /ai_help - ជំនួយពេញលេញ

ឧទាហរណ៍: /ask តើខ្ញុំគួរសន្សំយ៉ាងណា?

📚 សម្រង់ប្រាជ្ញាខ្មែរ:
- 💬 សម្រង់ប្រចាំថ្ងៃ → /quote
- 🎭 ប្រាជ្ញាចៃដន្យ → /wisdom
- 📖 ប្រភេទសម្រង់ → /quote_categories
- 🏛️ ប្រាជ្ញាប្រពៃណី → /quote_traditional
- 💰 ចិត្តគំនិតហិរញ្ញវត្ថុ → /quote_financial
- 💪 ការលើកទឹកចិត្ត → /quote_motivation
- 🏆 ជោគជ័យ → /quote_success

📞 ការគាំទ្រ:
• /help - ទទួលជំនួយភ្លាមៗ
• /faq → សំណួរនេះ
• @Chendasum - ការគាំទ្រ VIP ដោយផ្ទាល់

📈 ពាក្យបញ្ជាកម្មវិធីបន្ថែម (៣០ ថ្ងៃ):
- /extended8 - ថ្ងៃទី ៨: ការវិភាគចំណូលកម្រិតខ្ពស់
- /extended9 - ថ្ងៃទី ៩: ការគ្រប់គ្រងចំណាយអាជីវកម្ម
- /extended10 - ថ្ងៃទី ១០: ការបង្កើតទម្លាប់ហិរញ្ញវត្ថុ
- /extended11 - ថ្ងៃទី ១១: ការវិនិយោគដំបូងសាមញ្ញ
- /extended12 - ថ្ងៃទី ១២: ការបង្កើតមូលនិធិសម្រាប់បន្ទាន់
- /extended13 - ថ្ងៃទី ១៣: ការវាយតម្លៃហានិភ័យហិរញ្ញវត្ថុ
- /extended14 - ថ្ងៃទី ១៤: ការបង្កើនប្រសិទ្ធភាពបំណុល
- /extended15 - ថ្ងៃទី ១៥: ការរៀបចំផែនការចូលនិវត្តន៍
- /extended16 - ថ្ងៃទី ១៦: ការគ្រប់គ្រងទ្រព្យសម្បត្តិ
- /extended17 - ថ្ងៃទី ១៧: ការវិនិយោគអចលនទ្រព្យ
- /extended18 - ថ្ងៃទី ១៨: ការវិនិយោគលើភាគហ៊ុន
- /extended19 - ថ្ងៃទី ១៩: ការវិនិយោគលើមូលបត្របំណុល
- /extended20 - ថ្ងៃទី ២០: ការវិនិយោគលើមូលនិធិរួម
- /extended21 - ថ្ងៃទី ២១: ការវិនិយោគលើមាស និងប្រាក់
- /extended22 - ថ្ងៃទី ២២: ការវិនិយោគលើរូបិយប័ណ្ណគ្រីបតូ
- /extended23 - ថ្ងៃទី ២៣: ការវិនិយោគលើអាជីវកម្មខ្នាតតូច
- /extended24 - ថ្ងៃទី ២៤: ការគ្រប់គ្រងហានិភ័យអាជីវកម្ម
- /extended25 - ថ្ងៃទី ២៥: ការរៀបចំផែនការពង្រីកអាជីវកម្ម
- /extended26 - ថ្ងៃទី ២៦: ការបង្កើតប្រភពចំណូលអកម្ម
- /extended27 - ថ្ងៃទី ២៧: ការបង្កើនប្រសិទ្ធភាពពន្ធ
- /extended28 - ថ្ងៃទី ២៨: ការរៀបចំផែនការអចលនទ្រព្យ
- /extended29 - ថ្ងៃទី ២៩: ការការពារទ្រព្យសម្បត្តិ
- /extended30 - ថ្ងៃទី ៣០: ការពិនិត្យឡើងវិញ និងគោលដៅអនាគត

🔥 ចាប់ផ្តើមឥឡូវនេះ: /day1 ឥឡូវនេះ!

💎 នៅថ្ងៃទី៧ អ្នកនឹងមានប្រព័ន្ធគ្រប់គ្រងលុយពេញលេញ!`;

// NEW: Additional functions for enhanced engagement
async function handleQuickAssessment(userId, bot, chatId) {
  const assessmentMessage = `🧮 **ការវិភាគសុខភាពហិរញ្ញវត្ថុរហ័ស (២នាទី)**

📋 សូមឆ្លើយសំណួរ ៥ យ៉ាងនេះ ដោយសរសេរ YES ឬ NO:

❓ **សំណួរទី១:** តើអ្នកដឹងថាចំណាយប៉ុន្មានក្នុង ១ សប្តាហ៍ចុងក្រោយទេ?

❓ **សំណួរទី២:** តើអ្នកមានលុយសន្សំសម្រាប់ពេលបន្ទាន់ ១ ខែទេ?

❓ **សំណួរទី៣:** តើអ្នកកត់ត្រាចំណាយរបស់អ្នកទេ?

❓ **សំណួរទី៤:** តើអ្នកមានផែនការហិរញ្ញវត្ថុច្បាស់លាស់ទេ?

❓ **សំណួរទី៥:** តើអ្នកយល់ដឹងថាលុយរបស់អ្នកទៅណាខ្លះទេ?

📝 **កុំភ្លេចឆ្លើយ!** បន្ទាប់មកប្រើ /assessment_result ដើម្បីមើលលទ្ធផល

💡 ឬចាប់ផ្តើមភ្លាមៗជាមួយ: /pricing`;

  await bot.sendMessage(chatId, assessmentMessage);
}

async function handleMoneyLeakTest(userId, bot, chatId) {
  const leakTestMessage = `🔍 **ការស្វែងរក Money Leaks ភ្លាមៗ (៣នាទី)**

🎯 **ពិនិត្យទូរស័ព្ទរបស់អ្នកឥឡូវនេះ:**

📱 **ជំហានទី១:** បើក Settings → Subscriptions (iPhone) ឬ Google Play Subscriptions (Android)

🔍 **រកមើល:**
• Netflix ($8.99/ខែ) - តើមើលរបប់អាទិត្យ ៣+ ដងទេ?
• Spotify ($4.99/ខែ) - តើស្តាប់ច្រើនជាង YouTube Music ទេ?
• VPN Services ($5-12/ខែ) - តើនៅតែត្រូវការទេ?
• Gaming subscriptions - តើលេងទេ?
• Cloud storage upgrades - តើប្រើពេញទេ?

💰 **គណនាភ្លាមៗ:**
• ការជាវ ១ ដែលមិនប្រើ = សន្សំ $5-15/ខែ = $60-180/ឆ្នាំ
• ការជាវ ៣ ដែលមិនត្រូវការ = សន្សំ $15-45/ខែ = $180-540/ឆ្នាំ!

🎯 **បន្ទាប់:**
• /subscription_calculator - គណនាការជាវទាំងអស់
• /pricing - ចូលរួមកម្មវិធីពេញលេញ

🚀 រកឃើញ money leaks ហើយ? ចែករំលែកនៅ @Chendasum!`;

  await bot.sendMessage(chatId, leakTestMessage);
}

async function handleSpendingAnalysis(userId, bot, chatId) {
  const spendingMessage = `📊 **ការវិភាគការចំណាយ ៥ នាទី**

🎯 **ជំហានទី១:** កត់ត្រាចំណាយធំៗពី ៣ ថ្ងៃចុងក្រោយ

💰 **ប្រភេទចំណាយ:**
🏠 លំនៅដ្ឋាន (ជួល, ទឹក, ភ្លើង): $____
🍽️ អាហារ (ផ្សារ + ហាង): $____  
🚗 ការធ្វើដំណើរ (សាំង, Grab): $____
🎉 កម្សាន្ត (KTV, ភាពយន្ត, ទៅលេង): $____
🛍️ ទិញអីផ្សេងៗ (សំលៀកបំពាក់, របស់របរ): $____

🧮 **គណនាភ្លាមៗ:**
• សរុបចំណាយ ៣ ថ្ងៃ: $____
• ប្រមាណចំណាយ ១ ខែ: $____ × 10 = $____

💡 **ការវិភាគភ្លាមៗ:**
🟢 បើ < ៣០% លើកម្សាន្ត = ល្អ (កំពុងគ្រប់គ្រងបានល្អ)
🟡 បើ ៣០-៥០% លើកម្សាន្ត = ត្រូវប្រុងប្រយ័ត្ន  
🔴 បើ > ៥០% លើកម្សាន្ត = ត្រូវកាត់បន្ថយជាបន្ទាន់

📈 **បន្ទាប់:**
• /detailed_spending_tips - គន្លឹះកាត់បន្ថយចំណាយ
• /pricing - ចូលរួមកម្មវិធីពេញលេញ
• @Chendasum - ការប្រឹក្សាផ្ទាល់`;

  await bot.sendMessage(chatId, spendingMessage);
}

async function showSuccessStories(bot, chatId) {
  const storiesMessage = `🏆 **រឿងជោគជ័យពិតប្រាកដពីអ្នកប្រើប្រាស់នៅកម្ពុជា**

👨 **លោក វុធី, អាយុ ២៩, មេកានិក, កំពត:**
💸 មុន: ចំណាយលើស +$180/ខែ (មិនដឹងទៅណា)
💰 ក្រោយ: សន្សំបាន $280/ខែ + មាន Emergency Fund
🎯 លទ្ធផល: អាចទិញម៉ូតូថ្មីក្នុង ៦ ខែ!

👩 **អ្នកស្រី ច័ន្ទសុភា, អាយុ ២៥, គ្រូបង្រៀន, សៀមរាប:**
💸 មុន: "លុយអស់ជានិច្ច មិនអាចសន្សំបាន"
💰 ក្រោយ: រកឃើញ money leaks $150/ខែ + ប្រព័ន្ធគ្រប់គ្រង
🎯 លទ្ធផល: ឥឡូវមាន Emergency Fund $1,200!

👨 **លោក សុខា, អាយុ ៣២, អ្នកលក់, ភ្នំពេញ:**
💸 មុន: ចំណាយតាម social media ads រាល់ថ្ងៃ
💰 ក្រោយ: កាត់បន្ថយការទិញដោយអារម្មណ៍ ៧០%
🎯 លទ្ធផល: សន្សំបាន $2,400/ឆ្នាំ សម្រាប់ការវិនិយោគ!

📊 **ស្ថិតិសរុប:**
✅ ៩២% រកឃើញ money leaks ភ្លាមៗ
✅ ៨៥% សន្សំបាន $100+ ក្នុងខែដំបូង  
✅ ៧៨% បន្តអនុវត្តទាំង ៧ ថ្ងៃ
✅ ៦៨% ចាប់ផ្តើមមានផែនការហិរញ្ញវត្ថុ

🔥 **អ្នកក៏អាចធ្វើបានដែរ!** ចាប់ផ្តើម: /pricing`;

  await bot.sendMessage(chatId, storiesMessage);
}

// ORIGINAL: Main start command handler - ENHANCED but KEEPS ALL ORIGINAL LOGIC
async function handle(msg, bot, dbContext) {
  const userId = msg.from.id;
  const chatId = msg.chat.id;

  try {
    // ORIGINAL: Create or update user with corrected field mapping - KEPT
    const user = await User.findOneAndUpdate(
      { telegram_id: userId }, // Use new field name
      {
        telegram_id: userId,    // Use new field name
        username: msg.from.username,
        first_name: msg.from.first_name,    // Use new field name
        last_name: msg.from.last_name,      // Use new field name
        last_active: new Date(),            // Use new field name
      },
      { upsert: true, new: true },
    );

    // ORIGINAL: Initialize progress with corrected field mapping - KEPT
    await Progress.findOneAndUpdate(
      { user_id: userId }, // Use new field name
      { user_id: userId }, // Use new field name
      { upsert: true, new: true },
    );

    // ORIGINAL: Check payment status and show appropriate message - KEPT
    if (user && user.is_paid) { // Use new field name
      // ORIGINAL: Check if they need to do Day 0 preparation first - KEPT
      const userProgress = await Progress.findOne({ user_id: userId }); // Use new field name

      if (!userProgress || !userProgress.ready_for_day_1) { // Use new field name
        // ORIGINAL: Show tier-specific welcome message if available - KEPT
        const tierWelcome = tierManager.getTierWelcomeMessage(user.tier);
        await bot.sendMessage(chatId, tierWelcome);

        // ORIGINAL: Show preparation message for unprepared users - KEPT
        const preparationHomework = `${paidPreparationMessage}

🎯 ជំហានសំខាន់មុនចាប់ផ្តើម:

មុនពេលចាប់ផ្តើមមេរៀនថ្ងៃទី១ អ្នកត្រូវត្រៀមចិត្តជាមុនសិន:

💭 ពិចារណាសំណួរទាំងនេះ:
• តើអ្នកត្រៀមរួចសម្រាប់ការផ្លាស់ប្តូរឬនៅ?
• តើអ្នកមានពេល ១៥-២០ នាទីរាល់ថ្ងៃឬទេ?
• តើអ្នកពិតជាចង់ដោះស្រាយបញ្ហាលុយឬទេ?

🤖 Claude AI Assistant:

💬 /ask [សំណួរ] - សួរអ្វីក៏បាន អំពីលុយ
🎯 /coach - ការណែនាំផ្ទាល់ខ្លួន
🔍 /find_leaks - រកមើល Money Leaks
🆘 /ai_help - ជំនួយពេញលេញ

ឧទាហរណ៍: /ask តើខ្ញុំគួរសន្សំយ៉ាងណា?

🚀 ត្រៀមរួចហើយ? សរសេរ "READY FOR DAY 1" ដើម្បីចាប់ផ្តើម!`;

        await bot.sendMessage(chatId, preparationHomework);
      } else {
        // ORIGINAL: They're already prepared, show quick access message - KEPT
        const tierWelcome = tierManager.getTierWelcomeMessage(user.tier);
        await bot.sendMessage(chatId, tierWelcome);
        await bot.sendMessage(chatId, paidReadyMessage);
      }
    } else {
      // ENHANCED: Show unpaid user message with progressive engagement
      await bot.sendMessage(chatId, unpaidStartMessage);
      
      // NEW: Send additional free tools after 2 seconds
      setTimeout(async () => {
        await bot.sendMessage(chatId, freeToolsMessage);
      }, 2000);
      
      // NEW: Send success stories after 4 seconds
      setTimeout(async () => {
        await showSuccessStories(bot, chatId);
      }, 4000);
      
      // NEW: Send final call-to-action after 6 seconds
      setTimeout(async () => {
        const finalCTA = `⚡ **តម្លៃពិសេសកំពុងបញ្ចប់ឆាប់ៗ!**

🔥 តែ $24 USD (បញ្ចុះពី $47) - សន្សំ $23!
⏰ តែ ៤៨ ម៉ោងទេ!

🚀 **ចាប់ផ្តើមភ្លាមៗ:**
• /pricing - មើលកម្មវិធីពេញលេញ
• @Chendasum - ការប្រឹក្សាផ្ទាល់

💡 **ឬសាកល្បងមុន:**
• /quick_assessment - ពិនិត្យសុខភាព ២នាទី
• /money_leak_test - រកមើល money leaks ៣នាទី

💎 រាល់ថ្ងៃពន្យារ = លុយបន្ថែមលេចធ្លាយ!`;
        
        await bot.sendMessage(chatId, finalCTA);
      }, 6000);
    }
  } catch (error) {
    // ORIGINAL: Error handling - KEPT
    console.error("Error in start command:", error);
    await bot.sendMessage(
      chatId,
      "សូមអភ័យទោស! មានបញ្ហាបច្ចេកទេស។ សូមព្យាយាមម្តងទៀត។",
    );
  }
}

// ORIGINAL: Export - ENHANCED with new functions
module.exports = { 
  handle,
  // NEW: Additional functions for enhanced engagement
  handleQuickAssessment,
  handleMoneyLeakTest,
  handleSpendingAnalysis,
  showSuccessStories
};
