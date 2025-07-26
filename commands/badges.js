const User = require("../models/User");
const Progress = require("../models/Progress");
const progressBadges = require("../services/progress-badges");
const emojiReactions = require("../services/emoji-reactions");

/**
 * Handle /badges command to show user progress badges
 */
async function showBadges(msg, bot) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    // Get user data
    const user = await User.findOne({ telegramId: userId });
    if (!user) {
      await bot.sendMessage(chatId, "សូមចុច /start ដើម្បីចាប់ផ្តើម។");
      return;
    }

    // Get progress data
    const progress = await Progress.findOne({ userId: userId });
    if (!progress) {
      await bot.sendMessage(
        chatId,
        "រកមិនឃើញព័ត៌មានការរីកចម្រើន។ សូមចុច /start",
      );
      return;
    }

    // Send progress reaction first
    const completedDays = progress.daysCompleted || [];
    const progressPercentage = (completedDays.length / 7) * 100;
    const progressReaction =
      emojiReactions.progressUpdateReaction(progressPercentage);
    await bot.sendMessage(chatId, progressReaction);

    // Generate comprehensive progress display
    setTimeout(async () => {
      const progressDisplay =
        progressBadges.generateComprehensiveProgressDisplay(user, {
          currentDay: progress.currentDay,
          completedDays: completedDays,
          isPaid: user.isPaid,
        });

      await bot.sendMessage(chatId, progressDisplay);
    }, 500);

    // Update last active
    await User.findOneAndUpdate(
      { telegramId: userId },
      { lastActive: new Date() },
    );
  } catch (error) {
    console.error("Error in badges command:", error);
    await bot.sendMessage(chatId, "សូមអភ័យទោស! មានបញ្ហាបច្ចេកទេស។");
  }
}

/**
 * Handle /progress command (alias for badges)
 */
async function showProgress(msg, bot) {
  await showBadges(msg, bot);
}

/**
 * Handle /milestones command to show available milestones
 */
async function showMilestones(msg, bot) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    const user = await User.findOne({ telegramId: userId });
    if (!user) {
      await bot.sendMessage(chatId, "សូមចុច /start ដើម្បីចាប់ផ្តើម");
      return;
    }

    const progress = await Progress.findOne({ userId: userId });
    const completedDays = progress ? progress.daysCompleted || [] : [];

    let milestonesDisplay = "🏅 សមិទ្ធផលទាំងអស់:\n\n";

    // Show all milestones with status
    for (let day = 1; day <= 7; day++) {
      const milestone = progressBadges.milestones[`day${day}`];
      const isCompleted = completedDays.includes(day);

      if (isCompleted) {
        milestonesDisplay += `✅ ${milestone.emoji} ${milestone.name}\n   ${milestone.reward}\n\n`;
      } else {
        milestonesDisplay += `⚪ ${milestone.emoji} ${milestone.name}\n   ${milestone.reward}\n\n`;
      }
    }

    // Add special milestones
    milestonesDisplay += "🎯 សមិទ្ធផលពិសេស:\n";
    milestonesDisplay += `${completedDays.length >= 3 ? "✅" : "⚪"} 🔥 អ្នកកំពុងធ្វើល្អណាស់ Badge - បាន 3 ថ្ងៃ\n`;
    milestonesDisplay += `${completedDays.length >= 5 ? "✅" : "⚪"} 💪 អ្នកខ្លាំង Badge - បាន 5 ថ្ងៃ\n`;
    milestonesDisplay += `${completedDays.length === 7 ? "✅" : "⚪"} 🏆 Champion Badge - បញ្ចប់ពេញលេញ\n`;

    await bot.sendMessage(chatId, milestonesDisplay);

    // Update last active
    await User.findOneAndUpdate(
      { telegramId: userId },
      { lastActive: new Date() },
    );
  } catch (error) {
    console.error("Error in milestones command:", error);
    await bot.sendMessage(chatId, "សូមអភ័យទោស! មានបញ្ហាបច្ចេកទេស។");
  }
}

/**
 * Handle /streak command to show current streak
 */
async function showStreak(msg, bot) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    const user = await User.findOne({ telegramId: userId });
    if (!user) {
      await bot.sendMessage(chatId, "សូមចុច /start ដើម្បីចាប់ផ្តើម");
      return;
    }

    const progress = await Progress.findOne({ userId: userId });
    const completedDays = progress ? progress.daysCompleted || [] : [];

    const streak = progressBadges.calculateStreak(completedDays);
    let streakDisplay = "🔥 ការធ្វើបន្តបន្ទាប់របស់អ្នក:\n\n";

    if (streak > 0) {
      streakDisplay += progressBadges.generateStreakBadge(streak) + "\n\n";

      if (streak >= 7) {
        streakDisplay += "🏆 អបអរសាទរ! អ្នកបានបញ្ចប់ទាំងអស់!";
      } else if (streak >= 5) {
        streakDisplay += "💪 អស្ចារ្យ! អ្នកជិតបាន!";
      } else if (streak >= 3) {
        streakDisplay += "🔥 ល្អណាស់! បន្តទៅ!";
      } else {
        streakDisplay += "👏 ការចាប់ផ្តើមល្អ!";
      }
    } else {
      streakDisplay +=
        "🎯 មិនទាន់មានការធ្វើបន្តបន្ទាប់\nចាប់ផ្តើមរៀនដើម្បីបង្កើតការធ្វើបន្តបន្ទាប់!";
    }

    await bot.sendMessage(chatId, streakDisplay);

    // Update last active
    await User.findOneAndUpdate(
      { telegramId: userId },
      { lastActive: new Date() },
    );
  } catch (error) {
    console.error("Error in streak command:", error);
    await bot.sendMessage(chatId, "សូមអភ័យទោស! មានបញ្ហាបច្ចេកទេស។");
  }
}

module.exports = { showBadges, showProgress, showMilestones, showStreak };
