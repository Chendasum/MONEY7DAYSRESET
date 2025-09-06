require("dotenv").config();
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const cron = require("node-cron");

console.log("🚀 Starting 7-Day Money Flow Bot - Complete Orchestrator Mode");
console.log("BOT_TOKEN exists:", !!process.env.BOT_TOKEN);
console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);

// Database setup
const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const { pgTable, serial, text, integer, bigint, boolean, timestamp, jsonb } = require('drizzle-orm/pg-core');
const { eq } = require('drizzle-orm');

// Database Schema
const users = pgTable('users', {
  id: serial('id').primaryKey(),
  telegram_id: bigint('telegram_id', { mode: 'number' }).notNull().unique(),
  username: text('username'),
  first_name: text('first_name'),
  last_name: text('last_name'),
  phone_number: text('phone_number'),
  email: text('email'),
  joined_at: timestamp('joined_at').defaultNow(),
  is_paid: boolean('is_paid').default(false),
  payment_date: timestamp('payment_date'),
  transaction_id: text('transaction_id'),
  is_vip: boolean('is_vip').default(false),
  tier: text('tier').default('free'),
  tier_price: integer('tier_price').default(0),
  last_active: timestamp('last_active').defaultNow(),
  timezone: text('timezone').default('Asia/Phnom_Penh'),
  testimonials: jsonb('testimonials'),
  testimonial_requests: jsonb('testimonial_requests'),
  upsell_attempts: jsonb('upsell_attempts'),
  conversion_history: jsonb('conversion_history'),
  extended_progress: jsonb('extended_progress'),
});

