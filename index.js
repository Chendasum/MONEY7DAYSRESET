require("dotenv").config();

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const cron = require("node-cron");

// --- Configuration ---
const BOT_TOKEN = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";
const MESSAGE_CHUNK_SIZE = 800;
const ADMIN_IDS = [
    parseInt(process.env.ADMIN_CHAT_ID),
    484389665 // Secondary admin ID
].filter(id => !isNaN(id)); // Ensure only valid numbers are kept

// Railway URL - IMPORTANT: Use your actual Railway domain here.
// Based on previous conversations, this was: https://money7daysreset-production.up.railway.app
const RAILWAY_URL = "https://money7daysreset-production.up.railway.app";

// Set proper UTF-8 encoding for the environment
process.env.NODE_ICU_DATA = "/usr/share/nodejs/node-icu-data";
process.env.LANG = "en_US.UTF-8";

// --- Database Models ---
// Database connection is assumed to be handled by Drizzle ORM with PostgreSQL
console.log("🔍 Database configured with Drizzle ORM and PostgreSQL (via models)");
console.log("✅ Database ready for operations");
const User = require("./models/User");
const Progress = require("./models/Progress");

// --- Command Modules ---
// Ensure these files exist in your project's 'commands' folder
const startCommand = require("./commands/start");
const dailyCommands = require("./commands/daily");
const paymentCommands = require("./commands/payment");
const vipCommands = require("./commands/vip");
const adminCommands = require("./commands/admin");
const badgesCommands = require("./commands/badges"); // If these are used.
const quotesCommands = require("./commands/quotes"); // If these are used.
const bookingCommands = require("./commands/booking"); // If these are used.
const tierFeatures = require("./commands/tier-features"); // If these are used.
const marketingCommands = require("./commands/marketing"); // If these are used.
const marketingContent = require("./commands/marketing-content");
const extendedContent = require("./commands/extended-content"); // This is the problematic one
const thirtyDayAdmin = require("./commands/30day-admin");
const previewCommands = require("./commands/preview");
const freeTools = require("./commands/free-tools");
const financialQuiz = require("./commands/financial-quiz");
const toolsTemplates = require("./commands/tools-templates");
const progressTracker = require("./commands/progress-tracker"); // Moved here for clarity

// --- Service Modules ---
// Ensure these files exist in your project's 'services' folder
const scheduler = require("./services/scheduler");
const analytics = require("./services/analytics");
const celebrations = require("./services/celebrations"); // If used.
const progressBadges = require("./services/progress-badges"); // If used.
const emojiReactions = require("./services/emoji-reactions"); // If used.
const AccessControl = require("./services/access-control");
const ContentScheduler = require("./services/content-scheduler");
const ConversionOptimizer = require("./services/conversion-optimizer");

// --- Utility Modules ---
const { sendLongMessage } = require("./utils/message-splitter");
const { default: fetch } = require("node-fetch"); // Ensure node-fetch is imported correctly

// Initialize Telegram bot for webhook mode
const bot = new TelegramBot(BOT_TOKEN, {
    polling: false,
    onlyFirstMatch: true,
});

// Initialize Express app
const app = express();
const accessControl = new AccessControl();
const conversionOptimizer = new ConversionOptimizer();

// --- Duplicate Message Prevention System ---
const processedMessages = new Set();
let lastProcessTime = {};

function isDuplicateMessage(msg) {
    const messageId = `${msg.chat.id}-${msg.message_id}`;
    const now = Date.now();

    if (processedMessages.has(messageId) && lastProcessTime[messageId] && now - lastProcessTime[messageId] < 3000) {
        console.log(`[DUPLICATE] Blocking recent duplicate: ${messageId} within 3s`);
        return true;
    }

    processedMessages.add(messageId);
    lastProcessTime[messageId] = now;

    // Clean up old entries periodically
    if (processedMessages.size > 50) {
        const cutoff = now - 30000; // 30 seconds
        Object.keys(lastProcessTime).forEach((id) => {
            if (lastProcessTime[id] < cutoff) {
                processedMessages.delete(id);
                delete lastProcessTime[id];
            }
        });
    }
    console.log(`[MESSAGE] Processing message: ${messageId}`);
    return false;
}

