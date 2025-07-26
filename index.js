/**
 * 7-Day Money Flow Reset™ Bot — FULL FEATURE, RAILWAY-READY
 * --------------------------------------------------------
 * This file merges:
 *  - indexlast-Work halffull.js (Railway-compatible skeleton)
 *  - index102.js (full feature set: 7-Day + 30-Day, marketing hub, admin suite, tools/templates, etc.)
 *
 * Features
 * --------
 * ✔ Webhook mode with auto delete/set on every boot (APP_URL + /webhook/SECRET)
 * ✔ Duplicate-message protection (webhook safe)
 * ✔ Daily cron (09:00) + ContentScheduler service
 * ✔ Full command matrix:
 *    - /start, /help, /pricing, /payment
 *    - /day1 - /day7 (core program)
 *    - /extended8 - /extended30 (30-day extension)
 *    - /vip, /vip_program_info, "VIP APPLY"
 *    - Admin suite: /admin_menu, /admin_help, /admin_users, /admin_progress, /admin_analytics, ... (complete)
 *    - Progress & badges: /progress, /badges, /milestones, /streak
 *    - Marketing hub: /marketing_hub, /post_success_story, /roi_analysis, ...
 *    - Free tools & quiz: /financial_quiz, /calculate_daily, /find_leaks, /savings_potential, /income_analysis
 *    - Tools & templates: /admin_daily_template, /admin_weekly_template, ...
 *
 * ENV (Railway variables)
 * -----------------------
 * BOT_TOKEN=xxxxxxxxxxxxxxxx
 * APP_URL=https://<your-service>.up.railway.app
 * WEBHOOK_SECRET=some-long-secret
 * ADMIN_CHAT_ID=484389665
 * PORT=3000 (Railway provides automatically, keep fallback)
 */

require("dotenv").config();

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const cron = require("node-cron");
const bodyParser = require("body-parser");

// ---------- Sanity checks ----------
const {
  BOT_TOKEN,
  APP_URL,
  ADMIN_CHAT_ID,
  WEBHOOK_SECRET = "secret",
  PORT = 3000,
} = process.env;

if (!BOT_TOKEN) {
  console.error("❌ BOT_TOKEN missing. Please set in Railway variables.");
  process.exit(1);
}
if (!APP_URL) {
  console.warn("⚠️ APP_URL is not set. Webhook auto-registration will be skipped.");
}

// ---------- UTF-8 / Khmer Safe ----------
process.env.NODE_ICU_DATA = process.env.NODE_ICU_DATA || "/usr/share/nodejs/node-icu-data";
process.env.LANG = process.env.LANG || "en_US.UTF-8";

// ---------- Helpers ----------
function safeRequire(path, label) {
  try {
    return require(path);
  } catch (e) {
    console.log(`⚠️ Missing or failed to load ${label}: ${path}`);
    return null;
  }
}

function isTrue(val) {
  return val === true || val === "t" || val === "true" || val === 1 || val === "1";
}

// ---------- Models ----------
const User = safeRequire("./models/User", "models/User");
const Progress = safeRequire("./models/Progress", "models/Progress");

// ---------- Commands ----------
const startCommand     = safeRequire("./commands/start", "commands/start");
const dailyCommands    = safeRequire("./commands/daily", "commands/daily");
const paymentCommands  = safeRequire("./commands/payment", "commands/payment");
const vipCommands      = safeRequire("./commands/vip", "commands/vip");
const adminCommands    = safeRequire("./commands/admin", "commands/admin");
const badgesCommands   = safeRequire("./commands/badges", "commands/badges");
const quotesCommands   = safeRequire("./commands/quotes", "commands/quotes");
const bookingCommands  = safeRequire("./commands/booking", "commands/booking");
const tierFeatures     = safeRequire("./commands/tier-features", "commands/tier-features");
const marketingContent = safeRequire("./commands/marketing-content", "commands/marketing-content");
const extendedContent  = safeRequire("./commands/extended-content", "commands/extended-content");
const thirtyDayAdmin   = safeRequire("./commands/30day-admin", "commands/30day-admin");
const previewCommands  = safeRequire("./commands/preview", "commands/preview");
const freeTools        = safeRequire("./commands/free-tools", "commands/free-tools");
const financialQuiz    = safeRequire("./commands/financial-quiz", "commands/financial-quiz");
const toolsTemplates   = safeRequire("./commands/tools-templates", "commands/tools-templates");
const progressTracker  = safeRequire("./commands/progress-tracker", "commands/progress-tracker");