const progress = pgTable('progress', {
  id: serial('id').primaryKey(),
  user_id: bigint('user_id', { mode: 'number' }).notNull().unique(),
  current_day: integer('current_day').default(0),
  ready_for_day_1: boolean('ready_for_day_1').default(false),
  day_0_completed: boolean('day_0_completed').default(false),
  day_1_completed: boolean('day_1_completed').default(false),
  day_2_completed: boolean('day_2_completed').default(false),
  day_3_completed: boolean('day_3_completed').default(false),
  day_4_completed: boolean('day_4_completed').default(false),
  day_5_completed: boolean('day_5_completed').default(false),
  day_6_completed: boolean('day_6_completed').default(false),
  day_7_completed: boolean('day_7_completed').default(false),
  program_completed: boolean('program_completed').default(false),
  program_completed_at: timestamp('program_completed_at'),
  responses: jsonb('responses'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const db = drizzle(pool, { schema: { users, progress } });

// Database initialization
async function initDatabase() {
  try {
    await pool.query('SELECT 1 as test');
    console.log("✅ Database connection successful");
    
    // Create tables with extended_progress field
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        telegram_id BIGINT UNIQUE NOT NULL,
        username TEXT,
        first_name TEXT,
        last_name TEXT,
        phone_number TEXT,
        email TEXT,
        joined_at TIMESTAMP DEFAULT NOW(),
        is_paid BOOLEAN DEFAULT FALSE,
        payment_date TIMESTAMP,
        transaction_id TEXT,
        is_vip BOOLEAN DEFAULT FALSE,
        tier TEXT DEFAULT 'free',
        tier_price INTEGER DEFAULT 0,
        last_active TIMESTAMP DEFAULT NOW(),
        timezone TEXT DEFAULT 'Asia/Phnom_Penh',
        testimonials JSONB,
        testimonial_requests JSONB,
        upsell_attempts JSONB,
        conversion_history JSONB,
        extended_progress JSONB
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS progress (
        id SERIAL PRIMARY KEY,
        user_id BIGINT UNIQUE NOT NULL,
        current_day INTEGER DEFAULT 0,
        ready_for_day_1 BOOLEAN DEFAULT FALSE,
        day_0_completed BOOLEAN DEFAULT FALSE,
        day_1_completed BOOLEAN DEFAULT FALSE,
        day_2_completed BOOLEAN DEFAULT FALSE,
        day_3_completed BOOLEAN DEFAULT FALSE,
        day_4_completed BOOLEAN DEFAULT FALSE,
        day_5_completed BOOLEAN DEFAULT FALSE,
        day_6_completed BOOLEAN DEFAULT FALSE,
        day_7_completed BOOLEAN DEFAULT FALSE,
        program_completed BOOLEAN DEFAULT FALSE,
        program_completed_at TIMESTAMP,
        responses JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Add extended_progress column if it doesn't exist
    try {
      await pool.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS extended_progress JSONB
      `);
    } catch (error) {
      // Column might already exist, that's fine
    }
    
    console.log("✅ Database tables verified/created");
  } catch (error) {
    console.error("❌ Database initialization failed:", error.message);
  }
}

// MODULE LOADER with fallback
function safeRequire(modulePath, moduleName) {
  try {
    const module = require(modulePath);
    console.log(`✅ ${moduleName} loaded successfully`);
    return module;
  } catch (error) {
    console.log(`⚠️ ${moduleName} not found, using fallback`);
    return null;
  }
}

// LOAD ALL MODULES FROM YOUR PROJECT
console.log("📦 Loading all command modules...");

// ALL COMMAND MODULES
const startCommand = safeRequire("./commands/start", "Start Command");
const dailyCommands = safeRequire("./commands/daily", "Daily Commands");
const paymentCommands = safeRequire("./commands/payment", "Payment Commands");
const vipCommands = safeRequire("./commands/vip", "VIP Commands");
const adminCommands = safeRequire("./commands/admin", "Admin Commands");
const badgesCommands = safeRequire("./commands/badges", "Badges Commands");
const quotesCommands = safeRequire("./commands/quotes", "Quotes Commands");
const bookingCommands = safeRequire("./commands/booking", "Booking Commands");
const financialQuiz = safeRequire("./commands/financial-quiz", "Financial Quiz");
const freeTools = safeRequire("./commands/free-tools", "Free Tools");
const previewCommands = safeRequire("./commands/preview", "Preview Commands");
const marketingCommands = safeRequire("./commands/marketing", "Marketing Commands");
const marketingContent = safeRequire("./commands/marketing-content", "Marketing Content");
const extendedContent = safeRequire("./commands/extended-content", "Extended Content");
const thirtyDayAdmin = safeRequire("./commands/30day-admin", "30 Day Admin");
const toolsTemplates = safeRequire("./commands/tools-templates", "Tools Templates");
const progressTracker = safeRequire("./commands/progress-tracker", "Progress Tracker");
const tierFeatures = safeRequire("./commands/tier-features", "Tier Features");
const adminConversion = safeRequire("./commands/admin-conversion", "Admin Conversion");
const adminDatabase = safeRequire("./commands/admin-database", "Admin Database");
const adminPerformance = safeRequire("./commands/admin-performance", "Admin Performance");
const adminTestimonials = safeRequire("./commands/admin-testimonials", "Admin Testimonials");
const AICommandHandler = safeRequire("./commands/ai-command-handler", "AI Command Handler");

console.log("📦 Loading all service modules...");

// ALL SERVICE MODULES
const scheduler = safeRequire("./services/scheduler", "Scheduler");
const analytics = safeRequire("./services/analytics", "Analytics");
const celebrations = safeRequire("./services/celebrations", "Celebrations");
const accessControl = safeRequire("./services/access-control", "Access Control");
const progressBadges = safeRequire("./services/progress-badges", "Progress Badges");
const emojiReactions = safeRequire("./services/emoji-reactions", "Emoji Reactions");
const contentScheduler = safeRequire("./services/content-scheduler", "Content Scheduler");
const conversionOptimizer = safeRequire("./services/conversion-optimizer", "Conversion Optimizer");
const databaseConnectionPool = safeRequire("./services/database-connection-pool", "Database Connection Pool");
const databaseIndexing = safeRequire("./services/database-indexing", "Database Indexing");
const databaseOptimizer = safeRequire("./services/database-optimizer", "Database Optimizer");
const databasePerformanceMonitor = safeRequire("./services/database-performance-monitor", "Database Performance Monitor");
const marketingAutomation = safeRequire("./services/marketing-automation", "Marketing Automation");
const messageQueue = safeRequire("./services/message-queue", "Message Queue");
const performanceMonitor = safeRequire("./services/performance-monitor", "Performance Monitor");
const responseCache = safeRequire("./services/response-cache", "Response Cache");
const revenueOptimizer = safeRequire("./services/revenue-optimizer", "Revenue Optimizer");
const salesFunnel = safeRequire("./services/sales-funnel", "Sales Funnel");
const smartAutomation = safeRequire("./services/smart-automation", "Smart Automation");
const smartInteractionManager = safeRequire("./services/smart-interaction-manager", "Smart Interaction Manager");
const testimonialCollector = safeRequire("./services/testimonial-collector", "Testimonial Collector");
const tierManager = safeRequire("./services/tier-manager", "Tier Manager");
const upsellAutomation = safeRequire("./services/upsell-automation", "Upsell Automation");
const botHealthMonitor = safeRequire("./services/bot-health-monitor", "Bot Health Monitor");
const khmerQuotes = safeRequire("./services/khmer-quotes", "Khmer Quotes");
const aiIntegration = safeRequire("./services/aiIntegration", "AI Integration");

console.log("📦 Loading utility modules...");

// UTILITY MODULES
const aiHelper = safeRequire("./utils/aiHelper", "AI Helper");
const messageSplitter = safeRequire("./utils/message-splitter", "Message Splitter");

console.log("📦 Loading model modules...");

// MODEL MODULES
const User = safeRequire("./models/User", "User Model");
const Progress = safeRequire("./models/Progress", "Progress Model");

console.log("📦 Loading config modules...");

// CONFIG MODULES
const aiConfig = safeRequire("./config/ai-config", "AI Config");

// Initialize bot
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });
const app = express();

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Message deduplication
const processedMessages = new Set();
function isDuplicateMessage(msg) {
  const messageId = `${msg.chat.id}-${msg.message_id}`;
  if (processedMessages.has(messageId)) return true;
  processedMessages.add(messageId);
  if (processedMessages.size > 200) {
    processedMessages.clear();
  }
  return false;
}

// Database context for all modules
const dbContext = { db, users, progress, eq, pool };

// Initialize AI Command Handler with database context
let aiHandler = null;
if (AICommandHandler) {
  try {
    aiHandler = new AICommandHandler(dbContext);
    console.log("✅ AI Command Handler initialized with database context");
  } catch (error) {
    console.log("⚠️ AI Command Handler initialization failed:", error.message);
  }
}

console.log("🔌 Setting up command routing...");

// ROUTE ALL COMMANDS TO MODULES OR FALLBACKS

// Route /start command
bot.onText(/\/start/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    if (startCommand && startCommand.handle) {
      await startCommand.handle(msg, bot, dbContext);
    } else {
      // Fallback start command
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

💬 ជំនួយ: @Chendasum
👉 /pricing ដើម្បីមើលតម្លៃ`;
      await bot.sendMessage(msg.chat.id, welcomeMessage);
    }
  } catch (error) {
    console.error("Error in /start:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
  }
});

// Route /day commands
bot.onText(/\/day([1-7])/i, async (msg, match) => {
  if (isDuplicateMessage(msg)) return;
  try {
    if (dailyCommands && dailyCommands.handle) {
      await dailyCommands.handle(msg, match, bot, dbContext);
    } else {
      await bot.sendMessage(msg.chat.id, `📚 ថ្ងៃទី ${match[1]} - មាតិកានឹងមកដល់ឆាប់ៗ\n\n📞 ទាក់ទង @Chendasum សម្រាប់មាតិកា។`);
    }
  } catch (error) {
    console.error("Error in /day:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
  }
});

// Route /pricing command
bot.onText(/\/pricing/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    if (paymentCommands && paymentCommands.pricing) {
      await paymentCommands.pricing(msg, bot, dbContext);
    } else {
      const pricingMessage = `💰 តម្លៃកម្មវិធី 7-Day Money Flow Reset™

🎯 កម្មវិធីសាមញ្ញ (Essential Program)
💵 តម្លៃ: $24 USD

💎 វិធីទូទាត់:
• ABA Bank: 000 194 742
• ACLEDA Bank: 092 798 169  
• Wing: 102 534 677
• ឈ្មោះ: SUM CHENDA

💬 ជំនួយ: @Chendasum`;
      await bot.sendMessage(msg.chat.id, pricingMessage);
    }
  } catch (error) {
    console.error("Error in /pricing:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
  }
});

// Route /payment command
bot.onText(/\/payment/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    if (paymentCommands && paymentCommands.instructions) {
      await paymentCommands.instructions(msg, bot, dbContext);
    } else {
      const paymentMessage = `💳 ការណែនាំទូទាត់

🏦 ABA Bank: 000 194 742
📱 Wing: 102 534 677
🏦 ACLEDA Bank: 092 798 169
• ឈ្មោះ: SUM CHENDA
• ចំនួន: $24 USD

💬 ជំនួយ: @Chendasum`;
      await bot.sendMessage(msg.chat.id, paymentMessage);
    }
  } catch (error) {
    console.error("Error in /payment:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
  }
});

// Route /help command
bot.onText(/\/help/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    if (accessControl && accessControl.getTierSpecificHelp) {
      await accessControl.getTierSpecificHelp(msg, bot, dbContext);
    } else {
      const helpMessage = `📱 ជំនួយ (Help):

🌟 7-Day Money Flow Reset™ 

📱 ពាក្យបញ្ជាសំខាន់:
- /start - ចាប់ផ្តើម
- /pricing - មើលតម្លៃ
- /payment - ការទូទាត់
- /help - ជំនួយ
- /ai_help - ជំនួយ AI

🤖 AI Commands:
- /ask [សំណួរ] - សួរ AI
- /analyze - វិភាគហិរញ្ញវត្ថុ
- /coach - ការណែនាំផ្ទាល់ខ្លួន
- /find_leaks - រកមើល Money Leaks

💬 ជំនួយ: @Chendasum`;
      await bot.sendMessage(msg.chat.id, helpMessage);
    }
  } catch (error) {
    console.error("Error in /help:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
  }
});

// Route VIP commands
bot.onText(/\/vip/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    if (vipCommands && vipCommands.info) {
      await vipCommands.info(msg, bot, dbContext);
    } else {
      await bot.sendMessage(msg.chat.id, "👑 VIP Program - ព័ត៌មានកំពុងត្រូវបានអភិវឌ្ឍ។ ទាក់ទង @Chendasum");
    }
  } catch (error) {
    console.error("Error in /vip:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
  }
});

// Route admin commands
bot.onText(/\/admin_users/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    if (adminCommands && adminCommands.showUsers) {
      await adminCommands.showUsers(msg, bot, dbContext);
    } else {
      await bot.sendMessage(msg.chat.id, "👨‍💼 Admin users - កំពុងត្រូវបានអភិវឌ្ឍ។");
    }
  } catch (error) {
    console.error("Error in /admin_users:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
  }
});

