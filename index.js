require("dotenv").config();

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const cron = require("node-cron");

console.log("🚀 Starting 7-Day Money Flow Bot (Railway Version)...");
console.log("BOT_TOKEN exists:", !!process.env.BOT_TOKEN);
console.log("PORT:", process.env.PORT || 5000);

// Initialize Express app first
const app = express();
app.use(express.json({ limit: "10mb", charset: "utf-8" }));
app.use(express.urlencoded({ extended: true, charset: "utf-8" }));

// Set UTF-8 headers for all outgoing responses
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});

// === DATABASE MODELS - WITH FALLBACK ===
let User = {
  findOne: async () => null,
  findOneAndUpdate: async (filter, update, options) => null
};

let Progress = {
  findOne: async () => null,
  findOneAndUpdate: async (filter, update, options) => null
};

// Try to load real models if available
try {
  const UserModel = require("./models/User");
  const ProgressModel = require("./models/Progress");
  User = UserModel;
  Progress = ProgressModel;
  console.log("✅ Database models loaded");
} catch (error) {
  console.log("⚠️ Using fallback database models");
}

// === IMPORT COMMAND MODULES - WITH FALLBACK ===
let startCommand = { handle: async (msg, bot) => { 
  await bot.sendMessage(msg.chat.id, "Bot starting..."); 
}};
let dailyCommands = { handle: async (msg, match, bot) => { 
  await bot.sendMessage(msg.chat.id, "Daily content coming soon..."); 
}};
let paymentCommands = { 
  pricing: async (msg, bot) => { await bot.sendMessage(msg.chat.id, "Pricing info..."); },
  instructions: async (msg, bot) => { await bot.sendMessage(msg.chat.id, "Payment instructions..."); }
};
let vipCommands = { info: async (msg, bot) => { 
  await bot.sendMessage(msg.chat.id, "VIP info..."); 
}};
let adminCommands = {
  showUsers: async (msg, bot) => { await bot.sendMessage(msg.chat.id, "Admin users..."); },
  showAnalytics: async (msg, bot) => { await bot.sendMessage(msg.chat.id, "Analytics..."); },
  checkProgress: async (msg, match, bot) => { await bot.sendMessage(msg.chat.id, "Progress check..."); },
  showActivity: async (msg, bot) => { await bot.sendMessage(msg.chat.id, "Activity..."); },
  showFollowup: async (msg, bot) => { await bot.sendMessage(msg.chat.id, "Followup..."); }
};
let quotesCommands = { 
  random: async (msg, bot) => { await bot.sendMessage(msg.chat.id, "Quote..."); },
  categories: async (msg, bot) => { await bot.sendMessage(msg.chat.id, "Categories..."); }
};
let badgesCommands = { show: async (msg, bot) => { 
  await bot.sendMessage(msg.chat.id, "Badges..."); 
}};

// Try to load real command modules if available
try {
  startCommand = require("./commands/start");
  dailyCommands = require("./commands/daily");
  paymentCommands = require("./commands/payment");
  vipCommands = require("./commands/vip");
  adminCommands = require("./commands/admin");
  quotesCommands = require("./commands/quotes");
  badgesCommands = require("./commands/badges");
  console.log("✅ Command modules loaded");
} catch (error) {
  console.log("⚠️ Using fallback command modules");
}

// === IMPORT SERVICE MODULES - WITH FALLBACK ===
let AccessControl = class {
  async checkAccess(userId) { return { hasAccess: true, tier: 'free' }; }
  async getTierSpecificHelp(userId) { return "Help content..."; }
};
let ConversionOptimizer = class {
  async trackPricingView(userId) { return true; }
};

// Try to load real services if available
try {
  AccessControl = require("./services/access-control");
  ConversionOptimizer = require("./services/conversion-optimizer");
  console.log("✅ Service modules loaded");
} catch (error) {
  console.log("⚠️ Using fallback service modules");
}

// === ADVANCED LONG MESSAGE UTILITY FUNCTIONS ===
const MAX_MESSAGE_LENGTH = 4096;

/**
 * Split a long message into smaller chunks that fit Telegram's character limit
 * Preserves Khmer text formatting and line breaks
 */
