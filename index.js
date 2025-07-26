require("dotenv").config();

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const cron = require("node-cron");

console.log("🚀 Starting 7-Day Money Flow Bot with Full Features...");
console.log("BOT_TOKEN exists:", !!process.env.BOT_TOKEN);
console.log("PORT:", process.env.PORT || 5000);

// Try to import your command modules (with error handling)
let dailyCommands, paymentCommands, vipCommands, adminCommands;
let badgesCommands, quotesCommands, bookingCommands, tierFeatures;
let User, Progress;

try {
  // Import Database Models
  User = require("./models/User");
  Progress = require("./models/Progress");
  console.log("✅ Database models loaded");
} catch (error) {
  console.log("⚠️ Database models not found, using fallback");
  // Create fallback User/Progress objects
  User = {
    findOne: async () => null,
    findOneAndUpdate: async () => null
  };
  Progress = {
    findOne: async () => null,
    findOneAndUpdate: async () => null
  };
}

try {
  // Import Command Modules
  dailyCommands = require("./commands/daily");
  paymentCommands = require("./commands/payment");
  vipCommands = require("./commands/vip");
  adminCommands = require("./commands/admin");
  badgesCommands = require("./commands/badges");
  quotesCommands = require("./commands/quotes");
  bookingCommands = require("./commands/booking");
  tierFeatures = require("./commands/tier-features");
  console.log("✅ Command modules loaded");
} catch (error) {
  console.log("⚠️ Some command modules not found:", error.message);
}

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set UTF-8 headers
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});

// Basic routes
app.get("/", (req, res) => {
  console.log("Root endpoint hit");
  res.json({
    name: "7-Day Money Flow Reset™ Telegram Bot",
    status: "Running with Full Features",
    time: new Date().toISOString(),
    url: "money7daysreset-production.up.railway.app",
    features: [
      "7-Day Program Content",
      "Payment Processing", 
      "VIP Programs",
      "Progress Tracking",
      "Khmer Language Support"
    ]
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
    commands_loaded: !!dailyCommands
  });
});