bot.onText(/\/admin_analytics/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    if (adminCommands && adminCommands.showAnalytics) {
      await adminCommands.showAnalytics(msg, bot, dbContext);
    } else {
      await bot.sendMessage(msg.chat.id, "📊 Admin analytics - កំពុងត្រូវបានអភិវឌ្ឍ។");
    }
  } catch (error) {
    console.error("Error in /admin_analytics:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
  }
});

// Route badges and progress
bot.onText(/\/badges/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    if (badgesCommands && badgesCommands.showBadges) {
      await badgesCommands.showBadges(msg, bot, dbContext);
    } else {
      await bot.sendMessage(msg.chat.id, "🏆 Badges - កំពុងត្រូវបានអភិវឌ្ឍ។");
    }
  } catch (error) {
    console.error("Error in /badges:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
  }
});

bot.onText(/\/progress/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    if (badgesCommands && badgesCommands.showProgress) {
      await badgesCommands.showProgress(msg, bot, dbContext);
    } else {
      await bot.sendMessage(msg.chat.id, "📈 Progress - កំពុងត្រូវបានអភិវឌ្ឍ។");
    }
  } catch (error) {
    console.error("Error in /progress:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
  }
});

// Route quotes
bot.onText(/\/quote/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    if (quotesCommands && quotesCommands.dailyQuote) {
      await quotesCommands.dailyQuote(msg, bot, dbContext);
    } else {
      await bot.sendMessage(msg.chat.id, "📜 Quote - កំពុងត្រូវបានអភិវឌ្ឍ។");
    }
  } catch (error) {
    console.error("Error in /quote:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
  }
});

