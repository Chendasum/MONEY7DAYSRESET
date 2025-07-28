const User = require("../models/User");
const Progress = require("../models/Progress");
const TierManager = require("../services/tier-manager");

const tierManager = new TierManager();

// Message for unpaid users (coming from Facebook)
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
👤 "ការគ្រប់គ្រងលុយរបស់ខ្ញុំកាន់តែប្រសើរឡើងៗ!" - សុភី, సៀមរាប

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

// Enhanced message for paid users who need preparation (Day 0) - Cleaned and formatted
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

// Enhanced message for paid users who are already prepared - Cleaned and formatted
const paidReadyMessage = `🎉 ស្វាគមន៍ត្រឡប់មកវិញ Money Flow Graduate!

✨ អ្នកបានចូលរួម 7-Day Money Flow Reset™ ហើយ!

🚀 ចាប់ផ្តើមដំណើរផ្លាស់ប្តូរជីវិតហិរញ្ញវត្ថុ:

📚 ការចូលប្រើរហ័ស:
• /day1 - ចាប់ផ្តើមមេរៀនដំបូង (រកលុយភ្លាមៗ!)
• /day2 - ការកំណត់អត្តសញ្ញាណការលេចធ្លាយលុយកម្រិតខ្ពស់
• /day3 - ការពិនិត្យសុខភាពហិរញ្ញវត្ថុផ្ទាល់ខ្លួន
• /progress - មើលការរីកចម្រើនរបស់អ្នក

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

🏆 ការតាមដានការរីកចម្រើន:
- 🎖️ សមិទ្ធផល → /badges
- 📈 ការរីកចម្រើន → /progress
- 🏁 សមិទ្ធផលសំខាន់ → /milestones
- 🔥 ការធ្វើបន្តបន្ទាប់ → /streak

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

🔥 ចាប់ផ្តើមឥឡូវនេះ: /day1 ឥឡូវនេះ!

💎 នៅថ្ងៃទី៧ អ្នកនឹងមានប្រព័ន្ធគ្រប់គ្រងលុយពេញលេញ!`;

async function handle(msg, bot) {
  const userId = msg.from.id;
  const chatId = msg.chat.id;

  try {
    // Create or update user with corrected field mapping
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

    // Initialize progress with corrected field mapping
    await Progress.findOneAndUpdate(
      { user_id: userId }, // Use new field name
      { user_id: userId }, // Use new field name
      { upsert: true, new: true },
    );

    // Check payment status and show appropriate message
    if (user && user.is_paid) { // Use new field name
      // Check if they need to do Day 0 preparation first
      const userProgress = await Progress.findOne({ user_id: userId }); // Use new field name

      if (!userProgress || !userProgress.ready_for_day_1) { // Use new field name
        // Show tier-specific welcome message if available
        const tierWelcome = tierManager.getTierWelcomeMessage(user.tier);
        await bot.sendMessage(chatId, tierWelcome);

        // Show preparation message for unprepared users
        const preparationHomework = `${paidPreparationMessage}

🎯 ជំហានសំខាន់មុនចាប់ផ្តើម:

មុនពេលចាប់ផ្តើមមេរៀនថ្ងៃទី១ អ្នកត្រូវត្រៀមចិត្តជាមុនសិន:

💭 ពិចារណាសំណួរទាំងនេះ:
• តើអ្នកត្រៀមរួចសម្រាប់ការផ្លាស់ប្តូរឬនៅ?
• តើអ្នកមានពេល ១៥-២០ នាទីរាល់ថ្ងៃឬទេ?
• តើអ្នកពិតជាចង់ដោះស្រាយបញ្ហាលុយឬទេ?

🚀 ត្រៀមរួចហើយ? សរសេរ "READY FOR DAY 1" ដើម្បីចាប់ផ្តើម!`;

        await bot.sendMessage(chatId, preparationHomework);
      } else {
        // They're already prepared, show quick access message
        const tierWelcome = tierManager.getTierWelcomeMessage(user.tier);
        await bot.sendMessage(chatId, tierWelcome);
        await bot.sendMessage(chatId, paidReadyMessage);
      }
    } else {
      // Show unpaid user message
      await bot.sendMessage(chatId, unpaidStartMessage);
    }
  } catch (error) {
    console.error("Error in start command:", error);
    await bot.sendMessage(
      chatId,
      "សូមអភ័យទោស! មានបញ្ហាបច្ចេកទេស។ សូមព្យាយាមម្តងទៀត។",
    );
  }
}

module.exports = { handle };