// ---------- Services ----------
const scheduler            = safeRequire("./services/scheduler", "services/scheduler");
const analytics            = safeRequire("./services/analytics", "services/analytics");
const celebrations         = safeRequire("./services/celebrations", "services/celebrations");
const progressBadges       = safeRequire("./services/progress-badges", "services/progress-badges");
const emojiReactions       = safeRequire("./services/emoji-reactions", "services/emoji-reactions");
const AccessControl        = safeRequire("./services/access-control", "services/access-control");
const ContentScheduler     = safeRequire("./services/content-scheduler", "services/content-scheduler");
const ConversionOptimizer  = safeRequire("./services/conversion-optimizer", "services/conversion-optimizer");

// ---------- Utils ----------
let sendLongMessage;
try {
  ({ sendLongMessage } = require("./utils/message-splitter"));
} catch (e) {
  console.log("⚠️ utils/message-splitter missing - using fallback");
  sendLongMessage = async (bot, chatId, text, options = {}, chunk = 4000) => {
    if (text.length <= chunk) return bot.sendMessage(chatId, text, options);
    for (let i = 0; i < text.length; i += chunk) {
      await bot.sendMessage(chatId, text.slice(i, i + chunk), options);
    }
  };
}

const MESSAGE_CHUNK_SIZE = 800;

// ---------- Duplicate Prevention (webhook safe) ----------
const processedMessages = new Set();
const lastProcessTime = {};
function isDuplicateMessage(msg) {
  const id = `${msg.chat.id}-${msg.message_id}`;
  const now = Date.now();
  if (processedMessages.has(id) && lastProcessTime[id] && now - lastProcessTime[id] < 3000) {
    console.log(`[dup] blocked ${id}`);
    return true;
  }
  processedMessages.add(id);
  lastProcessTime[id] = now;
  if (processedMessages.size > 50) {
    const cutoff = now - 30000;
    Object.keys(lastProcessTime).forEach((key) => {
      if (lastProcessTime[key] < cutoff) {
        processedMessages.delete(key);
        delete lastProcessTime[key];
      }
    });
  }
  return false;
}