// Route free tools
bot.onText(/\/financial_quiz/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    if (financialQuiz && financialQuiz.startQuiz) {
      await financialQuiz.startQuiz(msg, bot, dbContext);
    } else {
      await bot.sendMessage(msg.chat.id, "📊 Financial Quiz - កំពុងត្រូវបានអភិវឌ្ឍ។");
    }
  } catch (error) {
    console.error("Error in /financial_quiz:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
  }
});

// Route /faq command
bot.onText(/\/faq|FAQ|faq/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    if (accessControl && accessControl.getFAQ) {
      await accessControl.getFAQ(msg, bot, dbContext);
    } else {
      // Fallback FAQ
      const faqMessage = `❓ សំណួរញឹកញាប់ (FAQ)

📱 ពាក្យបញ្ជាសំខាន់:
• /start - ចាប់ផ្តើម
• /pricing - មើលតម្លៃ
• /payment - ការទូទាត់
• /help - ជំនួយ
• /faq - សំណួរញឹកញាប់

💰 អំពីតម្លៃ:
• តម្លៃ: $24 USD (Essential)
• ទូទាត់តាម: ABA, ACLEDA, Wing
• បញ្ជាក់ការទូទាត់: 1-2 ម៉ោង

📚 អំពីកម្មវិធី:
• រយៈពេល: 7 ថ្ងៃ
• ភាសា: ខ្មែរ 100%
• ចំណាយពេល: 15-20 នាទី/ថ្ងៃ

🔧 បច្ចេកទេស:
• ប្រើ: Telegram app
• ទិន្នន័យ: រក្សាទុកសុវត្ថិភាព
• ជំនួយ: 24/7

💬 ជំនួយ: @Chendasum`;
      await bot.sendMessage(msg.chat.id, faqMessage);
    }
  } catch (error) {
    console.error("Error in /faq:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
  }
});

