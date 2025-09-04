require("dotenv").config();

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const cron = require("node-cron");

// Import configurations
const { initializeDatabase } = require('./config/database');
const aiConfig = require('./config/ai-config');

// Import services
const AIService = require('./services/aiIntegration');
const Analytics = require('./services/analytics');
const Scheduler = require('./services/scheduler');
const AccessControl = require('./services/access-control');
const ConversionOptimizer = require('./services/conversion-optimizer');
const MessageQueue = require('./services/message-queue');

// Import utilities
const { sendLongMessage } = require('./utils/message-splitter');
const { isDuplicateMessage } = require('./utils/aiHelper');

// Import command handlers
const StartCommand = require('./commands/start');
const DailyCommands = require('./commands/daily');
const PaymentCommands = require('./commands/payment');
const VipCommands = require('./commands/vip');
const AdminCommands = require('./commands/admin');
const FreeToolsCommands = require('./commands/free-tools');
const QuotesCommands = require('./commands/quotes');
const BadgesCommands = require('./commands/badges');

console.log("🚀 Starting 7-Day Money Flow Bot with Clean Architecture...");

// Constants
const MESSAGE_CHUNK_SIZE = 4090;
const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0";

// Initialize Express app
const app = express();
app.use(express.json({ limit: "10mb", charset: "utf-8" }));
app.use(express.urlencoded({ extended: true, charset: "utf-8" }));

// Set UTF-8 headers
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});

// Initialize services
let bot, db, aiService, analytics, scheduler, accessControl, conversionOptimizer;

async function initializeBot() {
  try {
    console.log("🔄 Initializing bot services...");

    // Initialize database
    db = await initializeDatabase();
    console.log("✅ Database connected");

    // Initialize Telegram bot
    bot = new TelegramBot(process.env.BOT_TOKEN, {
      polling: false,
      onlyFirstMatch: true,
    });
    console.log("✅ Telegram bot initialized");

    // Initialize AI service
    aiService = new AIService();
    await aiService.initialize();
    console.log("✅ AI service initialized");

    // Initialize other services
    analytics = new Analytics(db);
    scheduler = new Scheduler(bot, db);
    accessControl = new AccessControl(db);
    conversionOptimizer = new ConversionOptimizer(bot, db);
    
    console.log("✅ All services initialized");

    return true;
  } catch (error) {
    console.error("❌ Bot initialization failed:", error);
    throw error;
  }
}

function getRailwayUrl() {
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  }
  return `https://money7daysreset-production.up.railway.app`;
}

async function setupWebhook() {
  try {
    await bot.stopPolling();
    await bot.deleteWebHook();
    
    const webhookUrl = `${getRailwayUrl()}/bot${process.env.BOT_TOKEN}`;
    console.log(`🔧 Setting webhook to: ${webhookUrl}`);
    
    await bot.setWebHook(webhookUrl);
    console.log("✅ Webhook set successfully");
  } catch (error) {
    console.error("❌ Webhook setup failed:", error);
    throw error;
  }
}

