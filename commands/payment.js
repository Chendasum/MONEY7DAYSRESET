const User = require("../models/User");
const celebrations = require("../services/celebrations");
const emojiReactions = require("../services/emoji-reactions");
const TierManager = require("../services/tier-manager");
const ConversionOptimizer = require("../services/conversion-optimizer");

async function pricing(msg, bot) {
  const User = require("../models/User");
  const tierManager = new TierManager();
  const conversionOptimizer = new ConversionOptimizer();

  // Check if user is paid
  const user = await User.findOne({ telegramId: msg.from.id });
  const isPaid = user ? user.isPaid : false;

  // Track pricing view for unpaid users
  if (!isPaid) {
    try {
      await User.findOneAndUpdate(
        { telegramId: msg.from.id },
        {
          lastPricingView: new Date(),
          lastActive: new Date(),
        },
        { upsert: true },
      );
    } catch (error) {
      console.log("Error updating user pricing view:", error.message);
    }
  }

  // Get pricing display based on payment status
  const pricingMessage = tierManager.getPricingDisplay(isPaid);

  await bot.sendMessage(msg.chat.id, pricingMessage, {
    parse_mode: "Markdown",
  });

  // If user is unpaid, schedule follow-up conversion sequence
  if (!isPaid) {
    try {
      console.log(
        `🎯 Starting conversion sequence for unpaid user ${msg.from.id}`,
      );
      conversionOptimizer.scheduleFollowUpSequence(
        bot,
        msg.chat.id,
        msg.from.id,
      );
    } catch (error) {
      console.log("Error starting conversion sequence:", error.message);
    }
  }
}

async function instructions(msg, bot) {
  const paymentMessage = `💳 ការណែនាំទូទាត់

🏦 វិធី 1: ABA Bank
• គណនី: 000 194 742
• ឈ្មោះ: SUM CHENDA
• ចំនួន: $47
• Reference: BOT${msg.from.id}

🏦 វិធី 2: ACLEDA Bank
• គណនី: 092 798 169
• ឈ្មោះ: SUM CHENDA
• ចំនួន: $47
• Reference: BOT${msg.from.id}

📱 វិធី 3: Wing Transfer 
• លេខ: 102 534 677
• ឈ្មោះ: SUM CHENDA
• ចំនួន: $47
• កំណត់ចំណាំ: BOT${msg.from.id}

⚡ បន្ទាប់ពីទូទាត់:
1. ថតរូបបញ្ជាក់ការទូទាត់
2. ផ្ញើមកដោយផ្ទាល់ក្នុងនេះ
3. ការអនុម័តក្នុងរយៈពេល 24 ម៉ោង

🔙 ការកែច្នៃ:
• /pricing - មើលតម្លៃវិញ
• /start - ត្រឡប់មេន្យូដើម
• /help - ជំនួយពេញលេញ
• /faq - សំណួរញឹកញាប់

❓ មានសំណួរ? អាចទាក់ទងមកក្រុមការងារយើងបាន!`;

  await bot.sendMessage(msg.chat.id, paymentMessage);
}

async function confirmPayment(
  bot,
  userId,
  transactionId,
  tier = "essential",
  amount = 47,
) {
  try {
    const tierManager = new TierManager();
    const conversionOptimizer = new ConversionOptimizer();
    const userTier = tierManager.getTierFromAmount(amount);

    // Update user payment status with tier information
    await User.findOneAndUpdate(
      { telegramId: userId },
      {
        isPaid: true,
        paymentDate: new Date(),
        transactionId: transactionId,
        tier: userTier,
        tierPrice: amount,
        isVip: userTier === "vip", // Keep backward compatibility
      },
    );

    // Cancel any active follow-up sequences for this user
    conversionOptimizer.cancelFollowUpSequence(userId);
    console.log(`✅ User ${userId} converted - follow-up sequence canceled`);

    // Send payment success emoji reaction first
    const paymentReaction = emojiReactions.paymentSuccessReaction();
    await bot.sendMessage(userId, paymentReaction);

    // Send tier-specific welcome message
    setTimeout(async () => {
      const welcomeMessage = tierManager.getTierWelcomeMessage(userTier);
      await bot.sendMessage(userId, welcomeMessage, { parse_mode: "Markdown" });
    }, 1000);

    // Create payment confirmation celebration
    setTimeout(async () => {
      const confirmMessage =
        celebrations.paymentConfirmedCelebration(`🚀 ជំហានបន្ទាប់:
1. អ្នកអាចចាប់ផ្តើមបានភ្លាម
2. ត្រៀមសៀវភៅ និងប៊ិច
3. ធ្វើតាមរបៀប 7 ថ្ងៃ

🎯 ចាប់ផ្តើម Day 1 ឥឡូវនេះ:
សរសេរ "READY FOR DAY 1" ឬ ចុច /day1

💡 Tips:
- ធ្វើ 1 ថ្ងៃ/មេរៀន សម្រាប់លទ្ធផលល្អ
- ចំណាយពេល 15-20 នាទី/ថ្ងៃ
- អនុវត្តតាមការណែនាំ

អរគុណដែលជឿទុកចិត្ត! 💪`);

      await bot.sendMessage(userId, confirmMessage);
    }, 500);

    // Send follow-up celebration after 2 seconds
    setTimeout(async () => {
      const motivationMessage = celebrations.quickCelebration(
        "អ្នកបានចាប់ផ្តើមការដំណើរផ្លាស់ប្តូរជីវិត!",
      );
      await bot.sendMessage(userId, motivationMessage);
    }, 2000);

    // Send to admin
    const adminId = process.env.ADMIN_CHAT_ID;
    if (adminId) {
      await bot.sendMessage(
        adminId,
        `💰 ការទូទាត់ថ្មី!\n\nUser: ${userId}\nTransaction: ${transactionId}\nDate: ${new Date().toISOString()}`,
      );
    }
  } catch (error) {
    console.error("Error confirming payment:", error);
  }
}

module.exports = { pricing, instructions, confirmPayment };