// Route extended content
bot.onText(/\/extended(\d+)/i, async (msg, match) => {
  if (isDuplicateMessage(msg)) return;
  try {
    if (extendedContent && extendedContent.handleExtendedDay) {
      await extendedContent.handleExtendedDay(msg, bot, parseInt(match[1]));
    } else {
      await bot.sendMessage(msg.chat.id, `📚 Extended Day ${match[1]} - កំពុងត្រូវបានអភិវឌ្ឍ។`);
    }
  } catch (error) {
    console.error("Error in /extended:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
  }
});

// AI COMMAND ROUTES - Updated to use the new AI handler
bot.onText(/\/ask\s+(.+)/i, async (msg, match) => {
  if (isDuplicateMessage(msg)) return;
  try {
    if (aiHandler) {
      await aiHandler.handleAskCommand(bot, msg);
    } else {
      // Fallback AI response
      const question = match[1];
      const response = `🤖 Claude AI ជំនួយ:

សំណួរ: "${question}"

💡 ការឆ្លើយតប: Claude AI កំពុងត្រូវបានកែលម្អ។ សូមទាក់ទង @Chendasum សម្រាប់ជំនួយផ្ទាល់។

🎯 អ្នកអាចសួរអំពី:
• ការគ្រប់គ្រងលុយ
• ការសន្សំ
• ការវិនិយោគ
• បញ្ហាហិរញ្ញវត្ថុ

💬 ជំនួយ: @Chendasum`;
      await bot.sendMessage(msg.chat.id, response);
    }
  } catch (error) {
    console.error("Error in /ask:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
  }
});

bot.onText(/\/analyze/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    if (aiHandler) {
      await aiHandler.handleAnalyzeCommand(bot, msg);
    } else {
      await bot.sendMessage(msg.chat.id, "📊 Financial Analysis - កំពុងត្រូវបានអភិវឌ្ឍ។ ទាក់ទង @Chendasum");
    }
  } catch (error) {
    console.error("Error in /analyze:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
  }
});

bot.onText(/\/coach/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    if (aiHandler) {
      await aiHandler.handleCoachCommand(bot, msg);
    } else {
      const coachMessage = `🎯 AI Coach - ការណែនាំផ្ទាល់ខ្លួន

💪 សូមស្វាគមន៍មកកាន់ AI Coach!

📊 បច្ចុប្បន្ន AI Coach កំពុងត្រូវបានអភិវឌ្ឍ។

🎯 អ្នកអាចប្រើ:
• /ask [សំណួរ] - សួរ Claude AI
• /help - ជំនួយទូទៅ
• @Chendasum - ការប្រឹក្សាផ្ទាល់

💡 ឧទាហរណ៍: /ask តើខ្ញុំគួរសន្សំយ៉ាងណា?

💬 ជំនួយ: @Chendasum`;
      await bot.sendMessage(msg.chat.id, coachMessage);
    }
  } catch (error) {
    console.error("Error in /coach:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
  }
});

