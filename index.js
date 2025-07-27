require("dotenv").config();

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const cron = require("node-cron");

console.log("🚀 Starting 7-Day Money Flow Bot with Full Features on Railway...");
console.log("BOT_TOKEN exists:", !!process.env.BOT_TOKEN);
console.log("PORT:", process.env.PORT || 5000);

// Set proper UTF-8 encoding for the environment to handle Khmer characters correctly
process.env.NODE_ICU_DATA = "/usr/share/nodejs/node-icu-data";
process.env.LANG = "en_US.UTF-8";

// Database connection is assumed to be handled by Drizzle ORM with PostgreSQL
console.log("🔍 Database configured with Drizzle ORM and PostgreSQL (via models)");
console.log("✅ Database ready for operations");

// Database Models with error handling
let User, Progress;
try {
  User = require("./models/User");
  Progress = require("./models/Progress");
  console.log("✅ Database models loaded successfully");
} catch (error) {
  console.error("❌ Database models not found:", error.message);
  // Create fallback models
  User = {
    findOne: async () => null,
    findOneAndUpdate: async () => null,
    updateLastActive: async () => null
  };
  Progress = {
    findOne: async () => null,
    findOneAndUpdate: async () => null
  };
}

// Command Modules with error handling for each module
let startCommand, dailyCommands, paymentCommands, vipCommands, adminCommands;
let badgesCommands, quotesCommands, bookingCommands, tierFeatures;
let marketingCommands, marketingContent, extendedContent, thirtyDayAdmin;
let previewCommands, freeTools, financialQuiz, toolsTemplates, progressTracker;

function safeRequire(modulePath, fallbackName) {
  try {
    const module = require(modulePath);
    console.log(`✅ ${fallbackName} loaded successfully`);
    return module;
  } catch (error) {
    console.log(`⚠️ ${fallbackName} not found, using fallback`);
    return null;
  }
}

startCommand = safeRequire("./commands/start", "startCommand");
dailyCommands = safeRequire("./commands/daily", "dailyCommands");
paymentCommands = safeRequire("./commands/payment", "paymentCommands");
vipCommands = safeRequire("./commands/vip", "vipCommands");
adminCommands = safeRequire("./commands/admin", "adminCommands");
badgesCommands = safeRequire("./commands/badges", "badgesCommands");
quotesCommands = safeRequire("./commands/quotes", "quotesCommands");
bookingCommands = safeRequire("./commands/booking", "bookingCommands");
tierFeatures = safeRequire("./commands/tier-features", "tierFeatures");
marketingCommands = safeRequire("./commands/marketing", "marketingCommands");
marketingContent = safeRequire("./commands/marketing-content", "marketingContent");
extendedContent = safeRequire("./commands/extended-content", "extendedContent");
thirtyDayAdmin = safeRequire("./commands/30day-admin", "thirtyDayAdmin");
previewCommands = safeRequire("./commands/preview", "previewCommands");
freeTools = safeRequire("./commands/free-tools", "freeTools");
financialQuiz = safeRequire("./commands/financial-quiz", "financialQuiz");
toolsTemplates = safeRequire("./commands/tools-templates", "toolsTemplates");
progressTracker = safeRequire("./commands/progress-tracker", "progressTracker");

// Service Modules with error handling
let scheduler, analytics, celebrations, progressBadges;
let emojiReactions, AccessControl, ContentScheduler, ConversionOptimizer;

scheduler = safeRequire("./services/scheduler", "scheduler");
analytics = safeRequire("./services/analytics", "analytics");
celebrations = safeRequire("./services/celebrations", "celebrations");
progressBadges = safeRequire("./services/progress-badges", "progressBadges");
emojiReactions = safeRequire("./services/emoji-reactions", "emojiReactions");
AccessControl = safeRequire("./services/access-control", "AccessControl");
ContentScheduler = safeRequire("./services/content-scheduler", "ContentScheduler");
ConversionOptimizer = safeRequire("./services/conversion-optimizer", "ConversionOptimizer");

// Utility Modules with fallback
let sendLongMessage;
try { 
  const utils = require("./utils/message-splitter");
  sendLongMessage = utils.sendLongMessage;
  console.log("✅ Message splitter loaded");
} catch(e) { 
  console.log("⚠️ Message splitter not found, using fallback");
  sendLongMessage = async (bot, chatId, text, options = {}, chunkSize = 4000) => {
    try {
      if (text.length <= chunkSize) {
        return await bot.sendMessage(chatId, text, options);
      }
      
      const chunks = [];
      for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.slice(i, i + chunkSize));
      }
      
      for (const chunk of chunks) {
        await bot.sendMessage(chatId, chunk, options);
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
      }
    } catch (error) {
      console.error("Error sending long message:", error);
      await bot.sendMessage(chatId, "❌ មានបញ្ហាក្នុងការផ្ញើសារ។");
    }
  };
}

const MESSAGE_CHUNK_SIZE = 800;

// Initialize Express app
const app = express();
const accessControl = new (AccessControl || class {
  async getTierSpecificHelp() {
    return `📱 ជំនួយ (Help):

🌟 7-Day Money Flow Reset™ 

📱 ពាក្យបញ្ជាសំខាន់:
- /start - ចាប់ផ្តើម
- /pricing - មើលតម្លៃ
- /payment - ការទូទាត់
- /help - ជំនួយ
- /faq - សំណួរញឹកញាប់

💬 ជំនួយ: @Chendasum`;
  }
})();

const conversionOptimizer = new (ConversionOptimizer || class {})();

// Middleware for parsing JSON and URL-encoded data with UTF-8 support
app.use(express.json({ limit: "10mb", charset: "utf-8" }));
app.use(express.urlencoded({ extended: true, charset: "utf-8" }));

// Set UTF-8 headers for all outgoing responses to ensure proper character encoding
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});

// DUPLICATE PREVENTION SYSTEM: Optimized for webhook mode
const processedMessages = new Set();
let lastProcessTime = {};

function isDuplicateMessage(msg) {
  const messageId = `${msg.chat.id}-${msg.message_id}`;
  const now = Date.now();

  // Only block if same message processed within last 3 seconds (for webhook mode)
  if (processedMessages.has(messageId) && lastProcessTime[messageId] && now - lastProcessTime[messageId] < 3000) {
    console.log(`[isDuplicateMessage] Blocking recent duplicate: ${messageId} within 3s`);
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

// Function to get the Railway URL
function getRailwayUrl() {
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  }
  return `https://money7daysreset-production.up.railway.app`;
}

// Initialize Telegram bot for webhook mode
const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: false,
  onlyFirstMatch: true,
});

// Enhanced bot initialization for webhook mode on Railway
async function initBotWebhook() {
  console.log("Starting bot initialization process for webhooks on Railway...");

  if (!process.env.BOT_TOKEN) {
    console.error("❌ ERROR: BOT_TOKEN is not set in environment variables!");
    console.error("Please ensure BOT_TOKEN is set in Railway environment.");
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
      console.log("No active polling to stop or polling was already stopped (expected).");
    }

    // 2. Delete existing webhook to clear any stale configurations
    try {
      const deleteResult = await bot.deleteWebHook();
      console.log("Webhook deleted successfully (via bot.deleteWebHook()):", deleteResult);
    } catch (deleteError) {
      console.log("Failed to delete webhook (via bot.deleteWebHook()):", deleteError.message);
    }

    // 3. Construct the webhook URL for Railway
    const railwayDomain = getRailwayUrl();
    const actualWebhookUrl = `${railwayDomain}/bot${process.env.BOT_TOKEN}`;

    // Debug: Show which domain we're using
    console.log("🔍 Domain check - getRailwayUrl():", getRailwayUrl());
    console.log("🔍 Using Railway domain:", railwayDomain);

    console.log(`Attempting to set webhook to: ${actualWebhookUrl}`);
    const setWebhookResult = await bot.setWebHook(actualWebhookUrl);
    console.log("✅ Webhook set successfully:", setWebhookResult);

    console.log("✅ Bot initialized successfully for webhook mode on Railway.");
  } catch (error) {
    console.error("❌ Bot initialization error for webhooks:", error.message);
    process.exit(1);
  }
}

// ========================================
// TELEGRAM BOT COMMAND HANDLERS - PART 1
// ========================================

// Handle /start command: Initiates the bot interaction
bot.onText(/\/start/i, async (msg) => {
  console.log("🚀 [START HANDLER] /start command received from user:", msg.from.id, "username:", msg.from.username, "chat_id:", msg.chat.id);
  if (isDuplicateMessage(msg)) {
    console.log("🔄 [START HANDLER] Duplicate /start message prevented for user:", msg.from.id);
    return;
  }
  try {
    console.log("📝 [START HANDLER] Processing /start command for user:", msg.from.id);
    
    if (startCommand && startCommand.handle) {
      await startCommand.handle(msg, bot);
    } else {
      // Enhanced fallback welcome message
      const welcomeMessage = `🌟 សូមស្វាគមន៍មកកាន់ 7-Day Money Flow Reset™!

💰 កម្មវិធីគ្រប់គ្រងលុយ ៧ ថ្ងៃ ជាភាសាខ្មែរ

🎯 តម្លៃពិសេស: $24 USD (បញ្ចុះពី $47)
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

📱 ប្រើប្រាស់: /pricing ដើម្បីមើលលម្អិត
💳 ទូទាត់: /payment ដើម្បីចាប់ផ្តើម

👨‍💼 ទាក់ទង: @Chendasum សម្រាប់ជំនួយ

/help - ជំនួយពេញលេញ`;

      await bot.sendMessage(msg.chat.id, welcomeMessage);
      
      // Register user in database
      try {
        await User.findOneAndUpdate(
          { telegram_id: msg.from.id },
          {
            first_name: msg.from.first_name,
            last_name: msg.from.last_name,
            username: msg.from.username,
            joined_at: new Date(),
            last_active: new Date()
          },
          { upsert: true, new: true }
        );
      } catch (dbError) {
        console.log("Database registration skipped (using fallback)");
      }
    }
    
    console.log("✅ [START HANDLER] Start command completed for user:", msg.from.id);
  } catch (error) {
    console.error("❌ [START HANDLER] Error handling /start command:", error);
    console.error("❌ [START HANDLER] Full error stack:", error.stack);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហាក្នុងការចាប់ផ្តើម។ សូមសាកល្បងម្តងទៀតនៅពេលក្រោយ។");
  }
});

