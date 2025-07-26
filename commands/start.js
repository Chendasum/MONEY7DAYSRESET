const User = require("../models/User");
const Progress = require("../models/Progress");
const TierManager = require("../services/tier-manager");

const tierManager = new TierManager();

// Message for unpaid users (coming from Facebook)
const unpaidStartMessage = `🎉 ស្វាគមន៍មកកាន់ 7-Day Money Flow Reset™!

ចង់ដឹងអត់ អ្នកកំពុងខាតលុយរាល់ថ្ងៃ...

💸 ជាមធ្យម បាត់ $300-800 ក្នុង១ខែ ដោយមិនដឹងខ្លួន!

រឿងទាំងនេះកើតឡើងអត់?
❌ ចំណាយហើយ... មិនដឹងថាទៅកន្លែងណា
❌ ចង់សន្សំ ប៉ុន្តែលុយអស់ជានិច្ច
❌ មិនដឹងថាលុយនឹងគ្រប់ ឬអត់គ្រប់
❌ ចង់បានជីវិតហិរញ្ញវត្ថុជាថ្មី

🔥 ៩២% អ្នកដែលបានចូលរួម បានសន្សំបាន ២០-៥០% ក្នុង ៧ថ្ងៃ!

⏰ តម្លៃពិសេស: តែ $47 (ធម្មតា $97) - មានតែ ២០ spots!

បើអ្នកចង់ផ្លាស់ប្តូរ...
បើអ្នកចង់រកឃើញលុយដែលលេចធ្លាយ...

🎯 ប្រើ /pricing ដើម្បីមើលកម្មវិធី (តម្លៃពិសេស!)
📞 ប្រើ /help ដើម្បីទទួលជំនួយ`;

// Message for paid users who need preparation
const paidPreparationMessage = `🎉 ស្វាគមន៍ត្រឡប់មកវិញ!

✨អ្នកបានចូលរួម 7-Day Money Flow Reset™ ហើយ!

🎯 ក្នុងរយៈពេលតែ ៧ថ្ងៃ (១៥-២០ នាទី/ថ្ងៃ) អ្នកនឹងទទួលបាន:

✅ ការយល់ដឹងច្បាស់អំពីលុយចូល-ចេញ
✅ ការរកឃើញ "Money Leaks" ដែលធ្វើឱ្យលុយលេចមិនដឹងខ្លួន
✅ ប្រព័ន្ធគ្រប់គ្រងលុយដែលពិតជាដំណើរការ
✅ ផែនទីហិរញ្ញវត្ថុច្បាស់លាស់សម្រាប់អនាគត
✅ ការយល់ដឹងពីចំណាយ "រស់រាន" vs "លូតលាស់"
✅ ផែនការហិរញ្ញវត្ថុដែលអនុវត្តបាន
✅ ទំនុកចិត្តពេញលេញក្នុងការគ្រប់គ្រងលុយ`;

// Message for paid users who are already prepared
const paidReadyMessage = `🎉 ស្វាគមន៍ត្រឡប់មកវិញ!

✨អ្នកបានចូលរួម 7-Day Money Flow Reset™ ហើយ!

🚀 ចាប់ផ្តើមដំណើរផ្លាស់ប្តូរជីវិតហិរញ្ញវត្ថុ:
📚 ប្រើ /day1 ដើម្បីចាប់ផ្តើមមេរៀនដំបូង
📊 ប្រើ /progress ដើម្បីមើលការរីកចម្រើន
🏆 ប្រើ /badges ដើម្បីមើលសមិទ្ធផល

📞 ត្រូវការជំនួយ? ប្រើ /help

🔥 ចាប់ផ្តើមភ្លាម → /day1 ឥឡូវនេះ!`;

async function handle(msg, bot) {
  const userId = msg.from.id;
  const chatId = msg.chat.id;

  try {
    // Create or update user
    const user = await User.findOneAndUpdate(
      { telegramId: userId },
      {
        telegramId: userId,
        username: msg.from.username,
        firstName: msg.from.first_name,
        lastName: msg.from.last_name,
        lastActive: new Date(),
      },
      { upsert: true, new: true },
    );

    // Initialize progress
    await Progress.findOneAndUpdate(
      { userId: userId },
      { userId: userId },
      { upsert: true, new: true },
    );

    // Check payment status and show appropriate message
    if (user.isPaid) {
      // Check if they need to do Day 0 preparation first
      const userProgress = await Progress.findOne({ userId: userId });

      if (!userProgress || !userProgress.readyForDay1) {
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