bot.onText(/\/find_leaks/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    if (aiHandler) {
      await aiHandler.handleFindLeaksCommand(bot, msg);
    } else {
      await bot.sendMessage(msg.chat.id, "🔍 Money Leak Detection - កំពុងត្រូវបានអភិវឌ្ឍ។ ទាក់ទង @Chendasum");
    }
  } catch (error) {
    console.error("Error in /find_leaks:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
  }
});

bot.onText(/\/ai_help/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    if (aiHandler) {
      await aiHandler.handleAIHelpCommand(bot, msg);
    } else {
      const helpMessage = `🤖 Claude AI ជំនួយ

🎯 ពាក្យបញ្ជា AI:
• /ask [សំណួរ] - សួរ Claude AI អ្វីក៏បាន
• /analyze - វិភាគហិរញ្ញវត្ថុ
• /coach - ការណែនាំផ្ទាល់ខ្លួន
• /find_leaks - រកមើល Money Leaks
• /ai_help - មើលមេនុនេះ

💡 ឧទាហរណ៍សំណួរ:
• /ask តើខ្ញុំគួរសន្សំយ៉ាងណា?
• /ask ចំណាយអ្វីខ្លះដែលអាចកាត់បន្ថយ?
• /ask តើធ្វើយ៉ាងណាដើម្បីបង្កើនចំណូល?

🔮 Claude AI ពិសេសបំផុត:
• ឆ្លាតវៃ និងយល់ពីបរិបទ
• ការវិភាគហិរញ្ញវត្ថុផ្ទាល់ខ្លួន
• ការណែនាំតាមស្ថានការណ៍ពិត
• ជំនួយជាភាសាខ្មែរពេញលេញ

🚀 ចាប់ផ្តើម: /ask តើខ្ញុំអាចសន្សំបានយ៉ាងណា?

💬 ជំនួយ: @Chendasum`;
      await bot.sendMessage(msg.chat.id, helpMessage);
    }
  } catch (error) {
    console.error("Error in /ai_help:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
  }
});