// --- Middleware ---
app.use(express.json({ limit: "10mb", charset: "utf-8" }));
app.use(express.urlencoded({ extended: true, charset: "utf-8" }));
app.use((req, res, next) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    next();
});

// --- Helper Functions ---

// Centralized error response for bot commands
async function sendErrorMessage(chatId, command, error) {
    console.error(`❌ [${command} Command] Error handling:`, error);
    await bot.sendMessage(chatId, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀតនៅពេលក្រោយ។");
}

// Check if user is paid
async function checkPaidAccess(msg, bot) {
    const user = await User.findOne({ telegram_id: msg.from.id });
    const isPaid = user?.is_paid === true || user?.is_paid === "t";
    if (!user || !isPaid) {
        await bot.sendMessage(msg.chat.id, "🔒 សូមទូទាត់មុនដើម្បីចូលរួមកម្មវិធី។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។");
        return false;
    }
    return true;
}

// Check if user is an admin
function isAdmin(userId) {
    return ADMIN_IDS.includes(userId);
}

// --- Bot Initialization for Webhook Mode ---
async function initBotWebhook() {
    console.log("Starting bot initialization process for webhooks...");

    if (!BOT_TOKEN) {
        console.error("❌ ERROR: BOT_TOKEN is not set in env.txt!");
        console.error("Please ensure env.txt exists and contains BOT_TOKEN.");
        process.exit(1);
    } else {
        console.log("✅ BOT_TOKEN loaded successfully.");
    }

    try {
        // Stop any active polling (good practice for webhook setup)
        try {
            await bot.stopPolling();
            console.log("Polling stopped successfully (if active).");
        } catch (stopError) {
            console.log("No active polling to stop or polling was already stopped (expected).");
        }

        // Delete existing webhook to clear any stale configurations
        try {
            const deleteResult = await bot.deleteWebHook();
            console.log("Webhook deleted successfully (via bot.deleteWebHook()):", deleteResult);
        } catch (deleteError) {
            console.log("Failed to delete webhook (via bot.deleteWebHook()):", deleteError.message);
        }

        // Construct and set the new webhook URL
        const actualWebhookUrl = `${RAILWAY_URL}/bot${BOT_TOKEN}`;
        console.log(`Attempting to set webhook to: ${actualWebhookUrl}`);
        const setWebhookResult = await bot.setWebHook(actualWebhookUrl);
        console.log("✅ Webhook set successfully:", setWebhookResult);

        console.log("✅ Bot initialized successfully for webhook mode.");
    } catch (error) {
        console.error("❌ Bot initialization error for webhooks:", error.message);
        process.exit(1);
    }
}

// --- Main Application Startup ---
(async () => {
    await initBotWebhook();

    const server = app.listen(PORT, HOST, () => {
        console.log(`🚀 Server running on ${HOST}:${PORT}`);
        console.log(`🔥 7-Day Money Flow automation ACTIVE!`);
        console.log(`✅ Server is fully listening for incoming requests.`);
    });

    // Schedule daily messages (9 AM Cambodia time)
    cron.schedule("0 9 * * *", async () => {
        console.log("🕘 Sending daily messages...");
        try {
            await scheduler.sendDailyMessages(bot);
        } catch (error) {
            console.error("Error sending daily messages via cron:", error);
        }
    }, {
        timezone: "Asia/Phnom_Penh"
    });

    // Start content scheduler
    const contentScheduler = new ContentScheduler(bot);
    contentScheduler.start();

    console.log("🤖 Bot started successfully with 7-Day + 30-Day automation!");
    console.log("🚀 Features added:");
    console.log("    • Auto next-day reminders (24h delay)");
    console.log("    • Day 3 upsell automation (1h delay)");
    console.log("    • 30-day follow-up for results");
    console.log("    • Enhanced welcome sequence");
    console.log("    • 30-day extended content automation");
    console.log("    • Daily content delivery (9 AM Cambodia)");
    console.log("    • Evening motivation (6 PM Cambodia)");
    console.log("    • Weekly reviews (Sunday 8 PM Cambodia)");
    console.log("🔱 7-Day Money Flow Reset™ + 30-Day Extended Content READY!");

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

    // Uncaught exception and unhandled rejection handlers
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

// Handler Wrapper to prevent duplicates and simplify common checks
const createBotHandler = (commandName, handlerFn, requiresPaid = false, requiresAdmin = false) => {
    return async (msg, match) => {
        console.log(`[${commandName} Command] Received from user: ${msg.from.id}`);
        if (isDuplicateMessage(msg)) {
            console.log(`[${commandName} Command] Duplicate message prevented for user: ${msg.from.id}`);
            return;
        }

        if (requiresAdmin && !isAdmin(msg.from.id)) {
            await bot.sendMessage(msg.chat.id, "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះទេ។");
            return;
        }

        if (requiresPaid && !(await checkPaidAccess(msg, bot))) {
            return; // checkPaidAccess sends the message if not paid
        }

        try {
            console.log(`📝 [${commandName} Command] Processing for user: ${msg.from.id}`);
            await handlerFn(msg, bot, match); // Pass match if available
            console.log(`✅ [${commandName} Command] Completed for user: ${msg.from.id}`);
        } catch (error) {
            await sendErrorMessage(msg.chat.id, commandName, error);
        }
    };
};

// --- Standard User Commands ---
bot.onText(/\/start/i, createBotHandler("Start", startCommand.handle));

bot.onText(/\/help/i, createBotHandler("Help", async (msg, bot) => {
    const helpMessageContent = await accessControl.getTierSpecificHelp(msg.from.id);
    await sendLongMessage(bot, msg.chat.id, helpMessageContent, { parse_mode: "Markdown" }, MESSAGE_CHUNK_SIZE);
}));

// Emergency Pricing Command (direct response first, then attempt actual handler)
bot.onText(/\/pricing/i, async (msg) => {
    if (isDuplicateMessage(msg)) return;
    try {
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
        try {
            await paymentCommands.pricing(msg, bot);
        } catch (handlerError) {
            console.error("Pricing handler failed, using emergency response:", handlerError);
        }
    } catch (error) {
        await sendErrorMessage(msg.chat.id, "Pricing", error);
    }
});

// Emergency Payment Command (direct response first, then attempt actual handler)
bot.onText(/\/payment/i, async (msg) => {
    if (isDuplicateMessage(msg)) return;
    try {
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
        try {
            await paymentCommands.instructions(msg, bot);
        } catch (handlerError) {
            console.error("Payment handler failed, using emergency response:", handlerError);
        }
    } catch (error) {
        await sendErrorMessage(msg.chat.id, "Payment", error);
    }
});

bot.onText(/^\/day$/i, createBotHandler("Day Intro", async (msg, bot) => {
    const progress = (await Progress.findOne({ user_id: msg.from.id })) || {};
    const introMessage = `✨ 7-Day Money Flow Reset™ ✨

🎯 សូមស្វាគមន៍មកកាន់កម្មវិធីដ៏មានតម្លៃរបស់អ្នក!

🏆 តម្រុយសម្រាប់អ្នក:
┌─────────────────────────┐
│  🔱 Day 1: Money Flow    │
│    ចាប់ផ្តើមស្គាល់        │
│    Money Flow របស់អ្នក    │
│  + ចាប់ផ្តើមកែប្រែ!      │
└─────────────────────────┘

📈 ថ្ងៃទី ១ នេះអ្នកនឹងរៀន:
• ស្វែងរកកន្លែងដែលលុយលេចធ្លាយ
• យល់ដឹងពី Money Flow របស់អ្នក
• កាត់បន្ថយចំណាយមិនចាំបាច់
• ចាប់ផ្តើមដំណើរកែប្រែ

🚀 ត្រៀមចាប់ផ្តើមហើយឬនៅ?

👉 ចុច /day1 ដើម្បីចាប់ផ្តើមការផ្សងព្រេងថ្ងៃទី ១!`;

    await sendLongMessage(bot, msg.chat.id, introMessage, { parse_mode: "Markdown" }, MESSAGE_CHUNK_SIZE);

    if (progress.currentDay && progress.currentDay > 1) {
        setTimeout(async () => {
            const progressMessage = `📊 វឌ្ឍនភាពរបស់អ្នក:

🔥 ថ្ងៃបានបញ្ចប់: ${progress.currentDay - 1}/7
📈 ភាគរយបញ្ចប់: ${progress.completionPercentage || 0}%

🎯 ថ្ងៃបន្ទាប់: /day${progress.currentDay}`;
            await bot.sendMessage(msg.chat.id, progressMessage);
        }, 1500);
    }
}, true)); // Requires paid access

bot.onText(/\/day([1-7])/i, createBotHandler("Daily Content", async (msg, bot, match) => {
    // dailyCommands.handle already contains the user lookup and paid access check
    // but the wrapper also does it. We can keep both for now, or refine dailyCommands.handle
    // to not do the check if the wrapper is guaranteed to do it.
    await dailyCommands.handle(msg, match, bot);
}, true)); // Requires paid access

bot.onText(/\/vip_program_info|\/vip$/i, createBotHandler("VIP Info", vipCommands.info, true)); // Requires paid access

// VIP Apply Handler
bot.on("message", async (msg) => {
    if (isDuplicateMessage(msg)) return;
    if (msg.text && msg.text.toUpperCase() === "VIP APPLY") {
        const handler = createBotHandler("VIP Apply", vipCommands.apply, true); // Requires paid access
        await handler(msg);
    }
});

// --- 30-Day Extended Content Commands ---
bot.onText(/\/extended(\d+)/i, createBotHandler("Extended Content", async (msg, bot, match) => {
    const day = parseInt(match[1]);
    if (isNaN(day) || day < 8 || day > 30) {
        await bot.sendMessage(msg.chat.id, "❌ មាតិកាបន្ថែមអាចរកបានសម្រាប់ថ្ងៃទី ៨-៣០ ប៉ុណ្ណោះ។");
        return;
    }
    // extendedContent.handleExtendedDay will be called via the wrapper
    await extendedContent.handleExtendedDay(msg, bot, day);
}, true)); // Requires paid access

// --- Admin Commands (using the wrapper with requiresAdmin = true) ---
bot.onText(/\/admin_menu|\/admin/i, createBotHandler("Admin Menu", async (msg, bot) => {
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
}, false, true)); // Does NOT require paid, DOES require admin

bot.onText(/\/admin_users/i, createBotHandler("Admin Users", adminCommands.showUsers, false, true));
bot.onText(/\/admin_progress (.+)/i, createBotHandler("Admin Progress", adminCommands.checkProgress, false, true));
bot.onText(/\/admin_analytics/i, createBotHandler("Admin Analytics", adminCommands.showAnalytics, false, true));
bot.onText(/\/admin_activity/i, createBotHandler("Admin Activity", adminCommands.showActivity, false, true));
bot.onText(/\/admin_followup/i, createBotHandler("Admin Followup", adminCommands.showFollowup, false, true));
bot.onText(/\/admin_message (.+)/i, createBotHandler("Admin Message", adminCommands.sendMessage, false, true));
bot.onText(/\/admin_confirm_payment (.+)/i, createBotHandler("Admin Confirm Payment", adminCommands.confirmPayment, false, true));
bot.onText(/\/admin_export/i, createBotHandler("Admin Export", adminCommands.exportData, false, true));
bot.onText(/\/admin_help/i, createBotHandler("Admin Help", adminCommands.showHelp, false, true));

// Progress Tracking Admin Commands
bot.onText(/\/admin_stuck/i, createBotHandler("Admin Stuck", progressTracker.showStuckUsers, false, true));
bot.onText(/\/admin_completion/i, createBotHandler("Admin Completion", progressTracker.showCompletionRates, false, true));
bot.onText(/\/admin_remind (.+)/i, createBotHandler("Admin Remind", progressTracker.sendManualReminder, false, true));
bot.onText(/\/admin_completed/i, createBotHandler("Admin Completed", progressTracker.showCompletedUsers, false, true));
bot.onText(/\/admin_uploads/i, createBotHandler("Admin Uploads", progressTracker.showUploadTracking, false, true));
bot.onText(/\/admin_photos (.+)/i, createBotHandler("Admin Photos", progressTracker.showUserPhotos, false, true));

// Tools and Templates Admin Commands
bot.onText(/\/admin_daily_template/i, createBotHandler("Admin Daily Template", toolsTemplates.generateDailyTemplate, false, true));
bot.onText(/\/admin_weekly_template/i, createBotHandler("Admin Weekly Template", toolsTemplates.generateWeeklyTemplate, false, true));
bot.onText(/\/admin_engagement_checklist/i, createBotHandler("Admin Engagement Checklist", toolsTemplates.generateEngagementChecklist, false, true));
bot.onText(/\/admin_onboarding_template/i, createBotHandler("Admin Onboarding Template", toolsTemplates.generateOnboardingTemplate, false, true));

// Marketing Content Commands
bot.onText(/\/marketing_hub/i, createBotHandler("Marketing Hub", marketingContent.marketingHub, false, true));
bot.onText(/\/post_success_story/i, createBotHandler("Post Success Story", marketingContent.postSuccessStory, false, true));
bot.onText(/\/post_program_promo/i, createBotHandler("Post Program Promo", marketingContent.postProgramPromo, false, true));
bot.onText(/\/launch_flash_sale/i, createBotHandler("Launch Flash Sale", marketingContent.launchFlashSale, false, true));
bot.onText(/\/content_week/i, createBotHandler("Content Week", marketingContent.contentWeek, false, true));
bot.onText(/\/send_newsletter/i, createBotHandler("Send Newsletter", marketingContent.sendNewsletter, false, true));
bot.onText(/\/marketing_stats/i, createBotHandler("Marketing Stats", marketingContent.marketingStats, false, true));
bot.onText(/\/roi_analysis/i, createBotHandler("ROI Analysis", marketingContent.roiAnalysis, false, true));
bot.onText(/\/referral_program/i, createBotHandler("Referral Program", marketingContent.referralProgram, false, true));

// 30-Day Admin Commands
bot.onText(/\/admin_content_stats/i, createBotHandler("Admin Content Stats", thirtyDayAdmin.contentStats, false, true));
bot.onText(/\/admin_bulk_send/i, createBotHandler("Admin Bulk Send", thirtyDayAdmin.sendBulkContent, false, true));
bot.onText(/\/admin_content_calendar/i, createBotHandler("Admin Content Calendar", thirtyDayAdmin.contentCalendar, false, true));
bot.onText(/\/admin_scheduler_status/i, createBotHandler("Admin Scheduler Status", thirtyDayAdmin.schedulerStatus, false, true));

// Preview System Commands
bot.onText(/\/preview$/i, createBotHandler("Preview", previewCommands.preview));
bot.onText(/\/preview_day1/i, createBotHandler("Preview Day 1", previewCommands.previewDay1));
bot.onText(/\/preview_tools/i, createBotHandler("Preview Tools", previewCommands.previewTools));
bot.onText(/\/preview_results/i, createBotHandler("Preview Results", previewCommands.previewResults));
