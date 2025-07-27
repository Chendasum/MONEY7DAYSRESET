/**
 * 7-Day Money Flow Reset™ — Unified Production index.js
 * -----------------------------------------------------
 * - Webhook-first (Railway), optional polling fallback for local dev
 * - All commands wired behind one safe dispatcher
 * - Robust try/catch on every external module load
 * - Normalized PG boolean checks ('t'/'f' and true/false)
 * - Centralized duplicate-message prevention
 * - Content scheduler + cron
 * - Health, ping, analytics routes
 */

require("dotenv").config();

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const cron = require("node-cron");
const path = require("path");

// UTF-8 for Khmer
process.env.NODE_ICU_DATA = "/usr/share/nodejs/node-icu-data";
process.env.LANG = "en_US.UTF-8";

// -----------------------------------------------------------------------------
// Safe loaders (commands & services)
// -----------------------------------------------------------------------------
function safeRequire(p) {
  try {
    return require(p);
  } catch (e) {
    console.log(`⚠️ Cannot load ${p}: ${e.message}`);
    return null;
  }
}

// Models
const User = safeRequire("./models/User");
const Progress = safeRequire("./models/Progress");

// Commands
const startCommand = safeRequire("./commands/start");
const dailyCommands = safeRequire("./commands/daily");
const paymentCommands = safeRequire("./commands/payment");
const vipCommands = safeRequire("./commands/vip");
const adminCommands = safeRequire("./commands/admin");
const badgesCommands = safeRequire("./commands/badges");
const quotesCommands = safeRequire("./commands/quotes");
const bookingCommands = safeRequire("./commands/booking");
const tierFeatures = safeRequire("./commands/tier-features");
const marketingCommands = safeRequire("./commands/marketing");
const marketingContent = safeRequire("./commands/marketing-content");
const extendedContent = safeRequire("./commands/extended-content");
const thirtyDayAdmin = safeRequire("./commands/30day-admin");
const previewCommands = safeRequire("./commands/preview");
const freeTools = safeRequire("./commands/free-tools");
const financialQuiz = safeRequire("./commands/financial-quiz");
const toolsTemplates = safeRequire("./commands/tools-templates");
const progressTracker = safeRequire("./commands/progress-tracker");

// Services
const scheduler = safeRequire("./services/scheduler");
const analytics = safeRequire("./services/analytics");
const celebrations = safeRequire("./services/celebrations");
const progressBadges = safeRequire("./services/progress-badges");
const emojiReactions = safeRequire("./services/emoji-reactions");
const AccessControl = safeRequire("./services/access-control");
const ContentScheduler = safeRequire("./services/content-scheduler");
const ConversionOptimizer = safeRequire("./services/conversion-optimizer");

// Utils
let sendLongMessage;
try {
  const { sendLongMessage: s } = require("./utils/message-splitter");
  sendLongMessage = s;
} catch {
  console.log("⚠️ utils/message-splitter not found, using inline fallback");
  sendLongMessage = async (bot, chatId, text, options = {}, chunkSize = 4000) => {
    try {
      if (text.length <= chunkSize) {
        return await bot.sendMessage(chatId, text, options);
      }
      const parts = [];
      let current = "";
      const sentences = text.split(/(?<=[.?!]\s)/);
      for (const sentence of sentences) {
        if ((current + sentence).length > chunkSize) {
          if (current) parts.push(current);
          current = sentence;
        } else {
          current += sentence;
        }
      }
      if (current) parts.push(current);
      for (const part of parts) {
        await bot.sendMessage(chatId, part, options);
        await new Promise((r) => setTimeout(r, 60));
      }
    } catch (err) {
      console.error("sendLongMessage error:", err);
      await bot.sendMessage(chatId, "❌ មានបញ្ហាក្នុងការផ្ញើសារ។");
    }
  };
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
const MESSAGE_CHUNK_SIZE = 800;

const isTrue = (v) => v === true || v === "t" || v === "true" || v === 1;

const getUserByTelegramId = async (telegramId) => {
  // Make it resilient to different column names
  return (
    (await User?.findOne?.({ telegram_id: telegramId })) ||
    (await User?.findOne?.({ telegramId })) ||
    null
  );
};

const getProgressByUserId = async (telegramId) => {
  return (
    (await Progress?.findOne?.({ user_id: telegramId })) ||
    (await Progress?.findOne?.({ userId: telegramId })) ||
    null
  );
};

const upsertProgress = async (telegramId, payload) => {
  const filter = { user_id: telegramId };
  const altFilter = { userId: telegramId };
  if (Progress?.findOneAndUpdate) {
    try {
      return await Progress.findOneAndUpdate(filter, payload, {
        upsert: true,
        new: true,
      });
    } catch {
      return await Progress.findOneAndUpdate(altFilter, payload, {
        upsert: true,
        new: true,
      });
    }
  }
  return null;
};

// -----------------------------------------------------------------------------
// Express
// -----------------------------------------------------------------------------
const app = express();
app.use(express.json({ limit: "10mb", charset: "utf-8" }));
app.use(express.urlencoded({ extended: true, charset: "utf-8" }));
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});

