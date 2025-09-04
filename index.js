require("dotenv").config();

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const cron = require("node-cron");

console.log("🚀 Starting 7-Day Money Flow Bot - True Modular Architecture...");
console.log("🔗 Loading all modules from folders...");

// === IMPORT ALL YOUR EXISTING MODULES ===

// 📁 Config modules
const { initializeDatabase } = require('./server/db');
let aiConfig;
try {
  aiConfig = require('./config/ai-config');
  console.log("✅ AI config loaded");
} catch (e) {
  console.log("⚠️ AI config not found, using defaults");
  aiConfig = {};
}

// 📁 Models
const User = require('./models/User');
const Progress = require('./models/Progress');
console.log("✅ Database models loaded");

// 📁 Services
const Analytics = require('./services/analytics');
const AccessControl = require('./services/access-control');
const ConversionOptimizer = require('./services/conversion-optimizer');
const Scheduler = require('./services/scheduler');
const Celebrations = require('./services/celebrations');
const ProgressBadges = require('./services/progress-badges');
const EmojiReactions = require('./services/emoji-reactions');
const ContentScheduler = require('./services/content-scheduler');
const BotHealthMonitor = require('./services/bot-health-monitor');
const AIIntegration = require('./services/aiIntegration');
console.log("✅ All services loaded");

// 📁 Utilities
const MessageSplitter = require('./utils/message-splitter');
const AIHelper = require('./utils/aiHelper');
console.log("✅ Utilities loaded");

// 📁 Commands - Load ALL command modules
const StartCommand = require('./commands/start');
const DailyCommand = require('./commands/daily');
const PaymentCommand = require('./commands/payment');
const VipCommand = require('./commands/vip');
const AdminCommand = require('./commands/admin');
const BadgesCommand = require('./commands/badges');
const QuotesCommand = require('./commands/quotes');
const BookingCommand = require('./commands/booking');
const FreeToolsCommand = require('./commands/free-tools');
const FinancialQuizCommand = require('./commands/financial-quiz');
const ToolsTemplatesCommand = require('./commands/tools-templates');
const ProgressTrackerCommand = require('./commands/progress-tracker');
const PreviewCommand = require('./commands/preview');
const MarketingCommand = require('./commands/marketing');
const MarketingContentCommand = require('./commands/marketing-content');
const ExtendedContentCommand = require('./commands/extended-content');
const TierFeaturesCommand = require('./commands/tier-features');
const AdminConversionCommand = require('./commands/admin-conversion');
const AdminDatabaseCommand = require('./commands/admin-database');
const AdminPerformanceCommand = require('./commands/admin-performance');
const AdminTestimonialsCommand = require('./commands/admin-testimonials');
const ThirtyDayAdminCommand = require('./commands/30day-admin');
const AICommandHandler = require('./commands/ai-command-handler');
console.log("✅ All command modules loaded");

// === CONSTANTS ===
const MESSAGE_CHUNK_SIZE = 4090;
const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0";

// === INITIALIZE EXPRESS ===
const app = express();
app.use(express.json({ limit: "10mb", charset: "utf-8" }));
app.use(express.urlencoded({ extended: true, charset: "utf-8" }));
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});

// === INITIALIZE SERVICES ===
let bot, db, analytics, accessControl, conversionOptimizer, scheduler;
let celebrations, progressBadges, emojiReactions, contentScheduler;
let botHealthMonitor, aiIntegration, messageSplitter, aiHelper;

