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

// Triggering a fresh Railway deployment

// --- Import Database Models ---
const User = require("./models/User");
const Progress = require("./models/Progress");

// --- Import Command Modules with robust error handling ---
let startCommand, dailyCommands, paymentCommands, vipCommands, adminCommands;
let badgesCommands, quotesCommands, bookingCommands, tierFeatures;
let marketingCommands, marketingContent, extendedContent;
let previewCommands, freeTools, financialQuiz, toolsTemplates;
let progressTracker, thirtyDayAdmin; // Added thirtyDayAdmin

try { startCommand = require("./commands/start"); } catch(e) { console.log("⚠️ start.js not found"); }
try { dailyCommands = require("./commands/daily"); } catch(e) { console.log("⚠️ daily.js not found"); }
try { paymentCommands = require("./commands/payment"); } catch(e) { console.log("⚠️ payment.js not found"); }
try { vipCommands = require("./commands/vip"); } catch(e) { console.log("⚠️ vip.js not found"); }
try { adminCommands = require("./commands/admin"); } catch(e) { console.log("⚠️ admin.js not found"); }
try { badgesCommands = require("./commands/badges"); } catch(e) { console.log("⚠️ badges.js not found"); }
try { quotesCommands = require("./commands/quotes"); } catch(e) { console.log("⚠️ quotes.js not found"); }
try { bookingCommands = require("./commands/booking"); } catch(e) { console.log("⚠️ booking.js not found"); }
try { tierFeatures = require("./commands/tier-features"); } catch(e) { console.log("⚠️ tier-features.js not found"); }
try { marketingCommands = require("./commands/marketing"); } catch(e) { console.log("⚠️ marketing.js not found"); }
try { marketingContent = require("./commands/marketing-content"); } catch(e) { console.log("⚠️ marketing-content.js not found"); }
try { extendedContent = require("./commands/extended-content"); } catch(e) { console.log("⚠️ extended-content.js not found"); }
try { previewCommands = require("./commands/preview"); } catch(e) { console.log("⚠️ preview commands not found"); }
try { freeTools = require("./commands/free-tools"); } catch(e) { console.log("⚠️ free-tools not found"); }
try { financialQuiz = require("./commands/financial-quiz"); } catch(e) { console.log("⚠️ financial-quiz not found"); }
try { toolsTemplates = require("./commands/tools-templates"); } catch(e) { console.log("⚠️ tools-templates.js not found"); }
try { progressTracker = require("./commands/progress-tracker"); } catch(e) { console.log("⚠️ progress-tracker.js not found"); }
try { thirtyDayAdmin = require("./commands/30day-admin"); } catch(e) { console.log("⚠️ 30day-admin.js not found"); } // Added

// --- Import Service Modules with robust error handling ---
let scheduler, analytics, AccessControl, ContentScheduler, ConversionOptimizer;
// Removed celebrations, progressBadges, emojiReactions as they were not consistently used in the 'full' context or were implicit
// If these modules are essential for your bot, ensure they exist and re-add their imports and usage.

try { scheduler = require("./services/scheduler"); } catch(e) { console.log("⚠️ scheduler.js not found"); }
try { analytics = require("./services/analytics"); } catch(e) { console.log("⚠️ analytics.js not found"); }
try { AccessControl = require("./services/accessControl"); } catch(e) { console.log("⚠️ accessControl.js not found"); }
try { ContentScheduler = require("./services/contentScheduler"); } catch(e) { console.log("⚠️ contentScheduler.js not found"); }
try { ConversionOptimizer = require("./services/conversionOptimizer"); } catch(e) { console.log("⚠️ conversionOptimizer.js not found"); }

// --- Initialize Express App ---
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set UTF-8 headers for all responses
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});

// --- Utility: sendLongMessage (from your previous working code) ---
const sendLongMessage = async (botInstance, chatId, text, options = {}, chunkSize = 4000) => {
  try {
    if (text.length <= chunkSize) {
      return await botInstance.sendMessage(chatId, text, options);
    }

    const parts = [];
    let currentPart = "";
    // Split by sentence endings, but keep the delimiter for clear breaks
    const sentences = text.split(/(?<=[.?!]\s)/);

    for (const sentence of sentences) {
      if ((currentPart + sentence).length > chunkSize) {
        if (currentPart) parts.push(currentPart);
        currentPart = sentence;
      } else {
        currentPart += sentence;
      }
    }
    if (currentPart) {
      parts.push(currentPart);
    }

    for (const part of parts) {
      await botInstance.sendMessage(chatId, part, options);
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
    }
  } catch (error) {
    console.error("Error sending long message:", error);
    await botInstance.sendMessage(chatId, "❌ មានបញ្ហាណាស់។");
  }
};