// Route text message handling to appropriate modules
bot.on("message", async (msg) => {
  if (!msg.text || msg.text.startsWith('/')) return;
  
  const text = msg.text.toUpperCase().trim();
  
  try {
    // Route completion messages to daily commands
    if (text.match(/^DAY\s*\d+\s*COMPLETE$/)) {
      if (dailyCommands && dailyCommands.handleCompletion) {
        await dailyCommands.handleCompletion(msg, bot, dbContext);
      }
      return;
    }
    
    // Route VIP applications
    if (text === "VIP APPLY") {
      if (vipCommands && vipCommands.apply) {
        await vipCommands.apply(msg, bot, dbContext);
      }
      return;
    }
    
    // Route program completion
    if (text === "PROGRAM COMPLETE") {
      if (dailyCommands && dailyCommands.handleProgramComplete) {
        await dailyCommands.handleProgramComplete(msg, bot, dbContext);
      }
      return;
    }
    
    // Route ready for day 1
    if (text.includes("READY FOR DAY 1") || text === "READY") {
      if (dailyCommands && dailyCommands.handleReadyForDay1) {
        await dailyCommands.handleReadyForDay1(msg, bot, dbContext);
      }
      return;
    }
    
  } catch (error) {
    console.error("Error in message handler:", error);
  }
});

// Express routes for health checks
app.get("/", (req, res) => {
  const loadedModules = [
    startCommand ? 'start' : null,
    dailyCommands ? 'daily' : null,
    paymentCommands ? 'payment' : null,
    vipCommands ? 'vip' : null,
    adminCommands ? 'admin' : null,
    badgesCommands ? 'badges' : null,
    quotesCommands ? 'quotes' : null,
    bookingCommands ? 'booking' : null,
    financialQuiz ? 'financial-quiz' : null,
    freeTools ? 'free-tools' : null,
    previewCommands ? 'preview' : null,
    extendedContent ? 'extended-content' : null,
    aiHandler ? 'ai-handler' : null,
    scheduler ? 'scheduler' : null,
    analytics ? 'analytics' : null,
    celebrations ? 'celebrations' : null,
    accessControl ? 'access-control' : null,
  ].filter(Boolean);

  res.json({
    status: "7-Day Money Flow Bot - Complete Orchestrator with AI",
    version: "3.1-ai-integrated",
    mode: "All modules routing with AI support",
    modules_loaded: loadedModules.length,
    loaded_modules: loadedModules,
    ai_status: aiHandler ? "active" : "fallback",
    architecture: "Complete orchestrator with AI integration and fallbacks"
  });
});

app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy",
    database: "connected",
    bot: "active",
    modules: "loaded",
    ai: aiHandler ? "active" : "fallback"
  });
});

// Webhook endpoint
app.post(`/bot${process.env.BOT_TOKEN}`, async (req, res) => {
  try {
    await bot.processUpdate(req.body);
    res.sendStatus(200);
  } catch (error) {
    console.error("Webhook error:", error.message);
    res.sendStatus(500);
  }
});

// Initialize scheduler if available
if (scheduler && scheduler.sendDailyMessages) {
  cron.schedule("0 9 * * *", async () => {
    console.log("🕘 Sending daily messages...");
    try {
      await scheduler.sendDailyMessages(bot);
    } catch (error) {
      console.error("Error sending daily messages:", error);
    }
  });
  console.log("✅ Daily messages cron job scheduled");
}

// Initialize content scheduler if available
if (contentScheduler) {
  try {
    const contentSchedulerInstance = new contentScheduler(bot);
    contentSchedulerInstance.start();
    console.log("✅ Content scheduler started");
  } catch (error) {
    console.log("⚠️ Content scheduler not started:", error.message);
  }
}

// Initialize and start server
async function startServer() {
  await initDatabase();
  
  // Set webhook
  const webhookUrl = `https://money7daysreset-production.up.railway.app/bot${process.env.BOT_TOKEN}`;
  await bot.setWebHook(webhookUrl);
  console.log("✅ Webhook configured");
  
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Complete orchestrator with AI running on port ${PORT}`);
    console.log("📁 All modules loaded with fallback system");
    console.log("🔌 Commands routed to external modules or fallbacks");
    console.log(`🤖 AI Integration: ${aiHandler ? 'Active' : 'Fallback Mode'}`);
  });
}

startServer();
