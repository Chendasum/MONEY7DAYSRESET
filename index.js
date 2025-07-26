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

// --- Import Command Modules ---
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
const extendedContent = require("./commands/extended-content"); // <--- This one!
const thirtyDayAdmin = require("./commands/30day-admin"); // <--- This one!
const previewCommands = require("./commands/preview");
const freeTools = require("./commands/free-tools");
const financialQuiz = require("./commands/financial-quiz");
const toolsTemplates = require("./commands/tools-templates");
const progressTracker = require("./commands/progress-tracker");

// --- Import Service Modules ---
const scheduler = require("./services/scheduler");
const analytics = require("./services/analytics");
const AccessControl = require("./services/accessControl");
const ContentScheduler = require("./services/contentScheduler"); // For automated messages
const ConversionOptimizer = require("./services/conversionOptimizer");

// --- Initialize Express App ---
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set UTF-8 headers for all responses
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});

// Basic route for health checks and info
app.get("/", (req, res) => {
  console.log("Root endpoint hit");
  res.json({
    name: "7-Day Money Flow Reset™ Telegram Bot",
    status: "Running with Full Features",
    time: new Date().toISOString(),
    url: "money7daysreset-production.up.railway.app", // Make sure this is your correct Railway URL
    features: [
      "7-Day Program Content",
      "Extended 30-Day Content",
      "Payment Processing",
      "VIP Programs",
      "Progress Tracking",
      "Admin Tools",
      "Marketing Automation",
      "Khmer Language Support",
      "Automated Reminders & Upsells",
      "Free Tools & Quizzes",
    ],
  });
});

app.get("/ping", (req, res) => {
  console.log("Ping endpoint hit");
  res.send("Pong!");
});

app.get("/health", (req, res) => {
  console.log("Health check");
  res.json({
    status: "OK",
    time: new Date().toISOString(),
    bot_initialized: !!bot,
    commands_loaded:
      !!dailyCommands && !!extendedContent && !!adminCommands,
    scheduler_running: cron.get  || "N/A", // Check if cron is running
  });
});