// ---------- Express + Webhook ----------
const app = express();
app.use(bodyParser.json({ limit: "10mb", type: "*/*" }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use((_, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});

app.get("/", (_, res) => res.send("OK"));
app.get("/health", (_, res) => res.json({ ok: true, ts: Date.now() }));

// Telegram bot
const bot = new TelegramBot(BOT_TOKEN, { webHook: true, onlyFirstMatch: true });

const WEBHOOK_PATH = `/webhook/${WEBHOOK_SECRET}`;
const WEBHOOK_URL = APP_URL ? `${APP_URL}${WEBHOOK_PATH}` : null;

// POST webhook endpoint
app.post(WEBHOOK_PATH, async (req, res) => {
  try {
    await bot.processUpdate(req.body);
    res.sendStatus(200);
  } catch (e) {
    console.error("Webhook handler error:", e);
    res.sendStatus(500);
  }
});

// Auto-register webhook
(async function ensureWebhook() {
  if (!WEBHOOK_URL) {
    console.warn("⚠️ APP_URL is not set. Skipping webhook registration.");
    return;
  }
  try {
    await bot.deleteWebHook({ drop_pending_updates: true });
    console.log("🧹 Old webhook deleted");
    const ok = await bot.setWebHook(WEBHOOK_URL);
    console.log("✅ Webhook set to", WEBHOOK_URL, ok);
  } catch (e) {
    console.error("❌ Failed to register webhook:", e.message);
  }
})();

// ---------- Access & Conversion (safe fallbacks) ----------
const accessControl = AccessControl ? new AccessControl() : {
  getTierSpecificHelp: async () => "Help not available.",
  getTierSpecificFAQ: async () => "FAQ not available."
};
const conversionOptimizer = ConversionOptimizer ? new ConversionOptimizer() : {};

// ---------- Cron / Schedulers ----------
if (scheduler) {
  cron.schedule("0 9 * * *", async () => {
    console.log("🕘 Cron 09:00 — sendDailyMessages");
    try {
      await scheduler.sendDailyMessages(bot);
    } catch (e) {
      console.error("scheduler.sendDailyMessages error:", e);
    }
  });
}

if (ContentScheduler) {
  try {
    const contentScheduler = new ContentScheduler(bot);
    contentScheduler.start();
  } catch (e) {
    console.error("ContentScheduler init error:", e.message);
  }
}

console.log("🤖 Bot online — 7-Day + 30-Day automation READY!");

// ---------- Helpers ----------
const ADMIN_ID = parseInt(ADMIN_CHAT_ID || "0", 10);
const SECONDARY_ADMIN_ID = 484389665;
function isAdmin(userId) {
  return [ADMIN_ID, SECONDARY_ADMIN_ID].includes(Number(userId));
}

async function ensurePaidOrReply(bot, msg, notPaidText = "🔒 សូមទូទាត់មុន ដើម្បីចូលប្រើមុខងារនេះ។ ប្រើ /pricing") {
  if (!User) return true; // If no DB, allow (dev mode)
  const user = await User.findOne?.({ telegram_id: msg.from.id });
  const paid = isTrue(user?.is_paid);
  if (!user || !paid) {
    await bot.sendMessage(msg.chat.id, notPaidText);
    return false;
  }
  return true;
}

// =========================================================
//                     COMMAND HANDLERS
// =========================================================

// /start
bot.onText(/\/start/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    if (startCommand?.handle) return startCommand.handle(msg, bot);
    const fallback = `🌟 សូមស្វាគមន៍មកកាន់ 7-Day Money Flow Reset™!

💰 កម្មវិធីគ្រប់គ្រងលុយ ៧ ថ្ងៃ ជាភាសាខ្មែរ
👉 /pricing  |  /payment  |  /help`;
    await bot.sendMessage(msg.chat.id, fallback);
  } catch (e) {
    console.error("[/start] error:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហាក្នុងការចាប់ផ្តើម។");
  }
});

// /help
bot.onText(/\/help/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    const text = await accessControl.getTierSpecificHelp(msg.from.id);
    await sendLongMessage(bot, msg.chat.id, text, { parse_mode: "Markdown" }, MESSAGE_CHUNK_SIZE);
  } catch (e) {
    console.error("[/help] error:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហាក្នុងការផ្ទុកជំនួយ។");
  }
});

