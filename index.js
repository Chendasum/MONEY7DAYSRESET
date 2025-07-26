require("dotenv").config();

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const cron = require("node-cron");

console.log("🚀 Starting 7-Day Money Flow Bot with Full Features...");
console.log("BOT_TOKEN exists:", !!process.env.BOT_TOKEN);
console.log("PORT:", process.env.PORT || 5000);

// Database Models
const User = require("./models/User");
const Progress = require("./models/Progress");

// Command Modules
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
const progressTracker = require("./commands/progress-tracker");

// Service Modules
const scheduler = require("./services/scheduler");
const analytics = require("./services/analytics");
const celebrations = require("./services/celebrations");
const progressBadges = require("./services/progress-badges");
const emojiReactions = require("./services/emoji-reactions");
const AccessControl = require("./services/access-control");
const ContentScheduler = require("./services/content-scheduler");
const ConversionOptimizer = require("./services/conversion-optimizer");

// Utility Modules
const { sendLongMessage } = require("./utils/message-splitter");

const MESSAGE_CHUNK_SIZE = 800;

// Initialize Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set UTF-8 headers
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});

// Initialize services
const accessControl = new AccessControl();
const conversionOptimizer = new ConversionOptimizer();

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
      if (isDuplicateMessage(msg)) return;
      
      try {
        await startCommand.handle(msg, bot);
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

    // /pricing command
    bot.onText(/\/pricing/i, async (msg) => {
      console.log("💰 [PRICING] User:", msg.from.id);
      if (isDuplicateMessage(msg)) return;
      
      try {
        await paymentCommands.pricing(msg, bot);
        console.log("✅ [PRICING] Sent");
      } catch (error) {
        console.error("❌ [PRICING] Error:", error.message);
        // Fallback pricing
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
      }
    });

    // /payment command
    bot.onText(/\/payment/i, async (msg) => {
      console.log("💳 [PAYMENT] User:", msg.from.id);
      if (isDuplicateMessage(msg)) return;
      
      try {
        await paymentCommands.instructions(msg, bot);
        console.log("✅ [PAYMENT] Sent");
      } catch (error) {
        console.error("❌ [PAYMENT] Error:", error.message);
        // Fallback payment
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
        
        await dailyCommands.handle(msg, match, bot);
      } catch (error) {
        console.error(`❌ [DAY${match[1]}] Error:`, error.message);
        await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
      }
    });

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
        
        await extendedContent.handleExtendedDay(msg, bot, day);
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
        
        await vipCommands.info(msg, bot);
      } catch (error) {
        console.error("❌ [VIP] Error:", error.message);
        await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
      }
    });

    bot.onText(/\/vip_program_info/i, async (msg) => {
      if (isDuplicateMessage(msg)) return;
      try {
        const user = await User.findOne({ telegram_id: msg.from.id });
        const isPaid = user?.is_paid === true || user?.is_paid === 't';
        
        if (!user || !isPaid) {
          await bot.sendMessage(msg.chat.id, "🔒 សូមទូទាត់មុនដើម្បីចូលរួមកម្មវិធី VIP។ ប្រើ /pricing");
          return;
        }
        
        await vipCommands.info(msg, bot);
      } catch (error) {
        console.error("Error in VIP info command:", error);
        await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
      }
    });

    // === ADMIN COMMANDS ===
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

    bot.onText(/\/admin_confirm_payment (.+)/i, async (msg, match) => {
      if (isDuplicateMessage(msg)) return;
      try {
        await adminCommands.confirmPayment(msg, match, bot);
      } catch (e) {
        console.error("Error /admin_confirm_payment:", e);
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

    bot.onText(/\/admin_menu|\/admin$/i, async (msg) => {
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
• /whoami - ស្ថានភាព Admin របស់អ្នក`;

      await bot.sendMessage(msg.chat.id, menuMessage);
    });

    // === PROGRESS TRACKING COMMANDS ===
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

    bot.onText(/\/admin_completed/i, async (msg) => {
      if (isDuplicateMessage(msg)) return;
      try {
        await progressTracker.showCompletedUsers(msg, bot);
      } catch (e) {
        console.error("Error /admin_completed:", e);
        await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
      }
    });

    // === FREE TOOLS ===
    bot.onText(/\/financial_quiz/i, async (msg) => {
      if (isDuplicateMessage(msg)) return;
      try {
        await financialQuiz.startQuiz(msg, bot);
      } catch (e) {
        console.error("Error /financial_quiz:", e);
        await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
      }
    });

    bot.onText(/\/calculate_daily/i, async (msg) => {
      if (isDuplicateMessage(msg)) return;
      try {
        await freeTools.calculateDaily(msg, bot);
      } catch (e) {
        console.error("Error /calculate_daily:", e);
        await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
      }
    });

    bot.onText(/\/find_leaks/i, async (msg) => {
      if (isDuplicateMessage(msg)) return;
      try {
        await freeTools.findLeaks(msg, bot);
      } catch (e) {
        console.error("Error /find_leaks:", e);
        await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
      }
    });

    bot.onText(/\/savings_potential/i, async (msg) => {
      if (isDuplicateMessage(msg)) return;
      try {
        await freeTools.savingsPotential(msg, bot);
      } catch (e) {
        console.error("Error /savings_potential:", e);
        await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
      }
    });

    // === PREVIEW COMMANDS ===
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
        
        await badgesCommands.showBadges(msg, bot);
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
        
        await badgesCommands.showProgress(msg, bot);
      } catch (error) {
        console.error("Error in /progress command:", error);
        await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
      }
    });

    // === QUOTES ===
    bot.onText(/\/quote$/i, async (msg) => {
      if (isDuplicateMessage(msg)) return;
      try {
        await quotesCommands.dailyQuote(msg, bot);
      } catch (e) {
        console.error("Error /quote:", e);
        await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
      }
    });

    bot.onText(/\/wisdom/i, async (msg) => {
      if (isDuplicateMessage(msg)) return;
      try {
        await quotesCommands.randomWisdom(msg, bot);
      } catch (e) {
        console.error("Error /wisdom:", e);
        await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
      }
    });

    // === BOOKING (VIP ONLY) ===
    bot.onText(/\/book_session/i, async (msg) => {
      if (isDuplicateMessage(msg)) return;
      try {
        await bookingCommands.showBookingSlots(msg, bot);
      } catch (e) {
        console.error("Error /book_session:", e);
        await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
      }
    });

    // === FAQ COMMAND ===
    bot.onText(/\/faq|FAQ|faq/i, async (msg) => {
      if (isDuplicateMessage(msg)) return;
      try {
        const user = await User.findOne({ telegram_id: msg.from.id });
        const isPaid = user?.is_paid === true || user?.is_paid === 't';
        const isVip = user?.tier === "vip";
        const isPremiumOrVip = user?.tier === "premium" || user?.tier === "vip";
        
        let faqMessage = await accessControl.getTierSpecificFAQ(msg.from.id, isPaid, isPremiumOrVip, isVip);
        await sendLongMessage(bot, msg.chat.id, faqMessage, { parse_mode: "Markdown" }, MESSAGE_CHUNK_SIZE);
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
        const secondaryAdminId = 484389665;
        const isAdmin = msg.from.id === adminId || msg.from.id === secondaryAdminId;
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
        await bot.sendMessage(msg.chat.id, "✅ Enhanced bot is working! All features loaded.");
        console.log("Test command sent to:", msg.from.id);
      } catch (error) {
        console.error("Test command error:", error.message);
      }
    });

    // === MESSAGE HANDLERS ===
    
    // VIP APPLY Handler
    bot.on("message", async (msg) => {
      if (!msg.text || msg.text.startsWith("/")) return;
      if (isDuplicateMessage(msg)) return;
      
      const text = msg.text.toLowerCase();
      
      // Check if it's a financial quiz response
      if (await financialQuiz.processQuizResponse(msg, bot)) {
        return;
      }
      
      // Check if it's a free tools response
      if (await freeTools.processToolResponse(msg, bot, await User.findOne({ telegram_id: msg.from.id }))) {
        return;
      }
      
      // Handle specific text commands
      if (text === "vip apply") {
        try {
          const user = await User.findOne({ telegram_id: msg.from.id });
          const isPaid = user?.is_paid === true || user?.is_paid === 't';
          
          if (!user || !isPaid) {
            await bot.sendMessage(msg.chat.id, "🔒 សូមទូទាត់មុនដើម្បីចូលរួមកម្មវិធី VIP។ ប្រើ /pricing");
            return;
          }
          
          await vipCommands.apply(msg, bot);
        } catch (error) {
          console.error("Error handling VIP APPLY:", error);
          await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
        }
      } else if (text === "ready for day 1") {
        await handleReadyForDay1(msg);
      } else if (text.includes("day") && text.includes("complete")) {
        await handleDayComplete(msg);
      } else if (text === "program complete") {
        await handleProgramComplete(msg);
      } else if (text === "capital clarity" || text === "CAPITAL CLARITY") {
        await handleCapitalClarity(msg);
      }
    });

    // Handler functions
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
      
      const completeReaction = emojiReactions.lessonCompleteReaction(dayNumber);
      await bot.sendMessage(msg.chat.id, completeReaction);
      
      const celebrationMessage = celebrations.dayCompleteCelebration(dayNumber);
      await sendLongMessage(bot, msg.chat.id, celebrationMessage, {}, MESSAGE_CHUNK_SIZE);
      
      if (dayNumber < 7) {
        await bot.sendMessage(msg.chat.id, `🚀 ត្រៀមរួចសម្រាប់ថ្ងៃទី ${nextDay}? ចុច /day${nextDay}`);
      } else {
        await bot.sendMessage(msg.chat.id, `🎊 អ្នកបានបញ្ចប់កម្មវិធីពេញលេញ! សរសេរ "PROGRAM COMPLETE"`);
      }
    }

    async function handleProgramComplete(msg) {
      try {
        const programCelebration = celebrations.programCompleteCelebration(`🎯 ជំហានបន្ទាប់:
1️⃣ អនុវត្តផែនការ ៣០ ថ្ងៃ
2️⃣ ពិនិត្យដំណើរការប្រចាំសប្តាហ៍
3️⃣ មានសំណួរ? ទាក់ទងមកបាន!

🚀 ចង់បន្តកម្រិតបន្ទាប់?
VIP Advanced Program ចាប់ផ្តើមខែក្រោយ!
សួរ: "VIP PROGRAM INFO"`);
        
        await sendLongMessage(bot, msg.chat.id, programCelebration, {}, MESSAGE_CHUNK_SIZE);
        
        await Progress.findOneAndUpdate(
          { user_id: msg.from.id },
          { programCompleted: true, programCompletedAt: new Date() },
          { upsert: true }
        );
        
        await vipCommands.offer(msg, bot);
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
        
        await vipCommands.capitalClarity(msg, bot);
      } catch (error) {
        console.error("Error handling Capital Clarity:", error);
        await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
      }
    }

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
      "30-Day Extended Content",
      "Payment Processing", 
      "VIP Programs",
      "Progress Tracking",
      "Admin Dashboard",
      "Marketing Tools",
      "Booking System",
      "Free Tools",
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
    modules_loaded: {
      commands: !!dailyCommands,
      services: !!scheduler,
      utils: !!sendLongMessage
    }
  });
});

app.get("/analytics", async (req, res) => {
  try {
    const stats = await analytics.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Failed to get analytics" });
  }
});

app.post("/webhook/payment", async (req, res) => {
  try {
    const { userId, amount, status, transactionId } = req.body;
    
    if (status === "completed" && amount >= 24) {
      await paymentCommands.confirmPayment(bot, userId, transactionId);
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Payment webhook error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
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
  console.log(`🎯 Features: Full 7-Day + 30-Day Program with all modules`);
  
  // Setup webhook after server starts
  await setupWebhook();
});

// === CRON JOBS ===
cron.schedule("0 9 * * *", async () => {
  console.log("🕘 Sending daily messages...");
  try {
    await scheduler.sendDailyMessages(bot);
  } catch (error) {
    console.error("Error sending daily messages:", error);
  }
});

// Initialize Content Scheduler
const contentScheduler = new ContentScheduler(bot);
contentScheduler.start();

console.log("🤖 Bot started successfully with all features!");
console.log("🚀 Features loaded:");
console.log("   • 7-Day Money Flow Program");
console.log("   • 30-Day Extended Content");
console.log("   • VIP & Premium Programs");
console.log("   • Payment Processing");
console.log("   • Admin Dashboard");
console.log("   • Progress Tracking");
console.log("   • Marketing Automation");
console.log("   • Booking System");
console.log("   • Free Financial Tools");
console.log("   • Access Control System");
console.log("   • Content Scheduling");
console.log("🔱 7-Day Money Flow Reset™ READY!");

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