// -----------------------------------------------------------------------------
// Telegram Bot – webhook-first (Railway), with optional local polling fallback
// -----------------------------------------------------------------------------
if (!process.env.BOT_TOKEN) {
  console.error("❌ BOT_TOKEN is missing. Exiting.");
  process.exit(1);
}

let bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });

// Optional instances
const accessControl = AccessControl ? new AccessControl() : null;
const conversionOptimizer = ConversionOptimizer ? new ConversionOptimizer() : null;

// Duplicate prevention
const processedMessages = new Set();
const lastProcessTime = {};
function isDuplicateMessage(msg) {
  const id = `${msg.chat?.id}-${msg.message_id}`;
  const now = Date.now();
  if (processedMessages.has(id) && lastProcessTime[id] && now - lastProcessTime[id] < 3000) {
    return true;
  }
  processedMessages.add(id);
  lastProcessTime[id] = now;
  if (processedMessages.size > 200) {
    const cutoff = now - 30000;
    Object.keys(lastProcessTime).forEach((k) => {
      if (lastProcessTime[k] < cutoff) {
        processedMessages.delete(k);
        delete lastProcessTime[k];
      }
    });
  }
  return false;
}

// Webhook setup
async function initWebhook() {
  try {
    await bot.stopPolling().catch(() => {});
    await bot.deleteWebHook().catch(() => {});
    const domain =
      process.env.RAILWAY_PUBLIC_DOMAIN ||
      process.env.REPL_URL ||
      process.env.WEBHOOK_DOMAIN ||
      "money7daysreset-production.up.railway.app";
    const webhookUrl =
      (domain.startsWith("http") ? domain : `https://${domain}`) +
      `/bot${process.env.BOT_TOKEN}`;

    const set = await bot.setWebHook(webhookUrl, { drop_pending_updates: true });
    console.log("✅ Webhook set:", set, "→", webhookUrl);

    app.post(`/bot${process.env.BOT_TOKEN}`, async (req, res) => {
      try {
        await bot.processUpdate(req.body);
        res.sendStatus(200);
      } catch (err) {
        console.error("Webhook processUpdate error:", err);
        res.sendStatus(500);
      }
    });
  } catch (err) {
    console.error("❌ Webhook init failed, you may use polling locally. Error:", err.message);
    if (process.env.LOCAL_POLLING === "true") {
      console.log("➡️ Falling back to polling mode (LOCAL_POLLING=true)");
      bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
    } else {
      process.exit(1);
    }
  }
}

// -----------------------------------------------------------------------------
// Generic secured handler factory
// -----------------------------------------------------------------------------
function createHandler(fn, opts = {}) {
  const { requiresPaid = false, requiresAdmin = false } = opts;

  return async (msg, match) => {
    if (!msg) return;
    if (isDuplicateMessage(msg)) return;

    const uid = msg.from?.id;
    let user = null;
    let isAdmin = false;
    let isPaid = false;

    try {
      user = await getUserByTelegramId(uid);

      // Admin check
      const envAdminId = parseInt(process.env.ADMIN_CHAT_ID || "0", 10);
      const envSecondaryAdminId = parseInt(
        process.env.SECONDARY_ADMIN_CHAT_ID || "0",
        10
      );
      isAdmin =
        uid === envAdminId ||
        uid === envSecondaryAdminId ||
        isTrue(user?.is_admin) ||
        user?.tier === "admin";

      // Paid check
      isPaid = isTrue(user?.is_paid) || isTrue(user?.isPaid);

      if (requiresAdmin && !isAdmin) {
        await bot.sendMessage(
          msg.chat.id,
          "🚫 អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះទេ។"
        );
        return;
      }

      if (requiresPaid && !isPaid && !isAdmin) {
        await bot.sendMessage(
          msg.chat.id,
          "🔒 មាតិកានេះទាមទារការបង់ប្រាក់។ ប្រើ /pricing ដើម្បីមើលលម្អិត ឬ /payment ដើម្បីទូទាត់។"
        );
        return;
      }

      if (typeof fn === "function") {
        await fn(msg, match, bot, { User, Progress, sendLongMessage });
        if (requiresPaid && analytics?.trackPaidFeatureUsage && !isAdmin) {
          analytics.trackPaidFeatureUsage(uid, match ? match[0] : msg.text);
        }
      } else {
        await bot.sendMessage(
          msg.chat.id,
          "⚠️ មុខងារនេះមិនទាន់បានដំឡើង។ សូមព្យាយាមម្តងទៀតពេលក្រោយ។"
        );
      }
    } catch (e) {
      console.error("Handler error:", e);
      await bot.sendMessage(
        msg.chat.id,
        "❌ មានបញ្ហាក្នុងការដំណើរការ។ សូមសាកល្បងម្តងទៀត។"
      );
    }
  };
}