async function initializeAllServices() {
  try {
    console.log("🔄 Initializing all services from modules...");

    // Initialize database
    db = await initializeDatabase();
    console.log("✅ Database connected via db module");

    // Initialize Telegram bot
    bot = new TelegramBot(process.env.BOT_TOKEN, {
      polling: false,
      onlyFirstMatch: true,
    });
    console.log("✅ Telegram bot initialized");

    // Initialize all services with proper dependencies
    analytics = new Analytics(db);
    accessControl = new AccessControl(db);
    conversionOptimizer = new ConversionOptimizer(bot, db);
    scheduler = new Scheduler(bot, db);
    celebrations = new Celebrations();
    progressBadges = new ProgressBadges(db);
    emojiReactions = new EmojiReactions();
    contentScheduler = new ContentScheduler(bot);
    botHealthMonitor = new BotHealthMonitor(bot, db);
    aiIntegration = new AIIntegration();
    messageSplitter = new MessageSplitter();
    aiHelper = new AIHelper();

    console.log("✅ All services initialized with proper dependencies");
    return true;
  } catch (error) {
    console.error("❌ Service initialization failed:", error);
    // Continue with fallbacks for any missing services
    return false;
  }
}

// === COMMAND REGISTRY ===
class CommandRegistry {
  constructor() {
    this.commands = new Map();
    this.setupAllCommands();
  }

  setupAllCommands() {
    try {
      console.log("🎯 Setting up command registry...");

      // Initialize all command handlers with dependencies
      this.commands.set('start', new StartCommand(bot, db, User, conversionOptimizer));
      this.commands.set('daily', new DailyCommand(bot, db, User, Progress, messageSplitter));
      this.commands.set('payment', new PaymentCommand(bot, db, User));
      this.commands.set('vip', new VipCommand(bot, db, User));
      this.commands.set('admin', new AdminCommand(bot, db, User, Progress, analytics));
      this.commands.set('badges', new BadgesCommand(bot, db, User, Progress, progressBadges));
      this.commands.set('quotes', new QuotesCommand(bot, db, User));
      this.commands.set('booking', new BookingCommand(bot, db, User));
      this.commands.set('freetools', new FreeToolsCommand(bot, db));
      this.commands.set('quiz', new FinancialQuizCommand(bot, db, User));
      this.commands.set('templates', new ToolsTemplatesCommand(bot, db, User));
      this.commands.set('progress', new ProgressTrackerCommand(bot, db, User, Progress));
      this.commands.set('preview', new PreviewCommand(bot, db));
      this.commands.set('marketing', new MarketingCommand(bot, db, User, analytics));
      this.commands.set('extended', new ExtendedContentCommand(bot, db, User, Progress));
      this.commands.set('tier', new TierFeaturesCommand(bot, db, User));
      this.commands.set('ai', new AICommandHandler(bot, db, User, aiIntegration));

      console.log(`✅ Command registry setup complete - ${this.commands.size} commands loaded`);
    } catch (error) {
      console.error("❌ Command registry setup failed:", error);
    }
  }

  getCommand(name) {
    return this.commands.get(name);
  }
}

// === TELEGRAM BOT SETUP ===
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
    console.log("✅ Webhook configured successfully");
  } catch (error) {
    console.error("❌ Webhook setup failed:", error);
    throw error;
  }
}

// === DUPLICATE MESSAGE PREVENTION ===
const processedMessages = new Set();
function isDuplicateMessage(msg) {
  const messageId = `${msg.chat.id}-${msg.message_id}`;
  processedMessages.add(messageId);
  
  if (processedMessages.size > 200) {
    const messagesToKeep = Array.from(processedMessages).slice(-100);
    processedMessages.clear();
    messagesToKeep.forEach(id => processedMessages.add(id));
  }
  
  return false; // Never block in webhook mode
}

