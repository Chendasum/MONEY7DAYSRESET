require("dotenv").config();

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const cron = require("node-cron");

console.log("🚀 Starting 7-Day Money Flow Bot with Full Features...");
console.log("BOT_TOKEN exists:", !!process.env.BOT_TOKEN);
console.log("PORT:", process.env.PORT || 5000);

// Database Models - with fallback
let User, Progress;

try {
  User = require("./models/User");
  Progress = require("./models/Progress");
  console.log("✅ Database models loaded");
} catch (error) {
  console.log("⚠️ Database models not found, using fallback");
  // Fallback models
  User = {
    findOne: async () => null,
    findOneAndUpdate: async () => null
  };
  Progress = {
    findOne: async () => null,
    findOneAndUpdate: async () => null
  };
}

// Command Modules - with error handling
let dailyCommands, paymentCommands, vipCommands, adminCommands;
let badgesCommands, quotesCommands, bookingCommands, tierFeatures;
let marketingCommands, marketingContent, extendedContent, thirtyDayAdmin;
let previewCommands, freeTools, financialQuiz, toolsTemplates;
let progressTracker, startCommand;

// Service Modules
let scheduler, analytics, celebrations, progressBadges;
let emojiReactions, AccessControl, ContentScheduler, ConversionOptimizer;

// Try to load all modules
try {
  // Commands
  startCommand = require("./commands/start");
  dailyCommands = require("./commands/daily");
  paymentCommands = require("./commands/payment");
  vipCommands = require("./commands/vip");
  adminCommands = require("./commands/admin");
  badgesCommands = require("./commands/badges");
  quotesCommands = require("./commands/quotes");
  bookingCommands = require("./commands/booking");
  tierFeatures = require("./commands/tier-features");
  marketingCommands = require("./commands/marketing");
  marketingContent = require("./commands/marketing-content");
  extendedContent = require("./commands/extended-content");
  thirtyDayAdmin = require("./commands/30day-admin");
  previewCommands = require("./commands/preview");
  freeTools = require("./commands/free-tools");
  financialQuiz = require("./commands/financial-quiz");
  toolsTemplates = require("./commands/tools-templates");
  progressTracker = require("./commands/progress-tracker");
  
  // Services
  scheduler = require("./services/scheduler");
  analytics = require("./services/analytics");
  celebrations = require("./services/celebrations");
  progressBadges = require("./services/progress-badges");
  emojiReactions = require("./services/emoji-reactions");
  AccessControl = require("./services/access-control");
  ContentScheduler = require("./services/content-scheduler");
  ConversionOptimizer = require("./services/conversion-optimizer");
  
  console.log("✅ Command and service modules loaded");
} catch (error) {
  console.log("⚠️ Some modules not found:", error.message);
}

// Utility functions
const { sendLongMessage } = require("./utils/message-splitter") || { 
  sendLongMessage: async (bot, chatId, text, options) => {
    await bot.sendMessage(chatId, text, options);
  }
};

const MESSAGE_CHUNK_SIZE = 800;

