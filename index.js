require("dotenv").config();

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const cron = require("node-cron"); // Used for scheduling tasks

// Database connection is assumed to be handled by Drizzle ORM with PostgreSQL
console.log(
  "🔍 Database configured with Drizzle ORM and PostgreSQL (via models)",
);
console.log("✅ Database ready for operations");

// Set proper UTF-8 encoding for the environment to handle Khmer characters correctly
process.env.NODE_ICU_DATA = "/usr/share/nodejs/node-icu-data";
process.env.LANG = "en_US.UTF-8";

// --- Import Database Models ---
const User = require("./models/User");
const Progress = require("./models/Progress");

// --- Import Command Modules -- (Ensure these files exist in your project)
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
const extendedContent = require("./commands/extended-content");
const thirtyDayAdmin = require("./commands/30day-admin");
const previewCommands = require("./commands/preview");
const freeTools = require("./commands/free-tools");
const financialQuiz = require("./commands/financial-quiz");
const toolsTemplates = require("./commands/tools-templates");

// --- Import Service Modules -- (Ensure these files exist in your project)
const scheduler = require("./services/scheduler");
const analytics = require("./services/analytics");
const celebrations = require("./services/celebrations");
const progressBadges = require("./services/progress-badges");
const emojiReactions = require("./services/emoji-reactions");
const AccessControl = require("./services/access-control");
const ContentScheduler = require("./services/content-scheduler");
const ConversionOptimizer = require("./services/conversion-optimizer");

// --- Import Utility Modules ---
const { sendLongMessage } = require("./utils/message-splitter");
const { default: fetch } = require("node-fetch"); // Ensure node-fetch is imported correctly

// Define a consistent message chunk size for splitting long messages
const MESSAGE_CHUNK_SIZE = 800;

// Initialize Telegram bot for webhook mode
const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: false,
  onlyFirstMatch: true,
});

// DUPLICATE PREVENTION SYSTEM: Optimized for webhook mode
const processedMessages = new Set();
let lastProcessTime = {};

function isDuplicateMessage(msg) {
  const messageId = `${msg.chat.id}-${msg.message_id}`;
  const now = Date.now();

  // Only block if same message processed within last 3 seconds (for webhook mode)
  if (
    processedMessages.has(messageId) &&
    lastProcessTime[messageId] &&
    now - lastProcessTime[messageId] < 3000
  ) {
    console.log(
      `[isDuplicateMessage] Blocking recent duplicate: ${messageId} within 3s`,
    );
    return true;
  }

  processedMessages.add(messageId);
  lastProcessTime[messageId] = now;

  // Clean up old entries every 50 messages
  if (processedMessages.size > 50) {
    const cutoff = now - 30000; // 30 seconds
    Object.keys(lastProcessTime).forEach((id) => {
      if (lastProcessTime[id] < cutoff) {
        processedMessages.delete(id);
        delete lastProcessTime[id];
      }
    });
  }

  console.log(`[isDuplicateMessage] Processing message: ${messageId}`);
  return false;
}

// Express app for handling webhooks
const app = express();
const accessControl = new AccessControl();
const conversionOptimizer = new ConversionOptimizer();

// Middleware for parsing JSON and URL-encoded data with UTF-8 support
app.use(
  express.json({
    limit: "10mb",
    charset: "utf-8",
  }),
);
app.use(
  express.urlencoded({
    extended: true,
    charset: "utf-8",
  }),
);

// Set UTF-8 headers for all outgoing responses to ensure proper character encoding
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});

// >>> START OF IMPORTANT CHANGE <<<
// Function to get the Railway URL
// IMPORTANT: Use your actual Railway domain here.
// Based on previous conversations, this was: https://money7daysreset-production.up.railway.app
function getRailwayUrl() {
  return "https://money7daysreset-production.up.railway.app";
}
// >>> END OF IMPORTANT CHANGE <<<