// --- Bot Initialization ---
let bot;
if (process.env.BOT_TOKEN) {
  try {
    bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });
    console.log("✅ Bot initialized successfully");

    // Set up webhook
    const webhookUrl = `https://money7daysreset-production.up.railway.app/bot${process.env.BOT_TOKEN}`; // Ensure this URL is correct
    bot.setWebHook(webhookUrl, { drop_pending_updates: true }).then(() => {
      console.log(`Webhook set to: ${webhookUrl}`);
    }).catch(e => {
      console.error("❌ Failed to set webhook:", e.message);
      // Fallback to long polling if webhook fails (optional, but good for local dev)
      // bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
      // console.warn("Falling back to long polling due to webhook error.");
    });

    app.post(`/bot${process.env.BOT_TOKEN}`, async (req, res) => {
      try {
        console.log("🔔 Webhook received update");
        await bot.processUpdate(req.body);
        res.sendStatus(200);
      } catch (error) {
        console.error("Webhook processing error:", error.message);
        res.sendStatus(500);
      }
    });

    // Initialize services that require the bot instance
    scheduler.init(bot, User, Progress);
    analytics.init(User);
    AccessControl.init(User);
    ConversionOptimizer.init(bot, User);

    // Function to prevent duplicate messages and centralize error/paid checks
    const isDuplicateMessage = async (msg) => {
      // Implement your duplicate message logic here if needed
      // For now, simply return false to allow all messages
      return false;
    };

    const sendLongMessage = async (chatId, text) => {
      const MAX_LENGTH = 4096;
      if (text.length <= MAX_LENGTH) {
        return bot.sendMessage(chatId, text, { parse_mode: "HTML" });
      }

      const parts = [];
      let currentPart = "";
      const sentences = text.split(/(?<=[.?!]\s)/); // Split by sentence endings

      for (const sentence of sentences) {
        if ((currentPart + sentence).length > MAX_LENGTH) {
          parts.push(currentPart);
          currentPart = sentence;
        } else {
          currentPart += sentence;
        }
      }
      if (currentPart) {
        parts.push(currentPart);
      }

      for (const part of parts) {
        await bot.sendMessage(chatId, part, { parse_mode: "HTML" });
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to prevent flood limits
      }
    };

    const createBotHandler = (commandFunction, requiresPaid = false, requiresAdmin = false) => {
      return async (msg, match) => {
        console.log(`Handling command: ${match[0]} from user: ${msg.from.id}`);

        if (await isDuplicateMessage(msg)) {
          console.log(`Duplicate message from ${msg.from.id}, ignoring.`);
          return;
        }

        try {
          const userId = msg.from.id;
          const user = await User.findOne({ telegramId: userId });
          const isAdmin = user && user.isAdmin;
          const isPaid = user && (user.isPaid || user.is_paid === true || user.is_paid === 't');

          if (requiresAdmin && !isAdmin) {
            await bot.sendMessage(msg.chat.id, "🚫 You do not have administrator privileges for this command.");
            console.warn(`Admin command ${match[0]} blocked for non-admin user ${userId}`);
            return;
          }

          if (requiresPaid && !isPaid && !isAdmin) { // Admins bypass paid check
            await bot.sendMessage(msg.chat.id,
              `🔒 This content requires payment. Please use /pricing to learn more or /payment to proceed.
              \nសម្រាប់មាតិកានេះ, អ្នកត្រូវបង់ប្រាក់។ សូមប្រើ /pricing ដើម្បីដឹងលម្អិត ឬ /payment ដើម្បីបង់ប្រាក់។`);
            console.warn(`Paid content command ${match[0]} blocked for unpaid user ${userId}`);
            return;
          }

          // Ensure bot and User/Progress models are passed to commands
          await commandFunction(msg, match, bot, User, Progress, sendLongMessage);

          // Track usage for paid features
          if (requiresPaid && !isAdmin) { // Don't track admin usage as regular paid usage
              analytics.trackPaidFeatureUsage(userId, match[0]);
          }
        } catch (error) {
          console.error(`Error handling ${match[0]} for user ${msg.from.id}:`, error);
          await bot.sendMessage(msg.chat.id, `An error occurred while processing your request: ${error.message}. Please try again later.`);
        }
      };
    };

    // === Register all Bot Commands ===

    // Basic Commands
    bot.onText(/\/start/i, createBotHandler(startCommand.handle));
    bot.onText(/\/help/i, createBotHandler(startCommand.help));
    bot.onText(/\/pricing/i, createBotHandler(paymentCommands.pricing));
    bot.onText(/\/payment/i, createBotHandler(paymentCommands.instructions));
    bot.onText(/\/test/i, createBotHandler(async (msg, match, bot_instance) => {
      await bot_instance.sendMessage(msg.chat.id, "✅ Enhanced bot is working! All systems operational.");
      console.log("Test command sent to:", msg.from.id);
    }));

    // Daily Program Commands (requires payment)
    for (let day = 1; day <= 7; day++) {
      bot.onText(new RegExp(`/day${day}`, 'i'), createBotHandler(dailyCommands.handle, true));
    }
    bot.onText(/\/progress/i, createBotHandler(progressTracker.showProgress, true));
    bot.onText(/\/update_progress (\d+)/i, createBotHandler(progressTracker.updateProgress, true));


    // Extended Content Commands (requires payment)
    for (let day = 8; day <= 30; day++) {
      bot.onText(new RegExp(`/extended_day${day}`, 'i'), createBotHandler(extendedContent.handle, true));
    }
    bot.onText(/\/extended_content_menu/i, createBotHandler(extendedContent.showMenu, true));

    // VIP Commands (requires payment for basic, then additional VIP purchase)
    bot.onText(/\/vip/i, createBotHandler(vipCommands.info, true)); // Basic payment required to see VIP info
    bot.onText(/\/vip_apply/i, createBotHandler(vipCommands.apply, true));
    bot.onText(/\/vip_status/i, createBotHandler(vipCommands.checkStatus, true));

    // Free Tools/Assessment Commands
    bot.onText(/\/financial_quiz/i, createBotHandler(financialQuiz.startQuiz));
    bot.onText(/\/calculate_daily/i, createBotHandler(freeTools.calculateDailyExpenses));
    bot.onText(/\/tools_templates/i, createBotHandler(toolsTemplates.showTemplates));

    // Badges, Quotes, Booking Commands
    bot.onText(/\/badges/i, createBotHandler(badgesCommands.showBadges, true)); // Badges might be paid feature
    bot.onText(/\/quote/i, createBotHandler(quotesCommands.getRandomQuote));
    bot.onText(/\/book_call/i, createBotHandler(bookingCommands.bookCall));


    // Marketing Commands (some might be public, some might be admin/paid)
    bot.onText(/\/marketing_info/i, createBotHandler(marketingCommands.info));
    bot.onText(/\/marketing_content_menu/i, createBotHandler(marketingContent.showMenu));

    // Admin Commands (requires admin status)
    bot.onText(/\/admin_menu/i, createBotHandler(adminCommands.showAdminMenu, false, true)); // Admin menu doesn't require paid
    bot.onText(/\/admin_users/i, createBotHandler(adminCommands.listUsers, false, true));
    bot.onText(/\/admin_set_paid (\d+)/i, createBotHandler(adminCommands.setPaid, false, true));
    bot.onText(/\/admin_set_unpaid (\d+)/i, createBotHandler(adminCommands.setUnpaid, false, true));
    bot.onText(/\/admin_broadcast (.+)/i, createBotHandler(adminCommands.broadcastMessage, false, true));
    bot.onText(/\/admin_add_admin (\d+)/i, createBotHandler(adminCommands.addAdmin, false, true));
    bot.onText(/\/admin_remove_admin (\d+)/i, createBotHandler(adminCommands.removeAdmin, false, true));
    bot.onText(/\/admin_check_user_status (\d+)/i, createBotHandler(adminCommands.checkUserStatus, false, true));
    bot.onText(/\/admin_send_day_content (\d+) (\d+)/i, createBotHandler(adminCommands.sendDayContent, false, true));
    bot.onText(/\/admin_send_extended_content (\d+) (\d+)/i, createBotHandler(adminCommands.sendExtendedContent, false, true));
    bot.onText(/\/admin_toggle_bot_status/i, createBotHandler(adminCommands.toggleBotStatus, false, true));
    bot.onText(/\/admin_get_stats/i, createBotHandler(adminCommands.getBotStats, false, true));
    bot.onText(/\/admin_force_scheduler_run/i, createBotHandler(adminCommands.forceSchedulerRun, false, true));

    // 30-Day Admin Commands (requires admin status)
    bot.onText(/\/30day_admin_menu/i, createBotHandler(thirtyDayAdmin.showMenu, false, true));
    bot.onText(/\/30day_admin_send_welcome (\d+)/i, createBotHandler(thirtyDayAdmin.sendWelcomeMessage, false, true));
    bot.onText(/\/30day_admin_schedule_next (\d+)/i, createBotHandler(thirtyDayAdmin.scheduleNextDayMessage, false, true));
    bot.onText(/\/30day_admin_send_day (\d+) (\d+)/i, createBotHandler(thirtyDayAdmin.sendSpecificDayMessage, false, true));
    bot.onText(/\/30day_admin_view_scheduled/i, createBotHandler(thirtyDayAdmin.viewScheduledMessages, false, true));

    console.log("✅ All bot commands registered with enhanced handlers.");

  } catch (error) {
    console.error("❌ Bot initialization failed:", error.message);
    // Optionally, send an alert to an admin or logging service here
  }
} else {
  console.error("❌ BOT_TOKEN environment variable is not set. Bot cannot start.");
  // Exit if bot token is critical and not found
  process.exit(1);
}

// Start Content Scheduler (for automated daily messages, upsells, etc.)
// This should be done only once the bot is initialized
if (bot) {
  const contentScheduler = new ContentScheduler(bot, User, Progress);
  contentScheduler.start(); // Start the cron jobs within the scheduler
  console.log("🤖 Content Scheduler started for automated messages.");
}


// --- Start Server ---
const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0";

const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on ${HOST}:${PORT}`);
  console.log(`🌐 URL: https://money7daysreset-production.up.railway.app`); // Confirm your Railway URL
  console.log(`🔥 7-Day Money Flow automation ACTIVE!`);
  console.log(`✅ Server is fully listening for incoming requests.`);
});

// --- Graceful Shutdown ---
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

// --- Global Error Handling ---
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  // It's good practice to exit after an uncaught exception for process managers to restart
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // It's good practice to exit after an unhandled rejection for process managers to restart
  process.exit(1);
});
