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
app.use(express.json({ limit: "10mb", charset: "utf-8" }));
app.use(express.urlencoded({ extended: true, charset: "utf-8" }));

// Set UTF-8 headers
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});

// Initialize services with error handling
let accessControl = { 
  getTierSpecificHelp: async () => `📱 ជំនួយ (Help):

🌟 7-Day Money Flow Reset™ 

📱 ពាក្យបញ្ជាសំខាន់:
- /start - ចាប់ផ្តើម
- /pricing - មើលតម្លៃ
- /payment - ការទូទាត់
- /help - ជំនួយ
- /faq - សំណួរញឹកញាប់

💬 ជំនួយ: @Chendasum`,
  getTierSpecificFAQ: async () => "FAQ text" 
};
let conversionOptimizer = {};

if (AccessControl) {
  try {
    accessControl = new AccessControl();
  } catch(e) {
    console.log("⚠️ Could not initialize AccessControl");
  }
}

if (ConversionOptimizer) {
  try {
    conversionOptimizer = new ConversionOptimizer();
  } catch(e) {
    console.log("⚠️ Could not initialize ConversionOptimizer");
  }
}

// Duplicate prevention system
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

// Function to get the Railway URL
function getRailwayUrl() {
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  }
  return `https://money7daysreset-production.up.railway.app`;
}

