require("dotenv").config();
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

console.log("🚀 Starting 7-Day Money Flow Bot - Orchestrator Mode");
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
    
    // Create tables
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
        conversion_history JSONB
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
    
    console.log("✅ Database tables verified/created");
  } catch (error) {
    console.error("❌ Database initialization failed:", error.message);
  }
}

// MODULE LOADER - Strict mode (no fallbacks)
function loadModule(modulePath, moduleName) {
  try {
    const module = require(modulePath);
    console.log(`✅ ${moduleName} loaded successfully`);
    return module;
  } catch (error) {
    console.error(`❌ ${moduleName} failed to load:`, error.message);
    throw new Error(`Required module ${moduleName} not found`);
  }
}

// LOAD ALL MODULES (No fallbacks - everything must exist)
const modules = {
  // Commands
  startCommand: loadModule("./commands/start", "Start Command"),
  dailyCommands: loadModule("./commands/daily", "Daily Commands"),
  paymentCommands: loadModule("./commands/payment", "Payment Commands"),
  vipCommands: loadModule("./commands/vip", "VIP Commands"),
  adminCommands: loadModule("./commands/admin", "Admin Commands"),
  badgesCommands: loadModule("./commands/badges", "Badges Commands"),
  quotesCommands: loadModule("./commands/quotes", "Quotes Commands"),
  bookingCommands: loadModule("./commands/booking", "Booking Commands"),
  financialQuiz: loadModule("./commands/financial-quiz", "Financial Quiz"),
  freeTools: loadModule("./commands/free-tools", "Free Tools"),
  previewCommands: loadModule("./commands/preview", "Preview Commands"),
  
  // Services
  scheduler: loadModule("./services/scheduler", "Scheduler"),
  analytics: loadModule("./services/analytics", "Analytics"),
  celebrations: loadModule("./services/celebrations", "Celebrations"),
  accessControl: loadModule("./services/access-control", "Access Control"),
  
  // Utils
  messageSplitter: loadModule("./utils/message-splitter", "Message Splitter"),
};

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

// PURE ROUTING - No command logic in index.js
console.log("🔌 Setting up command routing...");

// Route /start command
bot.onText(/\/start/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  await modules.startCommand.handle(msg, bot, { db, users, progress, eq });
});

// Route /day commands
bot.onText(/\/day([1-7])/i, async (msg, match) => {
  if (isDuplicateMessage(msg)) return;
  await modules.dailyCommands.handle(msg, match, bot, { db, users, progress, eq });
});

// Route /pricing command
bot.onText(/\/pricing/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  await modules.paymentCommands.pricing(msg, bot, { db, users, progress, eq });
});

// Route /payment command
bot.onText(/\/payment/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  await modules.paymentCommands.instructions(msg, bot, { db, users, progress, eq });
});

// Route /help command
bot.onText(/\/help/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  await modules.accessControl.getTierSpecificHelp(msg, bot, { db, users, progress, eq });
});

// Route VIP commands
bot.onText(/\/vip/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  await modules.vipCommands.info(msg, bot, { db, users, progress, eq });
});

// Route admin commands
bot.onText(/\/admin_users/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  await modules.adminCommands.showUsers(msg, bot, { db, users, progress, eq });
});

bot.onText(/\/admin_analytics/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  await modules.adminCommands.showAnalytics(msg, bot, { db, users, progress, eq });
});

// Route badges and progress
bot.onText(/\/badges/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  await modules.badgesCommands.showBadges(msg, bot, { db, users, progress, eq });
});

bot.onText(/\/progress/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  await modules.badgesCommands.showProgress(msg, bot, { db, users, progress, eq });
});

// Route quotes
bot.onText(/\/quote/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  await modules.quotesCommands.dailyQuote(msg, bot, { db, users, progress, eq });
});

// Route free tools
bot.onText(/\/financial_quiz/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  await modules.financialQuiz.startQuiz(msg, bot, { db, users, progress, eq });
});

// Route text message handling to appropriate modules
bot.on("message", async (msg) => {
  if (!msg.text || msg.text.startsWith('/')) return;
  
  const text = msg.text.toUpperCase().trim();
  
  // Route completion messages to daily commands
  if (text.match(/^DAY\s*\d+\s*COMPLETE$/)) {
    await modules.dailyCommands.handleCompletion(msg, bot, { db, users, progress, eq });
    return;
  }
  
  // Route VIP applications
  if (text === "VIP APPLY") {
    await modules.vipCommands.apply(msg, bot, { db, users, progress, eq });
    return;
  }
  
  // Route other text to appropriate handlers
  await modules.accessControl.handleSmartResponse(msg, bot, { db, users, progress, eq });
});

// Express routes for health checks
app.get("/", (req, res) => {
  res.json({
    status: "7-Day Money Flow Bot - Orchestrator Mode",
    version: "3.0-modular",
    mode: "Pure routing to external modules",
    modules_loaded: Object.keys(modules).length,
    architecture: "Clean orchestrator pattern"
  });
});

app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy",
    modules: Object.keys(modules),
    database: "connected",
    bot: "active"
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

// Initialize and start server
async function startServer() {
  await initDatabase();
  
  // Set webhook
  const webhookUrl = `https://money7daysreset-production.up.railway.app/bot${process.env.BOT_TOKEN}`;
  await bot.setWebHook(webhookUrl);
  console.log("✅ Webhook configured");
  
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Orchestrator server running on port ${PORT}`);
    console.log(`📁 Loaded ${Object.keys(modules).length} modules successfully`);
    console.log("🔌 All commands routed to external modules");
  });
}

startServer();
