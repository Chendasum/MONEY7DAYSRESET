/**
 * 7-Day Money Flow Reset™ — FULL FEATURE, RAILWAY-READY
 * Combines your halffull index + full features from index102.js
 */

require("dotenv").config();

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const cron = require("node-cron");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

// ---------- Safety Checks ----------
const { BOT_TOKEN, APP_URL, ADMIN_CHAT_ID, WEBHOOK_SECRET = "secret" } = process.env;
if (!BOT_TOKEN) {
  console.error("❌ BOT_TOKEN missing. Add it to Railway Variables.");
  process.exit(1);
}
if (!APP_URL) {
  console.warn("⚠️ APP_URL not set. Webhook won't be auto-registered. Set it to your Railway public URL.");
}

// ---------- UTF-8 / Khmer Safe ----------
process.env.NODE_ICU_DATA = process.env.NODE_ICU_DATA || "/usr/share/nodejs/node-icu-data";
process.env.LANG = process.env.LANG || "en_US.UTF-8";

// ---------- Models ----------
let User, Progress;
try { User = require("./models/User"); } catch (e) { console.log("⚠️ models/User missing"); }
try { Progress = require("./models/Progress"); } catch (e) { console.log("⚠️ models/Progress missing"); }

// ---------- Commands (try/catch so bot never dies) ----------
function safeRequire(p, label) {
  try { return require(p); } catch (e) { console.log(`⚠️ ${label} missing: ${p}`); return null; }
}

const startCommand       = safeRequire("./commands/start", "start.js");
const dailyCommands      = safeRequire("./commands/daily", "daily.js");
const paymentCommands    = safeRequire("./commands/payment", "payment.js");
const vipCommands        = safeRequire("./commands/vip", "vip.js");
const adminCommands      = safeRequire("./commands/admin", "admin.js");
const badgesCommands     = safeRequire("./commands/badges", "badges.js");
const quotesCommands     = safeRequire("./commands/quotes", "quotes.js");
const bookingCommands    = safeRequire("./commands/booking", "booking.js");
const tierFeatures       = safeRequire("./commands/tier-features", "tier-features.js");
const marketingCommands  = safeRequire("./commands/marketing", "marketing.js");
const marketingContent   = safeRequire("./commands/marketing-content", "marketing-content.js");
const extendedContent    = safeRequire("./commands/extended-content", "extended-content.js");
const thirtyDayAdmin     = safeRequire("./commands/30day-admin", "30day-admin.js");
const previewCommands    = safeRequire("./commands/preview", "preview.js");
const freeTools          = safeRequire("./commands/free-tools", "free-tools.js");
const financialQuiz      = safeRequire("./commands/financial-quiz", "financial-quiz.js");
const toolsTemplates     = safeRequire("./commands/tools-templates", "tools-templates.js");
const progressTracker    = safeRequire("./commands/progress-tracker", "progress-tracker.js");

// ---------- Services ----------
const scheduler              = safeRequire("./services/scheduler", "services/scheduler.js");
const analytics              = safeRequire("./services/analytics", "services/analytics.js");
const celebrations           = safeRequire("./services/celebrations", "services/celebrations.js");
const progressBadgesService  = safeRequire("./services/progress-badges", "services/progress-badges.js");
const emojiReactions         = safeRequire("./services/emoji-reactions", "services/emoji-reactions.js");
const AccessControl          = safeRequire("./services/access-control", "services/access-control.js");
const ContentScheduler       = safeRequire("./services/content-scheduler", "services/content-scheduler.js");
const ConversionOptimizer    = safeRequire("./services/conversion-optimizer", "services/conversion-optimizer.js");

// ---------- Utils ----------
let sendLongMessage;
try { ({ sendLongMessage } = require("./utils/message-splitter")); }
catch (e) {
  console.log("⚠️ utils/message-splitter missing, using fallback");
  sendLongMessage = async (bot, chatId, text, options = {}, chunk = 4000) => {
    if (text.length <= chunk) return bot.sendMessage(chatId, text, options);
    for (let i = 0; i < text.length; i += chunk) {
      await bot.sendMessage(chatId, text.slice(i, i + chunk), options);
    }
  };
}

const MESSAGE_CHUNK_SIZE = 800;