// Command handlers setup
function setupCommandHandlers() {
  console.log("🎯 Setting up command handlers...");

  // Initialize command classes with dependencies
  const startCommand = new StartCommand(bot, db, conversionOptimizer);
  const dailyCommands = new DailyCommands(bot, db, sendLongMessage);
  const paymentCommands = new PaymentCommands(bot, db);
  const vipCommands = new VipCommands(bot, db);
  const adminCommands = new AdminCommands(bot, db, analytics);
  const freeToolsCommands = new FreeToolsCommands(bot, db);
  const quotesCommands = new QuotesCommands(bot, db);
  const badgesCommands = new BadgesCommands(bot, db);

  // Basic commands
  bot.onText(/\/start/i, async (msg) => {
    if (isDuplicateMessage(msg)) return;
    await startCommand.handle(msg);
  });

  bot.onText(/\/help/i, async (msg) => {
    if (isDuplicateMessage(msg)) return;
    const helpContent = await accessControl.getTierSpecificHelp(msg.from.id);
    await sendLongMessage(bot, msg.chat.id, helpContent, { parse_mode: "Markdown" });
  });

  // Daily lesson commands
  bot.onText(/\/day([1-7])/i, async (msg, match) => {
    if (isDuplicateMessage(msg)) return;
    await dailyCommands.handleDay(msg, match);
  });

  // Payment commands
  bot.onText(/\/pricing/i, async (msg) => {
    if (isDuplicateMessage(msg)) return;
    await paymentCommands.showPricing(msg);
  });

  bot.onText(/\/payment/i, async (msg) => {
    if (isDuplicateMessage(msg)) return;
    await paymentCommands.showInstructions(msg);
  });

  // VIP commands
  bot.onText(/\/vip/i, async (msg) => {
    if (isDuplicateMessage(msg)) return;
    await vipCommands.showInfo(msg);
  });

  // Admin commands
  bot.onText(/\/admin_users/i, async (msg) => {
    if (isDuplicateMessage(msg)) return;
    await adminCommands.showUsers(msg);
  });

  bot.onText(/\/admin_analytics/i, async (msg) => {
    if (isDuplicateMessage(msg)) return;
    await adminCommands.showAnalytics(msg);
  });

  // Free tools
  bot.onText(/\/financial_quiz/i, async (msg) => {
    if (isDuplicateMessage(msg)) return;
    await freeToolsCommands.startQuiz(msg);
  });

  // AI commands
  bot.onText(/^\/ask(.*)/, async (msg, match) => {
    if (isDuplicateMessage(msg)) return;
    const question = match[1].trim();
    if (!question) {
      await bot.sendMessage(msg.chat.id, "🤖 Usage: /ask [your question]");
      return;
    }
    await aiService.handleQuestion(msg, question);
  });

  // Progress and badges
  bot.onText(/\/progress/i, async (msg) => {
    if (isDuplicateMessage(msg)) return;
    await badgesCommands.showProgress(msg);
  });

  bot.onText(/\/badges/i, async (msg) => {
    if (isDuplicateMessage(msg)) return;
    await badgesCommands.showBadges(msg);
  });

  // Status and FAQ
  bot.onText(/\/status/i, async (msg) => {
    if (isDuplicateMessage(msg)) return;
    await showUserStatus(msg);
  });

  bot.onText(/\/faq/i, async (msg) => {
    if (isDuplicateMessage(msg)) return;
    await showFAQ(msg);
  });

  console.log("✅ All command handlers set up");
}

// Message handlers
function setupMessageHandlers() {
  // Handle text messages
  bot.on('message', async (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return;
    
    console.log(`📝 Processing text message: "${msg.text}" from user ${msg.from.id}`);
    
    const text = msg.text.toUpperCase();
    
    // Handle specific text patterns
    if (text === "VIP APPLY") {
      await vipCommands.handleApplication(msg);
      return;
    }
    
    if (text.includes("READY FOR DAY 1")) {
      await dailyCommands.handleReadyForDay1(msg);
      return;
    }
    
    if (text.includes("DAY") && text.includes("COMPLETE")) {
      await dailyCommands.handleDayComplete(msg);
      return;
    }
    
    if (text.includes("PROGRAM COMPLETE")) {
      await dailyCommands.handleProgramComplete(msg);
      return;
    }

    // AI-powered smart responses
    if (aiService.shouldRespondToMessage(msg.text)) {
      await aiService.handleSmartResponse(msg);
    }
  });

  console.log("✅ Message handlers set up");
}

// Express routes
function setupRoutes() {
  // Webhook handler
  app.post(`/bot${process.env.BOT_TOKEN}`, async (req, res) => {
    try {
      console.log("🔔 Webhook received");
      await bot.processUpdate(req.body);
      res.sendStatus(200);
    } catch (error) {
      console.error("Webhook error:", error.message);
      res.sendStatus(500);
    }
  });

  // Health check routes
  app.get("/", (req, res) => {
    res.json({
      name: "7-Day Money Flow Reset™ Telegram Bot",
      status: "Running with Clean Architecture",
      time: new Date().toISOString(),
      version: "3.0.0",
      architecture: "Modular",
      modules: [
        "Commands", "Services", "Utils", "Config", "Models"
      ]
    });
  });

  app.get("/health", (req, res) => {
    res.json({ 
      status: "OK", 
      time: new Date().toISOString(),
      services: {
        bot: !!bot,
        database: !!db,
        ai: aiService?.isReady() || false,
        analytics: !!analytics,
        scheduler: !!scheduler
      }
    });
  });

  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await analytics.getBasicStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to get stats" });
    }
  });

  console.log("✅ Express routes set up");
}