// Express app setup
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// UTF-8 headers
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});

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

    // === BASIC COMMANDS ===
    
    // /start command
    bot.onText(/\/start/i, async (msg) => {
      console.log("🚀 [START] User:", msg.from.id);
      
      try {
        if (startCommand && startCommand.handle) {
          await startCommand.handle(msg, bot);
        } else {
          // Fallback welcome message
          const welcomeMessage = `🌟 សូមស្វាគមន៍មកកាន់ 7-Day Money Flow Reset™!

💰 កម្មវិធីគ្រប់គ្រងលុយ ៧ ថ្ងៃ ជាភាសាខ្មែរ

🎯 តម្លៃពិសេស: $24 USD (បញ្ចុះពី $47)
📱 ប្រើប្រាស់: /pricing ដើម្បីមើលលម្អិត
💳 ទូទាត់: /payment ដើម្បីចាប់ផ្តើម

👨‍💼 ទាក់ទង: @Chendasum សម្រាប់ជំនួយ

/help - ជំនួយពេញលេញ`;

          await bot.sendMessage(msg.chat.id, welcomeMessage);
        }
        console.log("✅ [START] Welcome sent");
      } catch (error) {
        console.error("❌ [START] Error:", error.message);
      }
    });

    // /help command
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

    // /pricing command
    bot.onText(/\/pricing/i, async (msg) => {
      console.log("💰 [PRICING] User:", msg.from.id);
      
      try {
        if (paymentCommands && paymentCommands.pricing) {
          await paymentCommands.pricing(msg, bot);
        } else {
          // Fallback pricing
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
        console.log("✅ [PRICING] Pricing sent");
      } catch (error) {
        console.error("❌ [PRICING] Error:", error.message);
      }
    });

    // /payment command
    bot.onText(/\/payment/i, async (msg) => {
      console.log("💳 [PAYMENT] User:", msg.from.id);
      
      try {
        if (paymentCommands && paymentCommands.instructions) {
          await paymentCommands.instructions(msg, bot);
        } else {
          // Fallback payment
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
          await bot.sendMessage(msg.chat.id, `🔒 សូមទូទាត់មុនដើម្បីចូលប្រើថ្ងៃទី ${day}។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។`);
        }
      });
    }

    // === VIP COMMAND ===
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
        await bot.sendMessage(msg.chat.id, "🔒 សូមទូទាត់កម្មវិធីមូលដ្ឋានមុនដើម្បីចូលប្រើ VIP។ ប្រើ /pricing");
      }
    });

    // === ADMIN COMMANDS ===
    bot.onText(/\/admin_users/i, async (msg) => {
      try {
        if (adminCommands && adminCommands.showUsers) {
          await adminCommands.showUsers(msg, bot);
        }
      } catch (e) {
        console.error("Error /admin_users:", e);
        await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
      }
    });

    bot.onText(/\/admin_progress (.+)/i, async (msg, match) => {
      try {
        if (adminCommands && adminCommands.checkProgress) {
          await adminCommands.checkProgress(msg, match, bot);
        }
      } catch (e) {
        console.error("Error /admin_progress:", e);
        await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
      }
    });

    bot.onText(/\/admin_analytics/i, async (msg) => {
      try {
        if (adminCommands && adminCommands.showAnalytics) {
          await adminCommands.showAnalytics(msg, bot);
        }
      } catch (e) {
        console.error("Error /admin_analytics:", e);
        await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
      }
    });

    bot.onText(/\/admin_confirm_payment (.+)/i, async (msg, match) => {
      try {
        if (adminCommands && adminCommands.confirmPayment) {
          await adminCommands.confirmPayment(msg, match, bot);
        }
      } catch (e) {
        console.error("Error /admin_confirm_payment:", e);
        await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
      }
    });

    // === EXTENDED CONTENT (Day 8-30) ===
    bot.onText(/\/extended(\d+)/i, async (msg, match) => {
      const day = parseInt(match[1]);
      if (isNaN(day) || day < 8 || day > 30) {
        await bot.sendMessage(msg.chat.id, "❌ មាតិកាបន្ថែមអាចរកបានសម្រាប់ថ្ងៃទី ៨-៣០ ប៉ុណ្ណោះ។");
        return;
      }
      
      try {
        const user = await User.findOne({ 
          $or: [
            { telegramId: msg.from.id },
            { telegram_id: msg.from.id }
          ]
        });
        
        const isPaid = user && (user.isPaid || user.is_paid === true || user.is_paid === 't');
        
        if (!isPaid) {
          await bot.sendMessage(msg.chat.id, "🔒 សូមទូទាត់មុនដើម្បីចូលប្រើមាតិកាបន្ថែម។ ប្រើ /pricing");
          return;
        }
        
        if (extendedContent && extendedContent.handleExtendedDay) {
          await extendedContent.handleExtendedDay(msg, bot, day);
        } else {
          await bot.sendMessage(msg.chat.id, `📚 ថ្ងៃទី ${day} - មាតិកាបន្ថែម\n\nមាតិកាកំពុងត្រូវបានអភិវឌ្ឍ។`);
        }
      } catch (error) {
        console.error("Error in /extended command:", error);
        await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
      }
    });

    // === FREE TOOLS ===
    bot.onText(/\/financial_quiz/i, async (msg) => {
      try {
        if (financialQuiz && financialQuiz.startQuiz) {
          await financialQuiz.startQuiz(msg, bot);
        } else {
          await bot.sendMessage(msg.chat.id, "📊 Financial Quiz ត្រូវបានអភិវឌ្ឍ។");
        }
      } catch (e) {
        console.error("Error /financial_quiz:", e);
        await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
      }
    });

    bot.onText(/\/calculate_daily/i, async (msg) => {
      try {
        if (freeTools && freeTools.calculateDaily) {
          await freeTools.calculateDaily(msg, bot);
        } else {
          await bot.sendMessage(msg.chat.id, "🧮 Calculator ត្រូវបានអភិវឌ្ឍ។");
        }
      } catch (e) {
        console.error("Error /calculate_daily:", e);
        await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
      }
    });

    // === PREVIEW COMMANDS ===
    bot.onText(/\/preview$/i, async (msg) => {
      try {
        if (previewCommands && previewCommands.preview) {
          await previewCommands.preview(msg, bot);
        } else {
          await bot.sendMessage(msg.chat.id, "👀 Preview មាតិកាត្រូវបានអភិវឌ្ឍ។");
        }
      } catch (e) {
        console.error("Error /preview:", e);
        await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
      }
    });

    // === BADGES (PAID ONLY) ===
    bot.onText(/\/badges/i, async (msg) => {
      try {
        const user = await User.findOne({ 
          $or: [
            { telegramId: msg.from.id },
            { telegram_id: msg.from.id }
          ]
        });
        
        const isPaid = user && (user.isPaid || user.is_paid === true || user.is_paid === 't');
        
        if (!isPaid) {
          await bot.sendMessage(msg.chat.id, "🔒 សូមទូទាត់មុនដើម្បីមើល badges។ ប្រើ /pricing");
          return;
        }
        
        if (badgesCommands && badgesCommands.showBadges) {
          await badgesCommands.showBadges(msg, bot);
        } else {
          await bot.sendMessage(msg.chat.id, "🏆 Badges ត្រូវបានអភិវឌ្ឍ។");
        }
      } catch (error) {
        console.error("Error in /badges command:", error);
        await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
      }
    });

    // === PROGRESS (PAID ONLY) ===
    bot.onText(/\/progress/i, async (msg) => {
      try {
        const user = await User.findOne({ 
          $or: [
            { telegramId: msg.from.id },
            { telegram_id: msg.from.id }
          ]
        });
        
        const isPaid = user && (user.isPaid || user.is_paid === true || user.is_paid === 't');
        
        if (!isPaid) {
          await bot.sendMessage(msg.chat.id, "🔒 សូមទូទាត់មុនដើម្បីមើលការរីកចម្រើន។ ប្រើ /pricing");
          return;
        }
        
        if (badgesCommands && badgesCommands.showProgress) {
          await badgesCommands.showProgress(msg, bot);
        } else {
          await bot.sendMessage(msg.chat.id, "📈 Progress ត្រូវបានអភិវឌ្ឍ។");
        }
      } catch (error) {
        console.error("Error in /progress command:", error);
        await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
      }
    });

    // === FAQ COMMAND ===
    bot.onText(/\/faq|FAQ|faq/i, async (msg) => {
      try {
        const user = await User.findOne({ 
          $or: [
            { telegramId: msg.from.id },
            { telegram_id: msg.from.id }
          ]
        });
        
        const isPaid = user && (user.isPaid || user.is_paid === true || user.is_paid === 't');
        
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
- /extended8 ដល់ /extended30

🏆 តាមដាន:
- /badges - សមិទ្ធផល
- /progress - ការរីកចម្រើន

👨‍💼 ទាក់ទង: @Chendasum`;
        }
        
        await bot.sendMessage(msg.chat.id, faqMessage);
      } catch (error) {
        console.error("Error in FAQ command:", error);
        await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
      }
    });

    // === STATUS COMMAND ===
    bot.onText(/\/status|ស្ថានភាព/i, async (msg) => {
      try {
        const user = await User.findOne({ 
          $or: [
            { telegramId: msg.from.id },
            { telegram_id: msg.from.id }
          ]
        });
        
        if (!user) {
          await bot.sendMessage(msg.chat.id, "អ្នកមិនទាន់ចុះឈ្មោះ។ ប្រើ /start ដើម្បីចាប់ផ្តើម។");
          return;
        }
        
        const isPaid = user.isPaid || user.is_paid === true || user.is_paid === 't';
        const progress = await Progress.findOne({ user_id: msg.from.id });
        
        let statusMessage = `📊 ស្ថានភាពគណនីរបស់អ្នក:

👤 អ្នកប្រើប្រាស់: ${user.first_name || user.firstName || "មិនស្គាល់"}
📅 ចូលរួម: ${user.joined_at ? new Date(user.joined_at).toDateString() : "មិនស្គាល់"}
💰 ស្ថានភាព: ${isPaid ? "✅ បានទូទាត់" : "❌ មិនទាន់ទូទាត់"}`;

        if (isPaid) {
          statusMessage += `
📈 ថ្ងៃបច្ចុប្បន្ន: Day ${progress?.currentDay || progress?.current_day || 0}
🎯 អ្នកអាចប្រើប្រាស់កម្មវិធីបានពេញលេញ!`;
        } else {
          statusMessage += `
🔒 សូមទូទាត់ដើម្បីចូលប្រើ Day 1-7
💡 ប្រើ /pricing ដើម្បីមើលតម្លៃ`;
        }
        
        await bot.sendMessage(msg.chat.id, statusMessage);
      } catch (error) {
        console.error("Error in status command:", error);
        await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហាក្នុងការទាញយកស្ថានភាព។");
      }
    });

    // === WHOAMI COMMAND ===
    bot.onText(/\/whoami/i, async (msg) => {
      try {
        const user = await User.findOne({ 
          $or: [
            { telegramId: msg.from.id },
            { telegram_id: msg.from.id }
          ]
        });
        
        const adminId = parseInt(process.env.ADMIN_CHAT_ID);
        const isAdmin = msg.from.id === adminId;
        const isPaid = user && (user.isPaid || user.is_paid === true || user.is_paid === 't');
        
        let response = `🔍 ព័ត៌មានរបស់អ្នក:\n\n`;
        response += `• Chat ID: ${msg.chat.id}\n`;
        response += `• User ID: ${msg.from.id}\n`;
        response += `• ឈ្មោះ: ${msg.from.first_name || "N/A"}\n`;
        response += `• Username: ${msg.from.username ? "@" + msg.from.username : "N/A"}\n`;
        response += `• Admin: ${isAdmin ? "✅" : "❌"}\n`;
        
        if (user) {
          response += `• ចុះឈ្មោះ: ✅\n`;
          response += `• ទូទាត់: ${isPaid ? "✅" : "❌"}\n`;
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
        await bot.sendMessage(msg.chat.id, "✅ Enhanced bot is working! All systems operational.");
        console.log("Test command sent to:", msg.from.id);
      } catch (error) {
        console.error("Test command error:", error.message);
      }
    });

    // === VIP APPLY HANDLER ===
    bot.on("message", async (msg) => {
      if (msg.text && msg.text.toUpperCase() === "VIP APPLY") {
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
  console.log(`🚀 Enhanced Server running on ${HOST}:${PORT}`);
  console.log(`🌐 URL: https://money7daysreset-production.up.railway.app`);
  console.log(`🎯 Features: 7-Day Program, Payments, VIP, Progress Tracking`);
  
  // Setup webhook after server starts
  await setupWebhook();
});

// === CRON JOBS ===
if (scheduler) {
  cron.schedule("0 9 * * *", async () => {
    console.log("🕘 Sending daily messages...");
    try {
      await scheduler.sendDailyMessages(bot);
    } catch (error) {
      console.error("Error sending daily messages:", error);
    }
  });
}

if (ContentScheduler) {
  try {
    const contentScheduler = new ContentScheduler(bot);
    contentScheduler.start();
    console.log("✅ Content scheduler started");
  } catch (error) {
    console.error("Content scheduler error:", error);
  }
}

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