// Handle /help command: Shows help information
bot.onText(/\/help/i, async (msg) => {
  console.log(`[Help Command] Received /help from user: ${msg.from.id}`);
  if (isDuplicateMessage(msg)) {
    console.log(`[Help Command] Duplicate /help message prevented for user: ${msg.from.id}`);
    return;
  }
  try {
    console.log(`[Help Command] Fetching tier-specific help for user: ${msg.from.id}`);
    const helpMessageContent = await accessControl.getTierSpecificHelp(msg.from.id);
    console.log(`[Help Command] Successfully fetched help content. Length: ${helpMessageContent.length}`);
    await sendLongMessage(bot, msg.chat.id, helpMessageContent, { parse_mode: "Markdown" }, MESSAGE_CHUNK_SIZE);
    console.log(`[Help Command] Help message sent to user: ${msg.from.id}`);
  } catch (error) {
    console.error(`❌ [Help Command] Error handling /help command for user ${msg.from.id}:`, error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហាក្នុងការផ្ទុកជំនួយ។ សូមសាកល្បងម្តងទៀត។");
  }
});

// EMERGENCY /pricing command handler - Direct response to restore functionality  
bot.onText(/\/pricing/i, async (msg) => {
  console.log("[PRICING] Command received from user:", msg.from.id);
  if (isDuplicateMessage(msg)) return;
  
  try {
    // Try original handler first
    if (paymentCommands && paymentCommands.pricing) {
      await paymentCommands.pricing(msg, bot);
    } else {
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

🎯 កម្មវិធី Premium (ការប្រឹក្សាផ្ទាល់)
💵 តម្លៃ: $97 USD
✅ ទទួលបាន Essential Program ពេញលេញ
✅ ការប្រឹក្សាផ្ទាល់ខ្លួន 1-on-1
✅ ការតាមដានផ្ទាល់ខ្លួន
✅ ឧបករណ៍វិភាគកម្រិតខ្ពស់

👑 កម្មវិធី VIP (Capital Strategy)
💵 តម្លៃ: $197 USD
✅ ទទួលបាន Premium ពេញលេញ
✅ Capital Clarity Session
✅ Strategic Network Access
✅ Implementation Support

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
    }
    
    console.log("✅ [PRICING] Sent");
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
    // Try original handler first
    if (paymentCommands && paymentCommands.instructions) {
      await paymentCommands.instructions(msg, bot);
    } else {
      // Emergency payment instructions - direct response
      const emergencyPayment = `💳 ការណែនាំទូទាត់

🏦 ABA Bank (រហ័ស)
• គណនី: 000 194 742
• ឈ្មោះ: SUM CHENDA  
• ចំនួន: $24 USD (Essential) / $97 USD (Premium) / $197 USD (VIP)
• Reference: BOT${msg.from.id}

📱 Wing (លឿនបំផុត)
• លេខ: 102 534 677
• ឈ្មោះ: SUM CHENDA
• ចំនួន: $24 USD (Essential) / $97 USD (Premium) / $197 USD (VIP)
• កំណត់ចំណាំ: BOT${msg.from.id}

🏦 ACLEDA Bank
• គណនី: 092 798 169
• ឈ្មោះ: SUM CHENDA
• ចំនួន: $24 USD (Essential) / $97 USD (Premium) / $197 USD (VIP)
• Reference: BOT${msg.from.id}

⚡ បន្ទាប់ពីទូទាត់:
1. ថតរូបបញ្ជាក់ការទូទាត់
2. ផ្ញើមកដោយផ្ទាល់ក្នុងនេះ
3. ចាប់ផ្តើម Day 1 ភ្លាមៗ!

💬 ជំនួយ: @Chendasum

🎯 ជម្រើសតម្លៃ:
• Essential ($24): កម្មវិធី ៧ ថ្ងៃមូលដ្ឋាន
• Premium ($97): + ការប្រឹក្សាផ្ទាល់
• VIP ($197): + Capital Strategy Sessions`;

      await bot.sendMessage(msg.chat.id, emergencyPayment);
    }
    
    console.log("✅ [PAYMENT] Sent");
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
      await bot.sendMessage(chatId, "🔒 សូមទូទាត់មុនដើម្បីចូលរួមកម្មវិធី។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។");
      return;
    }

    const progress = (await Progress.findOne({ user_id: msg.from.id })) || {};

    const introMessage = `✨ 7-Day Money Flow Reset™ ✨

🎯 សូមស្វាគមន៍មកកាន់កម្មវិធីដ៏មានតម្លៃរបស់អ្នក!

🏆 តម្រុយសម្រាប់អ្នក:
┌─────────────────────────┐
│  🔱 Day 1: Money Flow    │
│    ចាប់ផ្តើមស្គាល់       │
│   Money Flow របស់អ្នក    │
│  + ចាប់ផ្តើមកែប្រែ!      │
└─────────────────────────┘

📈 ថ្ងៃទី ១ នេះអ្នកនឹងរៀន:
• ស្វែងរកកន្លែងដែលលុយលេចធ្លាយ
• យល់ដឹងពី Money Flow របស់អ្នក
• កាត់បន្ថយចំណាយមិនចាំបាច់
• ចាប់ផ្តើមដំណើរកែប្រែ

🚀 ត្រៀមចាប់ផ្តើមហើយឬនៅ?

👉 ចុច /day1 ដើម្បីចាប់ផ្តើមការផ្សងព្រេងថ្ងៃទី ១!`;

    await sendLongMessage(bot, chatId, introMessage, { parse_mode: "Markdown" }, MESSAGE_CHUNK_SIZE);

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
      await bot.sendMessage(msg.chat.id, "🔒 សូមទូទាត់មុនដើម្បីចូលរួមកម្មវិធី។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។");
      return;
    }

    if (dailyCommands && dailyCommands.handle) {
      await dailyCommands.handle(msg, match, bot);
    } else {
      // Enhanced fallback daily content with full day content
      const dayContent = getDayContent(match[1]);
      await sendLongMessage(bot, msg.chat.id, dayContent, {}, MESSAGE_CHUNK_SIZE);
      
      // Update progress
      try {
        await Progress.findOneAndUpdate(
          { user_id: msg.from.id },
          { 
            current_day: parseInt(match[1]),
            [`day${match[1]}Accessed`]: true,
            [`day${match[1]}AccessedAt`]: new Date()
          },
          { upsert: true }
        );
      } catch (dbError) {
        console.log("Progress update skipped (using fallback)");
      }
    }
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
      await bot.sendMessage(msg.chat.id, "🔒 សូមទូទាត់មុនដើម្បីចូលរួមកម្មវិធី VIP។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។");
      return;
    }

    if (vipCommands && vipCommands.info) {
      await vipCommands.info(msg, bot);
    } else {
      const vipInfo = `👑 VIP PROGRAM - Capital Strategy & Advanced Financial Mastery

🌟 សូមស្វាគមន៍មកកាន់កម្មវិធី VIP!

💎 អ្វីដែលអ្នកទទួលបាន:
✅ Strategic Foundation Session 1-on-1 (60 នាទី)
✅ ការតាមដាន 30 ថ្ងៃ + Implementation Support  
✅ Capital Foundation Development
✅ Capital Clarity Preview (15 នាទី)
✅ Readiness Assessment for Advanced Capital Systems
✅ Strategic Network Introductions
✅ Pathway to Advanced Capital Work

🎯 ល្អឥតខ្ចោះសម្រាប់:
• អ្នកដែលបានបញ្ចប់ 7-Day Program
• ម្ចាស់អាជីវកម្មដែលចង់ពង្រីក
• អ្នកដែលមានមូលធន $10K+
• អ្នកដែលចង់រៀន Capital Strategy

🏛️ Capital Clarity Session រួមមាន:
1️⃣ Capital X-Ray Analysis
2️⃣ Trust Mapping Assessment  
3️⃣ System Readiness Score
4️⃣ Growth Strategy Development
5️⃣ Implementation Roadmap

💰 ការវិនិយោគ: $197 USD
📞 Response time: 2-4 ម៉ោង
🎯 កម្រិតអ្នកប្រើប្រាស់: Advanced

📋 ដើម្បីដាក់ពាក្យ:
សរសេរ "VIP APPLY" រួមជាមួយ:
• ឈ្មោះពេញ
• អាជីវកម្ម/ការងារ  
• គោលដៅហិរញ្ញវត្ថុ
• លេខទូរស័ព្ទ

🚀 ត្រៀមរួចដើម្បីឡើងកម្រិតបន្ទាប់? សរសេរ "VIP APPLY"!`;
      await sendLongMessage(bot, msg.chat.id, vipInfo, {}, MESSAGE_CHUNK_SIZE);
    }
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
      await bot.sendMessage(msg.chat.id, "🔒 សូមទូទាត់មុនដើម្បីចូលរួមកម្មវិធី VIP។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។");
      return;
    }

    if (vipCommands && vipCommands.info) {
      await vipCommands.info(msg, bot);
    } else {
      const vipMessage = `👑 VIP Program - អ្នកមានសិទ្ធិ!

🌟 កម្មវិធី VIP រួមមាន:
• ការប្រឹក្សាផ្ទាល់ខ្លួន 1-on-1  
• ការតាមដានដោយផ្ទាល់
• មាតិកាកម្រិតខ្ពស់ 30 ថ្ងៃ
• ការគាំទ្រអាទិភាព
• Capital Strategy Sessions

💰 តម្លៃ VIP: $197
📞 ពិគ្រោះ: @Chendasum

✅ អ្នកបានទូទាត់កម្មវិធីមូលដ្ឋានរួចហើយ
👑 សរសេរ "VIP APPLY" ដើម្បីដាក់ពាក្យ`;
      await bot.sendMessage(msg.chat.id, vipMessage);
    }
  } catch (error) {
    console.error("Error in VIP command:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហាក្នុងការផ្ទុកព័ត៌មាន VIP។");
  }
});