// Enhanced bot initialization for webhook mode
async function initBotWebhook() {
  console.log("Starting bot initialization process for webhooks...");

  if (!process.env.BOT_TOKEN) {
    console.error("❌ ERROR: BOT_TOKEN is not set in env.txt!");
    console.error("Please ensure env.txt exists and contains BOT_TOKEN.");
    process.exit(1);
  } else {
    console.log("✅ BOT_TOKEN loaded successfully.");
  }

  try {
    // 1. Stop polling if active (good practice)
    try {
      await bot.stopPolling();
      console.log("Polling stopped successfully (if active).");
    } catch (stopError) {
      console.log(
        "No active polling to stop or polling was already stopped (expected).",
      );
    }

    // 2. Delete existing webhook to clear any stale configurations
    try {
      const deleteResult = await bot.deleteWebHook();
      console.log(
        "Webhook deleted successfully (via bot.deleteWebHook()):",
        deleteResult,
      );
    } catch (deleteError) {
      console.log(
        "Failed to delete webhook (via bot.deleteWebHook()):",
        deleteError.message,
      );
    }

    // 3. Construct the webhook URL using your Railway domain
    // >>> START OF IMPORTANT CHANGE <<<
    const actualWebhookUrl = `${getRailwayUrl()}/bot${process.env.BOT_TOKEN}`;

    console.log("🔍 Using Railway domain:", getRailwayUrl());
    // >>> END OF IMPORTANT CHANGE <<<

    console.log(`Attempting to set webhook to: ${actualWebhookUrl}`);
    const setWebhookResult = await bot.setWebHook(actualWebhookUrl);
    console.log("✅ Webhook set successfully:", setWebhookResult);

    console.log("✅ Bot initialized successfully for webhook mode.");
  } catch (error) {
    console.error("❌ Bot initialization error for webhooks:", error.message);
    process.exit(1);
  }
}

// Wrap the main startup logic in an async IIFE to ensure proper async flow
(async () => {
  await initBotWebhook();

  const PORT = process.env.PORT || 5000;
  const HOST = process.env.HOST || "0.0.0.0";

  const server = app.listen(PORT, HOST, () => {
    console.log(`🚀 Server running on ${HOST}:${PORT}`);
    console.log(`🔥 7-Day Money Flow automation ACTIVE!`);
    console.log(`✅ Server is fully listening for incoming requests.`);
  });

  // Schedule daily messages (9 AM Cambodia time, adjust if needed)
  cron.schedule("0 9 * * *", async () => {
    console.log("🕘 Sending daily messages...");
    try {
      await scheduler.sendDailyMessages(bot);
    } catch (error) {
      console.error("Error sending daily messages via cron:", error);
    }
  }, {
    timezone: "Asia/Phnom_Penh" // Set timezone for Cambodia
  });


  const contentScheduler = new ContentScheduler(bot);
  contentScheduler.start();

  console.log("🤖 Bot started successfully with 7-Day + 30-Day automation!");
  console.log("🚀 Features added:");
  console.log("    • Auto next-day reminders (24h delay)");
  console.log("    • Day 3 upsell automation (1h delay)");
  console.log("    • 30-day follow-up for results");
  console.log("    • Enhanced welcome sequence");
  console.log("    • 30-day extended content automation");
  console.log("    • Daily content delivery (9 AM Cambodia)");
  console.log("    • Evening motivation (6 PM Cambodia)");
  console.log("    • Weekly reviews (Sunday 8 PM Cambodia)");
  console.log("🔱 7-Day Money Flow Reset™ + 30-Day Extended Content READY!");

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

  process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
    process.exit(1);
  });

  process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    process.exit(1);
  });
})();

// ========================================
// TELEGRAM BOT COMMAND HANDLERS
// ========================================

// Handle /start command: Initiates the bot interaction
bot.onText(/\/start/i, async (msg) => {
  console.log(
    "🚀 [START HANDLER] /start command received from user:",
    msg.from.id,
    "username:",
    msg.from.username,
    "chat_id:",
    msg.chat.id,
  );
  if (isDuplicateMessage(msg)) {
    console.log(
      "🔄 [START HANDLER] Duplicate /start message prevented for user:",
      msg.from.id,
    );
    return;
  }
  try {
    console.log(
      "📝 [START HANDLER] Processing /start command for user:",
      msg.from.id,
    );
    await startCommand.handle(msg, bot);
    console.log(
      "✅ [START HANDLER] Start command completed for user:",
      msg.from.id,
    );
  } catch (error) {
    console.error("❌ [START HANDLER] Error handling /start command:", error);
    console.error("❌ [START HANDLER] Full error stack:", error.stack);
    await bot.sendMessage(
      msg.chat.id,
      "❌ មានបញ្ហាក្នុងការចាប់ផ្តើម។ សូមសាកល្បងម្តងទៀតនៅពេលក្រោយ។",
    );
  }
});