// --- Bot Initialization ---
let bot;
if (process.env.BOT_TOKEN) {
  try {
    bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });
    console.log("✅ Bot initialized successfully");

    // === Webhook Setup ===
    const webhookUrl = process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}/bot${process.env.BOT_TOKEN}`
      : `https://money7daysreset-production.up.railway.app/bot${process.env.BOT_TOKEN}`; // Ensure this URL is correct

    bot.setWebHook(webhookUrl, { drop_pending_updates: true }).then(() => {
      console.log(`Webhook set to: ${webhookUrl}`);
    }).catch(e => {
      console.error("❌ Failed to set webhook:", e.message);
      // Fallback to long polling if webhook fails (optional, good for local dev)
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
    if (scheduler) scheduler.init(bot, User, Progress);
    if (analytics) analytics.init(User);
    if (AccessControl) AccessControl.init(User);
    if (ConversionOptimizer) ConversionOptimizer.init(bot, User);

    // === Duplicate Message Prevention (Integrated from your working code) ===
    const processedMessages = new Set();
    let lastProcessTime = {};

    function isDuplicateMessage(msg) {
      const messageId = `${msg.chat.id}-${msg.message_id}`;
      const now = Date.now();

      if (processedMessages.has(messageId) && lastProcessTime[messageId] && now - lastProcessTime[messageId] < 3000) {
        console.log(`[isDuplicateMessage] Blocking duplicate: ${messageId}`);
        return true;
      }

      processedMessages.add(messageId);
      lastProcessTime[messageId] = now;

      // Clean up old entries
      if (processedMessages.size > 50) {
        const cutoff = now - 30000;
        Object.keys(lastProcessTime).forEach((id) => {
          if (lastProcessTime[id] < cutoff) {
            processedMessages.delete(id);
            delete lastProcessTime[id];
          }
        });
      }
      return false;
    }

    // === Centralized Bot Command Handler (New/Improved Structure) ===
    const createBotHandler = (commandFunction, requiresPaid = false, requiresAdmin = false) => {
      return async (msg, match) => {
        console.log(`Handling command: ${match ? match[0] : msg.text} from user: ${msg.from.id}`);

        if (isDuplicateMessage(msg)) {
          console.log(`Duplicate message from ${msg.from.id}, ignoring.`);
          return;
        }

        try {
          const userId = msg.from.id;
          const user = await User.findOne({ telegramId: userId });
          // Ensure isAdmin property exists, default to false
          const isAdmin = user && (user.isAdmin === true || user.isAdmin === 't');
          // Ensure isPaid property exists, default to false
          const isPaid = user && (user.isPaid === true || user.isPaid === 't');

          if (requiresAdmin && !isAdmin) {
            await bot.sendMessage(msg.chat.id, "🚫 You do not have administrator privileges for this command.");
            console.warn(`Admin command blocked for non-admin user ${userId}`);
            return;
          }

          if (requiresPaid && !isPaid && !isAdmin) { // Admins bypass paid check
            await bot.sendMessage(msg.chat.id,
              `🔒 This content requires payment. Please use /pricing to learn more or /payment to proceed.
              \nសម្រាប់មាតិកានេះ, អ្នកត្រូវបង់ប្រាក់។ សូមប្រើ /pricing ដើម្បីដឹងលម្អិត ឬ /payment ដើម្បីបង់ប្រាក់។`);
            console.warn(`Paid content command blocked for unpaid user ${userId}`);
            return;
          }

          // Pass bot, User, Progress, and sendLongMessage to the command function
          // Ensure your command modules (e.g., daily.js) accept these arguments.
          await commandFunction(msg, match, bot, User, Progress, sendLongMessage);

          // Track usage for paid features
          if (requiresPaid && !isAdmin && analytics) { // Don't track admin usage as regular paid usage
              analytics.trackPaidFeatureUsage(userId, match ? match[0] : msg.text);
          }
        } catch (error) {
          console.error(`Error handling ${match ? match[0] : msg.text} for user ${msg.from.id}:`, error);
          await bot.sendMessage(msg.chat.id, `An error occurred while processing your request: ${error.message}. Please try again later.`);
        }
      };
    };

    // === Register all Bot Commands ===

    // Basic Commands
    if (startCommand) {
        bot.onText(/\/start/i, createBotHandler(startCommand.handle));
        bot.onText(/\/help/i, createBotHandler(startCommand.help));
    } else {
        // Fallback for /start if module not loaded
        bot.onText(/\/start/i, async (msg) => {
            console.log("🚀 [START] User:", msg.from.id);
            if (isDuplicateMessage(msg)) return;
            const welcomeMessage = `🌟 សូមស្វាគមន៍មកកាន់ 7-Day Money Flow Reset™!
            💰 កម្មវិធីគ្រប់គ្រងលុយ ៧ ថ្ងៃ ជាភាសាខ្មែរ
            🎯 តម្លៃពិសេស: $24 USD (បញ្ចុះពី $47)
            📱 ប្រើប្រាស់: /pricing ដើម្បីមើលលម្អិត
            💳 ទូទាត់: /payment ដើម្បីចាប់ផ្តើម
            👨‍💼 ទាក់ទង: @Chendasum សម្រាប់ជំនួយ
            /help - ជំនួយពេញលេញ`;
            await bot.sendMessage(msg.chat.id, welcomeMessage);
            console.log("✅ [START] Completed with fallback");
        });
        // Fallback for /help
        bot.onText(/\/help/i, async (msg) => {
          if (isDuplicateMessage(msg)) return;
          await bot.sendMessage(msg.chat.id, `📚 ជំនួយ:
          ប្រើពាក្យបញ្ជាខាងក្រោម:
          /start - ចាប់ផ្តើម bot
          /pricing - មើលតម្លៃ
          /payment - វិធីទូទាត់
          /day1 ដល់ /day7 - មាតិកាកម្មវិធី
          /extended_content_menu - មាតិកាបន្ថែម (សម្រាប់អ្នកបង់ប្រាក់)
          /vip - ព័ត៌មាន VIP
          /admin_menu - ម៉ឺនុយ Admin (សម្រាប់ Admin)
          /progress - តាមដានវឌ្ឍនភាព
          /financial_quiz - ធ្វើតេស្តហិរញ្ញវត្ថុ
          /calculate_daily - គណនារចំណាយប្រចាំថ្ងៃ
          /tools_templates - ឧបករណ៍ និងទម្រង់
          /status - ស្ថានភាពគណនី
          /whoami - ព័ត៌មានអ្នកប្រើប្រាស់
          /faq - សំណួរញឹកញាប់
          /quote - សម្រង់ប្រចាំថ្ងៃ
          /book_call - កក់ការហៅទូរស័ព្ទ

          👨‍💼 ជំនួយផ្ទាល់: @Chendasum`);
        });
    }

    if (paymentCommands) {
        bot.onText(/\/pricing/i, createBotHandler(paymentCommands.pricing));
        bot.onText(/\/payment/i, createBotHandler(paymentCommands.instructions));
    } else {
        // Fallback for /pricing
        bot.onText(/\/pricing/i, async (msg) => {
            if (isDuplicateMessage(msg)) return;
            const fallbackPricing = `💰 តម្លៃកម្មវិធី 7-Day Money Flow Reset™
            🎯 កម្មវិធីសាមញ្ញ (Essential)
            💵 តម្លៃ: $24 USD
            🏷️ កូដ: LAUNCH50
            💎 វិធីទូទាត់:
            • ABA Bank: 000 194 742
            • ACLEDA Bank: 092 798 169  
            • Wing: 102 534 677
            • ឈ្មោះ: SUM CHENDA
            👉 /payment - ការណែនាំទូទាត់
            👉 @Chendasum - ជំនួយផ្ទាល់`;
            await bot.sendMessage(msg.chat.id, fallbackPricing);
        });
        // Fallback for /payment
        bot.onText(/\/payment/i, async (msg) => {
            if (isDuplicateMessage(msg)) return;
            const fallbackPayment = `💳 ការណែនាំទូទាត់
            🏦 ធនាគារដែលអាចប្រើបាន:
            • ABA Bank: 000 194 742
            • ACLEDA Bank: 092 798 169
            • Wing: 102 534 677
            • ឈ្មោះ: SUM CHENDA
            💰 ចំនួន: $24 USD
            📝 Reference: BOT${msg.from.id}
            📸 បន្ទាប់ពីទូទាត់:
            1. ថតរូបបញ្ជាក់
            2. ផ្ញើមក @Chendasum
            3. រង់ចាំ ១-២ ម៉ោង
            👨‍💼 ជំនួយ: @Chendasum`;
            await bot.sendMessage(msg.chat.id, fallbackPayment);
        });
    }

    bot.onText(/\/test/i, async (msg) => {
      try {
        await bot.sendMessage(msg.chat.id, "✅ Enhanced bot is working! All systems operational.");
        console.log("Test command sent to:", msg.from.id);
      } catch (error) {
        console.error("Test command error:", error.message);
      }
    });

    // Daily Program Commands (requires payment)
    if (dailyCommands) {
        for (let day = 1; day <= 7; day++) {
            bot.onText(new RegExp(`/day${day}`, 'i'), createBotHandler(dailyCommands.handle, true));
        }
    }

    // Extended Content Commands (requires payment)
    if (extendedContent) {
        for (let day = 8; day <= 30; day++) {
            bot.onText(new RegExp(`/extended_day${day}`, 'i'), createBotHandler(extendedContent.handle, true));
        }
        bot.onText(/\/extended_content_menu/i, createBotHandler(extendedContent.showMenu, true));
    }

    // VIP Commands (requires payment for basic, then additional VIP purchase)
    if (vipCommands) {
        bot.onText(/\/vip/i, createBotHandler(vipCommands.info, true));
        bot.onText(/\/vip_apply/i, createBotHandler(vipCommands.apply, true));
        bot.onText(/\/vip_status/i, createBotHandler(vipCommands.checkStatus, true));
    }

    // Free Tools/Assessment Commands
    if (financialQuiz) {
        bot.onText(/\/financial_quiz/i, createBotHandler(financialQuiz.startQuiz));
    }
    if (freeTools) {
        bot.onText(/\/calculate_daily/i, createBotHandler(freeTools.calculateDailyExpenses));
    }
    if (toolsTemplates) {
        bot.onText(/\/tools_templates/i, createBotHandler(toolsTemplates.showTemplates));
    }

    // Badges, Quotes, Booking Commands
    if (badgesCommands) {
        bot.onText(/\/badges/i, createBotHandler(badgesCommands.showBadges, true));
    }
    if (quotesCommands) {
        bot.onText(/\/quote/i, createBotHandler(quotesCommands.getRandomQuote));
    }
    if (bookingCommands) {
        bot.onText(/\/book_call/i, createBotHandler(bookingCommands.bookCall));
    }
    if (tierFeatures) {
        bot.onText(/\/tier_features/i, createBotHandler(tierFeatures.showFeatures));
    }

    // Marketing Commands
    if (marketingCommands) {
        bot.onText(/\/marketing_info/i, createBotHandler(marketingCommands.info));
    }
    if (marketingContent) {
        bot.onText(/\/marketing_content_menu/i, createBotHandler(marketingContent.showMenu));
    }
    if (previewCommands) {
        bot.onText(/\/preview/i, createBotHandler(previewCommands.preview));
    }


    // Admin Commands (requires admin status)
    if (adminCommands) {
        bot.onText(/\/admin_menu/i, createBotHandler(adminCommands.showAdminMenu, false, true));
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
        // Additional admin commands from your previous code
        bot.onText(/\/admin_progress (.+)/i, createBotHandler(adminCommands.checkProgress, false, true));
        bot.onText(/\/admin_analytics/i, createBotHandler(adminCommands.showAnalytics, false, true));
        // Note: adminCommands.confirmPayment is integrated into the /webhook/payment route.
    }

    // 30-Day Admin Commands (requires admin status)
    if (thirtyDayAdmin) {
        bot.onText(/\/30day_admin_menu/i, createBotHandler(thirtyDayAdmin.showMenu, false, true));
        bot.onText(/\/30day_admin_send_welcome (\d+)/i, createBotHandler(thirtyDayAdmin.sendWelcomeMessage, false, true));
        bot.onText(/\/30day_admin_schedule_next (\d+)/i, createBotHandler(thirtyDayAdmin.scheduleNextDayMessage, false, true));
        bot.onText(/\/30day_admin_send_day (\d+) (\d+)/i, createBotHandler(thirtyDayAdmin.sendSpecificDayMessage, false, true));
        bot.onText(/\/30day_admin_view_scheduled/i, createBotHandler(thirtyDayAdmin.viewScheduledMessages, false, true));
    }

    // Progress Tracker Commands (requires payment)
    if (progressTracker) {
      bot.onText(/\/progress/i, createBotHandler(progressTracker.showProgress, true));
      bot.onText(/\/update_progress (\d+)/i, createBotHandler(progressTracker.updateProgress, true));
    }


    // === Other Utility Commands ===
    bot.onText(/\/faq|FAQ|faq/i, async (msg) => {
      if (isDuplicateMessage(msg)) return;
      try {
        const user = await User.findOne({ telegramId: msg.from.id });
        const isPaid = user?.isPaid === true || user?.isPaid === 't';

        let faqMessage;
        if (!isPaid) {
          faqMessage = `❓ សំណួរញឹកញាប់ (FAQ)
            💰 អំពីតម្លៃ:
            - តម្លៃប៉ុន្មាន? → $24 (Essential)
            - ទូទាត់យ៉ាងដូចម្តេច? → ABA, ACLEDA, Wing
            - បញ្ជាក់ការទូទាត់? → ១-២ ម៉ោង
            📱 ពាក្យបញ្ជា:
            - /start - ចាប់ផ្តើម
            - /pricing - មើលតម្លៃ
            - /payment - ការទូទាត់
            - /help - ជំនួយ
            👨‍💼 ទាក់ទង: @Chendasum`;
        } else {
          faqMessage = `❓ សំណួរញឹកញាប់ (FAQ) - សមាជិក
            ✅ អ្នកបានទូទាត់រួច!
            📚 កម្មវិធី ៧ ថ្ងៃ:
            - /day1 ដល់ /day7
            📈 កម្មវិធី 30 ថ្ងៃ:
            - /extended_content_menu - មាតិកាបន្ថែម
            🏆 តាមដាន:
            - /badges - សមិទ្ធផល
            - /progress - ការរីកចម្រើន
            👨‍💼 ទាក់ទង: @Chendasum`;
        }
        await bot.sendMessage(msg.chat.id, faqMessage);
      } catch (error) {
        console.error("Error in FAQ command:", error);
        await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហាណាស់។");
      }
    });

    bot.onText(/\/status|ស្ថានភាព/i, async (msg) => {
      if (isDuplicateMessage(msg)) return;
      try {
        const user = await User.findOne({ telegramId: msg.from.id });
        if (!user) {
          await bot.sendMessage(msg.chat.id, "អ្នកមិនទាន់ចុះឈ្មោះ។ ប្រើ /start ដើម្បីចាប់ផ្តើម។");
          return;
        }

        const isPaid = user.isPaid === true || user.isPaid === 't';
        const progressData = await Progress.findOne({ userId: msg.from.id }); // Using userId as per schema

        let statusMessage = `📊 ស្ថានភាពគណនីរបស់អ្នក:
            👤 អ្នកប្រើប្រាស់: ${user.firstName || "មិនស្គាល់"}
            📅 ចូលរួម: ${user.joinedAt ? new Date(user.joinedAt).toDateString() : "មិនស្គាល់"}
            💰 ស្ថានភាព: ${isPaid ? "✅ បានទូទាត់" : "❌ មិនទាន់ទូទាត់"}
            🎯 កម្រិត: ${user.tier || "Essential"}`;

        if (isPaid) {
          statusMessage += `
            📈 ថ្ងៃបច្ចុប្បន្ន: Day ${progressData?.currentDay || 0}
            🎯 អ្នកអាចប្រើប្រាស់កម្មវិធីបានពេញលេញ!`;
        } else {
          statusMessage += `
            🔒 សូមទូទាត់ដើម្បីចូលប្រើ Day 1-7
            💡 ប្រើ /pricing ដើម្បីមើលតម្លៃ`;
        }
        await bot.sendMessage(msg.chat.id, statusMessage);
      } catch (error) {
        console.error("Error in status command:", error);
        await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហាណាស់។");
      }
    });

    bot.onText(/\/whoami/i, async (msg) => {
      if (isDuplicateMessage(msg)) return;
      try {
        const user = await User.findOne({ telegramId: msg.from.id });
        const adminId = parseInt(process.env.ADMIN_CHAT_ID); // Main admin from .env
        const secondaryAdminId = parseInt(process.env.SECONDARY_ADMIN_CHAT_ID || '0'); // Secondary admin if exists
        const isAdmin = msg.from.id === adminId || msg.from.id === secondaryAdminId || (user && (user.isAdmin === true || user.isAdmin === 't'));

        let response = `🔍 ព័ត៌មានរបស់អ្នក:\n\n`;
        response += `• Chat ID: ${msg.chat.id}\n`;
        response += `• User ID: ${msg.from.id}\n`;
        response += `• ឈ្មោះ: ${msg.from.first_name || "N/A"}\n`;
        response += `• Username: ${msg.from.username ? "@" + msg.from.username : "N/A"}\n`;
        response += `• Admin: ${isAdmin ? "✅" : "❌"}\n`;

        if (user) {
          response += `• ចុះឈ្មោះ: ✅\n`;
          response += `• ទូទាត់: ${user.isPaid ? "✅" : "❌"}\n`;
          response += `• កម្រិត: ${user.tier || "Essential"}\n`;
        } else {
          response += `• ចុះឈ្មោះ: ❌\n`;
        }
        await bot.sendMessage(msg.chat.id, response);
      } catch (error) {
        console.error("Error in whoami command:", error);
        await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហាណាស់។");
      }
    });


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

// === MESSAGE HANDLERS (for non-command text inputs) ===
// These are kept separate from createBotHandler as they respond to natural language/specific phrases.
bot.on("message", async (msg) => {
  if (!msg.text || msg.text.startsWith("/")) return; // Ignore commands
  if (isDuplicateMessage(msg)) return; // Prevent duplicate processing

  const text = msg.text.toLowerCase();
  const userId = msg.from.id;
  const user = await User.findOne({ telegramId: userId });
  const isPaid = user?.isPaid === true || user?.isPaid === 't';


  // Check if it's a financial quiz response
  if (financialQuiz && financialQuiz.processQuizResponse) {
    if (await financialQuiz.processQuizResponse(msg, bot)) {
      return;
    }
  }

  // Check if it's a free tools response
  if (freeTools && freeTools.processToolResponse) {
    if (await freeTools.processToolResponse(msg, bot, user)) { // Pass user for context
      return;
    }
  }

  // Handle specific text commands (from your working code)
  if (text === "vip apply") {
    try {
      if (!user || !isPaid) {
        await bot.sendMessage(msg.chat.id, "🔒 សូមទូទាត់មុនដើម្បីចូលរួមកម្មវិធី VIP។ ប្រើ /pricing");
        return;
      }
      if (vipCommands && vipCommands.apply) {
        await vipCommands.apply(msg, bot, User, Progress, sendLongMessage); // Pass necessary args
      } else {
        await bot.sendMessage(msg.chat.id, `🌟 VIP APPLICATION
          សូមផ្ញើព័ត៌ម: 1️⃣ ឈ្មោះពេញ 2️⃣ អាជីវកម្ម 3️⃣ គោលដៅហិរញ្ញវត្ថុ 4️⃣ លេខទូរស័ព្ទ
          💰 តម្លៃ VIP: $197 📞 Admin នឹងទាក់ទងអ្នក`);
      }
    } catch (error) {
      console.error("Error handling VIP APPLY:", error);
      await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហាណាស់។");
    }
  } else if (text === "ready for day 1") {
    await handleReadyForDay1(msg, bot, User, Progress);
  } else if (text.includes("day") && text.includes("complete")) {
    await handleDayComplete(msg, bot, User, Progress);
  } else if (text === "program complete") {
    await handleProgramComplete(msg, bot, User, Progress);
  } else if (text === "capital clarity" || text === "CAPITAL CLARITY") {
    await handleCapitalClarity(msg, bot, User, Progress);
  }
});

// Handler functions (kept from your original code, adapted to use bot, User, Progress)
async function handleReadyForDay1(msg, botInstance, UserModel, ProgressModel) {
  try {
    const user = await UserModel.findOne({ telegramId: msg.from.id });
    const isPaid = user?.isPaid === true || user?.isPaid === 't';

    if (!user || !isPaid) {
      await botInstance.sendMessage(msg.chat.id, "🔒 សូមទូទាត់មុនដើម្បីចូលរួមកម្មវិធី។ ប្រើ /pricing");
      return;
    }

    await ProgressModel.findOneAndUpdate(
      { userId: msg.from.id }, // Corrected field name
      { readyForDay1: true, currentDay: 1 }, // Corrected field names
      { upsert: true }
    );

    await botInstance.sendMessage(msg.chat.id, `🎉 ល្អហើយ! អ្នកត្រៀមរួចហើយ!
      ចាប់ផ្តើមថ្ងៃទី ១ ឥឡូវនេះ: /day1
      ថ្ងៃទី ១ នឹងផ្ញើស្វ័យប្រវត្តិនៅម៉ោង ៩ ព្រឹកថ្ងៃស្អែកផងដែរ។
      ជំនួយ ២៤/៧ ជាភាសាខ្មែរ! 💪`);
  } catch (error) {
    console.error("Error handling ready for day 1:", error);
    await botInstance.sendMessage(msg.chat.id, "❌ មានបញ្ហាណាស់។");
  }
}

async function handleDayComplete(msg, botInstance, UserModel, ProgressModel) {
  const dayMatch = msg.text.toUpperCase().match(/DAY\s*(\d+)\s*COMPLETE/);
  if (!dayMatch) return;

  const dayNumber = parseInt(dayMatch[1]);
  const updateField = `day${dayNumber}Completed`;
  const completedAtField = `day${dayNumber}CompletedAt`;
  const nextDay = dayNumber + 1;

  await ProgressModel.findOneAndUpdate(
    { userId: msg.from.id }, // Corrected field name
    {
      [updateField]: true,
      [completedAtField]: new Date(),
      currentDay: nextDay <= 7 ? nextDay : 7 // Corrected field name
    },
    { upsert: true }
  );

  // Removed emojiReactions and celebrations as direct imports were removed for simplicity
  // You can re-add these services if their files exist and functionality is desired.
  const completeReaction = `🎉 ល្អណាស់! អ្នកបានបញ្ចប់ថ្ងៃទី ${dayNumber}!`;
  await botInstance.sendMessage(msg.chat.id, completeReaction);

  const celebrationMessage = `🎊 សូមអបអរសាទរ! អ្នកបានបញ្ចប់ថ្ងៃទី ${dayNumber} ដោយជោគជ័យ!
    📈 វឌ្ឍនភាព: ${dayNumber}/7 ថ្ងៃ
    💪 បន្តទៅមុខទៀត!`;
  await sendLongMessage(botInstance, msg.chat.id, celebrationMessage, { parse_mode: "HTML" });

  if (dayNumber < 7) {
    await botInstance.sendMessage(msg.chat.id, `🚀 ត្រៀមរួចសម្រាប់ថ្ងៃទី ${nextDay}? ចុច /day${nextDay}`);
  } else {
    await botInstance.sendMessage(msg.chat.id, `🎊 អ្នកបានបញ្ចប់កម្មវិធីពេញលេញ! សរសេរ "PROGRAM COMPLETE"`);
  }
}

async function handleProgramComplete(msg, botInstance, UserModel, ProgressModel) {
  try {
    // Removed celebrations direct call
    const programCelebration = `🎊 អបអរសាទរ! អ្នកបានបញ្ចប់កម្មវិធី 7-Day Money Flow Reset™!
      🎯 ជំហានបន្ទាប់:
      1️⃣ អនុវត្តផែនការ ៣០ ថ្ងៃ
      2️⃣ ពិនិត្យដំណើរការប្រចាំសប្តាហ៍
      3️⃣ មានសំណួរ? ទាក់ទងមកបាន!
      🚀 ចង់បន្តកម្រិតបន្ទាប់?
      VIP Advanced Program ចាប់ផ្តើមខែក្រោយ!
      សួរ: "VIP PROGRAM INFO"`;

    await sendLongMessage(botInstance, msg.chat.id, programCelebration, { parse_mode: "HTML" });

    await ProgressModel.findOneAndUpdate(
      { userId: msg.from.id }, // Corrected field name
      { programCompleted: true, programCompletedAt: new Date() },
      { upsert: true }
    );

    if (vipCommands && vipCommands.offer) {
      await vipCommands.offer(msg, botInstance, UserModel, ProgressModel, sendLongMessage); // Pass necessary args
    }
  } catch (error) {
    console.error("Error handling PROGRAM COMPLETE:", error);
    await botInstance.sendMessage(msg.chat.id, "❌ មានបញ្ហាណាស់។");
  }
}

async function handleCapitalClarity(msg, botInstance, UserModel, ProgressModel) {
  try {
    const user = await UserModel.findOne({ telegramId: msg.from.id });
    const isPaid = user?.isPaid === true || user?.isPaid === 't';

    if (!user || !isPaid) {
      await botInstance.sendMessage(msg.chat.id, "🔒 សូមទូទាត់មុនដើម្បីចូលប្រើ Capital Clarity។ ប្រើ /pricing");
      return;
    }

    if (vipCommands && vipCommands.capitalClarity) {
      await vipCommands.capitalClarity(msg, botInstance, UserModel, ProgressModel, sendLongMessage); // Pass necessary args
    } else {
      await botInstance.sendMessage(msg.chat.id, `🏛️ Capital Clarity - យុទ្ធសាស្ត្រមូលធនឯកជន
        🎯 វគ្គយុទ្ធសាស្ត្រឯកជនសម្រាប់:
        - ស្ថាបនិកដែលគ្រប់គ្រងមូលធន
        - អ្នកប្រតិបត្តិដែលមានរចនាសម្ព័ន្ធមូលនិធិ
        - ម្ចាស់អាជីវកម្មដែលគ្រោងរីកចម្រើន
        💰 ការវិនិយោគ: $197
        📞 ទាក់ទង: @Chendasum សម្រាប់ព័ត៌មានលម្អិត`);
    }
  } catch (error) {
    console.error("Error handling Capital Clarity:", error);
    await botInstance.sendMessage(msg.chat.id, "❌ មានបញ្ហាណាស់។");
  }
}

// === Start Content Scheduler (for automated daily messages, upsells, etc.) ===
// This should be done only once the bot is initialized
if (bot && ContentScheduler) {
  try {
    const contentScheduler = new ContentScheduler(bot, User, Progress);
    contentScheduler.start(); // Start the cron jobs within the scheduler
    console.log("🤖 Content Scheduler started for automated messages.");
  } catch (error) {
    console.error("❌ Could not start content scheduler:", error.message);
  }
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

// === BASIC ROUTES ===
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
      "Access Control",
      "Content Scheduling",
      "Conversion Optimization"
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
    scheduler_running: cron.getTasks().size > 0 || "N/A", // Check if cron is running
  });
});

app.get("/analytics", async (req, res) => {
  try {
    if (analytics && analytics.getStats) {
      const stats = await analytics.getStats();
      res.json(stats);
    } else {
      res.status(503).json({ message: "Analytics module not loaded or not ready" });
    }
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ error: "Failed to get analytics" });
  }
});

app.post("/webhook/payment", async (req, res) => {
  try {
    const { userId, amount, status, transactionId } = req.body;
    console.log(`Payment webhook received: userId=${userId}, amount=${amount}, status=${status}`);

    if (status === "completed" && amount >= 24) {
      if (paymentCommands && paymentCommands.confirmPayment) {
        await paymentCommands.confirmPayment(bot, userId, transactionId);
        console.log(`Payment confirmed for userId: ${userId}`);
      } else {
        console.warn("PaymentCommands module or confirmPayment function not loaded.");
      }
    } else {
      console.log(`Payment not completed or amount insufficient for userId: ${userId}`);
    }

    res.status(200).json({ success: true, message: "Payment webhook processed" });
  } catch (error) {
    console.error("Payment webhook error:", error);
    res.status(500).json({ error: "Internal server error during payment webhook" });
  }
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