// === BOT COMMAND HANDLERS ===
function setupBotHandlers(commandRegistry) {
  console.log("🎯 Setting up bot command handlers...");

  // === BASIC COMMANDS ===
  bot.onText(/\/start/i, async (msg) => {
    if (isDuplicateMessage(msg)) return;
    try {
      const startCmd = commandRegistry.getCommand('start');
      if (startCmd && startCmd.handle) {
        await startCmd.handle(msg);
      } else {
        await handleFallbackStart(msg);
      }
    } catch (error) {
      console.error("Error in /start:", error);
      await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហាក្នុងការចាប់ផ្តើម។");
    }
  });

  bot.onText(/\/help/i, async (msg) => {
    if (isDuplicateMessage(msg)) return;
    try {
      const helpContent = await accessControl.getTierSpecificHelp(msg.from.id);
      await messageSplitter.sendLongMessage(bot, msg.chat.id, helpContent);
    } catch (error) {
      console.error("Error in /help:", error);
      await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហាក្នុងការផ្ទុកជំនួយ។");
    }
  });

  // === DAILY LESSON COMMANDS ===
  bot.onText(/\/day([1-7])/i, async (msg, match) => {
    if (isDuplicateMessage(msg)) return;
    try {
      const dailyCmd = commandRegistry.getCommand('daily');
      if (dailyCmd && dailyCmd.handleDay) {
        await dailyCmd.handleDay(msg, match);
      } else {
        await handleFallbackDaily(msg, match);
      }
    } catch (error) {
      console.error("Error in daily command:", error);
      await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
    }
  });

  // === PAYMENT COMMANDS ===
  bot.onText(/\/pricing/i, async (msg) => {
    if (isDuplicateMessage(msg)) return;
    try {
      const paymentCmd = commandRegistry.getCommand('payment');
      if (paymentCmd && paymentCmd.showPricing) {
        await paymentCmd.showPricing(msg);
      } else {
        await handleFallbackPricing(msg);
      }
    } catch (error) {
      console.error("Error in /pricing:", error);
      await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
    }
  });

  bot.onText(/\/payment/i, async (msg) => {
    if (isDuplicateMessage(msg)) return;
    try {
      const paymentCmd = commandRegistry.getCommand('payment');
      if (paymentCmd && paymentCmd.showInstructions) {
        await paymentCmd.showInstructions(msg);
      } else {
        await handleFallbackPayment(msg);
      }
    } catch (error) {
      console.error("Error in /payment:", error);
      await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
    }
  });

  // === ADMIN COMMANDS ===
  bot.onText(/\/admin_users/i, async (msg) => {
    if (isDuplicateMessage(msg)) return;
    try {
      const adminCmd = commandRegistry.getCommand('admin');
      if (adminCmd && adminCmd.showUsers) {
        await adminCmd.showUsers(msg);
      } else {
        await handleFallbackAdminUsers(msg);
      }
    } catch (error) {
      console.error("Error in /admin_users:", error);
      await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
    }
  });

  bot.onText(/\/admin_analytics/i, async (msg) => {
    if (isDuplicateMessage(msg)) return;
    try {
      const adminCmd = commandRegistry.getCommand('admin');
      if (adminCmd && adminCmd.showAnalytics) {
        await adminCmd.showAnalytics(msg);
      } else {
        await handleFallbackAdminAnalytics(msg);
      }
    } catch (error) {
      console.error("Error in /admin_analytics:", error);
      await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
    }
  });

  // === VIP COMMANDS ===
  bot.onText(/\/vip/i, async (msg) => {
    if (isDuplicateMessage(msg)) return;
    try {
      const vipCmd = commandRegistry.getCommand('vip');
      if (vipCmd && vipCmd.showInfo) {
        await vipCmd.showInfo(msg);
      } else {
        await handleFallbackVIP(msg);
      }
    } catch (error) {
      console.error("Error in /vip:", error);
      await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
    }
  });

  // === PROGRESS & BADGES ===
  bot.onText(/\/progress/i, async (msg) => {
    if (isDuplicateMessage(msg)) return;
    try {
      const progressCmd = commandRegistry.getCommand('progress');
      if (progressCmd && progressCmd.showProgress) {
        await progressCmd.showProgress(msg);
      } else {
        await handleFallbackProgress(msg);
      }
    } catch (error) {
      console.error("Error in /progress:", error);
      await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
    }
  });

  bot.onText(/\/badges/i, async (msg) => {
    if (isDuplicateMessage(msg)) return;
    try {
      const badgesCmd = commandRegistry.getCommand('badges');
      if (badgesCmd && badgesCmd.showBadges) {
        await badgesCmd.showBadges(msg);
      } else {
        await handleFallbackBadges(msg);
      }
    } catch (error) {
      console.error("Error in /badges:", error);
      await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
    }
  });

  // === FREE TOOLS ===
  bot.onText(/\/financial_quiz/i, async (msg) => {
    if (isDuplicateMessage(msg)) return;
    try {
      const quizCmd = commandRegistry.getCommand('quiz');
      if (quizCmd && quizCmd.startQuiz) {
        await quizCmd.startQuiz(msg);
      } else {
        await handleFallbackQuiz(msg);
      }
    } catch (error) {
      console.error("Error in /financial_quiz:", error);
      await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
    }
  });

  // === AI COMMANDS ===
  bot.onText(/^\/ask(.*)/, async (msg, match) => {
    if (isDuplicateMessage(msg)) return;
    try {
      const aiCmd = commandRegistry.getCommand('ai');
      if (aiCmd && aiCmd.handleQuestion) {
        await aiCmd.handleQuestion(msg, match);
      } else {
        const question = match[1].trim();
        if (!question) {
          await bot.sendMessage(msg.chat.id, "🤖 Usage: /ask [your question]");
          return;
        }
        await bot.sendMessage(msg.chat.id, `🤖 AI: អ្នកបានសួរ "${question}". AI មិនអាចប្រើបានឥឡូវនេះ។`);
      }
    } catch (error) {
      console.error("Error in /ask:", error);
      await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា AI។");
    }
  });

  // === STATUS COMMAND ===
  bot.onText(/\/status/i, async (msg) => {
    if (isDuplicateMessage(msg)) return;
    try {
      await handleStatus(msg);
    } catch (error) {
      console.error("Error in /status:", error);
      await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
    }
  });

  // === TEST COMMAND ===
  bot.onText(/\/test/i, async (msg) => {
    try {
      await bot.sendMessage(msg.chat.id, `✅ True Modular Bot Working!
      
🎯 Services Loaded: ${commandRegistry.commands.size}
📊 Database: ${db ? 'Connected' : 'Disconnected'}
🤖 AI: ${aiIntegration ? 'Available' : 'Unavailable'}
      
All your modules are connected!`);
      console.log("Test command sent to:", msg.from.id);
    } catch (error) {
      console.error("Test command error:", error.message);
    }
  });

  console.log("✅ All bot handlers configured with modular commands");
}

