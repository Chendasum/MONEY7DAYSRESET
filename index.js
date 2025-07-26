require("dotenv").config();

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const cron = require("node-cron");

console.log("🚀 Starting 7-Day Money Flow Bot...");
console.log("BOT_TOKEN exists:", !!process.env.BOT_TOKEN);
console.log("PORT:", process.env.PORT || 5000);

// Initialize Express app first
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set UTF-8 headers
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});

// Database Models - with complete fallback
let User = {
  findOne: async () => null,
  findOneAndUpdate: async (filter, update, options) => null
};

let Progress = {
  findOne: async () => null,
  findOneAndUpdate: async (filter, update, options) => null
};

// Try to load real models
try {
  const UserModel = require("./models/User");
  const ProgressModel = require("./models/Progress");
  User = UserModel;
  Progress = ProgressModel;
  console.log("✅ Database models loaded");
} catch (error) {
  console.log("⚠️ Using fallback database models");
}

// Helper function for sending long messages
async function sendLongMessage(bot, chatId, text, options = {}, chunkSize = 4000) {
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
}

// Initialize bot
let bot = null;
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

    // === /start COMMAND ===
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
        console.log("✅ [START] Welcome sent");
      } catch (error) {
        console.error("❌ [START] Error:", error.message);
      }
    });

    // === /help COMMAND ===
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
        console.log("✅ [HELP] Help sent");
      } catch (error) {
        console.error("❌ [HELP] Error:", error.message);
      }
    });

    // === /pricing COMMAND ===
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
• ABA Bank: 000 194 742
• ACLEDA Bank: 092 798 169
• Wing: 102 534 677

🚨 តម្លៃពិសេសនេះមិនមានយូរឡើយ!

👉 /payment - ការណែនាំទូទាត់លម្អិត
👨‍💼 ទាក់ទង: @Chendasum សម្រាប់ជំនួយ`;

        await bot.sendMessage(msg.chat.id, pricingMessage);
        console.log("✅ [PRICING] Pricing sent");
      } catch (error) {
        console.error("❌ [PRICING] Error:", error.message);
      }
    });

    // === /payment COMMAND ===
    bot.onText(/\/payment/i, async (msg) => {
      console.log("💳 [PAYMENT] User:", msg.from.id);
      
      try {
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
        console.log("✅ [PAYMENT] Payment instructions sent");
      } catch (error) {
        console.error("❌ [PAYMENT] Error:", error.message);
      }
    });

    // === DAY COMMANDS ===
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

          // User has paid - show content based on day
          let dayContent = '';
          
          // Check if admin has set custom content
          if (global[`day${day}Content`]) {
            dayContent = global[`day${day}Content`];
          } else {
            // Default content for each day
            if (day === 1) {
              dayContent = `📚 Day 1: ស្គាល់ Money Flow របស់អ្នក

🎯 សូមស្វាគមន៍មកកាន់ថ្ងៃទី១!

📝 មេរៀនថ្ងៃនេះ:
• តើ Money Flow គឺជាអ្វី?
• ហេតុអ្វីវាសំខាន់សម្រាប់អ្នក
• របៀបចាប់ផ្តើមតាមដាន

💡 សំខាន់: សូមអានឱ្យបានល្អិតល្អន់ និងអនុវត្តភ្លាមៗ

[Add your full Day 1 content here...]

✅ បន្ទាប់ពីបញ្ចប់ សូមសរសេរ "DAY 1 COMPLETE"`;
            } else if (day === 2) {
              dayContent = `📚 Day 2: ស្វែងរក Money Leaks

🎯 ថ្ងៃទី២ - រកមើលកន្លែងដែលលុយលេចធ្លាយ

[Add your full Day 2 content here...]

✅ បន្ទាប់ពីបញ្ចប់ សូមសរសេរ "DAY 2 COMPLETE"`;
            } else {
              dayContent = `📚 ថ្ងៃទី ${day} - កម្មវិធីពេញលេញ

🎯 សូមស្វាគមន៍! អ្នកបានទូទាត់រួចហើយ

មាតិកាថ្ងៃទី ${day} នឹងត្រូវបានផ្ញើមកអ្នកឆាប់ៗនេះ។

📞 ទាក់ទង @Chendasum សម្រាប់មាតិកាពេញលេញ។`;
            }
          }
          
          // Use sendLongMessage for content that might be long
          await sendLongMessage(bot, msg.chat.id, dayContent);
          console.log(`✅ [DAY${day}] Content sent to paid user`);
        } catch (error) {
          console.error(`❌ [DAY${day}] Error:`, error.message);
          await bot.sendMessage(msg.chat.id, `🔒 សូមទូទាត់មុនដើម្បីចូលប្រើថ្ងៃទី ${day}។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។`);
        }
      });
    }

    // === /vip COMMAND ===
    bot.onText(/\/vip/i, async (msg) => {
      console.log("👑 [VIP] User:", msg.from.id);
      
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
        console.log("✅ [VIP] VIP info sent to paid user");
      } catch (error) {
        console.error("❌ [VIP] Error:", error.message);
        await bot.sendMessage(msg.chat.id, "🔒 សូមទូទាត់កម្មវិធីមូលដ្ឋានមុនដើម្បីចូលប្រើ VIP។ ប្រើ /pricing");
      }
    });

    // === /test COMMAND ===
    bot.onText(/\/test/i, async (msg) => {
      try {
        await bot.sendMessage(msg.chat.id, "✅ Bot is working! All systems operational.");
        console.log("Test command sent to:", msg.from.id);
      } catch (error) {
        console.error("Test command error:", error.message);
      }
    });

    // === VIP APPLY HANDLER ===
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

// === BASIC ROUTES ===
app.get("/", (req, res) => {
  console.log("Root endpoint hit");
  res.json({
    name: "7-Day Money Flow Reset™ Telegram Bot",
    status: "Running",
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
    bot_initialized: !!bot
  });
});

// === WEBHOOK SETUP FOR RAILWAY ===
async function setupWebhook() {
  if (!bot || !process.env.BOT_TOKEN) {
    console.error("Cannot setup webhook - bot not initialized");
    return;
  }

  try {
    const webhookUrl = process.env.RAILWAY_PUBLIC_DOMAIN 
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}/bot${process.env.BOT_TOKEN}`
      : `https://money7daysreset-production.up.railway.app/bot${process.env.BOT_TOKEN}`;
    
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
  console.log(`🚀 Server running on ${HOST}:${PORT}`);
  console.log(`🌐 URL: https://money7daysreset-production.up.railway.app`);
  console.log(`🎯 Features: 7-Day Program, Payments, VIP`);
  
  // Setup webhook after server starts
  await setupWebhook();
});

// === GRACEFUL SHUTDOWN ===
process.on("SIGTERM", () => {
  console.log("SIGTERM received");
  server.close(() => process.exit(0));
});

process.on("SIGINT", () => {
  console.log("SIGINT received");  
  server.close(() => process.exit(0));
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});