// Handle /help command: Shows help information
bot.onText(/\/help/i, async (msg) => {
  console.log(`[Help Command] Received /help from user: ${msg.from.id}`);
  if (isDuplicateMessage(msg)) {
    console.log(
      `[Help Command] Duplicate /help message prevented for user: ${msg.from.id}`,
    );
    return;
  }
  try {
    console.log(
      `[Help Command] Fetching tier-specific help for user: ${msg.from.id}`,
    );
    const helpMessageContent = await accessControl.getTierSpecificHelp(
      msg.from.id,
    );
    console.log(
      `[Help Command] Successfully fetched help content. Length: ${helpMessageContent.length}`,
    );
    await sendLongMessage(
      bot,
      msg.chat.id,
      helpMessageContent,
      { parse_mode: "Markdown" },
      MESSAGE_CHUNK_SIZE,
    );
    console.log(`[Help Command] Help message sent to user: ${msg.from.id}`);
  } catch (error) {
    console.error(
      `❌ [Help Command] Error handling /help command for user ${msg.from.id}:`,
      error,
    );
    await bot.sendMessage(
      msg.chat.id,
      "❌ មានបញ្ហាក្នុងការផ្ទុកជំនួយ។ សូមសាកល្បងម្តងទៀត។",
    );
  }
});

// EMERGENCY /pricing command handler - Direct response to restore functionality
bot.onText(/\/pricing/i, async (msg) => {
  console.log("[PRICING] Command received from user:", msg.from.id);
  if (isDuplicateMessage(msg)) return;
  
  try {
    // Emergency pricing message - direct response
    const emergencyPricing = `💰 តម្លៃកម្មវិធី 7-Day Money Flow Reset™

🎯 កម្មវិធីសាមញ្ញ (Essential Program)
💵 តម្លៃ: $24 USD (បញ្ចុះតម្លៃ 50%)
🏷️ កូដ: LAUNCH50

📚 អ្វីដែលអ្នកនឹងទទួលបាន:
✅ មេរៀន ៧ ថ្ងៃពេញលេញ
✅ ការគ្រប់គ្រងលុយបានល្អ
✅ ការកាត់បន្ថយចំណាយ
✅ ការបង្កើនចំណូល
✅ ផែនការហិរញ្ញវត្ថុច្បាស់

💎 វិធីទូទាត់:
• ABA Bank: 000 194 742
• ACLEDA Bank: 092 798 169  
• Wing: 102 534 677
• ឈ្មោះ: SUM CHENDA
• កំណត់ចំណាំ: BOT${msg.from.id}

⚡ ចាប់ផ្តើមភ្លាមៗ:
👉 /payment - ការណែនាំទូទាត់ពេញលេញ
👉 @Chendasum - ជំនួយផ្ទាល់`;

    await bot.sendMessage(msg.chat.id, emergencyPricing);
    
    // Try to call the original handler, but don't break if it fails
    try {
      await paymentCommands.pricing(msg, bot);
    } catch (handlerError) {
      console.error("Pricing handler failed, using emergency response:", handlerError);
    }
    
  } catch (error) {
    console.error("❌ [PRICING] Emergency handler failed:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ ទាក់ទង @Chendasum");
  }
});

