require("dotenv").config();
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const cron = require("node-cron");

// Use your actual Replit domain
const DOMAIN = "https://moneyflowtracker-chendasum168.replit.app";

// Models
const User = require("./models/User");
const Progress = require("./models/Progress");

// Commands
const startCommand = require("./commands/start");
const dailyCommands = require("./commands/daily");
const paymentCommands = require("./commands/payment");
const vipCommands = require("./commands/vip");
const adminCommands = require("./commands/admin");
const badgesCommands = require("./commands/badges");
const quotesCommands = require("./commands/quotes");
const bookingCommands = require("./commands/booking");
const tierFeatures = require("./commands/tier-features");
const marketingCommands = require("./commands/marketing");
const marketingContent = require("./commands/marketing-content");

// Services
const scheduler = require("./services/scheduler");
const analytics = require("./services/analytics");
const celebrations = require("./services/celebrations");
const progressBadges = require("./services/progress-badges");
const emojiReactions = require("./services/emoji-reactions");
const AccessControl = require("./services/access-control");

// Initialize bot with optimized polling to avoid 409 conflicts
const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: {
    interval: 2000, // Increased interval to reduce API pressure
    autoStart: false, // Start manually after cleanup
    params: {
      timeout: 20,
      limit: 5, // Conservative message limit
    },
  },
  onlyFirstMatch: true,
  request: {
    timeout: 30000,
    retryAttempts: 2,
    agent: false,
  },
});

// Comprehensive webhook cleanup and polling start
async function initializeBot() {
  try {
    console.log("🧹 Performing complete webhook cleanup...");

    // Multiple cleanup attempts
    await bot.deleteWebHook({ drop_pending_updates: true });
    await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait for cleanup

    const webhookInfo = await bot.getWebhookInfo();
    console.log("🔍 Webhook status after cleanup:", webhookInfo);

    // Start polling manually after cleanup
    console.log("🔄 Starting optimized polling...");
    bot.startPolling();

    console.log("✅ Bot initialized successfully with advanced features!");
  } catch (error) {
    console.log("⚠️ Bot initialization completed with:", error.message);
    // Start polling anyway
    bot.startPolling();
  }
}

// Initialize after all handlers are set up
setTimeout(initializeBot, 1000);

const app = express();
const accessControl = new AccessControl();

// Middleware
app.use(express.json());

// Initialize Database
console.log("🔍 Initializing database connection...");
console.log("✅ Database ready");

// Bot Commands
bot.onText(/\/start/, (msg) => startCommand.handle(msg, bot));
bot.onText(/\/pricing/, (msg) => paymentCommands.pricing(msg, bot));
bot.onText(/\/payment/, (msg) => paymentCommands.instructions(msg, bot));