// Initialize bot
let bot = null;
if (process.env.BOT_TOKEN) {
  try {
    bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false, onlyFirstMatch: true });
    console.log("✅ Bot initialized for webhook mode");

    // Enhanced bot initialization for webhook mode on Railway
    async function initBotWebhook() {
      console.log("Starting bot initialization process for webhooks on Railway...");

      try {
        // 1. Stop polling if active
        try {
          await bot.stopPolling();
          console.log("Polling stopped successfully (if active).");
        } catch (stopError) {
          console.log("No active polling to stop (expected).");
        }

        // 2. Delete existing webhook
        try {
          const deleteResult = await bot.deleteWebHook();
          console.log("Webhook deleted successfully:", deleteResult);
        } catch (deleteError) {
          console.log("Failed to delete webhook:", deleteError.message);
        }

        // 3. Set new webhook
        const railwayDomain = getRailwayUrl();
        const webhookUrl = `${railwayDomain}/bot${process.env.BOT_TOKEN}`;

        console.log(`Setting webhook to: ${webhookUrl}`);
        const setWebhookResult = await bot.setWebHook(webhookUrl);
        console.log("✅ Webhook set successfully:", setWebhookResult);

        console.log("✅ Bot initialized successfully for webhook mode on Railway.");
      } catch (error) {
        console.error("❌ Bot initialization error:", error.message);
      }
    }

    // Initialize webhook
    (async () => {
      await initBotWebhook();
    })();

    // === WEBHOOK HANDLER ===
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

    // === CORE COMMANDS ===
    
    // /start command
    bot.onText(/\/start/i, async (msg) => {
      console.log("🚀 [START] User:", msg.from.id);
      if (isDuplicateMessage(msg)) return;
      
      try {
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

📱 ប្រើប្រាស់: /pricing ដើម្បីមើលលម្អិត
💳 ទូទាត់: /payment ដើម្បីចាប់ផ្តើម

👨‍💼 ទាក់ទង: @Chendasum សម្រាប់ជំនួយ

/help - ជំនួយពេញលេញ`;
          await bot.sendMessage(msg.chat.id, welcomeMessage);
        }
        console.log("✅ [START] Completed");
      } catch (error) {
        console.error("❌ [START] Error:", error.message);
        await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហាក្នុងការចាប់ផ្តើម។ សូមសាកល្បងម្តងទៀត។");
      }
    });

    // /help command
    bot.onText(/\/help/i, async (msg) => {
      console.log("🔧 [HELP] User:", msg.from.id);
      if (isDuplicateMessage(msg)) return;
      
      try {
        const helpMessage = await accessControl.getTierSpecificHelp(msg.from.id);
        await sendLongMessage(bot, msg.chat.id, helpMessage, { parse_mode: "Markdown" }, MESSAGE_CHUNK_SIZE);
        console.log("✅ [HELP] Sent");
      } catch (error) {
        console.error("❌ [HELP] Error:", error.message);
        await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហាក្នុងការផ្ទុកជំនួយ។");
      }
    });

    // EMERGENCY /pricing command handler
    bot.onText(/\/pricing/i, async (msg) => {
      console.log("💰 [PRICING] User:", msg.from.id);
      if (isDuplicateMessage(msg)) return;
      
      try {
        if (paymentCommands && paymentCommands.pricing) {
          await paymentCommands.pricing(msg, bot);
        } else {
          // Enhanced emergency pricing
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
        }
        console.log("✅ [PRICING] Sent");
      } catch (error) {
        console.error("❌ [PRICING] Error:", error.message);
        await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ ទាក់ទង @Chendasum");
      }
    });

    // EMERGENCY /payment command handler
    bot.onText(/\/payment/i, async (msg) => {
      console.log("💳 [PAYMENT] User:", msg.from.id);
      if (isDuplicateMessage(msg)) return;
      
      try {
        if (paymentCommands && paymentCommands.instructions) {
          await paymentCommands.instructions(msg, bot);
        } else {
          // Enhanced emergency payment
          const emergencyPayment = `💳 ការណែនាំទូទាត់

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
        }
        console.log("✅ [PAYMENT] Sent");
      } catch (error) {
        console.error("❌ [PAYMENT] Error:", error.message);
        await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ ទាក់ទង @Chendasum");
      }
    });

    // === DAY COMMANDS (1-7) ===
    bot.onText(/\/day([1-7])/i, async (msg, match) => {
      console.log(`📚 [DAY${match[1]}] User:`, msg.from.id);
      if (isDuplicateMessage(msg)) return;
      
      try {
        const user = await User.findOne({ telegram_id: msg.from.id });
        const isPaid = user?.is_paid === true || user?.is_paid === 't';
        
        if (!user || !isPaid) {
          await bot.sendMessage(msg.chat.id, "🔒 សូមទូទាត់មុនដើម្បីចូលរួមកម្មវិធី។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។");
          return;
        }
        
        if (dailyCommands && dailyCommands.handle) {
          await dailyCommands.handle(msg, match, bot);
        } else {
          // Enhanced fallback daily content
          const dayContent = `📚 ថ្ងៃទី ${match[1]} - កម្មវិធីពេញលេញ

🎯 សូមស្វាគមន៍! អ្នកបានទូទាត់រួចហើយ

📖 មាតិកាថ្ងៃទី ${match[1]}:
${getDayFallbackContent(match[1])}

📞 ទាក់ទង @Chendasum សម្រាប់មាតិកាពេញលេញ។`;
          await bot.sendMessage(msg.chat.id, dayContent);
        }
      } catch (error) {
        console.error(`❌ [DAY${match[1]}] Error:`, error.message);
        await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
      }
    });

    // Helper function for day content fallbacks
    function getDayFallbackContent(day) {
      const dayContents = {
        '1': `🔍 ស្គាល់ Money Flow របស់អ្នក
• ពិនិត្យចំណូល និងចំណាយ
• ស្វែងរកកន្លែងលុយលេច
• ចាប់ផ្តើមតាមដាន`,
        '2': `🕵️ រកមើល Money Leaks
• បង្កើតបញ្ជីចំណាយ
• កំណត់ចំណាយមិនចាំបាច់
• គណនាលុយខាតប្រចាំខែ`,
        '3': `📊 វាយតម្លៃប្រព័ន្ធ
• ពិនិត្យហិរញ្ញវត្ថុបច្ចុប្បន្ន
• កំណត់បញ្ហាចម្បង
• រៀបចំផែនការកែលម្អ`,
        '4': `🗺️ បង្កើតផែនទីលុយ
• បង្កើតផែនការចំណាយ
• កំណត់គោលដៅសន្សំ
• រៀបចំប្រព័ន្ធតាមដាន`,
        '5': `📈 Survival vs Growth
• បែងចែកចំណាយជីវភាព
• រកចំណូលបន្ថែម
• វិនិយោគដំបូង`,
        '6': `📋 រៀបចំផែនការ
• បញ្ចប់ផែនការ ៧ ថ្ងៃ
• គោលដៅរយៈពេលវែង
• ការតាមដានបន្ត`,
        '7': `✨ Integration
• ពិនិត្យលទ្ធផល
• បង្កើតទម្លាប់ថ្មី
• ផែនការអនាគត`
      };
      return dayContents[day] || "មាតិកាកំពុងត្រូវបានផ្ទុក...";
    }

    // === EXTENDED CONTENT (Day 8-30) ===
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
          await bot.sendMessage(msg.chat.id, "🔒 សូមទូទាត់មុនដើម្បីចូលប្រើមាតិកាបន្ថែម។ ប្រើ /pricing");
          return;
        }
        
        if (extendedContent && extendedContent.handleExtendedDay) {
          await extendedContent.handleExtendedDay(msg, bot, day);
        } else {
          await bot.sendMessage(msg.chat.id, `📚 ថ្ងៃទី ${day} - មាតិកាបន្ថែម

🎯 សូមស្វាគមន៍! អ្នកបានទូទាត់រួចហើយ

មាតិកាថ្ងៃទី ${day} នឹងត្រូវបានផ្ញើមកអ្នកឆាប់ៗនេះ។

📞 ទាក់ទង @Chendasum សម្រាប់មាតិកាពេញលេញ។`);
        }
      } catch (error) {
        console.error("Error in /extended command:", error);
        await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
      }
    });

    // === VIP COMMANDS ===
    bot.onText(/\/vip$/i, async (msg) => {
      console.log("👑 [VIP] User:", msg.from.id);
      if (isDuplicateMessage(msg)) return;
      
      try {
        const user = await User.findOne({ telegram_id: msg.from.id });
        const isPaid = user?.is_paid === true || user?.is_paid === 't';
        
        if (!user || !isPaid) {
          await bot.sendMessage(msg.chat.id, "🔒 សូមទូទាត់មុនដើម្បីចូលរួមកម្មវិធី VIP។ ប្រើ /pricing");
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
        console.error("❌ [VIP] Error:", error.message);
        await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
      }
    });

    // === ADMIN COMMANDS ===
    const adminCommands_safe = {
      showUsers: async (msg, bot) => {
        const adminId = parseInt(process.env.ADMIN_CHAT_ID);
        if (msg.from.id !== adminId) {
          await bot.sendMessage(msg.chat.id, "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះទេ។");
          return;
        }
        await bot.sendMessage(msg.chat.id, "📊 Admin feature កំពុងត្រូវបានអភិវឌ្ឍ។");
      },
      showAnalytics: async (msg, bot) => {
        const adminId = parseInt(process.env.ADMIN_CHAT_ID);
        if (msg.from.id !== adminId) {
          await bot.sendMessage(msg.chat.id, "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះទេ។");
          return;
        }
        await bot.sendMessage(msg.chat.id, "📈 Analytics កំពុងត្រូវបានអភិវឌ្ឍ។");
      },
      confirmPayment: async (msg, match, bot) => {
        const adminId = parseInt(process.env.ADMIN_CHAT_ID);
        if (msg.from.id !== adminId) {
          await bot.sendMessage(msg.chat.id, "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះទេ។");
          return;
        }
        await bot.sendMessage(msg.chat.id, "💳 Payment confirmation កំពុងត្រូវបានអភិវឌ្ឍ។");
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

    // === FREE TOOLS ===
    bot.onText(/\/financial_quiz/i, async (msg) => {
      if (isDuplicateMessage(msg)) return;
      try {
        if (financialQuiz && financialQuiz.startQuiz) {
          await financialQuiz.startQuiz(msg, bot);
        } else {
          await bot.sendMessage(msg.chat.id, "📊 Financial Quiz កំពុងត្រូវបានអភិវឌ្ឍ។");
        }
      } catch (e) {
        console.error("Error /financial_quiz:", e);
        await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
      }
    });

    bot.onText(/\/calculate_daily/i, async (msg) => {
      if (isDuplicateMessage(msg)) return;
      try {
        if (freeTools && freeTools.calculateDaily) {
          await freeTools.calculateDaily(msg, bot);
        } else {
          await bot.sendMessage(msg.chat.id, "🧮 Calculator កំពុងត្រូវបានអភិវឌ្ឍ។");
        }
      } catch (e) {
        console.error("Error /calculate_daily:", e);
        await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
      }
    });

    // === PREVIEW COMMANDS ===
    bot.onText(/\/preview$/i, async (msg) => {
      if (isDuplicateMessage(msg)) return;
      try {
        if (previewCommands && previewCommands.preview) {
          await previewCommands.preview(msg, bot);
        } else {
          const previewMessage = `👀 មើលមុន (Preview) 7-Day Money Flow Reset™

🎯 ចាប់ផ្តើមមើលមុនកម្មវិធី:

📚 ថ្ងៃទី ១ - ស្គាល់ Money Flow:
• រៀនពីរបៀបលុយចូល និងចេញ
• ស្វែងរកកន្លែងលុយលេច
• ចាប់ផ្តើមតាមដានប្រចាំថ្ងៃ

💡 នេះគ្រាន់តែជាការមើលមុនតែប៉ុណ្ណោះ!

🔓 ចង់ទទួលបានកម្មវិធីពេញលេញ?
👉 /pricing - មើលតម្លៃ
👉 /payment - ទូទាត់ភ្លាម`;
          await bot.sendMessage(msg.chat.id, previewMessage);
        }
      } catch (e) {
        console.error("Error /preview:", e);
        await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
      }
    });

    // === BADGES & PROGRESS (PAID ONLY) ===
    bot.onText(/\/badges/i, async (msg) => {
      if (isDuplicateMessage(msg)) return;
      try {
        const user = await User.findOne({ telegram_id: msg.from.id });
        const isPaid = user?.is_paid === true || user?.is_paid === 't';
        
        if (!user || !isPaid) {
          await bot.sendMessage(msg.chat.id, "🔒 សូមទូទាត់មុនដើម្បីមើល badges។ ប្រើ /pricing");
          return;
        }
        
        if (badgesCommands && badgesCommands.showBadges) {
          await badgesCommands.showBadges(msg, bot);
        } else {
          await bot.sendMessage(msg.chat.id, "🏆 Badges កំពុងត្រូវបានអភិវឌ្ឍ។");
        }
      } catch (error) {
        console.error("Error in /badges command:", error);
        await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
      }
    });

    bot.onText(/\/progress/i, async (msg) => {
      if (isDuplicateMessage(msg)) return;
      try {
        const user = await User.findOne({ telegram_id: msg.from.id });
        const isPaid = user?.is_paid === true || user?.is_paid === 't';
        
        if (!user || !isPaid) {
          await bot.sendMessage(msg.chat.id, "🔒 សូមទូទាត់មុនដើម្បីមើលការរីកចម្រើន។ ប្រើ /pricing");
          return;
        }
        
        if (badgesCommands && badgesCommands.showProgress) {
          await badgesCommands.showProgress(msg, bot);
        } else {
          await bot.sendMessage(msg.chat.id, "📈 Progress កំពុងត្រូវបានអភិវឌ្ឍ។");
        }
      } catch (error) {
        console.error("Error in /progress command:", error);
        await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
      }
    });

    // === QUOTES ===
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
            "🌟 \"ការវិនិយោគលើចំណេះដឹង គឺជាការវិនិយោគល្អបំផុត។\""
          ];
          const randomQuote = randomQuotes[Math.floor(Math.random() * randomQuotes.length)];
          await bot.sendMessage(msg.chat.id, `📜 សម្រង់ប្រចាំថ្ងៃ:

${randomQuote}

🌅 សូមឱ្យថ្ងៃនេះពោរពេញដោយការរីកចម្រើន!`);
        }
      } catch (e) {
        console.error("Error /quote:", e);
        await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
      }
    });

    // === FAQ COMMAND ===
    bot.onText(/\/faq|FAQ|faq/i, async (msg) => {
      if (isDuplicateMessage(msg)) return;
      try {
        const user = await User.findOne({ telegram_id: msg.from.id });
        const isPaid = user?.is_paid === true || user?.is_paid === 't';
        
        let faqMessage;
        if (!isPaid) {
          faqMessage = `❓ សំណួរញឹកញាប់ (FAQ) - Welcome Guide

💰 អំពីតម្លៃ:
- តម្លៃប៉ុន្មាន? → $24 (Essential)
- ទូទាត់យ៉ាងដូចម្តេច? → ABA, ACLEDA, Wing
- បញ្ជាក់ការទូទាត់? → ១-២ ម៉ោង

⏰ អំពីពេលវេលា:
- ចំណាយពេលប៉ុន្មាននាទី? → ១៥-២០ នាទី/ថ្ងៃ
- អាចធ្វើលឿន? → បាន តែណែនាំ ១ថ្ងៃ/១មេរៀន

🎯 អំពីមាតិកា:
- មេរៀនអ្វីខ្លះ? → ៧ថ្ងៃ Money Management
- ភាសាអ្វី? → ភាសាខ្មែរ ១០០%

📱 ពាក្យបញ្ជា:
- /start - ចាប់ផ្តើម
- /pricing - មើលតម្លៃ
- /payment - ការទូទាត់
- /help - ជំនួយ

💬 ត្រូវការជំនួយ? ទាក់ទង @Chendasum`;
        } else {
          faqMessage = `❓ សំណួរញឹកញាប់ (FAQ) - សមាជិក

✅ អ្នកបានទូទាត់រួច!

📚 កម្មវិធី ៧ ថ្ងៃ:
- /day1 ដល់ /day7

📈 កម្មវិធី 30 ថ្ងៃ:
- /extended8 ដល់ /extended30

🏆 តាមដាន:
- /badges - សមិទ្ធផល
- /progress - ការរីកចម្រើន
- /quote - សម្រង់ប្រចាំថ្ងៃ

👑 VIP:
- /vip - ព័ត៌មាន VIP
- សរសេរ "VIP APPLY" - ដាក់ពាក្យ

💬 ជំនួយ: @Chendasum`;
        }
        
        await bot.sendMessage(msg.chat.id, faqMessage);
      } catch (error) {
        console.error("Error in FAQ command:", error);
        await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
      }
    });

    // === STATUS COMMAND ===
    bot.onText(/\/status|ស្ថានភាព/i, async (msg) => {
      if (isDuplicateMessage(msg)) return;
      try {
        const user = await User.findOne({ telegram_id: msg.from.id });
        if (!user) {
          await bot.sendMessage(msg.chat.id, "អ្នកមិនទាន់ចុះឈ្មោះ។ ប្រើ /start ដើម្បីចាប់ផ្តើម។");
          return;
        }
        
        const isPaid = user.is_paid === true || user.is_paid === 't';
        const progress = await Progress.findOne({ user_id: msg.from.id });
        
        let statusMessage = `📊 ស្ថានភាពគណនីរបស់អ្នក:

👤 អ្នកប្រើប្រាស់: ${user.first_name || "មិនស្គាល់"}
📅 ចូលរួម: ${user.joined_at ? new Date(user.joined_at).toDateString() : "មិនស្គាល់"}
💰 ស្ថានភាព: ${isPaid ? "✅ បានទូទាត់" : "❌ មិនទាន់ទូទាត់"}
🎯 កម្រិត: ${user.tier || "Essential"}`;

        if (isPaid) {
          statusMessage += `
📈 ថ្ងៃបច្ចុប្បន្ន: Day ${progress?.current_day || 0}
🎯 អ្នកអាចប្រើប្រាស់កម្មវិធីបានពេញលេញ!`;
        } else {
          statusMessage += `
🔒 សូមទូទាត់ដើម្បីចូលប្រើ Day 1-7
💡 ប្រើ /pricing ដើម្បីមើលតម្លៃ`;
        }
        
        await bot.sendMessage(msg.chat.id, statusMessage);
      } catch (error) {
        console.error("Error in status command:", error);
        await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
      }
    });

    // === WHOAMI COMMAND ===
    bot.onText(/\/whoami/i, async (msg) => {
      if (isDuplicateMessage(msg)) return;
      try {
        const user = await User.findOne({ telegram_id: msg.from.id });
        const adminId = parseInt(process.env.ADMIN_CHAT_ID);
        const isAdmin = msg.from.id === adminId;
        const isPaid = user?.is_paid === true || user?.is_paid === 't';
        
        let response = `🔍 ព័ត៌មានរបស់អ្នក:\n\n`;
        response += `• Chat ID: ${msg.chat.id}\n`;
        response += `• User ID: ${msg.from.id}\n`;
        response += `• ឈ្មោះ: ${msg.from.first_name || "N/A"}\n`;
        response += `• Username: ${msg.from.username ? "@" + msg.from.username : "N/A"}\n`;
        response += `• Admin: ${isAdmin ? "✅" : "❌"}\n`;
        
        if (user) {
          response += `• ចុះឈ្មោះ: ✅\n`;
          response += `• ទូទាត់: ${isPaid ? "✅" : "❌"}\n`;
          response += `• កម្រិត: ${user.tier || "Essential"}\n`;
        } else {
          response += `• ចុះឈ្មោះ: ❌\n`;
        }
        
        await bot.sendMessage(msg.chat.id, response);
      } catch (error) {
        console.error("Error in whoami command:", error);
        await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
      }
    });

    // === TEST COMMAND ===
    bot.onText(/\/test/i, async (msg) => {
      try {
        await bot.sendMessage(msg.chat.id, "✅ Enhanced Railway bot is working! All core features loaded.");
        console.log("Test command sent to:", msg.from.id);
      } catch (error) {
        console.error("Test command error:", error.message);
      }
    });

    // === MESSAGE HANDLERS ===
    
    // Main message handler with text processing
    bot.on("message", async (msg) => {
      if (!msg.text || msg.text.startsWith("/")) return;
      if (isDuplicateMessage(msg)) return;
      
      const text = msg.text.toLowerCase();
      
      // Check if it's a financial quiz response
      if (financialQuiz && financialQuiz.processQuizResponse) {
        try {
          if (await financialQuiz.processQuizResponse(msg, bot)) {
            return;
          }
        } catch (error) {
          console.error("Error processing quiz response:", error);
        }
      }
      
      // Check if it's a free tools response
      if (freeTools && freeTools.processToolResponse) {
        try {
          const user = await User.findOne({ telegram_id: msg.from.id });
          if (await freeTools.processToolResponse(msg, bot, user)) {
            return;
          }
        } catch (error) {
          console.error("Error processing tools response:", error);
        }
      }
      
      // Handle specific text commands
      if (text === "vip apply") {
        await handleVipApply(msg);
      } else if (text === "ready for day 1") {
        await handleReadyForDay1(msg);
      } else if (text.includes("day") && text.includes("complete")) {
        await handleDayComplete(msg);
      } else if (text === "program complete") {
        await handleProgramComplete(msg);
      } else if (text === "capital clarity" || text === "CAPITAL CLARITY") {
        await handleCapitalClarity(msg);
      } else {
        // Smart question detection
        await handleSmartResponse(msg);
      }
    });

    // Handler functions
    async function handleVipApply(msg) {
      try {
        const user = await User.findOne({ telegram_id: msg.from.id });
        const isPaid = user?.is_paid === true || user?.is_paid === 't';
        
        if (!user || !isPaid) {
          await bot.sendMessage(msg.chat.id, "🔒 សូមទូទាត់មុនដើម្បីចូលរួមកម្មវិធី VIP។ ប្រើ /pricing");
          return;
        }
        
        if (vipCommands && vipCommands.apply) {
          await vipCommands.apply(msg, bot);
        } else {
          await bot.sendMessage(msg.chat.id, `🌟 VIP APPLICATION

សូមផ្ញើព័ត៌មាន:
1️⃣ ឈ្មោះពេញ
2️⃣ អាជីវកម្ម
3️⃣ គោលដៅហិរញ្ញវត្ថុ
4️⃣ លេខទូរស័ព្ទ

💰 តម្លៃ VIP: $197
📞 Admin នឹងទាក់ទងអ្នក`);
        }
      } catch (error) {
        console.error("Error handling VIP APPLY:", error);
        await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
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
      
      if (dayNumber < 7) {
        await bot.sendMessage(msg.chat.id, `🚀 ត្រៀមរួចសម្រាប់ថ្ងៃទី ${nextDay}? ចុច /day${nextDay}`);
      } else {
        await bot.sendMessage(msg.chat.id, `🎊 អ្នកបានបញ្ចប់កម្មវិធីពេញលេញ! សរសេរ "PROGRAM COMPLETE"`);
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

🎯 ជំហានបន្ទាប់:
1️⃣ អនុវត្តផែនការ ៣០ ថ្ងៃ
2️⃣ ពិនិត្យដំណើរការប្រចាំសប្តាហ៍
3️⃣ មានសំណួរ? ទាក់ទងមកបាន!

🚀 ចង់បន្តកម្រិតបន្ទាប់?
VIP Advanced Program ចាប់ផ្តើមខែក្រោយ!
សួរ: "VIP PROGRAM INFO"`;
        
        await sendLongMessage(bot, msg.chat.id, programCelebration, {}, MESSAGE_CHUNK_SIZE);
        
        await Progress.findOneAndUpdate(
          { user_id: msg.from.id },
          { programCompleted: true, programCompletedAt: new Date() },
          { upsert: true }
        );
        
        if (vipCommands && vipCommands.offer) {
          setTimeout(async () => {
            await vipCommands.offer(msg, bot);
          }, 5000);
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
        
        await bot.sendMessage(msg.chat.id, `🏛️ Capital Clarity - យុទ្ធសាស្ត្រមូលធនឯកជន

🎯 វគ្គយុទ្ធសាស្ត្រឯកជនសម្រាប់:
- ស្ថាបនិកដែលគ្រប់គ្រងមូលធន
- អ្នកប្រតិបត្តិដែលមានរចនាសម្ព័ន្ធមូលនិធិ
- ម្ចាស់អាជីវកម្មដែលគ្រោងរីកចម្រើន

💰 ការវិនិយោគ: $197
📞 ទាក់ទង: @Chendasum សម្រាប់ព័ត៌មានលម្អិត`);
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

💬 ជំនួយ ២៤/៧ ជាភាសាខ្មែរ!`;
        await bot.sendMessage(msg.chat.id, helpResponse);
      }
    }

    console.log("✅ All bot commands registered successfully");

  } catch (error) {
    console.error("❌ Bot initialization failed:", error.message);
  }
} else {
  console.error("❌ No BOT_TOKEN found");
}

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
      "Khmer Language Support"
    ]
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
    modules_loaded: {
      commands: !!dailyCommands,
      services: !!scheduler,
      utils: !!sendLongMessage
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
        console.log(`Payment confirmed for user ${userId}: ${amount}`);
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
        analytics: !!analytics
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

const server = app.listen(PORT, HOST, async () => {
  console.log(`🚀 Server running on ${HOST}:${PORT}`);
  console.log(`🌐 URL: ${getRailwayUrl()}`);
  console.log(`🎯 Features: Full 7-Day + 30-Day Program with error handling`);
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
console.log("   • Enhanced Payment Processing");
console.log("   • VIP Programs");
console.log("   • Progress Tracking");
console.log("   • Admin Commands");
console.log("   • Free Tools");
console.log("   • Smart Error Handling");
console.log("   • Module Fallbacks");
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