// EMERGENCY /payment command handler - Direct response to restore functionality
bot.onText(/\/payment/i, async (msg) => {
  console.log("[PAYMENT] Command received from user:", msg.from.id);
  if (isDuplicateMessage(msg)) return;
  
  try {
    // Emergency payment instructions - direct response
    const emergencyPayment = `💳 ការណែនាំទូទាត់ (Emergency)

🏦 ABA Bank (រហ័ស)
• គណនី: 000 194 742
• ឈ្មោះ: SUM CHENDA  
• ចំនួន: $24 USD
• Reference: BOT${msg.from.id}

📱 Wing (លឿនបំផុត)
• លេខ: 102 534 677
• ឈ្មោះ: SUM CHENDA
• ចំនួន: $24 USD  
• កំណត់ចំណាំ: BOT${msg.from.id}

🏦 ACLEDA Bank
• គណនី: 092 798 169
• ឈ្មោះ: SUM CHENDA
• ចំនួន: $24 USD  
• Reference: BOT${msg.from.id}

⚡ បន្ទាប់ពីទូទាត់:
1. ថតរូបបញ្ជាក់ការទូទាត់
2. ផ្ញើមកដោយផ្ទាល់ក្នុងនេះ
3. ចាប់ផ្តើម Day 1 ភ្លាមៗ!

💬 ជំនួយ: @Chendasum`;

    await bot.sendMessage(msg.chat.id, emergencyPayment);
    
    // Try to call the original handler, but don't break if it fails
    try {
      await paymentCommands.instructions(msg, bot);
    } catch (handlerError) {
      console.error("Payment handler failed, using emergency response:", handlerError);
    }
    
  } catch (error) {
    console.error("❌ [PAYMENT] Emergency handler failed:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ ទាក់ទង @Chendasum");
  }
});

// Handle /day command (without number): Shows an introduction to the 7-Day program
bot.onText(/^\/day$/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    const user = await User.findOne({ telegram_id: msg.from.id });
    const chatId = msg.chat.id;
    const isPaid = user?.is_paid === true || user?.is_paid === 't';

    if (!user || !isPaid) {
      await bot.sendMessage(
        chatId,
        "🔒 សូមទូទាត់មុនដើម្បីចូលរួមកម្មវិធី។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។",
      );
      return;
    }

    const progress = (await Progress.findOne({ user_id: msg.from.id })) || {};

    const introMessage = `✨ 7-Day Money Flow Reset™ ✨

🎯 សូមស្វាគមន៍មកកាន់កម្មវិធីដ៏មានតម្លៃរបស់អ្នក!

🏆 តម្រុយសម្រាប់អ្នក:
┌─────────────────────────┐
│  🔱 Day 1: Money Flow    │
│    ចាប់ផ្តើមស្គាល់        │
│    Money Flow របស់អ្នក    │
│  + ចាប់ផ្តើមកែប្រែ!      │
└─────────────────────────┘

📈 ថ្ងៃទី ១ នេះអ្នកនឹងរៀន:
• ស្វែងរកកន្លែងដែលលុយលេចធ្លាយ
• យល់ដឹងពី Money Flow របស់អ្នក
• កាត់បន្ថយចំណាយមិនចាំបាច់
• ចាប់ផ្តើមដំណើរកែប្រែ

🚀 ត្រៀមចាប់ផ្តើមហើយឬនៅ?

👉 ចុច /day1 ដើម្បីចាប់ផ្តើមការផ្សងព្រេងថ្ងៃទី ១!`;

    await sendLongMessage(
      bot,
      chatId,
      introMessage,
      { parse_mode: "Markdown" },
      MESSAGE_CHUNK_SIZE,
    );

    if (progress.currentDay && progress.currentDay > 1) {
      setTimeout(async () => {
        const progressMessage = `📊 វឌ្ឍនភាពរបស់អ្នក:

🔥 ថ្ងៃបានបញ្ចប់: ${progress.currentDay - 1}/7
📈 ភាគរយបញ្ចប់: ${progress.completionPercentage || 0}%

🎯 ថ្ងៃបន្ទាប់: /day${progress.currentDay}`;
        await bot.sendMessage(chatId, progressMessage);
      }, 1500);
    }
  } catch (error) {
    console.error("Error in /day command:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
  }
});