// -----------------------------------------------------------------------------
// Register commands
// -----------------------------------------------------------------------------
function registerCommands() {
  console.log("🔧 Registering commands...");

  // START / HELP
  bot.onText(/\/start/i, async (msg) => {
    if (isDuplicateMessage(msg)) return;
    if (startCommand?.handle) {
      return startCommand.handle(msg, bot);
    }
    // fallback
    const welcome = `🌟 សូមស្វាគមន៍មកកាន់ 7-Day Money Flow Reset™!

💰 កម្មវិធីគ្រប់គ្រងលុយ ៧ ថ្ងៃ (ភាសាខ្មែរ)
🎯 តម្លៃពិសេស: $24 USD (LAUNCH50)
💳 /payment – វិធីទូទាត់
💰 /pricing – មើលតម្លៃ

/day1 → ចាប់ផ្តើមថ្ងៃទី១
/help → ជំនួយ
`;
    await bot.sendMessage(msg.chat.id, welcome);
  });

  bot.onText(/\/help/i, async (msg) => {
    if (isDuplicateMessage(msg)) return;
    try {
      const helpMsg =
        (await accessControl?.getTierSpecificHelp?.(msg.from.id)) ||
        `📚 ជំនួយ:
- /start
- /pricing
- /payment
- /day1 ដល់ /day7
- /extended8 ដល់ /extended30
- /vip
- /preview
- /financial_quiz
- /calculate_daily
- /status
- /whoami
- /faq`;
      await sendLongMessage(bot, msg.chat.id, helpMsg, { parse_mode: "Markdown" }, MESSAGE_CHUNK_SIZE);
    } catch (e) {
      console.error("/help error:", e);
      await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហាក្នុងការផ្ទុកជំនួយ។");
    }
  });

  // PRICING / PAYMENT
  bot.onText(/\/pricing/i, createHandler(paymentCommands?.pricing || (async (msg) => {
    const fallbackPricing = `💰 តម្លៃកម្មវិធី 7-Day Money Flow Reset™

🎯 Essential
💵 $24 USD (LAUNCH50)
🏦 ABA: 000 194 742
🏦 ACLEDA: 092 798 169
🏧 Wing: 102 534 677
👤 SUM CHENDA

/payment – វិធីទូទាត់
@Chendasum – ជំនួយ`;
    await bot.sendMessage(msg.chat.id, fallbackPricing);
  })));

  bot.onText(/\/payment/i, createHandler(paymentCommands?.instructions || (async (msg) => {
    const fallbackPayment = `💳 ការណែនាំទូទាត់

🏦 ABA: 000 194 742
🏦 ACLEDA: 092 798 169
🏧 Wing: 102 534 677
👤 SUM CHENDA
💵 $24 USD
📝 Reference: BOT${msg.from.id}

📸 បន្ទាប់ពីទូទាត់:
1) ថតរូបបញ្ជាក់
2) ផ្ញើមក @Chendasum
3) ចាប់ផ្តើម Day 1 ភ្លាមៗ!`;
    await bot.sendMessage(msg.chat.id, fallbackPayment);
  })));

  // DAY 1-7
  bot.onText(/\/day([1-7])/i, createHandler(async (msg, match) => {
    if (!dailyCommands?.handle) {
      return bot.sendMessage(msg.chat.id, "⚠️ មាតិកាថ្ងៃនេះមិនទាន់មានទេ។");
    }
    await dailyCommands.handle(msg, match, bot);
  }, { requiresPaid: true }));

  // Extended 8-30
  bot.onText(/\/extended(\d+)/i, createHandler(async (msg, match) => {
    const day = parseInt(match[1], 10);
    if (isNaN(day) || day < 8 || day > 30) {
      return bot.sendMessage(msg.chat.id, "❌ មាតិកាបន្ថែមគឺសម្រាប់ថ្ងៃទី ៨-៣០ ប៉ុណ្ណោះ។");
    }
    if (!extendedContent?.handleExtendedDay) {
      return bot.sendMessage(msg.chat.id, "⚠️ មាតិកាបន្ថែមមិនទាន់មានទេ។");
    }
    await extendedContent.handleExtendedDay(msg, bot, day);
  }, { requiresPaid: true }));

  // VIP
  bot.onText(/\/vip$/i, createHandler(vipCommands?.info, { requiresPaid: true }));
  bot.onText(/\/vip_program_info/i, createHandler(vipCommands?.info, { requiresPaid: true }));

  // PREVIEW
  bot.onText(/\/preview$/i, createHandler(previewCommands?.preview || (async (msg) => {
    await bot.sendMessage(msg.chat.id, "🔓 Preview available soon.");
  })));

  bot.onText(/\/preview_day1/i, createHandler(previewCommands?.previewDay1));
  bot.onText(/\/preview_tools/i, createHandler(previewCommands?.previewTools));
  bot.onText(/\/preview_results/i, createHandler(previewCommands?.previewResults));
  bot.onText(/\/preview_journey/i, createHandler(previewCommands?.previewJourney));
  bot.onText(/\/preview_before_after/i, createHandler(previewCommands?.previewBeforeAfter));
  bot.onText(/\/preview_transformation/i, createHandler(previewCommands?.previewTransformation));

  // FREE TOOLS / QUIZ
  bot.onText(/\/financial_quiz/i, createHandler(financialQuiz?.startQuiz));
  bot.onText(/\/health_check/i, createHandler(financialQuiz?.startQuiz));

  bot.onText(/\/calculate_daily/i, createHandler(freeTools?.calculateDaily));
  bot.onText(/\/find_leaks/i, createHandler(freeTools?.findLeaks));
  bot.onText(/\/savings_potential/i, createHandler(freeTools?.savingsPotential));
  bot.onText(/\/income_analysis/i, createHandler(freeTools?.incomeAnalysis));

  // BADGES / PROGRESS (paid)
  bot.onText(/\/badges/i, createHandler(badgesCommands?.showBadges, { requiresPaid: true }));
  bot.onText(/\/progress/i, createHandler(badgesCommands?.showProgress || progressTracker?.showProgress, { requiresPaid: true }));
  bot.onText(/\/milestones/i, createHandler(badgesCommands?.showMilestones, { requiresPaid: true }));
  bot.onText(/\/streak/i, createHandler(badgesCommands?.showStreak, { requiresPaid: true }));

  // QUOTES
  bot.onText(/\/quote$/i, createHandler(quotesCommands?.dailyQuote));
  bot.onText(/\/wisdom/i, createHandler(quotesCommands?.randomWisdom));

  // BOOKING
  bot.onText(/\/book_session/i, createHandler(bookingCommands?.showBookingSlots, { requiresPaid: true }));

  // TIERS
  bot.onText(/\/tier_features/i, createHandler(tierFeatures?.showFeatures));

  // MARKETING
  bot.onText(/\/marketing_hub/i, createHandler(marketingContent?.marketingHub, { requiresAdmin: true }));
  bot.onText(/\/post_success_story/i, createHandler(marketingContent?.postSuccessStory, { requiresAdmin: true }));
  bot.onText(/\/post_program_promo/i, createHandler(marketingContent?.postProgramPromo, { requiresAdmin: true }));
  bot.onText(/\/launch_flash_sale/i, createHandler(marketingContent?.launchFlashSale, { requiresAdmin: true }));
  bot.onText(/\/content_week/i, createHandler(marketingContent?.contentWeek, { requiresAdmin: true }));
  bot.onText(/\/send_newsletter/i, createHandler(marketingContent?.sendNewsletter, { requiresAdmin: true }));
  bot.onText(/\/marketing_stats/i, createHandler(marketingContent?.marketingStats, { requiresAdmin: true }));
  bot.onText(/\/roi_analysis/i, createHandler(marketingContent?.roiAnalysis, { requiresAdmin: true }));
  bot.onText(/\/referral_program/i, createHandler(marketingContent?.referralProgram, { requiresAdmin: true }));

  // 30-Day Admin
  bot.onText(/\/admin_content_stats/i, createHandler(thirtyDayAdmin?.contentStats, { requiresAdmin: true }));
  bot.onText(/\/admin_bulk_send/i, createHandler(thirtyDayAdmin?.sendBulkContent, { requiresAdmin: true }));
  bot.onText(/\/admin_content_calendar/i, createHandler(thirtyDayAdmin?.contentCalendar, { requiresAdmin: true }));
  bot.onText(/\/admin_scheduler_status/i, createHandler(thirtyDayAdmin?.schedulerStatus, { requiresAdmin: true }));

  // Tools & Templates (Admin)
  bot.onText(/\/admin_daily_template/i, createHandler(toolsTemplates?.generateDailyTemplate, { requiresAdmin: true }));
  bot.onText(/\/admin_weekly_template/i, createHandler(toolsTemplates?.generateWeeklyTemplate, { requiresAdmin: true }));
  bot.onText(/\/admin_engagement_checklist/i, createHandler(toolsTemplates?.generateEngagementChecklist, { requiresAdmin: true }));
  bot.onText(/\/admin_onboarding_template/i, createHandler(toolsTemplates?.generateOnboardingTemplate, { requiresAdmin: true }));

  // Admin Core
  bot.onText(/\/admin_menu|\/admin$/i, createHandler(async (msg) => {
    const menu = `🔧 ADMIN QUICK MENU

📱 Daily Ops
• /admin_activity
• /admin_stuck
• /admin_uploads
• /admin_followup

📊 Analytics
• /admin_analytics
• /admin_completion
• /admin_completed

💬 Actions
• /admin_progress [UserID]
• /admin_message [UserID] [text]
• /admin_remind [day]
• /admin_confirm_payment [UserID]

📋 Reports
• /admin_users
• /admin_export
• /admin_photos [UserID]

🧰 Tools
• /admin_daily_template
• /admin_weekly_template
• /admin_engagement_checklist
• /admin_onboarding_template

/system
• /whoami
• /admin_help

30-Day
• /admin_content_stats
• /admin_bulk_send
• /admin_content_calendar
• /admin_scheduler_status`;
    await bot.sendMessage(msg.chat.id, menu);
  }, { requiresAdmin: true }));

  bot.onText(/\/admin_users/i, createHandler(adminCommands?.showUsers, { requiresAdmin: true }));
  bot.onText(/\/admin_progress (.+)/i, createHandler(adminCommands?.checkProgress, { requiresAdmin: true }));
  bot.onText(/\/admin_analytics/i, createHandler(adminCommands?.showAnalytics, { requiresAdmin: true }));
  bot.onText(/\/admin_activity/i, createHandler(adminCommands?.showActivity, { requiresAdmin: true }));
  bot.onText(/\/admin_followup/i, createHandler(adminCommands?.showFollowup, { requiresAdmin: true }));
  bot.onText(/\/admin_message (.+)/i, createHandler(adminCommands?.sendMessage, { requiresAdmin: true }));
  bot.onText(/\/admin_confirm_payment (.+)/i, createHandler(adminCommands?.confirmPayment, { requiresAdmin: true }));
  bot.onText(/\/admin_export/i, createHandler(adminCommands?.exportData, { requiresAdmin: true }));
  bot.onText(/\/admin_help/i, createHandler(adminCommands?.showHelp, { requiresAdmin: true }));

  // Progress Tracker (admin extras)
  bot.onText(/\/admin_stuck/i, createHandler(progressTracker?.showStuckUsers, { requiresAdmin: true }));
  bot.onText(/\/admin_completion/i, createHandler(progressTracker?.showCompletionRates, { requiresAdmin: true }));
  bot.onText(/\/admin_remind (.+)/i, createHandler(progressTracker?.sendManualReminder, { requiresAdmin: true }));
  bot.onText(/\/admin_completed/i, createHandler(progressTracker?.showCompletedUsers, { requiresAdmin: true }));
  bot.onText(/\/admin_uploads/i, createHandler(progressTracker?.showUploadTracking, { requiresAdmin: true }));
  bot.onText(/\/admin_photos (.+)/i, createHandler(progressTracker?.showUserPhotos, { requiresAdmin: true }));

  // FAQ / STATUS / WHOAMI
  bot.onText(/\/faq|FAQ|faq/i, async (msg) => {
    if (isDuplicateMessage(msg)) return;
    try {
      const user = await getUserByTelegramId(msg.from.id);
      const isPaid = isTrue(user?.is_paid) || isTrue(user?.isPaid);
      const isVip = user?.tier === "vip";
      const isPremiumOrVip = ["premium", "vip"].includes(user?.tier);

      const message = await accessControl?.getTierSpecificFAQ?.(
        msg.from.id,
        isPaid,
        isPremiumOrVip,
        isVip
      );
      if (message) {
        await sendLongMessage(bot, msg.chat.id, message, { parse_mode: "Markdown" }, MESSAGE_CHUNK_SIZE);
      } else {
        await bot.sendMessage(
          msg.chat.id,
          isPaid
            ? "❓ FAQ សម្រាប់សមាជិកត្រូវបានកំពុងរៀបចំ។"
            : "❓ FAQ សម្រាប់អ្នកមិនទាន់ទូទាត់ត្រូវបានកំពុងរៀបចំ។"
        );
      }
    } catch (e) {
      console.error("/faq error:", e);
      await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
    }
  });

  bot.onText(/\/status|ស្ថានភាព/i, async (msg) => {
    if (isDuplicateMessage(msg)) return;
    try {
      const user = await getUserByTelegramId(msg.from.id);
      if (!user) {
        await bot.sendMessage(msg.chat.id, "អ្នកមិនទាន់ចុះឈ្មោះទេ។ ប្រើ /start ដើម្បីចាប់ផ្តើម។");
        return;
      }
      const isPaid = isTrue(user?.is_paid) || isTrue(user?.isPaid);
      const progress = await getProgressByUserId(msg.from.id);
      let text = `📊 ស្ថានភាពគណនីរបស់អ្នក:

👤 ${user.first_name || user.firstName || "User"}
💰 ${isPaid ? "✅ បានទូទាត់" : "❌ មិនទាន់ទូទាត់"}
🎯 កម្រិត: ${user.tier || "Essential"}`;

      if (isPaid) {
        const currentDay =
          progress?.current_day ||
          progress?.currentDay ||
          0;
        text += `\n📈 ថ្ងៃបច្ចុប្បន្ន: Day ${currentDay}\n🎯 អាចចូលប្រើប្រាស់កម្មវិធីបានពេញលេញ!`;
      } else {
        text += `\n🔒 សូមទូទាត់ដើម្បីចូលប្រើ Day 1-7\n💡 /pricing`;
      }
      await bot.sendMessage(msg.chat.id, text);
    } catch (e) {
      console.error("/status error:", e);
      await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
    }
  });

  bot.onText(/\/whoami/i, async (msg) => {
    if (isDuplicateMessage(msg)) return;
    try {
      const uid = msg.from.id;
      const user = await getUserByTelegramId(uid);
      const adminId = parseInt(process.env.ADMIN_CHAT_ID || "0", 10);
      const secondaryAdminId = parseInt(process.env.SECONDARY_ADMIN_CHAT_ID || "0", 10);
      const isAdmin =
        uid === adminId ||
        uid === secondaryAdminId ||
        isTrue(user?.is_admin);
      const isPaid = isTrue(user?.is_paid) || isTrue(user?.isPaid);
      let res = `🔍 ព័ត៌មានរបស់អ្នក:

• Chat ID: ${msg.chat.id}
• User ID: ${uid}
• ឈ្មោះ: ${msg.from.first_name || "N/A"}
• Username: ${msg.from.username ? "@" + msg.from.username : "N/A"}
• Admin: ${isAdmin ? "✅" : "❌"}`;

      if (user) {
        res += `
• ចុះឈ្មោះ: ✅
• ទូទាត់: ${isPaid ? "✅" : "❌"}
• កម្រិត: ${user.tier || "Essential"}`;
      } else {
        res += `
• ចុះឈ្មោះ: ❌`;
      }
      await bot.sendMessage(msg.chat.id, res);
    } catch (e) {
      console.error("/whoami error:", e);
      await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
    }
  });

  // TEST
  bot.onText(/\/test/i, async (msg) => {
    if (isDuplicateMessage(msg)) return;
    await bot.sendMessage(msg.chat.id, "✅ Bot online & stable.");
  });

  // Natural-language message handler (VIP APPLY, day complete, etc.)
  bot.on("message", async (msg) => {
    if (!msg.text || msg.text.startsWith("/")) return;
    if (isDuplicateMessage(msg)) return;

    const text = msg.text.trim();
    const lc = text.toLowerCase();
    const uid = msg.from.id;
    const user = await getUserByTelegramId(uid);
    const isPaid = isTrue(user?.is_paid) || isTrue(user?.isPaid);

    // Financial quiz flow
    if (financialQuiz?.processQuizResponse) {
      const handled = await financialQuiz.processQuizResponse(msg, bot);
      if (handled) return;
    }

    // Free tools flow
    if (freeTools?.processToolResponse) {
      const handled = await freeTools.processToolResponse(msg, bot, user);
      if (handled) return;
    }

    // VIP APPLY
    if (lc === "vip apply") {
      if (!isPaid) {
        await bot.sendMessage(
          msg.chat.id,
          "🔒 សូមទូទាត់មុនដើម្បីចូលរួមកម្មវិធី VIP។ /pricing"
        );
        return;
      }
      if (vipCommands?.apply) {
        return vipCommands.apply(msg, bot);
      }
      return bot.sendMessage(
        msg.chat.id,
        `🌟 VIP APPLICATION

សូមផ្ញើព័ត៌មាន:
1) ឈ្មោះពេញ
2) អាជីវកម្ម
3) គោលដៅហិរញ្ញវត្ថុ
4) លេខទូរស័ព្ទ

💰 VIP: $197
📞 Admin នឹងទាក់ទងអ្នក`
      );
    }

    // ready for day 1
    if (lc === "ready for day 1") {
      if (!isPaid) {
        await bot.sendMessage(msg.chat.id, "🔒 /pricing ដើម្បីទូទាត់សិន");
        return;
      }
      await upsertProgress(uid, { ready_for_day_1: true, current_day: 1, readyForDay1: true, currentDay: 1 });
      await bot.sendMessage(
        msg.chat.id,
        `🎉 ត្រៀមរួច! ចាប់ផ្តើមថ្ងៃទី១: /day1\n(ថ្ងៃទី១ នឹងផ្ញើស្វ័យប្រវត្តិនៅម៉ោង ៩ ព្រឹកថ្ងៃស្អែកផងដែរ) `
      );
      return;
    }

    // "DAY X COMPLETE"
    const m = text.toUpperCase().match(/DAY\s*(\d+)\s*COMPLETE/);
    if (m) {
      const dayNumber = parseInt(m[1], 10);
      const nextDay = Math.min(dayNumber + 1, 7);
      await upsertProgress(uid, {
        [`day${dayNumber}Completed`]: true,
        [`day${dayNumber}CompletedAt`]: new Date(),
        current_day: nextDay,
        currentDay: nextDay,
      });

      const reaction = emojiReactions?.lessonCompleteReaction
        ? emojiReactions.lessonCompleteReaction(dayNumber)
        : `🎉 អបអរសាទរ! Day ${dayNumber} complete!`;

      await bot.sendMessage(msg.chat.id, reaction);

      const celebrate = celebrations?.dayCompleteCelebration
        ? celebrations.dayCompleteCelebration(dayNumber)
        : `🎊 អ្នកបានបញ្ចប់ថ្ងៃទី ${dayNumber}! សូមបន្តទៅថ្ងៃបន្ទាប់!`;

      await sendLongMessage(
        bot,
        msg.chat.id,
        celebrate,
        {},
        MESSAGE_CHUNK_SIZE
      );

      if (dayNumber < 7) {
        await bot.sendMessage(
          msg.chat.id,
          `🚀 ត្រៀមរួចសម្រាប់ថ្ងៃទី ${nextDay}? /day${nextDay}`
        );
      } else {
        await bot.sendMessage(
          msg.chat.id,
          `🎊 អ្នកបានបញ្ចប់កម្មវិធី! សរសេរ "PROGRAM COMPLETE"`
        );
      }
      return;
    }

    if (lc === "program complete") {
      await upsertProgress(uid, {
        programCompleted: true,
        programCompletedAt: new Date(),
      });

      const programCelebration = celebrations?.programCompleteCelebration
        ? celebrations.programCompleteCelebration(
            `🎯 ជំហានបន្ទាប់:
1) ផែនការ 30 ថ្ងៃ
2) ពិនិត្យប្រចាំសប្តាហ៍
3) VIP Advanced Program → សួរ "VIP PROGRAM INFO"`
          )
        : `🎊 អបអរសាទរ! អ្នកបានបញ្ចប់កម្មវិធី 7-Day Money Flow Reset™!

🎯 ជំហានបន្ទាប់:
1) ផែនការ 30 ថ្ងៃ
2) ពិនិត្យប្រចាំសប្តាហ៍
3) VIP Advanced Program → សួរ "VIP PROGRAM INFO"`;

      await sendLongMessage(bot, msg.chat.id, programCelebration, {}, MESSAGE_CHUNK_SIZE);

      if (vipCommands?.offer) {
        await vipCommands.offer(msg, bot);
      }
      return;
    }

    if (lc === "capital clarity") {
      if (!isPaid) {
        await bot.sendMessage(msg.chat.id, "🔒 /pricing to pay first.");
        return;
      }
      if (vipCommands?.capitalClarity) {
        await vipCommands.capitalClarity(msg, bot);
      } else {
        await bot.sendMessage(
          msg.chat.id,
          `🏛️ Capital Clarity - Private Capital Strategy
💰 $197
📞 @Chendasum`
        );
      }
      return;
    }
  });

  console.log("✅ All commands registered");
}