// ---------- Duplicate Prevention ----------
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
    Object.keys(lastProcessTime).forEach(key => {
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

// Health
app.get("/", (_, res) => res.send("OK"));
app.get("/health", (_, res) => res.json({ ok: true, ts: Date.now() }));

// Telegram
const bot = new TelegramBot(BOT_TOKEN, { webHook: true, onlyFirstMatch: true });
const WEBHOOK_PATH = `/webhook/${WEBHOOK_SECRET || "secret"}`;
if (APP_URL) {
  // Register webhook at boot
  (async () => {
    try {
      await bot.deleteWebHook();
      console.log("🧹 Old webhook deleted");
    } catch (e) {
      console.log("Webhook delete failed (ok):", e.message);
    }
    try {
      const url = `${APP_URL}${WEBHOOK_PATH}`;
      const ok = await bot.setWebHook(url);
      console.log("✅ Webhook set:", ok, url);
    } catch (e) {
      console.error("❌ setWebHook failed:", e.message);
    }
  })();
}

app.post(WEBHOOK_PATH, async (req, res) => {
  try {
    await bot.processUpdate(req.body);
    res.sendStatus(200);
  } catch (e) {
    console.error("Webhook handler error:", e);
    res.sendStatus(500);
  }
});

// ---------- Access / Conversion (safe fallbacks) ----------
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
let contentScheduler;
if (ContentScheduler) {
  try {
    contentScheduler = new ContentScheduler(bot);
    contentScheduler.start();
  } catch (e) {
    console.error("ContentScheduler init error:", e);
  }
}

console.log("🤖 Bot online — 7-Day + 30-Day automation READY!");

// ============ COMMANDS ============

// /start
bot.onText(/\/start/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    if (startCommand?.handle) return startCommand.handle(msg, bot);
    await bot.sendMessage(msg.chat.id,
      `🌟 សូមស្វាគមន៍មកកាន់ 7-Day Money Flow Reset™

💰 កម្មវិធីគ្រប់គ្រងលុយ ៧ ថ្ងៃ
👉 /pricing | /payment`);
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

// /pricing (emergency fallback + delegated)
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
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ ទាក់ទង @Chendasum");
  }
});

// /payment (emergency + delegated)
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
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ ទាក់ទង @Chendasum");
  }
});