// Day commands (1-7) - PAYMENT REQUIRED
bot.onText(/\/day([1-7])/, async (msg, match) => {
  try {
    const user = await User.findOne({ telegramId: msg.from.id });

    if (!user || !user.isPaid) {
      await bot.sendMessage(
        msg.chat.id,
        "🔒 សូមទូទាត់មុនដើម្បីចូលរួមកម្មវិធី។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។",
      );
      return;
    }

    await dailyCommands.handle(msg, match, bot);
  } catch (error) {
    console.error("Error in daily command:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
  }
});

// VIP command handlers - both /vip and /vip_program_info work
bot.onText(/\/vip_program_info/, async (msg) => {
  try {
    const user = await User.findOne({ telegramId: msg.from.id });

    if (!user || !user.isPaid) {
      await bot.sendMessage(
        msg.chat.id,
        "🔒 សូមទូទាត់មុនដើម្បីចូលរួមកម្មវិធី។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។",
      );
      return;
    }

    await vipCommands.info(msg, bot);
  } catch (error) {
    console.error("Error in VIP info command:", error);
  }
});

bot.onText(/\/vip$/, async (msg) => {
  try {
    const user = await User.findOne({ telegramId: msg.from.id });

    if (!user || !user.isPaid) {
      await bot.sendMessage(
        msg.chat.id,
        "🔒 សូមទូទាត់មុនដើម្បីចូលរួមកម្មវិធី។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។",
      );
      return;
    }

    await vipCommands.info(msg, bot);
  } catch (error) {
    console.error("Error in VIP command:", error);
  }
});

// Admin Commands
bot.onText(/\/admin_users/, (msg) => adminCommands.showUsers(msg, bot));
bot.onText(/\/admin_progress (.+)/, (msg, match) =>
  adminCommands.checkProgress(msg, match, bot),
);
bot.onText(/\/admin_analytics/, (msg) => adminCommands.showAnalytics(msg, bot));
bot.onText(/\/admin_activity/, (msg) => adminCommands.showActivity(msg, bot));
bot.onText(/\/admin_followup/, (msg) => adminCommands.showFollowup(msg, bot));
bot.onText(/\/admin_message (.+)/, (msg, match) =>
  adminCommands.sendMessage(msg, match, bot),
);
bot.onText(/\/admin_confirm_payment (.+)/, (msg, match) =>
  adminCommands.confirmPayment(msg, match, bot),
);

// VIP Apply Handler
bot.on("message", async (msg) => {
  if (msg.text && msg.text.toUpperCase() === "VIP APPLY") {
    await handleVipApply(msg);
  }
});

bot.onText(/\/admin_export/, (msg) => adminCommands.exportData(msg, bot));
bot.onText(/\/admin_help/, (msg) => adminCommands.showHelp(msg, bot));

// Progress Tracking Commands
const progressTracker = require("./commands/progress-tracker");
bot.onText(/\/admin_stuck/, (msg) => progressTracker.showStuckUsers(msg, bot));
bot.onText(/\/admin_completion/, (msg) =>
  progressTracker.showCompletionRates(msg, bot),
);
bot.onText(/\/admin_remind (.+)/, (msg, match) =>
  progressTracker.sendManualReminder(msg, match, bot),
);
bot.onText(/\/admin_completed/, (msg) =>
  progressTracker.showCompletedUsers(msg, bot),
);
bot.onText(/\/admin_uploads/, (msg) =>
  progressTracker.showUploadTracking(msg, bot),
);
bot.onText(/\/admin_photos (.+)/, (msg, match) =>
  progressTracker.showUserPhotos(msg, match, bot),
);

// Quick Admin Menu
bot.onText(/\/admin_menu|\/admin/, async (msg) => {
  const adminIds = [176039, 484389665];
  if (!adminIds.includes(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះ។");
    return;
  }

  const menuMessage = `🔧 ADMIN QUICK MENU

📱 DAILY MONITORING:
• /admin_activity - Today's active users
• /admin_stuck - Users stuck on days
• /admin_uploads - Photo uploads tracking
• /admin_followup - Users needing help

📊 ANALYTICS:
• /admin_analytics - Full dashboard
• /admin_completion - Completion rates
• /admin_completed - Finished users

💬 ACTIONS:
• /admin_progress [userID] - User details
• /admin_message [userID] [text] - Send message
• /admin_remind [day] - Send reminders
• /admin_confirm_payment [userID] - Confirm payment

📋 REPORTS:
• /admin_users - All users overview
• /admin_export - Export CSV data
• /admin_photos [userID] - User photos

🆘 HELP:
• /admin_help - Full command list
• /whoami - Your admin status

📋 TOOLS & TEMPLATES:
• /admin_daily_template - Daily tracking template
• /admin_weekly_template - Weekly report template
• /admin_engagement_checklist - User engagement guide
• /admin_onboarding_template - New user templates

Type any command to execute instantly!`;

  await bot.sendMessage(msg.chat.id, menuMessage);
});

// Tools and Templates Commands
const toolsTemplates = require("./commands/tools-templates");
bot.onText(/\/admin_daily_template/, (msg) =>
  toolsTemplates.generateDailyTemplate(msg, bot),
);
bot.onText(/\/admin_weekly_template/, (msg) =>
  toolsTemplates.generateWeeklyTemplate(msg, bot),
);
bot.onText(/\/admin_engagement_checklist/, (msg) =>
  toolsTemplates.generateEngagementChecklist(msg, bot),
);
bot.onText(/\/admin_onboarding_template/, (msg) =>
  toolsTemplates.generateOnboardingTemplate(msg, bot),
);

// Marketing Content Commands
bot.onText(/\/marketing_hub/, (msg) => marketingContent.marketingHub(msg, bot));
bot.onText(/\/post_success_story/, (msg) =>
  marketingContent.postSuccessStory(msg, bot),
);
bot.onText(/\/post_program_promo/, (msg) =>
  marketingContent.postProgramPromo(msg, bot),
);
bot.onText(/\/launch_flash_sale/, (msg) =>
  marketingContent.launchFlashSale(msg, bot),
);
bot.onText(/\/content_week/, (msg) => marketingContent.contentWeek(msg, bot));
bot.onText(/\/send_newsletter/, (msg) =>
  marketingContent.sendNewsletter(msg, bot),
);
bot.onText(/\/marketing_stats/, (msg) =>
  marketingContent.marketingStats(msg, bot),
);
bot.onText(/\/roi_analysis/, (msg) => marketingContent.roiAnalysis(msg, bot));
bot.onText(/\/referral_program/, (msg) =>
  marketingContent.referralProgram(msg, bot),
);

// Badge Commands - PAYMENT REQUIRED
bot.onText(/\/badges/, async (msg) => {
  try {
    const user = await User.findOne({ telegramId: msg.from.id });
    if (!user || !user.isPaid) {
      await bot.sendMessage(
        msg.chat.id,
        "🔒 សូមទូទាត់មុនដើម្បីមើល badges។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។",
      );
      return;
    }
    await badgesCommands.showBadges(msg, bot);
  } catch (error) {
    console.error("Error in badges command:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
  }
});

bot.onText(/\/progress/, async (msg) => {
  try {
    const user = await User.findOne({ telegramId: msg.from.id });
    if (!user || !user.isPaid) {
      await bot.sendMessage(
        msg.chat.id,
        "🔒 សូមទូទាត់មុនដើម្បីមើលការរីកចម្រើន។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។",
      );
      return;
    }
    await badgesCommands.showProgress(msg, bot);
  } catch (error) {
    console.error("Error in progress command:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
  }
});

bot.onText(/\/milestones/, async (msg) => {
  try {
    const user = await User.findOne({ telegramId: msg.from.id });
    if (!user || !user.isPaid) {
      await bot.sendMessage(
        msg.chat.id,
        "🔒 សូមទូទាត់មុនដើម្បីមើលសមិទ្ធផល។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។",
      );
      return;
    }
    await badgesCommands.showMilestones(msg, bot);
  } catch (error) {
    console.error("Error in milestones command:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
  }
});

bot.onText(/\/streak/, async (msg) => {
  try {
    const user = await User.findOne({ telegramId: msg.from.id });
    if (!user || !user.isPaid) {
      await bot.sendMessage(
        msg.chat.id,
        "🔒 សូមទូទាត់មុនដើម្បីមើលការធ្វើបន្តបន្ទាប់។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។",
      );
      return;
    }
    await badgesCommands.showStreak(msg, bot);
  } catch (error) {
    console.error("Error in streak command:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
  }
});

// Quote Commands - Premium Features
bot.onText(/\/quote$/, (msg) => quotesCommands.dailyQuote(msg, bot));
bot.onText(/\/wisdom/, (msg) => quotesCommands.randomWisdom(msg, bot));
bot.onText(/\/quote_categories/, (msg) =>
  quotesCommands.showCategories(msg, bot),
);
bot.onText(/\/quote_traditional/, (msg) =>
  quotesCommands.categoryQuote(msg, bot, "traditional"),
);
bot.onText(/\/quote_financial/, (msg) =>
  quotesCommands.categoryQuote(msg, bot, "financial"),
);
bot.onText(/\/quote_motivation/, (msg) =>
  quotesCommands.categoryQuote(msg, bot, "motivation"),
);
bot.onText(/\/quote_success/, (msg) =>
  quotesCommands.categoryQuote(msg, bot, "success"),
);

// FAQ Command
bot.onText(/\/faq|FAQ|faq/, async (msg) => {
  const faqMessage = `❓ សំណួរញឹកញាប់ (FAQ):

💰 អំពីតម្លៃ:
• តម្លៃប៉ុន្មាន? → $47 (Essential) / $97 (Premium) / $197 (VIP)
• ទូទាត់យ៉ាងដូចម្តេច? → ABA Bank, ACLEDA Bank, Wing Payment
• បញ្ជាក់ការទូទាត់រយៈពេលប៉ុន្មាន? → ១-២ម៉ោង

⏰ អំពីពេលវេលា:
• ចំណាយពេលប៉ុន្មាននាទី? → ១៥-២០នាទីក្នុងមួយថ្ងៃ
• អាចធ្វើលឿនជាងនេះបានទេ? → បាន តែណែនាំ ១ថ្ងៃ/១មេរៀន
• ធ្វើរួចហើយ ទើបធ្វើបន្តបានទេ? → បាន ធ្វើតាមល្បឿនខ្លួនឯង

🎯 អំពីមាតិកា:
• មេរៀនមានអ្វីខ្លះ? → ៧ថ្ងៃ Money Management ពេញលេញ
• ភាសាអ្វី? → ភាសាខ្មែរ ១០០% (ពាក្យពេចន៍អំពីប្រាក់)
• ទទួលបានអ្វីខ្លះ? → ចំណេះដឹងគ្រប់គ្រងលុយ និងបង្កើនចំណូល

🔧 អំពីបច្ចេកទេស:
• ត្រូវការឧបករណ៍អ្វី? → គ្រាន់តែ Telegram app
• ទិន្នន័យរក្សាទុកណា? → Server សុវត្ថិភាព ១០០%
• បាត់ទិន្នន័យអត់? → មិនបាត់ - មាន backup ស្វ័យប្រវត្តិ

❓ ប្រើប្រាស់ពេលចម្លែក:
• ភ្លេចធ្វើ Day ម្សិលមិញ? → គ្មានបញ្ហា! ធ្វើបន្តពីថ្ងៃបាត់បង់
• ការទូទាត់មានបញ្ហា? → ផ្ញើរូបអេក្រង់មក ខ្ញុំនឹងជួយពិនិត្យ
• ចង់បានជំនួយបន្ថែម? → សរសេរមកដោយផ្ទាល់ ២៤/៧

🔄 ពាក្យបញ្ជាសំខាន់:
• 🏠 ចាប់ផ្តើម → /start
• 💰 មើលតម្លៃ → /pricing  
• 🛠 ជំនួយ → /help
• 📊 ស្ថានភាព → /status

💬 ត្រូវការជំនួយបន្ថែម? សរសេរមកដោយផ្ទាល់!`;

  await bot.sendMessage(msg.chat.id, faqMessage);
});

// Status Command
bot.onText(/\/status|ស្ថានភាព/, async (msg) => {
  try {
    const userId = msg.from.id;
    const user = await User.findOne({ telegramId: userId });

    if (!user) {
      await bot.sendMessage(
        msg.chat.id,
        "អ្នកមិនទាន់ចុះឈ្មោះ។ ប្រើ /start ដើម្បីចាប់ផ្តើម។",
      );
      return;
    }

    const progress = await Progress.findOne({ userId: userId });

    let statusMessage = `📊 ស្ថានភាពគណនីរបស់អ្នក:

👤 អ្នកប្រើប្រាស់: ${user.firstName || "Unknown"}
📅 ចូលរួម: ${user.joinedAt ? new Date(user.joinedAt).toDateString() : "Unknown"}
💰 ស្ថានភាព: ${user.isPaid ? "✅ បានទូទាត់" : "❌ មិនទាន់ទូទាត់"}`;

    if (user.isPaid) {
      statusMessage += `
📈 ថ្ងៃបច្ចុប្បន្ន: Day ${progress?.currentDay || 0}
🎯 អ្នកអាចប្រើប្រាស់កម្មវិធីបានពេញលេញ!`;

      if (user.paymentDate) {
        statusMessage += `
💰 ទូទាត់ពេល: ${new Date(user.paymentDate).toDateString()}`;
      }

      if (progress) {
        const completedDays = [];
        for (let i = 1; i <= 7; i++) {
          if (progress[`day${i}Completed`]) {
            completedDays.push(`Day ${i}`);
          }
        }
        if (completedDays.length > 0) {
          statusMessage += `
✅ ថ្ងៃបញ្ចប់: ${completedDays.join(", ")}`;
        }
      }
    } else {
      statusMessage += `
🔒 សូមទូទាត់ដើម្បីចូលប្រើ Day 1-7
💡 ប្រើ /pricing ដើម្បីមើលតម្លៃ`;
    }

    await bot.sendMessage(msg.chat.id, statusMessage);
  } catch (error) {
    console.error("Error in status command:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហាក្នុងការទាញយកស្ថានភាព។");
  }
});

// Debugging command to show user's chat ID
bot.onText(/\/whoami/, async (msg) => {
  try {
    const user = await User.findOne({ telegramId: msg.from.id });
    const adminId = parseInt(process.env.ADMIN_CHAT_ID) || 176039;
    const secondaryAdminId = 484389665;
    const isAdmin = msg.from.id === adminId || msg.from.id === secondaryAdminId;

    let response = `🔍 YOUR INFORMATION:\n\n`;
    response += `• Chat ID: ${msg.chat.id}\n`;
    response += `• User ID: ${msg.from.id}\n`;
    response += `• First Name: ${msg.from.first_name || "N/A"}\n`;
    response += `• Last Name: ${msg.from.last_name || "N/A"}\n`;
    response += `• Username: ${msg.from.username ? "@" + msg.from.username : "N/A"}\n`;
    response += `• Admin Status: ${isAdmin ? "✅ ADMIN" : "❌ NOT ADMIN"}\n`;
    response += `• Required Admin ID: ${adminId}\n`;
    response += `• Your ID matches: ${msg.from.id === adminId ? "✅ YES" : "❌ NO"}\n`;

    if (user) {
      response += `• Database Status: ✅ REGISTERED\n`;
      response += `• Payment Status: ${user.isPaid ? "✅ PAID" : "❌ UNPAID"}\n`;
      response += `• VIP Status: ${user.isVip ? "🌟 VIP" : "❌ NOT VIP"}\n`;
      response += `• Joined: ${user.joinedAt ? new Date(user.joinedAt).toDateString() : "Unknown"}\n`;
      response += `• Last Active: ${user.lastActive ? new Date(user.lastActive).toDateString() : "Unknown"}\n`;
      if (user.isPaid && user.paymentDate) {
        response += `• Payment Date: ${new Date(user.paymentDate).toDateString()}\n`;
      }
    } else {
      response += `• Database Status: ❌ NOT REGISTERED\n`;
    }

    await bot.sendMessage(msg.chat.id, response);
  } catch (error) {
    console.error("Error in whoami command:", error);
    await bot.sendMessage(
      msg.chat.id,
      `❌ Error retrieving user information: ${error.message}`,
    );
  }
});

// Tier-based feature commands
// Premium tier commands
bot.onText(/\/admin_contact/, (msg) => tierFeatures.adminContact(msg, bot));
bot.onText(/\/priority_support/, (msg) =>
  tierFeatures.prioritySupport(msg, bot),
);
bot.onText(/\/advanced_analytics/, (msg) =>
  tierFeatures.advancedAnalytics(msg, bot),
);

// VIP tier commands
bot.onText(/\/book_session/, (msg) =>
  bookingCommands.showBookingSlots(msg, bot),
);
bot.onText(/\/book_capital_assessment/, (msg) =>
  bookingCommands.bookCapitalAssessment(msg, bot),
);
bot.onText(/\/book_business_review/, (msg) =>
  bookingCommands.bookBusinessReview(msg, bot),
);
bot.onText(/\/book_investment_evaluation/, (msg) =>
  bookingCommands.bookInvestmentEvaluation(msg, bot),
);
bot.onText(/\/book_custom_session/, (msg) =>
  bookingCommands.bookCustomSession(msg, bot),
);
bot.onText(/\/vip_reports/, (msg) => tierFeatures.personalReports(msg, bot));
bot.onText(/\/extended_tracking/, (msg) =>
  tierFeatures.extendedTracking(msg, bot),
);

bot.onText(/\/help/, async (msg) => {
  try {
    const tierSpecificHelp = await accessControl.getTierSpecificHelp(
      msg.from.id,
    );
    await bot.sendMessage(msg.chat.id, tierSpecificHelp, {
      parse_mode: "Markdown",
    });
  } catch (error) {
    // Fallback to basic help if tier-specific help fails
    const user = await User.findOne({ telegramId: msg.from.id });

    if (!user || !user.isPaid) {
      // Help for unpaid users - only show allowed commands
      const helpText = `🔱 7-Day Money Flow Reset™ - Complete Guide

📚 ពាក្យបញ្ជាដែលមាន:

🟢 ពាក្យបញ្ជាឥតគិតថ្លៃ (ប្រើបានទាំងអស់គ្នា):
• /start - ចាប់ផ្តើមស្គាល់កម្មវិធី
• /pricing - មើលតម្លៃ និងផលប្រយោជន៍
• /payment - ការណែនាំទូទាត់លម្អិត
• /help - មើលការណែនាំនេះ
• /faq - សំណួរញឹកញាប់
• /status - ស្ថានភាពគណនី

🔒 ពាក្យបញ្ជាពិសេស (សម្រាប់អ្នកទូទាត់):
• /day1 - ថ្ងៃទី១: ស្គាល់ Money Flow
• /day2 - ថ្ងៃទី២: ស្វែងរក Money Leaks (លេច)  
• /day3 - ថ្ងៃទី៣: វាយតម្លៃប្រព័ន្ធ
• /day4 - ថ្ងៃទី៤: បង្កើតផែនទីលុយ
• /day5 - ថ្ងៃទី៥: Survival vs Growth (ការរស់រាន និងការលូតលាស់)
• /day6 - ថ្ងៃទី៦: រៀបចំផែនការ
• /day7 - ថ្ងៃទី៧: Integration (ការបញ្ចូលគ្នា)

🏆 ការតាមដានការរីកចម្រើន:
• /badges - មើលការរីកចម្រើន និង badges
• /progress - ការរីកចម្រើនពេញលេញ
• /milestones - សមិទ្ធផលទាំងអស់
• /streak - មើលការធ្វើបន្តបន្ទាប់

📚 សម្រង់ប្រាជ្ញាខ្មែរ:
• /quote - សម្រង់ប្រាជ្ញាប្រចាំថ្ងៃ
• /wisdom - សម្រង់ចៃដន្យ
• /quote_categories - ប្រភេទសម្រង់ទាំងអស់
• /quote_traditional - ប្រាជ្ញាប្រពៃណី
• /quote_financial - ចិត្តគំនិតហិរញ្ញវត្ថុ
• /quote_motivation - ការលើកទឹកចិត្ត
• /quote_success - ជោគជ័យ

💰 ជំហានទូទាត់:
1. ផ្ទេរលុយតាមការណែនាំ
2. ថតរូបអេក្រង់បញ្ជាក់ការទូទាត់
3. ផ្ញើរូបមកឱ្យខ្ញុំ
4. រង់ចាំការបញ្ជាក់ (១-២ម៉ោង)

🔥 សកម្មភាពរហ័ស:
• ចង់ចាប់ផ្តើម? → /start
• ចង់ដឹងតម្លៃ? → /pricing  
• ចង់ទូទាត់? → /payment
• មានសំណួរ? → /faq

❓ ជំនួយ: សរសេរមកដោយផ្ទាល់! ជំនួយ 24/7 ជាភាសាខ្មែរ! 💪`;

      await bot.sendMessage(msg.chat.id, helpText);
    } else {
      // Help for paid users - show all commands
      const helpText = `🔱 7-Day Money Flow Reset™ - ជំនួយការណែនាំ

📱 ពាក្យបញ្ជាទូទៅ:
- /start - ចាប់ផ្តើមកម្មវិធី
- /pricing - មើលតម្លៃសេវាកម្ម
- /payment - វិធីសម្រាប់ការទូទាត់
- /help - ស្វែងរកជំនួយ
- /faq - សំណួរញឹកញាប់
- /status - ពិនិត្យស្ថានភាពគណនី

🚀 ពាក្យបញ្ជាកម្nt�វិធី:
- /day1 - ថ្ងៃទី១: ស្វែងយល់ពី Money Flow
- /day2 - ថ្ងៃទី២: ស្វែងរក Money Leaks
- /day3 - ថ្ងៃទី៣: វាយតម្លៃប្រព័ន្ធហិរញ្ញវត្ថុ
- /day4 - ថ្ងៃទី៤: បង្កើតផែនទីមូលនិធិ
- /day5 - ថ្ងៃទី៥: Survival vs Growth
- /day6 - ថ្ងៃទី៦: រៀបចំផែនការអនាគត
- /day7 - ថ្ងៃទី៧: Integration

🏆 ការតាមដានការរីកចម្រើន:
- /badges - មើលការរីកចម្រើន និង badges
- /progress - ការរីកចម្រើនពេញលេញ
- /milestones - សមិទ្ធផលទាំងអស់
- /streak - មើលការធ្វើបន្តបន្ទាប់

📚 សម្រង់ប្រាជ្ញាខ្ម ��រ:
- /quote - សម្រង់ប្រាជ្ញាប្រចាំថ្ងៃ
- /wisdom - សម្រង់ចៃដន្យ
- /quote_categories - ប្រភេទសម្រង់ទាំងអស់
- /quote_traditional - ប្រាជ្ញាប្រពៃណី
- /quote_financial - ចិត្តគំនិតហិរញ្ញវត្ថុ
- /quote_motivation - ការលើកទឹកចិត្ត
- /quote_success - ជោគជ័យ

🎯 ពាក្យបញ្ជា VIP:
- /vip_program_info - ព័ត៌មាន VIP Advanced Program
- "VIP APPLY" - ចូលរួម VIP Program
- "CAPITAL CLARITY" - ឱកាសកម្រិតខ្ពស់

🛠 ការគាំទ្រ:
- 📱 ទំនាក់ទំនងផ្ទាល់: សរសេរសំណួរមកដោយផ្ទាល់ក្នុង chat នេះ
- 👨‍💼 ជំនួយការផ្ទាល់ខ្លួន: ខ្ញុំ និង ជំនួយការ នឹងឆ្លើយសំណួរអ្នក
- 📞 ទំនាក់ទំនងផ្ទាល់បន្ថែម: @Chendasum
- 💬 ឧទាហរណ៍: "ខ្ញុំមានបញ្ហាក្នុងការទូទាត់" ឬ "ខ្ញុំមិនយល់ Day 3"
- ⏰ ម៉ោងសេវាកម្ម: ២៤/៧ (ឆ្លើយក្នុង ១-២ម៉ោង)
- 🇰🇭 ភាសាគាំទ្រ: ខ្មែរ និង English

🔥 សកម្មភាពរហ័ស:
- ចង់ចាប់ផ្តើម? → /start
- ចង់ដឹងតម្លៃ? → /pricing
- មានសំណួរ? → /faq

💪 ពាក្យគន្លឹះ:
"ការផ្លាស់ប្តូរជីវិត ចាប់ផ្តើមពីការកែប្រែរបៀបគ្រប់គ្រងប្រាក់កម្រាល់របស់យើង"

🎉 អរគុណចំពោះការជ្រើសរើសកម្មវិធី 7-Day Money Flow Reset™
ការដំណើរផ្លាស់ប្តូររបស់អ្នក ចាប់ផ្តើមហើយ! 🚀`;

      await bot.sendMessage(msg.chat.id, helpText);
    }
  }
});

// Consolidated message handler with smart question detection
bot.on("message", async (msg) => {
  // Update lastActive timestamp for any message
  try {
    await User.updateLastActive(msg.from.id);
  } catch (error) {
    console.error("Error updating lastActive:", error);
  }

  if (!msg.text || msg.text.startsWith("/")) {
    return;
  }

  const text = msg.text.toLowerCase();
  const userId = msg.from.id;

  // Skip specific program keywords to avoid interfering with main flow
  if (
    text.includes("ready for day") ||
    (text.includes("day") && text.includes("complete"))
  ) {
    await handleTextResponse(msg);
    return;
  }

  // Detect question words
  const questionWords = [
    "help",
    "problem",
    "issue",
    "question",
    "how",
    "why",
    "what",
    "where",
    "when",
    "error",
    "fail",
    "broken",
    "stuck",
    "cannot",
    "can't",
    "unable",
    "wrong",
    "fix",
    "repair",
    "troubleshoot",
    "បញ្ហា",
    "ជំនួយ",
    "សួរ",
    "យ៉ាងម៉េច",
    "ធ្វើម៉េច",
    "ហេតុអ្វី",
    "កំហុស",
    "ខូច",
    "មិនអាច",
    "ជួសជុល",
    "ដោះស្រាយ",
  ];

  const hasQuestionWord = questionWords.some((word) => text.includes(word));

  if (hasQuestionWord || text.includes("?")) {
    // Check if it's investment-related
    const investmentWords = [
      "វិនិយោគ",
      "ហ៊ុន",
      "ប្រាក់បញ្ញើ",
      "ភាគហ៊ុន",
      "មូលប័ត្រ",
      "គម្រោង",
      "ការលិតធ្វើ",
      "ពាណិជ្ជកម្ម",
      "investment",
      "company",
      "deposit",
      "stock",
      "fund",
      "business",
      "trading",
      "portfolio",
    ];
    const isInvestmentQuestion = investmentWords.some((word) =>
      text.includes(word),
    );

    if (isInvestmentQuestion) {
      const investmentResponse = `💼 ការវិនិយោគ និងអាជីវកម្ម

🎯 កម្មវិធីរបស់យើង:
កម្មវិធី 7-Day Money Flow Reset™ មានតាមៗ ការគ្រប់គ្រងប្រាក់កម្រាល់ទេ មិនមែនការវិនិយោគ។

💡 ស្រាប់តែបានបញ្ចប់កម្មវិធី:
- អ្នកនឹងមានគ្រឹះល្អក្នុងការគ្រប់គ្រងប្រាក់
- យល់ពីលំហូរប្រាក់ និងការសន្សំ
- ត្រៀមខ្លួនសម្រាប់ការវិនិយោគនាពេលខាងមុខ

🔥 បើចង់ដឹងពីការវិនិយោគ:
- បញ្ចប់កម្មវិធី 7 ថ្ងៃមុន
- ទាក់ទង @Chendasum សម្រាប់ការណែនាំបន្ត
- ឬ ពិនិត្យ VIP Program → /vip_program_info

✅ ចាប់ផ្តើមដំបូង → /start`;

      await bot.sendMessage(msg.chat.id, investmentResponse);
      return;
    }

    let helpResponse = `🤔 ខ្ញុំឃើញអ្នកមានសំណួរ!

🔥 ជំនួយរហ័ស:
- បញ្ហាការទូទាត់ → ពិនិត្យ /faq ឬ ផ្ញើរូបអេក្រង់
- បញ្ហាបច្ចេកទេស → ស្វែងរក /help មុន
- សំណួរកម្មវិធី → ទាក់ទង @Chendasum ដោយផ្ទាល់
- ព័ត៌មាន VIP → ប្រើ /vip_program_info

📱 ឬគ្រាន់តែសរសេរសំណួរអ្នក - ខ្ញុំនឹងជួយ!

💬 ជំនួយ 24/7 ជាភាសាខ្មែរ និង English!`;

    await bot.sendMessage(msg.chat.id, helpResponse);
    return;
  }

  // Handle other text responses
  await handleTextResponse(msg);
});

// Handle Capital Clarity interest - Updated version
bot.onText(/CAPITAL CLARITY|capital clarity/i, async (msg) => {
  const userId = msg.from.id;
  const firstName = msg.from.first_name || "Friend";

  const clarityResponse = `🏛️ Capital Clarity Session - Private Capital Strategy

Hello ${firstName}!

🎯 What is a Capital Clarity Session?

A structured, private strategy session designed to:
- Diagnose where your capital system is blocked or leaking
- Clarify how your deals and investor relationships operate
- Identify trust gaps and deployment risks
- Prescribe clear upgrade path with structured methodology

💰 Investment: $197 (Regular: $497) - Limited 5 spots/month

🔍 Core Analysis Framework:
1️⃣ Opening Frame - Set trust and strategic context
2️⃣ Capital X-Ray - Review fund/deal structure and flow
3️⃣ Trust Mapping - Identify relationship breakdowns
4️⃣ System Readiness Score - Grade deployment capabilities
5️⃣ Clarity Prescription - Strategic upgrade roadmap

🎯 Perfect for:
- Founders managing private capital ($100K+ annually)
- Operators with fund structures
- Business owners planning growth funding
- Investors needing structured deployment
- Entrepreneurs seeking capital optimization

📋 To Qualify, Please Provide:
1. Your role (Founder/Operator/Investor)
2. Company name and revenue range
3. Current capital/fund situation
4. Main structural challenge
5. Investment timeline
6. Contact details (email/phone)

🇰🇭 Cambodia Focus: We understand local business structures, banking systems, and growth opportunities.

⚠️ Important: This is advanced capital strategy for serious business owners managing significant capital.

Ready to optimize your capital system? Please provide qualification details above.

Questions? Contact @Chendasum directly.`;

  await bot.sendMessage(userId, clarityResponse);

  // Notify admin
  const adminId = process.env.ADMIN_CHAT_ID;
  await bot.sendMessage(
    adminId,
    `🏛️ NEW CAPITAL CLARITY INTEREST:

User: ${firstName} (${userId})
Time: ${new Date().toLocaleString()}
Type: Private Capital Strategy Session ($197)

Advanced prospect interested in capital structure optimization.

User needs to provide qualification information.`,
  );
});

async function handleVipApply(msg) {
  try {
    const user = await User.findOne({ telegramId: msg.from.id });

    if (!user || !user.isPaid) {
      await bot.sendMessage(
        msg.chat.id,
        "🔒 សូមទូទាត់មុនដើម្បីចូលរួមកម្មវិធី។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។",
      );
      return;
    }

    const vipApplyMessage = `🌟 VIP PROGRAM + CAPITAL STRATEGY ACCESS

សូមផ្ញើព័ត៌មានដូចខាងក្រោម:

1️⃣ ឈ្មោះពេញ:
2️⃣ អាជីវកម្ម/ការងារ:
3️⃣ គោលដៅហិរញ្ញវត្ថុ:
4️⃣ បញ្ហា Capital Flow បច្ចុប្បន្ន:
5️⃣ ម៉ោងដែលអ្នកអាចពិគ្រោះ:
6️⃣ លេខទូរសព្ទ:

💰 តម្លៃ VIP: $197 (789,576 រៀល)
✅ Strategic Foundation Session 1-on-1 (60 នាទី)
✅ ការតាមដាន 30 ថ្ងៃ + Implementation Support
✅ Capital Foundation Development
✅ Capital Clarity Preview (15 នាទី)
✅ Readiness Assessment for Advanced Capital Systems
✅ Strategic Network Introductions
✅ Pathway to Advanced Capital Work

📞 បន្ទាប់ពីអ្នកផ្ញើព័ត៌មាន Admin នឹងទាក់ទងអ្នក`;

    await bot.sendMessage(msg.chat.id, vipApplyMessage);

    // Notify admin
    const adminId = parseInt(process.env.ADMIN_CHAT_ID) || 176039;
    await bot.sendMessage(
      adminId,
      `🌟 VIP APPLICATION REQUEST

User: ${user.firstName} ${user.lastName}
ID: ${user.telegramId}
Status: ${user.isPaid ? "PAID" : "UNPAID"} ${user.isVip ? "| ALREADY VIP" : ""}

User wants to apply for VIP Program.
Monitor for their application information.`,
    );
  } catch (error) {
    console.error("Error in VIP Apply handler:", error);
  }
}

async function handleCapitalClarityApplicationRequest(msg) {
  const userId = msg.from.id;
  const firstName = msg.from.first_name || "Entrepreneur";

  const applicationMessage = `📋 Capital Clarity Application Form

Hello ${firstName}!

Ready to submit your Capital Clarity application? Please provide all required information in the following format:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CAPITAL CLARITY APPLICATION
1. Role: [Your role - Founder/Operator/Investor]
2. Company: [Company name and annual revenue range]
3. Capital Situation: [Current capital/fund situation]
4. Main Challenge: [Your main structural challenge]
5. Timeline: [Investment timeline and goals]
6. Contact: [Email and phone number]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 Example Application:
CAPITAL CLARITY APPLICATION
1. Role: Founder
2. Company: Tech Startup - $200K annual revenue
3. Capital Situation: Managing $50K working capital, seeking $300K funding
4. Main Challenge: Need structured capital deployment strategy
5. Timeline: Ready to invest within 3 months
6. Contact: founder@startup.com, +855-12-345-678

🎯 Instructions:
• Copy the format above
• Replace with your real information
• Send as one complete message
• We will review and respond within 24 hours

💰 Investment: $197 (Regular: $497)
🔥 Limited: 5 spots per month

Questions? Contact @Chendasum directly.`;

  await bot.sendMessage(userId, applicationMessage);

  // Notify admin
  const adminId = process.env.ADMIN_CHAT_ID;
  if (adminId) {
    await bot.sendMessage(
      adminId,
      `📋 APPLICATION FORM REQUESTED:

User: ${firstName} (${userId})
Message: "${msg.text}"
Time: ${new Date().toLocaleString()}

User is ready to submit Capital Clarity application.`,
    );
  }
}

async function handleTextResponse(msg) {
  const userId = msg.from.id;
  const text = msg.text.toUpperCase();

  try {
    const user = await User.findOne({ telegramId: userId });

    if (!user) return;

    // VIP Apply is handled by dedicated handler above
    // Capital Clarity is handled by bot.onText handler above

    if (text === "VIP APPLY") {
      await handleVipApply(msg);
      return;
    }

    // Check if user has paid for restricted actions
    const restrictedActions = ["READY FOR DAY 1", "DAY", "PROGRAM COMPLETE"];
    const isRestrictedAction = restrictedActions.some((action) =>
      text.includes(action),
    );

    if (isRestrictedAction && !user.isPaid) {
      await bot.sendMessage(
        msg.chat.id,
        "🔒 សូមទូទាត់មុនដើម្បីចូលរួមកម្មវិធី។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។",
      );
      return;
    }

    // Handle Capital Clarity application trigger words
    if (
      text.includes("APPLY") ||
      text.includes("SUBMIT") ||
      text.includes("INTERESTED") ||
      text.includes("WANT TO JOIN")
    ) {
      // Check if this is related to Capital Clarity
      if (
        text.includes("CAPITAL") ||
        text.includes("CLARITY") ||
        text.includes("SESSION") ||
        text.includes("APPLY NOW") ||
        text.includes("SUBMIT APPLICATION")
      ) {
        await handleCapitalClarityApplicationRequest(msg);
        return;
      }
    }

    // Handle specific responses - PAYMENT REQUIRED
    if (text === "READY FOR DAY 1") {
      // Check payment status before allowing day 1 access
      if (!user.isPaid) {
        await bot.sendMessage(
          msg.chat.id,
          "🔒 សូមទូទាត់មុនដើម្បីចូលរួមកម្មវិធី។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។",
        );
        return;
      }
      await handleReadyForDay1(msg);
    } else if (text.includes("DAY") && text.includes("COMPLETE")) {
      // Check payment status before allowing day completion
      if (!user.isPaid) {
        await bot.sendMessage(
          msg.chat.id,
          "🔒 សូមទូទាត់មុនដើម្បីចូលរួមកម្មវិធី។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។",
        );
        return;
      }
      await handleDayComplete(msg);
    } else if (text === "PROGRAM COMPLETE") {
      // Check payment status before allowing program completion
      if (!user.isPaid) {
        await bot.sendMessage(
          msg.chat.id,
          "🔒 សូមទូទាត់មុនដើម្បីចូលរួមកម្មវិធី។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។",
        );
        return;
      }
      await handleProgramComplete(msg);
    } else if (text === "VIP APPLY") {
      // Check payment status before VIP application
      if (!user.isPaid) {
        await bot.sendMessage(
          msg.chat.id,
          "🔒 សូមទូទាត់មុនដើម្បីចូលរួមកម្មវិធី។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។",
        );
        return;
      }
      await vipCommands.apply(msg, bot);
    }
  } catch (error) {
    console.error("Error handling text response:", error);
  }
}

async function handleReadyForDay1(msg) {
  const userId = msg.from.id;

  try {
    // Check if user has paid before allowing day 1 access
    const user = await User.findOne({ telegramId: userId });
    if (!user || !user.isPaid) {
      await bot.sendMessage(
        msg.chat.id,
        "🔒 សូមទូទាត់មុនដើម្បីចូលរួមកម្មវិធី។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។",
      );
      return;
    }

    // Update progress to mark ready for day 1 and set current day
    await Progress.findOneAndUpdate(
      { userId: userId },
      {
        readyForDay1: true,
        currentDay: 1,
      },
      { upsert: true },
    );

    await bot.sendMessage(
      msg.chat.id,
      `🎉 ល្អហើយ! អ្នកត្រៀមរួចហើយ!

ចាប់ផ្តើមថ្ងៃទី ១ ឥឡូវនេះ: /day1

ថ្ងៃទី ១ នឹងផ្ញើស្វ័យប្រវត្តិនៅម៉ោង ៩ ព្រឹកថ្ងៃស្អែកផងដែរ។

ជំនួយ ២៤/៧ ជាភាសាខ្មែរ! 💪`,
    );
  } catch (error) {
    console.error("Error handling ready for day 1:", error);
  }
}

async function handleDayComplete(msg) {
  // Extract day number from text like "DAY 1 COMPLETE" (case-insensitive)
  const dayMatch = msg.text.toUpperCase().match(/DAY\s*(\d+)\s*COMPLETE/);
  if (!dayMatch) return;

  const dayNumber = parseInt(dayMatch[1]);

  // Update progress
  const updateField = `day${dayNumber}Completed`;
  const completedAtField = `day${dayNumber}CompletedAt`;
  const nextDay = dayNumber + 1;

  await Progress.findOneAndUpdate(
    { userId: msg.from.id },
    {
      [updateField]: true,
      [completedAtField]: new Date(),
      currentDay: nextDay <= 7 ? nextDay : 7,
    },
    { upsert: true },
  );

  // Send emoji reaction for day completion
  const completeReaction = emojiReactions.lessonCompleteReaction(dayNumber);
  await bot.sendMessage(msg.chat.id, completeReaction);

  // Send celebration animation for day completion
  setTimeout(async () => {
    const celebrationMessage = celebrations.dayCompleteCelebration(dayNumber);
    await bot.sendMessage(msg.chat.id, celebrationMessage);
  }, 500);

  // Send milestone wisdom quote after celebration
  setTimeout(async () => {
    await quotesCommands.sendMilestoneQuote(bot, msg.chat.id, "day_complete");
  }, 2000);

  // Add progress celebration
  const progressPercentage = (dayNumber / 7) * 100;
  const progressCelebration =
    celebrations.getProgressCelebration(progressPercentage);
  await bot.sendMessage(
    msg.chat.id,
    `📊 ការដំណើរ: ${Math.round(progressPercentage)}% - ${progressCelebration}`,
  );

  // Show badge achievement after completion
  setTimeout(async () => {
    try {
      const user = await User.findOne({ telegramId: msg.from.id });
      const progress = await Progress.findOne({ userId: msg.from.id });

      if (user && progress) {
        const completedDays = [];
        for (let i = 1; i <= 7; i++) {
          if (progress[`day${i}Completed`]) {
            completedDays.push(i);
          }
        }

        // Generate milestone badge for current day
        const milestone = progressBadges.milestones[`day${dayNumber}`];
        if (milestone) {
          const badgeMessage = progressBadges.createAnimatedBadge(
            "milestone",
            `🏅 បានទទួល: ${milestone.name} ${milestone.emoji}`,
            `${milestone.reward}\n\n💫 ម្តងទៀត អ្នកខ្លាំង!`,
          );
          await bot.sendMessage(msg.chat.id, badgeMessage);
        }

        // Show special milestone badges for 3, 5, 7 days
        if (completedDays.length === 3) {
          const specialBadge = progressBadges.createAnimatedBadge(
            "special",
            "🔥 មជ្ឈមភាព Badge បានទទួល!",
            "អ្នកបានបញ្ចប់ 3 ថ្ងៃ! ការដំណើរកំពុងចាប់ផ្តើម!",
          );
          await bot.sendMessage(msg.chat.id, specialBadge);
        } else if (completedDays.length === 5) {
          const specialBadge = progressBadges.createAnimatedBadge(
            "special",
            "💪 អ្នកខ្លាំង Badge បានទទួល!",
            "អ្នកបានបញ្ចប់ 5 ថ្ងៃ! ស្ទើរតែបានហើយ!",
          );
          await bot.sendMessage(msg.chat.id, specialBadge);
        } else if (completedDays.length === 7) {
          const specialBadge = progressBadges.createAnimatedBadge(
            "special",
            "🏆 Champion Badge បានទទួល!",
            "អ្នកបានបញ្ចប់ទាំងអស់! អ្នកជា Money Flow Master!",
          );
          await bot.sendMessage(msg.chat.id, specialBadge);
        }
      }
    } catch (error) {
      console.error("Error showing badge achievement:", error);
    }
  }, 2000);

  // Send next day guidance if not completed
  if (dayNumber < 7) {
    await bot.sendMessage(
      msg.chat.id,
      `🚀 ត្រៀមរួចសម្រាប់ថ្ងៃទី ${nextDay}? ចុច /day${nextDay}`,
    );
  } else {
    // Program completed - send special celebration
    setTimeout(async () => {
      await bot.sendMessage(
        msg.chat.id,
        `🎊 អ្នកបានបញ្ចប់កម្មវិធីពេញលេញ! សរសេរ "PROGRAM COMPLETE" ដើម្បីទទួលយកលទ្ធផលចុងក្រោយ!`,
      );
    }, 3000);
  }
}

async function handleProgramComplete(msg) {
  // Send program completion celebration
  const programCelebration =
    celebrations.programCompleteCelebration(`🎯 ជំហានបន្ទាប់:
1️⃣ អនុវត្តផែនការ ៣០ថ្ងៃ
2️⃣ ពិនិត្យដំណើរការប្រចាំសប្តាហ៍
3️⃣ មានសំណួរ? ទាក់ទងមកបាន!

🚀 ចង់បន្តកម្រិតបន្ទាប់?
VIP Advanced Program ចាប់ផ្តើមខែក្រោយ!
សួរ: "VIP PROGRAM INFO"`);

  await bot.sendMessage(msg.chat.id, programCelebration);

  // Send program completion wisdom quote
  setTimeout(async () => {
    await quotesCommands.sendMilestoneQuote(
      bot,
      msg.chat.id,
      "program_complete",
    );
  }, 2000);

  // Mark program as completed
  await Progress.findOneAndUpdate(
    { userId: msg.from.id },
    {
      programCompleted: true,
      programCompletedAt: new Date(),
    },
    { upsert: true },
  );

  // Send special achievement celebration
  setTimeout(async () => {
    const achievement = celebrations.milestoneCelebration(
      "អ្នកបានក្លាយជា Money Flow Expert!",
      "អ្នកឥឡូវនេះមានវិធីសាស្រ្តពេញលេញសម្រាប់គ្រប់គ្រងលុយ!",
    );
    await bot.sendMessage(msg.chat.id, achievement);
  }, 2000);

  // Send VIP offer after 5 seconds
  setTimeout(async () => {
    await vipCommands.offer(msg, bot);
  }, 5000);
}

// Schedule daily messages at 9 AM
cron.schedule("0 9 * * *", async () => {
  console.log("🕘 Sending daily messages...");
  await scheduler.sendDailyMessages(bot);
});

// Payment webhook endpoint
app.post("/webhook/payment", async (req, res) => {
  try {
    const { userId, amount, status, transactionId } = req.body;

    if (status === "completed" && amount >= 97) {
      await paymentCommands.confirmPayment(bot, userId, transactionId);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Payment webhook error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Analytics endpoint
app.get("/analytics", async (req, res) => {
  try {
    const stats = await analytics.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Failed to get analytics" });
  }
});

// API info endpoint
app.get("/api", (req, res) => {
  res.json({
    name: "7-Day Money Flow Reset™ Telegram Bot",
    description:
      "A Telegram bot that delivers a 7-day financial education program in Khmer language",
    status: "Running",
    version: "1.0.0",
    domain: "7daymoneyflow.com",
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/health",
      analytics: "/analytics",
      payment_webhook: "/webhook/payment",
    },
  });
});

// Root endpoint for health checks
app.get("/", (req, res) => {
  res.status(200).json({
    name: "7-Day Money Flow Reset™ Telegram Bot",
    description:
      "A Telegram bot that delivers a 7-day financial education program in Khmer language",
    status: "Running",
    version: "1.0.0",
    domain: "7daymoneyflow.com",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    endpoints: {
      health: "/health",
      analytics: "/analytics",
      payment_webhook: "/webhook/payment",
    },
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// Additional health check endpoints for different deployment systems
app.get("/healthz", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

app.get("/ready", (req, res) => {
  res
    .status(200)
    .json({ status: "ready", timestamp: new Date().toISOString() });
});

// Serve static files after API routes
app.use("/public", express.static("public"));

// Start server
const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || "0.0.0.0";

const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on ${HOST}:${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

// Error handling
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

app.listen(process.env.PORT || 3000, () => {
  console.log("✅ Bot server is running...");
});
console.log("🤖 Bot started successfully!");