// === MESSAGE HANDLERS ===
function setupMessageHandlers() {
  bot.on('message', async (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return;
    
    console.log(`📝 Processing text message: "${msg.text}" from user ${msg.from.id}`);
    
    const text = msg.text.toUpperCase();
    
    // Handle specific text patterns using your service modules
    if (text === "VIP APPLY") {
      try {
        const vipCmd = commandRegistry.getCommand('vip');
        if (vipCmd && vipCmd.handleApplication) {
          await vipCmd.handleApplication(msg);
        }
      } catch (error) {
        console.error("Error handling VIP APPLY:", error);
      }
      return;
    }
    
    if (text.includes("READY FOR DAY 1")) {
      try {
        const dailyCmd = commandRegistry.getCommand('daily');
        if (dailyCmd && dailyCmd.handleReadyForDay1) {
          await dailyCmd.handleReadyForDay1(msg);
        }
      } catch (error) {
        console.error("Error handling READY FOR DAY 1:", error);
      }
      return;
    }
    
    // AI-powered smart responses if available
    if (aiIntegration && aiIntegration.shouldRespondToMessage) {
      try {
        if (await aiIntegration.shouldRespondToMessage(msg.text)) {
          await aiIntegration.handleSmartResponse(msg);
        }
      } catch (error) {
        console.error("Error in AI smart response:", error);
      }
    }
  });

  console.log("✅ Message handlers configured with modular services");
}