// Helper functions
async function showUserStatus(msg) {
  try {
    const User = require('./models/User');
    const Progress = require('./models/Progress');
    
    const user = await User.findOne({ telegram_id: msg.from.id });
    const progress = await Progress.findOne({ user_id: msg.from.id });
    
    if (!user) {
      await bot.sendMessage(msg.chat.id, "អ្នកមិនទាន់ចុះឈ្មោះ។ ប្រើ /start ដើម្បីចាប់ផ្តើម។");
      return;
    }

    const statusMessage = `📊 ស្ថានភាពគណនីរបស់អ្នក:
    
👤 អ្នកប្រើប្រាស់: ${user.first_name || "មិនស្គាល់"}
💰 ស្ថានភាព: ${user.is_paid ? "✅ បានទូទាត់" : "❌ មិនទាន់ទូទាត់"}
🎯 កម្រិត: ${user.tier || "Essential"}
📈 ថ្ងៃបច្ចុប្បន្ន: Day ${progress?.current_day || 0}`;

    await sendLongMessage(bot, msg.chat.id, statusMessage);
  } catch (error) {
    console.error("Error showing status:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហាក្នុងការទាញយកស្ថានភាព។");
  }
}

async function showFAQ(msg) {
  try {
    const User = require('./models/User');
    const user = await User.findOne({ telegram_id: msg.from.id });
    const isPaid = user?.is_paid;

    const faqMessage = isPaid ? 
      await getFAQForPaidUsers(user) : 
      await getFAQForFreeUsers();

    await sendLongMessage(bot, msg.chat.id, faqMessage, { parse_mode: "Markdown" });
  } catch (error) {
    console.error("Error showing FAQ:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
}

async function getFAQForFreeUsers() {
  return `❓ សំណួរញឹកញាប់ (FAQ)

💰 អំពីតម្លៃ:
- តម្លៃប៉ុន្មាន? → $24 (Essential) / $97 (Premium) / $197 (VIP)
- ទូទាត់យ៉ាងដូចម្តេច? → ABA Bank, ACLEDA Bank, Wing Payment
- ទទួលបានអ្វីខ្លះ? → /pricing ដើម្បីមើលលម្អិត

📱 ពាក្យបញ្ជាសំខាន់:
- /start - ចាប់ផ្តើម
- /pricing - មើលតម្លៃ
- /payment - ការទូទាត់
- /help - ជំនួយ

💬 ជំនួយ: @Chendasum`;
}

async function getFAQForPaidUsers(user) {
  return `❓ សំណួរញឹកញាប់ (FAQ) - Complete Member Guide

💰 ស្ថានភាពរបស់អ្នក:
- កម្រិត: ${user.tier || "Essential"}
- ស្ថានភាព: ✅ បានទូទាត់

🚀 ពាក្យបញ្ជាកម្មវិធី:
- /day1 ដល់ /day7 - មេរៀន ៧ ថ្ងៃ
- /progress - ការរីកចម្រើន
- /badges - សមិទ្ធផល

💬 ជំនួយ: @Chendasum`;
}

// Cron jobs
function setupCronJobs() {
  // Daily lessons reminder
  cron.schedule("0 9 * * *", async () => {
    console.log("🕘 Sending daily reminders...");
    try {
      await scheduler.sendDailyReminders();
    } catch (error) {
      console.error("Error sending daily reminders:", error);
    }
  });

  // Weekly analytics
  cron.schedule("0 9 * * 1", async () => {
    console.log("📊 Generating weekly analytics...");
    try {
      await analytics.generateWeeklyReport();
    } catch (error) {
      console.error("Error generating weekly report:", error);
    }
  });

  console.log("✅ Cron jobs scheduled");
}

// Main startup function
async function startBot() {
  try {
    console.log("🚀 Starting bot initialization...");

    // Initialize all services
    await initializeBot();
    
    // Setup webhook
    await setupWebhook();
    
    // Setup handlers
    setupCommandHandlers();
    setupMessageHandlers();
    setupRoutes();
    setupCronJobs();

    // Start Express server
    const server = app.listen(PORT, HOST, () => {
      console.log(`🌐 Server running on ${HOST}:${PORT}`);
      console.log(`🔗 Webhook URL: ${getRailwayUrl()}/bot${process.env.BOT_TOKEN}`);
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      console.log("SIGTERM received, shutting down gracefully");
      server.close(() => {
        console.log("Server closed");
        process.exit(0);
      });
    });

    console.log("🎉 7-Day Money Flow Reset™ Bot started successfully!");
    console.log("🏗️ Architecture: Clean & Modular");
    console.log("📊 All services initialized and running");

  } catch (error) {
    console.error("❌ Failed to start bot:", error);
    process.exit(1);
  }
}

// Start the bot
startBot();