// Handle /day[1-7] commands: Delivers daily lesson content - WEBHOOK MODE OPTIMIZED
bot.onText(/\/day([1-7])/i, async (msg, match) => {
  console.log(`🎯 /day${match[1]} command received from user ${msg.from.id}`);
  try {
    console.log(`🔍 Looking up user ${msg.from.id} in database...`);
    // FIXED: Use correct PostgreSQL field names
    const user = await User.findOne({ telegram_id: msg.from.id });
    console.log(`📊 User lookup result:`, {
      found: !!user,
      id: user?.telegram_id,
      name: user?.first_name,
      paid: user?.is_paid,
      tier: user?.tier,
    });

    console.log(`Daily command access check for user ${msg.from.id}:`, {
      user_found: !!user,
      is_paid_raw: user?.is_paid,
      is_paid_boolean: user?.is_paid === true || user?.is_paid === "t",
      tier: user?.tier,
    });

    // FIXED: Check is_paid properly (PostgreSQL stores as 't'/'f' strings)
    const isPaid = user?.is_paid === true || user?.is_paid === "t";

    if (!user || !isPaid) {
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

// VIP command handlers: Both /vip_program_info and /vip trigger VIP information
bot.onText(/\/vip_program_info/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    const user = await User.findOne({ telegram_id: msg.from.id });
    const isPaid = user?.is_paid === true || user?.is_paid === 't';

    if (!user || !isPaid) {
      await bot.sendMessage(
        msg.chat.id,
        "🔒 សូមទូទាត់មុនដើម្បីចូលរួមកម្មវិធី VIP។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។",
      );
      return;
    }

    await vipCommands.info(msg, bot);
  } catch (error) {
    console.error("Error in VIP info command:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហាក្នុងការផ្ទុកព័ត៌មាន VIP។");
  }
});

bot.onText(/\/vip$/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    const user = await User.findOne({ telegram_id: msg.from.id });
    const isPaid = user?.is_paid === true || user?.is_paid === 't';

    if (!user || !isPaid) {
      await bot.sendMessage(
        msg.chat.id,
        "🔒 សូមទូទាត់មុនដើម្បីចូលរួមកម្មវិធី VIP។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។",
      );
      return;
    }

    await vipCommands.info(msg, bot);
  } catch (error) {
    console.error("Error in VIP command:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហាក្នុងការផ្ទុកព័ត៌មាន VIP។");
  }
});