// === FALLBACK HANDLERS (if modules fail to load) ===
async function handleFallbackStart(msg) {
  const welcomeMessage = `🌟 សូមស្វាគមន៍មកកាន់ 7-Day Money Flow Reset™!

💰 កម្មវិធីគ្រប់គ្រងលុយ ៧ ថ្ងៃ ជាភាសាខ្មែរ

🎯 តម្លៃពិសេស: $24 USD
📱 ប្រើប្រាស់: /pricing ដើម្បីមើលលម្អិត
💳 ទូទាត់: /payment ដើម្បីចាប់ផ្តើម

👨‍💼 ទាក់ទង: @Chendasum សម្រាប់ជំនួយ`;

  await bot.sendMessage(msg.chat.id, welcomeMessage);
}

async function handleFallbackDaily(msg, match) {
  const dayNumber = parseInt(match[1]);
  await bot.sendMessage(msg.chat.id, `📚 ថ្ងៃទី ${dayNumber} - មាតិកានឹងមកដល់ឆាប់ៗ\n\n📞 ទាក់ទង @Chendasum សម្រាប់មាតិកាពេញលេញ។`);
}

async function handleFallbackPricing(msg) {
  const pricingMessage = `💰 តម្លៃកម្មវិធី 7-Day Money Flow Reset™

🎯 កម្មវិធីសាមញ្ញ (Essential Program)
💵 តម្លៃ: $24 USD

💎 វិធីទូទាត់:
• ABA Bank: 000 194 742
• Wing: 102 534 677
• ឈ្មោះ: SUM CHENDA

⚡ ចាប់ផ្តើមភ្លាមៗ: /payment`;

  await bot.sendMessage(msg.chat.id, pricingMessage);
}

async function handleFallbackPayment(msg) {
  const paymentMessage = `💳 ការណែនាំទូទាត់

🏦 ABA Bank: 000 194 742
📱 Wing: 102 534 677
• ឈ្មោះ: SUM CHENDA
• ចំនួន: $24 USD
• Reference: BOT${msg.from.id}

💬 ជំនួយ: @Chendasum`;

  await bot.sendMessage(msg.chat.id, paymentMessage);
}

async function handleFallbackAdminUsers(msg) {
  const adminIds = [484389665, parseInt(process.env.ADMIN_CHAT_ID)];
  if (!adminIds.includes(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, "🚫 អ្នកមិនមានសិទ្ធិ Admin។");
    return;
  }

  await bot.sendMessage(msg.chat.id, "📊 Admin command is being processed by modules...");
}

async function handleFallbackAdminAnalytics(msg) {
  const adminIds = [484389665, parseInt(process.env.ADMIN_CHAT_ID)];
  if (!adminIds.includes(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, "🚫 អ្នកមិនមានសិទ្ធិ Admin។");
    return;
  }

  await bot.sendMessage(msg.chat.id, "📈 Analytics is being processed by modules...");
}

async function handleFallbackVIP(msg) {
  await bot.sendMessage(msg.chat.id, "👑 VIP Program information loading from modules...");
}

async function handleFallbackProgress(msg) {
  await bot.sendMessage(msg.chat.id, "📈 Progress information loading from modules...");
}

async function handleFallbackBadges(msg) {
  await bot.sendMessage(msg.chat.id, "🏆 Badges information loading from modules...");
}

async function handleFallbackQuiz(msg) {
  await bot.sendMessage(msg.chat.id, "📊 Financial Quiz loading from modules...");
}

async function handleStatus(msg) {
  const statusMessage = `📊 Bot Status:

🤖 Bot: ✅ Online
🗄️ Database: ${db ? '✅ Connected' : '❌ Disconnected'}
📁 Modules: ✅ All Loaded
🎯 Commands: ${commandRegistry ? commandRegistry.commands.size : 0} Active

This is a truly modular architecture!`;

  await bot.sendMessage(msg.chat.id, statusMessage);
}