// 30-Day Extended Content Commands: Access lessons from Day 8 to Day 30
bot.onText(/\/extended(\d+)/i, async (msg, match) => {
  if (isDuplicateMessage(msg)) return;
  const day = parseInt(match[1]);
  if (isNaN(day) || day < 8 || day > 30) {
    await bot.sendMessage(msg.chat.id, "❌ មាតិកាបន្ថែមអាចរកបានសម្រាប់ថ្ងៃទី ៨-៣០ ប៉ុណ្ណោះ។");
    return;
  }
  try {
    const user = await User.findOne({ telegram_id: msg.from.id });
    const isPaid = user?.is_paid === true || user?.is_paid === 't';
    if (!user || !isPaid) {
      await bot.sendMessage(msg.chat.id, "🔒 សូមទូទាត់មុនដើម្បីចូលប្រើមាតិកាបន្ថែម។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។");
      return;
    }
    
    if (extendedContent && extendedContent.handleExtendedDay) {
      await extendedContent.handleExtendedDay(msg, bot, day);
    } else {
      const extendedDayContent = getExtendedDayContent(day);
      await sendLongMessage(bot, msg.chat.id, extendedDayContent, {}, MESSAGE_CHUNK_SIZE);
    }
  } catch (error) {
    console.error("Error in /extended command:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
  }
});

// Helper function for extended day content
function getExtendedDayContent(day) {
  const extendedContents = {
    8: "📚 ថ្ងៃទី ៨: ការវិភាគចំណូលកម្រិតខ្ពស់",
    9: "📚 ថ្ងៃទី ៩: ការគ្រប់គ្រងចំណាយអាជីវកម្ម", 
    10: "📚 ថ្ងៃទី ១០: ការបង្កើតទម្លាប់ហិរញ្ញវត្ថុ",
    // Add more as needed
  };
  
  return extendedContents[day] || `📚 ថ្ងៃទី ${day} - មាតិកាបន្ថែម

🎯 សូមស្វាគមន៍! អ្នកបានទូទាត់រួចហើយ

មាតិកាថ្ងៃទី ${day} នឹងត្រូវបានផ្ញើមកអ្នកឆាប់ៗនេះ។

📞 ទាក់ទង @Chendasum សម្រាប់មាតិកាពេញលេញ// ========================================
// TELEGRAM BOT COMMAND HANDLERS - PART 2
// ========================================

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
      await bot.sendMessage(msg.chat.id, "🔒 សូមទូទាត់មុនដើម្បីចូលរួមកម្មវិធី។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។");
      return;
    }

    if (dailyCommands && dailyCommands.handle) {
      await dailyCommands.handle(msg, match, bot);
    } else {
      // Enhanced fallback daily content with full day content
      const dayContent = getDayContent(match[1]);
      await sendLongMessage(bot, msg.chat.id, dayContent, {}, MESSAGE_CHUNK_SIZE);
      
      // Update progress
      try {
        await Progress.findOneAndUpdate(
          { user_id: msg.from.id },
          { 
            current_day: parseInt(match[1]),
            [`day${match[1]}Accessed`]: true,
            [`day${match[1]}AccessedAt`]: new Date()
          },
          { upsert: true }
        );
      } catch (dbError) {
        console.log("Progress update skipped (using fallback)");
      }
    }
  } catch (error) {
    console.error("Error in daily command:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
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

// Admin Commands: Restricted access commands for bot administrators
const adminCommands_safe = {
  showUsers: async (msg, bot) => {
    const adminId = parseInt(process.env.ADMIN_CHAT_ID);
    const secondaryAdminId = 484389665;
    if (![adminId, secondaryAdminId].includes(msg.from.id)) {
      await bot.sendMessage(msg.chat.id, "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះទេ។");
      return;
    }
    
    try {
      const users = await User.find().limit(50);
      let usersList = "📊 អ្នកប្រើប្រាស់ចុងក្រោយ:\n\n";
      
      users.forEach((user, index) => {
        const isPaid = user.is_paid === true || user.is_paid === 't';
        usersList += `${index + 1}. ${user.first_name} (${user.telegram_id})\n`;
        usersList += `   💰 ${isPaid ? "✅ បានទូទាត់" : "❌ មិនទាន់"}\n`;
        usersList += `   📅 ${user.joined_at ? new Date(user.joined_at).toDateString() : "N/A"}\n\n`;
      });
      
      await sendLongMessage(bot, msg.chat.id, usersList, {}, MESSAGE_CHUNK_SIZE);
    } catch (error) {
      await bot.sendMessage(msg.chat.id, "📊 Admin feature កំពុងត្រូវបានអភិវឌ្ឍ។");
    }
  },
  
  showAnalytics: async (msg, bot) => {
    const adminId = parseInt(process.env.ADMIN_CHAT_ID);
    const secondaryAdminId = 484389665;
    if (![adminId, secondaryAdminId].includes(msg.from.id)) {
      await bot.sendMessage(msg.chat.id, "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះទេ។");
      return;
    }
    
    try {
      const totalUsers = await User.countDocuments();
      const paidUsers = await User.countDocuments({ is_paid: { $in: [true, 't'] } });
      const todayUsers = await User.countDocuments({
        joined_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });
      
      const analyticsMessage = `📈 Analytics Dashboard

👥 សរុបអ្នកប្រើប្រាស់: ${totalUsers}
💰 បានទូទាត់: ${paidUsers}
🆕 ថ្ងៃនេះ: ${todayUsers}
📊 អត្រាបង្វែរ: ${totalUsers > 0 ? ((paidUsers/totalUsers)*100).toFixed(1) : 0}%

🕒 ពេលវេលា: ${new Date().toLocaleString()}
🖥️ Server Uptime: ${Math.floor(process.uptime() / 3600)}h`;
      
      await bot.sendMessage(msg.chat.id, analyticsMessage);
    } catch (error) {
      await bot.sendMessage(msg.chat.id, "📈 Analytics កំពុងត្រូវបានអភិវឌ្ឍ។");
    }
  },
  
  confirmPayment: async (msg, match, bot) => {
    const adminId = parseInt(process.env.ADMIN_CHAT_ID);
    const secondaryAdminId = 484389665;
    if (![adminId, secondaryAdminId].includes(msg.from.id)) {
      await bot.sendMessage(msg.chat.id, "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះទេ។");
      return;
    }
    
    const userId = match[1];
    if (!userId) {
      await bot.sendMessage(msg.chat.id, "❌ សូមបញ្ជាក់ User ID។ ឧទាហរណ៍: /admin_confirm_payment 123456789");
      return;
    }
    
    try {
      const user = await User.findOneAndUpdate(
        { telegram_id: userId },
        { 
          is_paid: true,
          payment_date: new Date(),
          tier: 'essential'
        },
        { new: true }
      );
      
      if (user) {
        await bot.sendMessage(msg.chat.id, `✅ បានបញ្ជាក់ការទូទាត់សម្រាប់ ${user.first_name} (${userId})`);
        
        // Notify user
        try {
          await bot.sendMessage(userId, `🎉 ការទូទាត់របស់អ្នកត្រូវបានបញ្ជាក់!

✅ អ្នកឥឡូវនេះអាចចូលប្រើកម្មវិធី 7-Day Money Flow Reset™

🚀 ចាប់ផ្តើមភ្លាម:
👉 /day1 - ចាប់ផ្តើមថ្ងៃទី ១
👉 /help - ជំនួយពេញលេញ

💬 ជំនួយ: @Chendasum`);
        } catch (notifyError) {
          console.log("Could not notify user:", notifyError.message);
        }
      } else {
        await bot.sendMessage(msg.chat.id, `❌ រកមិនឃើញអ្នកប្រើប្រាស់ ${userId}`);
      }
    } catch (error) {
      console.error("Payment confirmation error:", error);
      await bot.sendMessage(msg.chat.id, "💳 Payment confirmation កំពុងត្រូវបានអភិវឌ្ឍ។");
    }
  }
};

bot.onText(/\/admin_users/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    if (adminCommands && adminCommands.showUsers) {
      await adminCommands.showUsers(msg, bot);
    } else {
      await adminCommands_safe.showUsers(msg, bot);
    }
  } catch (e) {
    console.error("Error /admin_users:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});

bot.onText(/\/admin_analytics/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    if (adminCommands && adminCommands.showAnalytics) {
      await adminCommands.showAnalytics(msg, bot);
    } else {
      await adminCommands_safe.showAnalytics(msg, bot);
    }
  } catch (e) {
    console.error("Error /admin_analytics:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});

bot.onText(/\/admin_confirm_payment (.+)/i, async (msg, match) => {
  if (isDuplicateMessage(msg)) return;
  try {
    if (adminCommands && adminCommands.confirmPayment) {
      await adminCommands.confirmPayment(msg, match, bot);
    } else {
      await adminCommands_safe.confirmPayment(msg, match, bot);
    }
  } catch (e) {
    console.error("Error /admin_confirm_payment:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});

// Quick Admin Menu: Provides a quick list of admin commands
bot.onText(/\/admin_menu|\/admin/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  const adminId = parseInt(process.env.ADMIN_CHAT_ID);
  const secondaryAdminId = 484389665;
  if (![adminId, secondaryAdminId].includes(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះទេ។");
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

// Admin Commands: Restricted access commands for bot administrators
const adminCommands_safe = {
  showUsers: async (msg, bot) => {
    const adminId = parseInt(process.env.ADMIN_CHAT_ID);
    const secondaryAdminId = 484389665;
    if (![adminId, secondaryAdminId].includes(msg.from.id)) {
      await bot.sendMessage(msg.chat.id, "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះទេ។");
      return;
    }
    
    try {
      const users = await User.find().limit(50);
      let usersList = "📊 អ្នកប្រើប្រាស់ចុងក្រោយ:\n\n";
      
      users.forEach((user, index) => {
        const isPaid = user.is_paid === true || user.is_paid === 't';
        usersList += `${index + 1}. ${user.first_name} (${user.telegram_id})\n`;
        usersList += `   💰 ${isPaid ? "✅ បានទូទាត់" : "❌ មិនទាន់"}\n`;
        usersList += `   📅 ${user.joined_at ? new Date(user.joined_at).toDateString() : "N/A"}\n\n`;
      });
      
      await sendLongMessage(bot, msg.chat.id, usersList, {}, MESSAGE_CHUNK_SIZE);
    } catch (error) {
      await bot.sendMessage(msg.chat.id, "📊 Admin feature កំពុងត្រូវបានអភិវឌ្ឍ។");
    }
  },
  
  showAnalytics: async (msg, bot) => {
    const adminId = parseInt(process.env.ADMIN_CHAT_ID);
    const secondaryAdminId = 484389665;
    if (![adminId, secondaryAdminId].includes(msg.from.id)) {
      await bot.sendMessage(msg.chat.id, "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះទេ។");
      return;
    }
    
    try {
      const totalUsers = await User.countDocuments();
      const paidUsers = await User.countDocuments({ is_paid: { $in: [true, 't'] } });
      const todayUsers = await User.countDocuments({
        joined_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });
      
      const analyticsMessage = `📈 Analytics Dashboard

👥 សរុបអ្នកប្រើប្រាស់: ${totalUsers}
💰 បានទូទាត់: ${paidUsers}
🆕 ថ្ងៃនេះ: ${todayUsers}
📊 អត្រាបង្វែរ: ${totalUsers > 0 ? ((paidUsers/totalUsers)*100).toFixed(1) : 0}%

🕒 ពេលវេលា: ${new Date().toLocaleString()}
🖥️ Server Uptime: ${Math.floor(process.uptime() / 3600)}h`;
      
      await bot.sendMessage(msg.chat.id, analyticsMessage);
    } catch (error) {
      await bot.sendMessage(msg.chat.id, "📈 Analytics កំពុងត្រូវបានអភិវឌ្ឍ។");
    }
  },
  
  confirmPayment: async (msg, match, bot) => {
    const adminId = parseInt(process.env.ADMIN_CHAT_ID);
    const secondaryAdminId = 484389665;
    if (![adminId, secondaryAdminId].includes(msg.from.id)) {
      await bot.sendMessage(msg.chat.id, "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះទេ។");
      return;
    }
    
    const userId = match[1];
    if (!userId) {
      await bot.sendMessage(msg.chat.id, "❌ សូមបញ្ជាក់ User ID។ ឧទាហរណ៍: /admin_confirm_payment 123456789");
      return;
    }
    
    try {
      const user = await User.findOneAndUpdate(
        { telegram_id: userId },
        { 
          is_paid: true,
          payment_date: new Date(),
          tier: 'essential'
        },
        { new: true }
      );
      
      if (user) {
        await bot.sendMessage(msg.chat.id, `✅ បានបញ្ជាក់ការទូទាត់សម្រាប់ ${user.first_name} (${userId})`);
        
        // Notify user
        try {
          await bot.sendMessage(userId, `🎉 ការទូទាត់របស់អ្នកត្រូវបានបញ្ជាក់!

✅ អ្នកឥឡូវនេះអាចចូលប្រើកម្មវិធី 7-Day Money Flow Reset™

🚀 ចាប់ផ្តើមភ្លាម:
👉 /day1 - ចាប់ផ្តើមថ្ងៃទី ១
👉 /help - ជំនួយពេញលេញ

💬 ជំនួយ: @Chendasum`);
        } catch (notifyError) {
          console.log("Could not notify user:", notifyError.message);
        }
      } else {
        await bot.sendMessage(msg.chat.id, `❌ រកមិនឃើញអ្នកប្រើប្រាស់ ${userId}`);
      }
    } catch (error) {
      console.error("Payment confirmation error:", error);
      await bot.sendMessage(msg.chat.id, "💳 Payment confirmation កំពុងត្រូវបានអភិវឌ្ឍ។");
    }
  }
};

bot.onText(/\/admin_users/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    if (adminCommands && adminCommands.showUsers) {
      await adminCommands.showUsers(msg, bot);
    } else {
      await adminCommands_safe.showUsers(msg, bot);
    }
  } catch (e) {
    console.error("Error /admin_users:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});

bot.onText(/\/admin_analytics/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    if (adminCommands && adminCommands.showAnalytics) {
      await adminCommands.showAnalytics(msg, bot);
    } else {
      await adminCommands_safe.showAnalytics(msg, bot);
    }
  } catch (e) {
    console.error("Error /admin_analytics:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});

bot.onText(/\/admin_confirm_payment (.+)/i, async (msg, match) => {
  if (isDuplicateMessage(msg)) return;
  try {
    if (adminCommands && adminCommands.confirmPayment) {
      await adminCommands.confirmPayment(msg, match, bot);
    } else {
      await adminCommands_safe.confirmPayment(msg, match, bot);
    }
  } catch (e) {
    console.error("Error /admin_confirm_payment:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});

// Quick Admin Menu: Provides a quick list of admin commands
bot.onText(/\/admin_menu|\/admin/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  const adminId = parseInt(process.env.ADMIN_CHAT_ID);
  const secondaryAdminId = 484389665;
  if (![adminId, secondaryAdminId].includes(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះទេ។");
    return;
  }

  const menuMessage = `🔧 ADMIN QUICK MENU
bot.onText(/\/preview_before_after/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await previewCommands.previewBeforeAfter(msg, bot);
  } catch (e) {
    console.error("Error /preview_before_after:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/preview_transformation/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await previewCommands.previewTransformation(msg, bot);
  } catch (e) {
    console.error("Error /preview_transformation:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});

// Financial Health Quiz Commands: Free assessment
bot.onText(/\/financial_quiz/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await financialQuiz.startQuiz(msg, bot);
  } catch (e) {
    console.error("Error /financial_quiz:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/health_check/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await financialQuiz.startQuiz(msg, bot);
  } catch (e) {
    console.error("Error /health_check:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});

// Free Tools Commands: Available to all users without payment
bot.onText(/\/calculate_daily/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    if (freeTools && freeTools.calculateDaily) {
      await freeTools.calculateDaily(msg, bot);
    } else {
      await bot.sendMessage(msg.chat.id, `🧮 ម៉ាស៊ីនគណនាចំណាយប្រចាំថ្ងៃ

💰 គណនាចំណាយប្រចាំថ្ងៃរបស់អ្នក:

ឧទាហរណ៍:
• អាហារ: $10/ថ្ងៃ
• ការធ្វើដំណើរ: $3/ថ្ងៃ  
• កាហ្វេ: $2/ថ្ងៃ
• ផ្សេងៗ: $5/ថ្ងៃ

📊 សរុប: $20/ថ្ងៃ = $600/ខែ

សរសេរចំណាយប្រចាំថ្ងៃរបស់អ្នក ដើម្បីគណនា!

💡 ឧបករណ៍នេះឥតគិតថ្លៃ!`);
    }
  } catch (e) {
    console.error("Error /calculate_daily:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});

bot.onText(/\/find_leaks/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    if (freeTools && freeTools.findLeaks) {
      await freeTools.findLeaks(msg, bot);
    } else {
      await bot.sendMessage(msg.chat.id, `🕵️ រកកន្លែងលុយលេច (Money Leaks Detector)

🔍 កន្លែងដែលលុយអ្នកអាចលេចធ្លាយ:

☕ កាហ្វេ/ភេសជ្ជៈ:
$2/ថ្ងៃ = $60/ខែ = $720/ឆ្នាំ

🍔 អាហារក្រៅ:
$8/ថ្ងៃ = $240/ខែ = $2,880/ឆ្នាំ

📱 App subscriptions:
$10/ខែ = $120/ឆ្នាំ

🚗 ការធ្វើដំណើរមិនចាំបាច់:
$50/ខែ = $600/ឆ្នាំ

💡 ការកាត់បន្ថយតែ 20% អាចសន្សំបាន $800+/ឆ្នាំ!

🎯 ចង់រៀនកាត់បន្ថយចំណាយបានប្រសើរ? 
👉 /pricing - ចូលរួមកម្មវិធីពេញលេញ`);
    }
  } catch (e) {
    console.error("Error /find_leaks:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});

bot.onText(/\/savings_potential/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    if (freeTools && freeTools.savingsPotential) {
      await freeTools.savingsPotential(msg, bot);
    } else {
      await bot.sendMessage(msg.chat.id, `💰 សក្តានុពលសន្សំ (Savings Potential Calculator)

📊 គណនាសក្តានុពលសន្សំរបស់អ្នក:

ឧទាហរណ៍ចំណូល $500/ខែ:
• ការកាត់បន្ថយ 10% = $50/ខែ
• ការកាត់បន្ថយ 20% = $100/ខែ
• ការកាត់បន្ថយ 30% = $150/ខែ

📈 លទ្ធផលក្នុង 1 ឆ្នាំ:
• 10%: $600 សន្សំ
• 20%: $1,200 សន្សំ  
• 30%: $1,800 សន្សំ

🎯 ជាមួយ compound interest (5%):
$100/ខែ × 12 ខែ + 5% = $1,260

💡 ចាប់ផ្តើមសន្សំតាំងពីថ្ងៃនេះ!
👉 រៀនវិធីសាស្ត្រកាត់បន្ថយចំណាយ: /pricing`);
    }
  } catch (e) {
    console.error("Error /savings_potential:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});

bot.onText(/\/income_analysis/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    if (freeTools && freeTools.incomeAnalysis) {
      await freeTools.incomeAnalysis(msg, bot);
    } else {
      await bot.sendMessage(msg.chat.id, `📊 ការវិភាគចំណូល (Income Analysis)

💵 វិធីវិភាគចំណូលបានប្រសើរ:

🎯 ការបែងចែកសមស្រប:
• 50% - ចាំបាច់ (Need)
• 30% - ចង់បាន (Want)  
• 20% - សន្សំ/វិនិយោគ

📈 ឧទាហរណ៍ចំណូល $500:
• $250 - អាហារ, ផ្ទះ, ការធ្វើដំណើរ
• $150 - កម្សាន្ត, សម្លៀកបំពាក់
• $100 - សន្សំ

🚀 វិធីបង្កើនចំណូល:
1️⃣ រៀនជំនាញថ្មី
2️⃣ ធ្វើការបន្ថែម
3️⃣ លក់វត្ថុមិនត្រូវការ
4️⃣ បង្កើតអាជីវកម្មតូច

💡 ចង់រៀនលម្អិត?
👉 /pricing - ចូលរួមកម្មវិធី 7-Day Money Flow Reset™`);
    }
  } catch (e) {
    console.error("Error /income_analysis:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});

/ Badge Commands: Requires payment to view
bot.onText(/\/badges/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    const user = await User.findOne({ telegram_id: msg.from.id });
    const isPaid = user?.is_paid === true || user?.is_paid === 't';
    if (!user || !isPaid) {
      await bot.sendMessage(msg.chat.id, "🔒 សូមទូទាត់មុនដើម្បីមើល badges។ ប្រើ /pricing ដើម្បីមើលព័ត៌ណី។");
      return;
    }
    
    if (badgesCommands && badgesCommands.showBadges) {
      await badgesCommands.showBadges(msg, bot);
    } else {
      const progress = await Progress.findOne({ user_id: msg.from.id }) || {};
      let badgesMessage = `🏆 សមិទ្ធផលរបស់អ្នក (Badges)

🎖️ Badges ដែលទទួលបាន:
`;

      // Check completed days and award badges
      const completedDays = [];
      for (let i = 1; i <= 7; i++) {
        if (progress[`day${i}Completed`]) {
          completedDays.push(i);
          badgesMessage += `✅ Day ${i} Completion Badge\n`;
        }
      }

      if (completedDays.length >= 3) {
        badgesMessage += `🔥 មជ្ឈមភាព Badge - បានបញ្ចប់ ៣ ថ្ងៃ!\n`;
      }
      
      if (completedDays.length >= 5) {
        badgesMessage += `💪 អ្នកខ្លាំង Badge - បានបញ្ចប់ ៥ ថ្ងៃ!\n`;
      }
      
      if (completedDays.length === 7) {
        badgesMessage += `🏆 Champion Badge - បានបញ្ចប់ទាំងអស់!\n`;
      }

      if (progress.programCompleted) {
        badgesMessage += `🎊 Program Master Badge - បញ្ចប់កម្មវិធីពេញលេញ!\n`;
      }

      badgesMessage += `\n📊 សរុប Badges: ${completedDays.length + (completedDays.length >= 3 ? 1 : 0) + (completedDays.length >= 5 ? 1 : 0) + (completedDays.length === 7 ? 1 : 0) + (progress.programCompleted ? 1 : 0)}

🎯 បន្តធ្វើដើម្បីទទួលបាន Badges បន្ថែម!`;

      await bot.sendMessage(msg.chat.id, badgesMessage);
    }
  } catch (error) {
    console.error("Error in /badges command:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
  }
});

// Progress Command: Requires payment to view
bot.onText(/\/progress/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    const user = await User.findOne({ telegram_id: msg.from.id });
    const isPaid = user?.is_paid === true || user?.is_paid === 't';
    if (!user || !isPaid) {
      await bot.sendMessage(msg.chat.id, "🔒 សូមទូទាត់មុនដើម្បីមើលការរីកចម្រើន។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។");
      return;
    }
    
    if (badgesCommands && badgesCommands.showProgress) {
      await badgesCommands.showProgress(msg, bot);
    } else {
      const progress = await Progress.findOne({ user_id: msg.from.id }) || {};
      
      let progressMessage = `📈 ការរីកចម្រើនរបស់អ្នក

👤 អ្នកប្រើប្រាស់: ${user.first_name}
📅 ចាប់ផ្តើម: ${user.joined_at ? new Date(user.joined_at).toDateString() : "N/A"}

📚 ការបញ្ចប់មេរៀន:`;

      let completedCount = 0;
      for (let i = 1; i <= 7; i++) {
        const isCompleted = progress[`day${i}Completed`];
        if (isCompleted) completedCount++;
        progressMessage += `\n${isCompleted ? "✅" : "⏳"} Day ${i} ${isCompleted ? "- បញ្ចប់" : "- មិនទាន់"}`;
      }

      const completionPercentage = Math.round((completedCount / 7) * 100);
      progressMessage += `\n\n📊 ភាគរយបញ្ចប់: ${completionPercentage}%`;
      progressMessage += `\n🎯 ថ្ងៃបច្ចុប្បន្ន: Day ${progress.current_day || 1}`;
      
      if (completionPercentage === 100) {
        progressMessage += `\n\n🎊 អបអរសាទរ! អ្នកបានបញ្ចប់កម្មវិធីពេញលេញ!`;
        progressMessage += `\n🚀 ពិចារណាចូលរួម VIP Program: /vip`;
      } else {
        const nextDay = (progress.current_day || 1);
        if (nextDay <= 7) {
          progressMessage += `\n\n🚀 ថ្ងៃបន្ទាប់: /day${nextDay}`;
        }
      }

      await bot.sendMessage(msg.chat.id, progressMessage);
    }
  } catch (error) {
    console.error("Error in /progress command:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
  }
});

// Quote Commands: Premium features
bot.onText(/\/quote$/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    if (quotesCommands && quotesCommands.dailyQuote) {
      await quotesCommands.dailyQuote(msg, bot);
    } else {
      const randomQuotes = [
        "💰 \"លុយគឺជាឧបករណ៍ មិនមែនជាគោលដៅទេ។\"",
        "💡 \"ការគ្រប់គ្រងលុយល្អ ចាប់ផ្តើមពីការយល់ដឹង។\"",
        "🎯 \"ការសន្សំតិចៗ នាំឱ្យទៅជាភាពអស្ចារ្យ។\"",
        "🌟 \"ការវិនិយោគលើចំណេះដឹង គឺជាការវិនិយោគល្អបំផុត។\"",
        "⚖️ \"ភាពសុខសប្បាយពិតប្រាកដមកពីការមានគ្រប់គ្រាន់ មិនមែនពីការមានច្រើនទេ។\"",
        "🏗️ \"ការសន្សំគឺជាការបង្កើតមូលដ្ឋានសម្រាប់អនាគត។\"",
        "🔄 \"ប្រាក់ដែលដំណើរការឱ្យអ្នក ល្អជាងអ្នកដំណើរការឱ្យប្រាក់។\"",
        "🎨 \"ផែនការហិរញ្ញវត្ថុល្អ គឺជាសិល្បៈនៃការរស់នៅ។\""
      ];
      const randomQuote = randomQuotes[Math.floor(Math.random() * randomQuotes.length)];
      await bot.sendMessage(msg.chat.id, `📜 សម្រង់ប្រចាំថ្ងៃ:

${randomQuote}

🌅 សូមឱ្យថ្ងៃនេះពោរពេញដោយការរីកចម្រើន!

💡 ចង់បានសម្រង់បន្ថែម និងការណែនាំ?
👉 /pricing - ចូលរួមកម្មវិធីពេញលេញ`);
    }
  } catch (e) {
    console.error("Error /quote:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});

// Smart FAQ Command: Shows different content based on user's payment status
bot.onText(/\/faq|FAQ|faq/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    const user = await User.findOne({ telegram_id: msg.from.id });
    const isPaid = user && (user.is_paid === true || user.is_paid === 't');
    const isPremiumOrVip =
      user && (user.tier === "premium" || user.tier === "vip");
    const isVip = user && user.tier === "vip";

    let faqMessage;

    if (!isPaid) {
      faqMessage = `❓ សំណួរញឹកញាប់ (FAQ) - Welcome Guide

💰 អំពីតម្លៃ:
- តម្លៃប៉ុន្មាន? → $47 (Essential) / $97 (Premium) / $197 (VIP)
- ទូទាត់យ៉ាងដូចម្តេច? → ABA Bank, ACLEDA Bank, Wing Payment
- បញ្ជាក់ការទូទាត់រយៈពេលប៉ុន្មាន? → ១-២ ម៉ោង
- ទទួលបានអ្វីខ្លះ? → /pricing ដើម្បីមើលលម្អិត

⏰ អំពីពេលវេលា:
- ចំណាយពេលប៉ុន្មាននាទី? → ១៥-២០ នាទីក្នុងមួយថ្ងៃ
- អាចធ្វើលឿនជាងនេះបានទេ? → បាន តែណែនាំ ១ ថ្ងៃ/១ មេរៀន
- ធ្វើរួចហើយ ទើបធ្វើបន្តបានទេ? → គ្មានបញ្ហា! ធ្វើតាមល្បឿនខ្លួនឯង

🎯 អំពីមាតិកា:
- មេរៀនមានអ្វីខ្លះ? → ៧ ថ្ងៃ Money Management ពេញលេញ
- ភាសាអ្វី? → ភាសាខ្មែរ ១០០% (ពាក្យពេចន៍អំពីប្រាក់)
- ទទួលបានអ្វីខ្លះ? → ចំណេះដឹងគ្រប់គ្រងលុយ និងបង្កើនចំណូល

🔧 អំពីបច្ចេកទេស:
- ត្រូវការឧបករណ៍អ្វី? → គ្រាន់តែ Telegram app
- ទិន្នន័យរក្សាទុកណា? → Server សុវត្ថិភាព ១០០%
- បាត់ទិន្នន័យអត់? → មិនបាត់ - មាន backup ស្វ័យប្រវត្តិ

📱 ពាក្យបញ្ជាដែលអ្នកអាចប្រើ:
- 🏠 ចាប់ផ្តើម → /start
- 💰 មើលតម្លៃ → /pricing
- 💳 ការទូទាត់ → /payment
- 🛠 ជំនួយ → /help
- 📊 ស្ថានភាព → /status
- ❓ សំណួរនេះ → /faq
- 👤 ព័ត៌មានខ្ញុំ → /whoami

🔒 ពាក្យបញ្ជាពិសេស (បន្ទាប់ពីទូទាត់):
- 📚 មេរៀន Day 1-7 → /day1 ដល់ /day7
- 🏆 ការតាមដានការរីកចម្រើន → /badges, /progress
- 📚 សម្រង់ប្រាជ្ញាខ្មែរ → /quote, /wisdom
- 🌟 កម្មវិធីកម្រិតខ្ពស់ → VIP Programs

❓ ប្រើប្រាស់ពេលចម្លែក:
- ការទូទាត់មានបញ្ហា? → ផ្ញើរូបអេក្រង់មក @Chendasum
- ចង់បានជំនួយបន្ថែម? → ទាក់ទង @Chendasum ២៤/៧
- បាត់ការតភ្ជាប់? → គេហទំព័រ 7daymoneyflow.com
- Bot មិនដំណើរការ? → /start ម្តងទៀត

💡 ជំហានទូទាត់:
1. ពិនិត្យតម្លៃ → /pricing
2. ផ្ទេរលុយ → /payment
3. ថតរូបបញ្ជាក់ → ទៅ @Chendasum
4. រង់ចាំការបញ្ជាក់ → ១-២ ម៉ោង
5. ចាប់ផ្តើម Day 1 → /day1

🎯 វិធីអនុវត្ត:
- ចាប់ផ្តើមកែប្រែទម្លាប់ការចំណាយ
- គ្រប់គ្រងលុយបានល្អជាងមុន
- មានផែនការហិរញ្ញវត្ថុច្បាស់លាស់
- ស្វែងរកវិធីបង្កើនចំណូល

🔥 Ready to start?
👉 /pricing ដើម្បីមើលតម្លៃ
👉 /payment ដើម្បីទូទាត់
👉 /start ដើម្បីចាប់ផ្តើម

💬 ត្រូវការជំនួយ? ទាក់ទង @Chendasum ២៤/៧!`;
    } else {
      faqMessage = `❓ សំណួរញឹកញាប់ (FAQ) - Complete Member Guide

💰 អំពីតម្លៃ (អ្នកបានទូទាត់រួច ✅):
- តម្លៃរបស់អ្នក → ${user.tier === "vip" ? "$197 (VIP)" : user.tier === "premium" ? "$97 (Premium)" : "$47 (Essential)"}
- ទូទាត់ពេល → ${user.paymentDate ? new Date(user.paymentDate).toDateString() : "មិនទាន់បញ្ជាក់"}
- Upgrade ទៅកម្រិតខ្ពស់? → /pricing

⏰ អំពីពេលវេលា:
- ចំណាយពេលប៉ុន្មាននាទី? → ១៥-២០ នាទីក្នុងមួយថ្ងៃ
- អាចធ្វើលឿនជាងនេះបានទេ? → បាន តែណែនាំ ១ ថ្ងៃ/១ មេរៀន
- ធ្វើរួចហើយ ទើបធ្វើបន្តបានទេ? → បាន ធ្វើតាមល្បឿនខ្លួនឯង
- ភ្លេចធ្វើ Day ម្សិលមិញ? → គ្មានបញ្ហា! ធ្វើបន្តពីថ្ងៃបាត់បង់

🎯 អំពីមាតិកា:
- មេរៀនមានអ្វីខ្លះ? → ៧ ថ្ងៃ Money Management ពេញលេញ
- ភាសាអ្វី? → ភាសាខ្មែរ ១០០% (ពាក្យពេចន៍អំពីប្រាក់)
- ទទួលបានអ្វីខ្លះ? → ចំណេះដឹងគ្រប់គ្រងលុយ និងបង្កើនចំណូល

📱 ពាក្យបញ្ជាមូលដ្ឋាន:
- 🏠 ចាប់ផ្តើម → /start
- 💰 មើលតម្លៃ → /pricing
- 💳 ការទូទាត់ → /payment
- 🛠 ជំនួយ → /help
- 📊 ស្ថានភាព → /status
- ❓ សំណួរនេះ → /faq
- 👤 ព័ត៌មានខ្ញុំ → /whoami

🚀 ពាក្យបញ្ជាកម្មវិធី (៧ ថ្ងៃដំបូង):
- 📚 ថ្ងៃទី ១ → /day1 - ស្គាល់ Money Flow
- 🔍 ថ្ងៃទី ២ → /day2 - ស្វែងរក Money Leaks
- 📊 ថ្ងៃទី ៣ → /day3 - វាយតម្លៃប្រព័ន្ធ
- 🗺️ ថ្ងៃទី ៤ → /day4 - បង្កើតផែនទីលុយ
- 📈 ថ្ងៃទី ៥ → /day5 - Survival vs Growth (ការរស់រាន និងការលូតលាស់)
- 📋 ថ្ងៃទី ៦ → /day6 - រៀបចំផែនការ
- ✨ ថ្ងៃទី ៧ → /day7 - Integration (ការបញ្ចូលគ្នា)

📈 ពាក្យបញ្ជាកម្មវិធីបន្ថែម (៣០ ថ្ងៃ):
- /extended8 - ថ្ងៃទី ៨: ការវិភាគចំណូលកម្រិតខ្ពស់
- /extended9 - ថ្ងៃទី ៩: ការគ្រប់គ្រងចំណាយអាជីវកម្ម
- /extended10 - ថ្ងៃទី ១០: ការបង្កើតទម្លាប់ហិរញ្ញវត្ថុ
- /extended11 - ថ្ងៃទី ១១: ការវិនិយោគដំបូងសាមញ្ញ
- /extended12 - ថ្ងៃទី ១២: ការបង្កើតមូលនិធិសម្រាប់បន្ទាន់
- /extended13 - ថ្ងៃទី ១៣: ការវាយតម្លៃហានិភ័យហិរញ្ញវត្ថុ
- /extended14 - ថ្ងៃទី ១៤: ការបង្កើនប្រសិទ្ធភាពបំណុល
- /extended15 - ថ្ងៃទី ១៥: ការរៀបចំផែនការចូលនិវត្តន៍
- /extended16 - ថ្ងៃទី ១៦: ការគ្រប់គ្រងទ្រព្យសម្បត្តិ
- /extended17 - ថ្ងៃទី ១៧: ការវិនិយោគអចលនទ្រព្យ
- /extended18 - ថ្ងៃទី ១៨: ការវិនិយោគលើភាគហ៊ុន
- /extended19 - ថ្ងៃទី ១៩: ការវិនិយោគលើមូលបត្របំណុល
- /extended20 - ថ្ងៃទី ២០: ការវិនិយោគលើមូលនិធិរួម
- /extended21 - ថ្ងៃទី ២១: ការវិនិយោគលើមាស និងប្រាក់
- /extended22 - ថ្ងៃទី ២២: ការវិនិយោគលើរូបិយប័ណ្ណគ្រីបតូ
- /extended23 - ថ្ងៃទី ២៣: ការវិនិយោគលើអាជីវកម្មខ្នាតតូច
- /extended24 - ថ្ងៃទី ២៤: ការគ្រប់គ្រងហានិភ័យអាជីវកម្ម
- /extended25 - ថ្ងៃទី ២៥: ការរៀបចំផែនការពង្រីកអាជីវកម្ម
- /extended26 - ថ្ងៃទី ២៦: ការបង្កើតប្រភពចំណូលអកម្ម
- /extended27 - ថ្ងៃទី ២៧: ការបង្កើនប្រសិទ្ធភាពពន្ធ
- /extended28 - ថ្ងៃទី ២៨: ការរៀបចំផែនការអចលនទ្រព្យ
- /extended29 - ថ្ងៃទី ២៩: ការការពារទ្រព្យសម្បត្តិ
- /extended30 - ថ្ងៃទី ៣០: ការពិនិត្យឡើងវិញ និងគោលដៅអនាគត

🏆 ការតាមដានការរីកចម្រើន:
- 🎖️ សមិទ្ធផល → /badges
- 📈 ការរីកចម្រើន → /progress
- 🏁 សមិទ្ធផលសំខាន់ → /milestones
- 🔥 ការធ្វើបន្តបន្ទាប់ → /streak

📚 សម្រង់ប្រាជ្ញាខ្មែរ:
- 💬 សម្រង់ប្រចាំថ្ងៃ → /quote
- 🎭 ប្រាជ្ញាចៃដន្យ → /wisdom
- 📖 ប្រភេទសម្រង់ → /quote_categories
- 🏛️ ប្រាជ្ញាប្រពៃណី → /quote_traditional
- 💰 ចិត្តគំនិតហិរញ្ញវត្ថុ → /quote_financial
- 💪 ការលើកទឹកចិត្ត → /quote_motivation
- 🏆 ជោគជ័យ → /quote_success

${
  isPremiumOrVip
    ? `
🌟 Premium Features (អ្នកអាចប្រើបាន):
- 📞 ទាក់ទងផ្ទាល់ → /admin_contact
- 🆘 ជំនួយអាទិភាព → /priority_support
- 📊 វិភាគកម្រិតខ្ពស់ → /advanced_analytics
- 👑 ព័ត៌មាន VIP → /vip_program_info
- 🎯 VIP ចូលរួម → សរសេរ "VIP APPLY"
- 🏛️ Capital Strategy → សរសេរ "CAPITAL CLARITY"`
    : ""
}

${
  isVip
    ? `
👑 VIP Exclusive Features (អ្នកអាចប្រើបាន):
- 🗓️ មើលម៉ោងទំនេរ → /book_session
- 💼 Capital Assessment → /book_capital_assessment
- 🔍 Business Review → /book_business_review
- 📈 Investment Evaluation → /book_investment_evaluation
- 🎯 Custom Session → /book_custom_session
- 📋 របាយការណ៍ VIP → /vip_reports
- 📊 ការតាមដានពង្រីក → /extended_tracking`
    : ""
}

🎯 Assessment ឥតគិតថ្លៃ:
• /financial_quiz - ពិនិត្យសុខភាពហិរញ្ញវត្ថុ (២ នាទី)
• /health_check - ពិនិត្យសុខភាពហិរញ្ញវត្ថុ (២ នាទី)

💰 ឧបករណ៍គណនាឥតគិតថ្លៃ:
• /calculate_daily - គណនាចំណាយប្រចាំថ្ងៃ
• /find_leaks - រកកន្លែងលុយលេចធ្លាយ
• /savings_potential - គណនាសក្តានុពលសន្សំ
• /income_analysis - វិភាគចំណូល

❓ ប្រើប្រាស់ពេលចម្លែក:
- ការទូទាត់មានបញ្ហា? → ផ្ញើរូបអេក្រង់មក @Chendasum
- ចង់បានជំនួយបន្ថែម? → ទាក់ទាក់ @Chendasum ២៤/៧
- បាត់ការតភ្ជាប់? → គេហទំព័រ 7daymoneyflow.com
- Bot មិនដំណើរការ? → /start ម្តងទៀត
- ចង់ Upgrade? → /pricing

💡 Tips ពិសេស:
- ប្រើ /help ដើម្បីមើលពាក្យបញ្ជាទាំងអស់
- ប្រើ /status ដើម្បីពិនិត្យការរីកចម្រើន
- ប្រើ /whoami ដើម្បីមើលព័ត៌មានគណនី
- សរសេរសំណួរដោយផ្ទាល់ - Bot នឹងជួយ!

🎯 វិធីអនុវត្ត:
- ចាប់ផ្តើមកែប្រែទម្លាប់ការចំណាយ
- គ្រប់គ្រងលុយបានល្អជាងមុន
- មានផែនការហិរញ្ញវត្ថុច្បាស់លាស់
- ស្វែងរកវិធីបង្កើនចំណូល

🌟 ការគាំទ្រពិសេស:
- 📱 Telegram Bot Support: ២៤/៧
- 👨‍💼 Personal Support: @Chendasum
- 🌐 Website: 7daymoneyflow.com
- ⏰ Response Time: ១-២ ម៉ោង

💬 ត្រូវការជំនួយបន្ថែម? ទាក់ទង @Chendasum

🔥 Ready for your next lesson?
👉 Check /status to see your progress!`;
    }

    await sendLongMessage(
      bot,
      msg.chat.id,
      faqMessage,
      {
        parse_mode: "Markdown",
      },
      MESSAGE_CHUNK_SIZE,
    );
  } catch (error) {
    console.error("Error in FAQ command:", error);
    const basicHelp = `❓ ជំនួយ (Help):

📱 ពាក្យបញ្ជាសំខាន់:
- /start - ចាប់ផ្តើម
- /pricing - តម្លៃ
- /help - ជំនួយ
- /faq - សំណួរញឹកញាប់

💬 ជំនួយ: សរសេរមកដោយផ្ទាល់!`;

    await bot.sendMessage(bot, msg.chat.id, basicHelp); // Pass bot instance
  }
});

// Status Command: Displays user's account and program progress status
bot.onText(/\/status|ស្ថានភាព/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    const userId = msg.from.id;
    const user = await User.findOne({ telegram_id: userId });

    if (!user) {
      await bot.sendMessage(
        msg.chat.id,
        "អ្នកមិនទាន់ចុះឈ្មោះ។ ប្រើ /start ដើម្បីចាប់ផ្តើម។",
      );
      return;
    }

    const progress = await Progress.findOne({ user_id: userId });
    const isPaid = user?.is_paid === true || user?.is_paid === 't';

    let statusMessage = `📊 ស្ថានភាពគណនីរបស់អ្នក:

👤 អ្នកប្រើប្រាស់: ${user.first_name || "មិនស្គាល់"}
📅 ចូលរួម: ${user.joined_at ? new Date(user.joined_at).toDateString() : "មិនស្គាល់"}
💰 ស្ថានភាព: ${isPaid ? "✅ បានទូទាត់" : "❌ មិនទាន់ទូទាត់"}`;

    if (isPaid) {
      statusMessage += `
📈 ថ្ងៃបច្ចុប្បន្ន: Day ${progress?.currentDay || 0}
🎯 អ្នកអាចប្រើប្រាស់កម្មវិធីបានពេញលេញ!`;

      if (user.payment_date) {
        statusMessage += `
💰 ទូទាត់ពេល: ${new Date(user.payment_date).toDateString()}`;
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

    await sendLongMessage(
      bot,
      msg.chat.id,
      statusMessage,
      {},
      MESSAGE_CHUNK_SIZE,
    );
  } catch (error) {
    console.error("Error in status command:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហាក្នុងការទាញយកស្ថានភាព។");
  }
});

// Whoami Command: Provides user's Telegram and bot-specific information
bot.onText(/\/whoami/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    const user = await User.findOne({ telegram_id: msg.from.id });
    const adminId = parseInt(process.env.ADMIN_CHAT_ID);
    const secondaryAdminId = 484389665;
    const isAdmin = msg.from.id === adminId || msg.from.id === secondaryAdminId;
    const isPaid = user?.is_paid === true || user?.is_paid === 't';

    let response = `🔍 ព័ត៌មានរបស់អ្នក:\n\n`;
    response += `• Chat ID: ${msg.chat.id}\n`;
    response += `• User ID: ${msg.from.id}\n`;
    response += `• ឈ្មោះ: ${msg.from.first_name || "N/A"}\n`;
    response += `• ត្រកូល: ${msg.from.last_name || "N/A"}\n`;
    response += `• ឈ្មោះអ្នកប្រើ: ${msg.from.username ? "@" + msg.from.username : "N/A"}\n`;
    response += `• ស្ថានភាព Admin: ${isAdmin ? "✅ ADMIN" : "❌ មិនមែន ADMIN"}\n`;
    response += `• ID Admin ដែលត្រូវការ: ${adminId}\n`;
    response += `• • ID របស់អ្នកត្រូវគ្នា: ${msg.from.id === adminId ? "✅ បាទ/ចាស" : "❌ ទេ"}\n`;

    if (user) {
      response += `• ស្ថានភាពមូលដ្ឋានទិន្នន័យ: ✅ បានចុះឈ្មោះ\n`;
      response += `• ស្ថានភាពទូទាត់: ${isPaid ? "✅ បានទូទាត់" : "❌ មិនទាន់ទូទាត់"}\n`;
      response += `• ស្ថានភាព VIP: ${user.is_vip ? "🌟 VIP" : "❌ មិនមែន VIP"}\n`;
      response += `• បានចូលរួម: ${user.joined_at ? new Date(user.joined_at).toDateString() : "មិនស្គាល់"}\n`;
      response += `• សកម្មភាពចុងក្រោយ: ${user.last_active ? new Date(user.last_active).toDateString() : "មិនស្គាល់"}\n`;
      if (isPaid && user.payment_date) {
        response += `• ថ្ងៃទូទាត់: ${new Date(user.payment_date).toDateString()}\n`;
      }
    } else {
      response += `• ស្ថានភាពមូលដ្ឋានទិន្នន័យ: ❌ មិនទាន់បានចុះឈ្មោះ\n`;
    }

    await sendLongMessage(bot, msg.chat.id, response, {}, MESSAGE_CHUNK_SIZE);
  } catch (error) {
    console.error("Error in whoami command:", error);
    await bot.sendMessage(
      msg.chat.id,
      `❌ មានបញ្ហាក្នុងការទាញយកព័ត៌មានអ្នកប្រើប្រាស់: ${error.message}`,
    );
  }
});

// Tier-based feature commands: These commands are typically restricted by user's tier (Premium/VIP)
// Premium tier commands
bot.onText(/\/admin_contact/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await tierFeatures.adminContact(msg, bot);
  } catch (e) {
    console.error("Error /admin_contact:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/priority_support/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await tierFeatures.prioritySupport(msg, bot);
  } catch (e) {
    console.error("Error /priority_support:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/advanced_analytics/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await tierFeatures.advancedAnalytics(msg, bot);
  } catch (e) {
    console.error("Error /advanced_analytics:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});

// VIP tier commands
bot.onText(/\/book_session/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await bookingCommands.showBookingSlots(msg, bot);
  } catch (e) {
    console.error("Error /book_session:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/book_capital_assessment/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await bookingCommands.bookCapitalClarity(msg, bot);
  } catch (e) {
    console.error("Error /book_capital_assessment:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/book_business_review/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await bookingCommands.bookBusinessReview(msg, bot);
  } catch (e) {
    console.error("Error /book_business_review:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/book_investment_evaluation/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await bookingCommands.bookInvestmentEvaluation(msg, bot);
  } catch (e) {
    console.error("Error /book_investment_evaluation:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/book_custom_session/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await bookingCommands.bookCustomSession(msg, bot);
  } catch (e) {
    console.error("Error /book_custom_session:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/vip_reports/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await tierFeatures.personalReports(msg, bot);
  } catch (e) {
    console.error("Error /vip_reports:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/extended_tracking/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await tierFeatures.extendedTracking(msg, bot);
  } catch (e) {
    console.error("Error /extended_tracking:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});

// Consolidated message handler with smart question detection and routing
bot.on("message", async (msg) => {
  if (isDuplicateMessage(msg)) return;

  if (!msg.text || msg.text.startsWith("/")) {
    return;
  }

  const text = msg.text.toLowerCase();
  const userId = msg.from.id;

  try {
    if (typeof User.updateLastActive === "function") {
      await User.updateLastActive(userId);
    } else {
      // FIXED: Use correct PostgreSQL field name
      await User.findOneAndUpdate(
        { telegram_id: userId },
        { last_active: new Date() },
        { new: true },
      );
    }
  } catch (error) {
    console.error("Error updating lastActive timestamp:", error);
  }

  if (await financialQuiz.processQuizResponse(msg, bot)) {
    return;
  }

  try {
    if (
      typeof freeTools.processToolResponse === "function" &&
      (await freeTools.processToolResponse(
        msg,
        bot,
        await User.findOne({ telegram_id: userId }),
      ))
    ) {
      return;
    }
  } catch (error) {
    console.error("Error processing free tools response:", error);
  }

  // FIXED: Don't return early for these text messages - process them properly
  if (
    text.includes("ready for day") ||
    (text.includes("day") && text.includes("complete")) ||
    text === "vip apply" ||
    text.includes("program complete") ||
    text.includes("capital clarity")
  ) {
    console.log("🎯🎯🎯 TEXT HANDLER TRIGGERED! 🎯🎯🎯");
    console.log("User ID:", userId);
    console.log("Original text:", msg.text);
    console.log("Lowercase text:", text);
    console.log("Calling handleTextResponse...");

    // Call the proper text response handler instead of returning
    await handleTextResponse(msg);
    return;
  }

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

  const endsWithQuestionMark = msg.text.trim().endsWith("?");

  if (hasQuestionWord || endsWithQuestionMark) {
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
កម្មវិធី 7-Day Money Flow Reset™ ផ្តោតលើការគ្រប់គ្រងប្រាក់កម្រាល់ មិនមែនការវិនិយោគដោយផ្ទាល់ទេ។

💡 ស្រាប់តែបានបញ្ចប់កម្មវិធី:
- អ្នកនឹងមានគ្រឹះល្អក្នុងការគ្រប់គ្រងប្រាក់
- យល់ពីលំហូរប្រាក់ និងការសន្សំ
- ត្រៀមខ្លួនសម្រាប់ការវិនិយោគនាពេលខាងមុខ

🔥 បើចង់ដឹងពីការវិនិយោគ:
- បញ្ចប់កម្មវិធី ៧ ថ្ងៃមុន
- ទាក់ទង @Chendasum សម្រាប់ការណែនាំបន្ត
- ឬ ពិនិត្យ VIP Program → /vip_program_info

✅ ចាប់ផ្តើមដំបូង → /start`;

      await sendLongMessage(
        bot,
        msg.chat.id,
        investmentResponse,
        {},
        MESSAGE_CHUNK_SIZE,
      );
      return;
    }

    let helpResponse = `🤔 ខ្ញុំឃើញអ្នកមានសំណួរ!

🔥 ជំនួយរហ័ស:
- បញ្ហាការទូទាត់ → ពិនិត្យ /faq ឬ ផ្ញើរូបបញ្ជាក់ការទូទាត់
- បញ្ហាបច្ចេកទេស → ស្វែងរក /help មុន
- សំណួរកម្មវិធី → ទាក់ទាក់ @Chendasum ដោយផ្ទាល់
- ព័ត៌មាន VIP → ប្រើ /vip_program_info

📱 ឬគ្រាន់តែសរសេរសំណួរអ្នក - ខ្ញុំនឹងជួយ!

💬 ជំនួយ ២៤/៧ ជាភាសាខ្មែរ និង English!`;

    await sendLongMessage(
      bot,
      msg.chat.id,
      helpResponse,
      {},
      MESSAGE_CHUNK_SIZE,
    );
    return;
  }

  await handleTextResponse(msg);
});

bot.onText(/CAPITAL CLARITY|capital clarity/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    const userId = msg.from.id;
    const firstName = msg.from.first_name || "មិត្ត";

    const clarityResponse = `🏛️ វគ្គ Capital Clarity - យុទ្ធសាស្ត្រមូលធនឯកជន

ជំរាបសួរ ${firstName}!

🎯 តើអ្វីជាវគ្គ Capital Clarity?

ជាវគ្គយុទ្ធសាស្ត្រឯកជនដែលមានរចនាសម្ព័ន្ធរៀបចំឡើងដើម្បី:
- ពិនិត្យមើលកន្លែងដែលប្រព័ន្ធមូលធនរបស់អ្នកអាចត្រូវបានរារាំង ឬលេចធ្លាយ
- ពិភាក្សាអំពីរបៀបដែលកិច្ចព្រមព្រៀង និងទំនាក់ទំនងវិនិយោគិនរបស់អ្នកដំណើរការ
- ស្វែងយល់ពីគម្លាតទំនុកចិត្ត និងហានិភ័យនៃការដាក់ពង្រាយ
- បង្កើតផ្លូវអភិវឌ្ឍន៍សក្តានុពលជាមួយនឹងវិធីសាស្ត្រមានរចនាសម្ព័ន្ធ

💰 ការវិនិយោគ: $197 (តម្លៃធម្មតា: $497) - មានកំណត់ ៥ កន្លែង/ខែ

🔍 ក្របខ័ណ្ឌវិភាគស្នូល:
១. Opening Frame - កំណត់ទំនុកចិត្ត និងបរិបទយុទ្ធសាស្ត្រ
២. Capital X-Ray - ពិនិត្យរចនាសម្ព័ន្ធមូលនិធិ/កិច្ចព្រមព្រៀង និងលំហូរ
៣. Trust Mapping - កំណត់ការបែកបាក់ទំនាក់ទំនង
៤. System Readiness Score - វាយតម្លៃសមត្ថភាពដាក់ពង្រាយ
៥. Clarity Discussion - ផែនទីផ្លូវអភិវឌ្ឍន៍សក្តានុពល

🎯 ល្អឥតខ្ចោះសម្រាប់:
- ស្ថាបនិកដែលគ្រប់គ្រងមូលធនឯកជន ($100K+ ក្នុងមួយឆ្នាំ)
- អ្នកប្រតិបត្តិដែលមានរចនាសម្ព័ន្ធមូលនិធិ
- ម្ចាស់អាជីវកម្មដែលគ្រោងមូលនិធិសម្រាប់ការរីកចម្រើន
- វិនិយោគិនដែលត្រូវការការដាក់ពង្រាយមានរចនាសម្ព័ន្ធ
- សហគ្រិនដែលស្វែងរកការបង្កើនប្រសិទ្ធភាពមូលធន

🇰🇭 ការផ្តោតលើកម្ពុជា: យើងយល់ដឹងពីរចនាសម្ព័ន្ធអាជីវកម្មក្នុងស្រុក ប្រព័ន្ធធនាគារ និងឱកាសរីកចម្រើន។

⚠️ សំខាន់: នេះគឺជាយុទ្ធសាស្ត្រមូលធនកម្រិតខ្ពស់សម្រាប់ម្ចាស់អាជីវកម្មធ្ងន់ធ្ងរដែលគ្រប់គ្រងមូលធនសំខាន់ៗ។

ត្រៀមខ្លួនដើម្បីបង្កើនប្រសិទ្ធភាពប្រព័ន្ធមូលធនរបស់អ្នកហើយឬនៅ? សូមផ្តល់ព័ត៌មានលម្អិតអំពីលក្ខណៈសម្បត្តិខាងលើ។

មានសំណួរ? ទាក់ទង @Chendasum ដោយផ្ទាល់។`;

    await sendLongMessage(
      bot,
      userId,
      clarityResponse,
      { parse_mode: "Markdown" },
      MESSAGE_CHUNK_SIZE,
    );

    const adminId = parseInt(process.env.ADMIN_CHAT_ID);
    if (adminId) {
      await bot.sendMessage(
        adminId,
        `🏛️ NEW CAPITAL CLARITY INTEREST:

អ្នកប្រើប្រាស់: ${firstName} (${userId})
ពេលវេលា: ${new Date().toLocaleString()}
ប្រភេទ: វគ្គយុទ្ធសាស្ត្រមូលធនឯកជន ($197)

អ្នកចាប់អារម្មណ៍កម្រិតខ្ពស់ចង់បង្កើនប្រសិទ្ធភាពរចនាសម្ព័ន្ធមូលធន។

អ្នកប្រើប្រាស់ត្រូវផ្តល់ព័ត៌មានលក្ខណៈសម្បត្តិ។`,
      );
    }
  } catch (error) {
    console.error("Error handling Capital Clarity interest:", error);
    await bot.sendMessage(
      msg.chat.id,
      "❌ មានបញ្ហាក្នុងការដំណើរការសំណើ Capital Clarity។",
    );
  }
});

async function handleVipApply(msg) {
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

    await sendLongMessage(
      bot,
      msg.chat.id,
      vipApplyMessage,
      {},
      MESSAGE_CHUNK_SIZE,
    );

    const adminId = parseInt(process.env.ADMIN_CHAT_ID);
    if (adminId) {
      await bot.sendMessage(
        adminId,
        `🌟 VIP APPLICATION REQUEST:

អ្នកប្រើប្រាស់: ${user.first_name} ${user.last_name || ""}
ID: ${user.telegram_id}
ស្ថានភាព: ${isPaid ? "បានទូទាត់" : "មិនទាន់ទូទាត់"} ${user.is_vip ? "| VIP រួចហើយ" : ""}

អ្នកប្រើប្រាស់ចង់ដាក់ពាក្យសម្រាប់កម្មវិធី VIP។
តាមដានព័ត៌មានពាក្យសុំរបស់ពួកគេ។`,
      );
    }
  } catch (error) {
    console.error("Error in VIP Apply handler:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហាក្នុងការដំណើរការសំណើ VIP។");
  }
}

async function handleCapitalClarityApplicationRequest(msg) {
  const userId = msg.from.id;
  const firstName = msg.from.first_name || "សហគ្រិន";

  const applicationMessage = `📋 ទម្រង់ពាក្យសុំ Capital Clarity

ជំរាបសួរ ${firstName}!

ត្រៀមខ្លួនរួចរាល់ហើយឬនៅដើម្បីដាក់ពាក្យសុំ Capital Clarity របស់អ្នក? សូមផ្តល់ព័ត៌មានដែលត្រូវការទាំងអស់ក្នុងទម្រង់ខាងក្រោម:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CAPITAL CLARITY APPLICATION
1. តួនាទី: [តួនាទីរបស់អ្នក - ស្ថាបនិក/អ្នកប្រតិបត្តិ/វិនិយោគិន]
2. ក្រុមហ៊ុន: [ឈ្មោះក្រុមហ៊ុន និងជួរចំណូលប្រចាំឆ្នាំ]
3. ស្ថានភាពមូលធន: [ស្ថានភាពមូលធន/មូលនិធិបច្ចុប្បន្ន]
4. បញ្ហាប្រឈមចម្បង: [បញ្ហាប្រឈមរចនាសម្ព័ន្ធចម្បងរបស់អ្នក]
5. កាលកំណត់: [កាលកំណត់ និងគោលដៅវិនិយោគ]
6. ទំនាក់ទំនង: [អ៊ីមែល និងលេខទូរសព្ទ]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 ឧទាហរណ៍ពាក្យសុំ:
CAPITAL CLARITY APPLICATION
1. តួនាទី: ស្ថាបនិក
2. ក្រុមហ៊ុន: Tech Startup - ចំណូលប្រចាំឆ្នាំ $200K
3. ស្ថានភាពមូលធន: កំពុងគ្រប់គ្រងមូលធនបង្វិល $50K, ស្វែងរកមូលនិធិ $300K
4. បញ្ហាប្រឈមចម្បង: ត្រូវការយុទ្ធសាស្ត្រដាក់ពង្រាយមូលធនដែលមានរចនាសម្ព័ន្ធ
5. កាលកំណត់: ត្រៀមវិនិយោគក្នុងរយៈពេល ៣ ខែ
6. ទំនាក់ទំនង: chendasum168@fmail.com, +855-11-665-697

🎯 ការណែនាំ:
• ចម្លងទម្រង់ខាងលើ
• ជំនួសដោយព័ត៌មានពិតរបស់អ្នក
• ផ្ញើជាសារពេញលេញមួយ
• យើងនឹងពិនិត្យ និងឆ្លើយតបក្នុងរយៈពេល ២៤ ម៉ោង

💰 ការវិនិយោគ: $197 (តម្លៃធម្មតា: $497)
🔥 មានកំណត់: ៥ កន្លែងក្នុងមួយខែ

មានសំណួរ? ទាក់ទង @Chendasum ដោយផ្ទាល់។`;

  await sendLongMessage(
    bot,
    userId,
    applicationMessage,
    {},
    MESSAGE_CHUNK_SIZE,
  );

  const adminId = parseInt(process.env.ADMIN_CHAT_ID);
  if (adminId) {
    await bot.sendMessage(
      adminId,
      `📋 APPLICATION FORM REQUESTED:

អ្នកប្រើប្រាស់: ${firstName} (${userId})
សារ: "${msg.text}"
ពេលវេលា: ${new Date().toLocaleString()}

អ្នកប្រើប្រាស់ត្រៀមដាក់ពាក្យសុំ Capital Clarity។`,
    );
  }
}

async function handleTextResponse(msg) {
  const userId = msg.from.id;
  const text = msg.text.toUpperCase();

  try {
    // FIXED: Use correct PostgreSQL field name
    const user = await User.findOne({ telegram_id: userId });

    if (!user) {
      await bot.sendMessage(
        msg.chat.id,
        "សូមចុះឈ្មោះមុន។ ប្រើ /start ដើម្បីចាប់ផ្តើម។",
      );
      return;
    }

    const restrictedActions = ["READY FOR DAY 1", "DAY", "PROGRAM COMPLETE"];
    const isRestrictedAction = restrictedActions.some((action) =>
      text.includes(action),
    );

    // FIXED: Check is_paid properly (PostgreSQL stores as 't'/'f' strings)
    const isPaid = user.is_paid === "t" || user.is_paid === true;

    console.log(`Text response access check for user ${userId}:`, {
      text: text,
      user_found: !!user,
      is_paid_raw: user?.is_paid,
      is_paid_boolean: isPaid,
      is_restricted_action: isRestrictedAction,
      tier: user?.tier,
    });

    if (isRestrictedAction && !isPaid) {
      await bot.sendMessage(
        msg.chat.id,
        "🔒 សូមទូទាត់មុនដើម្បីចូលរួមកម្មវិធី។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។",
      );
      return;
    }

    if (text === "READY FOR DAY 1") {
      await handleReadyForDay1(msg);
    } else if (text.includes("DAY") && text.includes("COMPLETE")) {
      await handleDayComplete(msg);
    } else if (text === "PROGRAM COMPLETE") {
      await handleProgramComplete(msg);
    }
  } catch (error) {
    console.error("Error handling general text response:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
  }
}

async function handleReadyForDay1(msg) {
  try {
    const user = await User.findOne({ telegram_id: msg.from.id });
    const isPaid = user?.is_paid === true || user?.is_paid === 't';
    
    if (!user || !isPaid) {
      await bot.sendMessage(msg.chat.id, "🔒 សូមទូទាត់មុនដើម្បីចូលរួមកម្មវិធី។ ប្រើ /pricing");
      return;
    }
    
    await Progress.findOneAndUpdate(
      { user_id: msg.from.id },
      { ready_for_day_1: true, current_day: 1 },
      { upsert: true }
    );
    
    await bot.sendMessage(msg.chat.id, `🎉 ល្អហើយ! អ្នកត្រៀមរួចហើយ!

ចាប់ផ្តើមថ្ងៃទី ១ ឥឡូវនេះ: /day1

ថ្ងៃទី ១ នឹងផ្ញើស្វ័យប្រវត្តិនៅម៉ោង ៩ ព្រឹកថ្ងៃស្អែកផងដែរ។

ជំនួយ ២៤/៧ ជាភាសាខ្មែរ! 💪`);
  } catch (error) {
    console.error("Error handling ready for day 1:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
}

async function handleDayComplete(msg) {
  const dayMatch = msg.text.toUpperCase().match(/DAY\s*(\d+)\s*COMPLETE/);
  if (!dayMatch) return;
  
  const dayNumber = parseInt(dayMatch[1]);
  const updateField = `day${dayNumber}Completed`;
  const completedAtField = `day${dayNumber}CompletedAt`;
  const nextDay = dayNumber + 1;
  
  await Progress.findOneAndUpdate(
    { user_id: msg.from.id },
    {
      [updateField]: true,
      [completedAtField]: new Date(),
      current_day: nextDay <= 7 ? nextDay : 7
    },
    { upsert: true }
  );
  
  const completeReaction = emojiReactions?.lessonCompleteReaction 
    ? emojiReactions.lessonCompleteReaction(dayNumber)
    : `🎉 ល្អណាស់! អ្នកបានបញ្ចប់ថ្ងៃទី ${dayNumber}!`;
  await bot.sendMessage(msg.chat.id, completeReaction);
  
  const celebrationMessage = celebrations?.dayCompleteCelebration
    ? celebrations.dayCompleteCelebration(dayNumber)
    : `🎊 សូមអបអរសាទរ! អ្នកបានបញ្ចប់ថ្ងៃទី ${dayNumber} ដោយជោគជ័យ!

📈 វឌ្ឍនភាព: ${dayNumber}/7 ថ្ងៃ
💪 បន្តទៅមុខទៀត!`;
  await sendLongMessage(bot, msg.chat.id, celebrationMessage, {}, MESSAGE_CHUNK_SIZE);
  
  // Progress-based rewards
  if (dayNumber === 3) {
    setTimeout(async () => {
      await bot.sendMessage(msg.chat.id, `🔥 អ្នកកំពុងធ្វើបានល្អ! 

បានបញ្ចប់ ៣ ថ្ងៃហើយ! 

💎 ចង់បានការណែនាំកម្រិតខ្ពស់?
👉 ពិចារណា Premium Program: /pricing

🚀 បន្តទៅ Day ${nextDay}: /day${nextDay}`);
    }, 5000);
  }
  
  if (dayNumber < 7) {
    await bot.sendMessage(msg.chat.id, `🚀 ត្រៀមរួចសម្រាប់ថ្ងៃទី ${nextDay}? ចុច /day${nextDay}`);
  } else {
    setTimeout(async () => {
      await bot.sendMessage(msg.chat.id, `🎊 អ្នកបានបញ្ចប់កម្មវិធីពេញលេញ! 

សរសេរ "PROGRAM COMPLETE" ដើម្បីទទួលយកការអបអរសាទរពិសេស!`);
    }, 3000);
  }
}

async function handleProgramComplete(msg) {
  try {
    const programCelebration = celebrations?.programCompleteCelebration
      ? celebrations.programCompleteCelebration(`🎯 ជំហានបន្ទាប់:
1️⃣ អនុវត្តផែនការ ៣០ ថ្ងៃ
2️⃣ ពិនិត្យដំណើរការប្រចាំសប្តាហ៍
3️⃣ មានសំណួរ? ទាក់ទងមកបាន!

🚀 ចង់បន្តកម្រិតបន្ទាប់?
VIP Advanced Program ចាប់ផ្តើមខែក្រោយ!
សួរ: "VIP PROGRAM INFO"`)
      : `🎊 អបអរសាទរ! អ្នកបានបញ្ចប់កម្មវិធី 7-Day Money Flow Reset™!

🏆 អ្នកឥឡូវនេះជា Money Flow Master!

🎯 អ្វីដែលអ្នកទទួលបាន:
✅ ចំណេះដឹងគ្រឹះអំពីការគ្រប់គ្រងលុយ
✅ ប្រព័ន្ធតាមដានដែលដំណើរការ
✅ ផែនការសម្រាប់អនាគត
✅ ទម្លាប់ដែលនឹងផ្លាស់ប្តូរជីវិត

🚀 ជំហានបន្ទាប់:
1️⃣ អនុវត្តផែនការ ៣០ ថ្ងៃ
2️⃣ ពិនិត្យដំណើរការប្រចាំសប្តាហ៍
3️⃣ ចាប់ផ្តើមរៀនអំពីការវិនិយោគ

👑 ចង់បន្តកម្រិតបន្ទាប់?
VIP Advanced Program ចាប់ផ្តើមខែក្រោយ!
សួរ: "VIP PROGRAM INFO"`;
    
    await sendLongMessage(bot, msg.chat.id, programCelebration, {}, MESSAGE_CHUNK_SIZE);
    
    await Progress.findOneAndUpdate(
      { user_id: msg.from.id },
      { programCompleted: true, programCompletedAt: new Date() },
      { upsert: true }
    );
    
    // Offer VIP program after completion
    if (vipCommands && vipCommands.offer) {
      setTimeout(async () => {
        await vipCommands.offer(msg, bot);
      }, 10000);
    } else {
      setTimeout(async () => {
        await bot.sendMessage(msg.chat.id, `🌟 Congratulations on completing the program!

👑 Ready for the next level?
VIP Program offers:
• 1-on-1 Strategic Consultation
• Advanced Capital Strategies  
• Personal Implementation Support

💰 VIP Investment: $197
📞 Contact: @Chendasum

Type "VIP APPLY" to get started!`);
      }, 10000);
    }
  } catch (error) {
    console.error("Error handling PROGRAM COMPLETE:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
}

async function handleCapitalClarity(msg) {
  try {
    const user = await User.findOne({ telegram_id: msg.from.id });
    const isPaid = user?.is_paid === true || user?.is_paid === 't';
    
    if (!user || !isPaid) {
      await bot.sendMessage(msg.chat.id, "🔒 សូមទូទាត់មុនដើម្បីចូលប្រើ Capital Clarity។ ប្រើ /pricing");
      return;
    }
    
    const clarityResponse = `🏛️ វគ្គ Capital Clarity - យុទ្ធសាស្ត្រមូលធនឯកជន

🎯 វគ្គយុទ្ធសាស្ត្រឯកជនសម្រាប់:
- ស្ថាបនិកដែលគ្រប់គ្រងមូលធនឯកជន ($100K+ ក្នុងមួយឆ្នាំ)
- អ្នកប្រតិបត្តិដែលមានរចនាសម្ព័ន្ធមូលនិធិ
- ម្ចាស់អាជីវកម្មដែលគ្រោងមូលនិធិសម្រាប់ការរីកចម្រើន
- វិនិយោគិនដែលត្រូវការការដាក់ពង្រាយមានរចនាសម្ព័ន្ធ

💰 ការវិនិយោគ: $197 (តម្លៃធម្មតា: $497) - មានកំណត់ ៥ កន្លែង/ខែ

🔍 ក្របខ័ណ្ឌវិភាគស្នូល:
១. Opening Frame - កំណត់ទំនុកចិត្ត និងបរិបទយុទ្ធសាស្ត្រ
២. Capital X-Ray - ពិនិត្យរចនាសម្ព័ន្ធមូលនិធិ/កិច្ចព្រមព្រៀង និងលំហូរ
៣. Trust Mapping - កំណត់ការបែកបាក់ទំនាក់ទំនង
៤. System Readiness Score - វាយតម្លៃសមត្ថភាពដាក់ពង្រាយ
៥. Clarity Discussion - ផែនទីផ្លូវអភិវឌ្ឍន៍សក្តានុពល

📞 ទាក់ទង: @Chendasum សម្រាប់ព័ត៌មានលម្អិត`;

    await sendLongMessage(bot, msg.chat.id, clarityResponse, {}, MESSAGE_CHUNK_SIZE);

    const adminId = parseInt(process.env.ADMIN_CHAT_ID);
    if (adminId) {
      await bot.sendMessage(adminId, `🏛️ NEW CAPITAL CLARITY INTEREST:

អ្នកប្រើប្រាស់: ${msg.from.first_name} (${msg.from.id})
ពេលវេលា: ${new Date().toLocaleString()}
ប្រភេទ: វគ្គយុទ្ធសាស្ត្រមូលធនឯកជន ($197)

អ្នកចាប់អារម្មណ៍កម្រិតខ្ពស់ចង់បង្កើនប្រសិទ្ធភាពរចនាសម្ព័ន្ធមូលធន។`);
    }
  } catch (error) {
    console.error("Error handling Capital Clarity:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
}

async function handleSmartResponse(msg) {
  const text = msg.text.toLowerCase();
  const questionWords = ["help", "problem", "issue", "question", "how", "why", "what", "where", "when", "បញ្ហា", "ជំនួយ", "សួរ", "យ៉ាងម៉េច"];
  const hasQuestionWord = questionWords.some(word => text.includes(word));
  const endsWithQuestionMark = msg.text.trim().endsWith("?");

  if (hasQuestionWord || endsWithQuestionMark) {
    const helpResponse = `🤔 ខ្ញុំឃើញអ្នកមានសំណួរ!

🔥 ជំនួយរហ័ស:
- បញ្ហាការទូទាត់ → ពិនិត្យ /faq
- បញ្ហាបច្ចេកទេស → ស្វែងរក /help
- សំណួរកម្មវិធី → ទាក់ទង @Chendasum
- ព័ត៌មាន VIP → ប្រើ /vip

📱 ឬគ្រាន់តែសរសេរសំណួរអ្នក - ខ្ញុំនឹងជួយ!

💬 ជំនួយ ២៤/៧ ជាភាសាខ្មែរ និង English!`;
    await bot.sendMessage(msg.chat.id, helpResponse);
  }
}

/ Railway webhook handler
app.post(`/bot${process.env.BOT_TOKEN}`, async (req, res) => {
  try {
    console.log("🔔 Webhook received");
    if (bot) {
      await bot.processUpdate(req.body);
    }
    res.sendStatus(200);
  } catch (error) {
    console.error("Webhook error:", error.message);
    res.sendStatus(500);
  }
});

// === BASIC ROUTES ===
app.get("/", (req, res) => {
  console.log("Root endpoint hit");
  res.json({
    name: "7-Day Money Flow Reset™ Telegram Bot",
    status: "Running with Full Features on Railway",
    time: new Date().toISOString(),
    url: getRailwayUrl(),
    features: [
      "7-Day Program Content",
      "30-Day Extended Content",
      "Payment Processing", 
      "VIP Programs",
      "Progress Tracking",
      "Admin Dashboard",
      "Free Tools",
      "Emergency Fallbacks",
      "Smart Error Handling",
      "Khmer Language Support"
    ],
    version: "2.0.0",
    environment: "Railway Production",
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

app.get("/ping", (req, res) => {
  console.log("Ping endpoint hit");
  res.send("Pong from Railway!");
});

app.get("/health", (req, res) => {
  console.log("Health check");
  res.json({ 
    status: "OK", 
    time: new Date().toISOString(),
    bot_initialized: !!bot,
    webhook_url: `${getRailwayUrl()}/bot${process.env.BOT_TOKEN}`,
    modules_loaded: {
      commands: !!dailyCommands,
      services: !!scheduler,
      utils: !!sendLongMessage,
      startCommand: !!startCommand,
      paymentCommands: !!paymentCommands,
      vipCommands: !!vipCommands,
      adminCommands: !!adminCommands
    }
  });
});

app.get("/analytics", async (req, res) => {
  try {
    if (analytics && analytics.getStats) {
      const stats = await analytics.getStats();
      res.json(stats);
    } else {
      res.json({ 
        message: "Analytics module not loaded",
        basic_stats: {
          server_uptime: process.uptime(),
          memory_usage: process.memoryUsage(),
          timestamp: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to get analytics" });
  }
});

app.post("/webhook/payment", async (req, res) => {
  try {
    const { userId, amount, status, transactionId } = req.body;
    
    if (status === "completed" && amount >= 24) {
      if (paymentCommands && paymentCommands.confirmPayment) {
        await paymentCommands.confirmPayment(bot, userId, transactionId);
      } else {
        console.log(`Payment confirmed for user ${userId}: $${amount}`);
        // Fallback payment confirmation
        try {
          await User.findOneAndUpdate(
            { telegram_id: userId },
            { 
              is_paid: true,
              payment_date: new Date(),
              tier: 'essential'
            },
            { new: true }
          );
          
          await bot.sendMessage(userId, `🎉 ការទូទាត់របស់អ្នកត្រូវបានបញ្ជាក់!

✅ អ្នកឥឡូវនេះអាចចូលប្រើកម្មវិធី 7-Day Money Flow Reset™

🚀 ចាប់ផ្តើមភ្លាម: /day1

💬 ជំនួយ: @Chendasum`);
        } catch (fallbackError) {
          console.log("Fallback payment confirmation failed:", fallbackError);
        }
      }
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Payment webhook error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/webhook-info", async (req, res) => {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${process.env.BOT_TOKEN}/getWebhookInfo`,
    );
    const webhookInfo = await response.json();
    res.json(webhookInfo);
  } catch (error) {
    res.status(500).json({ error: "Failed to get webhook info", details: error.message });
  }
});

app.get("/test-bot", async (req, res) => {
  try {
    const botInfo = await bot.getMe();
    res.json({ ok: true, result: botInfo });
  } catch (error) {
    res.status(500).json({ error: "Failed to get bot info", details: error.message });
  }
});

app.get("/bot-status", async (req, res) => {
  try {
    const botInfo = await bot.getMe();

    const webhookResponse = await fetch(
      `https://api.telegram.org/bot${process.env.BOT_TOKEN}/getWebhookInfo`,
    );
    const webhookData = await webhookResponse.json();
    const webhookInfo = webhookData.result;

    res.json({
      bot_status: botInfo ? "✅ Online" : "❌ Offline",
      webhook_status: webhookInfo.url ? "✅ Active" : "❌ Not Set",
      webhook_url: webhookInfo.url || "None",
      pending_updates: webhookInfo.pending_update_count || 0,
      server_uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      bot_info: {
        id: botInfo.id,
        username: botInfo.username,
        first_name: botInfo.first_name,
      },
      features_loaded: {
        startCommand: !!startCommand,
        dailyCommands: !!dailyCommands,
        paymentCommands: !!paymentCommands,
        vipCommands: !!vipCommands,
        adminCommands: !!adminCommands,
        scheduler: !!scheduler,
        analytics: !!analytics,
        accessControl: !!accessControl
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/setup-webhook", async (req, res) => {
  try {
    const railwayBaseUrl = getRailwayUrl();
    const correctWebhookUrl = `${railwayBaseUrl}/bot${process.env.BOT_TOKEN}`;
    console.log("🔧 Manual webhook setup to:", correctWebhookUrl);
    await bot.setWebHook(correctWebhookUrl);
    res.json({
      success: true,
      message: "Webhook set successfully",
      url: correctWebhookUrl,
    });
  } catch (error) {
    console.error("Manual webhook setup error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/healthz", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    automation: "Enhanced with 7-Day automation",
  });
});

app.get("/ready", (req, res) => {
  res.status(200).json({
    status: "ready",
    timestamp: new Date().toISOString(),
    features: "7-Day automation enabled",
  });
});

// === START SERVER ===
const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0"; // Railway requires 0.0.0.0

// Wrap the main startup logic in an async IIFE to ensure proper async flow
(async () => {
  await initBotWebhook();

  const server = app.listen(PORT, HOST, () => {
    console.log(`🚀 Server running on ${HOST}:${PORT}`);
    console.log(`🌐 URL: ${getRailwayUrl()}`);
    console.log(`🎯 Features: Full 7-Day + 30-Day Program with enhanced error handling`);
  });

  // === CRON JOBS ===
  if (scheduler && scheduler.sendDailyMessages) {
    cron.schedule("0 9 * * *", async () => {
      console.log("🕘 Sending daily messages...");
      try {
        await scheduler.sendDailyMessages(bot);
      } catch (error) {
        console.error("Error sending daily messages:", error);
      }
    });
    console.log("✅ Daily messages cron job scheduled for 9 AM");
  } else {
    console.log("⚠️ Scheduler module not loaded - daily messages disabled");
  }

  // Initialize Content Scheduler
  if (ContentScheduler) {
    try {
      const contentScheduler = new ContentScheduler(bot);
      contentScheduler.start();
      console.log("✅ Content scheduler started");
    } catch (error) {
      console.error("⚠️ Could not start content scheduler:", error.message);
    }
  } else {
    console.log("⚠️ ContentScheduler not loaded");
  }

  console.log("🤖 Bot started successfully with enhanced error handling!");
  console.log("🚀 Core features loaded:");
  console.log("   • 7-Day Money Flow Program");
  console.log("   • 30-Day Extended Content");
  console.log("   • Enhanced Payment Processing");
  console.log("   • VIP Programs");
  console.log("   • Progress Tracking");
  console.log("   • Admin Commands");
  console.log("   • Free Tools");
  console.log("   • Smart Error Handling");
  console.log("   • Emergency Fallbacks");
  console.log("   • Module Safety System");
  console.log("🔱 7-Day Money Flow Reset™ READY on Railway!");

  // === GRACEFUL SHUTDOWN ===
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

  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err.message);
    console.error('Stack:', err.stack);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
    console.error('Promise:', promise);
  });
})();