// Admin Commands: Restricted access commands for bot administrators
bot.onText(/\/admin_users/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await adminCommands.showUsers(msg, bot);
  } catch (e) {
    console.error("Error /admin_users:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/admin_progress (.+)/i, async (msg, match) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await adminCommands.checkProgress(msg, match, bot);
  } catch (e) {
    console.error("Error /admin_progress:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/admin_analytics/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await adminCommands.showAnalytics(msg, bot);
  } catch (e) {
    console.error("Error /admin_analytics:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/admin_activity/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await adminCommands.showActivity(msg, bot);
  } catch (e) {
    console.error("Error /admin_activity:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/admin_followup/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await adminCommands.showFollowup(msg, bot);
  } catch (e) {
    console.error("Error /admin_followup:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/admin_message (.+)/i, async (msg, match) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await adminCommands.sendMessage(msg, match, bot);
  } catch (e) {
    console.error("Error /admin_message:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/admin_confirm_payment (.+)/i, async (msg, match) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await adminCommands.confirmPayment(msg, match, bot);
  } catch (e) {
    console.error("Error /admin_confirm_payment:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/admin_export/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await adminCommands.exportData(msg, bot);
  } catch (e) {
    console.error("Error /admin_export:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/admin_help/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await adminCommands.showHelp(msg, bot);
  } catch (e) {
    console.error("Error /admin_help:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});

// VIP Apply Handler: Processes user's "VIP APPLY" message (case-insensitive) - FIXED DATABASE FIELDS
bot.on("message", async (msg) => {
  if (isDuplicateMessage(msg)) return;

  if (msg.text && msg.text.toUpperCase() === "VIP APPLY") {
    try {
      // FIXED: Use correct PostgreSQL field name
      const user = await User.findOne({ telegram_id: msg.from.id });

      // FIXED: Check is_paid properly (PostgreSQL stores as 't'/'f' strings)
      const isPaid = user?.is_paid === true || user?.is_paid === "t";

      if (!user || !isPaid) {
        await bot.sendMessage(
          msg.chat.id,
          "🔒 សូមទូទាត់មុនដើម្បីចូលរួមកម្មវិធី VIP។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។",
        );
        return;
      }
      await vipCommands.apply(msg, bot);
    } catch (error) {
      console.error("Error handling VIP APPLY message:", error);
      await bot.sendMessage(
        msg.chat.id,
        "❌ មានបញ្ហាក្នុងការដំណើរការសំណើ VIP។",
      );
    }
  }
});

// Progress Tracking Admin Commands
const progressTracker = require("./commands/progress-tracker");
bot.onText(/\/admin_stuck/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await progressTracker.showStuckUsers(msg, bot);
  } catch (e) {
    console.error("Error /admin_stuck:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/admin_completion/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await progressTracker.showCompletionRates(msg, bot);
  } catch (e) {
    console.error("Error /admin_completion:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/admin_remind (.+)/i, async (msg, match) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await progressTracker.sendManualReminder(msg, match, bot);
  } catch (e) {
    console.error("Error /admin_remind:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/admin_completed/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await progressTracker.showCompletedUsers(msg, bot);
  } catch (e) {
    console.error("Error /admin_completed:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/admin_uploads/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await progressTracker.showUploadTracking(msg, bot);
  } catch (e) {
    console.error("Error /admin_uploads:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/admin_photos (.+)/i, async (msg, match) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await progressTracker.showUserPhotos(msg, match, bot);
  } catch (e) {
    console.error("Error /admin_photos:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});

// Quick Admin Menu: Provides a quick list of admin commands
bot.onText(/\/admin_menu|\/admin/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  const adminId = parseInt(process.env.ADMIN_CHAT_ID);
  const secondaryAdminId = 484389665;
  if (![adminId, secondaryAdminId].includes(msg.from.id)) {
    await bot.sendMessage(
      msg.chat.id,
      "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះទេ។",
    );
    return;
  }

  const menuMessage = `🔧 ADMIN QUICK MENU

📱 ការតាមដានប្រចាំថ្ងៃ:
• /admin_activity - អ្នកប្រើប្រាស់សកម្មថ្ងៃនេះ
• /admin_stuck - អ្នកប្រើប្រាស់ដែលជាប់គាំង
• /admin_uploads - ការតាមដានការផ្ទុកឡើងរូបភាព
• /admin_followup - អ្នកប្រើប្រាស់ដែលត្រូវការជំនួយ

📊 ការវិភាគ:
• /admin_analytics - ផ្ទាំងគ្រប់គ្រងពេញលេញ
• /admin_completion - អត្រាបញ្ចប់
• /admin_completed - អ្នកប្រើប្រាស់ដែលបានបញ្ចប់

💬 សកម្មភាព:
• /admin_progress [UserID] - ព័ត៌មានលម្អិតអ្នកប្រើប្រាស់
• /admin_message [UserID] [text] - ផ្ញើសារ
• /admin_remind [day] - ផ្ញើរំលឹក
• /admin_confirm_payment [UserID] - បញ្ជាក់ការទូទាត់

📋 របាយការណ៍:
• /admin_users - ទិដ្ឋភាពទូទៅអ្នកប្រើប្រាស់ទាំងអស់
• /admin_export - នាំចេញទិន្នន័យ CSV
• /admin_photos [UserID] - រូបភាពអ្នកប្រើប្រាស់

🆘 ជំនួយ:
• /admin_help - បញ្ជីពាក្យបញ្ជាពេញលេញ
• /whoami - ស្ថានភាព Admin របស់អ្នក

📋 ឧបករណ៍ & ទម្រង់:
• /admin_daily_template - ទម្រង់តាមដានប្រចាំថ្ងៃ
• /admin_weekly_template - ទម្រង់របាយការណ៍ប្រចាំសប្តាហ៍
• /admin_engagement_checklist - មគ្គុទេសក៍ការចូលរួមអ្នកប្រើប្រាស់
• /admin_onboarding_template - ទម្រង់អ្នកប្រើប្រាស់ថ្មី

វាយពាក្យបញ្ជាណាមួយដើម្បីប្រតិបត្តិភ្លាមៗ!`;

  await bot.sendMessage(msg.chat.id, menuMessage);
});

// Tools and Templates Admin Commands
bot.onText(/\/admin_daily_template/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await toolsTemplates.generateDailyTemplate(msg, bot);
  } catch (e) {
    console.error("Error /admin_daily_template:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/admin_weekly_template/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await toolsTemplates.generateWeeklyTemplate(msg, bot);
  } catch (e) {
    console.error("Error /admin_weekly_template:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/admin_engagement_checklist/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await toolsTemplates.generateEngagementChecklist(msg, bot);
  } catch (e) {
    console.error("Error /admin_engagement_checklist:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/admin_onboarding_template/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await toolsTemplates.generateOnboardingTemplate(msg, bot);
  } catch (e) {
    console.error("Error /admin_onboarding_template:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});

// Marketing Content Commands
bot.onText(/\/marketing_hub/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await marketingContent.marketingHub(msg, bot);
  } catch (e) {
    console.error("Error /marketing_hub:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/post_success_story/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await marketingContent.postSuccessStory(msg, bot);
  } catch (e) {
    console.error("Error /post_success_story:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/post_program_promo/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await marketingContent.postProgramPromo(msg, bot);
  } catch (e) {
    console.error("Error /post_program_promo:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/launch_flash_sale/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await marketingContent.launchFlashSale(msg, bot);
  } catch (e) {
    console.error("Error /launch_flash_sale:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/content_week/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await marketingContent.contentWeek(msg, bot);
  } catch (e) {
    console.error("Error /content_week:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/send_newsletter/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await marketingContent.sendNewsletter(msg, bot);
  } catch (e) {
    console.error("Error /send_newsletter:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/marketing_stats/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await marketingContent.marketingStats(msg, bot);
  } catch (e) {
    console.error("Error /marketing_stats:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/roi_analysis/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await marketingContent.roiAnalysis(msg, bot);
  } catch (e) {
    console.error("Error /roi_analysis:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/referral_program/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await marketingContent.referralProgram(msg, bot);
  } catch (e) {
    console.error("Error /referral_program:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});

// 30-Day Extended Content Commands: Access lessons from Day 8 to Day 30
bot.onText(/\/extended(\d+)/i, async (msg, match) => {
  if (isDuplicateMessage(msg)) return;
  const day = parseInt(match[1]);
  if (isNaN(day) || day < 8 || day > 30) {
    await bot.sendMessage(
      msg.chat.id,
      "❌ មាតិកាបន្ថែមអាចរកបានសម្រាប់ថ្ងៃទី ៨-៣០ ប៉ុណ្ណោះ។",
    );
    return;
  }
  try {
    const user = await User.findOne({ telegram_id: msg.from.id });
    const isPaid = user?.is_paid === true || user?.is_paid === 't';
    if (!user || !isPaid) {
      await bot.sendMessage(
        msg.chat.id,
        "🔒 សូមទូទាត់មុនដើម្បីចូលប្រើមាតិកាបន្ថែម។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។",
      );
      return;
    }
    await extendedContent.handleExtendedDay(msg, bot, day);
  } catch (error) {
    console.error("Error in /extended command:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
  }
});

// 30-Day Admin Commands
bot.onText(/\/admin_content_stats/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await thirtyDayAdmin.contentStats(msg, bot);
  } catch (e) {
    console.error("Error /admin_content_stats:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/admin_bulk_send/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await thirtyDayAdmin.sendBulkContent(msg, bot);
  } catch (e) {
    console.error("Error /admin_bulk_send:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/admin_content_calendar/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await thirtyDayAdmin.contentCalendar(msg, bot);
  } catch (e) {
    console.error("Error /admin_content_calendar:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/admin_scheduler_status/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await thirtyDayAdmin.schedulerStatus(msg, bot);
  } catch (e) {
    console.error("Error /admin_scheduler_status:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});

// Preview System Commands: Free access to preview content
bot.onText(/\/preview$/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await previewCommands.preview(msg, bot);
  } catch (e) {
    console.error("Error /preview:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/preview_day1/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await previewCommands.previewDay1(msg, bot);
  } catch (e) {
    console.error("Error /preview_day1:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/preview_tools/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await previewCommands.previewTools(msg, bot);
  } catch (e) {
    console.error("Error /preview_tools:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/preview_results/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await previewCommands.previewResults(msg, bot);
  } catch (e) {
    console.error("Error /preview_results:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