function splitMessage(message, maxLength = 3500) { // Use 3500 to be safe with Khmer characters
  if (message.length <= maxLength) {
    return [message];
  }

  const chunks = [];
  let currentChunk = '';
  
  // Split by lines first to preserve formatting
  const lines = message.split('\n');
  
  for (const line of lines) {
    // If a single line is too long, split it by words
    if (line.length > maxLength) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      
      const words = line.split(' ');
      for (const word of words) {
        if ((currentChunk + ' ' + word).length > maxLength) {
          if (currentChunk) {
            chunks.push(currentChunk.trim());
            currentChunk = word;
          } else {
            // Single word is too long, force split
            chunks.push(word.substring(0, maxLength));
            currentChunk = word.substring(maxLength);
          }
        } else {
          currentChunk += (currentChunk ? ' ' : '') + word;
        }
      }
    } else {
      // Check if adding this line would exceed limit
      if ((currentChunk + '\n' + line).length > maxLength) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = line;
        } else {
          chunks.push(line);
        }
      } else {
        currentChunk += (currentChunk ? '\n' : '') + line;
      }
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

/**
 * Send a potentially long message as multiple chunks with proper Khmer support
 */
async function sendLongMessage(bot, chatId, text, options = {}, delay = 800) {
  try {
    const chunks = splitMessage(text, 3500); // Optimized for Khmer
    
    console.log(`📝 Sending long message in ${chunks.length} chunks to chat ${chatId}`);
    
    for (let i = 0; i < chunks.length; i++) {
      try {
        await bot.sendMessage(chatId, chunks[i], options);
        console.log(`✅ Sent chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)`);
        
        // Add delay between chunks to avoid rate limiting
        if (i < chunks.length - 1 && delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error) {
        console.error(`❌ Error sending chunk ${i + 1}/${chunks.length}:`, error);
        throw error;
      }
    }
    
    console.log(`🎉 Successfully sent all ${chunks.length} chunks`);
  } catch (error) {
    console.error("❌ Error in sendLongMessage:", error);
    try {
      await bot.sendMessage(chatId, "❌ មានបញ្ហាក្នុងការផ្ញើសារ។ សូមទាក់ទង @Chendasum");
    } catch (fallbackError) {
      console.error("❌ Failed to send error message:", fallbackError);
    }
  }
}

// === DUPLICATE PREVENTION (OPTIMIZED FOR WEBHOOK) ===
const processedMessages = new Set();
let lastProcessTime = {};

function isDuplicateMessage(msg) {
  const messageId = `${msg.chat.id}-${msg.message_id}`;
  const now = Date.now();

  // Only block if same message processed within last 3 seconds
  if (processedMessages.has(messageId) && 
      lastProcessTime[messageId] && 
      now - lastProcessTime[messageId] < 3000) {
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


let bot = null;
const accessControl = new AccessControl();
const conversionOptimizer = new ConversionOptimizer();

if (process.env.BOT_TOKEN) {
  try {
    bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });
    console.log("✅ Bot initialized");

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

    // === COMMAND HANDLERS ===

    // /start COMMAND
    bot.onText(/\/start/i, async (msg) => {
      console.log("🚀 [START] User:", msg.from.id);
      if (isDuplicateMessage(msg)) return;
      
      try {
        await startCommand.handle(msg, bot);
        console.log("✅ [START] Processed successfully");
      } catch (error) {
        console.error("❌ [START] Error:", error.message);
        const welcomeMessage = `🌟 សូមស្វាគមន៍មកកាន់ 7-Day Money Flow Reset™!

💰 កម្មវិធីគ្រប់គ្រងលុយ ៧ ថ្ងៃ ជាភាសាខ្មែរ

🎯 តម្លៃពិសេស: $24 USD (បញ្ចុះពី $47)
📱 ប្រើប្រាស់: /pricing ដើម្បីមើលលម្អិត
💳 ទូទាត់: /payment ដើម្បីចាប់ផ្តើម

👨‍💼 ទាក់ទង: @Chendasum សម្រាប់ជំនួយ

/help - ជំនួយពេញលេញ`;
        await bot.sendMessage(msg.chat.id, welcomeMessage);
      }
    });

    // /help COMMAND
    bot.onText(/\/help/i, async (msg) => {
      console.log("🔧 [HELP] User:", msg.from.id);
      if (isDuplicateMessage(msg)) return;
      
      try {
        const helpContent = await accessControl.getTierSpecificHelp(msg.from.id);
        await sendLongMessage(bot, msg.chat.id, helpContent, { parse_mode: "Markdown" });
        console.log("✅ [HELP] Processed successfully");
      } catch (error) {
        console.error("❌ [HELP] Error:", error.message);
        const helpMessage = `📋 ជំនួយ 7-Day Money Flow Reset™

🎯 ពាក្យបញ្ជាមូលដ្ឋាន:
• /start - ចាប់ផ្តើម
• /pricing - មើលតម្លៃ ($24)
• /payment - ការទូទាត់
• /help - ជំនួយនេះ

📚 កម្មវិធី ៧ ថ្ងៃ:
• /day1 - ស្គាល់ Money Flow
• /day2 - ស្វែងរក Money Leaks
• /day3 - វាយតម្លៃប្រព័ន្ធ
• /day4 - បង្កើតផែនទីលុយ
• /day5 - Survival vs Growth
• /day6 - រៀបចំផែនការ
• /day7 - Integration

🎯 Assessment ឥតគិតថ្លៃ:
• /financial_quiz - ពិនិត្យសុខភាពហិរញ្ញវត្ថុ
• /calculate_daily - គណនាចំណាយប្រចាំថ្ងៃ

👨‍💼 ទាក់ទង: @Chendasum ២៤/៧
🌐 Website: 7daymoneyflow.com`;
        await bot.sendMessage(msg.chat.id, helpMessage);
      }
    });

    // /pricing COMMAND
    bot.onText(/\/pricing/i, async (msg) => {
      console.log("💰 [PRICING] User:", msg.from.id);
      if (isDuplicateMessage(msg)) return;
      
      try {
        await paymentCommands.pricing(msg, bot);
        console.log("✅ [PRICING] Processed successfully");
      } catch (error) {
        console.error("❌ [PRICING] Error:", error.message);
        const pricingMessage = `💰 7-Day Money Flow Reset™ - តម្លៃពិសេស!

🎯 កម្មវិធីសាមញ្ញ (ESSENTIAL)
💵 តម្លៃ: $24 USD (បញ្ចុះពី $47)
🎁 សន្សំបាន: $23 (50% បញ្ចុះ!)

📚 អ្វីដែលអ្នកទទួលបាន:
✅ មេរៀន ៧ ថ្ងៃពេញលេញ
✅ ការគ្រប់គ្រងលុយជាភាសាខ្មែរ
✅ ស្វែងរក Money Leaks
✅ បង្កើតផែនការហិរញ្ញវត្ថុ
✅ ជំនួយពី @Chendasum

💳 ការទូទាត់:
• ABA Bank: 000 194 742
• ACLEDA Bank: 092 798 169
• Wing: 102 534 677

🚨 តម្លៃពិសេសនេះមិនមានយូរឡើយ!

👉 /payment - ការណែនាំទូទាត់លម្អិត
👨‍💼 ទាក់ទង: @Chendasum សម្រាប់ជំនួយ`;
        await bot.sendMessage(msg.chat.id, pricingMessage);
      }
    });

    // /payment COMMAND
    bot.onText(/\/payment/i, async (msg) => {
      console.log("💳 [PAYMENT] User:", msg.from.id);
      if (isDuplicateMessage(msg)) return;
      
      try {
        await paymentCommands.instructions(msg, bot);
        console.log("✅ [PAYMENT] Processed successfully");
      } catch (error) {
        console.error("❌ [PAYMENT] Error:", error.message);
        const paymentMessage = `💳 ការណែនាំទូទាត់

🏦 ធនាគារដែលអាចប្រើបាន:
• ABA Bank: 000 194 742
• ACLEDA Bank: 092 798 169
• Wing: 102 534 677
• ឈ្មោះ: SUM CHENDA

💰 ចំនួនទូទាត់: $24 USD
📝 ចំណាំ: BOT${msg.from.id}

📸 បន្ទាប់ពីទូទាត់:
1. ថតរូបអេក្រង់បញ្ជាក់ការទូទាត់
2. ផ្ញើមក @Chendasum
3. រង់ចាំការបញ្ជាក់ (១-២ ម៉ោង)

👨‍💼 ជំនួយ: @Chendasum`;
        await bot.sendMessage(msg.chat.id, paymentMessage);
      }
    });

    // DAY COMMANDS (1-7)
    for (let day = 1; day <= 7; day++) {
      bot.onText(new RegExp(`/day${day}`, 'i'), async (msg) => {
        console.log(`📚 [DAY${day}] User:`, msg.from.id);
        if (isDuplicateMessage(msg)) return;
        
        try {
          // Check if user has paid
          const user = await User.findOne({ 
            $or: [
              { telegramId: msg.from.id },
              { telegram_id: msg.from.id }
            ]
          });
          
          const isPaid = user && (user.isPaid || user.is_paid === true || user.is_paid === 't');
          
          if (!isPaid) {
            const paymentRequiredMessage = `🔒 ថ្ងៃទី ${day} ត្រូវការការទូទាត់

💰 សូមទូទាត់ $24 USD ដើម្បីចូលរួមកម្មវិធី ៧ ថ្ងៃពេញលេញ

📱 ពិនិត្យតម្លៃ: /pricing
💳 ការទូទាត់: /payment

🎁 បន្ទាប់ពីទូទាត់ អ្នកនឹងទទួលបាន:
✅ មេរៀនទាំង ៧ ថ្ងៃ
✅ ការគាំទ្រពី @Chendasum
✅ ការតាមដានវឌ្ឍនភាព

👨‍💼 ជំនួយ: @Chendasum`;
            await bot.sendMessage(msg.chat.id, paymentRequiredMessage);
            return;
          }

          // Try to call full daily handler or use built-in content
          try {
            const match = [null, day.toString()];
            await dailyCommands.handle(msg, match, bot);
            console.log(`✅ [DAY${day}] Full content delivered via handler`);
          } catch (handlerError) {
            console.error(`Handler error for day ${day}:`, handlerError);
            console.log(`🔄 [DAY${day}] Using built-in content fallback`);
            
            // Built-in daily content with sendLongMessage support
            const dayContent = getDailyContent(day);
            await sendLongMessage(bot, msg.chat.id, dayContent, { parse_mode: "Markdown" });
            console.log(`✅ [DAY${day}] Built-in content delivered successfully`);
          }
        } catch (error) {
          console.error(`❌ [DAY${day}] Error:`, error.message);
          await bot.sendMessage(msg.chat.id, `🔒 សូមទូទាត់មុនដើម្បីចូលប្រើថ្ងៃទី ${day}។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។`);
        }
      });
    }

    // /vip COMMAND
    bot.onText(/\/vip/i, async (msg) => {
      console.log("👑 [VIP] User:", msg.from.id);
      if (isDuplicateMessage(msg)) return;
      
      try {
        const user = await User.findOne({ 
          $or: [
            { telegramId: msg.from.id },
            { telegram_id: msg.from.id }
          ]
        });
        
        const isPaid = user && (user.isPaid || user.is_paid === true || user.is_paid === 't');
        
        if (!isPaid) {
          const vipRequiresPaymentMessage = `🔒 VIP Program ត្រូវការការទូទាត់មូលដ្ឋានមុន

💰 ជំហានទី ១: ទូទាត់កម្មវិធីមូលដ្ឋាន $24
📱 ប្រើ /pricing ដើម្បីមើលព័ត៌មាន

👑 ជំហានទី ២: Upgrade ទៅ VIP ($197)

👨‍💼 ទាក់ទង: @Chendasum សម្រាប់ព័ត៌មានលម្អិត`;
          await bot.sendMessage(msg.chat.id, vipRequiresPaymentMessage);
          return;
        }

        try {
          await vipCommands.info(msg, bot);
          console.log("✅ [VIP] Full VIP info sent");
        } catch (handlerError) {
          console.error("VIP handler error:", handlerError);
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
        await bot.sendMessage(msg.chat.id, "🔒 សូមទូទាត់កម្មវិធីមូលដ្ឋានមុនដើម្បីចូលប្រើ VIP។ ប្រើ /pricing");
      }
    });

    // ADMIN COMMANDS
    bot.onText(/\/admin_users/i, async (msg) => {
      if (isDuplicateMessage(msg)) return;
      try {
        await adminCommands.showUsers(msg, bot);
      } catch (e) {
        console.error("Error /admin_users:", e);
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

    // QUOTE COMMANDS
    bot.onText(/\/quote$/i, async (msg) => {
      if (isDuplicateMessage(msg)) return;
      try {
        await quotesCommands.random(msg, bot);
      } catch (e) {
        console.error("Error /quote:", e);
        await bot.sendMessage(msg.chat.id, "📝 Quote coming soon...");
      }
    });

    // BADGE COMMANDS
    bot.onText(/\/badges/i, async (msg) => {
      if (isDuplicateMessage(msg)) return;
      try {
        await badgesCommands.show(msg, bot);
      } catch (e) {
        console.error("Error /badges:", e);
        await bot.sendMessage(msg.chat.id, "🏆 Badges coming soon...");
      }
    });

    // /test COMMAND
    bot.onText(/\/test/i, async (msg) => {
      try {
        await bot.sendMessage(msg.chat.id, "✅ Bot is working! All systems operational.");
        console.log("Test command sent to:", msg.from.id);
      } catch (error) {
        console.error("Test command error:", error.message);
      }
    });

    // VIP APPLY HANDLER
    bot.on("message", async (msg) => {
      if (!msg.text || msg.text.startsWith("/")) return;
      
      if (msg.text.toUpperCase() === "VIP APPLY") {
        try {
          const user = await User.findOne({ 
            $or: [
              { telegramId: msg.from.id },
              { telegram_id: msg.from.id }
            ]
          });

          const isPaid = user && (user.isPaid || user.is_paid === true || user.is_paid === 't');

          if (!isPaid) {
            await bot.sendMessage(msg.chat.id, "🔒 សូមទូទាត់មុនដើម្បីចូលរួមកម្មវិធី VIP។ ប្រើ /pricing");
            return;
          }
          
          await bot.sendMessage(msg.chat.id, `🌟 VIP APPLICATION

សូមផ្ញើព័ត៌មាន:
1️⃣ ឈ្មោះពេញ
2️⃣ អាជីវកម្ម
3️⃣ គោលដៅហិរញ្ញវត្ថុ
4️⃣ លេខទូរស័ព្ទ

💰 តម្លៃ VIP: $197
📞 Admin នឹងទាក់ទងអ្នក`);
        } catch (error) {
          console.error("Error handling VIP APPLY:", error);
          await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
        }
      }
    });

    console.log("✅ All bot commands registered");

  } catch (error) {
    console.error("❌ Bot initialization failed:", error.message);
  }
} else {
  console.error("❌ No BOT_TOKEN found");
}

// === BASIC HEALTH ROUTES ===
app.get("/", (req, res) => {
  console.log("Root endpoint hit");
  res.json({
    name: "7-Day Money Flow Reset™ Telegram Bot",
    status: "Running",
    time: new Date().toISOString(),
    url: "7daysmoney-production.up.railway.app",
    features: [
      "7-Day Program Content",
      "Payment Processing", 
      "VIP Programs",
      "Progress Tracking",
      "Khmer Language Support"
    ]
  });
});

app.get("/health", (req, res) => {
  console.log("Health check");
  res.json({ 
    status: "OK", 
    time: new Date().toISOString(),
    bot_initialized: !!bot,
    environment: {
      NODE_ENV: process.env.NODE_ENV || "production",
      BOT_TOKEN: process.env.BOT_TOKEN ? "configured" : "missing",
      DATABASE_URL: process.env.DATABASE_URL ? "configured" : "missing"
    }
  });
});

// === WEBHOOK SETUP FOR RAILWAY ===
async function setupWebhook() {
  if (!bot || !process.env.BOT_TOKEN) {
    console.error("Cannot setup webhook - bot not initialized");
    return;
  }

  try {
    const webhookUrl = `https://7daysmoney-production.up.railway.app/bot${process.env.BOT_TOKEN}`;
    
    console.log("Setting webhook to:", webhookUrl);
    const result = await bot.setWebHook(webhookUrl);
    console.log("Webhook set result:", result);
  } catch (error) {
    console.error("Webhook setup error:", error);
  }
}

// === START SERVER ===
const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0";

const server = app.listen(PORT, HOST, async () => {
  console.log(`🚀 Railway server running on ${HOST}:${PORT}`);
  console.log(`🌐 URL: https://7daysmoney-production.up.railway.app`);
  console.log(`🎯 Features: Full 7-Day Program with Fallbacks`);
  
  // Setup webhook after server starts
  await setupWebhook();
});

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
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});