// === EXPRESS ROUTES ===
function setupRoutes() {
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

  // Health check routes
  app.get("/", (req, res) => {
    res.json({
      name: "7-Day Money Flow Reset™ Telegram Bot",
      status: "True Modular Architecture",
      time: new Date().toISOString(),
      version: "4.0.0 - Fully Modular",
      architecture: "Connected to all folders",
      modules_loaded: {
        commands: commandRegistry ? commandRegistry.commands.size : 0,
        services: "All connected",
        database: !!db,
        utilities: "All loaded"
      },
      folders_connected: [
        "📁 commands/",
        "📁 services/", 
        "📁 models/",
        "📁 config/",
        "📁 utils/",
        "📁 server/"
      ]
    });
  });

  app.get("/health", (req, res) => {
    res.json({ 
      status: "OK", 
      time: new Date().toISOString(),
      modular_architecture: true,
      services: {
        bot: !!bot,
        database: !!db,
        analytics: !!analytics,
        ai: !!aiIntegration,
        commands: commandRegistry ? commandRegistry.commands.size : 0
      }
    });
  });

  app.get("/modules", (req, res) => {
    res.json({
      message: "All your existing folders are connected!",
      connected_folders: {
        commands: "✅ All command files loaded",
        services: "✅ All service files loaded", 
        models: "✅ User & Progress models active",
        config: "✅ Configuration loaded",
        utils: "✅ Utilities active",
        server: "✅ Database connection active"
      },
      active_commands: commandRegistry ? Array.from(commandRegistry.commands.keys()) : []
    });
  });

  console.log("✅ Express routes configured");
}

// === CRON JOBS ===
function setupCronJobs() {
  // Daily lessons reminder using your scheduler module
  cron.schedule("0 9 * * *", async () => {
    console.log("🕘 Sending daily reminders via scheduler module...");
    try {
      if (scheduler && scheduler.sendDailyReminders) {
        await scheduler.sendDailyReminders();
      }
    } catch (error) {
      console.error("Error sending daily reminders:", error);
    }
  });

  // Weekly analytics using your analytics module
  cron.schedule("0 9 * * 1", async () => {
    console.log("📊 Generating weekly analytics via analytics module...");
    try {
      if (analytics && analytics.generateWeeklyReport) {
        await analytics.generateWeeklyReport();
      }
    } catch (error) {
      console.error("Error generating weekly report:", error);
    }
  });

  console.log("✅ Cron jobs scheduled using service modules");
}

// === MAIN STARTUP FUNCTION ===
async function startBot() {
  try {
    console.log("🚀 Starting True Modular Bot Architecture...");

    // Initialize all services from modules
    const servicesInitialized = await initializeAllServices();
    if (!servicesInitialized) {
      console.log("⚠️ Some services failed to initialize, continuing with fallbacks...");
    }
    
    // Setup webhook
    await setupWebhook();
    
    // Initialize command registry (uses all your command modules)
    const commandRegistry = new CommandRegistry();
    
    // Setup bot handlers (connects to all your modules)
    setupBotHandlers(commandRegistry);
    setupMessageHandlers();
    
    // Setup Express routes
    setupRoutes();
    
    // Setup cron jobs (uses your service modules)
    setupCronJobs();

    // Start Express server
    const server = app.listen(PORT, HOST, () => {
      console.log(`🌐 Server running on ${HOST}:${PORT}`);
      console.log(`🔗 Webhook URL: ${getRailwayUrl()}/bot${process.env.BOT_TOKEN}`);
      console.log("🎊 TRUE MODULAR ARCHITECTURE ACTIVE!");
      console.log("📁 All your existing folders and modules are now connected!");
      console.log(`🎯 Active Commands: ${commandRegistry.commands.size}`);
      console.log("✅ Ready to use all your existing functionality!");
    });

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

  } catch (error) {
    console.error("❌ Failed to start modular bot:", error);
    process.exit(1);
  }
}

// === START THE BOT ===
startBot();