// /day (intro)
bot.onText(/^\/day$/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    const chatId = msg.chat.id;
    const user = await (User?.findOne?.({ telegram_id: msg.from.id }) || null);
    const isPaid = user?.is_paid === true || user?.is_paid === "t";
    if (!user || !isPaid) {
      return bot.sendMessage(chatId, "🔒 សូមទូទាត់មុន (/pricing) ដើម្បីចូលកម្មវិធី។");
    }

    const intro = `✨ 7-Day Money Flow Reset™ ✨

👉 ចាប់ផ្តើម Day 1: /day1
📈 ពិនិត្យវឌ្ឍនភាព: /progress`;
    await sendLongMessage(bot, chatId, intro, {}, MESSAGE_CHUNK_SIZE);

    if (Progress?.findOne) {
      const progress = await Progress.findOne({ user_id: msg.from.id }) || {};
      if (progress.currentDay && progress.currentDay > 1) {
        await bot.sendMessage(chatId, `📊 អ្នកកំពុងនៅថ្ងៃ: /day${progress.currentDay}`);
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
    const user = await (User?.findOne?.({ telegram_id: msg.from.id }) || null);
    const isPaid = user?.is_paid === true || user?.is_paid === "t";
    if (!user || !isPaid) {
      return bot.sendMessage(msg.chat.id, "🔒 សូមទូទាត់មុន (/pricing) ដើម្បីចូលកម្មវិធី។");
    }
    if (dailyCommands?.handle) return dailyCommands.handle(msg, match, bot);

    // fallback
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
    const user = await (User?.findOne?.({ telegram_id: msg.from.id }) || null);
    const isPaid = user?.is_paid === true || user?.is_paid === "t";
    if (!user || !isPaid) {
      return bot.sendMessage(msg.chat.id, "🔒 សូមទូទាត់មុន (/pricing) ដើម្បីចូលប្រើមាតិកាបន្ថែម។");
    }
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
    const user = await (User?.findOne?.({ telegram_id: msg.from.id }) || null);
    const isPaid = user?.is_paid === true || user?.is_paid === "t";
    if (!user || !isPaid) {
      return bot.sendMessage(msg.chat.id, "🔒 សូមទូទាត់មុន (/pricing) ដើម្បីចូល VIP។");
    }
    if (vipCommands?.info) return vipCommands.info(msg, bot);

    const vipMessage = `👑 VIP Program
• 1-on-1
• Capital Strategy
• Priority Support

តម្លៃ: $197
@Chendasum`;
    await bot.sendMessage(msg.chat.id, vipMessage);
  } catch (e) {
    console.error("[/vip] error:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});

bot.onText(/\/vip_program_info/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    const user = await (User?.findOne?.({ telegram_id: msg.from.id }) || null);
    const isPaid = user?.is_paid === true || user?.is_paid === "t";
    if (!user || !isPaid) {
      return bot.sendMessage(msg.chat.id, "🔒 សូមទូទាត់មុន (/pricing) ដើម្បីចូល VIP។");
    }
    if (vipCommands?.info) return vipCommands.info(msg, bot);
    await bot.sendMessage(msg.chat.id, "👑 VIP Info Coming Soon");
  } catch (e) {
    console.error("[/vip_program_info] error:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});

// VIP APPLY (message text)
bot.on("message", async (msg) => {
  if (isDuplicateMessage(msg)) return;
  if (msg.text && msg.text.toUpperCase() === "VIP APPLY") {
    try {
      const user = await (User?.findOne?.({ telegram_id: msg.from.id }) || null);
      const isPaid = user?.is_paid === true || user?.is_paid === "t";
      if (!user || !isPaid) {
        return bot.sendMessage(msg.chat.id, "🔒 សូមទូទាត់មុន (/pricing) ដើម្បីចូល VIP។");
      }
      if (vipCommands?.apply) return vipCommands.apply(msg, bot);
      await bot.sendMessage(msg.chat.id, "✅ VIP APPLY បានទទួល! @Chendasum នឹងទំនាក់ទំនងអ្នក");
    } catch (e) {
      console.error("[VIP APPLY] error:", e);
      await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា VIP APPLY");
    }
  }
});

// ===== Admin Suite =====
function isAdmin(userId) {
  const adminId = parseInt(ADMIN_CHAT_ID || "0");
  const secondary = 484389665;
  return [adminId, secondary].includes(Number(userId));
}

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

🆘 Help:
• /admin_help
• /whoami

🧰 Tools & Templates:
• /admin_daily_template
• /admin_weekly_template
• /admin_engagement_checklist
• /admin_onboarding_template`;
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

bot.onText(/\/admin_users/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  if (!isAdmin(msg.from.id)) return;
  try { await adminCommands?.showUsers?.(msg, bot); }
  catch (e) { console.error(e); await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។"); }
});

bot.onText(/\/admin_progress (.+)/i, async (msg, match) => {
  if (isDuplicateMessage(msg)) return;
  if (!isAdmin(msg.from.id)) return;
  try { await adminCommands?.checkProgress?.(msg, match, bot); }
  catch (e) { console.error(e); await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។"); }
});

bot.onText(/\/admin_analytics/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  if (!isAdmin(msg.from.id)) return;
  try { await adminCommands?.showAnalytics?.(msg, bot); }
  catch (e) { console.error(e); await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។"); }
});

bot.onText(/\/admin_activity/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  if (!isAdmin(msg.from.id)) return;
  try { await adminCommands?.showActivity?.(msg, bot); }
  catch (e) { console.error(e); await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។"); }
});

bot.onText(/\/admin_followup/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  if (!isAdmin(msg.from.id)) return;
  try { await adminCommands?.showFollowup?.(msg, bot); }
  catch (e) { console.error(e); await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។"); }
});

bot.onText(/\/admin_confirm_payment (.+)/i, async (msg, match) => {
  if (isDuplicateMessage(msg)) return;
  if (!isAdmin(msg.from.id)) return;
  try { await adminCommands?.confirmPayment?.(msg, match, bot); }
  catch (e) { console.error(e); await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។"); }
});

bot.onText(/\/admin_message (.+)/i, async (msg, match) => {
  if (isDuplicateMessage(msg)) return;
  if (!isAdmin(msg.from.id)) return;
  try { await adminCommands?.sendMessage?.(msg, match, bot); }
  catch (e) { console.error(e); await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។"); }
});

bot.onText(/\/admin_export/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  if (!isAdmin(msg.from.id)) return;
  try { await adminCommands?.exportData?.(msg, bot); }
  catch (e) { console.error(e); await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។"); }
});

// Progress Tracker (admin)
bot.onText(/\/admin_stuck/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  if (!isAdmin(msg.from.id)) return;
  try { await progressTracker?.showStuckUsers?.(msg, bot); }
  catch (e) { console.error(e); await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។"); }
});

bot.onText(/\/admin_completion/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  if (!isAdmin(msg.from.id)) return;
  try { await progressTracker?.showCompletionRates?.(msg, bot); }
  catch (e) { console.error(e); await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។"); }
});

bot.onText(/\/admin_completed/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  if (!isAdmin(msg.from.id)) return;
  try { await progressTracker?.showCompletedUsers?.(msg, bot); }
  catch (e) { console.error(e); await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។"); }
});

bot.onText(/\/admin_remind (.+)/i, async (msg, match) => {
  if (isDuplicateMessage(msg)) return;
  if (!isAdmin(msg.from.id)) return;
  try { await progressTracker?.sendManualReminder?.(msg, match, bot); }
  catch (e) { console.error(e); await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។"); }
});

bot.onText(/\/admin_uploads/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  if (!isAdmin(msg.from.id)) return;
  try { await progressTracker?.showUploadTracking?.(msg, bot); }
  catch (e) { console.error(e); await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។"); }
});

bot.onText(/\/admin_photos (.+)/i, async (msg, match) => {
  if (isDuplicateMessage(msg)) return;
  if (!isAdmin(msg.from.id)) return;
  try { await progressTracker?.showUserPhotos?.(msg, match, bot); }
  catch (e) { console.error(e); await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។"); }
});

// Tools & Templates
bot.onText(/\/admin_daily_template/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  if (!isAdmin(msg.from.id)) return;
  try { await toolsTemplates?.generateDailyTemplate?.(msg, bot); }
  catch (e) { console.error(e); bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។"); }
});
bot.onText(/\/admin_weekly_template/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  if (!isAdmin(msg.from.id)) return;
  try { await toolsTemplates?.generateWeeklyTemplate?.(msg, bot); }
  catch (e) { console.error(e); bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។"); }
});
bot.onText(/\/admin_engagement_checklist/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  if (!isAdmin(msg.from.id)) return;
  try { await toolsTemplates?.generateEngagementChecklist?.(msg, bot); }
  catch (e) { console.error(e); bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។"); }
});
bot.onText(/\/admin_onboarding_template/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  if (!isAdmin(msg.from.id)) return;
  try { await toolsTemplates?.generateOnboardingTemplate?.(msg, bot); }
  catch (e) { console.error(e); bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។"); }
});

// Marketing Hub
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

// Preview
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

// Free Tools & Quiz
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

// Badges / Progress
bot.onText(/\/badges/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    const user = await (User?.findOne?.({ telegram_id: msg.from.id }) || null);
    const isPaid = user?.is_paid === true || user?.is_paid === "t";
    if (!user || !isPaid) return bot.sendMessage(msg.chat.id, "🔒 /pricing");
    await badgesCommands?.showBadges?.(msg, bot);
  } catch (e) {
    console.error(e); bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/progress/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    const user = await (User?.findOne?.({ telegram_id: msg.from.id }) || null);
    const isPaid = user?.is_paid === true || user?.is_paid === "t";
    if (!user || !isPaid) return bot.sendMessage(msg.chat.id, "🔒 /pricing");
    await badgesCommands?.showProgress?.(msg, bot);
  } catch (e) {
    console.error(e); bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/milestones/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    const user = await (User?.findOne?.({ telegram_id: msg.from.id }) || null);
    const isPaid = user?.is_paid === true || user?.is_paid === "t";
    if (!user || !isPaid) return bot.sendMessage(msg.chat.id, "🔒 /pricing");
    await badgesCommands?.showMilestones?.(msg, bot);
  } catch (e) {
    console.error(e); bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/streak/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    const user = await (User?.findOne?.({ telegram_id: msg.from.id }) || null);
    const isPaid = user?.is_paid === true || user?.is_paid === "t";
    if (!user || !isPaid) return bot.sendMessage(msg.chat.id, "🔒 /pricing");
    await badgesCommands?.showStreak?.(msg, bot);
  } catch (e) {
    console.error(e); bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});

// 30-Day Admin
bot.onText(/\/admin_content_stats/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  if (!isAdmin(msg.from.id)) return;
  try { await thirtyDayAdmin?.contentStats?.(msg, bot); }
  catch (e) { console.error(e); bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។"); }
});
bot.onText(/\/admin_bulk_send/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  if (!isAdmin(msg.from.id)) return;
  try { await thirtyDayAdmin?.sendBulkContent?.(msg, bot); }
  catch (e) { console.error(e); bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។"); }
});
bot.onText(/\/admin_content_calendar/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  if (!isAdmin(msg.from.id)) return;
  try { await thirtyDayAdmin?.contentCalendar?.(msg, bot); }
  catch (e) { console.error(e); bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។"); }
});
bot.onText(/\/admin_scheduler_status/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  if (!isAdmin(msg.from.id)) return;
  try { await thirtyDayAdmin?.schedulerStatus?.(msg, bot); }
  catch (e) { console.error(e); bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។"); }
});

// ---------- Start Express ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server listening on ${PORT}`);
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