// -----------------------------------------------------------------------------
// Routes
// -----------------------------------------------------------------------------
app.get("/", (req, res) => {
  res.json({
    name: "7-Day Money Flow Reset™ Telegram Bot",
    status: "running",
    time: new Date().toISOString(),
    features: [
      "7-Day Program",
      "30-Day Extended",
      "VIP",
      "Payment",
      "Admin Dashboard",
      "Marketing Automation",
      "Progress Tracking",
      "Khmer Support",
      "Content Scheduler",
      "Free Tools & Quiz",
      "Access Control",
      "Conversion Optimization",
    ],
  });
});

app.get("/ping", (req, res) => res.send("Pong!"));

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    time: new Date().toISOString(),
    bot_initialized: !!bot,
  });
});

app.get("/analytics", async (req, res) => {
  try {
    if (analytics?.getStats) {
      const stats = await analytics.getStats();
      res.json(stats);
    } else {
      res.status(503).json({ message: "Analytics module not available" });
    }
  } catch (e) {
    console.error("Analytics error:", e);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

app.post("/webhook/payment", async (req, res) => {
  try {
    const { userId, amount, status, transactionId } = req.body;
    console.log("Payment webhook:", req.body);
    if (status === "completed" && amount >= 24) {
      if (paymentCommands?.confirmPayment) {
        await paymentCommands.confirmPayment(bot, userId, transactionId);
      } else {
        console.warn("paymentCommands.confirmPayment not found");
      }
    }
    res.status(200).json({ success: true });
  } catch (e) {
    console.error("Payment webhook error:", e);
    res.status(500).json({ error: "Internal error" });
  }
});

// -----------------------------------------------------------------------------
// Start
// -----------------------------------------------------------------------------
(async () => {
  await initWebhook();

  // Initialize services
  try {
    scheduler?.init?.(bot, User, Progress);
    analytics?.init?.(User);
    accessControl?.init?.(User);
    conversionOptimizer?.init?.(bot, User);
  } catch (e) {
    console.error("Service init error:", e);
  }

  // CRON (Cambodia 9 AM daily delivery, etc.)
  if (scheduler?.sendDailyMessages) {
    cron.schedule("0 9 * * *", async () => {
      console.log("🕘 Cron: sending daily messages");
      try {
        await scheduler.sendDailyMessages(bot);
      } catch (e) {
        console.error("Cron sendDailyMessages error:", e);
      }
    });
  }

  // Content Scheduler
  try {
    if (ContentScheduler) {
      const cs = new ContentScheduler(bot);
      cs.start();
      console.log("✅ Content Scheduler started");
    }
  } catch (e) {
    console.error("ContentScheduler error:", e);
  }

  registerCommands();

  const PORT = process.env.PORT || 5000;
  const HOST = process.env.HOST || "0.0.0.0";
  const server = app.listen(PORT, HOST, () => {
    console.log(`🚀 Server running on ${HOST}:${PORT}`);
    console.log("🔥 7-Day Money Flow automation ACTIVE!");
  });

  // Graceful shutdown
  process.on("SIGTERM", () => {
    console.log("SIGTERM received");
    server.close(() => process.exit(0));
  });
  process.on("SIGINT", () => {
    console.log("SIGINT received");
    server.close(() => process.exit(0));
  });
  process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
    process.exit(1);
  });
  process.on("unhandledRejection", (reason, p) => {
    console.error("Unhandled Rejection:", p, "reason:", reason);
    process.exit(1);
  });
})();