// Initialize bot
let bot = null;
if (process.env.BOT_TOKEN) {
  try {
    bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });
    console.log("✅ Bot initialized");
    
    // Webhook handler
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

    // === BASIC COMMANDS ===
    bot.onText(/\/start/i, async (msg) => {
      console.log("🚀 [START] User:", msg.from.id);
      
      try {
        const welcomeMessage = `🌟 សូមស្វាគមន៍មកកាន់ 7-Day Money Flow Reset™!

💰 កម្មវិធីគ្រប់គ្រងលុយ ៧ ថ្ងៃ ជាភាសាខ្មែរ

🎯 តម្លៃពិសេស: $24 USD (បញ្ចុះពី $47)
📱 ប្រើប្រាស់: /pricing ដើម្បីមើលលម្អិត
💳 ទូទាត់: /payment ដើម្បីចាប់ផ្តើម

👨‍💼 ទាក់ទង: @Chendasum សម្រាប់ជំនួយ

/help - ជំនួយពេញលេញ`;

        await bot.sendMessage(msg.chat.id, welcomeMessage);
        console.log("✅ [START] Welcome message sent");
      } catch (error) {
        console.error("❌ [START] Error:", error.message);
      }
    });

    bot.onText(/\/help/i, async (msg) => {
      console.log("🔧 [HELP] User:", msg.from.id);
      
      try {
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
        console.log("✅ [HELP] Help message sent");
      } catch (error) {
        console.error("❌ [HELP] Error:", error.message);
      }
    });

    bot.onText(/\/pricing/i, async (msg) => {
      console.log("💰 [PRICING] User:", msg.from.id);
      
      try {
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
• ABA Bank
• ACLEDA Bank  
• Wing Payment

🚨 តម្លៃពិសេសនេះមិនមានយូរឡើយ!

👉 /payment - ការណែនាំទូទាត់លម្អិត
👨‍💼 ទាក់ទង: @Chendasum ម្រាប់ជំនួយ`;

        await bot.sendMessage(msg.chat.id, pricingMessage);
        console.log("✅ [PRICING] Pricing message sent");
      } catch (error) {
        console.error("❌ [PRICING] Error:", error.message);
      }
    });

    // === PAYMENT COMMAND ===
    bot.onText(/\/payment/i, async (msg) => {
      console.log("💳 [PAYMENT] User:", msg.from.id);
      
      try {
        if (paymentCommands && paymentCommands.instructions) {
          await paymentCommands.instructions(msg, bot);
        } else {
          const paymentMessage = `💳 ការណែនាំទូទាត់

🏦 ធនាគារដែលអាចប្រើបាន:
• ABA Bank: 001 234 567
• ACLEDA Bank: 002 345 678
• Wing Payment: 012 345 678

💰 ចំនួនទូទាត់: $24 USD
📝 ចំណាំ: 7-Day Money Flow Reset

📸 បន្ទាប់ពីទូទាត់:
1. ថតរូបអេក្រង់បញ្ជាក់ការទូទាត់
2. ផ្ញើមក @Chendasum
3. រង់ចាំការបញ្ជាក់ (១-២ ម៉ោង)

👨‍💼 ជំនួយ: @Chendasum`;
          
          await bot.sendMessage(msg.chat.id, paymentMessage);
        }
        console.log("✅ [PAYMENT] Payment instructions sent");
      } catch (error) {
        console.error("❌ [PAYMENT] Error:", error.message);
      }
    });

    // === DAY COMMANDS (PAYMENT PROTECTED) ===
    for (let day = 1; day <= 7; day++) {
      bot.onText(new RegExp(`/day${day}`, 'i'), async (msg) => {
        console.log(`📚 [DAY${day}] User:`, msg.from.id);
        
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

          // User has paid - show content
          if (dailyCommands && dailyCommands.handle) {
            await dailyCommands.handle(msg, [`/day${day}`, day.toString()], bot);
          } else {
            const dayMessage = `📚 ថ្ងៃទី ${day} - កម្មវិធីពេញលេញ

🎯 សូមស្វាគមន៍! អ្នកបានទូទាត់រួចហើយ

មាតិកាថ្ងៃទី ${day} កំពុងត្រូវបានអភិវឌ្ឍ។

📞 ទាក់ទង @Chendasum ដើម្បីចូលប្រើមាតិកាពេញលេញ។`;
            
            await bot.sendMessage(msg.chat.id, dayMessage);
          }
          console.log(`✅ [DAY${day}] Content sent to paid user`);
        } catch (error) {
          console.error(`❌ [DAY${day}] Error:`, error.message);
          // Fallback - require payment
          await bot.sendMessage(msg.chat.id, `🔒 សូមទូទាត់មុនដើម្បីចូលប្រើថ្ងៃទី ${day}។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។`);
        }
      });
    }

    // === VIP COMMANDS (PAYMENT PROTECTED) ===
    bot.onText(/\/vip/i, async (msg) => {
      console.log("👑 [VIP] User:", msg.from.id);
      
      try {
        // Check if user has paid for basic program first
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

        // User has paid basic - show VIP info
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
        console.log("✅ [VIP] VIP info sent to paid user");
      } catch (error) {
        console.error("❌ [VIP] Error:", error.message);
        // Fallback - require basic payment
        await bot.sendMessage(msg.chat.id, "🔒 សូមទូទាត់កម្មវិធីមូលដ្ឋានមុនដើម្បីចូលប្រើ VIP។ ប្រើ /pricing");
      }
    });

    // === TEST COMMAND ===
    bot.onText(/\/test/i, async (msg) => {
      try {
        await bot.sendMessage(msg.chat.id, "✅ Enhanced bot is working! All systems operational.");
        console.log("Test command sent to:", msg.from.id);
      } catch (error) {
        console.error("Test command error:", error.message);
      }
    });

    console.log("✅ All bot commands registered");

  } catch (error) {
    console.error("❌ Bot initialization failed:", error.message);
  }
} else {
  console.error("❌ No BOT_TOKEN found");
}

// Start server
const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0";

const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Enhanced Server running on ${HOST}:${PORT}`);
  console.log(`🌐 URL: https://money7daysreset-production.up.railway.app`);
  console.log(`🎯 Features: 7-Day Program, Payments, VIP, Progress Tracking`);
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

// Error handling
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});