// /pricing
bot.onText(/\/pricing/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    const emergencyPricing = `💰 តម្លៃកម្មវិធី 7-Day Money Flow Reset™

🎯 Essential Program
💵 $24 USD (50% បញ្ចុះតម្លៃ)
🏷️ កូដ: LAUNCH50

💳 ទូទាត់:
• ABA 000 194 742
• ACLEDA 092 798 169
• Wing 102 534 677
• ឈ្មោះ: SUM CHENDA
• Reference: BOT${msg.from.id}

👉 /payment – ការណែនាំទូទាត់`;
    await bot.sendMessage(msg.chat.id, emergencyPricing);
    if (paymentCommands?.pricing) await paymentCommands.pricing(msg, bot);
  } catch (e) {
    console.error("[/pricing] error:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});

// /payment
bot.onText(/\/payment/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    const emergencyPayment = `💳 ការណែនាំទូទាត់

ABA 000 194 742
ACLEDA 092 798 169
Wing 102 534 677
ឈ្មោះ: SUM CHENDA
ចំនួន: $24 USD
Reference: BOT${msg.from.id}

បន្ទាប់ពីទូទាត់៖ ផ្ញើរូបបញ្ជាក់មក @Chendasum`;
    await bot.sendMessage(msg.chat.id, emergencyPayment);
    if (paymentCommands?.instructions) await paymentCommands.instructions(msg, bot);
  } catch (e) {
    console.error("[/payment] error:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});

// /day (intro)
bot.onText(/^\/day$/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    if (!(await ensurePaidOrReply(bot, msg))) return;
    const intro = `✨ 7-Day Money Flow Reset™ ✨

👉 ចាប់ផ្តើម Day 1: /day1
📈 ពិនិត្យវឌ្ឍនភាព: /progress`;
    await sendLongMessage(bot, msg.chat.id, intro, {}, MESSAGE_CHUNK_SIZE);
    if (Progress?.findOne) {
      const progress = await Progress.findOne({ user_id: msg.from.id }) || {};
      if (progress.currentDay && progress.currentDay > 1) {
        await bot.sendMessage(msg.chat.id, `📊 អ្នកកំពុងនៅថ្ងៃ: /day${progress.currentDay}`);
      }
    }
  } catch (e) {
    console.error("[/day] error:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});

// /day1 - /day7
bot.onText(/\/day([1-7])/i, async (msg, match) => {
  if (isDuplicateMessage(msg)) return;
  try {
    if (!(await ensurePaidOrReply(bot, msg))) return;
    if (dailyCommands?.handle) return dailyCommands.handle(msg, match, bot);
    await bot.sendMessage(msg.chat.id, `📚 ថ្ងៃទី ${match[1]} — មាតិកាពេញលេញកំពុងត្រូវបានរៀបចំ។`);
  } catch (e) {
    console.error("[/dayX] error:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});

// /extended8 - /extended30
bot.onText(/\/extended(\d+)/i, async (msg, match) => {
  if (isDuplicateMessage(msg)) return;
  const day = parseInt(match[1], 10);
  if (isNaN(day) || day < 8 || day > 30) {
    return bot.sendMessage(msg.chat.id, "❌ សម្រាប់ថ្ងៃ 8-30 ប៉ុណ្ណោះ");
  }
  try {
    if (!(await ensurePaidOrReply(bot, msg, "🔒 សូមទូទាត់មុន ដើម្បីចូលប្រើមាតិកាបន្ថែម។ /pricing"))) return;
    if (extendedContent?.handleExtendedDay) {
      return extendedContent.handleExtendedDay(msg, bot, day);
    }
    await bot.sendMessage(msg.chat.id, `📚 Extended Day ${day} — កំពុងរៀបចំ`);
  } catch (e) {
    console.error("[/extendedX] error:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});

// VIP
bot.onText(/\/vip$/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    if (!(await ensurePaidOrReply(bot, msg, "🔒 /pricing ដើម្បីទទួលសិទ្ធិ VIP"))) return;
    if (vipCommands?.info) return vipCommands.info(msg, bot);
    const vipFallback = `👑 VIP Program
• 1-on-1 • Capital Strategy • Priority Support
តម្លៃ: $197 — @Chendasum`;
    await bot.sendMessage(msg.chat.id, vipFallback);
  } catch (e) {
    console.error("[/vip] error:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});

bot.onText(/\/vip_program_info/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    if (!(await ensurePaidOrReply(bot, msg, "🔒 /pricing ដើម្បីទទួលសិទ្ធិ VIP"))) return;
    if (vipCommands?.info) return vipCommands.info(msg, bot);
    await bot.sendMessage(msg.chat.id, "👑 VIP Info Coming Soon");
  } catch (e) {
    console.error("[/vip_program_info] error:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});

// VIP APPLY
bot.on("message", async (msg) => {
  if (isDuplicateMessage(msg)) return;
  if (msg.text && msg.text.toUpperCase() === "VIP APPLY") {
    try {
      if (!(await ensurePaidOrReply(bot, msg, "🔒 /pricing ដើម្បីទទួលសិទ្ធិ VIP"))) return;
      if (vipCommands?.apply) return vipCommands.apply(msg, bot);
      await bot.sendMessage(msg.chat.id, "✅ VIP APPLY បានទទួល! @Chendasum នឹងទំនាក់ទំនងអ្នក");
    } catch (e) {
      console.error("[VIP APPLY] error:", e);
      await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា VIP APPLY");
    }
  }
});

// ---------- Admin Suite ----------
bot.onText(/\/admin_menu|\/admin$/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  if (!isAdmin(msg.from.id)) {
    return bot.sendMessage(msg.chat.id, "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះទេ។");
  }
  const menu = `🔧 ADMIN QUICK MENU

📱 Daily:
• /admin_activity
• /admin_stuck
• /admin_uploads
• /admin_followup

📊 Analytics:
• /admin_analytics
• /admin_completion
• /admin_completed

💬 Actions:
• /admin_progress [UserID]
• /admin_message [UserID] [text]
• /admin_remind [day]
• /admin_confirm_payment [UserID]

📋 Reports:
• /admin_users
• /admin_export
• /admin_photos [UserID]

🧰 Tools & Templates:
• /admin_daily_template
• /admin_weekly_template
• /admin_engagement_checklist
• /admin_onboarding_template

🆘 Help:
• /admin_help
• /whoami`;
  await bot.sendMessage(msg.chat.id, menu);
});

bot.onText(/\/admin_help/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  if (!isAdmin(msg.from.id)) return bot.sendMessage(msg.chat.id, "Unauthorized.");
  try {
    if (adminCommands?.showHelp) return adminCommands.showHelp(msg, bot);
    await bot.sendMessage(msg.chat.id, "Admin help coming soon.");
  } catch (e) {
    console.error("[/admin_help] error:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});

bot.onText(/\/whoami/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  await bot.sendMessage(msg.chat.id, `🧍 You are ${msg.from.id} (${msg.from.username || "-"})\nAdmin: ${isAdmin(msg.from.id) ? "YES" : "NO"}`);
});

// Admin routed to adminCommands if exists:
const adminRoute = (regex, fn) => {
  bot.onText(regex, async (msg, match) => {
    if (isDuplicateMessage(msg)) return;
    if (!isAdmin(msg.from.id)) return;
    try {
      if (typeof fn === "function") {
        await fn(msg, match, bot);
      } else {
        await bot.sendMessage(msg.chat.id, "⚠️ This admin command is not available.");
      }
    } catch (e) {
      console.error("Admin command error:", e);
      await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
    }
  });
};

adminRoute(/\/admin_users/i, adminCommands?.showUsers);
adminRoute(/\/admin_progress (.+)/i, adminCommands?.checkProgress);
adminRoute(/\/admin_analytics/i, adminCommands?.showAnalytics);
adminRoute(/\/admin_activity/i, adminCommands?.showActivity);
adminRoute(/\/admin_followup/i, adminCommands?.showFollowup);
adminRoute(/\/admin_confirm_payment (.+)/i, adminCommands?.confirmPayment);
adminRoute(/\/admin_message (.+)/i, adminCommands?.sendMessage);
adminRoute(/\/admin_export/i, adminCommands?.exportData);

// ---------- Progress Tracking (Admin) ----------
adminRoute(/\/admin_stuck/i, progressTracker?.showStuckUsers);
adminRoute(/\/admin_completion/i, progressTracker?.showCompletionRates);
adminRoute(/\/admin_completed/i, progressTracker?.showCompletedUsers);
adminRoute(/\/admin_remind (.+)/i, progressTracker?.sendManualReminder);
adminRoute(/\/admin_uploads/i, progressTracker?.showUploadTracking);
adminRoute(/\/admin_photos (.+)/i, progressTracker?.showUserPhotos);

// ---------- Tools & Templates ----------
adminRoute(/\/admin_daily_template/i, toolsTemplates?.generateDailyTemplate);
adminRoute(/\/admin_weekly_template/i, toolsTemplates?.generateWeeklyTemplate);
adminRoute(/\/admin_engagement_checklist/i, toolsTemplates?.generateEngagementChecklist);
adminRoute(/\/admin_onboarding_template/i, toolsTemplates?.generateOnboardingTemplate);

// ---------- Marketing Hub ----------
bot.onText(/\/marketing_hub/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try { await marketingContent?.marketingHub?.(msg, bot); }
  catch (e) { console.error(e); bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។"); }
});
bot.onText(/\/post_success_story/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try { await marketingContent?.postSuccessStory?.(msg, bot); }
  catch (e) { console.error(e); bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។"); }
});
bot.onText(/\/post_program_promo/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try { await marketingContent?.postProgramPromo?.(msg, bot); }
  catch (e) { console.error(e); bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។"); }
});
bot.onText(/\/launch_flash_sale/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try { await marketingContent?.launchFlashSale?.(msg, bot); }
  catch (e) { console.error(e); bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។"); }
});
bot.onText(/\/content_week/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try { await marketingContent?.contentWeek?.(msg, bot); }
  catch (e) { console.error(e); bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។"); }
});
bot.onText(/\/send_newsletter/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try { await marketingContent?.sendNewsletter?.(msg, bot); }
  catch (e) { console.error(e); bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។"); }
});
bot.onText(/\/marketing_stats/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try { await marketingContent?.marketingStats?.(msg, bot); }
  catch (e) { console.error(e); bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។"); }
});
bot.onText(/\/roi_analysis/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try { await marketingContent?.roiAnalysis?.(msg, bot); }
  catch (e) { console.error(e); bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។"); }
});
bot.onText(/\/referral_program/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try { await marketingContent?.referralProgram?.(msg, bot); }
  catch (e) { console.error(e); bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។"); }
});

// ---------- 30-Day Admin ----------
adminRoute(/\/admin_content_stats/i, thirtyDayAdmin?.contentStats);
adminRoute(/\/admin_bulk_send/i, thirtyDayAdmin?.sendBulkContent);
adminRoute(/\/admin_content_calendar/i, thirtyDayAdmin?.contentCalendar);
adminRoute(/\/admin_scheduler_status/i, thirtyDayAdmin?.schedulerStatus);

// ---------- Preview System ----------
bot.onText(/\/preview$/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try { await previewCommands?.preview?.(msg, bot); }
  catch (e) { console.error(e); bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។"); }
});
bot.onText(/\/preview_day1/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try { await previewCommands?.previewDay1?.(msg, bot); }
  catch (e) { console.error(e); bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។"); }
});
bot.onText(/\/preview_tools/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try { await previewCommands?.previewTools?.(msg, bot); }
  catch (e) { console.error(e); bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។"); }
});
bot.onText(/\/preview_results/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try { await previewCommands?.previewResults?.(msg, bot); }
  catch (e) { console.error(e); bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។"); }
});
bot.onText(/\/preview_journey/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try { await previewCommands?.previewJourney?.(msg, bot); }
  catch (e) { console.error(e); bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។"); }
});
bot.onText(/\/preview_before_after/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try { await previewCommands?.previewBeforeAfter?.(msg, bot); }
  catch (e) { console.error(e); bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។"); }
});
bot.onText(/\/preview_transformation/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try { await previewCommands?.previewTransformation?.(msg, bot); }
  catch (e) { console.error(e); bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។"); }
});

// ---------- Financial Quiz & Free Tools ----------
bot.onText(/\/financial_quiz|\/health_check/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try { await financialQuiz?.startQuiz?.(msg, bot); }
  catch (e) { console.error(e); bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។"); }
});
bot.onText(/\/calculate_daily/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try { await freeTools?.calculateDaily?.(msg, bot); }
  catch (e) { console.error(e); bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។"); }
});
bot.onText(/\/find_leaks/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try { await freeTools?.findLeaks?.(msg, bot); }
  catch (e) { console.error(e); bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។"); }
});
bot.onText(/\/savings_potential/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try { await freeTools?.savingsPotential?.(msg, bot); }
  catch (e) { console.error(e); bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។"); }
});
bot.onText(/\/income_analysis/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try { await freeTools?.incomeAnalysis?.(msg, bot); }
  catch (e) { console.error(e); bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។"); }
});

// ---------- Badges / Progress ----------
bot.onText(/\/badges/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    if (!(await ensurePaidOrReply(bot, msg, "🔒 /pricing ដើម្បីមើល badges"))) return;
    await badgesCommands?.showBadges?.(msg, bot);
  } catch (e) {
    console.error(e); bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/progress/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    if (!(await ensurePaidOrReply(bot, msg, "🔒 /pricing ដើម្បីមើលការរីកចម្រើន"))) return;
    await badgesCommands?.showProgress?.(msg, bot);
  } catch (e) {
    console.error(e); bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/milestones/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    if (!(await ensurePaidOrReply(bot, msg, "🔒 /pricing ដើម្បីមើលសមិទ្ធផល"))) return;
    await badgesCommands?.showMilestones?.(msg, bot);
  } catch (e) {
    console.error(e); bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/streak/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    if (!(await ensurePaidOrReply(bot, msg, "🔒 /pricing ដើម្បីមើល streak"))) return;
    await badgesCommands?.showStreak?.(msg, bot);
  } catch (e) {
    console.error(e); bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});

// ---------- Start Express ----------
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server listening on :${PORT}`);
});

// ---------- Crash Safety ----------
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});
process.on("unhandledRejection", (reason, p) => {
  console.error("Unhandled Rejection:", reason, p);
  process.exit(1);
});
